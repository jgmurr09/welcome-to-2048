(function(){
  'use strict';
  const $=id=>document.getElementById(id),root=$('onboarding'),all=window.FutureOnboardingData,steps=all.filter(s=>s.mode==='dialogue'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let index=0,raf=0,started=0,typing=false,current='';
  function printText(text){$('onboardText').querySelector('.onboard-typed').textContent=text;}
  function finishText(){cancelAnimationFrame(raf);typing=false;printText(current);root.querySelector('.dialogue-box').classList.remove('is-typing');$('nextOnboarding').innerHTML=(index===steps.length-1?'SHOW ME THE MAP':'CONTINUE')+' <span aria-hidden="true">→</span>';}
  function type(now){const count=Math.floor((now-started)/window.FutureExperienceConfig.textCharacterMs);printText(current.slice(0,count));if(count>=current.length)finishText();else raf=requestAnimationFrame(type);}
  function connectionPreview(){
    const U=window.WorldUI,G=window.FutureConnections,leo=U.people.get('leo');
    const branches=G.related('leo').filter(id=>G.byId.get(id)?.type==='shared').slice(0,3).map(id=>({activity:G.byId.get(id),person:U.people.get(G.related(id).find(p=>p!=='leo'&&U.people.has(p)))})).filter(b=>b.person);
    const description=branches.map(b=>`${b.person.name} through ${b.activity.label||b.activity.name}`).join(', ');
    return `<div class="onboard-connection-map" role="img" aria-label="A preview of Leo’s connections: ${U.esc(description)}."><svg class="onboard-preview-edges" viewBox="0 0 720 300" preserveAspectRatio="none" aria-hidden="true">${branches.map((b,i)=>{const x=(i+.5)*720/branches.length;return `<path d="M360 54 C360 112 ${x} 112 ${x} 168 M${x} 168 V264"/>`;}).join('')}</svg><div class="onboard-preview-card preview-leo" style="--person-color:${leo.color}">${U.portrait('leo')}<strong>Leo</strong></div>${branches.map((b,i)=>{const left=(i+.5)*100/branches.length;return `<div class="onboard-preview-card preview-activity" style="left:${left}%">${U.icon(b.activity.id)}<strong>${U.esc(U.titleCase(b.activity.label||b.activity.name))}</strong></div><div class="onboard-preview-card preview-person" style="left:${left}%;--person-color:${b.person.color}">${U.portrait(b.person.id)}<strong>${b.person.name}</strong></div>`;}).join('')}</div>`;
  }
  function render(){
    cancelAnimationFrame(raf);root.scrollTop=0;const step=steps[index],U=window.WorldUI;current=step.text;
    root.classList.toggle('has-cast',step.id==='people');root.classList.toggle('has-connection-preview',step.id==='connections');
    $('onboardScene').classList.remove('has-map-snapshot');$('onboardScene').innerHTML=step.id==='connections'?'':U.scene(step.scene);
    $('onboardPortrait').innerHTML=step.id==='people'?'<div class="onboard-cast">'+['ken','sophia','veronica','catherine'].map(id=>{const p=U.people.get(id);return '<figure class="cast-person">'+U.portrait(id)+'<figcaption>'+p.name+'<small>'+U.esc(U.titleCase(p.role))+'</small></figcaption></figure>';}).join('')+'</div>':step.id==='connections'?connectionPreview():U.portrait('leo');
    $('onboardCounter').textContent=String(index+1).padStart(2,'0')+' / '+String(all.length).padStart(2,'0');$('onboardTitle').textContent=step.title;$('onboardAccessible').textContent=step.text;
    $('onboardDots').innerHTML=all.map((s,i)=>'<i class="'+(i===index?'active':'')+'"></i>').join('');$('previousOnboarding').disabled=index===0;
    // Reserve the final paragraph's space before printing the first character.
    $('onboardText').dataset.fullText=current;$('onboardText').innerHTML='<span class="onboard-typed"></span>';
    typing=true;root.querySelector('.dialogue-box').classList.add('is-typing');$('nextOnboarding').innerHTML='REVEAL TEXT <span aria-hidden="true">→</span>';$('onboardTitle').focus({preventScroll:true});
    if(reduced.matches)finishText();else{started=performance.now();raf=requestAnimationFrame(type);}
  }
  function cancel(){cancelAnimationFrame(raf);typing=false;root.hidden=true;root.inert=true;}
  function leave(tour){cancel();window.FutureApp.arrive({tour});}
  function start(at=0){window.FutureApp.hide();window.FutureIdlePlayer?.hide();$('futureIntro').hidden=true;document.body.classList.remove('intro-active');root.hidden=false;root.inert=false;index=Math.max(0,Math.min(steps.length-1,Number(at)||0));render();}
  $('nextOnboarding').addEventListener('click',()=>{if(typing){finishText();return;}if(index===steps.length-1){leave(true);return;}index++;render();});
  $('previousOnboarding').addEventListener('click',()=>{if(index>0){index--;render();}});
  $('skipOnboarding').addEventListener('click',()=>leave(false));
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();leave(false);}if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')].filter(b=>!b.disabled),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if((e.key==='Enter'||e.key===' ')&&e.target===$('onboardTitle')){e.preventDefault();$('nextOnboarding').click();}});
  window.FutureOnboarding={start,cancel,state:()=>({index,typing,visible:!root.hidden})};
})();
