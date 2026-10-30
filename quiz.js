(function(){
  'use strict';
  const data=window.FutureQuizData,W=window.FutureWorld;
  function source(path){const [kind,id,,section]=path.split('.');if(kind==='characters')return W.characters.find(p=>p.id===id)?.sections[section]||'';return W[kind]?.find(item=>item.id===id)?.text||'';}
  function resolve(answers){
    const chosen=data.questions.map((q,i)=>q.options.find(o=>o.id===answers[i]));if(chosen.some(o=>!o))return null;
    const personScores=Object.fromEntries(W.characters.map(p=>[p.id,0])),themeScores=Object.fromEntries(W.themes.map(t=>[t.id,0]));
    chosen.forEach(o=>{Object.entries(o.people).forEach(([id,n])=>personScores[id]+=n);Object.entries(o.themes).forEach(([id,n])=>themeScores[id]+=n);});
    return {people:[...W.characters].sort((a,b)=>personScores[b.id]-personScores[a.id]).slice(0,2).map(p=>p.id),themes:[...W.themes].sort((a,b)=>themeScores[b.id]-themeScores[a.id]).slice(0,2).map(t=>t.id),choices:chosen.map((o,i)=>({question:data.questions[i].id,title:o.title,node:o.node,icon:o.icon,world:o.world,source:o.source,sources:o.sources})),sources:[...new Set(chosen.flatMap(o=>o.sources))],personScores,themeScores};
  }
  if(typeof document==='undefined'){if(typeof module!=='undefined')module.exports={resolve,source};return;}
  const U=window.WorldUI;let index=0,answers=[],result=null,phase='intro';
  const labels={home:'WHERE YOU LIVE',daytime:'HOW YOU SPEND THE DAY',food:'WHAT YOU EAT',care:'HOW YOU GET CARE',community:'WHO YOU SPEND TIME WITH',question:'WHAT YOU WANT TO UNDERSTAND'};
  function render(){
    let body='';
    if(phase==='intro')body=`<header class="quiz-intro"><span class="eyebrow">YOUR DAY IN 2048</span><h1 id="mainTitle" tabindex="-1">Imagine your everyday life.</h1><p>${U.esc(data.intro)}</p><div class="quiz-examples"><span>${U.icon('home')}Where you live</span><span>${U.icon('wearable')}How you get care</span><span>${U.icon('people')}Who you spend time with</span></div><p class="quiz-time">6 choices · Go at your own pace</p><button type="button" data-quiz-begin class="primary-button">BUILD MY DAY <span>→</span></button></header>`;
    else if(phase==='questions'){
      const q=data.questions[index];body=`<header class="quiz-question-header"><span class="eyebrow">YOUR DAY IN 2048</span><span class="quiz-progress">${String(index+1).padStart(2,'0')} / 06</span></header><div class="quiz-meter"><i style="width:${(index+1)/6*100}%"></i></div><h1 id="mainTitle" tabindex="-1">${U.esc(q.title)}</h1><div class="quiz-options">${q.options.map(o=>`<button type="button" data-quiz-answer="${o.id}" aria-pressed="${answers[index]===o.id}"><span class="quiz-option-dot"></span><span><strong>${U.esc(o.title)}</strong><small>${U.esc(o.detail)}</small></span>${U.icon(o.icon)}</button>`).join('')}</div><footer class="quiz-actions"><button type="button" data-quiz-back class="quiet-button">← BACK</button>${result?'<button type="button" data-quiz-results class="quiet-button">RETURN TO MY WORLD</button>':''}<button type="button" data-quiz-next class="primary-button" ${answers[index]?'':'disabled'}>${index===5?'SEE MY WORLD':'NEXT'} →</button></footer>`;
    }else{
      body=`<header class="quiz-result-header"><div><span class="eyebrow">YOUR DAY IN 2048</span><h1 id="mainTitle" tabindex="-1">Your world, from your choices.</h1><p>Here is how the pieces you chose come together in this possible future. Your world stays in this tab while you explore.</p></div><button type="button" data-quiz-edit class="outline-button">EDIT MY CHOICES</button></header><div class="your-world-grid">${result.choices.map(c=>`<article class="your-world-moment"><div class="moment-symbol">${U.icon(c.icon)}</div><span class="eyebrow">${labels[c.question]}</span><h2>${U.esc(c.title)}</h2><p>${U.esc(c.world)}</p><button type="button" data-select="${c.node}" class="text-button">SEE THIS IN THE MAP <span>↗</span></button></article>`).join('')}</div><section class="quiz-world-connections"><h2>Keep exploring the questions behind your day.</h2><div>${result.themes.map(id=>`<button type="button" data-map-theme="${id}" class="outline-button">${U.esc(window.FuturePresentation.themes[id].title)} ↗</button>`).join('')}</div><p>You can also compare experiences with ${result.people.map(id=>W.characters.find(p=>p.id===id).name).join(' and ')}.</p><div class="quiz-people">${result.people.map(id=>{const p=W.characters.find(p=>p.id===id);return `<button type="button" data-person="${id}">${U.portrait(id)}<span><strong>${p.name}</strong><small>${U.esc(p.role)}</small></span></button>`;}).join('')}</div></section>`;
    }
    return `<section class="quiz-page ambient" id="quizView"><div class="quiz-inner ${phase==='result'?'has-results':''}">${body}</div></section>`;
  }
  function update(){const root=document.getElementById('quizView');if(!root)return;root.outerHTML=render();document.getElementById('mainView').scrollTop=0;document.getElementById('mainTitle')?.focus({preventScroll:true});}
  document.addEventListener('click',e=>{const b=e.target.closest('#quizView button');if(!b)return;
    if(b.hasAttribute('data-quiz-begin')){phase='questions';update();}
    else if(b.dataset.quizAnswer){answers[index]=b.dataset.quizAnswer;const scroll=document.getElementById('mainView').scrollTop;update();document.getElementById('mainView').scrollTop=scroll;document.querySelector(`[data-quiz-answer="${b.dataset.quizAnswer}"]`)?.focus({preventScroll:true});}
    else if(b.hasAttribute('data-quiz-next')&&answers[index]){if(index<5)index++;else{result=resolve(answers);phase='result';}update();}
    else if(b.hasAttribute('data-quiz-back')){if(index>0)index--;else phase='intro';update();}
    else if(b.hasAttribute('data-quiz-edit')){phase='questions';index=0;update();}
    else if(b.hasAttribute('data-quiz-results')&&result){phase='result';update();}
  });
  window.FutureQuiz={render,resolve,source,start(){window.FutureApp.route('quiz');},reset(){index=0;answers=[];result=null;phase='intro';},context:()=>result?{choices:result.choices,sources:result.sources}:null,state:()=>({phase,index,answers:[...answers],hasResult:!!result})};
})();
