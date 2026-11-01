(function(){
  'use strict';
  let worker=null,state='idle',message='Open conversation uses a bundled browser model.',backend=null,sequence=0,loadPromise=null,loadResolve=null,loadReject=null,loadTimer=0,errorCode=null,errorDetail=null,stage=null;
  let epoch=0,releaseLock=null,cleanup=Promise.resolve(),channel=null;
  const pending=new Map(),lockName='future2048-model:'+new URL('.',document.baseURI).pathname;
  function announce(next,text){if(state===next&&message===text)return;state=next;message=text;window.dispatchEvent(new CustomEvent('persona-runtime-status'));}
  function failure(text,code){const error=new Error(text);error.code=code;return error;}
  function clearPending(error){for(const item of pending.values()){clearTimeout(item.timer);if(error)item.reject(error);else item.resolve(null);}pending.clear();}
  function stopWorker(){
    const current=worker,release=releaseLock;worker=null;releaseLock=null;clearTimeout(loadTimer);clearPending();
    if(!current){release?.();return cleanup;}
    cleanup=new Promise(resolve=>{
      let finished=false,timer;
      const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);current.terminate();release?.();resolve();};
      current.onmessage=({data})=>{if(data.type==='disposed')finish();};current.onerror=finish;current.onmessageerror=finish;
      // Give the runtime time to explicitly close its nested WASM worker first.
      timer=setTimeout(finish,750);try{current.postMessage({type:'dispose'});}catch{finish();}
    });return cleanup;
  }
  function ensureChannel(){
    if(channel||typeof BroadcastChannel!=='function')return;
    try{channel=new BroadcastChannel(lockName);channel.onmessage=({data})=>{
      // Coordination signals only. Character details and chat text never leave this tab.
      if(data?.type==='request-model'&&(document.hidden||!document.getElementById?.('chatDialog')?.open)&&(worker||loadPromise))pause('Open conversation moved to another tab. Load it again here when you return.');
    };}catch{channel=null;}
  }
  async function reserveModel(token){
    await cleanup;if(token!==epoch)throw new DOMException('Cancelled','AbortError');
    ensureChannel();const locks=window.navigator?.locks;if(!locks?.request)return;
    const attempt=()=>new Promise((resolve,reject)=>{
      locks.request(lockName,{ifAvailable:true},lock=>{
        if(!lock||token!==epoch){resolve(false);return;}
        return new Promise(release=>{releaseLock=release;resolve(true);});
      }).catch(reject);
    });
    if(await attempt())return;
    channel?.postMessage({type:'request-model'});
    announce('loading','Another tab is using the conversation model. Checking whether it can release it…');
    await new Promise(resolve=>setTimeout(resolve,1000));
    if(token!==epoch)throw new DOMException('Cancelled','AbortError');
    if(!await attempt())throw failure('Open conversation is already active in another tab of this site. Close its chat or close that tab, then retry here. Topic buttons still work.','another-tab');
  }
  function cancel(){worker?.postMessage({type:'clear'});clearPending();}
  function fail(error){
    epoch++;console.warn('[2048] Conversation model unavailable:',error.message);
    const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;
    clearPending(error);stopWorker();backend=null;
    errorCode=error.code||'runtime-init';errorDetail=String(error.message||'No error detail was returned.').slice(0,400);
    const text=errorCode==='reply-timeout'?'That reply took too long and was stopped. Reload conversation to try again.':errorCode==='load-timeout'?'Conversation startup reached the three-minute limit during '+(stage||'startup')+'. Check the connection, then retry.':errorDetail;
    announce('error',errorCode==='another-tab'?errorDetail:'Open conversation could not start. '+text+' Topic buttons still work.');reject?.(error);
  }
  function load({forceCPU=false}={}){
    if(state==='ready'&&worker)return Promise.resolve();if(loadPromise)return loadPromise;
    if(!/^https?:$/.test(location.protocol)){announce('local','Full conversation needs the hosted page. Topic buttons give prepared replies here.');return Promise.reject(failure('Conversation needs the hosted page.','not-hosted'));}
    if(typeof Worker!=='function'||typeof WebAssembly!=='object'){const error=failure('This browser does not provide the required Worker and WebAssembly features. Try a current desktop browser.','browser-unsupported');fail(error);return Promise.reject(error);}
    errorCode=errorDetail=null;stage='startup';const token=++epoch;
    announce('loading','Loading the conversation model. You can type a question; it will wait until the model is ready.');
    loadPromise=new Promise((resolve,reject)=>{loadResolve=resolve;loadReject=reject;});const result=loadPromise;
    (async()=>{
      try{
        await reserveModel(token);if(token!==epoch)return;
        const current=new Worker(new URL('persona-worker.js?boot=20261101-4',document.baseURI),{type:'module'});worker=current;
        current.onmessage=({data})=>{
          if(current!==worker)return;
          if(data.type==='progress'){stage=data.stage||stage;announce('loading',data.message);}
          else if(data.type==='ready'){
            clearTimeout(loadTimer);const resolve=loadResolve;loadResolve=loadReject=null;loadPromise=null;backend=data.backend;stage='ready';
            announce('ready','Open conversation is ready. '+(backend==='WebGPU'?'Replies may still take a little time.':'Replies can take a minute or two in CPU mode.'));resolve?.();
          }
          else if(data.type==='query-start'&&pending.has(data.id))window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Composing a reply…'}));
          else if(data.type==='thinking'&&pending.has(data.id))window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Writing a reply…'}));
          else if(data.type==='result'){const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.resolve(data.text);console.info('[2048] Conversation completed',JSON.stringify({durationMs:data.durationMs}));}}
          else if(data.type==='request-error'){const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.reject(failure('The conversation model could not finish that reply.','reply-error'));}}
          else if(data.type==='error')fail(failure(data.message||'The conversation model could not start.',data.code||'model-error'));
        };
        current.onerror=event=>{if(current===worker)fail(failure(event.message||'The conversation worker could not start.','worker-error'));};
        current.onmessageerror=()=>{if(current===worker)fail(failure('The conversation worker could not read its reply.','worker-error'));};
        loadTimer=setTimeout(()=>{if(current===worker)fail(failure('Model startup timed out.','load-timeout'));},180000);
        current.postMessage({type:'load',forceCPU});
      }catch(error){if(token===epoch)fail(error);}
    })();return result;
  }
  function generate(context){
    if(state!=='ready'||!worker)return Promise.resolve(null);const id=++sequence;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{if(pending.has(id))fail(failure('The reply exceeded the two-minute limit.','reply-timeout'));},120000);
      pending.set(id,{resolve,reject,timer});try{worker.postMessage({type:'query',id,...context});}catch(error){fail(error);}
    });
  }
  function dispose({text,error}={}){
    epoch++;const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;
    const cancellation=error||new DOMException('Cancelled','AbortError');clearPending(cancellation);stopWorker();backend=null;stage=null;errorCode=errorDetail=null;
    reject?.(cancellation);announce('idle',text||'Open conversation is off. Load it to ask your own questions, or choose a topic for a prepared reply.');
  }
  function pause(text){dispose({text,error:failure(text,'page-paused')});}
  // Reuse the loaded model while visiting other tabs. The existing idle reset, page leave,
  // explicit cancel, and an inactive-tab handoff still release it.
  window.addEventListener?.('pagehide',()=>{pause('Open conversation was released when you left this page. Load it again to continue.');channel?.close();channel=null;});
  window.addEventListener?.('pageshow',event=>{if(event.persisted)pause('This page was restored. Load conversation to reconnect the characters.');ensureChannel();});
  ensureChannel();
  window.FuturePersonaRuntime={load,status:()=>({state,message,backend,errorCode,errorDetail,stage}),generate,cancel,clearSession:()=>dispose(),dispose};
})();
