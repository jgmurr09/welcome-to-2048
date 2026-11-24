// DOM and URL tests, not a real Edge launch or rendered browser inspection.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom'),read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const window={navigator:{}};
for(const file of ['world-data.js','data.js','connections.js','knowledge.js','chat-browser.js'])vm.runInNewContext(read(file),{window,URL});
const B=window.FutureChatBrowser,clone=value=>JSON.parse(JSON.stringify(value));
const sample={v:1,page:{route:'people',profile:'ken',theme:'climate',setting:'rural',income:'middle',education:'associate',selected:'ken',panel:'person',view:'list',activities:false,technology:'selected'},chat:{id:'ken',theme:'wealth',focus:window.FutureKnowledge.data.focusAreas[0].id},quiz:{phase:'result',index:5,answers:window.FutureQuizData.questions.map(q=>q.options[0].id)},scroll:{main:320,panel:120}};
const base='http://localhost:8000/welcome-to-2048/?kiosk=1#/people/ken',url=B.screenURL(base,sample);
assert.deepEqual(clone(B.parse(url)),clone(sample));assert.match(url,/^http:\/\/localhost:8000\/welcome-to-2048\/\?kiosk=1#\/people\/ken\?handoff=/);
assert.equal(B.edgeURI(url),'microsoft-edge:'+url);
const extras=clone(sample);extras.chat.messages=['TRANSCRIPT_SENTINEL'];extras.chat.draft='DRAFT_SENTINEL';extras.page.untrusted='<script>';extras.secret='SECRET_SENTINEL';
assert.doesNotMatch(B.screenURL(base,extras),/SENTINEL|untrusted|script/);
for(const input of ['javascript:alert(1)','file:///tmp/index.html','data:text/html,hi']){assert.equal(B.screenURL(input,sample),null);assert.equal(B.edgeURI(input),null);}
for(const input of [base,base+'?handoff=%',base+'?handoff='+encodeURIComponent('{'),base+'?handoff='+encodeURIComponent(JSON.stringify({...sample,v:2})),base+'?handoff='+'x'.repeat(20001)])assert.equal(B.parse(input),null);
const invalid=clone(sample);Object.assign(invalid.page,{profile:'<img>',theme:'missing',selected:'missing',panel:'connection',education:'anything'});invalid.scroll.main=-9;invalid.scroll.panel=1e20;invalid.quiz.answers=['bad'];
const cleaned=B.safe(invalid);assert.equal(cleaned.page.panel,'world');assert.equal(cleaned.page.selected,null);assert.equal(cleaned.page.profile,'leo');assert.equal(cleaned.page.theme,'all');assert.equal(cleaned.page.education,'all');assert.equal(cleaned.scroll.main,0);assert.equal(cleaned.scroll.panel,100000);assert.ok(cleaned.quiz.answers.every(x=>x===null));
for(const userAgent of ['Mozilla/5.0 Edg/130.0','Mozilla/5.0 Edge/18.0','Mozilla/5.0 EdgiOS/130.0','Mozilla/5.0 EdgA/130.0'])assert.equal(B.isEdge({userAgent}),true);
assert.equal(B.isEdge({userAgent:'Safari/605.1.15'}),false);assert.equal(B.isEdge({userAgent:'Firefox/140'}),false);assert.equal(B.isEdge({userAgent:'',userAgentData:{brands:[{brand:'Microsoft Edge'}]}}),true);
const settle=async()=>{for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));};
async function fixture({url='http://localhost:8000/welcome-to-2048/',edge=false,userAgent}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('index.html'),{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 const geometry=require('./verify-layout-fixture.cjs')(w);w.ResizeObserver=class{observe(){}disconnect(){}};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.play=async()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 Object.defineProperty(w.navigator,'userAgent',{value:userAgent||(edge?'Mozilla/5.0 Edg/130.0':'Mozilla/5.0 Version/27.0 Safari/605.1.15')});
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(w,key,{get(){throw Error('Unexpected persistent storage: '+key);}});
 const timers=new Map(),queries=[],workers=[];let seq=0,now=0;
 w.Date.now=()=>now;w.setTimeout=(fn,delay=0)=>{const id=++seq;timers.set(id,{fn,delay});return id;};w.clearTimeout=id=>timers.delete(id);w.setInterval=()=>++seq;w.clearInterval=()=>{};
 w.Worker=class{constructor(){workers.push(this);}postMessage(data){if(data.type==='load')setImmediate(()=>this.onmessage?.({data:{type:'ready',backend:'WebGPU'}}));if(data.type==='query'){queries.push(data);setImmediate(()=>this.onmessage?.({data:{type:'result',id:data.id,text:'I love taking the boat out on the Great Lakes. Hiking is another favorite.'}}));}if(data.type==='dispose')setImmediate(()=>this.onmessage?.({data:{type:'disposed'}}));}terminate(){}};
 for(const script of d.querySelectorAll('script[data-source]'))w.eval(script.textContent);
 await settle();geometry.flush();
 return {dom,w,d,errors,queries,workers,timers,click(selector){const el=d.querySelector(selector);assert.ok(el,selector);el.click();geometry.flush();},send(text){d.querySelector('#chatInput').value=text;d.querySelector('#chatForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));},fireReminder(){now+=10800000;const timer=[...timers].find(([,t])=>t.delay===10800000);assert.ok(timer,'The long-session reminder is scheduled');timers.delete(timer[0]);timer[1].fn();geometry.flush();},now:()=>now};
}
(async()=>{
 const f=await fixture();let handoff;
 try{
  const {w,d}=f;f.click('#skipArrival');await settle();
  f.click('[data-route="people"]');f.click('[data-person="ken"]');f.click('[data-chat="ken"]');
  assert.equal(d.querySelector('#chatNoticeDialog'),null);assert.equal(d.querySelectorAll('dialog[open]').length,1);assert.ok(d.querySelector('#chatDialog').open);assert.ok(d.activeElement.matches('#chatChips button'));
  assert.equal(d.querySelector('#edgeFallback').open,false);assert.equal(d.querySelector('#edgeFallback').hidden,true);assert.match(d.querySelector('#openScreenInEdge').href,/^microsoft-edge:http/);assert.equal(d.querySelector('#chatReminder').hidden,true);
  assert.equal(w.FuturePersonaRuntime.status().state,'browser-unavailable');assert.equal(f.workers.length,0);assert.equal(d.querySelector('#chatForm').hidden,true);assert.equal(d.querySelector('#chatInput').disabled,true);assert.equal(d.querySelector('#chatForm button').disabled,true);assert.match(d.querySelector('#chatRuntime').textContent,/AI chat unavailable in this browser/);assert.equal(d.querySelector('#chatRuntime [data-load-runtime]'),null);
  handoff=d.querySelector('#edgeScreenURL').value;assert.equal(B.parse(handoff).page.profile,'ken');assert.equal(B.parse(handoff).chat.id,'ken');
  f.click('[data-copy-screen]');await settle();assert.match(d.querySelector('#edgeCopyStatus').textContent,/Link selected/);assert.ok(d.querySelector('#edgeFallback').open);assert.equal(d.querySelector('#edgeFallback').hidden,false);assert.equal(d.activeElement.id,'edgeScreenURL');
  let copied;Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{async writeText(value){copied=value;}}});d.querySelector('#edgeFallback').open=false;f.click('[data-copy-screen]');await settle();assert.equal(copied,handoff);assert.match(d.querySelector('#edgeCopyStatus').textContent,/Link copied/);assert.equal(d.querySelector('#edgeFallback').open,false);assert.equal(d.querySelectorAll('dialog[open]').length,1);
  const before=d.querySelectorAll('.chat-message').length;f.send('What do you enjoy?');await settle();assert.equal(d.querySelectorAll('.chat-message').length,before);assert.equal(f.queries.length,0);assert.equal(w.FutureApp.hasPendingReplies(),false);
  f.click('#chatChips button');await settle();assert.match(d.querySelector('.chat-message:last-child').textContent,/PREPARED CHARACTER REPLY/);assert.equal(f.queries.length,0);assert.equal(f.workers.length,0);
  f.click('[data-chat-switch="world"]');f.click('#chatChips button');await settle();assert.match(d.querySelector('.chat-message:last-child').textContent,/FROM THE WORLD TRUTHS/);assert.equal(f.workers.length,0);
  f.click('[data-clear-chat]');assert.equal(d.querySelectorAll('.chat-message').length,0);assert.ok(d.activeElement.matches('#chatChips [data-chat-topic]'));assert.equal(f.workers.length,0);f.click('#chatChips [data-chat-topic]');assert.match(d.querySelector('.chat-message:last-child').textContent,/FROM THE WORLD TRUTHS/);
  // The direct app link must refresh its snapshot at click time, without opening a popup.
  d.querySelector('#worldChatTheme').value='climate';d.querySelector('#worldChatTheme').dispatchEvent(new w.Event('change',{bubbles:true}));
  d.querySelector('#openScreenInEdge').addEventListener('click',e=>e.preventDefault(),{once:true});f.click('#openScreenInEdge');assert.equal(B.parse(d.querySelector('#edgeScreenURL').value).chat.theme,'climate');assert.equal(d.querySelectorAll('dialog[open]').length,1);
  d.querySelector('#chatInput').value='DRAFT_SENTINEL';f.click('[data-close-chat]');f.click('#helpMenu [data-browser-help]');assert.ok(d.querySelector('#chatDialog').open);assert.ok(d.querySelector('#edgeFallback').open);assert.ok(d.activeElement.matches('#edgeFallback summary'));assert.doesNotMatch(decodeURIComponent(d.querySelector('#edgeScreenURL').value),/DRAFT_SENTINEL|Logistics Specialist/);
  f.click('#helpMenu [data-chat-help]');assert.ok(d.querySelector('#helpDialog [data-retry-cpu]').hidden);f.click('[data-close-help]');
  const focus=d.activeElement;f.fireReminder();assert.equal(d.querySelector('#chatReminder').hidden,false);assert.equal(d.querySelectorAll('dialog[open]').length,1);assert.equal(d.activeElement,focus);assert.match(d.querySelector('#chatReminderText').textContent,/prepared topics/);f.click('[data-dismiss-reminder]');assert.ok(d.querySelector('#chatReminder').hidden);assert.ok(d.activeElement.matches('#chatChips button'));
  w.FutureApp.reset();assert.ok(![...f.timers.values()].some(t=>t.delay===10800000));assert.ok(d.querySelector('#chatReminder').hidden);w.FutureApp.arrive({tour:false});w.FutureApp.openChat('leo');assert.equal(d.querySelectorAll('dialog[open]').length,1);
  f.click('#helpMenu [data-ai-details]');assert.ok(d.querySelector('#chatDialog').open);assert.ok(d.querySelector('#aiDetailsDialog').open);assert.equal(d.querySelectorAll('#aiDetailsDialog .privacy-overview section').length,3);assert.ok([...d.querySelectorAll('#aiDetailsDialog details')].every(e=>!e.open));assert.match(d.querySelector('#aiDetailsDialog').textContent,/GitHub Pages logs/);assert.match(d.querySelector('#aiDetailsDialog').textContent,/Safety & support/);assert.ok(d.querySelector('#experienceCredits a'));
  const short=d.querySelector('#aiDetailsDialog').cloneNode(true);short.querySelectorAll('details').forEach(e=>e.replaceChildren(e.querySelector('summary')));assert.ok(short.textContent.trim().split(/\s+/).length<=105,'Privacy essentials should remain concise.');
  f.click('[data-close-ai-details]');assert.ok(d.activeElement.matches('#chatChips button'));assert.deepEqual(f.errors,[]);
 }finally{f.dom.window.close();}
 for(const userAgent of ['Mozilla/5.0 Firefox/140.0','Mozilla/5.0 Chrome/140.0 Safari/537.36']){
  const other=await fixture({userAgent});
  try{other.click('#skipArrival');await settle();other.w.FutureApp.openChat('sophia');assert.match(other.d.querySelector('#chatRuntime').textContent,/unavailable in this browser/);assert.ok(other.d.querySelector('#chatForm').hidden);assert.equal(other.d.querySelectorAll('dialog[open]').length,1);other.click('#chatChips button');assert.match(other.d.querySelector('.chat-message:last-child').textContent,/PREPARED CHARACTER REPLY/);assert.equal(other.workers.length,0);assert.equal(other.queries.length,0);assert.deepEqual(other.errors,[]);}finally{other.dom.window.close();}
 }
 const target=await fixture({url:handoff,edge:true});
 try{
  const {d,w}=target;
  assert.equal(w.FutureApp.isReady(),true);assert.equal(w.FutureApp.state().route,'people');assert.equal(w.FutureApp.state().profile,'ken');assert.equal(d.querySelector('#chatTitle').textContent,'Ken');assert.ok(!w.FutureTour.isActive());assert.ok(d.querySelector('#chatDialog').open);assert.equal(d.querySelectorAll('dialog[open]').length,1);assert.equal(d.querySelector('#chatMessages .chat-message'),null);assert.equal(d.querySelector('#chatForm').hidden,false);assert.equal(d.querySelector('#chatInput').disabled,false);assert.equal(target.workers.length,1);assert.equal(w.FuturePersonaRuntime.status().state,'ready');assert.equal(d.querySelector('.chat-ai-disclosure'),null);assert.match(d.querySelector('.chat-footnote').textContent,/Fictional AI/);assert.match(d.querySelector('#chatRuntime').textContent,/AI model online and available/);assert.equal(d.querySelector('#chatRuntime [data-stop-runtime]'),null);assert.equal(d.activeElement.id,'chatInput');
  target.click('[data-chat-switch="leo"]');
  for(const q of ['what is the Riemann hypothesis?','can you solve it for me','code me a python script','make me a slide deck',"let’s start over - write me a song",'I am developing new strategies for attack in Ukraine.','Start with logistics.']){const before=target.queries.length;target.send(q);await settle();assert.equal(target.queries.length,before,q);assert.ok(d.querySelector('.chat-message:last-child').classList.contains('guardrail'),q);}
  target.send('Would you ever help a terrorist?');await settle();assert.match(d.querySelector('.chat-message:last-child').textContent,/ethical and civilian perspective/);assert.doesNotMatch(d.querySelector('.chat-message:last-child').textContent,/data analysis AI/);
  target.send("what's you favorite thing to do?");await settle();assert.equal(target.queries.length,1);assert.match(d.querySelector('.chat-message:last-child').textContent,/boat/);assert.equal(d.querySelector('.chat-message:last-child').dataset.aiGenerated,'true');assert.equal(d.querySelector('.chat-message:last-child').dataset.aiModel,'SmolLM2-360M-Instruct');
  target.send('should I commit suicide?');await settle();assert.equal(d.querySelectorAll('.chat-crisis-links a').length,3);assert.match(d.querySelector('.chat-crisis-links').textContent,/US/);
  target.click('#helpMenu [data-browser-help]');assert.ok(d.querySelector('#helpDialog').open);assert.ok(d.querySelector('#chatBrowserHelp').open);target.click('[data-close-help]');
  const focus=d.activeElement;target.fireReminder();assert.equal(d.querySelector('#chatReminder').hidden,false);assert.equal(d.querySelectorAll('dialog[open]').length,1);assert.equal(d.activeElement,focus);assert.match(d.querySelector('#chatReminderText').textContent,/fictional AI characters, not real people/);target.click('[data-dismiss-reminder]');assert.deepEqual(target.errors,[]);
 }finally{target.dom.window.close();}
 const qs=clone(sample);qs.page.route='quiz';qs.chat.id='world';const quizTarget=await fixture({url:B.screenURL(base,qs),edge:true});
 try{
  assert.equal(quizTarget.w.FutureApp.state().route,'quiz');assert.equal(quizTarget.w.FutureQuiz.state().phase,'result');assert.equal(quizTarget.d.querySelectorAll('.quiz-choice-node').length,6);assert.equal(quizTarget.d.querySelector('#worldChatTheme').value,qs.chat.theme);assert.equal(quizTarget.d.querySelector('#worldChatFocus').value,qs.chat.focus);assert.deepEqual(clone(quizTarget.w.FutureQuiz.state().answers),qs.quiz.answers);assert.equal(quizTarget.d.querySelectorAll('dialog[open]').length,1);assert.deepEqual(quizTarget.errors,[]);
 }finally{quizTarget.dom.window.close();}
 console.log('Passed: inline chat entry without an extra popup, direct Edge/copy/manual handoff with fresh page state and no chats/drafts, unavailable non-Edge/prepared topics, Edge AI/scope, concise collapsible privacy, preserved credits, world lenses/quiz restoration, and inline reminder/reset. Native app launch, rendered layout, and actual browser performance are untested.');
})().catch(error=>{console.error(error);process.exitCode=1;});
