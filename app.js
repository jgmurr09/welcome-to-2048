(function(){
  'use strict';
  const W=window.FutureWorld,U=window.WorldUI,G=window.FutureConnections,E=window.FuturePresentation,{esc,portrait,copy,scene,icon}=U,$=id=>document.getElementById(id);
  const people=U.people,themes=new Map(W.themes.map(t=>[t.id,t])),nodeById=G.byId;
  const educationGroups={veronica:'school',sophia:'technical',ken:'associate',leo:'college',catherine:'college'};
  const state={education:'all',route:'map',theme:'all',setting:'all',income:'all',selected:'leo',profile:'leo',panel:'world',view:'map',activities:true,technology:'selected'};
  const sectionKeys=['work','home','health','tech','third'],sectionTitles={work:'Work, income & education',home:'Home & family',health:'Diet & health',tech:'Technology',third:'Third spaces'};
  const sourceNodes={trucking:['leo','work'],vacation:['ken','third'],volunteer:['veronica','third'],gardening:['veronica','third'],robotics:['sophia','tech'],'v-glasses':['veronica','tech'],'c-glasses':['catherine','tech']};
  const sceneNodes={trucking:'logistics',vacation:'lakes',volunteer:'care',gardening:'garden',robotics:'care','v-glasses':'education','c-glasses':'garden',kitchen:'garden',autonomous:'care',wearable:'health',knee:'knee'};
  const chats=new Map(),drafts=new Map();let ready=false,observer=null,graphTransform={scale:1,x:0,y:0},drag=null,ignoreClick=false,chatPerson=null,chatTopic=null,chatBusy=false,chatToken=0;
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const iconFor=id=>/glasses/.test(id)?'glasses':id;
  function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
  function passes(p){return (state.setting==='all'||p.placeGroup===state.setting)&&(state.income==='all'||p.incomeGroup===state.income)&&(state.education==='all'||educationGroups[p.id]===state.education);}
  function themeRecord(){return E.themes[state.theme]||E.world;}
  function sourceDisclosure(){return '';}
  function filterRow(key,label,options){return `<fieldset class="map-filter"><legend>${label}</legend><div>${options.map(([value,title])=>`<button type="button" data-filter="${key}" data-value="${value}" aria-pressed="${state[key]===value}">${title}</button>`).join('')}</div></fieldset>`;}
  function layerControls(){return `<section class="connection-controls" id="connectionControls" aria-label="Choose which connections to show"><label class="activity-check"><input type="checkbox" id="showActivities" ${state.activities?'checked':''}><span><i class="legend-dot shared"></i>Show shared activities</span></label><fieldset><legend><i class="legend-dot tech"></i>Show technology</legend><div class="technology-options" role="group" aria-label="Technology visibility">${[['selected','Selected person'],['all','Everyone'],['none','Hide']].map(([v,title])=>`<button type="button" data-tech-mode="${v}" aria-pressed="${state.technology===v}">${title}</button>`).join('')}</div></fieldset></section>`;}
  function themePanel(){if(state.panel==='person')return personPanel();const t=themeRecord();return `<div class="theme-reading"><span class="eyebrow">${state.theme==='all'?'THE WORLD AROUND THESE PEOPLE':'WORLD THEME'}</span><h2 id="selectedTitle" tabindex="-1">${esc(t.title)}</h2>${t.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${sourceDisclosure(t.sources)}<button type="button" data-truths class="text-button">READ THE WORLD TRUTHS <span>↗</span></button></div>`;}
  function personPanel(){const p=people.get(state.profile);return `<div class="person-reading"><button type="button" class="panel-back" data-panel-world>← ${state.theme==='all'?'THE WORLD IN 2048':esc(E.themes[state.theme].title.toUpperCase())}</button><header><span class="sidebar-portrait">${portrait(p.id)}</span><span class="eyebrow">${p.age} / ${esc(p.setting)}</span><h2 id="selectedTitle" tabindex="-1">${p.name}</h2><p class="sidebar-role">${esc(p.role)}</p></header><p class="sidebar-summary">${esc(window.FutureChatReplies[p.id].intro)}</p><div class="sidebar-facts">${['work','home','third'].map(key=>`<section><h3>${sectionTitles[key]}</h3><p>${esc(window.FutureChatReplies[p.id][key].text)}</p></section>`).join('')}</div><div class="sidebar-actions"><button type="button" data-person="${p.id}" class="primary-button">MEET ${p.name.toUpperCase()} ↗</button><button type="button" data-chat="${p.id}" class="outline-button">CHAT WITH ${p.name.toUpperCase()} ↗</button></div></div>`;}
  function educationFilters(){return `<fieldset class="map-filter education-filter"><legend>Education</legend><div>${[['all','All paths'],['school','School'],['technical','Technical'],['associate','Associate’s'],['college','College']].map(([v,label])=>`<button type="button" data-filter="education" data-value="${v}" aria-pressed="${state.education===v}">${label}</button>`).join('')}</div></fieldset>`;}
  function zoomControls(){return `<div class="map-controls" ${state.view!=='map'?'hidden':''}><button type="button" data-zoom="out" aria-label="Zoom out">−</button><span id="zoomLabel">${Math.round(graphTransform.scale*100)}%</span><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-fit aria-label="Fit map">⛶</button></div>`;}
  function selectionBar(){const p=people.get(state.selected)||people.get(state.profile);return `${zoomControls()}<span class="selected-avatar">${portrait(p.id)}</span><span><strong>${p.name}</strong><small>${esc(p.role)}</small></span><button type="button" data-person="${p.id}" class="text-button">MEET ${p.name.toUpperCase()} ↗</button><button type="button" data-chat="${p.id}" class="selected-chat" aria-label="Chat with ${p.name}">${icon('chat')}</button>`;}
  function renderMap(){return `<div class="map-layout"><section class="map-center"><header class="map-toolbar"><div><h1 id="mainTitle" tabindex="-1">Explore the World</h1></div><button type="button" data-tour class="tour-trigger">LEO’S WALKTHROUGH <span>↗</span></button><div class="map-view-buttons" role="group" aria-label="View the connections"><button type="button" data-view="map" aria-pressed="${state.view==='map'}">MAP</button><button type="button" data-view="list" aria-pressed="${state.view==='list'}">LIST</button></div></header><div id="mapFilters" class="map-filters" aria-label="Focus on location, income, and education">${filterRow('setting','Where people live',[['all','All settings'],['suburb','Suburb'],['urban','Urban'],['rural','Rural']])}${filterRow('income','Income',[['all','All incomes'],['top','Top 1%'],['middle','Middle'],['lower','Lower']])}${educationFilters()}</div>${layerControls()}<div class="map-theme-status"><span><i class="legend-dot system"></i>${state.theme==='all'?'Choose an orange theme tile in the map':esc(E.themes[state.theme].title)+' · notes appear beside the people'}</span>${state.theme!=='all'?'<button type="button" data-theme="all">CLEAR THEME ×</button>':''}${state.setting!=='all'||state.income!=='all'||state.education!=='all'?'<span class="filter-count">'+W.characters.filter(passes).length+' people in focus</span>':''}</div><div class="map-canvas-wrap"><div id="graphViewport" class="graph-viewport" tabindex="0" aria-label="World connection map. Choose an orange theme or a person. Drag to move, use plus or minus to zoom, or switch to List."><div id="graphWorld" class="graph-world"><svg id="edges" class="edges" aria-hidden="true"></svg><div id="nodes"></div><div id="themeNotes"></div></div></div><div id="graphList" class="graph-list" hidden></div></div><div class="selected-person-bar" id="selectedPersonBar" aria-label="Selected person">${selectionBar()}</div></section><aside class="theme-panel" id="themePanel" aria-label="World theme description">${themePanel()}</aside></div>`;}
  function graphData(){
    const v=$('graphViewport'),desktop=state.view==='map'&&matchMedia('(min-width:1200px) and (min-aspect-ratio:1/1)').matches&&v?.clientWidth>0&&v.clientHeight>0;
    $('mainView').classList.toggle('desktop-map-readability',desktop);
    const g=G.scene({selected:state.selected,activities:state.activities,technology:state.technology,aspect:v?.clientHeight?v.clientWidth/v.clientHeight:1.4});
    g.readableDesktop=desktop;g.nodeScale=1;g.padding=0;
    g.fitScale=v?.clientWidth&&v.clientHeight?Math.min(v.clientWidth/g.width,v.clientHeight/g.height,3):1;
    if(desktop){
      g.width=v.clientWidth;g.height=v.clientHeight;g.fitScale=1;
      const clamp=(min,n,max)=>Math.max(min,Math.min(max,n)),pad=g.height<450?10:16,rail=clamp(90,g.width*.095,136),left=pad+rail+12,inner=g.width-left*2,room=clamp(0,(g.height-380)/300,1);
      const card=clamp(104,inner/5-10,260),name=clamp(13,card*.1,18+6*room),portrait=clamp(24,card*.25,42+22*room);
      g.desktop={pad,rail,left,inner,card,header:clamp(60,card*.46,74+46*room),name,portrait,note:clamp(13,card*.09,15+5*room),theme:Math.min(260,inner/3-20),themeMax:16+4*room,activity:Math.min(250,(inner-36)/4),activityMax:15+3*room,techSize:clamp(44,rail*.5,44+20*room),techLabel:clamp(12,g.width*.0115,14+4*room)};
    }
    return g;
  }
  function desktopMapStyle(g){
    const world=$('graphWorld'),m=g.desktop;
    const values={'card-width':m.card,'card-height':m.header,'name-size':m.name,'setting-size':Math.max(10.5,m.name*.76),'portrait-size':m.portrait,'note-size':m.note,'theme-width':m.theme,'theme-size':Math.max(13,Math.min(m.themeMax,m.theme*.078)),'activity-width':m.activity,'activity-size':Math.max(12.5,Math.min(m.activityMax,m.activity*.079)),'tech-size':m.techSize,'tech-icon-size':m.techSize*.57,'tech-label-width':m.rail,'tech-label-size':m.techLabel};
    for(const [key,value] of Object.entries(values))world.style.setProperty('--map-'+key,value+'px');
  }
  function layoutDesktopGraph(g){
    const m=g.desktop,buttons=new Map([...$('nodes').querySelectorAll('.graph-node')].map(n=>[n.dataset.select,n])),notes=new Map([...$('themeNotes').querySelectorAll('.person-theme-note')].map(n=>[n.dataset.notePerson,n]));
    const height=ids=>Math.max(0,...ids.map(id=>buttons.get(id)?.offsetHeight||0));
    // Reserve the tallest supplied note before a theme is chosen, so the map stays in place.
    const probe=document.createElement('div');probe.className='person-theme-note';probe.setAttribute('aria-hidden','true');probe.style.visibility='hidden';probe.innerHTML='<span></span><p></p>';$('themeNotes').appendChild(probe);
    let noteHeight=0;
    for(const theme of Object.values(E.themes))for(const note of Object.values(theme.notes||{})){probe.querySelector('p').textContent=note.text;noteHeight=Math.max(noteHeight,probe.offsetHeight);}
    probe.remove();
    const peopleOrder=['sophia','veronica','leo','catherine','ken'],top=['wealth','climate','materials'],bottom=['geography','education'],activities=['trucking','volunteer','gardening','vacation'];
    const topH=height(top),bottomH=height(bottom),personH=height(peopleOrder),activityH=Math.max(height(activities),44),noteGap=6;
    const occupied=topH+personH+noteGap+noteHeight+activityH+bottomH+m.pad*2;
    const gap=Math.max(4,(g.height-occupied)/3),personTop=m.pad+topH+gap,noteTop=personTop+personH+noteGap,activityY=noteTop+noteHeight+gap+activityH/2;
    const set=(id,x,y)=>{if(!buttons.has(id))return;g.positions.set(id,{x,y});buttons.get(id).style.left=x+'px';buttons.get(id).style.top=y+'px';};
    top.forEach((id,i)=>set(id,m.left+m.inner*(i+.5)/3,m.pad+topH/2));
    peopleOrder.forEach((id,i)=>{const x=m.left+m.inner*(i+.5)/5;set(id,x,personTop+personH/2);if(notes.has(id)){notes.get(id).style.left=x+'px';notes.get(id).style.top=noteTop+'px';}});
    activities.forEach((id,i)=>set(id,m.left+m.inner*(i+.5)/4,activityY));
    bottom.forEach((id,i)=>set(id,m.left+m.inner*(i?.76:.24),g.height-m.pad-bottomH/2));
    const rail=(ids,right)=>{const extent=Math.max(m.techSize,...ids.map(id=>{const b=buttons.get(id);return b?b.offsetHeight+4+b.querySelector('strong').offsetHeight:0;})),step=(g.height-m.pad*2-extent)/(ids.length-1);ids.forEach((id,i)=>set(id,right?g.width-m.pad-m.rail/2:m.pad+m.rail/2,m.pad+m.techSize/2+i*step));};
    rail(['kitchen','autonomous','robotics','v-glasses'],false);rail(['knee','wearable','c-glasses'],true);
    g.clusterBottom=new Map(peopleOrder.map(id=>[id,notes.has(id)?noteTop+notes.get(id).offsetHeight:personTop+personH]));
    g.personTop=personTop;g.personHeight=personH;
    $('graphWorld').dataset.layoutOverflow=String(occupied+12>g.height);
  }
  function edgePoint(g,id,other){
    const p=g.positions.get(id);if(!g.readableDesktop||!people.has(id))return p;
    const q=g.positions.get(other),type=nodeById.get(other)?.type;
    if(type==='tech')return {x:p.x+(q.x<p.x?-g.desktop.card/2:g.desktop.card/2),y:p.y};
    return {x:p.x,y:q.y<p.y?g.personTop:g.clusterBottom.get(id)};
  }
  function nodeButton(n,pos,mini=false,selected=state.selected){const p=people.get(n.id),type=n.type,themeActive=type==='system'&&state.theme===n.id;return `<button type="button" class="graph-node ${p?'person-node':type==='tech'?'technology-node':'connection-node'} ${type} ${n.id===selected||themeActive?'selected':''} ${!mini&&p&&!passes(p)?'is-muted':''}" data-${mini?(p?'mini-person':'mini-node'):'select'}="${n.id}" style="left:${pos.x}px;top:${pos.y}px;--node-color:${p?.color||(type==='system'?'#F6A466':type==='shared'?'#ED008C':'#00B5E7')}" aria-pressed="${n.id===selected||themeActive}" aria-label="${type==='system'?'Show theme':p?'Select person':'Explore'}: ${esc(E.themes[n.id]?.title||n.name)}">${p?portrait(p.id):icon(iconFor(n.id))}<strong>${esc(E.themes[n.id]?.title||n.label||n.name)}</strong>${p?`<small>${esc(p.setting)}</small>`:''}</button>`;}
  function edgeHTML(g,selected){return g.edges.map(e=>`<path d="${G.path(edgePoint(g,e.a,e.b),edgePoint(g,e.b,e.a),e.kind)}" data-edge-a="${e.a}" data-edge-b="${e.b}" class="${e.kind} ${e.a===selected||e.b===selected?'active':''} ${e.a===state.theme||e.b===state.theme?'theme-active':''}"></path>`).join('');}
  function noteHTML(p,g){const n=E.themes[state.theme]?.notes[p.id];if(!n)return '';const pos=g.positions.get(p.id);return `<div class="person-theme-note ${passes(p)?'':'is-muted'}" style="left:${pos.x}px;top:${pos.y+109*g.nodeScale}px" data-note-person="${p.id}"><span>${esc(E.themes[state.theme].title)}</span><p>${esc(n.text)}</p></div>`;}
  function drawGraph(fit=true){if(!$('graphViewport'))return;const g=graphData();$('graphWorld').classList.toggle('desktop-readable-map',g.readableDesktop);$('graphWorld').style.setProperty('--map-node-scale',g.nodeScale);if(g.readableDesktop)desktopMapStyle(g);$('graphWorld').style.width=g.width+'px';$('graphWorld').style.height=g.height+'px';$('nodes').innerHTML=g.nodes.map(n=>nodeButton(n,g.positions.get(n.id))).join('');$('themeNotes').innerHTML=g.nodes.filter(n=>n.type==='person').map(p=>noteHTML(people.get(p.id),g)).join('');if(g.readableDesktop)layoutDesktopGraph(g);$('edges').setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);$('edges').innerHTML=edgeHTML(g,state.selected);
    $('graphList').innerHTML=['system','person','shared','tech'].map(type=>{const ns=g.nodes.filter(n=>n.type===type);return ns.length?`<h2>${{system:'World themes',person:'People',shared:'Shared activities',tech:'Technology'}[type]}</h2>${ns.map(n=>{const p=people.get(n.id),note=E.themes[state.theme]?.notes[n.id];return `<button type="button" data-select="${n.id}" class="${p&&!passes(p)?'is-muted':''}" aria-pressed="${n.id===state.selected||n.id===state.theme}">${p?portrait(p.id):icon(iconFor(n.id))}<span><strong>${esc(E.themes[n.id]?.title||n.label||n.name)}</strong><small>${esc(note?.text||p?.role||{system:'Choose this theme',shared:'Shared activity',tech:'Technology'}[type])}</small></span></button>`;}).join('')}`:'';}).join('');
    $('graphViewport').hidden=state.view!=='map';$('graphList').hidden=state.view!=='list';document.querySelector('.map-controls').hidden=state.view!=='map';
    document.querySelectorAll('#nodes .graph-node').forEach(b=>{const highlight=on=>{$('graphWorld').classList.toggle('is-hovering',on);document.querySelectorAll('#edges path').forEach(path=>path.classList.toggle('hovered',on&&(path.dataset.edgeA===b.dataset.select||path.dataset.edgeB===b.dataset.select)));};b.addEventListener('pointerenter',()=>highlight(true));b.addEventListener('pointerleave',()=>highlight(false));b.addEventListener('focus',()=>highlight(true));b.addEventListener('blur',()=>highlight(false));});if(fit)fitGraph();else transformGraph();}
  function transformGraph(){if(!$('graphWorld'))return;$('graphWorld').style.transform=`translate(${graphTransform.x}px,${graphTransform.y}px) scale(${graphTransform.scale})`;$('zoomLabel').textContent=Math.round(graphTransform.scale*100)+'%';}
  function fitGraph(){const v=$('graphViewport');if(!v?.clientWidth||!v.clientHeight)return;const g=graphData();graphTransform.scale=g.fitScale;graphTransform.x=(v.clientWidth-g.width*graphTransform.scale)/2;graphTransform.y=(v.clientHeight-g.height*graphTransform.scale)/2;transformGraph();}
  function zoom(factor,x,y){const v=$('graphViewport');if(!v)return;x=x??v.clientWidth/2;y=y??v.clientHeight/2;const old=graphTransform.scale,next=Math.max(.15,Math.min(2.5,old*factor));graphTransform.x=x-(x-graphTransform.x)*next/old;graphTransform.y=y-(y-graphTransform.y)*next/old;graphTransform.scale=next;transformGraph();}
  function attachMap(){drawGraph();observer?.disconnect();observer=new ResizeObserver(()=>{drawGraph();window.FutureTour?.refresh();});observer.observe($('graphViewport'));const v=$('graphViewport');v.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,tx:graphTransform.x,ty:graphTransform.y,moved:false};v.setPointerCapture(e.pointerId);});v.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;graphTransform.x=drag.tx+dx;graphTransform.y=drag.ty+dy;transformGraph();});const stop=()=>{if(drag?.moved){ignoreClick=true;setTimeout(()=>ignoreClick=false,0);}drag=null;};v.addEventListener('pointerup',stop);v.addEventListener('pointercancel',stop);v.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();const r=v.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.005),e.clientX-r.left,e.clientY-r.top);}}, {passive:false});v.addEventListener('keydown',e=>{if(e.target!==v)return;if(e.key==='0')fitGraph();else if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(.8);else if(/^Arrow/.test(e.key)){e.preventDefault();graphTransform.x+=e.key==='ArrowLeft'?35:e.key==='ArrowRight'?-35:0;graphTransform.y+=e.key==='ArrowUp'?35:e.key==='ArrowDown'?-35:0;transformGraph();}});}
  function miniMap(id){const g=G.profile(id);return `<section class="profile-mini-map"><header><h2>${people.get(id).name}’s connections</h2><p>Choose a person, theme, activity, or technology.</p></header><div class="mini-map-frame"><div class="mini-map-world" style="width:${g.width}px;height:${g.height}px"><svg class="edges" viewBox="0 0 ${g.width} ${g.height}" aria-hidden="true">${edgeHTML(g,id)}</svg>${g.nodes.map(n=>nodeButton(n,g.positions.get(n.id),true,id)).join('')}</div></div></section>`;}
  function fitMini(){const f=document.querySelector('.mini-map-frame'),g=document.querySelector('.mini-map-world');if(f&&g){const scale=f.clientWidth/520;g.style.transform=`scale(${scale})`;f.style.height=600*scale+'px';}}
  function renderProfile(){const p=people.get(state.profile);return `<section class="profile-page ambient"><div class="profile-inner"><nav class="person-selector" aria-label="Choose a person">${W.characters.map(person=>`<button type="button" data-person="${person.id}" aria-pressed="${person.id===p.id}">${portrait(person.id)}<span>${person.name}</span></button>`).join('')}</nav><header class="profile-scene"><div class="profile-introduction"><span class="eyebrow">${p.age} / ${esc(p.ethnicity)} / ${p.gender}</span><h1 id="mainTitle" tabindex="-1">${p.name}</h1><p>${esc(p.role)}</p><span class="profile-setting">${esc(p.setting)}</span><button type="button" data-chat="${p.id}" class="primary-button">CHAT WITH ${p.name.toUpperCase()} ↗</button></div><div class="profile-image-description">[${esc(p.setting)}. A scene from ${p.name}’s everyday life.]</div><div class="profile-figure">${portrait(p.id)}</div></header><div class="profile-information"><aside class="profile-map-column">${miniMap(p.id)}</aside><div class="profile-life-grid">${sectionKeys.map((key,i)=>`<article class="life-area" data-life-area="${key}"><span class="eyebrow">0${i+1} / ${esc(U.sections[key])}</span><h2>${sectionTitles[key]}</h2>${copy(p.sections[key])}</article>`).join('')}</div></div></div></section>`;}
  function renderTechnology(){return `<section class="technology-page ambient"><div class="page-inner"><header class="page-heading"><span class="eyebrow">2048 / EVERYDAY OBJECTS</span><h1 id="mainTitle" tabindex="-1">Explore the Technology</h1></header><div class="artifact-grid">${W.artifacts.map(a=>`<article class="artifact-card"><button type="button" class="artifact-image" data-connection="${a.id}" aria-label="Explore ${esc(a.title)}">${scene(a.scene)}<span class="artifact-symbol">${icon(a.id)}</span></button><div><h2>${esc(a.title)}</h2>${copy(a.text)}<button type="button" data-connection="${a.id}" class="text-button">SEE CONNECTIONS ↗</button></div></article>`).join('')}</div><div class="team-placeholder"><h2>More technology from the sprint</h2><div>[Additional team technology concepts will go here.]</div></div></div></section>`;}
  function renderAbout(){return `<section class="about-page"><div class="page-inner"><header class="page-heading"><span class="eyebrow">TANG / FUTURE WORLD SPRINT</span><h1 id="mainTitle" tabindex="-1">About the Event</h1><p>Other ways to explore this possible future.</p></header><div class="event-deliverables">${[['The one-pager','One-page overview. Front and optional back.'],['Magazine of the future','Magazine pages and a link to the full publication.'],['Graphic novel','A story narrative set in 2048.']].map(([title,description])=>`<section><h2>${title}</h2><div class="deliverable-placeholder"><span>[${description}]</span></div></section>`).join('')}</div><p class="asset-credit">Uicons by <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener">Flaticon</a>.</p></div></section>`;}
  function render(push=true,keepScroll=false){if(!ready)return;const scroll=$('mainView').scrollTop;observer?.disconnect();const views={map:renderMap,people:renderProfile,technology:renderTechnology,quiz:()=>window.FutureQuiz.render(),about:renderAbout};$('mainView').innerHTML=(views[state.route]||renderMap)();$('mainView').className=state.route==='map'?'map-main':'scroll-main';document.querySelectorAll('.hub-header [data-route]').forEach(b=>b.setAttribute('aria-current',b.dataset.route===state.route?'page':'false'));if(state.route==='map')attachMap();if(state.route==='people'){fitMini();observer=new ResizeObserver(fitMini);observer.observe(document.querySelector('.profile-map-column'));}if(push)history.pushState({future:true,...state},'',`#/${state.route}/${state.route==='people'?state.profile:state.theme}`);$('mainView').scrollTop=keepScroll?scroll:0;if(!keepScroll)$('mainTitle')?.focus({preventScroll:true});window.FutureTour?.refresh();}
  function route(name){closeDialogs();state.route=['map','people','technology','quiz','about'].includes(name)?name:'map';if(name==='people'&&people.has(state.selected))state.profile=state.selected;render();window.FutureTour?.onAction('navigation');}
  function setTheme(id){state.panel='world';state.theme=themes.has(id)?id:'all';if(state.route!=='map')state.route='map';render();window.FutureTour?.onAction('theme');$('announcement').textContent=state.theme==='all'?'Showing all connections':E.themes[state.theme].title+'. Compare the notes beside each person.';}
  function select(id){if(!nodeById.has(id))return;closeDialogs();const n=nodeById.get(id);if(n.type==='system'){setTheme(id);return;}state.selected=id;if(people.has(id)){state.profile=id;state.panel='person';if(state.route!=='map'){state.route='map';render();}else{drawGraph(false);$('selectedPersonBar').innerHTML=selectionBar();$('themePanel').innerHTML=themePanel();$('themePanel').setAttribute('aria-label',people.get(id).name+' information');$('themePanel').scrollTop=0;}window.FutureTour?.onAction('person');if(matchMedia('(max-width:900px)').matches&&!window.FutureTour?.isActive()){const view=$('mainView');view.scrollTop+=$('themePanel').getBoundingClientRect().top-view.getBoundingClientRect().top;}}else{if(state.route!=='map'){state.route='map';render();}else drawGraph(false);openConnection(id);}window.FutureTour?.refresh();}
  function openPerson(id){if(!people.has(id))return;closeDialogs();state.profile=id;state.selected=id;state.route='people';render();}
  function openConnection(id){const n=nodeById.get(id);if(!n)return;if(n.type==='person'){openPerson(id);return;}if(n.type==='system'){setTheme(id);return;}const artifact=W.artifacts.find(a=>a.id===id),pair=sourceNodes[id],text=artifact?.text||(pair?people.get(pair[0]).sections[pair[1]]:''),ids=artifact?[`artifacts.${id}`]:pair?[`characters.${pair[0]}.sections.${pair[1]}`]:[];const ps=G.related(id).filter(i=>people.has(i));$('connectionContent').innerHTML=`<span class="eyebrow">${n.type==='tech'?'EVERYDAY TECHNOLOGY':'SHARED ACTIVITY'}</span><h2 id="connectionTitle" tabindex="-1">${esc(n.name)}</h2><div class="connection-placeholder">${icon(iconFor(id))}${scene(sceneNodes[id]||'network')}</div>${copy(text)}${ps.length?`<h3>Connected people</h3><div class="connection-people">${ps.map(i=>`<button type="button" data-person="${i}">${portrait(i)}<span>${people.get(i).name}</span></button>`).join('')}</div>`:'<p class="unassigned-note">A personal owner is not specified for this concept.</p>'}${ids.length?sourceDisclosure(ids):''}`;$('connectionDialog').showModal();$('connectionTitle').focus({preventScroll:true});}
  let chatProgressTimer=0,chatProgress=null;
  function messageHTML(m){return `<article class="chat-message ${m.role} ${m.kind||''}">${m.role==='assistant'?`<small>${m.kind==='generated'?'IMAGINED CONVERSATION':m.kind==='guardrail'?'CONVERSATION BOUNDARY':m.kind==='unavailable'?'CONVERSATION UPDATE':'IN THEIR OWN WORDS'}</small>`:''}${copy(m.text)}${m.sources?.length?sourceDisclosure(m.sources):''}</article>`;}
  function clearChatProgress(){clearInterval(chatProgressTimer);chatProgressTimer=0;chatProgress=null;$('chatThinking')?.remove();$('chatForm').removeAttribute('aria-busy');$('chatChips').querySelectorAll('button').forEach(button=>button.disabled=chatBusy);}
  function updateChatProgress(){
    if(!chatProgress||!$('chatThinkingText'))return;
    const elapsed=Math.max(0,Math.floor((Date.now()-chatProgress.started)/1000)),name=people.get(chatPerson)?.name||'The character';
    let text;
    if(chatProgress.phase==='loading')text='Your question is saved and will send when the model is ready. '+window.FuturePersonaRuntime.status().message;
    else if(elapsed>=90)text=name+' is still preparing a reply. If it reaches two minutes, the reply will stop automatically. You can cancel now.';
    else if(elapsed>=30)text='Still working on your question. This browser can take a minute or two. You can cancel at any time.';
    else text=(chatProgress.writing?name+' is writing a reply.':name+' is preparing a reply.')+' Responses can take a minute or two in this browser.';
    if($('chatThinkingText').textContent!==text)$('chatThinkingText').textContent=text;
    $('chatElapsed').textContent='Elapsed: '+Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
  }
  function startChatProgress(phase){
    if(chatProgress?.phase===phase){updateChatProgress();return;}
    clearChatProgress();chatProgress={phase,started:Date.now(),writing:false};
    $('chatMessages').insertAdjacentHTML('beforeend','<div id="chatThinking" class="chat-pending"><span class="runtime-indicator" aria-hidden="true"></span><div><p id="chatThinkingText" role="status" aria-live="polite"></p><small id="chatElapsed" aria-hidden="true"></small></div><button type="button" class="chat-stop" data-cancel-reply>CANCEL REPLY</button></div>');
    $('chatForm').setAttribute('aria-busy','true');updateChatProgress();chatProgressTimer=setInterval(updateChatProgress,1000);
    $('chatMessages').scrollTop=$('chatMessages').scrollHeight;
  }
  function updateRuntime(){
    const rt=window.FuturePersonaRuntime.status(),message=rt.state==='loading'?rt.message+' Your question can wait here until loading finishes. Topic buttons give prepared replies.':rt.message;
    if($('chatRuntime').dataset.state===rt.state){$('chatRuntime').querySelector('span:nth-child(2)').textContent=message;updateChatProgress();return;}
    $('chatRuntime').dataset.state=rt.state;
    $('chatRuntime').innerHTML=`<span class="runtime-indicator ${rt.state==='ready'?'is-ready':''}"></span><span>${esc(message)}</span>${['idle','error'].includes(rt.state)?`<button type="button" data-load-runtime>${rt.state==='error'?'RETRY CONVERSATION':'LOAD CONVERSATION'} <small>~275 MB</small></button>`:rt.state==='loading'?'<button type="button" data-stop-runtime>CANCEL LOADING</button>':rt.state==='ready'?'<button type="button" data-stop-runtime>TOPIC REPLIES ONLY</button>':''}`;
    $('chatRuntime').classList.toggle('is-loading',rt.state==='loading');$('chatRuntime').setAttribute('aria-live','polite');updateChatProgress();
  }
  function openChat(id){const p=people.get(id);if(!p)return;chatToken++;window.FuturePersonaRuntime.cancel();chatBusy=false;clearChatProgress();if(chatPerson)drafts.set(chatPerson,$('chatInput').value);chatPerson=id;chatTopic=null;$('chatHeader').innerHTML=`<div class="chat-identity"><span class="chat-avatar">${portrait(id)}</span><div><span class="eyebrow">A CONVERSATION IN 2048</span><h2 id="chatTitle">${p.name}</h2><p class="chat-character-role">${esc(p.role)}<br>${p.age} · ${esc(p.setting)}</p></div><button type="button" data-close-chat class="close-button" aria-label="Close chat">×</button></div><p class="chat-person-label">WHO WOULD YOU LIKE TO TALK TO?</p><nav class="chat-people" aria-label="Choose who to talk to">${W.characters.map(p=>`<button type="button" data-chat-switch="${p.id}" aria-pressed="${p.id===id}">${portrait(p.id)}<span>${p.name}</span></button>`).join('')}</nav>`;const entries=chats.get(id)||[];$('chatMessages').innerHTML=`<div class="chat-intro"><p>${esc(window.FutureChatReplies[id].intro)}</p></div>`+entries.map(messageHTML).join('');$('chatChips').innerHTML=window.FuturePersonas.characters[id].chips.map(([topic,title])=>`<button type="button" data-chat-topic="${topic}">${esc(title)} ↗</button>`).join('');chatTopic=[...entries].reverse().find(m=>m.topic)?.topic||null;$('chatInput').value=drafts.get(id)||'';$('chatForm').querySelector('button').disabled=false;updateRuntime();if(!$('chatDialog').open)$('chatDialog').showModal();$('chatInput').focus();$('chatMessages').scrollTop=$('chatMessages').scrollHeight;if(window.FuturePersonaRuntime.status().state==='idle')window.FuturePersonaRuntime.load().catch(()=>{});}
  function conversationUpdate(text){return {kind:'unavailable',text,sources:[],topic:null};}
  function recordChatReply(id,messages,response){chatTopic=response.topic||chatTopic;const entry={role:'assistant',...response};messages.push(entry);chats.set(id,messages.slice(-40));$('chatMessages').insertAdjacentHTML('beforeend',messageHTML(entry));}
  function cancelChatReply(){
    const wasBusy=chatBusy;chatToken++;chatBusy=false;window.FuturePersonaRuntime.dispose();clearChatProgress();$('chatForm').querySelector('button').disabled=false;
    if(wasBusy&&chatPerson)recordChatReply(chatPerson,chats.get(chatPerson)||[],conversationUpdate('Reply cancelled. Load conversation to try again, or choose a topic for a prepared reply.'));
  }
  async function sendChat(question,topic){
    if(!chatPerson||!question.trim()||chatBusy)return;
    const id=chatPerson,token=++chatToken,rt=window.FuturePersonaRuntime,messages=chats.get(id)||[];
    chatBusy=true;messages.push({role:'user',text:question});chats.set(id,messages);
    $('chatMessages').insertAdjacentHTML('beforeend',messageHTML(messages.at(-1)));$('chatInput').value='';drafts.set(id,'');$('chatForm').querySelector('button').disabled=true;
    try{
      const history=messages.slice(0,-1),scope=window.FutureConversation.scope(id,question,history,chatTopic);
      let response=scope.allowed?null:scope.reply;
      if(!response){
        const prepared=window.FutureConversation.answer(id,question,topic,chatTopic,history);
        if(topic||scope.category==='greeting'||prepared.kind==='generated')response=prepared;
      }
      if(!response){
        if(rt.status().state==='loading'){startChatProgress('loading');await rt.load();if(token!==chatToken||id!==chatPerson)return;}
        if(rt.status().state==='ready'){
          const context=window.FutureConversation.buildContext(id,question,history);
          if(context){
            startChatProgress('reply');const text=await rt.generate(context);if(token!==chatToken||id!==chatPerson)return;
            const checked=window.FutureConversation.finish(id,question,text,context);
            response=checked?.kind==='generated'?checked:conversationUpdate('I couldn’t finish a useful answer to that question. Try asking it another way, or choose a topic for a prepared reply.');
          }
        }
        if(!response)response=conversationUpdate(rt.status().state==='local'?'Open the hosted website for open conversation. The topic buttons give prepared replies here.':'The conversation model isn’t ready. Choose LOAD CONVERSATION or RETRY CONVERSATION above, then ask again. Topic buttons give prepared replies.');
      }
      if(token!==chatToken||id!==chatPerson)return;
      recordChatReply(id,messages,response);
    }catch(error){
      if(token===chatToken&&id===chatPerson){
        const text=error.code==='reply-timeout'?'That reply took too long, so I stopped it. Choose RETRY CONVERSATION to reload, then ask again. Topic buttons give prepared replies.':error.code==='load-timeout'?'The conversation model took too long to load. Choose RETRY CONVERSATION to try again. Your question is still shown above.':'The conversation model couldn’t finish this reply. Retry conversation above, or choose a topic for a prepared reply.';
        recordChatReply(id,messages,conversationUpdate(text));
      }
    }finally{
      if(token===chatToken){chatBusy=false;clearChatProgress();$('chatForm').querySelector('button').disabled=false;$('chatMessages').scrollTop=$('chatMessages').scrollHeight;}
    }
  }
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||ignoreClick)return;
    if(b.dataset.route)route(b.dataset.route);
    else if(b.hasAttribute('data-panel-world')){state.panel='world';$('themePanel').innerHTML=themePanel();$('themePanel').setAttribute('aria-label','World theme description');}
    else if(b.dataset.theme)setTheme(b.dataset.theme);
    else if(b.dataset.mapTheme)setTheme(b.dataset.mapTheme);
    else if(b.dataset.filter){state[b.dataset.filter]=b.dataset.value;render();window.FutureTour?.onAction('filter');}
    else if(b.dataset.select)select(b.dataset.select);
    else if(b.dataset.person)openPerson(b.dataset.person);
    else if(b.dataset.miniPerson)openPerson(b.dataset.miniPerson);
    else if(b.dataset.miniNode){if(nodeById.get(b.dataset.miniNode)?.type==='system')setTheme(b.dataset.miniNode);else openConnection(b.dataset.miniNode);}
    else if(b.dataset.connection)openConnection(b.dataset.connection);
    else if(b.hasAttribute('data-close-connection'))$('connectionDialog').close();
    else if(b.dataset.view){state.view=b.dataset.view;render();}
    else if(b.dataset.techMode){state.technology=b.dataset.techMode;render();window.FutureTour?.onAction('layer');}
    else if(b.dataset.zoom)zoom(b.dataset.zoom==='in'?1.2:1/1.2);
    else if(b.hasAttribute('data-fit'))fitGraph();
    else if(b.hasAttribute('data-tour')){closeDialogs();window.FutureOnboarding.start();}
    else if(b.hasAttribute('data-quiz'))route('quiz');
    else if(b.hasAttribute('data-truths')){$('truthsDialog').showModal();}
    else if(b.hasAttribute('data-close-truths'))$('truthsDialog').close();
    else if(b.dataset.chat)openChat(b.dataset.chat);
    else if(b.dataset.chatSwitch)openChat(b.dataset.chatSwitch);
    else if(b.hasAttribute('data-close-chat'))$('chatDialog').close();
    else if(b.dataset.chatTopic){const item=window.FuturePersonas.characters[chatPerson].chips.find(x=>x[0]===b.dataset.chatTopic);sendChat(item[1],item[0]);}
    else if(b.hasAttribute('data-load-runtime'))window.FuturePersonaRuntime.load().catch(()=>{});
    else if(b.hasAttribute('data-stop-runtime')||b.hasAttribute('data-cancel-reply'))cancelChatReply();
  });
  document.addEventListener('change',e=>{if(e.target.id==='showActivities'){state.activities=e.target.checked;render();window.FutureTour?.onAction('layer');}});
  $('brandHome').addEventListener('click',()=>route('map'));
  $('chatForm').addEventListener('submit',e=>{e.preventDefault();sendChat($('chatInput').value);});
  $('chatDialog').addEventListener('close',()=>{chatToken++;window.FuturePersonaRuntime.cancel();chatBusy=false;clearChatProgress();if(chatPerson)drafts.set(chatPerson,$('chatInput').value);});
  window.addEventListener('persona-thinking',e=>{if(chatProgress){chatProgress.writing=/Writing/.test(e.detail);updateChatProgress();}});
  window.addEventListener('persona-runtime-status',()=>{if($('chatDialog').open)updateRuntime();});
  $('truthsContent').innerHTML=W.truths.map(t=>`<details><summary>${esc(t.title)}</summary>${copy(t.text)}</details>`).join('');
  window.addEventListener('popstate',e=>{if(!ready||!e.state?.future)return;Object.assign(state,e.state);render(false);});
  window.FutureApp={arrive({tour=false}={}){ready=true;$('experience').hidden=false;$('experience').inert=false;document.body.classList.remove('intro-active');document.querySelector('.skip').removeAttribute('tabindex');Object.assign(state,{route:'map',theme:'all',setting:'all',income:'all',education:'all',panel:'world',selected:'leo',profile:'leo',view:tour?'map':matchMedia('(max-width:600px)').matches?'list':'map',activities:true,technology:'selected'});render();if(tour)window.FutureTour.start();},hide(){ready=false;closeDialogs();observer?.disconnect();window.FutureTour?.cancel();$('experience').hidden=true;$('experience').inert=true;},reset(){window.FutureTour?.cancel();window.FutureQuiz?.reset();chatToken++;window.FuturePersonaRuntime.clearSession();chats.clear();drafts.clear();chatPerson=null;chatTopic=null;chatBusy=false;clearChatProgress();$('chatMessages').innerHTML='';$('chatInput').value='';this.hide();$('mainView').innerHTML='';document.body.classList.remove('is-idle');history.replaceState(null,'',location.pathname+location.search);},state:()=>({...state}),isReady:()=>ready,select,route};
})();
