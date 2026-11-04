import {normalizeDialect,shortAnswer} from './dialect.mjs';
export const foldCase=normalizeDialect;
const failure=/مو شغال|مب شغال|للحين|ما زال|مازال|باقي|بعده|ما نفع|ما نفعت|ما ضبط|لم ينجح|لم تنجح|ما انحلت|لم تنحل|لا يعمل|لا تعمل|ما يعمل|ما تفتح|لم تعمل|مستمر|still|did not work|didn t work|not working/u;
export function topicOf(text){
 const t=foldCase(text);
 if(/teams|تيمز/u.test(t)&&/كاميرا|كميرا|camera|webcam/u.test(t))return 'teams_camera';
 if(/onedrive|ون ?درايف/u.test(t)&&/مزامن|sync|paused/u.test(t))return 'onedrive_sync';
 if(/excel|اكسل|اكسيل/u.test(t)&&/قراءه|read only|مقفل|قفل|locked|تحرير/u.test(t))return 'excel_lock';
 if(/حساب|account|نسيت.*(?:مرور|باسورد)|password|تسجيل الدخول|sign in/u.test(t))return 'access';
 if(/ايميل|اميل|بريد|اوتلوك|outlook|e ?mail|ارسال الرسال|يرسل الرسال/u.test(t))return 'email';
 if(/طابع|طباع|printer|print job/u.test(t))return 'printer';
 if(/شبك|انترنت|واي فاي|وايفاي|wifi|wi fi|network|internet|(?:^|\s)(?:نت|النت)(?:\s|$)/u.test(t))return 'network';
 return null;
}
export function emptyCase(){return {version:2,topic:null,problem:'',facts:{},evidence:{},hypotheses:[],attempts:{},proposed:[],answered:[],awaiting:null,turn:0,sources:[]};}
function setFact(state,key,value,message){if(value===undefined||value===null||value==='')return;state.facts[key]=value;state.evidence[key]={value,user_text:message.slice(0,500),turn:state.turn};if(!state.answered.includes(key))state.answered.push(key);}
const yes=t=>shortAnswer(t)==='yes';
const no=t=>shortAnswer(t)==='no';
export function updateCase(previous,message){
 const state=structuredClone(previous||emptyCase());state.turn++;
 const t=foldCase(message);let pending=state.awaiting;
 const found=topicOf(t);
 if(!state.topic&&found){state.topic=found;state.problem=message.slice(0,300);}
 // An explicitly described fault in a different service starts a new case. A short
 // answer naming the internet in an email diagnosis does not switch the case.
 const newFault=/مشكل|عطل|خلل|لا يعمل|لا تعمل|ما يشتغل|ما يفتح|ما تفتح|ما يدخل|نسيت|not work|cannot|can t|forgot|fails/u.test(t);
 if(found&&found!==state.topic&&(/اقصد|الصحيح|مشكله جديده|actually|new problem/u.test(t)||newFault&&found!=='network')){const old={topic:state.topic,problem:state.problem,facts:state.facts,attempts:state.attempts};Object.assign(state,{...emptyCase(),topic:found,problem:message.slice(0,300),turn:state.turn,previous_cases:[...(state.previous_cases||[]),old]});pending=null;}
 if(!state.problem&&/مشكل|عطل|خلل|error|problem/u.test(t))state.problem=message.slice(0,300);
 const win=t.match(/(?:ويندوز|ويندز|windows)\s*(10|11)?/u);
 if(win)setFact(state,'os',win[1]?'windows'+win[1]:'windows',message);
 if(pending?.slot==='os_version'&&/^(?:10|11)$/u.test(t))setFact(state,'os','windows'+t,message);
 else if(/macos|mac os|ماك|ماكنتوش/u.test(t))setFact(state,'os','macos',message);
 else if(/android|اندرويد/u.test(t))setFact(state,'os','android',message);
 else if(/ايفون|iphone|ios/u.test(t))setFact(state,'os','ios',message);
 if(/outlook|اوتلوك/u.test(t))setFact(state,'product','outlook',message);
 if(state.topic==='onedrive_sync'&&/متوقف.*مؤقت|paused/u.test(t))setFact(state,'sync_status','paused',message);
 if(state.topic==='teams_camera'&&/(?:في|ب|بتطبيق).*تطبيق الكاميرا.*(?:شغاله|تعمل|تشتغل)|بتطبيق الكاميرا شغاله|تعمل في تطبيق الكاميرا|works in (?:the )?camera/u.test(t))setFact(state,'camera_other_apps',true,message);
 if(state.topic==='excel_lock'){
  if(/باسم زميل|لدي زميل|شخص اخر|another (?:person|user)|colleague/u.test(t)){setFact(state,'excel_mode','locked',message);setFact(state,'lock_holder','other',message);}
  else if(/باسمي|باسمك|locked by me/u.test(t)){setFact(state,'excel_mode','locked',message);setFact(state,'lock_holder','self',message);}
  else if(/عرض فقط|view only/u.test(t))setFact(state,'excel_mode','view_only',message);
  else if(/عرض محمي|protected view/u.test(t))setFact(state,'excel_mode','protected',message);
 }
 if(state.topic==='email'&&/ما يستقبل|لا يستقبل|ما توصل.*(?:رسائل|رساله)|not receiv|cannot receiv|can t receiv/u.test(t))setFact(state,'mail_direction','receive',message);
 if(/الكلاسيكي|classic outlook/u.test(t))setFact(state,'product','outlook_classic',message);
 if(/outlook الجديد|new outlook/u.test(t))setFact(state,'product','outlook_new',message);
 if(/microsoft\s*365|office\s*365|مايكروسوفت\s*365|اوفيس\s*365/u.test(t))setFact(state,'provider','m365',message);
 else if(state.topic==='access'&&/نظام داخلي|مو مايكروسوفت|ليس مايكروسوفت|internal system/u.test(t))setFact(state,'provider','internal',message);
 if(/نسيت|forgot/u.test(t)&&/مرور|باسورد|password/u.test(t))setFact(state,'access_kind','forgot',message);
 else if(state.topic==='access'&&/مقفل|مقفول|locked/u.test(t))setFact(state,'access_kind','locked',message);
 if(/غير متصل|مو متصل|مش متصل|not connected|disconnected/u.test(t))setFact(state,'connection',false,message);
 else if(/متصل|connected/u.test(t))setFact(state,'connection',true,message);
 const internetPositive=/الانترنت (?:يعمل|شغال)|النت (?:يعمل|شغال)|internet (?:works|is working)|المواقع (?:تفتح|تشتغل)/u.test(t);
 if(internetPositive&&!/المواقع (?:ما|لا) /u.test(t))setFact(state,'internet',true,message);
 if(/موقع (?:الشركه )?(?:فقط|واحد)|خدمه واحده|one (?:site|website)|only.*site|الباقي (?:يعمل|يفتح)/u.test(t)){setFact(state,'reachability','one',message);setFact(state,'internet',true,message);}
 else if(/المواقع (?:ما|لا) تفتح|لا يفتح اي موقع|كل المواقع.*(?:ما|لا)|none.*open|no (?:sites|websites)/u.test(t)){setFact(state,'reachability','none',message);setFact(state,'internet',false,message);}
 else if(/كل المواقع (?:تعمل|تفتح)|جميع المواقع (?:تعمل|تفتح)|all sites work/u.test(t)){setFact(state,'reachability','all',message);setFact(state,'internet',true,message);}
 if(/كل الزملاء|الجميع|الكل|القسم كله|everyone|all colleagues/u.test(t))setFact(state,'colleagues','all',message);
 else if(/انا فقط|عندي بس|جهازي فقط|only me|only my device/u.test(t))setFact(state,'colleagues','self',message);
 const error=message.match(/(?:يقول(?: لي)?|يقولي|رسالة الخطأ(?: هي)?|رساله الخطا(?: هي)?|error\s*:)\s*([^\n،.]{4,180})/iu)?.[1];
 if(error)setFact(state,'error',error.trim(),message);
 if(/(?:^|\D)404(?:\D|$)/u.test(t)){setFact(state,'http_status','404',message);setFact(state,'error',message.trim(),message);}
 if(/working offline|العمل دون اتصال/u.test(t))setFact(state,'mail_status','offline',message);
 else if(state.topic==='email'&&/متصل|connected/u.test(t))setFact(state,'mail_status','connected',message);
 if(state.topic==='printer'&&/انحشار|ورق عالق|paper jam/u.test(t))setFact(state,'printer_status','jam',message);
 else if(state.topic==='printer'&&/offline|غير متصل/u.test(t))setFact(state,'printer_status','offline',message);
 if(/جربت|حاولت|tried/u.test(t)&&/قصير|بدون مرفق|دون مرفق|short.*mail/u.test(t)&&failure.test(t))state.attempts['email.small']={result:'failed',user_text:message,turn:state.turn};
 if(pending){
  const relative=/اتبعت|جربت|جربتها|سويت|نفذت|ما نفع|ما ضبط|لا يعمل|لا تعمل|ما يشتغل|ما اشتغل|مازالت|ما زالت|لم تنحل|still|tried|didn t|did not/u.test(t)||yes(t)||no(t);
  const explain=/ليش|ليه|لماذا|ما ?فهمت|اشرح|وضح|وش اسوي|كيف|why|explain|understand/u.test(t);
  if(!explain&&pending.kind==='question'&&pending.id.startsWith('model.')){state.answers||={};state.answers[pending.id]={question:state.proposed.find(p=>p.id===pending.id)?.text||'',answer:message.slice(0,500),turn:state.turn};}
  if(!explain&&relative){
   if(pending.slot==='reachability'&&!state.evidence.reachability?.user_text?.includes(message)){
    if(no(t)||failure.test(t)){setFact(state,'reachability','none',message);setFact(state,'internet',false,message);}
    // A bare yes does not identify which sites opened.
   }
   if(pending.slot==='connection'&&(yes(t)||no(t)))setFact(state,'connection',yes(t),message);
   if(pending.slot==='internet'&&(yes(t)||no(t)))setFact(state,'internet',yes(t),message);
   if(pending.slot==='colleagues'&&(yes(t)||no(t)))setFact(state,'colleagues',yes(t)?'all':'self',message);
   // A result about a different named check is not evidence of this action.
   const differentAction=pending.id==='email.small'&&/جربت|tried/u.test(t)&&/اتصال|شبكه|connection|network/u.test(t)&&!/رساله|رسائل|بريد|مرفق|mail|message|attachment/u.test(t);
   if(pending.kind==='action'&&!differentAction){
    const result=failure.test(t)||no(t)?'failed':/انحلت|تم حل|نجح|انرسلت|ارسلت|تم الارسال|اشتغل|worked|sent|success/u.test(t)||yes(t)?'success':'attempted';
    state.attempts[pending.id]={result,user_text:message.slice(0,500),turn:state.turn};
   }
  }
  if(!explain&&pending.slot==='printer_check'&&state.evidence.printer_status?.turn===state.turn)state.attempts[pending.id]={result:'observed',user_text:message,turn:state.turn};
  if(!explain&&pending.slot==='product'&&!state.facts.product&&t.length<80&&!/[?؟]/u.test(message))setFact(state,'product',message.trim(),message);
  if(!explain&&pending.slot==='provider'&&!state.facts.provider&&t.length<80&&!/[?؟]/u.test(message))setFact(state,'provider','other',message);
  if(!explain&&pending.slot==='error'&&!state.facts.error&&t.length>=4&&t.length<300&&!/[?؟]/u.test(message)&&!yes(t)&&!no(t))setFact(state,'error',message.trim(),message);
  if(!explain&&pending.slot==='reachability'&&/^(?:كلها|كل المواقع|جميع المواقع|none|all sites)$/u.test(t)){setFact(state,'reachability','none',message);setFact(state,'internet',false,message);}
  if(!explain&&pending.slot==='colleagues'&&/^(?:انا|بس انا|انا بس|me)$/u.test(t))setFact(state,'colleagues','self',message);
 }
 return state;
}
export function restoreCase(history=[],raw){
 try{const parsed=typeof raw==='string'?JSON.parse(raw):raw;if(parsed?.version===2)return structuredClone(parsed);}catch{}
 for(const m of [...history].reverse())if(m.role==='assistant'&&m.analysis?.case_state?.version===2)return structuredClone(m.analysis.case_state);
 let state=emptyCase();
 for(const m of history){
  if(m.role==='user')state=updateCase(state,m.content);
  else if(m.analysis?.plan_node)state.awaiting=m.analysis.plan_node;
 }
 return state;
}
export function summarizeCase(state,language='ar'){
 const en=language==='en';
 const labels={os:'نظام التشغيل',product:'التطبيق',provider:'مزود الحساب',connection:'اتصال الشبكة',internet:'عمل الإنترنت',reachability:'نطاق التعطل',colleagues:'المتأثرون',error:'رسالة الخطأ',mail_status:'حالة البريد',printer_status:'حالة الطابعة',access_kind:'مشكلة الحساب'};
 const values={true:'نعم',false:'لا',none:'لا تفتح المواقع',one:'خدمة واحدة',all:'الجميع',self:'الموظف فقط',forgot:'نسيان كلمة المرور',locked:'حساب مقفل',internal:'نظام داخلي',offline:'دون اتصال',connected:'متصل',jam:'ورق عالق'};
 const facts=Object.entries(state.facts).map(([key,value])=>`${en?key:labels[key]||key}: ${en?value:values[String(value)]||value}`).join('\n');
 const attempts=Object.values(state.attempts).map(v=>v.user_text).join('\n');
 const answers=Object.values(state.answers||{}).map(v=>v.question+' → '+v.answer).join('\n');
 return [(en?'Reported problem: ':'وصف المشكلة: ')+state.problem,(en?'Confirmed employee statements:\n':'معلومات أكدها الموظف:\n')+facts,(en?'Diagnostic answers:\n':'إجابات الموظف عن أسئلة التشخيص:\n')+answers,(en?'Employee-reported attempts/results:\n':'محاولات ونتائج أبلغ عنها الموظف:\n')+attempts,(en?'Proposed, not proof of execution:\n':'اقتراحات المساعد، وليست دليل تنفيذ:\n')+state.proposed.map(x=>x.text).join('\n')].join('\n\n').slice(0,7500);
}
