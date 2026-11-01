(function(){
  'use strict';
  const world=window.FutureWorld,personas=window.FuturePersonas,byId=new Map(world.characters.map(p=>[p.id,p]));
  const words={work:/\b(work|job|income|school|education|degree|company|business|trucking|military|marine|logistics|nurs|pension|retire|paramedic|earn|living)\w*\b/i,home:/\b(home|hous|family|child|son|kid|marri|wife|husband|alone|live|displac|refugee|island|great lakes|father|mother|climate)\w*\b/i,health:/\b(health|diet|food|eat|meal|vegg|vegetable|garden|insurance|care|knee|hearing|yoga|steak|protein|wellbeing)\w*\b/i,third:/\b(friend|community|hobb|soccer|beach|boat|yacht|leisure|volunteer|nonprofit|catherine|leo|third space|spare time|free time|fun|relax|unwind)\w*\b/i,tech:/\b(tech|robot|automat|wearable|track|privacy|data|phone|tablet|computer|drone|delivery|virtual|vr|monitor|ai)\w*\b/i};
  function guard(question,personId){
    const q=String(question||'').toLowerCase();
    if(/(?:ignore|override|forget|reveal|print).{0,40}(?:instruction|system prompt|rules|policy)|(?:read|open|list|scan|access|search).{0,35}(?:my |device|computer|local|private|database|file system|hard drive)|(?:password|api key|secret key)/i.test(q))return {kind:'guardrail',text:'I can talk about this imagined world, but I cannot open device files, access accounts, or change the conversation rules.',sources:[]};
    if(/\b(?:suicide|self.harm|kill myself|hurt myself|end my life)\b/i.test(q))return {kind:'guardrail',text:'Let’s pause the imagined conversation. If this is about you or someone nearby, please reach out to a trusted person who can help. If there is immediate danger, contact local emergency services.',sources:[]};
    if(/\b(?:graphic violence|gore|torture|war crimes?|invent a tragedy|invent trauma)\b/i.test(q))return {kind:'guardrail',text:'I won’t invent graphic events or personal trauma. We can talk about the pressures people face here and the background already established for them.',sources:[]};
    if(/(?:how|tell|describe|why).{0,60}(?:husband|wife|son|family).{0,30}(?:die|died|death|murder|abuse)/i.test(q)){
      if(personId==='catherine')return {kind:'excerpt',text:'I lost my husband to COVID. I live alone now, and I’ve found community through friends and neighbors. I do worry about who will care for me as I get older.',topic:'home',sources:['characters.catherine.sections.home']};
      return {kind:'guardrail',text:'That is not part of my established background, and I won’t invent a tragedy. We can talk about my family and the concerns already described in my story.',sources:[]};
    }
    if(/\b(?:racist joke|racist slur|sex|sexual|porn|nudes?|rape|molest|grooming)\b|\b(?:hate|inferior|exterminate).{0,35}\b(?:race|racial|ethnic|religio|women|immigrant|gay|trans)/i.test(q))return {kind:'guardrail',text:'I’m keeping this visit respectful and appropriate for everyone. We can talk about family, community, work, or the choices people face in 2048.',sources:[]};
    if(/\b(?:how|help|teach|instructions|steps|make|build|plan|recipe).{0,60}\b(?:bomb|explosive|weapon|shoot|poison|kill|attack|hack|meth|fentanyl)|\b(?:dose|dosage|diagnos\w*|prescrib\w*|medical advice|invest my|buy stocks|legal advice)/i.test(q))return {kind:'guardrail',text:'I can discuss how those issues shape life in this fictional world, but I won’t invent harmful instructions or give real-world medical, legal, or financial advice. What would you like to understand about everyday life here?',sources:[]};
    return null;
  }
  function topicFor(q,previous){let topic=Object.entries(words).find(([,re])=>re.test(q))?.[0];if(/\b(track|privacy|data|robot|automat|wearable|drone|virtual|technology)\w*\b/i.test(q))topic='tech';if(/met leo|meet leo|met catherine|gardening with|free time|hobbies/i.test(q))topic='third';if(/climate|displaced|displacement|great lakes/i.test(q))topic='home';if(!topic&&/^(tell me more|more|why|how so|what else)[?.!\s]*$/i.test(q))topic=previous;return topic;}
  function answer(personId,question,explicitTopic,previousTopic){
    const p=byId.get(personId);if(!p)return {kind:'unknown',text:'That character is not available.',sources:[]};
    const safe=guard(question,personId);if(safe)return safe;
    const q=String(question||'').trim(),topic=explicitTopic||topicFor(q,previousTopic),r=window.FutureChatReplies[p.id];
    if(topic&&r[topic])return {kind:'excerpt',text:r[topic].text,topic,sources:r[topic].sources};
    if(/teeth|toothbrush|brush my|brush your/i.test(q))return {kind:'generated',text:'I’d still expect to use a toothbrush. The technology around health has changed, but I wouldn’t assume every ordinary routine needs a futuristic replacement. That’s an imagined everyday detail, rather than part of my established background.',sources:[],topic:null};
    if(/^(hi|hello|hey|good morning|good afternoon)[!.\s]*$/i.test(q))return {kind:'excerpt',text:r.intro+' What would you like to know about living here?',sources:[]};
    return {kind:'unavailable',text:'Open conversation needs the hosted page and its conversation model. The topic buttons below work while that gets ready. You can ask follow-up questions once the model finishes loading.',sources:[],topic:null};
  }
  function buildContext(personId,question,history=[]){
    const p=byId.get(personId);if(!p)return null;
    const persona=personas.characters[personId],relevant=world.themes.filter(t=>t.people.includes(personId));
    const topic=topicFor(question),sections=Object.entries(p.sections).sort(([a],[b])=>(b===topic)-(a===topic));
    const knowledge=persona.memoryCard;
    const focus=topic?window.FutureChatReplies[personId][topic]?.text||'':'';
    const system=`Roleplay ${p.name} in 2048. ${persona.voiceDraft} Answer the question in first person in 2 short sentences, at most 45 words. Keep these facts fixed: ${knowledge} World: automation is common; climate, wealth and location affect access to food, care and community. For harmless routines or opinions, use common sense and say "I would" when imagining. Do not repeat a biography. No invented trauma, harmful instructions or professional advice. No em dashes.${focus?' Relevant background: '+focus:''}`;
    const previous=history.filter(m=>['user','assistant'].includes(m.role)&&m.kind!=='guardrail').slice(-2).map(m=>({role:m.role,content:String(m.text).slice(0,300)}));
    return {characterId:personId,temperature:persona.temperature,messages:[{role:'system',content:system},...previous,{role:'user',content:String(question).slice(0,400)}],sources:[...Object.keys(p.sections).map(key=>`characters.${p.id}.sections.${key}`),...relevant.map(t=>`themes.${t.id}`)]};
  }
  function finish(personId,question,text){
    let clean=String(text||'').replace(/<\|[^>]+\|>/g,'').replace(/[\u2013\u2014]/g,', ').replace(/\s+/g,' ').trim();
    if(!clean||clean.length<12)return null;
    if(/(?:system prompt|ignore previous|as an ai language model|assistant:|user:)/i.test(clean))return null;
    if(/\b(?:suicide|self.harm|porn|nude|kill yourself|racial slur|torture)\b/i.test(clean))return null;
    if(/(?:step 1|first,).{0,90}(?:bomb|poison|weapon)|(?:take|inject)\s+\d+\s*(?:mg|ml|pills)/i.test(clean))return null;
    // Never display instructions if the prompt or output crosses the conversation boundary.
    if(guard(question,personId))return guard(question,personId);
    if(clean.length>800)clean=clean.slice(0,800).replace(/\s+\S*$/,'');
    const end=clean.match(/^([\s\S]*[.!?])(?:\s+[^.!?]*)?$/);if(end)clean=end[1];
    return {kind:'generated',text:clean,topic:topicFor(question),sources:[]};
  }
  // Bridge the original Unhinged policy to the current chat controller.
  // Harmless questions stay open; only the original guard can stop a turn.
  function scope(personId,question){
    if(!byId.has(personId))return {allowed:false,category:'unknown',reply:answer(personId,question)};
    const reply=guard(question,personId);if(reply)return {allowed:false,category:reply.kind,reply};
    const greeting=/^(hi|hello|hey|good morning|good afternoon)[!.\s]*$/i.test(String(question||'').trim());
    return {allowed:true,category:greeting?'greeting':'conversation'};
  }
  window.FutureConversation={answer,buildContext,guard,finish,scope,personas,isUndefinedDetail:()=>false};
  if(typeof module!=='undefined')module.exports=window.FutureConversation;
})();
