(function () {
  'use strict';
  const {nodes,edges} = window.AtlasData;
  const byId = new Map(nodes.map(n=>[n.id,n]));
  const $ = id=>document.getElementById(id);
  const mobile = ()=>window.matchMedia('(max-width: 760px)').matches;
  const typeNames = {person:'Person',system:'System',shared:'Shared life',tech:'Technology',facet:'Area of life'};
  const palette = {system:'#f15a22',shared:'#e5018c',tech:'#7bc7e5',facet:'#1282ca',person:'#1282ca'};
  const state={selected:null,filter:mobile()?'person':'all',view:'map',panelOpen:false,activeEdge:null,historyDepth:0,scale:1,x:0,y:0,scene:null,ignoreClick:0};
  const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const color = n=>n.color||palette[n.type]||palette.facet;
  const baseNodes=nodes.filter(n=>n.type!=='facet');
  function currentFromURL(){try{const id=decodeURIComponent(location.hash.replace(/^#\/?/,''));return byId.has(id)?id:null;}catch(_){return null;}}
  function announce(s){$('announcement').textContent=s;}
  function boardNeighbors(id){return edges.filter(e=>e.source==='board'&&(e.a===id||e.b===id)).map(e=>e.a===id?e.b:e.a);}
  function connections(id){
    const found=new Map();
    edges.forEach(e=>{if(e.a===id||e.b===id){const other=e.a===id?e.b:e.a;if(other!==id&&byId.has(other))found.set(other,{node:byId.get(other),label:e.label,source:e.source});}});
    (byId.get(id)?.related||[]).forEach(other=>{if(byId.has(other)&&!found.has(other))found.set(other,{node:byId.get(other),label:'',source:'expanded'});});
    return [...found.values()].sort((a,b)=>(a.source==='board'?0:1)-(b.source==='board'?0:1));
  }
  function navigate(id, options={}){
    if(id&&!byId.has(id))return;
    state.selected=id; state.activeEdge=options.edge||null;
    state.panelOpen=!!id;
    if(!options.fromHistory){state.historyDepth++;history.pushState({atlas:true},'',id?'#/'+encodeURIComponent(id):location.pathname+location.search);}
    render();
    if(id){announce(byId.get(id).name+'. '+typeNames[byId.get(id).type]+'. Details opened.');const heading=$('inspector').querySelector('h2');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}}
  }
  function home(){state.filter=mobile()?'person':'all';navigate(null);}
  function goBack(){
    if(state.historyDepth>0){history.back();}
    else {const n=byId.get(state.selected);navigate(n?.person||null);}
  }
  window.addEventListener('popstate',()=>{state.historyDepth=Math.max(0,state.historyDepth-1);navigate(currentFromURL(),{fromHistory:true});});
  function overviewIds(){
    if(state.filter==='all')return baseNodes.map(n=>n.id);
    if(state.filter==='person')return baseNodes.filter(n=>n.type==='person'||n.type==='shared').map(n=>n.id);
    const wanted=new Set(baseNodes.filter(n=>n.type===state.filter).map(n=>n.id));
    [...wanted].forEach(id=>boardNeighbors(id).forEach(other=>wanted.add(other)));
    return [...wanted];
  }
  function separateNotes(ids,positions){
    const size=id=>{const type=byId.get(id).type;return type==='person'?[166,168]:type==='tech'?[136,86]:[158,106];};
    // Resolve collisions once per scene; retain the board's broad arrangement.
    for(let pass=0;pass<160;pass++){
      let overlaps=0;
      for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
        const a=positions.get(ids[i]),b=positions.get(ids[j]),sa=size(ids[i]),sb=size(ids[j]);
        const dx=b.x-a.x,dy=b.y-a.y,ox=(sa[0]+sb[0])/2+18-Math.abs(dx),oy=(sa[1]+sb[1])/2+18-Math.abs(dy);
        if(ox<=0||oy<=0)continue;
        overlaps++;const amount=(Math.min(ox,oy)+.5)/2;
        if(ox<oy){const sign=dx<0?-1:1;a.x-=sign*amount;b.x+=sign*amount;}
        else{const sign=dy<0?-1:1;a.y-=sign*amount;b.y+=sign*amount;}
      }
      if(!overlaps)break;
    }
  }
  function makeScene(){
    const selected=byId.get(state.selected), positions=new Map(), labels=[];
    let ids;
    if(!selected){
      ids=overviewIds();
      const compact={sophia:[100,300],leo:[240,80],ken:[470,240],veronica:[250,490],catherine:[460,655],wealth:[65,70],materials:[435,50],climate:[495,475],geography:[85,685],trucking:[80,155],vacation:[440,80],volunteer:[295,300],gardening:[430,480],autonomous:[0,395],robotics:[135,435],kitchen:[240,-45],'v-glasses':[145,570],'c-glasses':[505,690]};
      ids.forEach(id=>{const n=byId.get(id),p=mobile()?compact[id]:[n.x,n.y];positions.set(id,{x:p[0],y:p[1]});});
    }else if(selected.type==='person'){
      const facets=nodes.filter(n=>n.person===selected.id);
      const neighbors=boardNeighbors(selected.id);
      ids=[selected.id,...facets.map(n=>n.id),...(mobile()?[]:neighbors)];
      if(mobile()){
        positions.set(selected.id,{x:255,y:75});
        facets.forEach((n,i)=>{const p=[[130,245],[375,245],[130,425],[375,425],[255,600]][i];positions.set(n.id,{x:p[0],y:p[1]});});
      } else {
        positions.set(selected.id,{x:170,y:390});
        facets.forEach((n,i)=>positions.set(n.id,{x:520,y:85+i*151}));
        neighbors.forEach((id,i)=>positions.set(id,{x:940,y:90+i*(600/Math.max(1,neighbors.length-1))}));
        labels.push({x:170,text:'THE PERSON'},{x:520,text:'AREAS OF LIFE'},{x:940,text:'CONNECTED THREADS'});
      }
    }else{
      const curated=[...(selected.person?[selected.person]:[]),...(selected.related||[]),...boardNeighbors(selected.id)];
      ids=[selected.id,...[...new Set(curated)].filter(id=>id!==selected.id&&byId.has(id)).slice(0,mobile()?6:9)];
      const cx=mobile()?300:560,cy=mobile()?340:400,rx=mobile()?255:390,ry=mobile()?270:300;
      positions.set(selected.id,{x:cx,y:cy});
      ids.slice(1).forEach((id,i)=>{const a=(-Math.PI/2)+(2*Math.PI*i/(ids.length-1));positions.set(id,{x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});});
    }
    if(!selected)separateNotes(ids,positions);
    const visible=new Set(ids), sceneEdges=edges.filter(e=>visible.has(e.a)&&visible.has(e.b)&&(!selected?e.source==='board':true));
    if(selected){ids.slice(1).forEach(id=>{if(!sceneEdges.some(e=>(e.a===id&&e.b===selected.id)||(e.b===id&&e.a===selected.id)))sceneEdges.push({a:selected.id,b:id,label:'',source:'expanded'});});}
    return {ids,positions,edges:sceneEdges,labels,mobile:mobile()};
  }
  function portrait(n){
    const src=typeof n.portrait==='string'&&/^(?:https?:\/\/|data:image\/|blob:|(?:\.\/)?portraits\/)/i.test(n.portrait)?n.portrait:null;
    const position=/^[\d.\s%a-z-]+$/i.test(n.portraitPosition||'')?n.portraitPosition:'50% 35%';
    return '<span class="portrait-fallback" aria-hidden="true">'+esc(n.initial)+'</span>'+(src?'<img class="portrait-image" data-portrait="'+n.id+'" src="'+esc(src)+'" alt="" decoding="async" style="object-position:'+esc(position)+'">':'');
  }
  function bindPortraits(){
    document.querySelectorAll('[data-portrait]').forEach(img=>{
      if(img._atlasPortraitBound)return;img._atlasPortraitBound=true;
      const show=()=>img.parentElement.classList.add('has-photo');
      img.addEventListener('load',show,{once:true});
      img.addEventListener('error',()=>{img.hidden=true;img.parentElement.classList.remove('has-photo');},{once:true});
      if(img.complete&&img.naturalWidth>0)show();
    });
  }
  function nodeHTML(n){
    const cls='graph-node '+n.type+(state.selected===n.id?' selected':'')+'';
    const content=n.type==='person'?'<span class="person-orb">'+portrait(n)+'</span><span class="node-name">'+esc(n.name)+'</span>':'<span class="note-shape"><span class="node-name">'+esc(n.label||n.name)+'</span><span class="node-kind">'+esc(n.type==='facet'?'Area of life':typeNames[n.type])+'</span></span>';
    return '<button class="'+cls+'" data-node="'+n.id+'" style="--node-color:'+color(n)+';left:'+state.scene.positions.get(n.id).x+'px;top:'+state.scene.positions.get(n.id).y+'px" aria-label="'+esc(n.name+', '+typeNames[n.type]+'. Explore details')+'"'+(state.selected===n.id?' aria-current="true"':'')+'>'+content+'</button>';
  }
  function edgeColor(e){const a=byId.get(e.a),b=byId.get(e.b);return color(a.type==='person'||a.type==='facet'?b:a);}
  function edgeGeometry(e){
    const a=state.scene.positions.get(e.a),b=state.scene.positions.get(e.b),vertical=Math.abs(b.y-a.y)>Math.abs(b.x-a.x);
    const dx=b.x-a.x,dy=b.y-a.y;
    return {d:vertical?`M ${a.x} ${a.y} C ${a.x} ${a.y+dy*.45} ${b.x} ${b.y-dy*.45} ${b.x} ${b.y}`:`M ${a.x} ${a.y} C ${a.x+dx*.45} ${a.y} ${b.x-dx*.45} ${b.y} ${b.x} ${b.y}`,x:(a.x+b.x)/2,y:(a.y+b.y)/2-9};
  }
  function renderScene(){
    state.scene=makeScene();
    $('nodes').innerHTML=state.scene.ids.map(id=>nodeHTML(byId.get(id))).join('')+state.scene.labels.map(l=>'<span class="scene-column" style="left:'+l.x+'px">'+l.text+'</span>').join('');
    $('edges').setAttribute('width','1400');$('edges').setAttribute('height','1100');
    $('edges').innerHTML=state.scene.edges.map((e,i)=>{const p=edgeGeometry(e);return '<g><path class="edge-path '+e.source+'" data-edge="'+i+'" d="'+p.d+'" stroke="'+edgeColor(e)+'"><title>'+esc(byId.get(e.a).name+' → '+byId.get(e.b).name+(e.label?': '+e.label:''))+'</title></path><text class="edge-label" data-edge-label="'+i+'" x="'+p.x+'" y="'+p.y+'" text-anchor="middle">'+esc(e.label)+'</text></g>';}).join('');
    const visibleNodes=state.scene.ids.map(id=>byId.get(id));
    $('nodeList').innerHTML=visibleNodes.map(n=>'<button class="list-node'+(n.id===state.selected?' selected':'')+'" data-node="'+n.id+'" style="--node-color:'+color(n)+'"><small><i class="dot" style="background:'+color(n)+'"></i>'+typeNames[n.type]+'<span class="list-arrow">↗</span></small>'+(n.type==='person'?'<span class="list-portrait" style="--node-color:'+color(n)+'">'+portrait(n)+'</span>':'')+'<strong>'+esc(n.name)+'</strong>'+placeholderParagraph(n)+'</button>').join('');
    document.querySelectorAll('[data-node]').forEach(el=>{
      el.addEventListener('click',()=>{if(Date.now()<state.ignoreClick)return;navigate(el.dataset.node);});
      if(el.classList.contains('graph-node')){
        el.addEventListener('pointerenter',()=>highlightNode(el.dataset.node));
        el.addEventListener('pointerleave',()=>highlightNode(null));
        el.addEventListener('focus',()=>highlightNode(el.dataset.node));
        el.addEventListener('blur',()=>highlightNode(null));
      }
    });
    document.querySelectorAll('[data-edge]').forEach(el=>{
      el.addEventListener('click',ev=>{ev.stopPropagation();if(Date.now()<state.ignoreClick)return;const e=state.scene.edges[Number(el.dataset.edge)];navigate(e.a,{edge:e});});
      el.addEventListener('pointerenter',()=>{el.classList.add('edge-hot');document.querySelector('[data-edge-label="'+el.dataset.edge+'"]')?.classList.add('show');});
      el.addEventListener('pointerleave',()=>{el.classList.remove('edge-hot');document.querySelector('[data-edge-label="'+el.dataset.edge+'"]')?.classList.remove('show');});
    });
    bindPortraits();
    requestAnimationFrame(fit);
  }
  function highlightNode(id){
    const linked=new Set(id?[id,...state.scene.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a)]:[]);
    document.querySelectorAll('.graph-node').forEach(el=>el.classList.toggle('dimmed',!!id&&!linked.has(el.dataset.node)));
    document.querySelectorAll('[data-edge]').forEach(el=>{const e=state.scene.edges[Number(el.dataset.edge)],hot=!!id&&(e.a===id||e.b===id);el.classList.toggle('edge-hot',hot);document.querySelector('[data-edge-label="'+el.dataset.edge+'"]')?.classList.toggle('show',hot&&state.selected!==null);});
  }
  function fit(){
    if(!state.scene)return;
    const w=$('graphViewport').clientWidth,h=$('graphViewport').clientHeight;
    if(!w||!h)return;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    state.scene.ids.forEach(id=>{const p=state.scene.positions.get(id),n=byId.get(id),nw=n.type==='facet'?180:n.type==='person'?160:150,nh=n.type==='person'?140:85;minX=Math.min(minX,p.x-nw/2);maxX=Math.max(maxX,p.x+nw/2);minY=Math.min(minY,p.y-nh/2);maxY=Math.max(maxY,p.y+nh/2);});
    if(state.scene.labels.length)minY=Math.min(minY,-5);
    const pad=mobile()?16:30;
    state.scale=Math.min((w-pad*2)/(maxX-minX),(h-pad*2)/(maxY-minY),1.25);
    state.scale=Math.max(.18,state.scale);
    state.x=(w-(maxX-minX)*state.scale)/2-minX*state.scale;
    state.y=(h-(maxY-minY)*state.scale)/2-minY*state.scale;
    applyTransform();
  }
  function applyTransform(){$('graphWorld').style.setProperty('--label-boost',String(Math.max(1,Math.min(1.5,.82/state.scale))));$('graphWorld').style.transform=`translate(${state.x}px,${state.y}px) scale(${state.scale})`;$('zoomLabel').textContent=Math.round(state.scale*100)+'%';}
  function zoomAt(factor,x=$('graphViewport').clientWidth/2,y=$('graphViewport').clientHeight/2){const old=state.scale;state.scale=Math.max(.18,Math.min(2.8,old*factor));const ratio=state.scale/old;state.x=x-(x-state.x)*ratio;state.y=y-(y-state.y)*ratio;applyTransform();}
  const topLine = ()=>'<div class="panel-topline"><div class="panel-actions">'+(state.selected?'<button class="icon-button" data-back aria-label="Back to previous layer" title="Previous layer">←</button>':'')+'<button class="icon-button" data-close-panel aria-label="Close details" title="Close details">×</button></div></div>';
  const lorem='Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  function placeholderParagraph(item={}){
    const text=typeof item.description==='string'?item.description.trim():'';
    return '<p class="placeholder-copy"'+(text?'':' data-placeholder="true"')+'>'+esc(text||lorem)+'</p>';
  }
  function rosterHTML(){return nodes.filter(n=>n.type==='person').map(n=>'<button class="roster-button" data-link="'+n.id+'"><span class="roster-avatar" style="--node-color:'+color(n)+'">'+portrait(n)+'</span><span class="roster-name">'+esc(n.name)+'</span><span class="roster-arrow">↗</span></button>').join('');}
  function renderWelcome(){return topLine('')+'<h2>People</h2><div class="people-roster">'+rosterHTML()+'</div>';}
  function connectionLinks(n){
    const list=connections(n.id).filter(c=>n.type!=='person'||c.node.type!=='facet');
    if(!list.length)return '';
    return '<section class="simple-connections"><h3>Connections</h3>'+list.map(c=>'<button class="plain-link" data-link="'+c.node.id+'"><span>'+esc(c.node.name)+'</span><span aria-hidden="true">↗</span></button>').join('')+'</section>';
  }
  function renderPerson(n){
    const facets=nodes.filter(f=>f.person===n.id);
    return topLine('')+'<div class="profile-header"><div class="profile-orb" style="--node-color:'+color(n)+'">'+portrait(n)+'</div><h2>'+esc(n.name)+'</h2></div>'+(n.description?placeholderParagraph(n):'')+'<div class="simple-sections">'+facets.map(f=>'<section class="content-section"><h3><button class="section-link" data-link="'+f.id+'"><span>'+esc(f.name)+'</span><span aria-hidden="true">↗</span></button></h3>'+placeholderParagraph(f)+'</section>').join('')+'</div>'+connectionLinks(n);
  }
  function renderDetail(n){
    return topLine('')+(n.person?'<p class="panel-kicker">'+esc(byId.get(n.person).name)+'</p>':'')+'<h2>'+esc(n.name)+'</h2>'+placeholderParagraph(n)+connectionLinks(n);
  }
  function renderRelationship(e){
    const a=byId.get(e.a),b=byId.get(e.b);
    return topLine('')+'<h2>'+esc(a.name)+' <span class="relationship-sep" aria-hidden="true">↔</span> '+esc(b.name)+'</h2>'+placeholderParagraph(e)+'<div class="simple-connections"><button class="plain-link" data-link="'+a.id+'"><span>'+esc(a.name)+'</span><span aria-hidden="true">↗</span></button><button class="plain-link" data-link="'+b.id+'"><span>'+esc(b.name)+'</span><span aria-hidden="true">↗</span></button></div>';
  }
  function renderPanel(){
    const n=byId.get(state.selected),panel=$('inspector');
    $('panelContent').innerHTML='<div class="panel-inner">'+(state.activeEdge?renderRelationship(state.activeEdge):n?(n.type==='person'?renderPerson(n):renderDetail(n)):renderWelcome())+'</div>';
    panel.classList.toggle('is-open',state.panelOpen);
    $('workspace').classList.toggle('details-open',state.panelOpen);
    panel.inert=!state.panelOpen;panel.setAttribute('aria-hidden',String(!state.panelOpen));
    $('openDetails').hidden=state.panelOpen||(!mobile()&&!n);
    $('openDetails').textContent=n?'Open details ↗':'People ↗';
    bindPortraits();
    document.querySelectorAll('[data-link]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.link)));
    panel.querySelector('[data-back]')?.addEventListener('click',goBack);
    panel.querySelector('[data-close-panel]')?.addEventListener('click',()=>{state.panelOpen=false;renderPanel();if(!$('openDetails').hidden)$('openDetails').focus({preventScroll:true});else $('graphViewport').focus({preventScroll:true});requestAnimationFrame(fit);});
  }
  function renderChrome(){
    const n=byId.get(state.selected);
    $('breadcrumb').innerHTML='<button data-crumb-home>2048 / WORLD</button>'+(n?.person?'<span class="crumb-sep">/</span><button data-crumb-parent="'+n.person+'">'+esc(byId.get(n.person).name.toUpperCase())+'</button>':'')+(n?'<span class="crumb-sep">/</span><span class="crumb-current">'+esc((n.label||n.name).toUpperCase())+'</span>':'<span class="crumb-sep">/</span><span class="crumb-current">'+(state.filter==='all'?'ALL CONNECTIONS':state.filter==='person'?'PEOPLE & THEIR TIES':state.filter==='system'?'LARGER FORCES':state.filter==='shared'?'SHARED LIVES':'EVERYDAY TECHNOLOGY')+'</span>');
    $('mapCaption').textContent='Select a node to explore.';
    $('breadcrumb').querySelector('[data-crumb-home]').addEventListener('click',home);
    $('breadcrumb').querySelector('[data-crumb-parent]')?.addEventListener('click',el=>navigate(el.currentTarget.dataset.crumbParent));
    document.querySelectorAll('[data-filter]').forEach(el=>{const active=state.filter===el.dataset.filter&&!n;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
    $('graphViewport').hidden=state.view!=='map';$('nodeList').hidden=state.view!=='list';$('zoomControls').hidden=state.view!=='map';
    ['map','list'].forEach(v=>{$(v+'View').classList.toggle('active',state.view===v);$(v+'View').setAttribute('aria-pressed',String(state.view===v));});
    $('mapHint').textContent=state.view==='map'?'Drag to move · Choose a node to explore':'Choose a card to see what connects.';
  }
  function render(){renderChrome();renderScene();renderPanel();$('inspector').scrollTop=0;}
  function setView(view){state.view=view;renderChrome();if(view==='map')requestAnimationFrame(fit);}
  document.querySelectorAll('[data-home]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();home();}));
  document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{state.filter=el.dataset.filter;navigate(null);}));
  $('mapView').addEventListener('click',()=>setView('map'));$('listView').addEventListener('click',()=>setView('list'));
  $('zoomIn').addEventListener('click',()=>zoomAt(1.25));$('zoomOut').addEventListener('click',()=>zoomAt(.8));$('fitMap').addEventListener('click',fit);
  $('openDetails').addEventListener('click',()=>{state.panelOpen=true;renderPanel();$('inspector').querySelector('[data-close-panel]')?.focus({preventScroll:true});});
  function showHelp(){if(!$('helpDialog').open)$('helpDialog').showModal();}
  $('helpButton').addEventListener('click',showHelp);
  $('closeHelp').addEventListener('click',()=>$('helpDialog').close());$('beginExplore').addEventListener('click',()=>$('helpDialog').close());
  $('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog')){const r=$('helpDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('helpDialog').close();}});
  // Search all layers, including details that are not visible in the current map.
  const input=$('searchInput'),results=$('searchResults');let searchMatches=[];
  function closeSearch(){results.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
  function runSearch(){
    const q=input.value.trim().toLowerCase();
    if(!q){closeSearch();return;}
    searchMatches=nodes.map(n=>({n,score:(n.name.toLowerCase().includes(q)?5:0)+([n.label,n.description,n.person?byId.get(n.person).name:'',typeNames[n.type]].filter(Boolean).join(' ').toLowerCase().includes(q)?1:0)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,9).map(r=>r.n);
    results.innerHTML=searchMatches.length?searchMatches.map((n,i)=>'<button class="search-result" id="search-result-'+i+'" role="option" aria-selected="false" data-search-node="'+n.id+'"><strong>'+esc(n.name)+'</strong><small>'+typeNames[n.type]+(n.person?' · '+byId.get(n.person).name:'')+'</small></button>').join(''):'<p class="no-results">No results.</p>';
    results.hidden=false;input.setAttribute('aria-expanded','true');
    results.querySelectorAll('[data-search-node]').forEach(el=>el.addEventListener('click',()=>{navigate(el.dataset.searchNode);input.value='';closeSearch();}));
  }
  input.addEventListener('input',runSearch);input.addEventListener('focus',()=>{if(input.value.trim())runSearch();});
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();input.blur();}if(e.key==='ArrowDown'&&searchMatches.length&&!results.hidden){e.preventDefault();results.querySelector('button')?.focus();}if(e.key==='Enter'&&searchMatches.length&&!results.hidden){e.preventDefault();navigate(searchMatches[0].id);input.value='';closeSearch();}});
  results.addEventListener('keydown',e=>{const opts=[...results.querySelectorAll('button')],i=opts.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();opts[(i+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length]?.focus();}if(e.key==='Escape'){closeSearch();input.focus();}});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search-wrap'))closeSearch();});
  // Pan and pinch use one transform, keeping node and line geometry aligned.
  const viewport=$('graphViewport'),pointers=new Map();let lastPinch=null,dragged=false;
  function pointerPoint(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  function pinchState(){const p=[...pointers.values()];return p.length<2?null:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};}
  viewport.addEventListener('pointerdown',e=>{if(e.button&&e.pointerType!=='touch')return;const p=pointerPoint(e);pointers.set(e.pointerId,{...p,startX:p.x,startY:p.y});dragged=false;lastPinch=pinchState();});
  viewport.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const old=pointers.get(e.pointerId),p=pointerPoint(e);pointers.set(e.pointerId,{...old,...p});
    if(pointers.size>1){const next=pinchState();if(lastPinch&&lastPinch.d>0){zoomAt(next.d/lastPinch.d,lastPinch.x,lastPinch.y);state.x+=next.x-lastPinch.x;state.y+=next.y-lastPinch.y;applyTransform();}lastPinch=next;dragged=true;viewport.setPointerCapture(e.pointerId);e.preventDefault();}
    else if(dragged||Math.hypot(p.x-old.startX,p.y-old.startY)>5){state.x+=p.x-old.x;state.y+=p.y-old.y;dragged=true;applyTransform();viewport.setPointerCapture(e.pointerId);e.preventDefault();}
  });
  function pointerEnd(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);lastPinch=pinchState();if(dragged){state.ignoreClick=Date.now()+250;}if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);if(pointers.size===1){const [id,p]=[...pointers.entries()][0];pointers.set(id,{...p,startX:p.x,startY:p.y});}}
  window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',pointerEnd);
  viewport.addEventListener('wheel',e=>{e.preventDefault();const p=pointerPoint(e),delta=e.deltaY*(e.deltaMode===1?16:1);zoomAt(Math.exp(-delta*.0015),p.x,p.y);},{passive:false});
  viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;let handled=true;switch(e.key){case '+':case '=':zoomAt(1.2);break;case '-':zoomAt(1/1.2);break;case '0':fit();break;case 'ArrowLeft':state.x+=40;break;case 'ArrowRight':state.x-=40;break;case 'ArrowUp':state.y+=40;break;case 'ArrowDown':state.y-=40;break;default:handled=false;}if(handled){e.preventDefault();applyTransform();}});
  let resizeFrame;new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{const nextMobile=mobile();if(state.scene&&state.scene.mobile!==nextMobile){renderScene();renderPanel();}else fit();});}).observe(viewport);
  state.selected=currentFromURL();if(state.selected)state.panelOpen=true;
  render();
  // The content model is intentionally exposed for source maintenance and validation.
  window.AtlasApp={navigate,home,fit,getState:()=>({...state}),connections,makeScene};
})();
