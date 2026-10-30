(function () {
  'use strict';
  const DAY=86400000,MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function parseDate(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));if(!m)return null;const [y,mo,d]=m.slice(1).map(Number),stamp=Date.UTC(y,mo-1,d),date=new Date(stamp);return date.getUTCFullYear()===y&&date.getUTCMonth()===mo-1&&date.getUTCDate()===d?stamp:null;}
  function localToday(date=new Date()){return Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());}
  function dateParts(stamp){const d=new Date(stamp);return [MONTHS[d.getUTCMonth()],String(d.getUTCDate()).padStart(2,'0'),String(d.getUTCFullYear())];}
  function spokenDate(stamp){return new Date(stamp).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});}
  function makeTimeline(start,target,rampMs=7500,cruiseMs=1100){
    const days=Math.max(0,Math.round((target-start)/DAY));if(!days)return [];
    const early=[350,310,270,240,215,190,170,150],earlyEnd=early.reduce((a,b)=>a+b,0),count=Math.min(early.length,days);
    const available=Math.max(1,rampMs-earlyEnd),k=7,exp=Math.exp(k),weight=available/k*(exp-1)+cruiseMs*exp;
    let elapsed=0;
    return Array.from({length:days},(_,i)=>{
      const step=i+1;let at;
      if(step<=count){elapsed+=early[i];at=elapsed;}
      else {const fraction=(step-count)/(days-count),area=fraction*weight,rampArea=available/k*(exp-1);at=earlyEnd+(area<=rampArea?available/k*Math.log(1+area*k/available):available+(area-rampArea)/exp);}
      return {at,stamp:start+step*DAY};
    });
  }
  if(typeof document==='undefined'){if(typeof module!=='undefined')module.exports={parseDate,localToday,dateParts,makeTimeline};return;}
  const $=id=>document.getElementById(id),root=$('futureIntro'),stage=$('timeStage'),idle=$('introIdle'),cfg=window.FutureIntroConfig;
  const target=parseDate(cfg.targetDate)||parseDate('2048-01-01'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let phase='idle',raf=0,timer=0,startTime=0,timeline=[],index=0,lastShown=0,audio=null,token=0;
  const tiles=[];
  class Tile{
    constructor(parent,value){this.el=document.createElement('span');this.el.className='clock-tile';this.el.innerHTML='<span class="clock-current flap-letter"></span><span class="flap-half flap-lower flap-old-bottom"><span class="flap-letter"></span></span><span class="flap-half flap-upper flap-out"><span class="flap-letter"></span></span><span class="flap-half flap-lower flap-in"><span class="flap-letter"></span></span>';parent.append(this.el);this.letters=[...this.el.querySelectorAll('.flap-letter')];this.value='';this.set(value);}
    set(value,ms=0){if(value===this.value)return;const old=this.value;this.value=value;this.el.classList.remove('is-flipping');this.letters.forEach(x=>x.textContent=value);if(ms&&!reduced.matches){this.letters[1].textContent=old;this.letters[2].textContent=old;this.el.style.setProperty('--half-ms',ms/2+'ms');void this.el.offsetWidth;this.el.classList.add('is-flipping');}}
  }
  dateParts(localToday()).forEach((part,i)=>{const group=document.createElement('div');group.className='clock-group clock-group-'+['month','day','year'][i];$('clockFace').append(group);[...part].forEach(letter=>tiles.push(new Tile(group,letter)));});
  for(let i=0;i<40;i++){const ray=document.createElement('span');ray.className='time-streak';ray.style.setProperty('--ray-angle',i*9+'deg');$('timeStreaks').append(ray);}
  function showDate(stamp,ms=0){[...dateParts(stamp).join('')].forEach((s,i)=>tiles[i].set(s,ms));lastShown=stamp;}
  function setPhase(next){phase=next;root.dataset.phase=next;}
  function cancel(){token++;cancelAnimationFrame(raf);clearTimeout(timer);tiles.forEach(t=>t.el.classList.remove('is-flipping'));}
  function unlockSound(){if(!window.FutureExperienceConfig.arrivalSound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audio=audio||new Audio();audio.resume().catch(()=>{});}}catch(_){}}
  function ding(){if(!audio||audio.state!=='running')return;[880,1320,1760].forEach((frequency,i)=>{const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.08/(i+1),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+1.1);o.connect(g).connect(audio.destination);o.start(now);o.stop(now+1.15);});}
  function arrive(){
    cancel();root.classList.remove('clock-warp');setPhase('arrived');showDate(target);$('clockDate').textContent=spokenDate(target);$('introStatus').textContent='You have arrived in 2048.';ding();
    const run=token;timer=setTimeout(()=>{if(run!==token)return;setPhase('exiting');timer=setTimeout(()=>{if(run!==token)return;root.hidden=true;document.body.classList.remove('intro-active');window.FutureOnboarding.start();},reduced.matches?0:450);},cfg.arrivalHoldMs);
  }
  function tick(now){
    if(phase!=='travelling')return;const elapsed=now-startTime,total=cfg.rampMs+cfg.cruiseMs;
    const progress=Math.min(1,elapsed/cfg.rampMs),speed=Math.pow(progress,2.4);
    root.style.setProperty('--journey-progress',progress);root.style.setProperty('--warp',speed);root.style.setProperty('--grid-period',(2600-speed*2380)+'ms');
    // Every logical calendar entry is one day after the preceding entry. At
    // launch speed the display becomes a mechanical blur; screens cannot draw
    // thousands of individually readable dates in a few seconds.
    const before=index;while(index<timeline.length&&timeline[index].at<=elapsed)index++;
    if(index>before){const frame=timeline[index-1],interval=index>1?frame.at-timeline[index-2].at:350;const fast=interval<65;root.classList.toggle('clock-warp',fast&&!reduced.matches);if(!fast||now-(root._lastPaint||0)>48){showDate(frame.stamp,fast?0:Math.min(320,interval*.85));root._lastPaint=now;}}
    if(elapsed>=total||index>=timeline.length){arrive();return;}raf=requestAnimationFrame(tick);
  }
  function begin(){if(phase!=='idle')return;cancel();unlockSound();window.FutureIdlePlayer.hide();idle.inert=true;idle.setAttribute('aria-hidden','true');stage.hidden=false;showDate(localToday());setPhase('departing');$('clockHeading').focus({preventScroll:true});$('introStatus').textContent='Travelling from today to January 1, 2048.';const start=localToday();if(start>=target){arrive();return;}timeline=makeTimeline(start,target,cfg.rampMs,cfg.cruiseMs);index=0;const run=token;timer=setTimeout(()=>{if(run!==token)return;setPhase('travelling');startTime=performance.now();raf=requestAnimationFrame(tick);},cfg.departureHoldMs);}
  function reset(){cancel();window.FutureOnboarding?.cancel();window.FutureApp.reset();root.hidden=false;setPhase('idle');root.classList.remove('clock-warp');root._lastPaint=0;root.style.setProperty('--journey-progress',0);root.style.setProperty('--warp',0);root.style.setProperty('--grid-period','2600ms');stage.hidden=true;idle.inert=false;idle.removeAttribute('aria-hidden');showDate(localToday());document.body.classList.add('intro-active');document.querySelector('.skip').setAttribute('tabindex','-1');$('introStatus').textContent='';window.FutureIdlePlayer.show({restart:true});$('enterFuture').focus({preventScroll:true});}
  function skip(){cancel();window.FutureIdlePlayer.hide();window.FutureOnboarding?.cancel();root.hidden=true;document.body.classList.remove('intro-active');window.FutureApp.arrive({route:'map'});}
  $('enterFuture').addEventListener('click',begin);$('replayIntro').addEventListener('click',reset);$('skipArrival').addEventListener('click',skip);
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&phase!=='idle'){reset();return;}if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')].filter(b=>!b.hidden&&b.offsetParent!==null&&!b.closest('[inert]'));if(!buttons.length){e.preventDefault();$('clockHeading').focus();}else{const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&phase==='travelling'){cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}});
  window.FutureIntro={reset,begin,skip,state:()=>({phase,index,totalDays:timeline.length,lastShown})};
  reset();
})();
