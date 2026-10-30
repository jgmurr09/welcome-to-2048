// The model sees only messages and the corpus passed by this page.
const siteBase=new URL('.',self.location.href),nativeFetch=self.fetch.bind(self);
self.fetch=(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url||String(input),siteBase);
  if(url.origin!==siteBase.origin||!url.pathname.startsWith(siteBase.pathname))throw new Error('Only this site’s bundled assets are available.');
  return nativeFetch(url.href,{...options,credentials:'omit',cache:'no-store',redirect:'error'});
};
let model=null,abort=null,revision=0,queue=Promise.resolve();
const progress=message=>self.postMessage({type:'progress',message});
async function load(){
  progress('Starting the conversation model…');
  const [{Wllama,CacheManager},manifest]=await Promise.all([import('./runtime/wllama/esm/index.js'),fetch('runtime/model-manifest.json').then(r=>{if(!r.ok)throw new Error('Model manifest missing.');return r.json();})]);
  const chunks=[];let loaded=0,lastPercent=-1;
  for(const file of manifest.model.parts){
    const response=await fetch(file.path);if(!response.ok)throw new Error('A bundled model part is missing.');
    const reader=response.body.getReader(),buffers=[];let n=0;
    while(true){const {done,value}=await reader.read();if(done)break;buffers.push(value);n+=value.byteLength;loaded+=value.byteLength;const percent=Math.min(100,Math.round(loaded/manifest.model.size*100));if(percent!==lastPercent){lastPercent=percent;progress('Loading conversation model: '+percent+'%.');}}
    if(n!==file.size)throw new Error('A model part is incomplete.');
    chunks.push(new Blob(buffers));
  }
  const ramOnly={isSupported:()=>true,read:async()=>null,write:async()=>{},getSize:async()=>-1,list:async()=>[],delete:async()=>{}};
  model=new Wllama({default:new URL('runtime/wllama/esm/wasm/wllama.wasm',siteBase).href},{cacheManager:new CacheManager([ramOnly]),allowOffline:false,suppressNativeLog:true,logger:{debug(){},log(){},warn:console.warn,error:console.error}});
  const compatCode=await fetch('runtime/wllama-compat/wasm/wllama.js').then(r=>r.text());
  model.setCompat({wasm:new URL('runtime/wllama-compat/wasm/wllama.wasm',siteBase).href,worker:{code:compatCode}});
  let gpu=false;try{gpu=!!(self.navigator.gpu&&await self.navigator.gpu.requestAdapter());}catch{}
  progress('Getting the characters ready to talk…');
  await model.loadModel([new Blob(chunks)],{n_ctx:2048,n_batch:256,n_ubatch:128,n_threads:1,n_gpu_layers:gpu?999:0,warmup:false,seed:2048,cache_idle_slots:false,n_parallel:1});
  chunks.length=0;self.postMessage({type:'ready',backend:gpu?'WebGPU':'CPU WASM'});
}
async function generate(data,current){
  if(current!==revision)return;
  abort=new AbortController();const started=performance.now();let text='',shortened=false;
  try{
    self.postMessage({type:'query-start',id:data.id});
    await model.createChatCompletion({messages:data.messages,temperature:data.temperature??.45,seed:2048,top_p:.9,top_k:40,penalty_repeat:1.1,max_tokens:65,cache_prompt:true,abortSignal:abort.signal,stream:true,onData:chunk=>{
      if(current!==revision){abort.abort();return;}
      const token=chunk.choices?.[0]?.delta?.content||'';text+=token;
      // Keep raw generation inside this worker until it passes the page’s output check.
      if(token&&text.length<20)self.postMessage({type:'thinking',id:data.id});
      if(text.match(/[.!?](?:\s|$)/g)?.length>=2&&text.length>65){shortened=true;abort.abort();}
    }});
    if(current===revision)self.postMessage({type:'result',id:data.id,text,durationMs:Math.round(performance.now()-started)});
  }catch(error){if(current===revision){if(shortened&&text)self.postMessage({type:'result',id:data.id,text,durationMs:Math.round(performance.now()-started)});else self.postMessage({type:'request-error',id:data.id,message:error.message||'The reply could not finish.'});}}
  finally{abort=null;}
}
self.onmessage=({data})=>{
  if(data.type==='load')load().catch(error=>self.postMessage({type:'error',message:error.message||'The conversation model could not start.'}));
  else if(data.type==='clear'){revision++;abort?.abort();}
  else if(data.type==='query'){const current=revision;queue=queue.then(()=>generate(data,current)).catch(error=>self.postMessage({type:'request-error',id:data.id,message:error.message}));}
};
