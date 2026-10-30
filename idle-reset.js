(function(){
  'use strict';
  const delay=window.FutureExperienceConfig.idleMs,ambienceAfter=9000;let last=Date.now(),timer=0;
  function check(){clearTimeout(timer);const elapsed=Date.now()-last;if(elapsed>=delay){window.FutureIntro.reset();last=Date.now();document.body.classList.remove('is-idle');}else document.body.classList.toggle('is-idle',elapsed>=ambienceAfter);timer=setTimeout(check,1000);}
  function activity(){last=Date.now();document.body.classList.remove('is-idle');}
  ['pointerdown','pointermove','keydown','wheel','touchstart','input'].forEach(name=>document.addEventListener(name,activity,{passive:true,capture:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});check();
  window.FutureIdleReset={delay,check,lastActivity:()=>last};
})();
