(function () {
  'use strict';
  const screen=document.getElementById('technologyScreen');
  const {nodes}=window.AtlasData, byId=new Map(nodes.map(n=>[n.id,n]));
  const config=window.FutureTechnologyConfig;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const imagePath=s=>typeof s==='string'&&/^(?:https?:\/\/|(?:\.\/)?(?:assets|technologies)\/)/i.test(s)?s:null;
  const icons={
    care:'<path d="M10 6h20v28H10zM17 1h6v10h-6zM15 21h10M20 16v10M6 34h28"/>',
    robot:'<path d="M8 34h25M13 34v-7l11-8-6-10M15 6l8 4-4 8M22 5l7-2 4 5-7 4M24 19l9 7-4 5-9-7"/><circle cx="13" cy="28" r="4"/><circle cx="24" cy="19" r="3"/>',
    home:'<path d="m4 17 16-13 16 13M9 14v21h22V14M15 35V23h10v12M29 4v9"/>',
    glasses:'<path d="M4 14h13l3 4 3-4h13v11l-3 4h-8l-5-7-5 7H7l-3-4zM4 16 1 12M36 16l3-4M17 14h6"/>',
    future:'<path d="M7 11h26v22H7zM13 5h14M20 1v8M13 21h14M20 14v14"/>'
  };
  function icon(name){return '<svg viewBox="0 0 40 40" aria-hidden="true">'+(icons[name]||icons.future)+'</svg>';}
  const mapCards=nodes.filter(n=>n.type==='tech').map(n=>({
    ...config.mapCards[n.id],id:n.id,title:n.name,node:n.id,
    summary:n.description||config.mapCards[n.id]?.summary||'',
    people:window.AtlasApp.connections(n.id).filter(c=>c.node.type==='person').map(c=>c.node.id)
  }));
  const teamCards=config.teamCards||[], cards=new Map([...mapCards,...teamCards].map(c=>[c.id,c]));
  function card(c){
    const image=imagePath(c.image);
    return '<article class="technology-card"><div class="technology-art">'+icon(c.icon)+(image?'<img src="'+esc(image)+'" alt="" loading="lazy">':'')+'</div><div class="technology-card-content"><h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p><div class="technology-card-actions"><button type="button" data-technology-detail="'+esc(c.id)+'">Read more <span aria-hidden="true">↗</span></button>'+(c.node&&byId.has(c.node)?'<button type="button" data-technology-world="'+esc(c.node)+'">View on map</button>':'')+'</div></div></article>';
  }
  function placeholder(c,index){return '<article class="technology-placeholder" aria-label="Unfilled technology card '+(index+1)+'"><div class="technology-empty-art" aria-hidden="true">+</div><h3>Technology slot '+String(index+1).padStart(2,'0')+'</h3><div class="technology-empty-lines" aria-hidden="true"><span></span><span></span></div></article>';}
  screen.innerHTML='<div class="technology-main"><h1 id="technologyTitle" tabindex="-1">Explore the Technology</h1><section aria-labelledby="mapTechnologyHeading"><h2 id="mapTechnologyHeading">Technology from this world</h2><div class="technology-grid">'+mapCards.map(card).join('')+'</div></section><section class="team-technology-section" aria-labelledby="teamTechnologyHeading"><h2 id="teamTechnologyHeading">More team technology</h2><div class="technology-grid technology-team-grid">'+teamCards.map((c,i)=>c.title?card(c):placeholder(c,i)).join('')+'</div></section></div><dialog class="technology-dialog" id="technologyDialog" aria-labelledby="technologyDetailTitle"><button type="button" class="technology-dialog-close" aria-label="Close technology details">×</button><div id="technologyDetailContent"></div></dialog>';
  const dialog=document.getElementById('technologyDialog');
  function openDetail(id){
    const c=cards.get(id);if(!c?.title)return;
    const people=(c.people||[]).map(id=>byId.get(id)).filter(n=>n?.type==='person');
    document.getElementById('technologyDetailContent').innerHTML='<div class="technology-detail-icon">'+icon(c.icon)+'</div><h2 id="technologyDetailTitle">'+esc(c.title)+'</h2><p>'+esc(c.detail||c.summary)+'</p>'+(people.length?'<h3>People connected to this technology</h3><div class="technology-people">'+people.map(n=>'<button type="button" data-technology-person="'+esc(n.id)+'">'+esc(n.name)+' <span aria-hidden="true">↗</span></button>').join('')+'</div>':'')+(c.node&&byId.has(c.node)?'<button type="button" class="technology-explore" data-technology-world="'+esc(c.node)+'">Explore its connections in the world ↗</button>':'');
    dialog.showModal();
  }
  screen.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(button?.dataset.technologyDetail)openDetail(button.dataset.technologyDetail);
    else if(button?.dataset.technologyWorld)window.FutureLanding.openWorld(button.dataset.technologyWorld);
    else if(button?.dataset.technologyPerson)window.FutureLanding.openCharacter(button.dataset.technologyPerson);
    else if(button?.classList.contains('technology-dialog-close'))dialog.close();
    if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
  });
  screen.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.remove(),{once:true}));
  window.FutureTechnology={openDetail};
})();
