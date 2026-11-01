(function(){
  'use strict';
  let worker=null,state='idle',message='Open conversation uses a bundled browser model.',backend=null,sequence=0,loadPromise=null,loadResolve=null,loadReject=null,loadTimer=0;
  const pending=new Map();
  function announce(next,text){if(state===next&&message===text)return;state=next;message=text;window.dispatchEvent(new CustomEvent('persona-runtime-status'));}
  function clearPending(error){for(const item of pending.values()){clearTimeout(item.timer);if(error)item.reject(error);else item.resolve(null);}pending.clear();}
  function cancel(){const active=pending.size>0;worker?.postMessage({type:'clear'});clearPending();if(active){stopWorker();backend=null;announce('idle','The previous reply was stopped. Load conversation to ask another question, or choose a topic for a prepared reply.');}}
  function stopWorker(){const current=worker;worker=null;current?.terminate();clearTimeout(loadTimer);clearPending();}
  function failure(text,code){const error=new Error(text);error.code=code;return error;}
  function fail(error){
    console.warn('[2048] Conversation model unavailable:',error.message);
    const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;
    clearPending(error);stopWorker();backend=null;
    announce('error',error.code==='reply-timeout'?'That reply took too long and was stopped. Reload conversation to try again. Topic buttons still work.':'Open conversation is unavailable. Retry loading it, or choose a topic for a prepared reply.');
    reject?.(error);
  }
  function load(){
    if(state==='ready')return Promise.resolve();if(loadPromise)return loadPromise;
    if(!/^https?:$/.test(location.protocol)){announce('local','Full conversation needs the hosted page. Topic buttons give prepared replies here.');return Promise.reject(failure('Conversation needs the hosted page.','not-hosted'));}
    announce('loading','Loading the conversation model. You can type a question; it will wait until the model is ready.');
    loadPromise=new Promise((resolve,reject)=>{loadResolve=resolve;loadReject=reject;});const result=loadPromise;
    try{
      const current=new Worker(new URL('persona-worker.js',document.baseURI),{type:'module'});worker=current;
      current.onmessage=({data})=>{
        if(current!==worker)return;
        if(data.type==='progress')announce('loading',data.message);
        else if(data.type==='ready'){
          clearTimeout(loadTimer);const resolve=loadResolve;loadResolve=loadReject=null;loadPromise=null;backend=data.backend;
          announce('ready','Open conversation is ready. '+(backend==='WebGPU'?'Replies may still take a little time.':'Replies can take a minute or two in CPU mode.'));
          resolve?.();
        }
        else if(data.type==='query-start'&&pending.has(data.id)){console.info('[2048] Conversation started');window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Composing a reply…'}));}
        else if(data.type==='thinking'&&pending.has(data.id))window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Writing a reply…'}));
        else if(data.type==='result'){
          const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.resolve(data.text);console.info('[2048] Conversation completed',JSON.stringify({durationMs:data.durationMs}));}
        }
        else if(data.type==='request-error'){
          const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.reject(failure('The conversation model could not finish that reply.','reply-error'));}
        }
        else if(data.type==='error')fail(failure(data.message||'The conversation model could not start.','model-error'));
      };
      current.onerror=event=>{if(current===worker)fail(failure(event.message||'The conversation worker could not start.','worker-error'));};
      current.onmessageerror=()=>{if(current===worker)fail(failure('The conversation worker could not read its reply.','worker-error'));};
      loadTimer=setTimeout(()=>fail(failure('Model startup timed out.','load-timeout')),180000);
      current.postMessage({type:'load'});
    }catch(error){fail(error);}
    return result;
  }
  function generate(context){
    if(state!=='ready'||!worker)return Promise.resolve(null);
    const id=++sequence;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{if(pending.has(id))fail(failure('The reply exceeded the two-minute limit.','reply-timeout'));},120000);
      pending.set(id,{resolve,reject,timer});
      try{worker.postMessage({type:'query',id,...context});}catch(error){fail(error);}
    });
  }
  function clearSession(){dispose();}
  function dispose(){
    const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;stopWorker();backend=null;
    reject?.(new DOMException('Cancelled','AbortError'));
    announce('idle','Open conversation is off. Load it to ask your own questions, or choose a topic for a prepared reply.');
  }
  window.FuturePersonaRuntime={load,status:()=>({state,message,backend}),generate,cancel,clearSession,dispose};
})();
