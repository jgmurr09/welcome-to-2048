(function(){
  'use strict';
  const $=id=>document.getElementById(id),root=$('siteTour'),all=window.FutureOnboardingData,steps=all.filter(s=>s.mode==='guide');
  let index=0,active=false,frame=0;
  function targetFor(step){return index===0&&window.innerWidth<=600?document.querySelector('#nodes [data-select="climate"]')||document.querySelector(step.target):document.querySelector(step.target);}
  function refresh(){
    cancelAnimationFrame(frame);if(!active)return;
    frame=requestAnimationFrame(()=>{
      const step=steps[index],target=targetFor(step),rect=target?.getBoundingClientRect();
      const w=window.innerWidth,h=window.innerHeight,card=$('tourCard'),spot=$('tourSpotlight'),cardWidth=Math.min(w-32,w>1800?740:365);
      card.style.width=cardWidth+'px';
      if(rect&&rect.width&&rect.height){
        const left=Math.max(8,rect.left-7),top=Math.max(8,rect.top-7),right=Math.min(w-8,rect.right+7),bottom=Math.min(h-8,rect.bottom+7);
        spot.hidden=right<=left||bottom<=top;spot.style.left=left+'px';spot.style.top=top+'px';spot.style.width=Math.max(0,right-left)+'px';spot.style.height=Math.max(0,bottom-top)+'px';
      }else spot.hidden=true;
      let left=rect?rect.left:20,top=rect?rect.bottom+18:100;
      if(index===0&&w>600){left=rect?rect.right-cardWidth-20:w-cardWidth-20;top=rect?rect.top+25:100;}
      if(top+card.offsetHeight>h-20){const above=(rect?.top||0)-card.offsetHeight-18;top=above>=20?above:h-card.offsetHeight-20;}
      card.style.left=Math.max(16,Math.min(w-cardWidth-16,left))+'px';card.style.top=Math.max(20,top)+'px';
    });
  }
  function render(){const step=steps[index];$('tourCounter').textContent='LEO’S TOUR · '+String(all.indexOf(step)+1).padStart(2,'0')+' / '+String(all.length).padStart(2,'0');$('tourTitle').textContent=step.title;$('tourText').textContent=window.innerWidth<=900?step.text.replace('on the right','below the map'):step.text;$('nextTour').textContent=index===steps.length-1?'LET ME EXPLORE ✓':'NEXT →';$('tourTitle').focus({preventScroll:true});const target=targetFor(step),rect=target?.getBoundingClientRect();if(rect&&(rect.top<12||rect.bottom>window.innerHeight-12))target.scrollIntoView({behavior:'instant',block:'center'});refresh();}
  function cancel(){active=false;cancelAnimationFrame(frame);root.hidden=true;}
  function next(){if(index===steps.length-1)cancel();else{index++;render();}}
  function start(){active=true;index=0;root.hidden=false;render();}
  $('nextTour').addEventListener('click',next);$('closeTour').addEventListener('click',cancel);
  $('previousTour').addEventListener('click',()=>{if(index===0){cancel();window.FutureOnboarding.start(3);}else{index--;render();}});
  window.addEventListener('resize',refresh);document.addEventListener('scroll',refresh,{capture:true,passive:true});document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.preventDefault();cancel();}});
  window.FutureTour={start,cancel,refresh,isActive:()=>active,onAction(action){if(active&&steps[index].action===action)next();}};
})();
