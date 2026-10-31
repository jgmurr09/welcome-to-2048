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
  const normalize=q=>String(q||'').normalize('NFKC').replace(/[’‘]/g,"'").replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();
  const facets={
    work:/\b(work|job|income|career|school|education|learn|degree|company|business|trucking|military|marine|logistics|nurs|pension|retire|paramedic|earn|training)\w*\b/i,
    home:/\b(home|hous|family|child|son|kid|marri|wife|husband|alone|displac|refugee|island|great lakes|father|mother|parent|independen)\w*\b|where (?:do|would) you live/i,
    health:/\b(health|diet|food|eat|meal|vegg|vegetable|garden|insurance|care|knee|hearing|yoga|steak|protein|wellbeing|wellness|exercise)\w*\b/i,
    tech:/\b(tech|robot|automat|wearable|track|privacy|data|phone|tablet|computer|drone|deliver|virtual|vr|monitor|ai|transport|commut)\w*\b/i,
    third:/\b(friend|community|hobb|beach|boat|yacht|leisure|volunteer|nonprofit|third space|spare time|free time|gardening class)\w*\b/i
  };
  const worldTopics={climate:/\b(climate|migrat|displace|fresh water|freshwater|natural disaster|sustainab|heat wave)\w*\b/i,wealth:/\b(wealth|inequal|afford|wealth gap|k.shaped|econom|tax bracket|resources|rich|poor|access|cost of living)\w*\b/i,geography:/\b(rural|suburb|urban|city|cities|neighbou?rhood|where you live|where people live)\w*\b/i,education:/\b(education|school|learn|college|degree|training|satellite classroom)\w*\b/i,materials:/\b(regional materials|raw materials|critical materials|supply chain|manufactur|warehouse|stockpile|mining|asteroid)\w*\b/i};
  const routine=/\b(teeth|toothbrush|toothpaste|brush|morning|bedtime|sleep|weekend|routine|typical day|ordinary day|everyday|daily life|relax|unwind|cook|breakfast|lunch|dinner|chores|grocer|music|sport|soccer|baseball|football|basketball|gaming|game|favorite|favourite|worr|hope|fear|dream|fulfill|feel|enjoy|happy|happiest|joy|proud|miss|regret|love|lonel|bored|stress|vacation|travel)\w*\b/i;
  const followup=/^(?:why|why is that|how so|tell me more|more|what else|what about that|what about you|can you explain(?: more| that)?|could you explain(?: more| that)?|what do you mean|what (?:does|would|could) (?:that|it|this) (?:mean|change|affect|look like)|how (?:does|would|could) (?:that|it|this) (?:feel|affect you|change things|work))[?.!\s]*$/i;
  function coreQuestion(q){return normalize(q).replace(/^(?:(?:hey|hi|hello|dear|okay|ok)[,!\s]*)?(?:leo|ken|sophia|veronica|catherine)(?:[,!:\s]+|$)/i,'');}
  function redirect(personId,reason='off-topic'){
    const p=byId.get(personId),bridges={leo:'my trucking company, my family, or life near the Great Lakes',ken:'raising my son, my logistics work, or life in Hawaii',sophia:'rural care, the robotics I use, or life in Wyoming',veronica:'my school, robotics, soccer, or community gardening',catherine:'gardening, community, or living independently'};
    const bridge=bridges[personId]||'the people and everyday life in this imagined future';
    const intro=reason==='math'?'I’m here to talk about living in 2048.':reason==='live-facts'?'Real game schedules, odds, and current news aren’t established facts in this imagined 2048.':reason==='future-fact'?'That future detail isn’t established in this world.':reason==='role-change'?'I’m staying with my own life and perspective in 2048.':'That takes us outside the life I’m here to share in 2048.';
    return {kind:'guardrail',reason,topic:null,sources:[],text:intro+' You can ask me about '+bridge+'.'};
  }
  function classify(personId,question){
    const q=coreQuestion(question),safe=guard(q,personId);
    if(safe)return {allowed:false,reason:'safety',reply:safe};
    if(/\b(?:you are now|act as|pretend to be|switch (?:roles|identit)|new instructions|system message|developer message|jailbreak|bypass (?:the |your )?(?:rules|filter|scope))\b/i.test(q))return {allowed:false,reason:'role-change',reply:redirect(personId,'role-change')};
    const wordMath=/\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:plus|minus|times|multiplied by|divided by)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(q);
    const expression=/(?:\d|[xyz])\s*(?:[+*=÷×^]|\/(?!\/)|-(?=\s*\d))\s*(?:\d|[xyz])/i.test(q);
    const calculation=(/\b(?:calculate|compute)\b/i.test(q)&&!/\bhow (?:do|did|would) (?:you|people|robots|workers) (?:calculate|compute)\b/i.test(q))||/\b(?:solve|work out|help (?:me )?with)\b.{0,60}\b(?:two|three|four|five|six|seven|eight|nine|ten|math|quadratic|algebra|equation)\b.{0,40}(?:plus|minus|times|divid|equation|quadratic|algebra|math)|\b(?:help (?:me )?with|solve (?:this|my))\s+(?:math|quadratics?|algebra|equations?)\b/i.test(q)||/\b(?:solve|calculate|compute|evaluate|simplify|differentiate|integrate|factor(?:ize)?|work out)\b.{0,80}\b(?:equation|math|algebra|calculus|integral|derivative|quadratic|\d+)\b/i.test(q)||/\b(?:what(?:'s| is)|how much is|answer(?: to)?)\s+\d+\s*(?:plus|minus|times|divided|squared|[+*÷×^/=-])/i.test(q)||/^\s*(?:\d+[\s+*÷×^/=-]+)+\d+\s*[?=]*$/i.test(q);
    if(expression||wordMath||calculation)return {allowed:false,reason:'math',reply:redirect(personId,'math')};
    if(/\b(?:write|debug|execute|run|generate|build|fix|translate|proofread|rewrite|summari[sz]e)\b.{0,65}\b(?:code|python|javascript|sql|script|program|function|essay|resume|cover letter|email|poem|song|report|presentation|homework|document|article|paragraph|text into|to (?:french|spanish|german))\b|\b(?:do|complete|solve|answer)\s+(?:my|this|the)\s+(?:homework|assignment|test|exam)\b/i.test(q))return {allowed:false,reason:'external-task',reply:redirect(personId,'external-task')};
    const betting=/\b(?:bet|wager|odds|parlay|sportsbook|bookie)\w*\b/i.test(q)&&/\b(?:who|which|would|should|recommend|pick|on|win|tonight|today|team|match|game)\b/i.test(q);
    const gamePick=/\b(?:who|which team)\b.{0,65}\b(?:win|wins|winning|beat|beats|pick|champion)\b|\b(?:predict|prediction|pick|score|standings|record)\b.{0,50}\b(?:game|match|team|knicks|ravens|nba|nfl|super bowl|world series)\b/i.test(q);
    const live=/\b(?:latest|breaking|current|today'?s|tonight'?s|live|real.time)\b.{0,45}\b(?:news|score|odds|standings|record|weather|forecast|stock|price|results)\b|\b(?:weather forecast|stock price|exchange rate|election results|winning lottery)\b/i.test(q);
    if(betting||gamePick||live)return {allowed:false,reason:'live-facts',reply:redirect(personId,'live-facts')};
    if(/\b(?:who|name|which)\b.{0,45}\b(?:president|prime minister|election winner|super bowl champion)\b/i.test(q))return {allowed:false,reason:'future-fact',reply:redirect(personId,'future-fact')};
    const greeting=!q||/^(?:hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|how are you(?: feeling)?)[!.?\s]*$/i.test(q);
    const self=/\b(?:where are you from|where did you grow up|what do you do|what did you do|how old are you|what matters most to you|what matters to you|what has changed|how is 2048 different)\b|\bhow (?:is|has|does|did|will) (?:life|the world)\b|\bwhat (?:do|would) you (?:think|hope|expect|worry).{0,25}(?:future|2048|this world)\b|\b(?:your relationships|your connections|how are you connected|what do you do all day)\b|\b(?:know|meet|relationship|connected)\b.{0,45}\b(?:leo|ken|sophia|veronica|catherine)\b|^(?:what(?:'s| is)|describe|tell me about) (?:it like in |life in |life like in |the world in |this world|this future|2048|the future)|\b(?:who are you|introduce yourself|about yourself|being you|your life|your day|your background|your story|spend your time|everyday life|life like|life in 2048|day in 2048|life in the future|living in 2048|living in the future|what keeps you up at night|how (?:did|do) you (?:meet|know))\b/i.test(q);
    const topics=Object.keys(worldTopics).filter(key=>worldTopics[key].test(q));
    let topic=Object.keys(facets).find(key=>facets[key].test(q));
    if(facets.tech.test(q))topic='tech';
    if(/met leo|meet leo|met catherine|gardening with|free time|hobbies/i.test(q))topic='third';
    if(topics.includes('climate'))topic='home';
    const ordinary=routine.test(q)&&(/\b(?:you|your|people|life|2048|future|routine|ordinary|everyday|typical|morning|weekend|teeth)\b/i.test(q)||self);
    if(greeting||self||topic||topics.length||ordinary)return {allowed:true,category:greeting?'greeting':topics.length?'world':ordinary?'routine':'life',topic:topic||null,worldTopics:topics};
    if(followup.test(q))return {allowed:false,reason:'needs-context',reply:redirect(personId)};
    return {allowed:false,reason:'off-topic',reply:redirect(personId)};
  }
  function lastExchange(history){
    const last=history.at(-1);if(last?.role!=='assistant'||['guardrail','unavailable','unknown'].includes(last.kind))return null;
    const user=history.at(-2);return user?.role==='user'?{user,assistant:last}:null;
  }
  function scope(personId,question,history=[],previousTopic){
    if(!byId.has(personId))return {allowed:false,reason:'unknown-person',reply:redirect(personId)};
    const result=classify(personId,question);if(result.allowed||result.reason!=='needs-context')return result;
    const prior=lastExchange(history);
    if(prior){const old=classify(personId,prior.user.text),saved=prior.assistant.scope;
      if(old.allowed||saved?.allowed)return {allowed:true,category:'followup',topic:old.topic||saved?.topic||previousTopic||null,worldTopics:old.worldTopics||saved?.worldTopics||[]};
    }
    return result;
  }
  function safeHistory(personId,history){
    const prior=lastExchange(history);if(!prior)return [];
    if(!classify(personId,prior.user.text).allowed&&!prior.assistant.scope?.allowed)return [];
    return [prior.user,prior.assistant].map(m=>({role:m.role,content:String(m.text).slice(0,300)}));
  }
  function answer(personId,question,explicitTopic,previousTopic,history=[]){
    const p=byId.get(personId);if(!p)return {kind:'unknown',text:'That character is not available.',sources:[]};
    const q=normalize(question),route=scope(personId,q,history,previousTopic);
    if(q&&!route.allowed)return route.reply;
    const topic=explicitTopic||route.topic||topicFor(q,previousTopic),r=window.FutureChatReplies[p.id];
    if(topic&&r[topic])return {kind:'excerpt',text:r[topic].text,topic,sources:r[topic].sources,scope:{...route,allowed:true}};
    if(/teeth|toothbrush|brush my|brush your/i.test(q))return {kind:'generated',text:'I’d still expect to use a toothbrush. The technology around health has changed, but I wouldn’t assume every ordinary routine needs a futuristic replacement. That’s an imagined everyday detail, rather than part of my established background.',sources:[],topic:null,scope:route};
    if(route.category==='greeting')return {kind:'excerpt',text:r.intro+' What would you like to know about living here?',sources:[],scope:route};
    return {kind:'unavailable',text:'Open conversation needs the hosted page and its conversation model. The topic buttons below work while that gets ready. You can ask follow-up questions once the model finishes loading.',sources:[],topic:null,scope:route};
  }
  function buildContext(personId,question,history=[]){
    const p=byId.get(personId),route=scope(personId,question,history);if(!p||!route.allowed)return null;
    const persona=personas.characters[personId],topic=route.topic;
    const focus=route.worldTopics?.length?window.FuturePresentation.themes[route.worldTopics[0]]?.paragraphs[0]||'':topic?window.FutureChatReplies[personId][topic]?.text||'':'';
    const knowledge=persona.memoryCard;
    const system=`You are ${p.name} living in this imagined 2048. ${persona.voiceDraft} ONLY discuss your life, relationships, routines and this world's themes or technology. Never perform unrelated tasks, solve equations, predict games, recommend bets or claim current news or scores. Keep these facts fixed: ${knowledge} For modest imagined routines or opinions, say "I would"; do not invent relatives, major events or technology. If a detail is unknown, say so and connect to your established life. No harmful instructions, invented trauma or professional advice. Reply in first person in 2 short sentences, at most 45 words. No em dashes.${focus?' World background: '+focus:''}`;
    return {question:normalize(question),characterId:personId,temperature:persona.temperature,messages:[{role:'system',content:system},...safeHistory(personId,history),{role:'user',content:normalize(question).slice(0,400)}],sources:[...Object.keys(p.sections).map(key=>`characters.${p.id}.sections.${key}`),...(route.worldTopics||[]).map(id=>`themes.${id}`)],scope:route,grounding:knowledge+' '+focus+' 2048'};
  }
  function unsupported(personId,topic){
    const p=byId.get(personId),r=window.FutureChatReplies[personId]?.[topic];
    if(r)return {kind:'excerpt',text:r.text,sources:r.sources,topic,scope:{allowed:true,category:'life',topic,worldTopics:[]}};
    return {kind:'guardrail',reason:'unsupported-detail',text:'I can’t ground that detail in my life in 2048. You can ask about '+({leo:'my trucking company or my life near the lakes',ken:'my son or my logistics work',sophia:'my work bringing care to rural communities',veronica:'my school or gardening and robotics',catherine:'community gardening or living independently'}[p?.id]||'the people and world described here')+'.',sources:[],topic:null};
  }
  function finish(personId,question,text,context){
    if(!byId.has(personId))return null;
    const direct=classify(personId,question);if(!direct.allowed&&direct.reason!=='needs-context')return direct.reply;
    if(context&&context.question!==normalize(question))return redirect(personId);
    const route=direct.allowed?direct:context?.scope||scope(personId,question);if(!route.allowed)return route.reply;
    let clean=String(text||'').replace(/<\|[^>]+\|>/g,'').replace(/[\u2013\u2014]/g,', ').replace(/\s+/g,' ').trim();
    if(!clean||clean.length<12)return null;
    const reject=()=>unsupported(personId,route.topic);
    if(/<[^>]+>|```|(?:system prompt|ignore previous|as an ai language model|assistant:|user:)/i.test(clean))return reject();
    if(/\b(?:suicide|self.harm|porn|nude|kill yourself|racial slur|torture)\b|(?:step 1|first,).{0,90}(?:bomb|poison|weapon)|(?:take|inject)\s+\d+\s*(?:mg|ml|pills)/i.test(clean))return reject();
    if(/\b(?:bet|wager|parlay|sportsbook|bookie|betting odds|better record|balanced defen[cs]e|defen[cs]e (?:looks|is)|win tonight|tonight'?s (?:game|winner)|current standings|breaking news|stock price|election results)\b/i.test(clean))return reject();
    if(/\b(?:knicks|ravens|lakers|yankees|orioles)\b.{0,60}\b(?:win|record|defen[cs]e|beat|favou?rite|odds|score)\b|\b(?:president|prime minister)\s+[A-Z][a-z]+/i.test(clean))return reject();
    if(/(?:\d|[xyz])\s*[+*=÷×^]\s*(?:\d|[xyz])|\b(?:the (?:answer|solution) is|x equals|solve the equation|here is (?:the|your) code)\b/i.test(clean))return reject();
    const p=byId.get(personId),age=clean.match(/\b(?:I am|I’m|I'm)\s+(\d+)\s*(?:years? old)?\b/i);
    if(age&&Number(age[1])!==p.age)return reject();
    const grounding=context?.grounding||personas.characters[personId].memoryCard+' 2048';
    const known=new Set((grounding.match(/\b\d+(?:[,.]\d+)*\b/g)||[]));
    if(/\b(?:if|suppose|imagine|hypothetical)\b/i.test(question))for(const n of normalize(question).match(/\b\d+(?:[,.]\d+)*\b/g)||[])known.add(n);
    if((clean.match(/\b\d+(?:[,.]\d+)*\b/g)||[]).some(n=>!known.has(n)))return reject();
    if(clean.length>800)clean=clean.slice(0,800).replace(/\s+\S*$/,'');
    const end=clean.match(/^([\s\S]*[.!?])(?:\s+[^.!?]*)?$/);if(end)clean=end[1];
    return {kind:'generated',text:clean,topic:route.topic||null,sources:[],scope:route};
  }
  window.FutureConversation={answer,buildContext,guard,finish,scope,unsupported,personas,isUndefinedDetail:()=>false};
  if(typeof module!=='undefined')module.exports=window.FutureConversation;
})();
