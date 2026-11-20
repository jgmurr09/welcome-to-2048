(function(){
  'use strict';
  const $=id=>document.getElementById(id),root=$('siteTour'),all=window.FutureOnboardingData,steps=all.filter(s=>s.mode==='guide');
  let index=0,active=false,frame=0;
  const examples=document.createElement('div');examples.className='tour-example-rings';examples.setAttribute('aria-hidden','true');root.prepend(examples);
  function targetsFor(step){return [document.querySelector(step.target),step.exampleTarget?document.querySelector(step.exampleTarget):null].filter(Boolean);}
  function bounds(targets){
    const rects=targets.map(t=>t.getBoundingClientRect()).filter(r=>r.width&&r.height);if(!rects.length)return null;
    return {left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right)),top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom))};
  }
  function refresh(){
    cancelAnimationFrame(frame);if(!active)return;
    frame=requestAnimationFrame(()=>{
      const step=steps[index];
      if(index===0&&window.innerWidth<=600){const card=$('tourCard'),header=document.querySelector('.hub-header');window.FutureApp.focusTourExample(window.innerHeight-header.offsetHeight-card.offsetHeight-65);}
      const targets=targetsFor(step),rect=bounds(targets);
      const w=window.innerWidth,h=window.innerHeight,card=$('tourCard'),spot=$('tourSpotlight'),cardWidth=Math.min(w-32,w>1800?740:365);
      card.style.width=cardWidth+'px';
      if(rect){
        const left=Math.max(8,rect.left-12),top=Math.max(8,rect.top-12),right=Math.min(w-8,rect.right+12),bottom=Math.min(h-8,rect.bottom+12);
        spot.hidden=right<=left||bottom<=top;spot.style.left=left+'px';spot.style.top=top+'px';spot.style.width=Math.max(0,right-left)+'px';spot.style.height=Math.max(0,bottom-top)+'px';
      }else spot.hidden=true;
      examples.innerHTML=step.exampleTarget?targets.map(target=>{const r=target.getBoundingClientRect();return `<i class="tour-example-ring" style="left:${r.left-5}px;top:${r.top-5}px;width:${r.width+10}px;height:${r.height+10}px"></i>`;}).join(''):'';
      let left=rect?rect.left:20,top=rect?rect.bottom+18:100;
      if(index===0&&w>600&&rect){
        const right=rect.right+24;
        left=right+cardWidth<w-16?right:rect.left-cardWidth-24;
        if(left>=16)top=rect.top;
        else{left=w-cardWidth-16;top=rect.bottom+18;}
      }
      if(top+card.offsetHeight>h-20){const above=(rect?.top||0)-card.offsetHeight-18;top=above>=20?above:h-card.offsetHeight-20;}
      card.style.left=Math.max(16,Math.min(w-cardWidth-16,left))+'px';card.style.top=Math.max(20,top)+'px';
    });
  }
  function render(){
    const step=steps[index];
    if(index===0)window.FutureApp.showTourExample();else window.FutureApp.fitMap();
    $('tourCounter').textContent='LEO’S TOUR · '+String(all.indexOf(step)+1).padStart(2,'0')+' / '+String(all.length).padStart(2,'0');
    $('tourTitle').textContent=step.title;const text=window.innerWidth<=600&&step.mobileText?step.mobileText:step.text;$('tourText').textContent=window.innerWidth<=900?text.replace('on the right','below the map'):text;
    $('nextTour').textContent=index===steps.length-1?'LET ME EXPLORE ✓':'NEXT →';$('tourTitle').focus({preventScroll:true});
    if(index===0&&window.innerWidth<=600)$('graphViewport').scrollIntoView({behavior:'instant',block:'start'});
    const target=targetsFor(step)[0],rect=target?.getBoundingClientRect();
    if(rect&&(rect.top<12||rect.bottom>window.innerHeight-12))target.scrollIntoView({behavior:'instant',block:'center'});
    refresh();
  }
  function cancel(){if(active&&index===0&&window.innerWidth<=600)window.FutureApp.fitMap();active=false;cancelAnimationFrame(frame);root.hidden=true;examples.innerHTML='';}
  function next(){if(index===steps.length-1)cancel();else{index++;render();}}
  function start(){active=true;index=0;root.hidden=false;render();}
  $('nextTour').addEventListener('click',next);$('closeTour').addEventListener('click',cancel);
  $('previousTour').addEventListener('click',()=>{if(index===0){cancel();window.FutureOnboarding.start(3);}else{index--;render();}});
  window.addEventListener('resize',refresh);document.addEventListener('scroll',refresh,{capture:true,passive:true});document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.preventDefault();cancel();}});
  window.FutureTour={start,cancel,refresh,isActive:()=>active,onAction(action){if(active&&steps[index].action===action)next();}};
})();
