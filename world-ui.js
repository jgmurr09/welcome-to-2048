(function(){
  'use strict';
  const world=window.FutureWorld;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const people=new Map(world.characters.map(p=>[p.id,p]));
  const sections={work:'WORK / INCOME / EDUCATION',health:'DIET / HEALTH',home:'HOME / FAMILY',third:'3rd SPACE',tech:'TECH'};
  function portrait(id,extra=''){
    const p=people.get(id);if(!p)return '';const [x,y,w,h]=p.crop;
    return `<span class="portrait-art ${extra}" data-portrait-person="${id}" style="--person-color:${p.color}"><svg class="supplied-portrait" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMin slice" role="img" aria-label="Portrait of ${p.name}"><image href="portraits/supplied/character-board.png" width="1038" height="963"/></svg></span>`;
  }
  function copy(text,cls=''){return `<div class="source-copy ${cls}">${String(text||'').split(/\n\n/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}</div>`;}
  const descriptions={arrival:'A quiet arrival space after the time jump.',lakes:'The Great Lakes waterfront near Leo’s home, with boats and a neighborhood promenade.',people:'Portraits of Leo, Ken, Sophia, Veronica, and Catherine in their everyday settings.',connections:'The people, activities, themes, and technologies connected in this world.',climate:'A comparison of climate displacement and access to fresh water in the Great Lakes.',wealth:'Different levels of access to housing, healthcare, food, and recreation.',geography:'Rural, suburban, and urban neighborhoods connected by transport and digital services.',education:'A satellite schoolhouse connected to a wider school network.',materials:'Regional materials stockpiles and an advanced manufacturing supply warehouse.',garden:'Home gardens and a shared online community gardening class.',health:'Everyday health monitoring and personalized care at home.',care:'A robotic assisted paramedic and an autonomous mobile health unit in a rural setting.',logistics:'Long-haul autonomous trucks with people handling the last mile.',knee:'A removable external robotic knee support controlled through an app.',network:'A selected person’s connections to the people, activities, and technology around them.'};
  function scene(kind='network',label=''){return `<div class="image-brief" role="img" aria-label="Image placeholder: ${esc(label||descriptions[kind]||descriptions.network)}"><span>[${esc(label||descriptions[kind]||descriptions.network)}]</span></div>`;}
  function icon(kind){return `<span class="solid-icon" aria-hidden="true">${window.FutureIcons?.[kind]||window.FutureIcons?.network||'<span>●</span>'}</span>`;}
  function excerpt(text,max=220){const s=String(text||'').split('\n')[0];if(s.length<=max)return s;const part=s.slice(0,max);return part.slice(0,part.lastIndexOf(' '))+'…';}
  window.WorldUI={esc,people,sections,portrait,copy,scene,icon,excerpt};
})();
