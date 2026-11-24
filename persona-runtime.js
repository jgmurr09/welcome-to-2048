(function(){
  'use strict';
  let worker=null,state='idle',message='Open conversation uses a bundled browser model.',backend=null,compatibility=false,sequence=0;
  let loadPromise=null,loadResolve=null,loadReject=null,loadTimer=0,graphicsTimer=0,errorCode=null,errorDetail=null,stage=null;
  let epoch=0,releaseLock=null,cleanup=Promise.resolve(),channel=null,warmAssets=null,rebootCPU=null;
  let timings={},startedAt=0;
  const pending=new Map(),lockName='future2048-model:'+new URL('.',document.baseURI).pathname,WAIT_LIMIT_MS=20000;
  function announce(next,text){if(state===next&&message===text)return;state=next;message=text;window.dispatchEvent(new CustomEvent('persona-runtime-status'));}
  function failure(text,code){const error=new Error(text);error.code=code;return error;}
  function clearPending(error){for(const item of pending.values()){clearTimeout(item.timer);if(error)item.reject(error);else item.resolve(null);}pending.clear();}
  function stopWorker({keepLock=false}={}){
    const current=worker,release=keepLock?null:releaseLock;worker=null;if(!keepLock)releaseLock=null;clearTimeout(graphicsTimer);graphicsTimer=0;
    if(!current){release?.();return cleanup;}
    cleanup=new Promise(resolve=>{
      let finished=false,timer;
      const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);current.terminate();release?.();resolve();};
      current.onmessage=({data})=>{if(data.type==='disposed')finish();};current.onerror=finish;current.onmessageerror=finish;
      // Give the runtime time to close its nested WASM worker, then enforce termination.
      timer=setTimeout(finish,750);try{current.postMessage({type:'dispose'});}catch{finish();}
    });return cleanup;
  }
  function ensureChannel(){
    if(channel||typeof BroadcastChannel!=='function')return;
    try{channel=new BroadcastChannel(lockName);channel.onmessage=({data})=>{
      // Coordination signals only. Character details and chat text never leave this tab.
      if(data?.type==='request-model'&&!window.FutureApp?.hasPendingReplies?.()&&document.hidden&&(worker||loadPromise))pause('Open conversation moved to another tab. Load it again here when you return.');
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
    if(!await attempt())throw failure('Open conversation is active in another tab of this site. Let its replies finish, stop conversation there, or close that tab, then retry here. Topic buttons still work.','another-tab');
  }
  function cancel({timedOut=false}={}){if(timedOut&&pending.size){fail(failure('The AI reply reached the 20-second limit.','reply-timeout'));return;}worker?.postMessage({type:'clear'});clearPending();}
  function fail(error){
    epoch++;clearTimeout(loadTimer);rebootCPU=null;console.warn('[2048] Conversation model unavailable:',error.message);
    const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;
    clearPending(error);stopWorker();backend=null;
    errorCode=error.code||'runtime-init';errorDetail=String(error.message||'No error detail was returned.').slice(0,400);
    const text=errorCode==='reply-timeout'?'AI reached the 20-second reply limit and stopped. Prepared replies remain available.':errorCode==='load-timeout'?(warmAssets?'The model files loaded, but AI startup did not finish within 20 seconds. Prepared replies are available immediately.':'AI startup did not finish within 20 seconds. Prepared replies are available immediately.'):errorDetail+' Prepared replies remain available.';
    announce('error',errorCode==='another-tab'?errorDetail:text);reject?.(error);
  }
  function load({forceCPU=false}={}){
    if(window.FutureExperienceConfig?.generativeChatEnabled===false){announce('disabled','AI generation is off for this exhibit. Prepared replies remain available.');return Promise.resolve();}
    if(!window.FutureChatBrowser?.isEdge()){announce('browser-unavailable','AI chat is unavailable in this browser. Open Microsoft Edge to ask questions. Prepared topics are available here.');return Promise.resolve();}
    if(state==='ready'&&worker)return Promise.resolve();if(loadPromise){if(forceCPU)void rebootCPU?.();return loadPromise;}
    if(!/^https?:$/.test(location.protocol)){announce('local','For AI conversation, open this page through a local web server (localhost) or the hosted website. Topic buttons work when opening the HTML file directly.');return Promise.reject(failure('AI conversation needs HTTP or HTTPS, including localhost.','not-hosted'));}
    if(typeof Worker!=='function'||typeof WebAssembly!=='object'){const error=failure('This browser does not provide the required Worker and WebAssembly features. Try a current desktop browser.','browser-unsupported');fail(error);return Promise.reject(error);}
    errorCode=errorDetail=null;stage='startup';backend=null;compatibility=false;timings={};startedAt=performance.now();const token=++epoch;
    let cpuRequested=forceCPU,restarting=false,boot=0;
    announce('loading','AI is getting ready in the background. Questions use prepared content until it is ready.');
    loadPromise=new Promise((resolve,reject)=>{loadResolve=resolve;loadReject=reject;});const result=loadPromise;
    const startWorker=async(cpu)=>{
      const attempt=++boot;await cleanup;if(token!==epoch||attempt!==boot)return;
      const current=new Worker(new URL('persona-worker.js?boot=20261123-3',document.baseURI),{type:'module'});worker=current;
      const armGraphicsFallback=(delay)=>{if(!cpu&&!graphicsTimer)graphicsTimer=setTimeout(()=>{if(current===worker)void rebootCPU?.();},delay);};
      current.onmessage=({data})=>{
        if(current!==worker||token!==epoch)return;
        if(data.type==='assets-ready'){
          warmAssets=data.assets;timings.downloadMs=data.downloadMs??0;
          if(cpuRequested&&!cpu)void rebootCPU?.();
        }else if(data.type==='progress'){
          stage=data.stage||stage;if(data.backend)backend=data.backend;if(typeof data.compatibility==='boolean')compatibility=data.compatibility;
          if(stage==='adapter')armGraphicsFallback(4000);
          else if(stage==='initialize'){
            if(backend!=='WebGPU'){clearTimeout(graphicsTimer);graphicsTimer=0;}
            else if(!cpu&&data.begin){clearTimeout(graphicsTimer);graphicsTimer=0;armGraphicsFallback(8000);}
          }
          announce('loading',data.message);
        }else if(data.type==='retry-cpu')void rebootCPU?.();
        else if(data.type==='ready'){
          clearTimeout(loadTimer);clearTimeout(graphicsTimer);graphicsTimer=0;rebootCPU=null;
          const resolve=loadResolve;loadResolve=loadReject=null;loadPromise=null;backend=data.backend;compatibility=!!data.compatibility;stage='ready';
          timings={...timings,...data.timings,totalMs:Math.round(performance.now()-startedAt)};
          announce('ready','AI model online and available.');
          console.info('[2048] Conversation ready',JSON.stringify({backend,compatibility,timings}));resolve?.();
        }else if(data.type==='query-start'&&pending.has(data.id))window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Composing a reply…'}));
        else if(data.type==='thinking'&&pending.has(data.id))window.dispatchEvent(new CustomEvent('persona-thinking',{detail:'Writing a reply…'}));
        else if(data.type==='result'){const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.resolve(data.text);console.info('[2048] Conversation completed',JSON.stringify({durationMs:data.durationMs}));}}
        else if(data.type==='request-error'){const item=pending.get(data.id);if(item){clearTimeout(item.timer);pending.delete(data.id);item.reject(failure('The conversation model could not finish that reply.','reply-error'));}}
        else if(data.type==='error')fail(failure(data.message||'The conversation model could not start.',data.code||'model-error'));
      };
      current.onerror=event=>{if(current===worker)fail(failure(event.message||'The conversation worker could not start.','worker-error'));};
      current.onmessageerror=()=>{if(current===worker)fail(failure('The conversation worker could not read its reply.','worker-error'));};
      current.postMessage({type:'load',forceCPU:cpu,assets:warmAssets});
    };
    rebootCPU=async()=>{
      if(token!==epoch||restarting)return;cpuRequested=true;
      if(!warmAssets){announce('loading','CPU startup selected. Finishing the model transfer first; no second download is needed.');return;}
      restarting=true;stage='cpu-retry';backend=null;
      announce('loading','Trying CPU startup with the model files already loaded. Prepared replies stay available immediately.');
      try{await stopWorker({keepLock:true});if(token===epoch)await startWorker(true);}catch(error){if(token===epoch)fail(error);}
    };
    loadTimer=setTimeout(()=>{if(token===epoch)fail(failure('AI startup reached the 20-second limit during '+stage+'.','load-timeout'));},WAIT_LIMIT_MS);
    (async()=>{try{await reserveModel(token);if(token===epoch)await startWorker(cpuRequested);}catch(error){if(token===epoch)fail(error);}})();return result;
  }
  function retryCPU(){return load({forceCPU:true});}
  function generate(context,{timeoutMs=WAIT_LIMIT_MS}={}){
    if(state!=='ready'||!worker)return Promise.resolve(null);const id=++sequence;
    return new Promise((resolve,reject)=>{
      const limit=Math.max(1,Math.min(WAIT_LIMIT_MS,timeoutMs));
      const timer=setTimeout(()=>{if(pending.has(id))fail(failure('The reply exceeded its time limit.','reply-timeout'));},limit);
      pending.set(id,{resolve,reject,timer});try{worker.postMessage({type:'query',id,...context});}catch(error){fail(error);}
    });
  }
  function dispose({text,error}={}){
    epoch++;clearTimeout(loadTimer);rebootCPU=null;warmAssets=null;const reject=loadReject;loadResolve=loadReject=null;loadPromise=null;
    const cancellation=error||new DOMException('Cancelled','AbortError');clearPending(cancellation);stopWorker();backend=null;stage=null;errorCode=errorDetail=null;compatibility=false;timings={};
    reject?.(cancellation);announce('idle',text||'Open conversation is off. Load it to ask your own questions, or choose a topic for a prepared reply.');
  }
  function pause(text){dispose({text,error:failure(text,'page-paused')});}
  // Keep one loaded model across site sections and chat windows. Release it on reset,
  // page leave, explicit stop, or a handoff from an inactive tab.
  window.addEventListener?.('pagehide',()=>{pause('Open conversation was released when you left this page. Load it again to continue.');channel?.close();channel=null;});
  window.addEventListener?.('pageshow',event=>{if(event.persisted)pause('This page was restored. Load conversation to reconnect the characters.');ensureChannel();});
  ensureChannel();
  window.FuturePersonaRuntime={load,retryCPU,status:()=>({state,message,backend,compatibility,errorCode,errorDetail,stage,timings:{...timings}}),generate,cancel,clearSession:()=>dispose(),dispose};
})();
