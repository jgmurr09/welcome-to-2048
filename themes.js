(function () {
  'use strict';
  const themes=window.FutureLandingConfig.themes;
  const nodes=new Map(window.AtlasData.nodes.map(n=>[n.id,n]));
  const grid=document.getElementById('themeGrid');
  const panel=document.getElementById('themeExplorer');
  const landing=document.getElementById('landingScreen');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const branchIcon='<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M12 35h22m0 0C48 35 44 10 60 10h20M34 35h46M34 35c14 0 10 25 26 25h20"/><circle cx="12" cy="35" r="7"/><circle cx="85" cy="10" r="5"/><circle cx="85" cy="35" r="5"/><circle cx="85" cy="60" r="5"/></svg>';
  let theme=null,group=null,drawFrame=0;
  const allConnections=t=>t.groups?t.groups.flatMap(g=>g.connections):t.connections||[];
  const selectedConnections=()=>group?group.connections:theme.connections||[];
  const context=()=>({themeId:theme.id,groupId:group?.id||null});
  const route=()=> '#/themes/'+encodeURIComponent(theme.id)+(group?'/'+encodeURIComponent(group.id):'');
  function names(connections){return connections.map(c=>nodes.get(c.person)?.name||c.title).join(' · ');}
  function updateCards(){
    grid.querySelectorAll('[data-open-theme]').forEach(button=>{
      const selected=!panel.hidden&&button.dataset.openTheme===theme?.id;
      button.setAttribute('aria-expanded',String(selected));
    });
  }
  grid.innerHTML=themes.map(t=>{
    const count=new Set(allConnections(t).filter(c=>c.person).map(c=>c.person)).size;
    const summary=t.groups?t.groups.length+' branches':count+' perspectives';
    return '<button type="button" class="theme-card" data-open-theme="'+esc(t.id)+'" aria-expanded="false" aria-controls="themeExplorer" style="--theme-accent:'+esc(t.color)+'"><span class="theme-card-icon">'+branchIcon+'</span><strong>'+esc(t.title)+'</strong><span class="theme-card-count">'+esc(summary)+'</span><span class="theme-arrow" aria-hidden="true">↗</span></button>';
  }).join('');
  function connectionCard(connection,index){
    const person=nodes.get(connection.person);
    const color=person?.color||theme.color;
    const title=person?.name||connection.title;
    const portrait=person?.portrait;
    const safePortrait=typeof portrait==='string'&&/^(?:https?:\/\/|(?:\.\/)?(?:portraits|assets)\/)/i.test(portrait)?portrait:null;
    return '<article class="theme-person" data-theme-target="'+index+'" style="--person-color:'+esc(color)+'"><div class="theme-person-heading"><span class="theme-person-avatar" aria-hidden="true">'+esc(person?.initial||'↗')+(safePortrait?'<img src="'+esc(safePortrait)+'" alt="" loading="lazy">':'')+'</span><h5>'+esc(title)+'</h5></div><p>'+esc(connection.blurb)+'</p><button type="button" data-theme-connection="'+index+'">'+(person?'Explore '+esc(person.name)+'’s connections':'Open the world map')+' <span aria-hidden="true">↗</span></button></article>';
  }
  function draw(){
    cancelAnimationFrame(drawFrame);
    drawFrame=requestAnimationFrame(()=>{
      if(panel.hidden||landing.hidden)return;
      const flow=panel.querySelector('.theme-flow');
      const svg=panel.querySelector('.theme-wires');
      if(!flow||getComputedStyle(svg).display==='none')return;
      const rect=flow.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      svg.setAttribute('viewBox','0 0 '+rect.width+' '+rect.height);
      const point=(el,side)=>{const r=el.getBoundingClientRect();return {x:(side==='right'?r.right:r.left)-rect.left,y:r.top+r.height/2-rect.top};};
      const curve=(a,b,selected)=>'<path class="'+(selected?'is-selected':'')+'" d="M'+a.x+','+a.y+'C'+(a.x+(b.x-a.x)/2)+','+a.y+' '+(a.x+(b.x-a.x)/2)+','+b.y+' '+b.x+','+b.y+'"/>';
      const origin=flow.querySelector('.theme-origin');
      const branches=[...flow.querySelectorAll('[data-theme-group]')];
      const targets=[...flow.querySelectorAll('[data-theme-target]')];
      let paths='';
      branches.forEach(branch=>{paths+=curve(point(origin,'right'),point(branch,'left'),branch.getAttribute('aria-pressed')==='true');});
      const selected=flow.querySelector('[data-theme-group][aria-pressed="true"]')||origin;
      targets.forEach(target=>{paths+=curve(point(selected,'right'),point(target,'left'),true);});
      svg.innerHTML=paths;
    });
  }
  function reveal(el){
    // Scroll the landing surface itself; avoid moving the fixed page or embedding iframe.
    const top=el.getBoundingClientRect().top-landing.getBoundingClientRect().top+landing.scrollTop-24;
    landing.scrollTo({top:Math.max(0,top),behavior:reduced.matches?'auto':'smooth'});
  }
  function render(){
    panel.style.setProperty('--theme-accent',theme.color);
    panel.dataset.theme=theme.id;
    panel.dataset.group=group?.id||'';
    panel.innerHTML='<div class="theme-explorer-header"><h3 id="themeExplorerTitle" tabindex="-1">'+esc(theme.title)+'</h3><button type="button" class="theme-close" data-theme-close>All themes <span aria-hidden="true">↑</span></button></div><div class="theme-flow'+(theme.groups?'':' theme-flow-direct')+'"><svg class="theme-wires" aria-hidden="true"></svg><div class="theme-origin">'+branchIcon+'<strong>'+esc(theme.title)+'</strong></div>'+(theme.groups?'<section class="theme-branches" aria-labelledby="themeBranchPrompt"><h4 id="themeBranchPrompt">'+esc(theme.prompt)+'</h4><div class="theme-branch-buttons" role="group" aria-label="'+esc(theme.prompt)+'">'+theme.groups.map(g=>'<button type="button" data-theme-group="'+esc(g.id)+'" aria-pressed="'+String(g.id===group.id)+'" aria-controls="themeResults"><strong>'+esc(g.title)+'</strong><span>'+esc(names(g.connections))+'</span></button>').join('')+'</div></section>':'')+'<section class="theme-results" id="themeResults" aria-labelledby="themeResultsTitle"><h4 id="themeResultsTitle" tabindex="-1">'+esc(group?.title||'People connected to this theme')+'</h4><div class="theme-result-cards">'+selectedConnections().map(connectionCard).join('')+'</div></section></div>'+(theme.node?'<div class="theme-map-link"><button type="button" data-theme-map>View '+esc(theme.title)+' on the full map <span aria-hidden="true">↗</span></button></div>':'');
    panel.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.remove(),{once:true}));
    updateCards();draw();
  }
  function open(id,groupId,options={}){
    const next=themes.find(t=>t.id===id);
    if(!next)return false;
    theme=next;
    group=theme.groups?.find(g=>g.id===groupId)||theme.groups?.[0]||null;
    panel.hidden=false;
    render();
    if(options.history!==false)history.pushState({futureScreen:'themes',...context()},'',route());
    else history.replaceState({futureScreen:'themes',...context()},'',route());
    if(options.focus!==false)document.getElementById('themeExplorerTitle').focus({preventScroll:true});
    if(options.scroll!==false)reveal(panel);
    const count=selectedConnections().length;
    document.getElementById('announcement').textContent=theme.title+(group?' · '+group.title:'')+'. '+count+' connection'+(count===1?'':'s')+'.';
    return true;
  }
  function close(options={}){
    const previous=theme?.id;
    panel.hidden=true;updateCards();
    if(options.history!==false)history.pushState({futureScreen:'landing'},'',location.pathname+location.search);
    const button=[...grid.querySelectorAll('[data-open-theme]')].find(b=>b.dataset.openTheme===previous);
    if(options.focus!==false)button?.focus({preventScroll:true});
    if(options.scroll!==false)reveal(grid);
  }
  function contextFor(personId){
    const saved=window.FutureLanding.themeContext();
    if(!saved)return null;
    const t=themes.find(t=>t.id===saved.themeId);
    if(!t)return null;
    const g=t.groups?.find(g=>g.id===saved.groupId);
    const link=(g?.connections||t.connections||[]).find(c=>c.person===personId);
    return {title:t.title,groupTitle:g?.title||'',blurb:link?.blurb||''};
  }
  grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-open-theme]');
    if(button)open(button.dataset.openTheme);
  });
  panel.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.themeGroup){
      group=theme.groups.find(g=>g.id===button.dataset.themeGroup);
      if(!group)return;
      render();
      history.pushState({futureScreen:'themes',...context()},'',route());
      const selected=panel.querySelector('[data-theme-group][aria-pressed="true"]');
      selected.focus({preventScroll:true});
      if(matchMedia('(max-width:900px)').matches){
        const heading=document.getElementById('themeResultsTitle');heading.focus({preventScroll:true});reveal(heading);
      }
      document.getElementById('announcement').textContent=group.title+'. '+names(group.connections)+'.';
    } else if(button.hasAttribute('data-theme-connection')){
      const connection=selectedConnections()[Number(button.dataset.themeConnection)];if(!connection)return;
      if(connection.person)window.FutureLanding.openCharacter(connection.person,{facetKey:connection.facet,themeContext:context()});
      else window.FutureLanding.openWorld(connection.node,{themeContext:context()});
    } else if(button.hasAttribute('data-theme-map'))window.FutureLanding.openWorld(theme.node,{themeContext:context()});
    else if(button.hasAttribute('data-theme-close'))close();
  });
  const observer=new ResizeObserver(draw);observer.observe(panel);
  window.addEventListener('resize',draw);
  window.FutureThemes={open,close,contextFor};
})();
