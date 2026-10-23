(function () {
  'use strict';
  const screen=document.getElementById('characterScreen');
  const {nodes,edges}=window.AtlasData;
  const people=nodes.filter(n=>n.type==='person'), byId=new Map(nodes.map(n=>[n.id,n]));
  const configs=window.FutureCharacterConfig;
  const short={work:'Work & learning',home:'Home & family',tech:'Technology',health:'Food & health',third:'Third places'};
  const typeNames={person:'Person',facet:'Area of life',tech:'Technology',shared:'Shared life',system:'System'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safePath=s=>typeof s==='string'&&/^(?:https?:\/\/|(?:\.\/)?(?:portraits|assets|audio|scenes)\/)/i.test(s)?s:null;
  const color=n=>configs[n.id]?.accent||n.color||({facet:'#89bee7',shared:'#dc9ec8',system:'#eead83',tech:'#85d6dc'}[n.type])||'#aec6ed';
  const $=id=>document.getElementById(id);
  let person,config,facet,selected,view='graph',graphObserver,graphFrame;
  const facets=()=>nodes.filter(n=>n.person===person.id);
  function graphGroups(){
    const life=facets();
    const neighborIds=edges.filter(e=>e.source==='board'&&(e.a===person.id||e.b===person.id)).map(e=>e.a===person.id?e.b:e.a);
    const allIds=[...new Set([...neighborIds,...life.flatMap(n=>n.related||[])])];
    const world=allIds.map(id=>byId.get(id)).filter(n=>n&&n.type!=='person'&&n.type!=='facet');
    const otherIds=new Set(allIds.filter(id=>byId.get(id)?.type==='person'&&id!==person.id));
    const shared=new Set(world.filter(n=>n.type==='shared').map(n=>n.id));
    edges.filter(e=>e.source==='board'&&(shared.has(e.a)||shared.has(e.b))).forEach(e=>{
      const n=byId.get(shared.has(e.a)?e.b:e.a);if(n?.type==='person'&&n.id!==person.id)otherIds.add(n.id);
    });
    return {person:[person],facets:life,world,people:[...otherIds].map(id=>byId.get(id))};
  }
  function portrait(n){
    const src=safePath(n.portrait), pos=/^[\d.\s%a-z-]+$/i.test(n.portraitPosition||'')?n.portraitPosition:'50% 35%';
    return '<div class="character-portrait"><span class="character-initial" aria-hidden="true">'+esc(n.initial)+'</span><span class="portrait-caption">Portrait to come</span>'+(src?'<img src="'+esc(src)+'" alt="'+esc(n.name)+'" style="object-position:'+esc(pos)+'">':'')+'</div>';
  }
  function voice(){
    const src=safePath(config.audio);
    return '<div class="character-voice"><span class="voice-symbol" aria-hidden="true">'+(src?'♪':'◌')+'</span><div><strong>In '+esc(person.name)+'’s words</strong><small>'+(src?'Listen to their perspective':'Voice recording to come')+'</small></div>'+(src?'<audio controls preload="none" src="'+esc(src)+'" aria-label="Listen to '+esc(person.name)+'"></audio>':'<span class="voice-wave" aria-hidden="true">▂ ▅ ▃ ▇ ▄ ▂ ▆ ▃</span>')+(src&&config.audioTranscript?'<details class="voice-transcript"><summary>Read transcript</summary><p>'+esc(config.audioTranscript)+'</p></details>':'')+'</div>';
  }
  function identity(){return '<section class="character-identity">'+portrait(person)+'<div class="character-bio"><h1 id="characterTitle" tabindex="-1">'+esc(person.name)+'</h1><p class="character-bio-copy">'+esc(person.description||config.bio)+'</p>'+voice()+'</div></section>';}
  function interests(){return '<section class="character-interests" aria-labelledby="interestHeading"><h2 id="interestHeading">Areas of life</h2><div class="life-choices" role="group" aria-label="Areas of '+esc(person.name)+'’s life">'+facets().map((n,i)=>'<button type="button" class="life-choice" data-character-node="'+esc(n.id)+'" aria-pressed="'+(n.id===selected.id)+'"><span class="life-number">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(short[n.key])+'</strong><small>'+esc((n.related||[]).slice(0,2).map(id=>byId.get(id)?.label||byId.get(id)?.name).join(' · '))+'</small></span><span class="life-arrow" aria-hidden="true">↗</span></button>').join('')+'</div></section>';}
  function personalTies(){
    const ties=new Map();
    const myShared=edges.filter(e=>e.source==='board'&&(e.a===person.id||e.b===person.id)).map(e=>byId.get(e.a===person.id?e.b:e.a)).filter(n=>n?.type==='shared');
    myShared.forEach(middle=>edges.filter(e=>e.source==='board'&&(e.a===middle.id||e.b===middle.id)).forEach(e=>{const n=byId.get(e.a===middle.id?e.b:e.a);if(n?.type==='person'&&n.id!==person.id&&!ties.has(n.id))ties.set(n.id,{person:n,via:middle});}));
    return '<section class="character-connections"><h2>People connected to '+esc(person.name)+'</h2><div class="personal-ties">'+[...ties.values()].map(t=>'<button type="button" data-character-person="'+esc(t.person.id)+'"><span class="tie-avatar" style="--tie-color:'+esc(color(t.person))+'">'+esc(t.person.initial)+'</span><span><strong>'+esc(t.person.name)+'</strong><small>Through '+esc(t.via.name)+'</small></span><span aria-hidden="true">↗</span></button>').join('')+'</div></section>';
  }
  function mapShell(){return '<section class="character-map" aria-labelledby="characterMapTitle"><div class="character-map-head"><h2 id="characterMapTitle">'+esc(person.name)+'’s world</h2><div class="character-map-switch" role="group" aria-label="Connection display"><button type="button" data-character-view="graph" aria-pressed="'+(view==='graph')+'">Graph</button><button type="button" data-character-view="list" aria-pressed="'+(view==='list')+'">List</button></div></div><div id="characterGraphBody"></div><div class="character-map-footer"><span><i></i> Selected connections</span><button type="button" data-character-world>Open full world ↗</button></div></section>';}
  function nodeButton(n,group){
    return '<button type="button" class="character-graph-node '+(n.type==='person'?'graph-person':'')+'" data-graph-group="'+group+'" data-character-node="'+esc(n.id)+'" style="--graph-color:'+esc(color(n))+'" aria-label="'+esc(n.name)+', '+typeNames[n.type]+'" aria-pressed="'+(n.id===selected.id)+'">'+(n.type==='person'?'<span class="graph-person-initial">'+esc(n.initial)+'</span>':'<span class="graph-node-kind">'+esc(typeNames[n.type])+'</span>')+'<strong>'+esc(n.key?short[n.key]:n.label||n.name)+'</strong></button>';
  }
  function graph(){
    graphObserver?.disconnect();cancelAnimationFrame(graphFrame);
    const groups=graphGroups(), headings={facets:'Areas of life',world:'Connected world',people:'People'};
    if(view==='list'){
      $('characterGraphBody').innerHTML='<div class="character-graph-list">'+Object.entries(groups).map(([key,list])=>(key!=='person'&&list.length?'<h3>'+headings[key]+'</h3>':'')+list.map(n=>'<button type="button" data-character-node="'+esc(n.id)+'"'+(n.id===selected.id?' aria-current="true"':'')+'><span>'+esc(typeNames[n.type])+'</span><strong>'+esc(n.key?short[n.key]:n.label||n.name)+'</strong><span aria-hidden="true">↗</span></button>').join('')).join('')+'</div>';
    }else{
      $('characterGraphBody').innerHTML='<div class="character-graph-stage" id="characterGraphStage"><svg class="character-edges" aria-hidden="true"></svg>'+Object.entries(groups).map(([key,list])=>(key!=='person'&&list.length?'<h3 class="graph-group-label" data-graph-label="'+key+'">'+headings[key]+'</h3>':'')+list.map(n=>nodeButton(n,key)).join('')).join('')+'</div>';
      const schedule=()=>{cancelAnimationFrame(graphFrame);graphFrame=requestAnimationFrame(layoutGraph);};
      graphObserver=new ResizeObserver(schedule);
      graphObserver.observe($('characterGraphStage'));
      $('characterGraphStage').querySelectorAll('button').forEach(el=>graphObserver.observe(el));
      // Set the height before a selected story is scrolled into view.
      layoutGraph();
    }
    screen.querySelectorAll('[data-character-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.characterView===view)));
  }
  function layoutGraph(){
    const stage=$('characterGraphStage');if(!stage||screen.hidden||!stage.clientWidth)return;
    const width=stage.clientWidth, kiosk=window.matchMedia('(min-width:900px) and (min-height:1350px) and (max-aspect-ratio:4/5)').matches;
    const huge=window.matchMedia('(min-width:1800px) and (min-height:2800px) and (max-aspect-ratio:4/5)').matches;
    const columns=width>=1100?4:width>=470?3:2, gap=huge?42:kiosk?28:22;
    const nodeWidth=Math.min(huge?240:kiosk?184:132,(width-gap*(columns+1))/columns);
    const buttons=[...stage.querySelectorAll('button')];
    buttons.forEach(el=>el.style.width=(el.dataset.graphGroup==='person'?Math.min(huge?180:kiosk?132:88,nodeWidth):nodeWidth)+'px');
    const center=stage.querySelector('[data-graph-group="person"]');
    let y=12; center.style.left='50%';center.style.top=(y+center.offsetHeight/2)+'px';y+=center.offsetHeight+gap;
    for(const key of ['facets','world','people']){
      const group=buttons.filter(el=>el.dataset.graphGroup===key);if(!group.length)continue;
      const label=stage.querySelector('[data-graph-label="'+key+'"]');label.style.top=y+'px';y+=label.offsetHeight+gap;
      for(let i=0;i<group.length;i+=columns){
        const row=group.slice(i,i+columns),height=Math.max(...row.map(el=>el.offsetHeight));
        row.forEach((el,j)=>{el.style.left=((j+.5)*width/columns)+'px';el.style.top=(y+height/2)+'px';});
        y+=height+gap;
      }
      y+=gap;
    }
    const height=Math.ceil(y+8);if(stage.style.height!==height+'px')stage.style.height=height+'px';
    drawLines(stage);
  }
  function drawLines(stage){
    const svg=stage.querySelector('svg');
    svg.setAttribute('viewBox','0 0 '+stage.clientWidth+' '+stage.clientHeight);
    const centers=new Map([...stage.querySelectorAll('button')].map(el=>[el.dataset.characterNode,{x:el.offsetLeft,y:el.offsetTop}]));
    const seen=new Set();
    svg.innerHTML=edges.filter(e=>centers.has(e.a)&&centers.has(e.b)).filter(e=>{const id=[e.a,e.b].sort().join('|');if(seen.has(id))return false;seen.add(id);return true;}).map(e=>{const a=centers.get(e.a),b=centers.get(e.b),active=e.a===selected.id||e.b===selected.id;return '<path d="M'+a.x+' '+a.y+' C'+a.x+' '+((a.y+b.y)/2)+' '+b.x+' '+((a.y+b.y)/2)+' '+b.x+' '+b.y+'" class="'+(active?'is-active':'')+'"/>';}).join('');
  }
  function story(){
    const n=selected,isFacet=n.type==='facet',links=(n.related||[]).map(id=>byId.get(id)).filter(Boolean).slice(0,4);
    const text=n.description||(isFacet?config.stories[n.key]:window.FutureTechnologyConfig.mapCards[n.id]?.summary)||'Follow '+n.name+' into the wider world to see the other lives and areas it connects.';
    const image=safePath(config.scene);
    $('characterStory').innerHTML='<h2 id="characterStoryTitle" tabindex="-1">'+esc(isFacet?short[n.key]:n.name)+'</h2><div class="character-story-content">'+(image?'<img class="character-scene" src="'+esc(image)+'" alt="A scene from '+esc(person.name)+'’s life">':'<div class="character-scene scene-placeholder" aria-hidden="true"><span>+</span></div>')+'<p>'+esc(text)+'</p></div><div class="story-threads"><h3>Where does this lead?</h3><div>'+links.map(link=>'<button type="button" '+(link.type==='person'?'data-character-person':'data-character-thread')+'="'+esc(link.id)+'">'+esc(link.label||link.name)+' <span aria-hidden="true">↗</span></button>').join('')+'</div></div><button type="button" class="story-world-link" data-character-thread="'+esc(n.id)+'">See this connection in the world ↗</button>';
    screen.querySelectorAll('.life-choice').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.characterNode===n.id)));
  }
  function pause(){screen.querySelectorAll('audio').forEach(el=>el.pause());}
  function recoverImages(){screen.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.remove(),{once:true}));}
  function themeContext(){
    const context=window.FutureThemes?.contextFor(person.id);
    if(!context)return '';
    return '<aside class="character-theme-context" aria-label="Theme exploration"><button type="button" data-character-theme>← '+esc(context.title)+(context.groupTitle?' / '+esc(context.groupTitle):'')+'</button>'+(context.blurb?'<p>'+esc(context.blurb)+'</p>':'')+'</aside>';
  }
  function render(id,options={}){
    pause();person=byId.get(id);config=configs[id];if(!person||!config)return;
    facet=facets().find(n=>n.key===options.facetKey)||facets()[0];selected=facet;
    screen.dataset.layout='profile';screen.style.setProperty('--character-accent',color(person));
    screen.innerHTML='<div class="character-main"><div class="character-topline"><button type="button" data-character-world>← Back to world</button><button type="button" data-character-all>Character cards ↗</button></div><nav class="character-selector" aria-label="Choose a character">'+people.map(n=>'<button type="button" data-character-person="'+esc(n.id)+'" aria-current="'+(n.id===id?'page':'false')+'" style="--selector-accent:'+esc(color(n))+'"><span class="selector-initial" aria-hidden="true">'+esc(n.initial)+'</span><strong>'+esc(n.name)+'</strong></button>').join('')+'</nav><div class="character-layout">'+identity()+interests()+mapShell()+'<section class="character-story" id="characterStory" aria-labelledby="characterStoryTitle"></section>'+personalTies()+'</div><footer class="character-footer"><button type="button" data-character-next>Meet '+esc(people[(people.findIndex(n=>n.id===id)+1)%people.length].name)+' next →</button></footer></div>';
    screen.querySelector('.character-selector').insertAdjacentHTML('afterend',themeContext());
    graph();story();recoverImages();screen.scrollTop=0;
    screen.querySelector('.character-selector [aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'center'});
    $('characterTitle').focus({preventScroll:true});
    $('announcement').textContent=person.name+'. Choose an area of life, another person, or a connection.';
  }
  function selectNode(id){
    const n=byId.get(id);if(!n)return;
    if(n.id===person.id)selected=facet;
    else if(n.type==='person'){window.FutureLanding.openCharacter(n.id);return;}
    else {selected=n;if(n.person===person.id)facet=n;}
    graph();story();recoverImages();history.replaceState({...history.state,facetKey:facet.key},'',location.href);
    const title=$('characterStoryTitle');title.focus({preventScroll:true});
    if(window.matchMedia('(max-width:760px)').matches)title.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
    $('announcement').textContent=person.name+' · '+(n.key?short[n.key]:n.name)+'. Connections updated.';
  }
  screen.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.characterPerson)window.FutureLanding.openCharacter(button.dataset.characterPerson);
    else if(button.hasAttribute('data-character-theme'))window.FutureLanding.returnToTheme();
    else if(button.dataset.characterNode)selectNode(button.dataset.characterNode);
    else if(button.dataset.characterThread)window.FutureLanding.openWorld(button.dataset.characterThread);
    else if(button.dataset.characterView){view=button.dataset.characterView;graph();}
    else if(button.hasAttribute('data-character-world'))window.FutureLanding.openWorld();
    else if(button.hasAttribute('data-character-all'))window.FutureLanding.show({push:true,section:'peopleSection'});
    else if(button.hasAttribute('data-character-next'))window.FutureLanding.openCharacter(people[(people.findIndex(n=>n.id===person.id)+1)%people.length].id);
  });
  window.FutureCharacters={render,pause,formats:configs};
})();
