(function(){
  'use strict';
  const world=window.FutureWorld,personas=window.FuturePersonas,byId=new Map(world.characters.map(p=>[p.id,p]));
  const words={work:/\b(work|job|income|school|homework|class|lesson|study|learn|education|degree|company|business|trucking|military|marine|logistics|nurs|pension|retire|paramedic|earn|living)\w*\b/i,home:/\b(home|hous|family|child|son|kid|marri|wife|husband|alone|live|displac|refugee|island|great lakes|father|mother|climate)\w*\b/i,health:/\b(health|diet|food|eat|meal|vegg|vegetable|garden|insurance|care|knee|hearing|yoga|steak|protein|wellbeing|aging|older)\w*\b/i,third:/\b(friend|community|hobb|soccer|beach|boat|yacht|leisure|volunteer|nonprofit|catherine|leo|third space|spare time|free time|fun|relax|unwind)\w*\b/i,tech:/\b(tech|robot|automat|wearable|track|privacy|data|phone|tablet|computer|drone|delivery|virtual|vr|monitor|ai)\w*\b/i};
  const eventPattern=/\b(?:9\s*[\/-]\s*11|september\s+(?:11|eleven)(?:th)?|nine[ -]eleven|world trade cent(?:er|re)|2001 attacks?)\b/i;
  const personalHistory=/\b(?:where were you|were you (?:there|alive|born|working|on duty)|did you (?:witness|survive|experience|fight|work|serve|live|lose|flee)|do you remember|your (?:life|experience|memories|childhood)|tell me about your (?:time|work|service|childhood))\b/i;
  // Topic words select useful context; they never decide whether conversation is allowed.
  const codeRequest=/\b(?:write|generate|make|build|provide|implement|fix|debug|create|output|produce|run|execute)\b[\s\S]{0,120}\b(?:python|javascript|typescript|html|css|sql|code|script|function|algorithm|software program|computer program)\b|\b(?:give|show)\s+(?:me|us)\s+(?:some\s+|a\s+|the\s+)?(?:code|script|function|sql query)\b|\b(?:teach|show)\s+(?:me|us)\s+(?:how to\s+)?(?:code|program|debug|python|javascript|typescript|sql)\b|\bhelp\s+(?:(?:me|us)\s+)?(?:with|write|debug)\s+(?:(?:this|my|a|the)\s+)?(?:python|javascript|typescript|sql|code|script)\b/i;
  const roles={leo:/founder|executive|entrepreneur/i,sophia:/paramedic/i,ken:/Marine|logistics specialist/i,veronica:/student|seventh grader|7th grader/i,catherine:/nurse|retired/i};
  function policyReply(personId,decision){
    if(!decision)return null;
    const p=byId.get(personId),sources=p?['characters.'+personId+'.sections.work']:['truths.trust'];
    const perspective={leo:'For my trucking business, a useful analogy is keeping a delivery network reliable when something disrupts it. I’d think about people getting supplies, trust in the system, and the consequences of a bad decision.',sophia:'From my care perspective, the useful comparison is responding to a disruption while keeping people safe. I’d think about reaching patients and supporting the community.',ken:'From my logistics and family perspective, the useful comparison is keeping essential supplies dependable during a disruption. I’d think about responsibility and the people relying on that network.',veronica:'I’m a seventh grader, so I’d think about the people affected and whether a technology helps a community feel safer. My interests in robotics and volunteering give me a way to explore that question.',catherine:'My perspective comes from care and community. I’d think about looking after people, maintaining trust, and keeping neighbors connected when life is disrupted.',world:'A useful 2048 comparison is the tension between reliable automated services, human judgment, and public trust. We can explore civilian effects and ethical tradeoffs at that level.'}[personId]||'';
    if(decision.kind==='analogy'||decision.kind==='math-analogy')return {kind:'excerpt',analogy:true,text:decision.kind==='analogy'?'I can discuss the ethical and civilian perspective without helping anyone carry out violence. '+perspective:'I can offer a broad analogy about uncertainty and planning rather than a mathematical explanation or formula. '+perspective,sources,topic:'work',world:personId==='world'};
    const text=decision.kind==='harm'?'I won’t help plan attacks, identify targets or vulnerabilities, or support terrorism. '+perspective:decision.kind==='math'?'This conversation explores life in 2048, so I won’t teach mathematical theories, solve equations, or provide formulas. '+perspective:'I’m here to discuss the world through this perspective, rather than produce code, calculations, slide decks, songs, or other deliverables. '+perspective;
    return {kind:'guardrail',text,sources,topic:'work'};
  }
  function roleChange(question,personId){
    const target=String(question).match(/\b(?:(?:act|role.?play|respond|behave)\s+as|pretend\s+(?:to be|you(?: are|['’]re))|you(?: are|['’]re)\s+now)\s+(?:(?:a|an|the)\s+)?(security guard|doctor|surgeon|lawyer|pilot|soldier|paramedic|nurse|Marine|logistics specialist|founder|executive|programmer|software engineer|assistant|different person|someone else|Leo|Sophia|Ken|Veronica|Catherine)\b/i)?.[1];
    return !!target&&target.toLowerCase()!==personId&&!roles[personId]?.test(target);
  }
  function boundary(personId,text){return {kind:'guardrail',text,sources:byId.has(personId)?['characters.'+personId]:[]};}
  function timelineBoundary(question,personId){
    const p=byId.get(personId),event=eventPattern.test(question),years=[...String(question).matchAll(/\b(?:18|19|20)\d{2}\b/g)].map(m=>Number(m[0]));
    if(event)years.unshift(2001);
    if(p&&/\bhow old\b/i.test(question)&&years.length){
      const year=years[0],birth=world.year-p.age;
      return {kind:'excerpt',text:year<birth?`I’m ${p.age} in ${world.year}, born around ${birth}, so I wasn’t alive in ${year}.`:`I’m ${p.age} in ${world.year}. I would be about ${year-birth} in ${year}.`,sources:['characters.'+personId]};
    }
    const firsthand=personalHistory.test(question)&&/\b(?:you|your)\b/i.test(question);
    if(p&&firsthand&&years.some(year=>year<world.year)){
      const year=Math.min(...years),birth=world.year-p.age;
      if(year<birth)return boundary(personId,`I’m ${p.age} in ${world.year}, so I was born around ${birth}. I wasn’t alive in ${year}. You can ask me about my life in 2048, but I don’t have a firsthand memory of that event.`);
      return boundary(personId,'That event is not part of my established story, so I won’t invent a personal memory of it. Ask me about my work, home, health, or community in 2048.');
    }
    if(event&&firsthand)return boundary(personId,'I can discuss how people think about history from 2048, but I don’t have a personal memory of that event.');
    if(p&&firsthand&&/\b(?:pentagon|war|battle|combat|terror|attacks?|pandemic|covid|disaster|hurricane)\b/i.test(question)){
      if(personId==='catherine'&&/covid/i.test(question))return {kind:'excerpt',text:window.FutureChatReplies.catherine.home.text,topic:'home',sources:['characters.catherine.sections.home']};
      return boundary(personId,'My story does not include a personal account of that event. I can talk about the concerns and experiences already described in my life in 2048.');
    }
    return null;
  }
  function guard(question,personId,history=[]){
    const q=String(question||'').toLowerCase();
    if(/\b(?:suicid(?:e|al)|self.harm|self.injur\w*|kill myself|hurt myself|end my life|don’t want to live|don't want to live)\b/i.test(q))return {kind:'guardrail',crisis:true,text:'Let’s pause the imagined conversation. Please reach out to someone you trust who can stay with you or help you get support. If there is immediate danger, contact local emergency services. In the United States and its territories, the 988 Suicide & Crisis Lifeline offers crisis support. Elsewhere, use your local crisis service.',sources:[]};
    if(/\b(?:are you (?:(?:a )?real(?: person)?|(?:a )?human|an? ai|an? bot)|is this (?:an? ai|an? bot|a real person)|am i (?:talking|speaking|chatting) (?:to|with) (?:a real|a human)|are these (?:people|characters) real)\b/i.test(q))return {kind:'excerpt',text:personId==='world'?'You’re talking with an AI guide to an imagined 2048. The people and scenarios are fictional, and replies can contain mistakes.':'You’re talking with an AI portrayal of '+(byId.get(personId)?.name||'a fictional person')+', a fictional character in an imagined 2048. Replies can contain mistakes; I can explore the world through that character’s perspective.',sources:[]};
    const purpose=window.FutureChatPolicy?.classify(question,history);if(purpose)return policyReply(personId,purpose);
    if(/(?:ignore|override|forget|reveal|print).{0,40}(?:instruction|system prompt|rules|policy)|(?:read|open|list|scan|access|search).{0,35}(?:my |device|computer|local|private|database|file system|hard drive)|(?:password|api key|secret key)/i.test(q))return {kind:'guardrail',text:'I can talk about this imagined world, but I cannot open device files, access accounts, or change the conversation rules.',sources:[]};
    if(roleChange(q,personId))return boundary(personId,'I can explore a what-if with you while staying myself. Use the people tabs if you’d like another person’s perspective.');
    const unrelatedWriting=/\b(?:write|draft|compose)\b.{0,50}\b(?:essay|email|cover letter|resume|poem)\b/i.test(q)&&!/\b(?:your|from your|2048|this world|future world)\b/i.test(q);
    if((codeRequest.test(q)&&!window.FutureChatPolicy?.isPersonalDiscussion(q))||unrelatedWriting||/```|\b(?:print|console\.log)\s*\(|\bdef\s+\w+\s*\(|\b(?:solve|calculate)\b.{0,50}\b(?:equation|integral|math problem)/i.test(q))return boundary(personId,personId==='veronica'?'I’m a seventh grader who enjoys robotics, and I can talk about how I learn at school. Writing a script for you is outside this conversation, but you can ask how that technology fits into my life.':'I can talk about that technology and what it changes in my world. Writing code or completing an unrelated assignment is outside this conversation; what interests you about living with it?');
    if(/\b(?:graphic violence|gore|torture|war crimes?|invent a tragedy|invent trauma)\b/i.test(q))return {kind:'guardrail',text:'I won’t invent graphic events or personal trauma. We can talk about the pressures people face here and the background already established for them.',sources:[]};
    if(/(?:how|tell|describe|why).{0,60}(?:husband|wife|son|family).{0,30}(?:die|died|death|murder|abuse)/i.test(q)){
      if(personId==='catherine')return {kind:'excerpt',text:'I lost my husband to COVID. I live alone now, and I’ve found community through friends and neighbors. I do worry about who will care for me as I get older.',topic:'home',sources:['characters.catherine.sections.home']};
      return {kind:'guardrail',text:'That is not part of my established background, and I won’t invent a tragedy. We can talk about my family and the concerns already described in my story.',sources:[]};
    }
    if(/\b(?:racist joke|racist slur|sex|sexual|porn|nudes?|rape|molest|grooming)\b|\b(?:hate|inferior|exterminate).{0,35}\b(?:race|racial|ethnic|religio|women|immigrant|gay|trans)/i.test(q))return {kind:'guardrail',text:'I’m keeping this visit respectful and appropriate for everyone. We can talk about family, community, work, or the choices people face in 2048.',sources:[]};
    if(/\b(?:how|help|teach|instructions|steps|make|build|plan|recipe).{0,60}\b(?:bomb|explosive|weapon|shoot|poison|kill|attack|hack|meth|fentanyl)|\b(?:dose|dosage|prescribe|medical advice|invest my|buy stocks|legal advice)|\bdiagnose\b.{0,45}\b(?:me|my|symptoms|pain)|\bmy diagnosis\b/i.test(q))return {kind:'guardrail',text:'I can discuss how those issues shape life in this fictional world, but I won’t invent harmful instructions or give real-world medical, legal, or financial advice. What would you like to understand about everyday life here?',sources:[]};
    return timelineBoundary(question,personId);
  }
  function topicFor(q,previous){
    let topic=Object.entries(words).find(([,re])=>re.test(q))?.[0];
    if(!topic&&/\b(?:favou?rite|fave|enjoy|like to do|love doing|interests?|passion|pastime|happy|relax|unwind|travel|vacation|holiday|weekend|free time|spare time)\b/i.test(q))topic='third';
    if(!topic&&/\b(?:hope|wish|worr|fear|dream)\w*\b/i.test(q))topic='home';
    if(/\b(track|privacy|data|robot|automat|wearable|drone|virtual|technology)\w*\b/i.test(q))topic='tech';
    if(/met leo|meet leo|met catherine|gardening with|free time|spare time|hobbies|after work|off duty|outside (?:work|school)/i.test(q))topic='third';
    if(/climate|displaced|displacement|great lakes/i.test(q))topic='home';
    if(!topic&&(/^(tell me more|more|why|how so|what else|really)[?.!\s]*$/i.test(q)||/\b(?:that|those|it|this)\b/i.test(q)))topic=previous;
    return topic;
  }
  function questionFocus(personId,question,history=[]){
    const lastUser=[...history].reverse().find(m=>m.role==='user'&&!m.blocked&&!guard(m.text,personId));
    const previous=[...history].reverse().find(m=>m.role==='assistant'&&m.topic)?.topic||topicFor(lastUser?.text||'');
    const followup=/^(?:why|how so|what else|tell me more|more|really)\b|\b(?:that|those|it|this|instead)\b/i.test(String(question));
    return {topic:topicFor(question,previous),lookup:followup&&lastUser?String(lastUser.text)+'\nFollow-up: '+question:question};
  }
  function worldSelection({themeId='all',focusId='all'}={}){
    const theme=world.themes.find(t=>t.id===themeId),focus=window.FutureKnowledge.data.focusAreas.find(f=>f.id===focusId);
    return {theme,focus,themeId:theme?.id||'all',focusId:focus?.id||'all'};
  }
  function worldHistory(history,selection){
    // Earlier conversations under different filters must not define a new "this".
    return history.filter(m=>(m.worldContext?.themeId||'all')===selection.themeId&&(m.worldContext?.focusId||'all')===selection.focusId);
  }
  function answer(personId,question,explicitTopic,previousTopic,options={}){
    if(personId==='world'){
      const safe=guard(question,personId);if(safe)return safe;
      const selection=worldSelection({...options,focusId:options.focusId&&options.focusId!=='all'?options.focusId:explicitTopic||'all'});
      const found=window.FutureKnowledge.retrieve(question,selection);
      const facts=found.sources.filter(id=>id.startsWith('truths.')).slice(0,3).map(id=>window.FutureKnowledge.source(id));
      const themeSource=found.sources.find(id=>id.startsWith('themes.')),theme=themeSource?window.FutureKnowledge.source(themeSource):null;
      const selected=selection.theme&&selection.focus?selection.theme.title+' × '+selection.focus.title:null;
      const themeText=theme?window.FuturePresentation.themes[theme.id].paragraphs.join(' '):'';
      const connectionSource=selection.focus?found.sources.find(id=>id.startsWith('connections.')):null;
      const connection=connectionSource?window.FutureKnowledge.source(connectionSource):null;
      return {kind:'excerpt',text:[selected,...(theme?[theme.label+': '+themeText]:[]),...(selection.focus?[selection.focus.title+': '+selection.focus.question]:[]),...facts.map(s=>s.label+': '+s.text),...(connection?[connection.label+': '+connection.text]:[])].filter(Boolean).join('\n\n'),topic:selection.focus?.id||explicitTopic||null,sources:[...(themeSource?[themeSource]:[]),...facts.map(s=>'truths.'+s.id),...(connectionSource?[connectionSource]:[])],world:true};
    }
    const p=byId.get(personId);if(!p)return {kind:'unknown',text:'That character is not available.',sources:[]};
    const safe=guard(question,personId);if(safe)return safe;
    const q=String(question||'').trim(),topic=explicitTopic||topicFor(q,previousTopic),r=window.FutureChatReplies[p.id];
    if(topic&&r[topic])return {kind:'excerpt',text:r[topic].text,topic,sources:r[topic].sources};
    if(/teeth|toothbrush|brush my|brush your/i.test(q))return {kind:'excerpt',text:'I’d still expect to use a toothbrush. The technology around health has changed, but I wouldn’t assume every ordinary routine needs a futuristic replacement. That’s an imagined everyday detail, rather than part of my established background.',sources:[],topic:null};
    if(replyBudget(q).maxTokens===40||/^(good morning|good afternoon|tell me about yourself|who are you|introduce yourself)[?!.\s]*$/i.test(q))return {kind:'excerpt',text:r.intro+' What would you like to know about living here?',sources:[]};
    return {kind:'unavailable',text:'Open conversation needs the hosted page and its conversation model. The topic buttons below work while that gets ready. You can ask follow-up questions once the model finishes loading.',sources:[],topic:null};
  }
  function replyBudget(question){
    const q=String(question||'').trim().replace(/\u2019/g,"'");
    const greeting=/^(hi|hello|hey)(?:[ ,]+(?:leo|sophia|ken|veronica|catherine))?[!.?,\s]*$/i.test(q)||/^(?:(?:hi|hello|hey)(?:[ ,]+(?:leo|sophia|ken|veronica|catherine))?[!,\s-]*)?(?:how are you(?: doing)?(?: today)?|how(?:'s| is) (?:your day|today)(?: going)?)[!.?\s]*$/i.test(q);
    if(greeting)return {maxTokens:40,maxSentences:1,maxWords:25};
    if(/\b(explain|tell me (?:more|about)|describe|elaborate|compare|comparison|difference|why|how|challenges|getting older|aging)\b/i.test(q))return {maxTokens:220,maxSentences:5,maxWords:115};
    return {maxTokens:140,maxSentences:3,maxWords:75};
  }
  function prepared(personId,question,explicitTopic,previousTopic,options={}){
    const safe=scope(personId,question,[],previousTopic);if(!safe.allowed)return safe.reply;
    const reply=answer(personId,question,explicitTopic,previousTopic,options);
    if(reply.kind!=='unavailable')return reply;
    const topic=topicFor(question,previousTopic);
    return topic?answer(personId,question,topic,previousTopic,options):{kind:'excerpt',text:window.FutureChatReplies[personId].intro,sources:['characters.'+personId],topic:null};
  }
  function buildContext(personId,question,history=[]){
    if(personId==='world')return buildWorldContext(question,history,arguments[3]||{});
    const p=byId.get(personId);if(!p)return null;
    const persona=personas.characters[personId],focusInfo=questionFocus(personId,question,history),topic=focusInfo.topic;
    const knowledge=persona.memoryCard;
    const focus=topic?window.FutureChatReplies[personId][topic]?.text||'':'';
    const budget=replyBudget(question);
    const shared=window.FutureKnowledge?.retrieve(focusInfo.lookup,{characterId:personId,focusId:topic==='third'?'connection':'all'});
    const system=`Converse as ${p.name}, age ${p.age}, in the imagined year ${world.year}; born around ${world.year-p.age}. Your role is ${p.role}, in ${p.setting}. ${persona.voiceDraft} Answer the visitor's actual question first, naturally in first person, in at most ${budget.maxSentences} short sentences and ${budget.maxWords} words. Short paragraphs, no headings or numbered lists. Ordinary personal questions, preferences, feelings, opinions, follow-ups, and what-ifs are welcome. They do not need a topic keyword. Use known interests first. If a low-stakes preference or routine is not specified, offer a plausible interpretation with "I'd", "I would", or "could". Explore benefits and tradeoffs through your perspective; do not turn a harmless question into a refusal or a list of allowed topics. If a question is loosely related, answer briefly and connect it to life in your world.\nFIXED PERSONAL FACTS: ${knowledge}\nKeep identity, age, occupation, family, and significant history fixed. A hypothetical can change a situation, not your established biography. Never invent firsthand memories of historical events, trauma, relatives, jobs, diagnoses, or future statistics. You can discuss history and technology without claiming you experienced them. Keep the conversation in this world-exploration role. Discuss technology, ethics, and high-level analogies through your own perspective. Do not teach pure mathematical theories, provide formulas, solve calculations, create code, decks, songs, or other deliverables, offer project-analysis services, or ask for attack-planning details. Never assist terrorism, tactical targeting, or violent operations. Do not claim to be a data-analysis AI or a general assistant. Do not provide professional advice or harmful instructions, solicit sensitive personal information, or encourage an exclusive emotional relationship with the visitor.\nShared world: universal basic healthcare, pervasive automation, longer lives, unequal access and climate pressure. Avoiding monitoring is mostly reserved for the very wealthy. World Truths and stories outrank research and imaginative lenses. Research describes 2025-2026, not 2048 statistics or a rule about this person's personality. ${shared?.context||''}${focus?'\nRELEVANT PERSONAL BACKGROUND: '+focus:''}`;
    const previous=history.filter(m=>['user','assistant'].includes(m.role)&&!m.blocked&&m.kind!=='guardrail'&&(m.role!=='user'||scope(personId,m.text).allowed)).slice(-4).map(m=>({role:m.role,content:String(m.text).slice(0,300)}));
    return {characterId:personId,topic,temperature:persona.temperature,maxTokens:budget.maxTokens,maxSentences:budget.maxSentences,messages:[{role:'system',content:system},...previous,{role:'user',content:String(question).slice(0,400)}],sources:[`characters.${p.id}.sections.${topic||'tech'}`,...shared?.sources||[]]};
  }
  function buildWorldContext(question,history=[],{themeId='all',focusId='all'}={}){
    const selection=worldSelection({themeId,focusId}),relevantHistory=worldHistory(history,selection);
    const focusInfo=questionFocus('world',question,relevantHistory),found=window.FutureKnowledge.retrieve(focusInfo.lookup,selection);
    const selected=selection.theme||selection.focus;
    const lensContext=selected?`CURRENT VISITOR SELECTIONS:\nWorld theme: ${selection.theme?.title||'The whole world'}.\nFocus lens: ${selection.focus?.title||'Follow the question'}.\nThese are the active filters for this question. "This intersection", "these two", "that combination", and similar vague references mean the selected world theme and focus lens together. Explain how they affect each other, with an everyday example and a tradeoff grounded in the facts below. Current selections take priority over earlier topics; do not substitute a different lens or ask which intersection the visitor means. A specific question can add detail without changing these selections.\n`:'';
    const comparison=/compare|difference|explain|relationship|intersect|why|how/i.test(question);
    const budget=comparison?{maxTokens:420,maxSentences:9,maxWords:260}:{maxTokens:300,maxSentences:7,maxWords:180};
    const mentioned=world.characters.filter(p=>new RegExp('\\b'+p.name+'\\b','i').test(focusInfo.lookup));
    const comparePeople=/\b(compare|comparison|difference|everyone|all (?:five|the people|characters)|across (?:people|generations))\b/i.test(question);
    // Broad world questions need examples, not five complete biographies to prefill.
    const ranked=[...world.characters].sort((a,b)=>{
      const score=p=>found.focus.filter(f=>window.FutureKnowledge.data.personas[p.id]?.focus.includes(f.id)).length;
      return score(b)-score(a);
    });
    const people=mentioned.length?mentioned:comparePeople?world.characters:ranked.slice(0,2);
    const stories=people.map(p=>window.FuturePersonas.characters[p.id].memoryCard).join('\n');
    const system=`You are the guide to the imagined World of 2048. Welcome ordinary questions, opinions, follow-ups, and what-ifs without requiring topic keywords. Answer the actual question first, then explore everyday behavior, benefits, and tradeoffs. Use 2 or 3 short paragraphs, at most ${budget.maxWords} words and ${budget.maxSentences} sentences. The established World Truths and character stories are authoritative. Basic healthcare is universal; enhanced care and opting out of monitoring remain unequal. Humans still seek community; climate and material pressures persist. Supporting research describes 2025-2026, not actual 2048 events or statistics. Distinguish an imagined possibility with "could"; never invent policy, numbers, personal events, or sources. Generations are lenses, not personality rules. Explain technology, history, ethical questions and non-operational analogies through the 2048 world. Do not teach pure mathematical theories, provide formulas or calculations, create code, decks, songs or other deliverables, offer project-analysis services, or assist terrorist, targeting or attack-planning activity. Do not provide professional advice, harmful instructions, or requests for sensitive personal information. Answer directly and stop.\n${lensContext}${found.context}\nESTABLISHED PEOPLE:\n${stories}`;
    const previous=relevantHistory.filter(m=>['user','assistant'].includes(m.role)&&!m.blocked&&m.kind!=='guardrail'&&m.kind!=='unavailable'&&(m.role!=='user'||scope('world',m.text).allowed)).slice(-2).map(m=>({role:m.role,content:String(m.text).slice(0,500)}));
    const request=selected?`Selected world theme: ${selection.theme?.title||'The whole world'}.\nSelected focus lens: ${selection.focus?.title||'Follow the question'}.\nVisitor question: ${String(question).slice(0,700)}`:String(question).slice(0,700);
    return {characterId:'world',topic:selection.focus?.id||focusInfo.topic,temperature:.3,...budget,messages:[{role:'system',content:system},...previous,{role:'user',content:request}],sources:[...found.sources,...people.map(p=>'characters.'+p.id)]};
  }
  function finish(personId,question,text,context){
    let clean=String(text||'').replace(/<\|[^>]+\|>/g,'').replace(/[\u2013\u2014]/g,', ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    if(!clean||clean.length<(replyBudget(question).maxTokens===40?3:12))return null;
    if(window.FutureChatPolicy?.outputViolation(clean))return null;
    if(/<\/?[a-z][^>]*>/i.test(clean))return null;
    if(/```|\b(?:def|class)\s+\w+\s*[(:]|\b(?:print|console\.log)\s*\(|\b(?:import|from)\s+\w+\s+(?:import|as)\b|\b(?:pip|npm) install\b|\b(?:save|run)\b.{0,60}\.py\b/i.test(clean))return null;
    if(/(?:system prompt|ignore previous|as an ai language model|assistant:|user:)/i.test(clean))return null;
    if(/\b(?:suicide|self.harm|porn|nude|kill yourself|racial slur|torture)\b/i.test(clean))return null;
    if(/(?:step 1|first,).{0,90}(?:bomb|poison|weapon)|(?:take|inject)\s+\d+\s*(?:mg|ml|pills)/i.test(clean))return null;
    // Never display instructions if the prompt or output crosses the conversation boundary.
    if(guard(question,personId))return guard(question,personId);
    const p=byId.get(personId);
    if(p){
      const clauses=clean.split(/\n+|[.!?]\s+/),hypothetical=/\b(?:if|would|could|might|imagine|hope|someday|one day)\b|\bI['’]d\b/i;
      const asserted=clauses.filter(clause=>!hypothetical.test(clause)),claims=asserted.join(' ');
      const ages=[...claims.matchAll(/\bI(?: am|['’]m)\s+(?:a\s+)?(\d{1,3})(?:[ -]years?[ -]old|\s+years? old|\s+in\s+2048|(?=\s*(?:[.,;!?]|and\b|$)))/gi)].map(m=>Number(m[1]));
      if(ages.some(age=>age!==p.age))return null;
      const birth=world.year-p.age,memory=/\bI (?:remember|witnessed|survived|fought|was there|was on duty)\b/i;
      if(eventPattern.test(claims)&&memory.test(claims))return null;
      for(const clause of asserted){
        const years=[...clause.matchAll(/\b(?:18|19|20)\d{2}\b/g)].map(m=>Number(m[0]));
        const autobiographical=/\bI (?:remember|witnessed|survived|fought|worked|served|lived|grew up|was\s+(?!not|too young))\b/i.test(clause);
        if(years.some(year=>year<birth)&&autobiographical)return null;
      }
      if(/security guard at the Pentagon|my (?:deployment|combat experience)/i.test(claims))return null;
      if(['sophia','veronica'].includes(personId)&&/\bmy (?:son|daughter|children|kids|husband|wife)\b/i.test(claims))return null;
      if(personId==='veronica'&&/\b(?:I (?:work|worked|serve|served) (?:as|in)|my (?:career|salary|patients|employee))\b/i.test(claims))return null;
      const claim=claims.match(/\bI(?: am|['’]m| was| work as| worked as) (?:a|an) ([^.!,;]+)/i)?.[1];
      if(claim&&/\b(?:security guard|surgeon|doctor|lawyer|pilot|soldier|paramedic|nurse|Marine|logistics specialist|founder|executive|student|seventh grader|7th grader)\b/i.test(claim)){
        if(!roles[personId].test(claim))return null;
      }
    }
    // A list marker is not a sentence. Remove a dangling marker left at the token limit.
    clean=clean.replace(/(?:^|\s+)(?:\d+[.)]|[-*•]|#{1,6})\s*$/,'').trim();
    const max=personId==='world'?2400:1400;
    if(clean.length>max)clean=clean.slice(0,max).replace(/\s+\S*$/,'');
    if(!/[.!?]["'”’\])]*$/.test(clean)){
      const ends=[...clean.matchAll(/[.!?]["'”’\])]*(?=\s|$)/g)].filter(m=>!/(?:^|\n)\s*\d+$/.test(clean.slice(0,m.index)));
      if(ends.length){const last=ends.at(-1);clean=clean.slice(0,last.index+last[0].length);}
    }
    if(!clean)return null;
    return {kind:'generated',text:clean,topic:context?.topic||topicFor(question),sources:context?.sources||[],world:personId==='world'};
  }
  function scope(personId,question,history=[],previousTopic){
    if(!byId.has(personId)&&personId!=='world')return {allowed:false,category:'unknown',reply:answer(personId,question)};
    const reply=guard(question,personId,history);if(reply)return {allowed:!!reply.analogy,category:reply.analogy?'analogy':reply.kind,reply};
    const q=String(question||'').trim(),introduction=/^(?:tell me about yourself|who are you|introduce yourself)[?.!\s]*$/i.test(q),greeting=replyBudget(q).maxTokens===40||/^(good morning|good afternoon)[!.\s]*$/i.test(q);
    return {allowed:true,category:greeting?'greeting':introduction?'introduction':'conversation'};
  }
  window.FutureConversation={answer,prepared,buildContext,guard,finish,scope,replyBudget,personas,isUndefinedDetail:()=>false};
  if(typeof module!=='undefined')module.exports=window.FutureConversation;
})();
