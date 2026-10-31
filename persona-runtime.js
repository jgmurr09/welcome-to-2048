(function(){
  'use strict';
  let worker=null,state='idle',message='Open conversation uses a bundled browser model.',sequence=0,loadPromise=null,loadResolve=null,loadReject=null,loadTimer=0;
  const pending=new Map();
  function announce(next,text){if(state===next&&message===text)return;state=next;message=text;window.dispatchEvent(new CustomEvent('persona-runtime-status'));}
  function cancel(){worker?.postMessage({type:'clear'});for(const item of pending.values()){clearTimeout(item.timer);item.resolve(null);}pending.clear();}
  function stopWorker(){worker?.terminate();worker=null;clearTimeout(loadTimer);cancel();}
  function fail(error){console.warn('[2048] Conversation model unavailable:',error.message);const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;stopWorker();announce('error','Open conversation is unavailable. Topic buttons still work.');reject?.(error);}
  function load(){
    if(state==='ready')return Promise.resolve();if(loadPromise)return loadPromise;
    if(!/^https?:$/.test(location.protocol)){announce('local','Open the hosted page for full conversation. Topic buttons work here.');return Promise.reject(new Error('Conversation needs the hosted page.'));}
    announce('loading','Loading open conversation…');
    loadPromise=new Promise((resolve,reject)=>{loadResolve=resolve;loadReject=reject;});const result=loadPromise;
    try{
      worker=new Worker(new URL('persona-worker.js',document.baseURI),{type:'module'});
      worker.onmessage=({data})=>{
        if(data.type==='progress')announce('loading',data.message);
        else if(data.type==='ready'){clearTimeout(loadTimer);const resolve=loadResolve;loadResolve=loadReject=null;loadPromise=null;announce('ready','Open conversation is ready. '+(data.backend==='WebGPU'?'Graphics acceleration is on.':'CPU mode can take a little longer.'));resolve?.();}
        else if(data.type==='query-start'){console.info('[2048] Conversation started');window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Composing a reply…'}));}
        else if(data.type==='thinking'){window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Writing a reply…'}));}
        else if(data.type==='result'){const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.resolve(data.text);}console.info('[2048] Conversation completed',JSON.stringify({durationMs:data.durationMs}));}
        else if(data.type==='request-error'){const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.resolve(null);}}
        else if(data.type==='error')fail(new Error(data.message));
      };
      worker.onerror=event=>fail(new Error(event.message||'The conversation worker could not start.'));
      worker.postMessage({type:'load'});loadTimer=setTimeout(()=>fail(new Error('Model startup timed out.')),180000);
    }catch(error){fail(error);}
    return result;
  }
  function generate(context){if(state!=='ready'||!worker)return Promise.resolve(null);const id=++sequence;return new Promise(resolve=>{const timer=setTimeout(()=>{pending.delete(id);worker?.postMessage({type:'clear'});resolve(null);},120000);pending.set(id,{resolve,timer});worker.postMessage({type:'query',id,...context});});}
  function clearSession(){dispose();}
  function dispose(){const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;stopWorker();reject?.(new DOMException('Cancelled','AbortError'));announce('idle','Topic buttons are ready. Load open conversation when you like.');}
  window.FuturePersonaRuntime={load,status:()=>({state,message}),generate,cancel,clearSession,dispose};
})();
