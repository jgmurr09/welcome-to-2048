(function(){
  'use strict';
  const W=window.FutureWorld,U=window.WorldUI,G=window.FutureConnections,E=window.FuturePresentation,{esc,portrait,copy,scene,icon}=U,$=id=>document.getElementById(id);
  const people=U.people,themes=new Map(W.themes.map(t=>[t.id,t])),nodeById=G.byId;
  const educationGroups={veronica:'school',sophia:'technical',ken:'associate',leo:'college',catherine:'college'};
  const state={education:'all',route:'map',theme:'all',setting:'all',income:'all',selected:'leo',profile:'leo',panel:'world',view:'map',activities:true,technology:'all'};
  const sectionKeys=['work','home','health','tech','third'],sectionTitles={work:'Work, Income & Education',home:'Home & Family',health:'Diet & Health',tech:'Technology',third:'Third Spaces'};
  const sceneNodes={trucking:'logistics',vacation:'lakes',volunteer:'care',gardening:'garden',robotics:'care','v-glasses':'education','c-glasses':'garden',kitchen:'garden',autonomous:'care',wearable:'health',knee:'knee'};
  const chats=new Map(),drafts=new Map();let ready=false,observer=null,graphTransform={scale:1,x:0,y:0},drag=null,ignoreClick=false,chatPerson=null,chatTopic=null,chatBusy=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const iconFor=id=>/glasses/.test(id)?'glasses':id;
  function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
  function passes(p){return (state.setting==='all'||p.placeGroup===state.setting)&&(state.income==='all'||p.incomeGroup===state.income)&&(state.education==='all'||educationGroups[p.id]===state.education);}
  function themeRecord(){return E.themes[state.theme]||E.world;}
  function sourceDisclosure(){return '';}
  const worldGuide={id:'world',name:'World of 2048',role:'World & theme guide'};
  const chatIdentity=id=>id==='world'?worldGuide:people.get(id);
  const worldChatEnabled=()=>window.FutureExperienceConfig.worldChatEnabled!==false;
  const supportsAI=()=>window.FutureChatBrowser.isEdge();
  const aiFootnote=$('chatDialog').querySelector('.chat-footnote').textContent;
  let worldChatTheme='all',worldChatFocus='all',noticeSeen=false,noticeTimer=0,lastNoticeAt=0;
  const incomingHandoff=window.FutureChatBrowser.parse(location.href),NOTICE_INTERVAL=3*60*60*1000;
  function screenSnapshot(){return {v:1,page:{...state},chat:{id:chatPerson||'world',theme:worldChatTheme,focus:worldChatFocus},quiz:window.FutureQuiz.state(),scroll:{main:$('mainView').scrollTop,panel:$('themePanel')?.scrollTop||0}};}
  function scheduleNotice(){clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{if($('chatDialog').open)showBreakReminder();},NOTICE_INTERVAL);}
  function showBreakReminder(){
    noticeSeen=true;lastNoticeAt=Date.now();scheduleNotice();
    $('chatReminderText').textContent=supportsAI()?'You’re talking with fictional AI characters, not real people. Take a break and reconnect with the people around you.':'You’re exploring fictional characters through prepared topics. Take a break and reconnect with the people around you.';
    $('chatReminder').hidden=false;
  }
  function updateScreenLink(){
    const url=window.FutureChatBrowser.screenURL(location.href,screenSnapshot()),field=$('edgeScreenURL'),link=$('openScreenInEdge'),button=$('copyScreenButton');
    if(!field||!link||!button)return url;
    field.value=url||'';button.disabled=!url;
    if(url){link.href=window.FutureChatBrowser.edgeURI(url);link.removeAttribute('aria-disabled');link.removeAttribute('tabindex');}
    else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.tabIndex=-1;$('edgeCopyStatus').textContent='Open this site through its local server to use the handoff.';}
    return url;
  }
  async function copyScreenLink(){
    const url=updateScreenLink(),field=$('edgeScreenURL'),status=$('edgeCopyStatus');if(!url||!field||!status)return;
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(url);status.textContent='Link copied. Paste it into Edge.';}
    catch{const fallback=$('edgeFallback');if(fallback){fallback.hidden=false;fallback.open=true;}if(field.isConnected){field.focus();field.select();}status.textContent='Link selected. Copy it, then paste it into Edge.';}
  }
  function focusChatAction(){if($('chatDialog').open)(supportsAI()?$('chatInput'):$('chatChips').querySelector('button'))?.focus();}
  function showBrowserOptions(){
    $('helpMenu').open=false;
    if(supportsAI()){showChatHelp();$('chatBrowserHelp').open=true;$('chatBrowserHelp').querySelector('summary').focus();return;}
    if(!$('chatDialog').open){closeDialogs();openChat(chatPerson||(worldChatEnabled()?'world':'leo'));}
    updateScreenLink();$('edgeFallback').hidden=false;$('edgeFallback').open=true;$('edgeFallback').querySelector('summary').focus();
  }
  function showAIDetails(){if(!$('chatDialog').open)closeDialogs();$('helpMenu').open=false;$('aiDetailsDialog').showModal();$('aiDetailsTitle').focus();}
  function contextSources(ids=[]){
    const records=[...new Set(ids)].map(window.FutureKnowledge.source).filter(Boolean);
    if(!records.length)return '';
    return `<details class="chat-sources"><summary>Context for this reply · ${records.length}</summary><p>World Truths and stories set this imagined world. Research adds context from its publication year; it does not predict 2048.</p>${records.map(r=>`<div><strong>${esc(r.label)}</strong><small>${esc(r.category)}${r.location?' · '+esc(r.location):''}</small>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`:''}</div>`).join('')}</details>`;
  }
  function connectionPeople(id,collapsible=false){
    const record=window.FutureConnectionData[id],ids=G.related(id).filter(i=>people.has(i));
    if(!ids.length)return '';
    const articles=ids.map(i=>{const person=people.get(i),detail=record?.people?.[i];return `<article><button type="button" data-person="${i}" class="connection-person-link">${portrait(i)}<span>${person.name}</span> ↗</button>${detail?`<p>${esc(detail.use)}</p><p><strong>In practice:</strong> ${esc(detail.effect)}</p><p class="connection-tradeoff">${esc(detail.tradeoff)}</p>`:''}</article>`;}).join('');
    return collapsible?`<details class="connection-impact technology-perspectives"><summary>What changes in daily life?</summary><div>${articles}</div></details>`:`<section class="connection-impact"><h3>What changes in daily life?</h3>${articles}</section>`;
  }
  function filterFeedback(){
    const active=['setting','income','education'].filter(k=>state[k]!=='all'),count=W.characters.filter(passes).length;
    if(!active.length)return '';
    const labels={suburb:'Suburb',urban:'Urban',rural:'Rural',top:'Top 1%',middle:'Middle income',lower:'Lower income',school:'School',technical:'Technical',associate:'Associate’s',college:'College'};
    return `<div class="filter-feedback ${count?'':'is-empty'}" role="status" aria-live="polite"><strong>${count?count+' of 5 people match all filters':'No people match this combination'}</strong><span>${count?'Other people stay dimmed for comparison.':'The map is still here. Remove a filter to bring people back into focus.'}</span><div>${active.map(key=>`<button type="button" data-filter="${key}" data-value="all" aria-label="Remove ${esc(labels[state[key]])} filter">${esc(labels[state[key]])} ×</button>`).join('')}</div></div>`;
  }
  function showTruths(){closeDialogs();$('helpMenu').open=false;$('truthsDialog').showModal();$('truthsTitle').focus();}
  function updateHelpStatus(){const rt=window.FuturePersonaRuntime.status(),times=rt.timings||{};$('helpRuntimeStatus').textContent=rt.message+(rt.compatibility?' This browser uses the compatibility runtime.':'')+(times.downloadMs!==undefined?' Model transfer: '+Math.round(times.downloadMs/1000)+'s.':'')+(times.initializeMs!==undefined?' Engine startup: '+Math.round(times.initializeMs/1000)+'s.':'')+(times.totalMs!==undefined?' Total setup: '+Math.round(times.totalMs/1000)+'s.':'');document.querySelector('#helpDialog [data-retry-cpu]').hidden=!supportsAI()||['ready','disabled'].includes(rt.state);}
  function showChatHelp(){$('helpMenu').open=false;updateHelpStatus();if(!$('helpDialog').open)$('helpDialog').showModal();$('helpTitle').focus();}
  function startUITour(){closeDialogs();$('helpMenu').open=false;state.route='map';state.view='map';render();window.FutureTour.start({required:false});}

  function filterRow(key,label,options){return `<fieldset class="map-filter"><legend>${esc(U.titleCase(label))}</legend><div>${options.map(([value,title])=>`<button type="button" data-filter="${key}" data-value="${value}" aria-pressed="${state[key]===value}">${esc(U.titleCase(title))}</button>`).join('')}</div></fieldset>`;}
  function layerControls(){return `<section class="connection-controls" id="connectionControls" aria-label="Choose which connections to show"><label class="activity-check"><input type="checkbox" id="showActivities" ${state.activities?'checked':''}><span><i class="legend-dot shared"></i>Show Shared Activities</span></label><fieldset><legend><i class="legend-dot tech"></i>Show Technology</legend><div class="technology-options" role="group" aria-label="Technology visibility">${[['selected','Selected Person'],['all','Everyone'],['none','Hide']].map(([v,title])=>`<button type="button" data-tech-mode="${v}" aria-pressed="${state.technology===v}">${title}</button>`).join('')}</div></fieldset></section>`;}
  function themePanel(){
    if(state.panel==='person')return personPanel();if(state.panel==='connection')return connectionPanel();const t=themeRecord();
    return `<div class="theme-reading"><span class="eyebrow">${state.theme==='all'?'THE WORLD AROUND THESE PEOPLE':'WORLD THEME'}</span><h2 id="selectedTitle" tabindex="-1">${esc(state.theme==='all'?t.title:U.titleCase(t.title))}</h2>${t.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="world-reading-actions"><button type="button" data-truths class="text-button">WORLD TRUTHS ↗</button>${worldChatEnabled()?`<button type="button" data-world-chat="${state.theme}" class="primary-button world-chat-invite">ASK ABOUT ${state.theme==='all'?'2048':esc(t.title.toUpperCase())} ↗</button>`:''}</div></div>`;
  }

  function personPanel(){
    const p=people.get(state.profile),profile=E.profiles[p.id];
    return `<div class="person-reading" style="--person-color:${p.color}"><div class="sidebar-body">${panelBack()}<header class="sidebar-identity"><span class="sidebar-portrait">${portrait(p.id)}</span><div><span class="eyebrow">${p.age} / ${esc(U.titleCase(p.setting))}</span><h2 id="selectedTitle" tabindex="-1">${p.name}</h2><p class="sidebar-role">${esc(U.titleCase(p.role))}</p></div></header><p class="sidebar-summary">${esc(profile.summary)}</p><p class="sidebar-invitation">${esc(profile.invitation)}</p></div><div class="sidebar-actions"><button type="button" data-person="${p.id}" class="primary-button">${esc(profile.cta)}</button><button type="button" data-chat="${p.id}" class="outline-button">Chat With ${p.name}</button></div></div>`;
  }

  function panelBack(){return `<button type="button" class="panel-back" data-panel-world>${state.theme==='all'?'Back to the World in 2048':'Back to '+esc(U.titleCase(E.themes[state.theme].title))}</button>`;}
  function connectionPanel(){return `<div class="connection-reading" data-connection-type="${nodeById.get(state.selected)?.type||''}">${panelBack()}${connectionDetails(state.selected,'selectedTitle')}</div>`;}
  function educationFilters(){return `<fieldset class="map-filter education-filter"><legend>Education</legend><div>${[['all','All paths'],['school','School'],['technical','Technical'],['associate','Associate’s'],['college','College']].map(([v,label])=>`<button type="button" data-filter="education" data-value="${v}" aria-pressed="${state.education===v}">${esc(U.titleCase(label))}</button>`).join('')}</div></fieldset>`;}
  function zoomControls(){return `<div class="map-controls" ${state.view!=='map'?'hidden':''}><button type="button" data-zoom="out" aria-label="Zoom out">−</button><span id="zoomLabel">${Math.round(graphTransform.scale*100)}%</span><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-fit aria-label="Fit map">⛶</button></div>`;}
  function selectionBar(){
    const id=mapFocus();if(!id)return `${zoomControls()}<span><strong>All Connections</strong><small>Choose a person, theme, activity, or technology</small></span>`;
    const n=nodeById.get(id),p=people.get(id);
    return `${zoomControls()}${p?`<span class="selected-avatar">${portrait(p.id)}</span>`:`<span class="selected-node-symbol">${icon(iconFor(id))}</span>`}<span><strong>${esc(U.titleCase(p?.name||E.themes[id]?.title||n?.name||'All Connections'))}</strong><small>${esc(p?U.titleCase(p.role):n?.type==='system'?'World Theme':n?.type==='tech'?'Technology':'Shared Activity')}</small></span>`;
  }

  function renderMap(){return `<div class="map-layout"><section class="map-center"><header class="map-toolbar"><div><h1 id="mainTitle" tabindex="-1">Explore the World Map</h1></div><div class="map-view-actions"><button type="button" data-clear-map class="clear-selections">Clear Selections</button><div class="map-view-buttons" role="group" aria-label="View the connections"><button type="button" data-view="map" aria-pressed="${state.view==='map'}">MAP</button><button type="button" data-view="list" aria-pressed="${state.view==='list'}">LIST</button></div></div></header><div id="mapFilters" class="map-filters" aria-label="Focus on location, income, and education">${filterRow('setting','Where people live',[['all','All settings'],['suburb','Suburb'],['urban','Urban'],['rural','Rural']])}${filterRow('income','Income',[['all','All incomes'],['top','Top 1%'],['middle','Middle'],['lower','Lower']])}${educationFilters()}</div>${filterFeedback()}${layerControls()}<div class="map-theme-status"><span><i class="legend-dot system"></i>${state.theme==='all'?'Choose an orange theme tile in the map':esc(E.themes[state.theme].title)+' · notes appear beside the people'}</span>${state.theme!=='all'?'<button type="button" data-theme="all">CLEAR THEME ×</button>':''}</div><div class="map-canvas-wrap"><div id="graphViewport" class="graph-viewport" tabindex="0" aria-label="World connection map. Choose an orange theme or a person. Drag to move, use plus or minus to zoom, or switch to List."><div id="graphWorld" class="graph-world"><svg id="edges" class="edges" aria-hidden="true"></svg><div id="nodes"></div><div id="themeNotes"></div></div></div><div id="graphList" class="graph-list" hidden></div></div><div class="selected-person-bar" id="selectedPersonBar" aria-label="Selected connection">${selectionBar()}</div></section><aside class="theme-panel ${state.panel==='person'?'is-person-panel':''}" id="themePanel" aria-label="World theme description">${themePanel()}</aside></div>`;}

  const mapAnchors={wealth:[.17,.08],climate:[.5,.065],materials:[.83,.08],geography:[.123,.92],education:[.88,.92],leo:[.5,.26],sophia:[.19,.455],ken:[.815,.455],veronica:[.37,.71],catherine:[.635,.71],trucking:[.315,.26],vacation:[.69,.26],volunteer:[.5,.535],gardening:[.5,.74],kitchen:[.04,.21],autonomous:[.04,.405],robotics:[.04,.58],'v-glasses':[.04,.76],knee:[.96,.21],wearable:[.96,.58],'c-glasses':[.96,.76]};
  function graphData(){
    const v=$('graphViewport'),fixed=state.view==='map'&&v?.clientWidth>0&&v.clientHeight>0;
    $('mainView').classList.toggle('fixed-map-layout',fixed);
    const g=G.scene({selected:state.selected,activities:state.activities,technology:state.technology,aspect:v?.clientHeight?v.clientWidth/v.clientHeight:1.4});
    g.fixedLayout=fixed;g.nodeScale=1;
    g.fitScale=v?.clientWidth&&v.clientHeight?Math.min(v.clientWidth/g.width,v.clientHeight/g.height,3):1;
    if(fixed){g.width=v.clientWidth;g.height=v.clientHeight;g.fitScale=1;g.positions=new Map(g.nodes.map(n=>[n.id,{x:mapAnchors[n.id][0]*g.width,y:mapAnchors[n.id][1]*g.height}]));}
    return g;
  }
  function layoutFixedGraph(g){
    const world=$('graphWorld'),probe=document.createElement('div');
    probe.className='map-measurements';probe.setAttribute('aria-hidden','true');probe.inert=true;probe.style.visibility='hidden';
    probe.innerHTML=G.nodes.map(n=>nodeButton(n,{x:0,y:0})).join('')+'<div class="person-theme-note"><span></span><p></p></div>';world.appendChild(probe);
    const metrics=new Map([...probe.querySelectorAll('.graph-node')].map(n=>[n.dataset.select,{w:n.offsetWidth,h:n.offsetHeight,label:n.classList.contains('technology-node')?{w:n.querySelector('strong').offsetWidth,h:n.querySelector('strong').offsetHeight}:null}]));
    const note=probe.querySelector('.person-theme-note'),noteHeights=new Map();
    for(const theme of Object.values(E.themes))for(const [id,value] of Object.entries(theme.notes||{})){note.querySelector('p').textContent=value.text;noteHeights.set(id,Math.max(noteHeights.get(id)||0,note.offsetHeight));}
    const noteWidth=note.offsetWidth;probe.remove();
    const boxes=[];
    for(const n of G.nodes){const [x,y]=mapAnchors[n.id],m=metrics.get(n.id),at={x:x*g.width,y:y*g.height};
      boxes.push({...at,l:-m.w/2,r:m.w/2,t:-m.h/2,b:m.h/2});
      if(m.label)boxes.push({...at,l:-m.label.w/2,r:m.label.w/2,t:m.h/2+7,b:m.h/2+7+m.label.h});
      if(noteHeights.has(n.id))boxes.push({...at,l:-noteWidth/2,r:noteWidth/2,t:m.h/2+7,b:m.h/2+7+noteHeights.get(n.id)});
    }
    // Solve the first scale at which any two reserved rectangles would touch.
    // Captions for all themes and hidden layers are reserved, keeping every node stable.
    const firstContact=(a,b)=>{let low=0,high=Infinity;for(const [c,k] of [[a.x-b.x,a.l-b.r-5],[b.x-a.x,b.l-a.r-5],[a.y-b.y,a.t-b.b-5],[b.y-a.y,b.t-a.b-5]]){if(Math.abs(k)<1e-9){if(c>=0)return Infinity;}else if(k>0)high=Math.min(high,-c/k);else low=Math.max(low,-c/k);}return high>Math.max(0,low)?Math.max(0,low):Infinity;};
    let scale=2.25;const pad=Math.max(2,Math.min(g.width,g.height)*.005);
    for(const b of boxes){if(b.l<0)scale=Math.min(scale,(b.x-pad)/-b.l);if(b.r>0)scale=Math.min(scale,(g.width-pad-b.x)/b.r);if(b.t<0)scale=Math.min(scale,(b.y-pad)/-b.t);if(b.b>0)scale=Math.min(scale,(g.height-pad-b.y)/b.b);}
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)scale=Math.min(scale,firstContact(boxes[i],boxes[j]));
    g.nodeScale=Math.max(.025,scale*.985);world.style.setProperty('--map-node-scale',g.nodeScale);world.dataset.widgetScale=g.nodeScale.toFixed(4);
    for(const n of $('themeNotes').querySelectorAll('.person-theme-note')){const pos=g.positions.get(n.dataset.notePerson);n.style.left=pos.x+'px';n.style.top=(pos.y+(metrics.get(n.dataset.notePerson).h/2+7)*g.nodeScale)+'px';}
  }
  function nodeButton(n,pos,mini=false,selected=mapFocus()){
    const p=people.get(n.id),type=n.type,connected=n.id!==selected&&G.related(selected).includes(n.id);
    const focused=n.id===selected,color=p?.color||(type==='system'?'#F6A466':type==='shared'?'#ED008C':'#00B5E7');
    const label=U.titleCase(E.themes[n.id]?.title||n.label||n.name);
    return `<button type="button" class="graph-node ${p?'person-node':type==='tech'?'technology-node':'connection-node'} ${type} ${focused?'selected':connected?'is-connected':mini||!selected?'':'is-dimmed'} ${!mini&&p&&!passes(p)?'is-muted':''}" data-${mini?(p?'mini-person':'mini-node'):'select'}="${n.id}" style="left:${pos.x}px;top:${pos.y}px;--node-color:${color}" aria-pressed="${focused}" aria-label="${type==='system'?'Show Theme':p?'Select Person':'Explore'}: ${esc(label)}">${p?portrait(p.id):icon(iconFor(n.id))}<strong>${esc(label)}</strong>${p?`<small>${esc(U.titleCase(p.setting))}</small>`:''}</button>`;
  }
  function mapFocus(){return state.panel==='world'&&state.theme!=='all'?state.theme:state.selected;}
  function edgeHTML(g,selected){return [...g.edges].sort((a,b)=>Number(a.a===selected||a.b===selected)-Number(b.a===selected||b.b===selected)).map(e=>`<path d="${G.path(g.positions.get(e.a),g.positions.get(e.b),e.kind)}" data-edge-a="${e.a}" data-edge-b="${e.b}" class="${e.kind} ${!selected?'':e.a===selected||e.b===selected?'active':'unfocused'}"></path>`).join('');}
  function noteHTML(p,g){const n=E.themes[state.theme]?.notes[p.id];if(!n)return '';const pos=g.positions.get(p.id);return `<div class="person-theme-note ${passes(p)?'':'is-muted'}" style="left:${pos.x}px;top:${pos.y+109*g.nodeScale}px" data-note-person="${p.id}"><span>${esc(U.titleCase(E.themes[state.theme].title))}</span><p>${esc(n.text)}</p></div>`;}
  function drawGraph(fit=true){if(!$('graphViewport'))return;const g=graphData();$('graphWorld').classList.toggle('fixed-network',g.fixedLayout);$('graphWorld').style.setProperty('--map-node-scale',g.nodeScale);$('graphWorld').style.width=g.width+'px';$('graphWorld').style.height=g.height+'px';$('nodes').innerHTML=g.nodes.map(n=>nodeButton(n,g.positions.get(n.id))).join('');$('themeNotes').innerHTML=g.nodes.filter(n=>n.type==='person').map(p=>noteHTML(people.get(p.id),g)).join('');if(g.fixedLayout)layoutFixedGraph(g);$('edges').setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);$('edges').innerHTML=edgeHTML(g,mapFocus());
    $('graphList').innerHTML=['system','person','shared','tech'].map(type=>{const ns=g.nodes.filter(n=>n.type===type);return ns.length?`<h2>${{system:'World Themes',person:'People',shared:'Shared Activities',tech:'Technology'}[type]}</h2>${ns.map(n=>{const p=people.get(n.id),note=E.themes[state.theme]?.notes[n.id];return `<button type="button" data-select="${n.id}" class="${p&&!passes(p)?'is-muted':''}" aria-pressed="${n.id===mapFocus()}">${p?portrait(p.id):icon(iconFor(n.id))}<span><strong>${esc(U.titleCase(E.themes[n.id]?.title||n.label||n.name))}</strong><small>${esc(note?.text||p?.role||{system:'Choose this theme',shared:'Shared activity',tech:'Technology'}[type])}</small></span></button>`;}).join('')}`:'';}).join('');
    $('graphViewport').hidden=state.view!=='map';$('graphList').hidden=state.view!=='list';document.querySelector('.map-controls').hidden=state.view!=='map';
    document.querySelectorAll('#nodes .graph-node').forEach(b=>{const highlight=on=>{$('graphWorld').classList.toggle('is-hovering',on);document.querySelectorAll('#edges path').forEach(path=>path.classList.toggle('hovered',on&&(path.dataset.edgeA===b.dataset.select||path.dataset.edgeB===b.dataset.select)));};b.addEventListener('pointerenter',()=>highlight(true));b.addEventListener('pointerleave',()=>highlight(false));b.addEventListener('focus',()=>highlight(true));b.addEventListener('blur',()=>highlight(false));});if(fit)fitGraph();else transformGraph();}
  function transformGraph(){if(!$('graphWorld'))return;$('graphWorld').style.transform=`translate(${graphTransform.x}px,${graphTransform.y}px) scale(${graphTransform.scale})`;$('zoomLabel').textContent=Math.round(graphTransform.scale*100)+'%';}
  function fitGraph(){const v=$('graphViewport');if(!v?.clientWidth||!v.clientHeight)return;const g=graphData();graphTransform.scale=g.fitScale;graphTransform.x=(v.clientWidth-g.width*graphTransform.scale)/2;graphTransform.y=(v.clientHeight-g.height*graphTransform.scale)/2;transformGraph();}
  function focusTourExample(maxHeight){
    const v=$('graphViewport'),tile=document.querySelector('#nodes [data-select="climate"]'),note=document.querySelector('#themeNotes [data-note-person="leo"]');
    if(!v||!tile||!note)return;
    graphTransform={scale:1,x:0,y:0};transformGraph();
    const a=tile.getBoundingClientRect(),b=note.getBoundingClientRect(),r=v.getBoundingClientRect();
    const left=Math.min(a.left,b.left)-r.left,top=Math.min(a.top,b.top)-r.top,width=Math.max(a.right,b.right)-r.left-left,height=Math.max(a.bottom,b.bottom)-r.top-top;
    const scale=Math.min((v.clientWidth-42)/width,Math.max(120,Math.min(v.clientHeight-40,maxHeight))/height,4);
    graphTransform={scale,x:(v.clientWidth-width*scale)/2-left*scale,y:16-top*scale};transformGraph();
  }
  function zoom(factor,x,y){const v=$('graphViewport');if(!v)return;x=x??v.clientWidth/2;y=y??v.clientHeight/2;const old=graphTransform.scale,next=Math.max(.15,Math.min(2.5,old*factor));graphTransform.x=x-(x-graphTransform.x)*next/old;graphTransform.y=y-(y-graphTransform.y)*next/old;graphTransform.scale=next;transformGraph();}
  function attachMap(){drawGraph();observer?.disconnect();observer=new ResizeObserver(()=>{drawGraph();window.FutureTour?.refresh();});observer.observe($('graphViewport'));const v=$('graphViewport');v.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,tx:graphTransform.x,ty:graphTransform.y,moved:false};v.setPointerCapture(e.pointerId);});v.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;graphTransform.x=drag.tx+dx;graphTransform.y=drag.ty+dy;transformGraph();});const stop=()=>{if(drag?.moved){ignoreClick=true;setTimeout(()=>ignoreClick=false,0);}drag=null;};v.addEventListener('pointerup',stop);v.addEventListener('pointercancel',stop);v.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();const r=v.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.005),e.clientX-r.left,e.clientY-r.top);}}, {passive:false});v.addEventListener('keydown',e=>{if(e.target!==v)return;if(e.key==='0')fitGraph();else if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(.8);else if(/^Arrow/.test(e.key)){e.preventDefault();graphTransform.x+=e.key==='ArrowLeft'?35:e.key==='ArrowRight'?-35:0;graphTransform.y+=e.key==='ArrowUp'?35:e.key==='ArrowDown'?-35:0;transformGraph();}});}
  function miniMap(id){const g=G.profile(id);return `<section class="profile-mini-map"><header><div><h2>${people.get(id).name}’s Connections</h2><p>Choose A Person, Theme, Activity, Or Technology.</p></div><button type="button" data-back-map="${id}" class="outline-button">Back To World Map</button></header><div class="mini-map-frame"><div class="mini-map-world" style="width:${g.width}px;height:${g.height}px"><svg class="edges" viewBox="0 0 ${g.width} ${g.height}" aria-hidden="true">${edgeHTML(g,id)}</svg>${g.nodes.map(n=>nodeButton(n,g.positions.get(n.id),true,id)).join('')}</div></div></section>`;}
  function fitMini(){const f=document.querySelector('.mini-map-frame'),g=document.querySelector('.mini-map-world');if(f&&g){const scale=f.clientWidth/520;g.style.transform=`scale(${scale})`;f.style.height=600*scale+'px';}}
  function renderProfile(){const p=people.get(state.profile);return `<section class="profile-page ambient"><div class="profile-inner"><nav class="person-selector" aria-label="Choose a person">${W.characters.map(person=>`<button type="button" data-person="${person.id}" aria-pressed="${person.id===p.id}">${portrait(person.id)}<span>${person.name}</span></button>`).join('')}</nav><header class="profile-scene"><div class="profile-introduction"><span class="eyebrow">${p.age} / ${esc(p.ethnicity)} / ${p.gender}</span><h1 id="mainTitle" tabindex="-1">${p.name}</h1><p>${esc(U.titleCase(p.role))}</p><span class="profile-setting">${esc(U.titleCase(p.setting))}</span><p class="profile-greeting">${esc(E.profiles[p.id].summary)}</p><p class="profile-ask">${esc(E.profiles[p.id].askAbout)}</p><button type="button" data-chat="${p.id}" class="primary-button">CHAT WITH ${p.name.toUpperCase()} ↗</button></div><div class="profile-image-description">[${esc(p.setting)}. A scene from ${p.name}’s everyday life.]</div><div class="profile-figure">${portrait(p.id)}</div></header><div class="profile-information"><aside class="profile-map-column">${miniMap(p.id)}</aside><div class="profile-life-grid">${sectionKeys.map((key,i)=>`<article class="life-area" data-life-area="${key}"><span class="eyebrow">0${i+1} / ${esc(U.sections[key])}</span><h2>${sectionTitles[key]}</h2>${copy(p.sections[key])}</article>`).join('')}</div></div></div></section>`;}
  function renderTechnology(){return `<section class="technology-page ambient"><div class="page-inner"><header class="page-heading"><span class="eyebrow">2048 / EVERYDAY OBJECTS</span><h1 id="mainTitle" tabindex="-1">Learn the Technology</h1><p>What the technology does, and what it changes for the people who use it.</p></header><div class="artifact-grid">${W.artifacts.map(a=>`<article class="artifact-card"><div class="artifact-image" aria-hidden="true">${scene(a.scene)}<span class="artifact-symbol">${icon(iconFor(a.id))}</span></div><div><h2>${esc(a.title)}</h2>${copy(a.text)}${connectionPeople(a.id,true)}</div></article>`).join('')}</div><section class="event-callout"><span class="eyebrow">KEEP EXPLORING 2048</span><h2>Learn About Additional Worlds, People, and Technologies of 2048</h2><p>Explore the one-pager, magazine, and graphic novel from the Future World Sprint.</p><a href="#/about" data-route="about" class="primary-button">About the Event</a></section></div></section>`;}

  function renderAbout(){return `<section class="about-page"><div class="page-inner"><header class="page-heading"><span class="eyebrow">TANG / FUTURE WORLD SPRINT</span><h1 id="mainTitle" tabindex="-1">About the Event</h1><p>Other ways to explore this possible future.</p></header><div class="event-deliverables">${[['The one-pager','One-page overview. Front and optional back.'],['Magazine of the future','Magazine pages and a link to the full publication.'],['Graphic novel','A story narrative set in 2048.']].map(([title,description])=>`<section><h2>${title}</h2><div class="deliverable-placeholder"><span>[${description}]</span></div></section>`).join('')}</div></div></section>`;}
  function render(push=true,keepScroll=false){if(!ready)return;const scroll=$('mainView').scrollTop;observer?.disconnect();const views={map:renderMap,people:renderProfile,technology:renderTechnology,quiz:()=>window.FutureQuiz.render(),about:renderAbout};$('mainView').innerHTML=(views[state.route]||renderMap)();$('mainView').className=state.route==='map'?'map-main':'scroll-main';document.querySelectorAll('.hub-header [data-route]').forEach(b=>b.setAttribute('aria-current',b.dataset.route===state.route?'page':'false'));if(state.route==='map')attachMap();window.FutureQuiz?.watchLayout?.(state.route==='quiz');if(state.route==='people'){fitMini();observer=new ResizeObserver(fitMini);observer.observe(document.querySelector('.profile-map-column'));}if(push)history.pushState({future:true,...state},'',`#/${state.route}/${state.route==='people'?state.profile:state.theme}`);$('mainView').scrollTop=keepScroll?scroll:0;if(!keepScroll)$('mainTitle')?.focus({preventScroll:true});window.FutureTour?.refresh();}
  function route(name){closeDialogs();state.route=['map','people','technology','quiz','about'].includes(name)?name:'map';if(name==='people'&&people.has(state.selected))state.profile=state.selected;render();window.FutureTour?.onAction('navigation');}
  function clearMap({focus=true}={}){
    closeDialogs();$('helpMenu').open=false;window.FutureTour?.cancel();
    Object.assign(state,{route:'map',theme:'all',setting:'all',income:'all',education:'all',selected:null,panel:'world',activities:true,technology:'all'});
    render();if(focus)document.querySelector('[data-clear-map]')?.focus({preventScroll:true});else $('selectedTitle')?.focus({preventScroll:true});
    $('announcement').textContent='Selections cleared. Showing all people, themes, shared activities, and technologies.';
  }

  function setTheme(id){state.panel='world';state.theme=themes.has(id)?id:'all';if(state.route!=='map')state.route='map';render();window.FutureTour?.onAction('theme');$('announcement').textContent=state.theme==='all'?'Showing all connections':E.themes[state.theme].title+'. Compare the notes beside each person.';}
  function select(id){
    if(!nodeById.has(id))return;closeDialogs();const n=nodeById.get(id);
    if(n.type==='system'){setTheme(id);return;}
    state.selected=id;state.panel=people.has(id)?'person':'connection';
    if(people.has(id))state.profile=id;
    if(state.route!=='map'){state.route='map';render();}
    else{drawGraph(false);$('selectedPersonBar').innerHTML=selectionBar();$('themePanel').innerHTML=themePanel();}
    $('themePanel').classList.toggle('is-person-panel',state.panel==='person');
    $('themePanel').setAttribute('aria-label',(people.get(id)?.name||U.titleCase(n.name))+' Information');$('themePanel').scrollTop=0;
    $('selectedTitle')?.focus({preventScroll:true});
    if(people.has(id))window.FutureTour?.onAction('person');
    if((matchMedia('(max-width:900px)').matches||matchMedia('(min-width:900px) and (min-height:1200px) and (max-aspect-ratio:4/5)').matches)&&!window.FutureTour?.isActive()){
      const view=$('mainView');view.scrollTop+=$('themePanel').getBoundingClientRect().top-view.getBoundingClientRect().top;
    }
    window.FutureTour?.refresh();
  }
  function openPerson(id){if(!people.has(id))return;closeDialogs();state.profile=id;state.selected=id;state.route='people';render();}
  function connectionDetails(id,headingId){
    const n=nodeById.get(id),artifact=W.artifacts.find(a=>a.id===id),record=window.FutureConnectionData[id];
    const text=artifact?.text||record?.text||'';
    const theme=n.type==='system'?E.themes[id]:null;
    const detail=theme?theme.paragraphs.map(p=>`<p>${esc(p)}</p>`).join(''):`<div class="connection-placeholder">${icon(iconFor(id))}${scene(sceneNodes[id]||'network')}</div>${copy(text)}${connectionPeople(id)}`;
    return `<span class="eyebrow">${theme?'WORLD THEME':n.type==='tech'?'EVERYDAY TECHNOLOGY':'SHARED ACTIVITY'}</span><h2 id="${headingId}" tabindex="-1">${esc(U.titleCase(theme?.title||artifact?.title||record?.title||n.name))}</h2>${detail}`;
  }

  function openConnection(id){const n=nodeById.get(id);if(!n)return;if(n.type==='person'){openPerson(id);return;}if(n.type==='system'&&state.route!=='people'){setTheme(id);return;}$('connectionContent').innerHTML=connectionDetails(id,'connectionTitle');$('connectionDialog').showModal();$('connectionTitle').focus({preventScroll:true});}
  const chatJobs=new Map(),chatUnread=new Set(),chatQueue=[],CHAT_WAIT_MS=20000;
  let chatProgressTimer=0,activeChatJob=null,chatEpoch=0;
  function messageHTML(m){return `<article class="chat-message ${m.role} ${m.kind||''}"${m.kind==='generated'?' data-ai-generated="true" data-ai-model="SmolLM2-360M-Instruct"':''}>${m.role==='assistant'?`<small>${m.kind==='generated'?'IMAGINED CONVERSATION':m.kind==='guardrail'?'CONVERSATION BOUNDARY':m.kind==='unavailable'?'CONVERSATION UPDATE':m.world?'FROM THE WORLD TRUTHS':'PREPARED CHARACTER REPLY'}</small>`:''}${m.note?`<p class="chat-reply-note">${esc(m.note)}</p>`:''}${copy(m.text)}${m.crisis?'<nav class="chat-crisis-links" aria-label="United States crisis support"><a href="tel:988?oai_link_source=model_response_hotline">Call 988 (US)</a><a href="sms:988?oai_link_source=model_response_hotline">Text 988 (US)</a><a href="https://988lifeline.org/chat/?oai_link_source=model_response_hotline" target="_blank" rel="noopener noreferrer">988 online chat (US)</a></nav>':''}${m.sources?.length?contextSources(m.sources):''}</article>`;}
  function clearChatProgress(){clearInterval(chatProgressTimer);chatProgressTimer=0;$('chatThinking')?.remove();$('chatForm').removeAttribute('aria-busy');}
  function updateChatBadges(){
    document.querySelectorAll('[data-chat-switch]').forEach(button=>{
      const id=button.dataset.chatSwitch,job=chatJobs.get(id),label=job?(job.phase==='queued'?'Queued':'Replying'):chatUnread.has(id)?'New reply':'';
      const badge=button.querySelector('.chat-person-status');if(badge){badge.textContent=label;badge.hidden=!label;}
      button.dataset.replyState=job?(job.phase==='queued'?'queued':'replying'):chatUnread.has(id)?'unread':'';
      button.setAttribute('aria-label',chatIdentity(id).name+(label?', '+label.toLowerCase():''));
    });
  }
  function updateChatProgress(){
    const job=chatJobs.get(chatPerson);if(!job||!$('chatThinkingText'))return;
    const elapsed=Math.max(0,Math.floor((Date.now()-job.submittedAt)/1000)),name=chatIdentity(job.id).name;
    const text=job.phase==='queued'?'Waiting for the current reply. A prepared answer will appear if this question reaches 20 seconds.':(job.writing?name+' is writing a reply.':name+' is preparing a reply.')+' You can explore elsewhere. At 20 seconds, a prepared answer is used if needed.';
    if($('chatThinkingText').textContent!==text)$('chatThinkingText').textContent=text;
    $('chatElapsed').textContent='Elapsed: '+Math.min(elapsed,20)+' / 20 seconds';
  }

  function syncChatUI(){
    updateChatBadges();chatBusy=chatJobs.has(chatPerson);
    if(chatBusy&&$('chatDialog').open){
      if(!$('chatThinking'))$('chatMessages').insertAdjacentHTML('beforeend','<div id="chatThinking" class="chat-pending"><span class="runtime-indicator" aria-hidden="true"></span><div><p id="chatThinkingText" role="status" aria-live="polite"></p><small id="chatElapsed" aria-hidden="true"></small></div><button type="button" class="chat-stop" data-cancel-reply>CANCEL QUESTION</button></div>');
      $('chatForm').setAttribute('aria-busy','true');updateChatProgress();if(!chatProgressTimer)chatProgressTimer=setInterval(updateChatProgress,1000);
    }else clearChatProgress();
    $('chatForm').hidden=!supportsAI();$('chatInput').disabled=!supportsAI();$('chatForm').querySelector('button').disabled=chatBusy||!supportsAI();$('chatChips').querySelectorAll('[data-chat-topic]').forEach(button=>button.disabled=chatBusy);
  }
  function updateRuntime(){
    if(!supportsAI()){
      $('chatRuntime').dataset.state='browser-unavailable';$('chatRuntime').classList.remove('is-loading');$('chatRuntime').classList.add('is-unavailable');$('chatRuntime').setAttribute('aria-live','polite');
      $('chatRuntime').innerHTML='<span class="browser-status-icon" aria-hidden="true">!</span><div class="chat-browser-message"><strong>AI chat unavailable in this browser</strong><span>Use Edge to ask questions, or choose a prepared topic below.</span></div><div class="chat-browser-actions"><a id="openScreenInEdge" data-open-edge class="outline-button">USE EDGE</a><button id="copyScreenButton" type="button" data-copy-screen class="text-button">COPY LINK</button></div><p id="edgeCopyStatus" role="status"></p><details id="edgeFallback" hidden><summary>Edge didn’t open?</summary><p>Edge must be installed. Copy this link and paste it into Edge.</p><label class="sr-only" for="edgeScreenURL">Current screen link</label><input id="edgeScreenURL" type="text" readonly></details>';updateScreenLink();syncChatUI();return;
    }
    $('chatRuntime').classList.remove('is-unavailable');
    const rt=window.FuturePersonaRuntime.status(),message=rt.state==='ready'?'AI model online and available.':rt.state==='loading'?'AI model starting. You can choose a topic while you wait.':'AI model offline. You can still choose a topic below.';
    if($('chatRuntime').dataset.state===rt.state){$('chatRuntime').querySelector('.chat-model-status').textContent=message;syncChatUI();return;}
    $('chatRuntime').dataset.state=rt.state;
    $('chatRuntime').innerHTML=`<span class="runtime-indicator ${rt.state==='ready'?'is-ready':''}" aria-hidden="true"></span><span class="chat-model-status">${esc(message)}</span>${['idle','error'].includes(rt.state)?`<button type="button" data-load-runtime>${rt.state==='error'?'TRY AI AGAIN':'START AI'}</button>`:rt.state==='loading'?'<button type="button" data-stop-runtime>CANCEL LOADING</button>':''}${rt.state==='error'||rt.state==='loading'?'<button type="button" data-chat-help>HELP</button>':''}`;
    $('chatRuntime').classList.toggle('is-loading',rt.state==='loading');$('chatRuntime').setAttribute('aria-live','polite');syncChatUI();
  }
  function openChat(id,themeId){
    if(id==='world'&&!worldChatEnabled())return;const p=chatIdentity(id);if(!p)return;
    if(chatPerson)drafts.set(chatPerson,$('chatInput').value);clearChatProgress();chatPerson=id;chatUnread.delete(id);
    if(id==='world'&&themeId!==undefined)worldChatTheme=themes.has(themeId)?themeId:'all';
    const isWorld=id==='world',cast=[...(worldChatEnabled()?[worldGuide]:[]),...W.characters];
    $('chatDialog').classList.toggle('is-world-chat',isWorld);
    $('chatDialog').classList.toggle('is-prepared-only',!supportsAI());
    $('chatDialog').querySelector('.chat-footnote').textContent=supportsAI()?aiFootnote:'Prepared replies from the 2048 stories. Open Microsoft Edge to ask your own questions.';
    const chatLabel=supportsAI()?(isWorld?'FICTIONAL WORLD / AI GUIDE':'FICTIONAL PERSON / AI PORTRAYAL'):'FICTIONAL WORLD / PREPARED TOPICS';
    $('chatHeader').innerHTML=`<div class="chat-identity"><span class="chat-avatar">${isWorld?icon('network'):portrait(id)}</span><div><span class="eyebrow">${chatLabel}</span><h2 id="chatTitle">${p.name}</h2><p class="chat-character-role">${esc(p.role)}${isWorld?'':`<br>${p.age} · ${esc(p.setting)}`}</p></div><button type="button" data-close-chat class="close-button" aria-label="Close chat">×</button></div><nav class="chat-people" aria-label="Choose a conversation">${cast.map(person=>`<button type="button" data-chat-switch="${person.id}" aria-pressed="${person.id===id}"><span>${person.id==='world'?'2048':person.name}<small class="chat-person-status" hidden></small></span></button>`).join('')}</nav>${isWorld?`<div class="world-chat-lenses"><label>World theme<select id="worldChatTheme"><option value="all">The whole world</option>${W.themes.map(t=>`<option value="${t.id}" ${worldChatTheme===t.id?'selected':''}>${esc(E.themes[t.id].title)}</option>`).join('')}</select></label><label>Focus lens<select id="worldChatFocus"><option value="all">Follow my question</option>${window.FutureKnowledge.data.focusAreas.map(f=>`<option value="${f.id}" ${worldChatFocus===f.id?'selected':''}>${esc(f.title)}</option>`).join('')}</select></label></div>`:''}`;
    const entries=chats.get(id)||[];
    const intro=supportsAI()?(isWorld?'Ask how life, work, health, and community fit together in this imagined future. I can compare people and themes, using the World Truths and supporting research.':window.FutureChatReplies[id].intro):(isWorld?'Choose a topic below to explore this world through the World Truths and supporting research.':window.FutureChatReplies[id].intro);
    $('chatMessages').innerHTML=`<div class="chat-intro"><p>${esc(intro)}</p></div>`+entries.map(messageHTML).join('');
    const chips=isWorld?[['trust','Who gets to opt out of tracking?'],['home','How does community change?'],['work','What happens to work and learning?']]:window.FuturePersonas.characters[id].chips;
    $('chatChips').innerHTML=chips.map(([topic,title])=>`<button type="button" data-chat-topic="${topic}">${esc(title)} ↗</button>`).join('')+'<button type="button" class="chat-clear" data-clear-chat aria-label="Clear this conversation">Clear history</button>';
    chatTopic=[...entries].reverse().find(m=>m.topic)?.topic||null;$('chatInput').value=drafts.get(id)||'';
    $('chatInput').maxLength=isWorld?700:400;$('chatInput').placeholder=isWorld?'Ask about this world or compare perspectives…':'Ask about everyday life…';
    document.querySelector('label[for="chatInput"]').textContent=isWorld?'Ask about the imagined world of 2048':'Ask a question about this character’s future';
    if(!$('chatDialog').open)$('chatDialog').showModal();updateRuntime();focusChatAction();$('chatMessages').scrollTop=$('chatMessages').scrollHeight;
    if(window.FuturePersonaRuntime.status().state==='idle')window.FuturePersonaRuntime.load().catch(()=>{});
    if(!noticeSeen){noticeSeen=true;lastNoticeAt=Date.now();scheduleNotice();}else if(Date.now()-lastNoticeAt>=NOTICE_INTERVAL)showBreakReminder();
  }

  function conversationUpdate(text){return {kind:'unavailable',text,sources:[],topic:null};}
  function recordChatReply(id,response,worldContext){
    const messages=chats.get(id)||[],entry={role:'assistant',...response,...(id==='world'&&worldContext?{worldContext}:{})};messages.push(entry);chats.set(id,messages.slice(-40));
    if(id===chatPerson&&$('chatDialog').open){chatTopic=response.topic||chatTopic;$('chatThinking')?.remove();$('chatMessages').insertAdjacentHTML('beforeend',messageHTML(entry));$('chatMessages').scrollTop=$('chatMessages').scrollHeight;}
    else{chatUnread.add(id);$('announcement').textContent=chatIdentity(id).name+'’s reply is ready in their conversation.';}
    updateChatBadges();
  }
  function isCurrentChatJob(job){return job.epoch===chatEpoch&&chatJobs.get(job.id)===job;}
  function preparedChatReply(id,question,topic,previousTopic,worldContext,note){
    const reply=window.FutureConversation.prepared(id,question,id==='world'?(topic||worldContext.focusId):topic,previousTopic,worldContext);
    return {...reply,...(note?{note}:{})};
  }
  function completeChatJob(job,response){
    if(!isCurrentChatJob(job))return;clearTimeout(job.timer);chatJobs.delete(job.id);recordChatReply(job.id,response,job.worldContext);syncChatUI();
  }
  function expireChatJob(job){
    if(!isCurrentChatJob(job))return;
    completeChatJob(job,preparedChatReply(job.id,job.question,null,job.previousTopic,job.worldContext,'AI reached the 20-second limit. Here is relevant prepared background.'));
    if(activeChatJob===job&&job.phase==='reply')window.FuturePersonaRuntime.cancel({timedOut:true});
    if(!activeChatJob)void pumpChatQueue();
  }
  async function pumpChatQueue(){
    if(activeChatJob)return;
    let job;while(chatQueue.length){const candidate=chatQueue.shift();if(isCurrentChatJob(candidate)){job=candidate;break;}}if(!job)return;
    activeChatJob=job;const rt=window.FuturePersonaRuntime;
    try{
      const remaining=CHAT_WAIT_MS-(Date.now()-job.submittedAt);if(remaining<=0){expireChatJob(job);return;}
      let response;
      if(rt.status().state==='ready'){
        const context=window.FutureConversation.buildContext(job.id,job.question,job.history,job.worldContext);
        if(context){
          job.phase='reply';syncChatUI();const text=await rt.generate(context,{timeoutMs:remaining});if(!isCurrentChatJob(job))return;
          const checked=window.FutureConversation.finish(job.id,job.question,text,context);
          response=checked||preparedChatReply(job.id,job.question,null,job.previousTopic,job.worldContext,'A prepared reply is shown because AI could not finish a suitable answer.');
        }
      }
      if(!isCurrentChatJob(job))return;
      completeChatJob(job,response||preparedChatReply(job.id,job.question,null,job.previousTopic,job.worldContext,'AI is unavailable. Here is relevant prepared background.'));
    }catch(error){
      if(isCurrentChatJob(job))completeChatJob(job,preparedChatReply(job.id,job.question,null,job.previousTopic,job.worldContext,error.code==='reply-timeout'?'AI reached the 20-second limit. Here is relevant prepared background.':'AI could not finish this reply. Here is relevant prepared background.'));
    }finally{
      clearTimeout(job.timer);
      if(chatJobs.get(job.id)===job)chatJobs.delete(job.id);
      if(activeChatJob===job){activeChatJob=null;syncChatUI();void pumpChatQueue();}
    }
  }
  function cancelChatReply(){
    const job=chatJobs.get(chatPerson);if(!job)return;clearTimeout(job.timer);chatJobs.delete(job.id);
    if(activeChatJob===job&&job.phase==='reply')window.FuturePersonaRuntime.cancel();
    recordChatReply(job.id,conversationUpdate('Question cancelled. You can ask another question or choose a topic.'));syncChatUI();
  }
  function clearChatHistory(){
    if(!chatPerson)return;
    const id=chatPerson,job=chatJobs.get(id);
    if(job){
      clearTimeout(job.timer);chatJobs.delete(id);
      const queued=chatQueue.indexOf(job);if(queued!==-1)chatQueue.splice(queued,1);
      if(activeChatJob===job&&job.phase==='reply')window.FuturePersonaRuntime.cancel();
    }
    chats.delete(id);drafts.delete(id);chatUnread.delete(id);chatTopic=null;$('chatInput').value='';
    openChat(id);$('announcement').textContent='Conversation history cleared.';
  }
  function cancelAllChatReplies(text){
    const ids=[...chatJobs.keys()];chatJobs.forEach(job=>clearTimeout(job.timer));chatEpoch++;chatJobs.clear();chatQueue.length=0;activeChatJob=null;
    ids.forEach(id=>recordChatReply(id,conversationUpdate(text)));syncChatUI();
  }
  function stopConversation(){cancelAllChatReplies('AI conversation stopped. Prepared replies are available immediately.');window.FuturePersonaRuntime.dispose();}
  function clearChatSession(){chatJobs.forEach(job=>clearTimeout(job.timer));chatEpoch++;chatJobs.clear();chatQueue.length=0;activeChatJob=null;chatUnread.clear();clearChatProgress();window.FuturePersonaRuntime.clearSession();}
  async function sendChat(question,topic){
    if(!chatPerson||!question.trim()||chatJobs.has(chatPerson)||(!supportsAI()&&!topic))return;
    const submittedAt=Date.now(),id=chatPerson,messages=chats.get(id)||[],history=messages.slice(),previousTopic=[...history].reverse().find(m=>m.topic)?.topic||null;
    const worldContext={themeId:worldChatTheme,focusId:worldChatFocus};
    messages.push({role:'user',text:question,...(id==='world'?{worldContext}:{})});chats.set(id,messages);$('chatMessages').insertAdjacentHTML('beforeend',messageHTML(messages.at(-1)));$('chatInput').value='';drafts.set(id,'');
    const scope=window.FutureConversation.scope(id,question,history,previousTopic);let response=scope.reply||null;messages.at(-1).blocked=!scope.allowed;
    if(!response){
      const immediate=topic||['greeting','introduction'].includes(scope.category),notReady=window.FuturePersonaRuntime.status().state!=='ready';
      if(immediate||notReady)response=preparedChatReply(id,question,topic,previousTopic,worldContext,notReady&&!immediate?'AI is getting ready or unavailable. Here is relevant prepared background.':null);
    }
    if(response){recordChatReply(id,response,worldContext);syncChatUI();return;}
    const job={id,question,history,previousTopic,epoch:chatEpoch,phase:'queued',submittedAt,writing:false,worldContext};
    job.timer=setTimeout(()=>expireChatJob(job),CHAT_WAIT_MS);chatJobs.set(id,job);chatQueue.push(job);syncChatUI();$('chatMessages').scrollTop=$('chatMessages').scrollHeight;void pumpChatQueue();
  }
  document.addEventListener('click',e=>{const b=e.target.closest('button,a[data-route],a[data-open-edge]');if(!b||ignoreClick)return;
    if(b.hasAttribute('data-open-edge')){if(!updateScreenLink())e.preventDefault();}
    else if(b.hasAttribute('data-world-chat')){closeDialogs();openChat('world',b.dataset.worldChat);}
    else if(b.hasAttribute('data-copy-screen'))void copyScreenLink();
    else if(b.hasAttribute('data-browser-help'))showBrowserOptions();
    else if(b.hasAttribute('data-dismiss-reminder')){$('chatReminder').hidden=true;focusChatAction();}
    else if(b.hasAttribute('data-ai-details'))showAIDetails();
    else if(b.hasAttribute('data-close-ai-details'))$('aiDetailsDialog').close();
    else if(b.hasAttribute('data-chat-help'))showChatHelp();
    else if(b.hasAttribute('data-close-help'))$('helpDialog').close();
    else if(b.hasAttribute('data-retry-cpu')){window.FuturePersonaRuntime.retryCPU().catch(()=>{});updateHelpStatus();}
    else if(b.hasAttribute('data-ui-tour'))startUITour();
    else if(b.hasAttribute('data-leo-intro')){closeDialogs();$('helpMenu').open=false;window.FutureOnboarding.start();}
    else if(b.dataset.route){e.preventDefault();route(b.dataset.route);}
    else if(b.hasAttribute('data-clear-map'))clearMap();
    else if(b.hasAttribute('data-panel-world')){$('themePanel').classList.remove('is-person-panel');state.panel='world';drawGraph(false);$('themePanel').innerHTML=themePanel();$('themePanel').setAttribute('aria-label','World Theme Description');$('selectedTitle')?.focus({preventScroll:true});}
    else if(b.dataset.theme)setTheme(b.dataset.theme);
    else if(b.dataset.mapTheme)setTheme(b.dataset.mapTheme);
    else if(b.dataset.filter){state[b.dataset.filter]=b.dataset.value;render();window.FutureTour?.onAction('filter');}
    else if(b.dataset.select)select(b.dataset.select);
    else if(b.dataset.backMap){state.view='map';select(b.dataset.backMap);}
    else if(b.dataset.person)openPerson(b.dataset.person);
    else if(b.dataset.miniPerson)openPerson(b.dataset.miniPerson);
    else if(b.dataset.miniNode)openConnection(b.dataset.miniNode);
    else if(b.dataset.connection)openConnection(b.dataset.connection);
    else if(b.hasAttribute('data-close-connection'))$('connectionDialog').close();
    else if(b.dataset.view){state.view=b.dataset.view;render();}
    else if(b.dataset.techMode){state.technology=b.dataset.techMode;render();window.FutureTour?.onAction('layer');}
    else if(b.dataset.zoom)zoom(b.dataset.zoom==='in'?1.2:1/1.2);
    else if(b.hasAttribute('data-fit'))fitGraph();
    else if(b.hasAttribute('data-tour')){closeDialogs();window.FutureOnboarding.start();}
    else if(b.hasAttribute('data-quiz'))route('quiz');
    else if(b.hasAttribute('data-truths'))showTruths();
    else if(b.hasAttribute('data-close-truths'))$('truthsDialog').close();
    else if(b.dataset.chat)openChat(b.dataset.chat);
    else if(b.dataset.chatSwitch)openChat(b.dataset.chatSwitch);
    else if(b.hasAttribute('data-close-chat'))$('chatDialog').close();
    else if(b.dataset.chatTopic){if(chatPerson==='world')sendChat(b.textContent.replace(' ↗',''),b.dataset.chatTopic);else{const item=window.FuturePersonas.characters[chatPerson].chips.find(x=>x[0]===b.dataset.chatTopic);sendChat(item[1],item[0]);}}
    else if(b.hasAttribute('data-load-runtime'))window.FuturePersonaRuntime.load().catch(()=>{});
    else if(b.hasAttribute('data-stop-runtime'))stopConversation();
    else if(b.hasAttribute('data-clear-chat'))clearChatHistory();
    else if(b.hasAttribute('data-cancel-reply'))cancelChatReply();
  });
  document.addEventListener('change',e=>{if(e.target.id==='worldChatTheme')worldChatTheme=e.target.value;else if(e.target.id==='worldChatFocus')worldChatFocus=e.target.value;else if(e.target.id==='showActivities'){state.activities=e.target.checked;render();window.FutureTour?.onAction('layer');}});
  $('brandHome').addEventListener('click',()=>route('map'));
  $('chatForm').addEventListener('submit',e=>{e.preventDefault();sendChat($('chatInput').value);});
  $('chatDialog').addEventListener('close',()=>{clearChatProgress();if(chatPerson)drafts.set(chatPerson,$('chatInput').value);});
  $('aiDetailsDialog').addEventListener('close',focusChatAction);
  window.addEventListener('pagehide',()=>cancelAllChatReplies('This page was left before the reply finished. Load conversation and ask again.'));
  window.addEventListener('persona-thinking',e=>{if(activeChatJob&&isCurrentChatJob(activeChatJob)){activeChatJob.writing=/Writing/.test(e.detail);updateChatProgress();}});
  window.addEventListener('persona-runtime-status',()=>{if($('chatDialog').open)updateRuntime();if($('helpDialog').open)updateHelpStatus();});
  $('truthsContent').innerHTML=W.truths.map(t=>`<details id="truth-${t.id}" ${t.id==='global'?'open':''}><summary>${esc(t.title)}</summary>${copy(t.text)}</details>`).join('');
  document.querySelectorAll('[data-world-chat]').forEach(b=>b.hidden=!worldChatEnabled());
  document.addEventListener('click',e=>{if(!e.target.closest('#helpMenu'))$('helpMenu').open=false;});

  window.addEventListener('popstate',e=>{if(!ready||!e.state?.future)return;Object.assign(state,e.state);render(false);});
  window.FutureApp={arrive({tour=true}={}){ready=true;$('experience').hidden=false;$('experience').inert=false;document.body.classList.remove('intro-active');document.querySelector('.skip').removeAttribute('tabindex');Object.assign(state,{route:'map',theme:'all',setting:'all',income:'all',education:'all',panel:'world',selected:null,profile:'leo',view:tour?'map':matchMedia('(max-width:600px)').matches?'list':'map',activities:true,technology:'all'});render();window.FuturePersonaRuntime.load().catch(()=>{});if(tour)window.FutureTour.start({required:true});},hide(){ready=false;closeDialogs();observer?.disconnect();window.FutureTour?.cancel();$('experience').hidden=true;$('experience').inert=true;},reset(){clearTimeout(noticeTimer);noticeSeen=false;lastNoticeAt=0;$('chatReminder').hidden=true;window.FutureTour?.cancel();window.FutureQuiz?.reset();clearChatSession();chats.clear();drafts.clear();chatPerson=null;chatTopic=null;chatBusy=false;clearChatProgress();$('chatMessages').innerHTML='';$('chatInput').value='';this.hide();$('mainView').innerHTML='';document.body.classList.remove('is-idle');history.replaceState(null,'',location.pathname+location.search);},state:()=>({...state}),isReady:()=>ready,hasPendingReplies:()=>chatJobs.size>0,select,route,resetMap:clearMap,openChat,focusTourExample,fitMap:fitGraph,showTourExample(){state.theme='climate';state.selected='leo';state.panel='world';state.view='map';render();}};
  function restoreHandoff(snapshot){
    if(!snapshot)return;window.FutureIntro.skip();window.FutureQuiz.restore(snapshot.quiz);
    Object.assign(state,snapshot.page);noticeSeen=false;lastNoticeAt=0;render();
    worldChatTheme=snapshot.chat.theme;worldChatFocus=snapshot.chat.focus;
    openChat(snapshot.chat.id,snapshot.chat.theme);
    $('mainView').scrollTop=snapshot.scroll.main;if($('themePanel'))$('themePanel').scrollTop=snapshot.scroll.panel;
  }
  window.addEventListener('DOMContentLoaded',()=>restoreHandoff(incomingHandoff),{once:true});
})();
