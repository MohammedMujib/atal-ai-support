import {coreGuides} from './core-guides.mjs';
import {emptyCase,restoreCase,updateCase,topicOf,foldCase,summarizeCase} from './case-state.mjs';
import {routeRequest,isOutsideTopic,isExplanationFollowup,isInstructionFollowup,scopeRefusal,isTechnicalFault} from './scope.mjs';
import {generateReply,scopeGuard,redactSecrets} from './chat.mjs';
import {shortAnswer} from './dialect.mjs';

export function installCoreGuides(db){
 if(!db.prepare('PRAGMA table_info(articles)').all().some(c=>c.name==='support_json'))db.exec("ALTER TABLE articles ADD COLUMN support_json TEXT NOT NULL DEFAULT ''");
 for(const guide of Object.values(coreGuides)){
  let row=db.prepare('SELECT id FROM articles WHERE title=? AND example=1').get(guide.title);
  if(!row){const inserted=db.prepare('INSERT INTO articles(title,title_en,category,body,example,keywords,keywords_en) VALUES(?,?,?,?,1,?,?)').run(guide.title,guide.symptoms.en,guide.category,'',guide.symptoms.ar,guide.symptoms.en);row={id:Number(inserted.lastInsertRowid)};}
  if(!row)continue;
  const body=language=>[...new Set([guide.symptoms[language],guide.applies[language],...guide.nodes.flatMap(n=>[n.text[language],n.why[language],n.help[language]]),guide.stop[language]])].join('\n\n');
  db.prepare('UPDATE articles SET body=?,body_en=?,source_name=?,source_url=?,reviewed_at=?,review_status=?,product=?,os_name=?,support_json=? WHERE id=?').run(body('ar'),body('en'),guide.source_name,guide.source_url,guide.reviewed_at,'reviewed',guide.product,guide.os,JSON.stringify(guide),row.id);
 }
 // An empty URL is not verification of a generic seed article.
 db.prepare("UPDATE articles SET review_status='needs_review' WHERE example=1 AND source_url='' AND support_json=''").run();
}
function relativeKind(text){
 const t=foldCase(text);
 if(isExplanationFollowup(t)||/وش فايده|ايش فايده|وش الهدف|ما الهدف|ما السبب|why this|what is the point/u.test(t))return 'why';
 if(isInstructionFollowup(t)||/كيف احل مشكلتي|كيف احل المشكله|ما الخطوه التاليه|وش بعد|what next|how can i fix/u.test(t))return 'how';
 return null;
}
export function classifyTurn(message,history,state,language){
 const t=foldCase(message),en=language==='en';
 if(/^(?:ما ?(?:هو )?اسمك|ماهو اسمك|وش اسمك|ايش اسمك|شنو اسمك|اسمك|من انت|مين انت|انت مين|عرف بنفسك|وش وظيفتك|ما وظيفتك|ما الغرض منك|وش الغرض منك|كيف تساعدني|وش تقدر تسوي|what is your name|who are you)$/u.test(t))return {kind:'social',reply:en?'I’m Atal, an AI assistant for troubleshooting technical problems at work. Describe the fault and I’ll help you work through it.':'أنا عُطْل.، مساعد ذكاء اصطناعي لمساعدتك في تشخيص الأعطال التقنية المتعلقة بالعمل وحلها خطوة بخطوة.'};
 const courtesy=routeRequest(message,history);if(courtesy?.intent==='social')return {kind:'social',reply:courtesy.reply};
 const safety=scopeGuard(message,history);if(safety)return {kind:'outside',reply:en?'I can help with work IT faults, but cannot provide secrets, private data, or support outside that scope.':safety};
 if(isOutsideTopic(t))return {kind:'outside'};
 const short=shortAnswer(t);
 if(short){
  if(state.awaiting){
   const activeGuide=coreGuides[state.facts.http_status==='404'?'web404':state.topic];
   const resolves=state.awaiting.success_resolves||activeGuide?.nodes.find(n=>n.id===state.awaiting.id)?.success_resolves;
   if(short==='yes'&&resolves)return {kind:'resolved'};
   if(['reachability','os','os_version','access_kind','mail_status','sync_status','excel_mode','product','provider','error'].includes(state.awaiting.slot))return {kind:'answer_clarification'};
   return {kind:'support'};
  }
  if(state.topic||state.problem)return {kind:'support'};
  if(short==='no')return {kind:'social',reply:en?'All right. I’m here if a work IT problem comes up.':'حسنًا، أنا هنا إذا واجهتك مشكلة تقنية في العمل.'};
  return {kind:'clarify'};
 }
 if(/^(?:ابي|ابغي|ابغي|احتاج|اريد|ابغى|اطلب|طلب|i need|i want|request).*(?:فني(?:ه|ا)?|دعم(?: فني)?|technician|support)$/u.test(t))return {kind:'handover'};
 if((state.topic||state.problem)&&!/ما انحلت|لم تنحل|ما تم حل|لم يتم حل|not fixed|not solved/u.test(t)&&/(?:^| )و?(?:انحلت(?: المشكله)?|تم حل المشكله|تم الحل|ضبطت خلاص|it is fixed|it s fixed|problem solved)(?: |$)/u.test(t))return {kind:'resolved'};
 if((state.topic||state.problem)&&/^(?:(?:ايه|ايوه|اي|نعم|الحمد لله|الحمدلله) )?(?:ضبطت|اشتغل|اشتغلت|رجع يشتغل|رجعت تشتغل|نفع الحل)(?: خلاص| الان| الحين| شكرا| يعطيك العافيه)*$/u.test(t))return {kind:'resolved'};
 const relative=relativeKind(t);if(relative)return {kind:state.topic||state.problem?relative:'clarify'};
 if(isTechnicalFault(t))return {kind:'support'};
 const general=/^(?:هل )?(?:تعرف|من هو|من هي|من هم|منهم |كم لاعب|كم عدد|ما عاصمه|اين تقع|متي ولد|متي تاسس|who is|capital of)|مؤسس الشركه|رواتب|ارباح|salary|stock|population/u.test(t)&&!/تعرف.*(?:تحل|تصلح|المشكل|العطل)/u.test(t);
 if(general)return {kind:'outside'};
 const topic=topicOf(message);
 if(topic)return {kind:'support'};
 if(isTechnicalFault(t))return {kind:'support'};
 if(state.topic||state.problem){
  // Treat short data following a diagnostic question as an answer, not a new general request.
  if(t.length<=400&&!/^(?:اكتب|الف|احكي|حدثني عن|ما هي|ما هو|كم |متي |اين |tell me about|write |what is|what are)/u.test(t))return {kind:'support'};
  return {kind:'clarify'};
 }
 if(/مشكل|عطل|خلل|يتعطل|يتوقف|لا يعمل|لا تعمل|ما يشتغل|ما يفتح|ما تفتح|error|problem|fault|crash|not work|will not|cannot|can t/u.test(t)&&/برنامج|نظام|جهاز|تطبيق|سيرفر|شاش|كاميرا|مايك|ملف|تيمز|اكسل|server|database|software|app|screen|camera|microphone|teams|excel|onedrive|vpn/u.test(t))return {kind:'support'};
 if(/^(?:عندي مشكله|احتاج مساعده|عندي عطل|ساعدني|i need help|i have a problem)$/u.test(t))return {kind:'clarify'};
 return {kind:'outside'};
}
function lookupGuide(catalog,topic){
 const specification=coreGuides[topic];if(!specification)return null;
 const article=catalog.find(a=>a.title===specification.title&&a.example&&a.review_status!=='needs_review');
 if(!article)return null;
 let guide;try{guide=JSON.parse(article.support_json||'null');}catch{}
 return guide?{article,guide}:null;
}
function chooseNode(state,guide){
 const f=state.facts,done=id=>!!state.attempts[id];
 if(guide.id==='web-404-v1'){if(!done('web404.link'))return 'web404.link';return 'handover';}
 if(state.topic==='teams_camera'){if(!done('teams.camera.close'))return 'teams.camera.close';return f.error?'handover':'teams.camera.error';}
 if(state.topic==='onedrive_sync'){if(!f.sync_status)return 'onedrive.status';if(f.sync_status==='paused'&&!done('onedrive.resume'))return 'onedrive.resume';return f.error?'handover':'onedrive.error';}
 if(state.topic==='excel_lock'){if(!f.excel_mode||f.excel_mode==='locked'&&!f.lock_holder)return 'excel.mode';if(f.excel_mode==='locked'){const id=f.lock_holder==='other'?'excel.other':'excel.self';if(!done(id))return id;return f.error?'handover':'excel.error';}return 'handover';}
 if(state.topic==='network'){
  if(f.connection===false&&!done('network.radio'))return 'network.radio';
  if(!f.reachability&&!done('network.sites'))return 'network.sites';
  if(f.reachability==='one')return f.error?'handover':'network.error';
  if(f.connection===undefined)return 'network.connection';
  if(f.connection===false&&!done('network.radio'))return 'network.radio';
  if(!f.os)return 'network.os';
  if(f.os==='windows')return 'network.version';
  if(f.os==='windows11'&&!done('network.windows'))return 'network.windows';
  if(!f.colleagues)return 'network.colleagues';
  return 'handover';
 }
 if(state.topic==='email'){
  if(f.mail_direction!=='receive'&&!done('email.small'))return 'email.small';
  if(f.internet===undefined)return 'email.internet';
  if(f.internet===false)return 'handover';
  if(!f.product)return 'email.product';
  if(f.product==='outlook'||f.product==='outlook_classic'){
   if(!f.mail_status)return 'email.status';
   if(f.mail_status==='offline'&&!done('email.offline'))return 'email.offline';
  }
  if(!f.error)return 'email.error';
  return 'handover';
 }
 if(state.topic==='access'){
  if(!f.access_kind)return 'access.kind';
  if(f.access_kind==='forgot'){
   if(!f.provider)return 'access.provider';
   if(f.provider==='m365'&&!done('access.microsoft'))return 'access.microsoft';
   return 'handover';
  }
  if(!f.error)return 'access.error';
  return 'handover';
 }
 if(state.topic==='printer'){
  if(f.printer_status==='jam')return 'handover';
  if(!done('printer.select'))return 'printer.select';
  if(!f.os)return 'printer.os';
  if(f.os==='windows')return 'printer.version';
  if(f.os==='windows11'&&!done('printer.windows'))return 'printer.windows';
  return 'handover';
 }
 return null;
}
export function planGroundedTurn(state,kind,catalog,language='ar'){
 const found=lookupGuide(catalog,state.facts.http_status==='404'?'web404':state.topic);if(!found)return null;
 const {article,guide}=found,en=language==='en';
 if((kind==='why'||kind==='how')&&state.awaiting){
  const previous=guide.nodes.find(n=>n.id===state.awaiting.id);
  if(previous)return {reply:(kind==='why'?previous.why:previous.help)[language],intent:kind==='why'?'clarify':previous.kind==='question'?'clarify':'guide',category:guide.category,sources:[article.id],origin:'knowledge_workflow',scope:'work_it',plan_node:state.awaiting};
 }
 const id=chooseNode(state,guide);
 if(id==='handover')return {reply:en?'We have reached the limit of the safe checks available for this case. You can request technical support below; review the summary of your symptoms and confirmed attempts before sending.':'وصلنا إلى حدود الفحوص الآمنة المتاحة لهذه الحالة. يمكنك طلب مساعدة فنية من الزر أدناه، ومراجعة ملخص المشكلة والمحاولات التي أكدت تنفيذها قبل الإرسال.',intent:'handover',category:guide.category,sources:[article.id],origin:'knowledge_workflow',scope:'work_it'};
 const node=guide.nodes.find(n=>n.id===id);if(!node)return null;
 const previous=state.awaiting;
 // A different parameter answer must not count as having performed the pending action.
 if(previous?.id===node.id&&state.proposed.some(p=>p.id===node.id)){
  return {reply:en?'To continue, tell me the result of the last check. If you could not perform it, say which part was unclear and I will explain it.':'حتى نكمل، أخبرني بنتيجة الفحص السابق. وإذا لم تستطع تنفيذه، قل لي أي جزء لم يتضح وسأشرحه لك.',intent:'clarify',category:guide.category,sources:[article.id],origin:'knowledge_workflow',scope:'work_it',plan_node:previous};
 }
 state.awaiting={id:node.id,slot:node.slot,kind:node.kind,article_id:article.id,success_resolves:!!node.success_resolves};
 state.proposed.push({id:node.id,text:node.text[language],turn:state.turn,article_id:article.id});
 state.sources=[...new Set([...state.sources,article.id])];
 return {reply:node.text[language],intent:node.kind==='question'?'clarify':'guide',category:guide.category,sources:[article.id],origin:'knowledge_workflow',scope:'work_it',plan_node:state.awaiting};
}
export async function answerEmployee({message,history=[],catalog=[],rawState,language='ar',signal,retrieve}){
 message=redactSecrets(message);
 const previous=restoreCase(history,rawState);
 const route=classifyTurn(message,history,previous,language);
 const state=['social','outside','answer_clarification'].includes(route.kind)?previous:updateCase(previous,message);
 if(route.kind==='support'&&!state.problem)state.problem=message.slice(0,300);
 let reply;
 const safetyArticle=catalog.find(a=>a.title==='حرارة شديدة أو رائحة أو انتفاخ بطارية'&&a.review_status==='reviewed');
 const batteryDanger=/بطاري|battery/u.test(foldCase(message))&&/منتفخ|انتفاخ|swollen|swelling/u.test(foldCase(message));
 if(route.kind==='support'&&batteryDanger&&safetyArticle)reply={reply:language==='en'?safetyArticle.body_en:safetyArticle.body,intent:'handover',category:'hardware',sources:[safetyArticle.id],origin:'knowledge_safety',scope:'work_it'};
 else if(route.kind==='social')reply={reply:route.reply,intent:'social',category:'other',sources:[],origin:'scope_policy',scope:'social'};
 else if(route.kind==='handover')reply={reply:language==='en'?'Use “Request technical help” below. Review the problem and your reported attempts before submitting; no ticket has been sent yet.':'يمكنك استخدام زر «طلب مساعدة فنية» أدناه. راجع وصف المشكلة والمحاولات التي ذكرتها قبل الإرسال؛ لم تُرسل تذكرة بعد.',intent:'handover',category:coreGuides[state.topic]?.category||'other',sources:[],origin:'support_handover',scope:'work_it'};
 else if(route.kind==='resolved')reply={reply:language==='en'?'Glad the problem is resolved. You can end this conversation, or start a new one for another work IT problem.':'الحمد لله أن المشكلة انحلّت. يمكنك إنهاء المحادثة، أو بدء محادثة جديدة إذا واجهتك مشكلة تقنية أخرى.',intent:'resolved',category:coreGuides[state.topic]?.category||'other',sources:[],origin:'scope_policy',scope:'work_it'};
 else if(route.kind==='outside')reply={reply:route.reply||(language==='en'?'I only help diagnose and resolve technical faults at work.':scopeRefusal),intent:'out_of_scope',category:'other',sources:[],origin:'scope_policy',scope:'outside'};
 else if(route.kind==='answer_clarification'){
  const g=coreGuides[state.facts.http_status==='404'?'web404':state.topic];const node=g?.nodes.find(n=>n.id===state.awaiting?.id);
  reply={reply:node?(language==='en'?'Please specify the result: ':'حدّد لي الإجابة حتى أختار الخطوة المناسبة: ')+node.text[language]:(language==='en'?'Please describe what you saw, rather than only yes or no.':'اذكر ما ظهر لك، بدل الاكتفاء بنعم أو لا.'),intent:'clarify',category:g?.category||'other',sources:[],origin:'context_clarification',scope:'work_it'};
 }
 else if(route.kind==='clarify')reply={reply:state.topic?(language==='en'?'Do you mean the last step was unclear, or did you try it and the problem remains?':'هل تقصد أن الخطوة السابقة غير واضحة، أم أنك جرّبتها وما زالت المشكلة؟'):(language==='en'?'Describe the work IT problem: what is not working, and what happens when you try?':'صف لي المشكلة التقنية: ما الذي لا يعمل، وماذا يظهر لك عند المحاولة؟'),intent:'clarify',category:coreGuides[state.topic]?.category||'other',sources:[],origin:'context_clarification',scope:'work_it'};
 else {
  reply=planGroundedTurn(state,route.kind,catalog,language);
  if(!reply){
   const refs=retrieve(catalog,message,history,state);
   reply=await generateReply(message,history,refs,{signal,skipRouting:true,language,caseState:state});
   state.awaiting={id:'model.'+state.turn,slot:'unknown',kind:reply.intent==='guide'?'action':'question'};
   state.proposed.push({id:state.awaiting.id,text:reply.reply,turn:state.turn});
  }
 }
 const analysis={...reply,explanation:reply.reply,questions:[],steps:[],requires_it:reply.intent==='handover',title:(state.problem||message).slice(0,100),summary:summarizeCase(state,language),case_state:state};
 return {analysis,diagnosis:state};
}
