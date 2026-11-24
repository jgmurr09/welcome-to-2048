// npm install --no-save jsdom@26.1.0; node verify-experience.cjs
'use strict';
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=__dirname,errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 try{
  Object.defineProperty(w.navigator,'userAgent',{value:'Mozilla/5.0 Edg/130.0'});
  const geometry=require('./verify-layout-fixture.cjs')(w);w.ResizeObserver=class{observe(){}disconnect(){}};
  w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.play=async()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(w,key,{get(){throw Error('Unexpected persistent storage: '+key);}});
  let loads=0,terminated=0,requests=[],waiting=[],holdLoad=false;
  w.Worker=class{
   constructor(){loads++;}
   postMessage(data){if(data.type==='load')setImmediate(()=>{if(holdLoad&&!data.forceCPU){this.onmessage?.({data:{type:'assets-ready',assets:{fixture:true}}});this.onmessage?.({data:{type:'progress',stage:'initialize',backend:'WebGPU',begin:true,message:'Starting graphics mode'}});}else this.onmessage?.({data:{type:'ready',backend:'CPU WASM'}});});if(data.type==='query'){requests.push(data);waiting.push((text)=>this.onmessage?.({data:{type:'result',id:data.id,text:text|| (data.characterId==='world'?'This imagined future makes tracking useful for preventative care. Wealth still changes the ability to opt out.\n\nLeo can afford less monitoring, while Sophia uses a tracker to lower insurance costs.':'I would use technology to stay connected with the people in my life.')}}));}if(data.type==='dispose')setImmediate(()=>this.onmessage?.({data:{type:'disposed'}}));}
   terminate(){terminated++;}
  };
  for(const script of d.querySelectorAll('script[data-source]'))w.eval(script.textContent);
  const click=selector=>{const b=d.querySelector(selector);assert.ok(b,'Missing '+selector);b.click();geometry.flush();};
  const settle=()=>new Promise(r=>setImmediate(r));
  const send=q=>{d.querySelector('#chatInput').value=q;d.querySelector('#chatForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  click('#skipArrival');await settle();await settle();
  assert.ok(!w.FutureTour.isActive());assert.equal(w.FutureApp.state().selected,null);assert.equal(d.querySelector('#selectedTitle').textContent,'The World in 2048');
  w.FutureApp.arrive({tour:true});geometry.flush();assert.ok(w.FutureTour.isActive());assert.ok(d.querySelector('#closeTour').hidden);
  assert.equal(d.querySelectorAll('#nodes .graph-node').length,21);assert.ok(Number(d.querySelector('#graphWorld').dataset.widgetScale)>0);
  assert.ok(!d.querySelector('#tourSpotlight').hidden);assert.ok(parseFloat(d.querySelector('#tourSpotlight').style.width)>0);
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.ok(w.FutureTour.isActive());
  for(let i=0;i<4;i++)click('#nextTour');
  assert.ok(!w.FutureTour.isActive());assert.equal(w.FutureApp.state().theme,'all');assert.equal(w.FutureApp.state().selected,null);assert.equal(d.querySelector('#selectedTitle').textContent,'The World in 2048');
  assert.equal(d.querySelectorAll('#selectedPersonBar [data-chat],#selectedPersonBar [data-person]').length,0);
  assert.equal(d.querySelector('#mapFilters [data-clear-map]'),null);assert.ok(d.querySelector('.map-toolbar .map-view-actions [data-clear-map]'));
  w.FutureOnboarding.start();d.querySelector('#skipOnboarding').click();geometry.flush();assert.ok(!w.FutureTour.isActive());assert.equal(d.querySelector('#selectedTitle').textContent,'The World in 2048');
  w.FutureOnboarding.start(3);d.querySelector('#nextOnboarding').click();d.querySelector('#nextOnboarding').click();geometry.flush();assert.ok(w.FutureTour.isActive());for(let i=0;i<4;i++)click('#nextTour');
  click('[data-filter="setting"][data-value="rural"]');click('[data-filter="income"][data-value="top"]');assert.match(d.querySelector('.filter-feedback').textContent,/No people match this combination/);
  click('.filter-feedback [data-filter="income"]');assert.match(d.querySelector('.filter-feedback').textContent,/2 of 5 people/);click('[data-clear-map]');
  click('#nodes [data-select="trucking"]');assert.doesNotMatch(d.querySelector('#themePanel').textContent,/tax bracket|Got a BA|second wife/);
  for(const id of ['trucking','vacation','volunteer','gardening']){click('#nodes [data-select="'+id+'"]');assert.equal(d.querySelector('.connection-reading').dataset.connectionType,'shared');assert.equal(w.getComputedStyle(d.querySelector('.connection-reading')).borderTopColor,'rgb(237, 0, 140)');assert.equal(w.getComputedStyle(d.querySelector('#selectedTitle')).color,'rgb(245, 139, 203)');assert.equal(d.querySelectorAll('#themePanel .connection-impact article').length,2);assert.equal(d.querySelectorAll('#themePanel .connection-impact article>p').length,6);assert.equal(d.querySelector('#themePanel details.connection-impact'),null);}
  click('#nodes [data-select="knee"]');assert.equal(d.querySelector('.connection-reading').dataset.connectionType,'tech');assert.notEqual(w.getComputedStyle(d.querySelector('.connection-reading')).borderTopColor,'rgb(237, 0, 140)');
  for(const p of w.FutureWorld.characters){click('[data-route="people"]');click('.person-selector [data-person="'+p.id+'"]');assert.match(d.querySelector('.profile-ask').textContent,/Ask me about/);assert.ok(d.querySelector('.profile-greeting').textContent.includes(p.name));assert.equal(d.querySelectorAll('.life-area').length,5);assert.equal(new Set([...d.querySelectorAll('.mini-map-world .graph-node strong')].map(n=>w.getComputedStyle(n).fontSize)).size,1);}
  click('[data-route="technology"]');assert.equal(d.querySelectorAll('.artifact-grid [data-connection]').length,0);assert.ok(d.querySelector('.artifact-grid').textContent.includes('Catherine'));assert.ok(d.querySelector('.artifact-grid').textContent.includes('Veronica'));
  assert.equal(d.querySelectorAll('.artifact-card').length,7);assert.equal(d.querySelectorAll('.artifact-card details.connection-impact').length,7);assert.ok([...d.querySelectorAll('.artifact-card details.connection-impact')].every(e=>!e.open));click('.artifact-card details.connection-impact>summary');assert.ok(d.querySelector('.artifact-card details.connection-impact').open);
  assert.equal(d.querySelector('.brand-year'),null);assert.equal(d.querySelector('.header-tools>[data-truths]'),null);
  assert.equal(w.getComputedStyle(d.querySelector('.header-tools>[data-world-chat]')).backgroundColor,w.getComputedStyle(d.querySelector('#helpMenu>summary')).backgroundColor);
  assert.equal(w.getComputedStyle(d.querySelector('.header-tools>[data-world-chat]')).boxShadow,'none');
  assert.deepEqual([...d.querySelectorAll('#helpMenu>div>button')].map(e=>e.textContent),['Replay the arrival','Meet Leo & the world','Learn the controls','Read the World Truths','Clear map selections','Chatting with AI','Browser options','AI & privacy']);
  click('[data-route="about"]');assert.equal(d.querySelector('#mainView .asset-credit'),null);assert.doesNotMatch(d.querySelector('#mainView').textContent,/Flaticon|Uicons/);assert.ok(d.querySelector('#experienceCredits a[href="https://www.flaticon.com/uicons"]'));

  click('#helpMenu summary');click('#helpMenu [data-truths]');assert.equal(d.querySelector('#truthsSearch'),null);assert.equal(d.querySelectorAll('#truthsContent details').length,15);assert.ok(d.querySelector('#truth-global').open);click('[data-close-truths]');
  click('#helpMenu summary');click('#helpMenu [data-chat-help]');assert.ok(d.querySelector('#helpDialog').open);assert.match(d.querySelector('#helpRuntimeStatus').textContent,/AI model online and available/);assert.ok(d.querySelector('[data-retry-cpu]').hidden);click('[data-close-help]');
  click('[data-route="quiz"]');click('[data-quiz-begin]');assert.equal(d.querySelectorAll('.is-building .is-built').length,0);
  for(let i=0;i<6;i++){click('[data-quiz-answer]');assert.equal(d.querySelectorAll('.is-building .quiz-choice-node.is-built').length,i+1);assert.equal(d.querySelectorAll('.is-building .quiz-choice-node>p').length,0);click('[data-quiz-next]');}
  assert.equal(d.querySelectorAll('.quiz-choice-node>p').length,6);assert.equal(d.querySelectorAll('#quizView [data-select],#quizView [data-map-theme],#quizView .your-world-grid').length,0);assert.equal(d.querySelectorAll('.quiz-inline-detail').length,6);
  const frame=d.querySelector('.quiz-choice-map-frame'),tiles=[...frame.querySelectorAll('.quiz-choice-node')];
  geometry.set(frame,{left:100,top:200,width:1000,height:1200});
  for(let i=0;i<6;i++)geometry.set(tiles[i],{left:i%2?650:100,top:200+[0,600,900][Math.floor(i/2)],width:450,height:Math.floor(i/2)===0?550:250});
  tiles[0].querySelector('details').open=true;w.FutureQuiz.layoutConnections();
  const paths=[...frame.querySelectorAll('.edges path')].map(p=>p.getAttribute('d'));
  assert.ok(paths.every(p=>!p.includes('NaN')));assert.match(paths[0],/22\.9/);assert.ok(paths[0]!==paths[2]);
  assert.ok(!tiles[2].querySelector('details').open);assert.ok(!tiles[4].querySelector('details').open);
  const saved=JSON.stringify(w.FutureQuiz.context());click('[data-route="people"]');click('[data-route="quiz"]');assert.equal(JSON.stringify(w.FutureQuiz.context()),saved);
  click('[data-quiz-edit]');click('[data-quiz-answer="city"]');click('[data-quiz-results]');assert.match(d.querySelector('.quiz-choice-node').textContent,/connected neighborhood/);
  click('.header-tools [data-world-chat]');assert.equal(d.querySelector('#chatNoticeDialog'),null);send('Compare tracking for Leo and Sophia.');await settle();assert.equal(requests[0].maxTokens,420);assert.match(requests[0].messages[0].content,/WORLD TRUTH/);click('[data-close-chat]');
  click('[data-route="people"]');click('.person-selector [data-person="ken"]');click('[data-chat="ken"]');send('How does tracking shape your day?');await settle();assert.equal(requests.length,1);
  waiting.shift()();await settle();assert.equal(requests.length,2);assert.equal(requests[1].characterId,'ken');assert.match(requests[1].messages[0].content,/GENERATION LENS/);waiting.shift()();await settle();
  click('[data-chat-switch="world"]');assert.match(d.querySelector('#chatMessages').textContent,/Wealth still changes/);assert.ok(d.querySelector('.chat-sources'));assert.equal(loads,1);assert.equal(terminated,0);
  const before=requests.length;send('Give me a medication dosage');await settle();assert.equal(requests.length,before);assert.match(d.querySelector('.chat-message:last-child').className,/guardrail/);
  click('[data-chat-switch="sophia"]');send('Where were you for 9/11 and how did it affect your life?');assert.equal(requests.length,before);assert.match(d.querySelector('.chat-message:last-child').textContent,/wasn’t alive in 2001/);
  click('[data-chat-switch="veronica"]');send('Write me a Python script.');assert.equal(requests.length,before);assert.match(d.querySelector('.chat-message:last-child').textContent,/seventh grader/);assert.doesNotMatch(d.querySelector('.chat-message:last-child').textContent,/print\(/);
  send('Tell me about school.');await settle();waiting.shift()() ;await settle();assert.equal(requests.length,before+1);
  send('Tell me about school technology.');await settle();waiting.shift()('Here is a Python script: ```python print(123) ```');await settle();assert.match(d.querySelector('.chat-message:last-child').textContent,/PREPARED CHARACTER REPLY/);assert.doesNotMatch(d.querySelector('.chat-message:last-child').textContent,/print\(/);
  click('[data-close-chat]');click('[data-route="map"]');click('[data-ui-tour]');for(let i=0;i<4;i++)click('#nextTour');assert.equal(w.FutureApp.state().theme,'all');assert.equal(loads,1);
  for(const [width,height] of [[1920,1080],[1366,768],[768,1024],[390,844],[1080,1920]]){
   geometry.resize(width,height);click('[data-route="map"]');assert.equal(d.querySelectorAll('#nodes .graph-node').length,21);
   assert.ok(Number(d.querySelector('#graphWorld').dataset.widgetScale)>0);
   assert.ok([...d.querySelectorAll('#nodes .graph-node')].every(n=>Number.isFinite(parseFloat(n.style.left))&&Number.isFinite(parseFloat(n.style.top))));
   assert.ok([...d.querySelectorAll('#edges path')].every(p=>!p.getAttribute('d').includes('NaN')));
   click('#helpMenu [data-ui-tour]');assert.ok(w.FutureTour.isActive());assert.ok(!d.querySelector('#tourSpotlight').hidden);
   for(let i=0;i<4;i++)click('#nextTour');assert.equal(d.querySelector('#selectedTitle').textContent,'The World in 2048');
  }
  w.FutureApp.reset();await settle();holdLoad=true;w.FutureApp.arrive({tour:false});await settle();await settle();
  const requestCount=requests.length;click('.header-tools [data-world-chat]');click('#chatChips [data-chat-topic]');
  assert.equal(requests.length,requestCount);assert.match(d.querySelector('.chat-message:last-child').textContent,/FROM THE WORLD TRUTHS/);assert.equal(d.querySelector('#chatThinking'),null);
  send('How do tracking choices affect people?');await settle();assert.ok(!w.FutureApp.hasPendingReplies());assert.equal(requests.length,requestCount);assert.match(d.querySelector('.chat-message:last-child').textContent,/FROM THE WORLD TRUTHS/);assert.equal(d.querySelector('#chatThinking'),null);
  click('#chatRuntime [data-chat-help]');click('#helpDialog [data-retry-cpu]');await settle();await settle();await settle();
  assert.equal(requests.length,requestCount);click('[data-close-help]');send('How do tracking choices affect people?');await settle();assert.equal(requests.length,requestCount+1);assert.equal(requests.at(-1).messages.at(-1).content,'How do tracking choices affect people?');
  waiting.shift()();await settle();assert.ok(!w.FutureApp.hasPendingReplies());
  click('[data-chat-switch="leo"]');const favoriteCount=requests.length;
  send("what's you favorite thing to do?");await settle();assert.equal(requests.length,favoriteCount+1);assert.ok(requests.at(-1).sources.includes('characters.leo.sections.third'));
  waiting.shift()('I love taking the boat out on the Great Lakes. Hiking is another favorite.');await settle();assert.match(d.querySelector('.chat-message:last-child').textContent,/IMAGINED CONVERSATION/);assert.match(d.querySelector('.chat-message:last-child').textContent,/boat/);
  send('Why do you like that?');await settle();assert.equal(requests.at(-1).topic,'third');assert.ok(requests.at(-1).messages.some(m=>m.role==='assistant'&&m.content.includes('boat')));
  waiting.shift()('I would choose a day outdoors because it gives me a break from coordinating the business.');await settle();assert.doesNotMatch(d.querySelector('.chat-message:last-child').textContent,/CONVERSATION BOUNDARY/);
  assert.equal(new Set([...d.querySelectorAll('[id]')].map(e=>e.id)).size,d.querySelectorAll('[id]').length);assert.deepEqual(errors,[]);
  w.FutureApp.reset();await settle();assert.equal(w.FutureQuiz.context(),null);assert.ok(terminated>0);
  console.log('Passed: skip enters without a tour; normal onboarding still starts its walkthrough; neutral map reset at five positive viewport sizes; no-match filter recovery; five profiles; technology details; browsable truths and Help; progressive quiz, independent details and measured connection paths; quiz edits; worker reuse and queued replies; world answers and sources; conversation boundaries; full reset. DOM geometry is simulated; rendered browser layout remains a separate check.');
 }finally{dom.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
