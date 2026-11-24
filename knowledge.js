(function(){
  'use strict';
  const W=window.FutureWorld,K=window.FutureKnowledgeData,C=window.FutureConnectionData;
  const words=text=>String(text||'').toLowerCase().match(/[a-z]{3,}/g)||[];
  const compact=(text,max=780)=>String(text||'').replace(/\s+/g,' ').slice(0,max);
  const bySource=new Map(K.sources.map(s=>[s.id,s]));
  function generation(personId){
    const p=W.characters.find(p=>p.id===personId);if(!p)return null;
    const year=W.year-p.age;return K.generations.find(g=>year>=g.born[0]&&year<=g.born[1])||null;
  }
  function source(id){
    const [kind,key,,section]=String(id).split('.');
    if(kind==='research'){const s=bySource.get(key);return s?{...s,label:s.title+' ('+s.year+')',text:s.summary,category:'Research context',location:'PDF pages '+s.pages}:null;}
    if(kind==='truths'){const t=W.truths.find(t=>t.id===key);return t?{...t,label:t.title,text:t.text,category:'2048 World Truth'}:null;}
    if(kind==='themes'){const t=W.themes.find(t=>t.id===key);return t?{...t,label:t.title,text:t.text,category:'2048 world theme'}:null;}
    if(kind==='characters'){const p=W.characters.find(p=>p.id===key);return p?{label:p.name+(section?' / '+section:''),text:section?p.sections[section]:window.FuturePersonas.characters[key].memoryCard,category:'Established story'}:null;}
    if(kind==='connections'){const c=C[key];return c?{label:c.title||W.artifacts.find(a=>a.id===key)?.title||key,text:c.text||W.artifacts.find(a=>a.id===key)?.text||'',category:'2048 connection'}:null;}
    return null;
  }
  function retrieve(question,{characterId=null,themeId='all',focusId='all'}={}){
    const input=words(question),own=K.personas[characterId],byId=new Map(K.focusAreas.map(f=>[f.id,f]));
    const selectedFocus=byId.get(focusId);
    const focus=K.focusAreas.map((f,i)=>({f,i,score:f.keywords.reduce((n,k)=>n+input.filter(w=>w===k||w.startsWith(k)).length,0)*3})).sort((a,b)=>b.score-a.score||a.i-b.i);
    // A visitor's explicit lens always comes before inferred topic matches.
    const chosen=[...(selectedFocus?[selectedFocus]:[]),...focus.filter(x=>x.score>0&&x.f!==selectedFocus).slice(0,selectedFocus?1:2).map(x=>x.f)];
    const overview=!characterId&&focusId==='all'&&!chosen.length;
    if(!chosen.length)chosen.push(...(overview?[byId.get('connection'),byId.get('work')]:[byId.get(own?.focus[0]||'home')]));
    const topicTruths=[
      [/wearable|track|monitor|privacy|opting? out|opt.out|\bdata\b/i,['wearables','bio','trust']],
      [/child|kid|teen|parent/i,['children','family']],
      [/retire|aging|elder|older|independen/i,['elder','family','health']],
      [/hospital|emergency|paramedic|clinic|doctor/i,['hospitals','health','money']],
      [/medicine|medication|supplement|treatment/i,['medicine','health','bio']],
      [/deliver|truck|shipping|logistics/i,['delivery','robotics','supply']],
      [/material|supply|manufactur/i,['supply','robotics','global']],
      [/food|diet|garden|protein|meal/i,['health','supply']],
      [/money|wealth|afford|cost|inequal|income/i,['money','bio','health']],
      [/robot|automat|\bai\b/i,['ai','robotics','trust']]
    ].filter(([pattern])=>pattern.test(question)).map(([,ids])=>ids);
    const explicit=[...topicTruths.map(ids=>ids[0]),...topicTruths.flatMap(ids=>ids.slice(1))];
    const truthIds=[...new Set([...(selectedFocus?selectedFocus.truths.slice(0,2):[]),...explicit,...(overview?['global','health','ai']:[]),...chosen.flatMap(f=>f.truths)])].slice(0,characterId?2:3);
    if(!truthIds.length)truthIds.push('global');
    const researchIds=[...new Set(Array.from({length:4},(_,i)=>chosen.map(f=>f.research[i]).filter(Boolean)).flat())];
    // Personal lenses prioritize relevant sources without assigning population averages to a person.
    if(own)researchIds.sort((a,b)=>(own.research.includes(b)?1:0)-(own.research.includes(a)?1:0));
    const research=researchIds.slice(0,characterId?1:2).map(id=>bySource.get(id));
    const inferred=[['climate',/climate|fresh water|disaster|displac|migration/i],['materials',/material|mining|supply chain/i],['education',/educat|school|learn|credential|degree|skill/i],['wealth',/wealth|income|afford|inequal|money/i],['geography',/geograph|rural|urban|city|suburb|location/i]].find(([,pattern])=>pattern.test(question))?.[0];
    const theme=W.themes.find(t=>t.id===(themeId==='all'?inferred:themeId));
    const themeText=theme?window.FuturePresentation.themes[theme.id].paragraphs.join(' '):'';
    const ignored=new Set(['the','for','and','how','what','why','with','about','this','that','your','does','life','world','compare','leo','sophia','ken','veronica','catherine']);
    const terms=[...new Set([...input.filter(w=>!ignored.has(w)),...selectedFocus?.keywords||[]])];
    const relations=Object.entries(C).filter(([,c])=>!characterId||c.people?.[characterId]).map(([id,c])=>({id,c,score:terms.filter(w=>words((c.title||'')+' '+(W.artifacts.find(a=>a.id===id)?.title||'')+' '+(c.text||'')+' '+JSON.stringify(c.people||{})).some(k=>k.startsWith(w))).length+(id==='wearable'&&explicit.includes('wearables')?10:0)})).sort((a,b)=>b.score-a.score).filter(x=>x.score>0).slice(0,1);
    const facts=truthIds.map(id=>source('truths.'+id));
    const context=[...facts.map(s=>'WORLD TRUTH '+s.label+': '+compact(s.text,characterId?650:850)),
      themeText?'WORLD THEME '+theme.title+': '+compact(themeText):'',
      selectedFocus?'FOCUS LENS '+selectedFocus.title+': '+selectedFocus.question:'',
      ...relations.map(({id,c})=>'CONNECTION: '+compact((c.text||W.artifacts.find(a=>a.id===id)?.text||'')+' '+(characterId?Object.values(c.people?.[characterId]||{}).join(' '):''),500)),
      own?'PERSONAL LENS (interpretation, not extra biography): '+own.lens:'',
      characterId&&generation(characterId)?'GENERATION LENS: '+generation(characterId).title+'. '+generation(characterId).lens:'',
      ...research.map(s=>'RESEARCH CONTEXT '+s.year+' / '+s.publisher+': '+s.summary)].filter(Boolean).join('\n');
    return {context,focus:chosen,sources:[...facts.map(t=>'truths.'+t.id),...(theme?['themes.'+theme.id]:[]),...relations.map(r=>'connections.'+r.id),...research.map(s=>'research.'+s.id),...(own?['research.generations']:[])]};
  }
  window.FutureKnowledge={retrieve,source,generation,data:K};
})();
