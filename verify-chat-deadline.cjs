// Exercise the page, queue, runtime controller and fallback together on a virtual clock.
'use strict';
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 try{
  Object.defineProperty(w.navigator,'userAgent',{value:'Mozilla/5.0 Edg/130.0'});
  const geometry=require('./verify-layout-fixture.cjs')(w);w.ResizeObserver=class{observe(){}disconnect(){}};
  w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.play=async()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  let now=0,sequence=0,holdLoad=true;const timers=new Map(),requests=[],workers=[];
  w.Date.now=()=>now;
  w.setTimeout=(fn,delay=0)=>{const id=++sequence;timers.set(id,{fn,at:now+delay,interval:0});return id;};w.clearTimeout=id=>timers.delete(id);
  w.setInterval=(fn,delay)=>{const id=++sequence;timers.set(id,{fn,at:now+delay,interval:delay});return id;};w.clearInterval=id=>timers.delete(id);
  const settle=async()=>{for(let i=0;i<3;i++)await new Promise(r=>setImmediate(r));};
  async function advance(ms){const end=now+ms;for(let n=0;;n++){assert.ok(n<500,'Timers must settle');const job=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!job)break;const [id,t]=job;now=t.at;if(t.interval)t.at+=t.interval;else timers.delete(id);t.fn();await settle();}now=end;await settle();}
  w.Worker=class{
   constructor(){workers.push(this);}
   emit(data){this.onmessage?.({data});}
   postMessage(data){
    if(data.type==='load')setImmediate(()=>{if(holdLoad){this.emit({type:'assets-ready',assets:{fixture:true}});this.emit({type:'progress',stage:'initialize',backend:data.forceCPU?'CPU WASM':'WebGPU',begin:true,message:'Starting browser AI'});}else this.emit({type:'ready',backend:'WebGPU'});});
    if(data.type==='query')requests.push({data,reply:text=>this.emit({type:'result',id:data.id,text})});
    if(data.type==='dispose')setImmediate(()=>this.emit({type:'disposed'}));
   }
   terminate(){this.terminated=true;}
  };
  for(const script of d.querySelectorAll('script[data-source]'))w.eval(script.textContent);
  const click=selector=>{const e=d.querySelector(selector);assert.ok(e,selector);e.click();geometry.flush();};
  const send=text=>{d.querySelector('#chatInput').value=text;d.querySelector('#chatForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  const last=()=>d.querySelector('.chat-message:last-child'),assistantCount=()=>d.querySelectorAll('.chat-message.assistant').length;
  click('#skipArrival');await settle();click('.header-tools [data-world-chat]');
  send('How does tracking affect people?');await settle();
  assert.equal(requests.length,0);assert.equal(w.FutureApp.hasPendingReplies(),false);assert.equal(d.querySelector('#chatThinking'),null);assert.match(last().textContent,/FROM THE WORLD TRUTHS/);
  click('[data-chat-switch="leo"]');send("what's you favorite thing to do?");await settle();assert.match(last().textContent,/boat/);assert.match(last().textContent,/PREPARED CHARACTER REPLY/);assert.ok(!w.FutureApp.hasPendingReplies());
  click('[data-chat-switch="ken"]');send('How do you brush your teeth?');await settle();assert.match(last().textContent,/PREPARED CHARACTER REPLY/);assert.doesNotMatch(last().textContent,/IMAGINED CONVERSATION/);click('[data-chat-switch="world"]');
  await advance(20000);assert.equal(w.FuturePersonaRuntime.status().state,'error');assert.ok(workers.every(worker=>worker.terminated));assert.match(w.FuturePersonaRuntime.status().message,/20 seconds/);
  holdLoad=false;const ready=w.FuturePersonaRuntime.load();await settle();await ready;
  send('How does community change with health tracking?');await settle();assert.equal(requests.length,1);assert.ok(w.FutureApp.hasPendingReplies());
  await advance(19999);assert.ok(w.FutureApp.hasPendingReplies());await advance(1);
  assert.ok(!w.FutureApp.hasPendingReplies());assert.match(last().textContent,/20-second limit/);assert.match(last().textContent,/FROM THE WORLD TRUTHS/);assert.ok(last().querySelector('.chat-sources'));
  const count=assistantCount();requests[0].reply('A late reply must not appear.');await settle();assert.equal(assistantCount(),count);assert.doesNotMatch(d.querySelector('#chatMessages').textContent,/A late reply/);
  // A question queued for ten seconds gets only ten more seconds with the model.
  const readyAgain=w.FuturePersonaRuntime.load();await settle();await readyAgain;
  send('How does health tracking affect community?');await settle();const first=requests.at(-1);
  await advance(5000);click('[data-chat-switch="ken"]');const queuedAt=now;send('How does tracking shape your day?');await settle();const before=requests.length;
  await advance(10000);assert.equal(requests.length,before);first.reply('Tracking can support preventative care. Wealth still changes the ability to opt out.');await settle();assert.equal(requests.length,before+1);const second=requests.at(-1);assert.equal(second.data.characterId,'ken');
  await advance(9999);assert.ok(w.FutureApp.hasPendingReplies());await advance(1);assert.equal(now-queuedAt,20000);assert.ok(!w.FutureApp.hasPendingReplies());assert.match(last().textContent,/PREPARED CHARACTER REPLY/);assert.match(last().textContent,/20-second limit/);
  const kenCount=assistantCount();second.reply('A late Ken response.');await settle();assert.equal(assistantCount(),kenCount);
  click('[data-chat-switch="world"]');assert.match(d.querySelector('#chatMessages').textContent,/Tracking can support preventative care/);
  // A cancellation clears its deadline and must not add a second response later.
  const readyForCancel=w.FuturePersonaRuntime.load();await settle();await readyForCancel;send('How does automation affect daily life?');await settle();click('[data-cancel-reply]');const cancelledCount=assistantCount();await advance(20000);assert.equal(assistantCount(),cancelledCount);assert.match(last().textContent,/Question cancelled/);
  // Clearing history cancels this thread, preserves lenses and the warm model,
  // and ignores both a late model result and the old fallback timer.
  const choose=(id,value)=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('change',{bubbles:true}));};
  const workerCount=workers.length;assert.match(d.querySelector('#chatRuntime').textContent,/AI model online and available/);
  assert.equal(d.querySelector('#chatRuntime [data-stop-runtime]'),null);assert.equal(d.querySelector('.chat-ai-disclosure'),null);
  click('[data-clear-chat]');assert.equal(assistantCount(),0);assert.equal(d.querySelectorAll('.chat-message').length,0);assert.equal(d.activeElement.id,'chatInput');
  choose('worldChatTheme','climate');choose('worldChatFocus','supply');send('tell me about this intersection');await settle();const clearedRequest=requests.at(-1);
  assert.match(clearedRequest.data.messages.at(-1).content,/Climate Change/);assert.match(clearedRequest.data.messages.at(-1).content,/Logistics & Supply/);assert.equal(clearedRequest.data.messages.length,2);
  assert.equal(d.querySelector('[data-clear-chat]').disabled,false);
  choose('worldChatTheme','wealth');choose('worldChatFocus','trust');click('[data-clear-chat]');await settle();
  assert.equal(d.querySelectorAll('.chat-message').length,0);assert.equal(d.querySelector('#chatThinking'),null);assert.ok(!w.FutureApp.hasPendingReplies());
  assert.equal(d.querySelector('#worldChatTheme').value,'wealth');assert.equal(d.querySelector('#worldChatFocus').value,'trust');
  clearedRequest.reply('This cancelled reply should never return.');await settle();await advance(20000);
  assert.equal(d.querySelectorAll('.chat-message').length,0);assert.equal(workers.length,workerCount);assert.equal(w.FuturePersonaRuntime.status().state,'ready');
  send('Tell me about this intersection');await settle();const freshRequest=requests.at(-1);
  assert.match(freshRequest.data.messages.at(-1).content,/Wealth Gap/);assert.match(freshRequest.data.messages.at(-1).content,/Security, Trust & Identity/);assert.equal(freshRequest.data.messages.length,2);
  freshRequest.reply('Wealth changes the choice to opt out of monitoring. Less tracking is mainly available to people who can afford it.');await settle();assert.equal(assistantCount(),1);
  click('[data-chat-switch="ken"]');assert.ok(assistantCount()>0);click('[data-clear-chat]');assert.equal(assistantCount(),0);
  click('[data-chat-switch="world"]');assert.equal(assistantCount(),1);
  // A queued thread can be cleared without cancelling another person's reply.
  send('How does privacy affect people?');await settle();const worldStillRunning=requests.at(-1),beforeQueuedClear=requests.length;
  click('[data-chat-switch="ken"]');send('How does tracking shape your day?');await settle();click('[data-clear-chat]');await settle();assert.ok(w.FutureApp.hasPendingReplies());
  worldStillRunning.reply('People use monitoring for preventative care. Wealth affects how easily they can opt out.');await settle();
  assert.equal(requests.length,beforeQueuedClear);assert.equal(d.querySelectorAll('.chat-message').length,0);assert.ok(!w.FutureApp.hasPendingReplies());
  // Lenses are captured on submission, even if edited while the request is queued.
  click('[data-chat-switch="leo"]');send('How does delivery shape your business?');await settle();const leoRunning=requests.at(-1);
  click('[data-chat-switch="world"]');choose('worldChatTheme','climate');choose('worldChatFocus','supply');send('tell me about this intersection');await settle();
  choose('worldChatTheme','wealth');choose('worldChatFocus','trust');leoRunning.reply('I run Leo Trucking with autonomous long-haul trucks and human last-mile drivers.');await settle();
  const queuedIntersection=requests.at(-1);assert.equal(queuedIntersection.data.characterId,'world');assert.match(queuedIntersection.data.messages.at(-1).content,/Climate Change/);assert.match(queuedIntersection.data.messages.at(-1).content,/Logistics & Supply/);
  queuedIntersection.reply('Climate pressure disrupts food supplies. Automated delivery and human last-mile drivers could help communities respond.');await settle();
  assert.equal(d.querySelector('#worldChatTheme').value,'wealth');assert.equal(d.querySelector('#worldChatFocus').value,'trust');assert.equal(workers.length,workerCount);
  // Prepared fallback follows the selections too, and the status stays plain.
  w.FuturePersonaRuntime.dispose();await settle();assert.match(d.querySelector('#chatRuntime').textContent,/AI model offline/);
  choose('worldChatTheme','climate');choose('worldChatFocus','supply');send('tell me about this intersection');await settle();assert.match(last().textContent,/Climate Change × Logistics & Supply/);assert.match(last().textContent,/Autonomous trucks/);
  w.FutureApp.reset();await settle();await advance(20000);assert.equal(d.querySelector('#chatMessages').textContent,'');assert.deepEqual(errors,[]);
  console.log('Passed: 20-second queue/reply deadline; selected-lens requests and prepared fallback; selections captured while queued; clear-current-history cancels active/queued requests and ignores late results while preserving other threads, filters and warm model; plain online/offline status. No real-model performance claim.');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
