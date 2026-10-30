(function(){
  'use strict';
  const W=window.FutureWorld;
  const nodes=window.AtlasData.nodes.filter(n=>n.type!=='facet').map(n=>({...n}));
  nodes.push({id:'education',type:'system',name:'Education'},{id:'knee',type:'tech',name:'External Robotic Knee Support'},{id:'wearable',type:'tech',name:'Wearble tech'});
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const edges=[];
  function add(a,b){if(a===b||!byId.has(a)||!byId.has(b)||edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)))return;edges.push({a,b});}
  window.AtlasData.edges.filter(e=>e.source==='board').forEach(e=>add(e.a,e.b));
  for(const system of ['wealth','geography','education'])W.characters.forEach(p=>add(system,p.id));
  ['sophia','ken','veronica','catherine'].forEach(id=>add('wearable',id));
  const related=id=>[...new Set(edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a))];
  const positions={wealth:[300,85],climate:[800,65],materials:[1300,85],geography:[230,1035],education:[1370,1035],leo:[800,290],sophia:[330,510],ken:[1270,510],veronica:[600,800],catherine:[1000,800],trucking:[520,290],vacation:[1080,290],volunteer:[800,605],gardening:[800,830],kitchen:[100,230],autonomous:[100,455],robotics:[100,650],'v-glasses':[100,850],'c-glasses':[1500,850],wearable:[1500,650],knee:[1500,230]};
  function peopleFor(themeId,lensId='all'){
    const t=W.themes.find(t=>t.id===themeId);let ps=t?t.people.map(id=>W.characters.find(p=>p.id===id)):W.characters;
    if(lensId!=='all'){
      const lens=t?.lenses.find(l=>l.id===lensId);
      if(lens?.people)ps=ps.filter(p=>lens.people.includes(p.id));
      else if(themeId==='wealth')ps=ps.filter(p=>p.incomeGroup===lensId);
      else if(themeId==='geography')ps=ps.filter(p=>p.placeGroup===lensId);
    }
    return ps;
  }
  function scene({themeId='all',lens='all',selected='leo',activities=true,technology='selected',aspect=1.4}={}){
    const ps=peopleFor(themeId,lens),personIds=ps.map(p=>p.id),ids=new Set(personIds);
    nodes.filter(n=>n.type==='system').forEach(n=>ids.add(n.id));
    if(activities)nodes.filter(n=>n.type==='shared'&&related(n.id).some(id=>personIds.includes(id))).forEach(n=>ids.add(n.id));
    if(technology!=='none'){
      const owners=technology==='all'?personIds:(byId.get(selected)?.type==='person'?[selected]:related(selected).filter(id=>byId.get(id)?.type==='person'));
      nodes.filter(n=>n.type==='tech'&&(technology==='all'||related(n.id).some(id=>owners.includes(id)))).forEach(n=>ids.add(n.id));
    }
    if(byId.has(selected))ids.add(selected);
    const visible=nodes.filter(n=>ids.has(n.id));
    const height=1140,width=Math.max(1250,Math.min(3500,height*Math.max(1.1,aspect)));
    return {nodes:visible,positions:new Map(visible.map(n=>[n.id,{x:100+(positions[n.id][0]-100)*(width-200)/1400,y:positions[n.id][1]}])),width,height,edges:edges.filter(e=>ids.has(e.a)&&ids.has(e.b)).map(e=>({...e,kind:edgeKind(e)}))};
  }
  function edgeKind(e){const a=byId.get(e.a),b=byId.get(e.b);return a.type==='system'||b.type==='system'?'system':a.type==='tech'||b.type==='tech'?'tech':'shared';}
  function path(a,b,kind){
    if(kind==='tech'){const dx=b.x-a.x;return `M${a.x} ${a.y}C${a.x+dx*.55} ${a.y} ${b.x-dx*.55} ${b.y} ${b.x} ${b.y}`;}
    return `M${a.x} ${a.y}C${a.x} ${(a.y+b.y)/2} ${b.x} ${(a.y+b.y)/2} ${b.x} ${b.y}`;
  }
  function profile(id){
    const direct=related(id),shared=direct.filter(i=>byId.get(i)?.type==='shared'),tech=direct.filter(i=>byId.get(i)?.type==='tech'),systems=direct.filter(i=>byId.get(i)?.type==='system').slice(0,3);
    const nearby=[...new Set(shared.flatMap(related))].filter(i=>i!==id&&byId.get(i)?.type==='person').slice(0,3);
    const groups=[systems,shared,nearby];const points=new Map([[id,{x:260,y:180}]]);
    groups.forEach((row,r)=>row.forEach((key,i)=>points.set(key,{x:(i+1)*520/(row.length+1),y:[55,340,490][r]})));
    tech.forEach((key,i)=>points.set(key,{x:i%2?465:55,y:165+Math.floor(i/2)*95}));
    const ids=[...points.keys()];
    return {nodes:ids.map(i=>byId.get(i)),positions:points,width:520,height:600,edges:edges.filter(e=>ids.includes(e.a)&&ids.includes(e.b)).map(e=>({...e,kind:edgeKind(e)}))};
  }
  window.FutureConnections={nodes,byId,edges,related,peopleFor,scene,profile,path,edgeKind};
  if(typeof module!=='undefined')module.exports=window.FutureConnections;
})();
