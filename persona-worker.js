// The model sees only messages and the corpus passed by this page.
const siteBase=new URL('.',self.location.href),nativeFetch=self.fetch.bind(self);
self.fetch=(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url||String(input),siteBase);
  if(url.origin!==siteBase.origin||!url.pathname.startsWith(siteBase.pathname))throw new Error('Only this site’s bundled assets are available.');
  return nativeFetch(url.href,{...options,credentials:'omit',cache:'no-store',redirect:'error'});
};
let model=null,abort=null,revision=0,queue=Promise.resolve(),stage='startup',booting=false,closing=false;
const progress=(message,next=stage,details={})=>{stage=next;self.postMessage({type:'progress',message,stage,...details});};
const failure=(message,code)=>Object.assign(new Error(message),{code});
async function asset(path){
  let response;try{response=await fetch(path);}catch{throw failure('Could not download '+path+'. Check the connection and retry.','asset-network');}
  if(!response.ok)throw failure('Missing website file: '+path+' (HTTP '+response.status+'). Check the Pages deployment.','asset-missing');
  return response;
}
async function load({forceCPU=false,assets=null}={}){
  if(booting||model?.isModelLoaded())return;booting=true;
  try{
    const downloadStarted=performance.now();
    progress('Checking the conversation files…','checking');
    const [{Wllama,CacheManager},manifestResponse]=await Promise.all([import('./runtime/wllama/esm/index.js'),assets?null:asset('runtime/model-manifest.json')]);
    let manifest=assets?.manifest;try{if(!manifest)manifest=await manifestResponse.json();}catch{throw failure('The model manifest is not valid JSON. Check the Pages deployment.','manifest-invalid');}
    if(!Array.isArray(manifest.model?.parts)||!manifest.model.parts.length)throw failure('The model manifest has no model parts.','manifest-invalid');
    const chunks=[];let loaded=0,lastPercent=-1,lastProgressAt=0;
    if(assets){
      if(!Array.isArray(assets.chunks)||assets.chunks.length!==manifest.model.parts.length||assets.chunks.some((blob,i)=>!(blob instanceof Blob)||blob.size!==manifest.model.parts[i].size))throw failure('The in-memory model files are incomplete. Stop conversation, then load it again.','model-incomplete');
      chunks.push(...assets.chunks);progress('Reusing model files already loaded in this tab.','download');
    }else for(const file of manifest.model.parts){
      const response=await asset(file.path),reader=response.body?.getReader();
      if(!reader)throw failure('The browser could not stream '+file.path+'.','asset-network');
      const buffers=[],sniff=new Uint8Array(160);let size=0,sniffed=0;
      while(true){const {done,value}=await reader.read();if(done)break;
        if(sniffed<sniff.length){const count=Math.min(value.length,sniff.length-sniffed);sniff.set(value.subarray(0,count),sniffed);sniffed+=count;}
        buffers.push(value);size+=value.byteLength;loaded+=value.byteLength;
        const percent=Math.min(100,Math.round(loaded/manifest.model.size*100));
        if(percent!==lastPercent||performance.now()-lastProgressAt>=1000){lastPercent=percent;lastProgressAt=performance.now();progress('Loading AI model files from this site: '+percent+'% ('+Math.round(loaded/1048576)+' / '+Math.round(manifest.model.size/1048576)+' MiB transferred).','download',{loaded,total:manifest.model.size,percent});}
      }
      const prefix=new TextDecoder().decode(sniff.subarray(0,sniffed));
      if(prefix.startsWith('version https://git-lfs.github.com/spec/v1'))throw failure('A Git LFS pointer was published instead of '+file.path+'. Redeploy with LFS files included.','model-pointer');
      if(!chunks.length&&prefix.slice(0,4)!=='GGUF')throw failure('The first model file is not GGUF data. Check the Pages deployment.','model-invalid');
      if(size!==file.size)throw failure(file.path+' is incomplete ('+size+' bytes; expected '+file.size+'). Check the Pages deployment.','model-incomplete');
      chunks.push(new Blob(buffers));
    }
    const ramOnly={isSupported:()=>true,read:async()=>null,write:async()=>{},getSize:async()=>-1,list:async()=>[],delete:async()=>{}};
    const compatCode=assets?.compatCode||await asset('runtime/wllama-compat/wasm/wllama.js').then(r=>r.text());
    const downloadMs=assets?.downloadMs??Math.round(performance.now()-downloadStarted);
    // Blobs are reused in this tab's RAM only. A CPU retry does not fetch the weights again.
    self.postMessage({type:'assets-ready',assets:{manifest,chunks,compatCode,downloadMs},downloadMs});
    const makeModel=()=>{
      const instance=new Wllama({default:new URL('runtime/wllama/esm/wasm/wllama.wasm',siteBase).href},{cacheManager:new CacheManager([ramOnly]),allowOffline:false,suppressNativeLog:true,logger:{debug(){},log(){},warn:console.warn,error:console.error}});
      instance.setCompat({wasm:new URL('runtime/wllama-compat/wasm/wllama.wasm',siteBase).href,worker:{code:compatCode}});return instance;
    };
    model=makeModel();
    let compatibility=!WebAssembly.Suspending;
    try{new WebAssembly.Memory({address:'i64',initial:BigInt(1)});}catch{compatibility=true;}
    progress(forceCPU?'CPU startup selected.':'Checking browser graphics support…','adapter',{compatibility});
    let gpu=false;if(!forceCPU)try{gpu=!!(self.navigator.gpu&&await self.navigator.gpu.requestAdapter());}catch{}
    const attemptStarted=performance.now(),backend=gpu?'WebGPU':'CPU WASM';
    const update=(begin=false)=>progress('Model files loaded. Starting conversation in '+(gpu?'graphics mode':compatibility?'CPU compatibility mode':'CPU mode')+' ('+Math.floor((performance.now()-attemptStarted)/1000)+'s).','initialize',{backend,compatibility,begin});
    update(true);const heartbeat=setInterval(()=>update(),5000);
    const initialize=()=>model.loadModel([new Blob(chunks)],{n_ctx:4096,n_batch:256,n_ubatch:128,n_threads:1,n_gpu_layers:gpu?999:0,warmup:false,seed:2048,cache_idle_slots:false,n_parallel:1});
    try{
      // The page controller restarts a stalled/failed graphics worker in CPU mode.
      // Restarting also contains a hung nested runtime instead of awaiting its exit forever.
      try{await initialize();}catch(error){if(!gpu)throw error;self.postMessage({type:'retry-cpu'});return;}
    }finally{clearInterval(heartbeat);}
    if(!closing)self.postMessage({type:'ready',backend,compatibility,timings:{initializeMs:Math.round(performance.now()-attemptStarted),downloadMs}});
  }finally{booting=false;}
}
async function generate(data,current){
  if(current!==revision)return;
  const world=data.characterId==='world';
  const maxTokens=(world?[300,420]:[40,140,220]).includes(data.maxTokens)?data.maxTokens:(world?300:140);
  abort=new AbortController();const started=performance.now();let text='';
  try{
    self.postMessage({type:'query-start',id:data.id});
    await model.createChatCompletion({messages:data.messages,temperature:data.temperature??.45,seed:2048,top_p:.9,top_k:40,penalty_repeat:1.1,max_tokens:maxTokens,cache_prompt:true,abortSignal:abort.signal,stream:true,onData:chunk=>{
      if(current!==revision){abort.abort();return;}
      const token=chunk.choices?.[0]?.delta?.content||'';text+=token;
      if(token&&text.length<20)self.postMessage({type:'thinking',id:data.id});
    }});
    if(current===revision)self.postMessage({type:'result',id:data.id,text,durationMs:Math.round(performance.now()-started)});
  }catch(error){if(current===revision)self.postMessage({type:'request-error',id:data.id,message:error.message||'The reply could not finish.'});}
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
