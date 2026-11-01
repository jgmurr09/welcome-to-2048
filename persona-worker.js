// The model sees only messages and the corpus passed by this page.
const siteBase=new URL('.',self.location.href),nativeFetch=self.fetch.bind(self);
self.fetch=(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url||String(input),siteBase);
  if(url.origin!==siteBase.origin||!url.pathname.startsWith(siteBase.pathname))throw new Error('Only this site’s bundled assets are available.');
  return nativeFetch(url.href,{...options,credentials:'omit',cache:'no-store',redirect:'error'});
};
let model=null,abort=null,revision=0,queue=Promise.resolve(),stage='startup',booting=false,closing=false;
const progress=(message,next=stage)=>{stage=next;self.postMessage({type:'progress',message,stage});};
const failure=(message,code)=>Object.assign(new Error(message),{code});
const limit=(promise,ms,message,code)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(failure(message,code)),ms))]).finally(()=>clearTimeout(timer));};
async function asset(path){
  let response;try{response=await fetch(path);}catch(error){throw failure('Could not download '+path+'. Check the connection and retry.','asset-network');}
  if(!response.ok)throw failure('Missing website file: '+path+' (HTTP '+response.status+'). Check the latest Pages deployment.','asset-missing');
  return response;
}
function needsCompat(){
  if(!WebAssembly.Suspending)return true;
  try{new WebAssembly.Memory({address:'i64',initial:BigInt(1)});return false;}catch{return true;}
}
async function load({forceCPU=false}={}){
  if(booting||model?.isModelLoaded())return;booting=true;
  try{
    if(typeof WebAssembly!=='object')throw failure('This browser does not provide WebAssembly. Try a current desktop browser.','browser-unsupported');
    progress('Checking the bundled conversation files…','checking');
    const [{Wllama,CacheManager},manifestResponse]=await Promise.all([import('./runtime/wllama/esm/index.js'),asset('runtime/model-manifest.json')]);
    let manifest;try{manifest=await manifestResponse.json();}catch{throw failure('The model manifest is not valid JSON. Check the Pages deployment.','manifest-invalid');}
    if(!Array.isArray(manifest.model?.parts)||!manifest.model.parts.length)throw failure('The model manifest has no model parts.','manifest-invalid');
    const compat=needsCompat(),compatCode=compat?await asset('runtime/wllama-compat/wasm/wllama.js').then(r=>r.text()):null;
    const chunks=new Array(manifest.model.parts.length);let loaded=0,lastPercent=-1,next=0;
    const report=()=>{const percent=Math.min(100,Math.floor(loaded/manifest.model.size*100));if(percent!==lastPercent){lastPercent=percent;progress('Downloading conversation model: '+percent+'% ('+Math.round(loaded/1048576)+' / '+Math.round(manifest.model.size/1048576)+' MiB).','download');}};
    async function part(file,index){
      const response=await asset(file.path),reader=response.body?.getReader();
      if(!reader)throw failure('The browser could not stream '+file.path+'.','asset-network');
      const buffers=[],sniff=new Uint8Array(160);let size=0,sniffed=0,checked=false;
      const checkPrefix=()=>{if(checked)return;checked=true;const prefix=new TextDecoder().decode(sniff.subarray(0,sniffed));if(prefix.startsWith('version https://git-lfs.github.com/spec/v1'))throw failure('A Git LFS pointer was published instead of '+file.path+'. Redeploy with LFS files included.','model-pointer');if(index===0&&prefix.slice(0,4)!=='GGUF')throw failure('The first model file is not GGUF data. Check the Pages deployment.','model-invalid');};
      while(true){const {done,value}=await reader.read();if(done)break;
        if(sniffed<sniff.length){const count=Math.min(value.length,sniff.length-sniffed);sniff.set(value.subarray(0,count),sniffed);sniffed+=count;if(sniffed===sniff.length)checkPrefix();}
        buffers.push(value);size+=value.byteLength;loaded+=value.byteLength;report();
      }
      checkPrefix();
      if(size!==file.size)throw failure(file.path+' is incomplete ('+size+' bytes; expected '+file.size+'). Check the Pages deployment.','model-incomplete');
      chunks[index]=new Blob(buffers);
    }
    // Two bounded downloads avoid six serial transfers without opening external access.
    await Promise.all([0,1].map(async()=>{while(next<manifest.model.parts.length){const index=next++;await part(manifest.model.parts[index],index);}}));
    const weights=new Blob(chunks);chunks.length=0;
    const ramOnly={isSupported:()=>true,read:async()=>null,write:async()=>{},getSize:async()=>-1,list:async()=>[],delete:async()=>{}};
    let gpu=false;
    if(!forceCPU&&!/Firefox\//.test(self.navigator.userAgent||''))try{gpu=!!(self.navigator.gpu&&await limit(self.navigator.gpu.requestAdapter(),3000,'GPU detection timed out.','gpu-timeout'));}catch{}
    const makeModel=()=>{
      const instance=new Wllama({default:new URL('runtime/wllama/esm/wasm/wllama.wasm',siteBase).href},{cacheManager:new CacheManager([ramOnly]),allowOffline:false,suppressNativeLog:true,logger:{debug(){},log(){},warn:console.warn,error:console.error}});
      instance.setCompat({wasm:new URL('runtime/wllama-compat/wasm/wllama.wasm',siteBase).href,worker:compatCode?{code:compatCode}:new URL('runtime/wllama-compat/wasm/wllama.js',siteBase).href},'firefox_safari');return instance;
    };
    async function start(gpu){
      model=makeModel();const started=performance.now(),name=gpu?'WebGPU':compat?'CPU compatibility mode':'CPU mode';
      const update=()=>progress('Model downloaded. Starting '+name+' ('+Math.floor((performance.now()-started)/1000)+'s).'+(gpu?' CPU mode will be tried if GPU startup fails.':' This step can take up to 90 seconds.'),'initialize');
      update();const heartbeat=setInterval(update,5000);
      try{await limit(model.loadModel([weights],{n_ctx:2048,n_batch:gpu?256:128,n_ubatch:gpu?128:64,n_threads:1,n_gpu_layers:gpu?999:0,warmup:false,seed:2048,cache_idle_slots:false,n_parallel:1}),gpu?25000:90000,'The '+name+' did not finish initializing.','runtime-timeout');}
      finally{clearInterval(heartbeat);}
    }
    try{await start(gpu);}catch(error){
      await model?.exit().catch(()=>{});model=null;
      if(!gpu)throw failure(error.message||'The CPU model could not initialize.',error.code||'runtime-init');
      console.warn('[2048] WebGPU startup failed; trying CPU:',error.message);
      progress('GPU startup did not finish. Trying CPU mode with the model already downloaded.','initialize');gpu=false;await start(false);
    }
    self.postMessage({type:'ready',backend:gpu?'WebGPU':compat?'CPU WASM (compatibility)':'CPU WASM'});
  }finally{booting=false;}
}
async function generate(data,current){
  if(current!==revision)return;
  abort=new AbortController();const started=performance.now();let text='',shortened=false;
  try{
    self.postMessage({type:'query-start',id:data.id});
    await model.createChatCompletion({messages:data.messages,temperature:data.temperature??.45,seed:2048,top_p:.9,top_k:40,penalty_repeat:1.1,max_tokens:65,cache_prompt:true,abortSignal:abort.signal,stream:true,onData:chunk=>{
      if(current!==revision){abort.abort();return;}
      const token=chunk.choices?.[0]?.delta?.content||'';text+=token;
      if(token&&text.length<20)self.postMessage({type:'thinking',id:data.id});
      if(text.match(/[.!?](?:\s|$)/g)?.length>=2&&text.length>65){shortened=true;abort.abort();}
    }});
    if(current===revision)self.postMessage({type:'result',id:data.id,text,durationMs:Math.round(performance.now()-started)});
  }catch(error){if(current===revision){if(shortened&&text)self.postMessage({type:'result',id:data.id,text,durationMs:Math.round(performance.now()-started)});else self.postMessage({type:'request-error',id:data.id,message:error.message||'The reply could not finish.'});}}
  finally{abort=null;}
}
async function dispose(){
  closing=true;revision++;abort?.abort();const previous=model;model=null;
  try{await previous?.exit();}catch{}
  self.postMessage({type:'disposed'});self.close();
}
self.onmessage=({data})=>{
  if(data.type==='dispose'){dispose();return;}if(closing)return;
  if(data.type==='load')load(data).catch(error=>{if(!closing)self.postMessage({type:'error',code:error.code||'runtime-init',stage,message:error.message||'The conversation model could not start.'});});
  else if(data.type==='clear'){revision++;abort?.abort();}
  else if(data.type==='query'){const current=revision;queue=queue.then(()=>generate(data,current)).catch(error=>self.postMessage({type:'request-error',id:data.id,message:error.message}));}
};
