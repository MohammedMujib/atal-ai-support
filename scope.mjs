import {normalize} from './knowledge.mjs';

export const scopeRefusal='لا يمكنني الإجابة عن هذا السؤال؛ فأنا مساعد لإصلاح الأعطال التقنية المتعلقة بالعمل في الشركة فقط. صف العطل الذي تواجهه وسأساعدك خطوة بخطوة.';

const technical=/بريد|ايميل|اميل|outlook|email|mail\b|شبك|انترنت|واي فاي|وايفاي|wifi|wi fi|vpn|حساب|باسورد|مرور|مصادق|account|password|login|طابع|ماسح|scanner|شاش|كاميرا|مايك|سماع|بطاري|شاحن|كمبيوتر|حاسب|لابتوب|كيبورد|ماوس|جهاز|هاتف|جوال|printer|laptop|computer|device|camera|microphone|teams|zoom|onedrive|sharepoint|excel|word\b|powerpoint|pdf|اكسل|اوتلوك|تيمز|مزامن|ملف|برنامج|تطبيق|متصفح|نظام|بوابه|صلاحيات|تخزين|مساحه|قرص|فيروس|تصيد|تقني|فني|software|browser|sync|file|disk|permission|app\b|portal/u;
const fault=/سوداء|منتفخ|انتفاخ|يفصل|ما فيها صوت|مشكل|عطل|خلل|خطا|تعذر|نسيت|مقفل|مقفول|ممنوع|محظور|محجوب|رفض|بطي|بطء|يعلق|يهنق|متوقف|توقف|انقطع|مقطوع|مو راضي|مو شغال|لا يعمل|لا تعمل|ما يعمل|ما تعمل|ما ي|ما ت|مايف|ماير|مايط|مايت|مافي|مابي|مايد|لا ي|لا ت|لم يتم|معلق|فقد|حذف|ضاعت|ضاع|تالف|ممتل|لا استطيع|لا اقدر|ما اقدر|ماقدر|error|fail|broken|not work|can t|cannot|locked|forgot|offline|slow|crash|missing|denied|issue|problem/u;
const outside=/ميسي|رونالدو|بايرن|كره القدم|كاس العالم|اكاديميه طويق|مباراه|وصفه|كبسه|قصيده|ابراج|استثمار|اسهم مربحه|يوتيوب|youtube|نتفلكس|netflix|تيك توك|tiktok|messi|ronaldo|football|bayern|recipe|horoscope|investment|stock picks/u;
const small=(reply,intent='social',scope='social')=>({reply,category:'other',intent,sources:[],origin:'scope_policy',scope});
export const isTechnicalFault=text=>technical.test(normalize(text))&&fault.test(normalize(text));
export function activeTechnicalContext(history=[]){
 for(const message of [...history].reverse()){
  if(message.role!=='assistant')continue;
  const a=message.analysis;
  if(a?.intent==='resolved')return null;
  // A courtesy turn or an erroneous refusal must not erase the open fault.
  if(a?.intent!=='out_of_scope'&&(a?.scope==='work_it'||['network','email','access','software','hardware'].includes(a?.category)))return message;
 }
 return null;
}
export function isExplanationFollowup(message){
 if(/^(?:ليش|ليه|لماذا|why)$/u.test(normalize(message)))return true;
 return /^(?:ليش|ليه|لماذا|وش سبب|ما سبب|why)(?:\s|$)/u.test(normalize(message))&&/(?:اجرب|نجرب|اسوي|افعل|افحص|اتحقق|الخطوه|الفحص|هذا|ذلك|هذي|ذي|ذلك|اسالك|اسال|تسال|try|check|test|that|this)/u.test(normalize(message));
}
export function isInstructionFollowup(message){
 const t=normalize(message);
 return /^(?:وش|ايش) (?:اسوي|اعمل|المطلوب)(?: الحين| الان| بعدين)?$/u.test(t)
  ||/^(?:ما ?فهمت|مو فاهم|مش فاهم|لم افهم|ماني فاهم)(?: (?:الخطوه|الخطوات|كلامك|وش اسوي|عليك))*$/u.test(t)
  ||/^(?:اشرح|وضح|بسط)(?: (?:لي|هذي|هذه|الخطوه|الخطوات|اكثر|ببساطه))*$/u.test(t)
  ||/^(?:ممكن|تقدر) (?:تشرح|توضح)(?: (?:لي|الخطوه|الخطوات|اكثر|ببساطه))*$/u.test(t)
  ||/^كيف (?:اسوي|اجرب|افحص|افتح|استخدم|اطبق|اكتب|اوصل)(?: (?:هذا|ذلك|هذي|الخطوه|الخطوات|الموقع|البريد|المتصفح))*$/u.test(t)
  ||/^(?:what should i do|i don t understand|how do i do that|explain that|explain the step)$/u.test(t);
}
export function routeRequest(message,history=[]){
 const t=normalize(message).replace(/(^|\s)لا(?=يعمل|تعمل|يفتح|تفتح|يرسل|تطبع)/gu,'$1لا '),en=!/[\u0600-\u06ff]/u.test(message);
 const active=activeTechnicalContext(history);
 if(/^(?:صباح الخير|صباح النور|good morning)$/u.test(t))return small(en?'Good morning. How can I help with a work IT problem?':'صباح النور. كيف أساعدك في مشكلة تقنية بالعمل؟');
 if(/^(?:مساء الخير|مساء النور|good evening)$/u.test(t))return small(en?'Good evening. How can I help with a work IT problem?':'مساء النور. كيف أساعدك في مشكلة تقنية بالعمل؟');
 if(/^(?:يا هلا|ياهلا|هلا فيك|حياك الله|اهلا وسهلا|مرحبتين)$/u.test(t))return small('أهلًا وسهلًا. كيف أساعدك في مشكلة تقنية بالعمل؟');
 if(/^(?:الله يعافيك|ما قصرت|ماقصرت|بيض الله وجهك|كفو)$/u.test(t))return small('العفو، يسعدني مساعدتك.');
 const refuse=()=>small(en?'I cannot answer that question. I assist only with diagnosing and resolving technical faults affecting work at your company. Describe the fault and I will help you step by step.':scopeRefusal, 'out_of_scope','outside');
 const greeting=/السلام عليكم(?: ورحمه الله(?: وبركاته)?)?|سلام عليكم/u;
 const wellbeing=/كيف حالك|كيف الحال|كيفك|شلونك|وش اخبارك/u;
 const courtesyRemainder=t.replace(/السلام عليكم(?: ورحمه الله(?: وبركاته)?)?|سلام عليكم|كيف حالك|كيف الحال|كيفك|شلونك|وش اخبارك|شكرا لك|شكرا|يعطيك العافيه|يا عطل|يا الغالي/gu,'').trim();
 if(!courtesyRemainder&&greeting.test(t)&&wellbeing.test(t))return small('وعليكم السلام ورحمة الله وبركاته. الحمد لله، بخير، شكرًا لسؤالك. كيف أستطيع مساعدتك في مشكلة تقنية بالعمل؟');
 // Whole-message matches: a greeting prefix cannot authorize an unrelated question.
 if(/^(?:السلام|سلام|السلام عليكم(?: ورحمه الله(?: وبركاته)?)?|سلام عليكم|وعليكم السلام(?: ورحمه الله(?: وبركاته)?)?)$/u.test(t))return small('وعليكم السلام ورحمة الله وبركاته. أهلًا بك، كيف أستطيع مساعدتك؟');
 if(/^(?:اهلا|اهلين|مرحبا|هلا|هلا والله|hello|hi|hey)$/u.test(t))return small(en?'Hello! How can I help with a technical problem at work?':'أهلًا وسهلًا! كيف أستطيع مساعدتك في مشكلة تقنية بالعمل؟');
 if(/^(?:كيف حالك|كيف الحال|كيفك|شلونك|وش اخبارك|كيف امورك|how are you)(?: اليوم)?$/u.test(t))return small(en?'I’m here and ready to help, thank you for asking. How are you?':'الحمد لله، بخير. شكرًا لسؤالك، كيف حالك أنت؟');
 if(/^(?:شكرا|شكرا لك|شكرا علي (?:الاجابه|المساعده)|اشكرك|مشكور|تسلم|يعطيك العافيه|thanks|thank you)(?: جزيلا)?$/u.test(t))return small(en?'You’re welcome. If the problem remains, tell me what happened and we can continue.':'العفو، يسعدني مساعدتك. إذا بقيت المشكلة، أخبرني بما حدث لنكمل.');
 if(/^(?:الحمد لله|الحمدلله|بخير|تمام|كويس|بخير الحمد لله|الحمد لله بخير|الحمدلله بخير|انا بخير|fine|good|i m fine)$/u.test(t)&&!(active&&/^(?:تمام|fine|good)$/u.test(t)))return small(en?'Glad to hear that. Is there a technical fault at work I can help you with?':'الحمد لله. هل تواجه مشكلة تقنية في العمل أستطيع مساعدتك بها؟');
 if(outside.test(t))return refuse();
 if(/شخصي|للترفيه|للتسليه|personal|entertainment/u.test(t)&&!/للعمل عن بعد|work from home/u.test(t))return refuse();
 if(/^(?:عندي مشكله|عندي عطل|احتاج مساعده|ساعدني|عندي سؤال|عندي استفسار|i need help|i have a problem)$/u.test(t))return small(en?'I’m here to help. What technical problem are you experiencing at work?':'أنا هنا لمساعدتك. ما المشكلة التقنية التي تواجهها في العمل؟','clarify','work_it');
 if(technical.test(t)&&fault.test(t))return null; // May call the model with scoped RAG.
 if(active&&(isExplanationFollowup(t)||isInstructionFollowup(t)))return null;
 // Values answering the assistant's question are not new information requests.
 if(active&&/^(?:ويندوز|ويندز|windows)(?:\s*(?:10|11))?$|^(?:ماك|ماك او اس|macos|mac os|اندرويد|android|ايفون|ios|كروم|chrome|ايدج|edge|سفاري|safari|اوتلوك|outlook|تيمز|teams|زوم|zoom|اكسل|excel|word|sap|oracle)$/u.test(t))return null;
 if(active&&/^(?:كل المواقع|جميع المواقع|موقع واحد|خدمه واحده|كل الزملاء|جميع الزملاء|الجميع|انا فقط|all sites|one site|everyone|only me)$/u.test(t))return null;
 const followup=/^(?:نعم|ايه|ايوه|اي|لا|تمام|اوكي|حسنا|ما زال|مازال|مستمره|لم افهم|ما فهمت|لم تنحل|ما انحلت|انحلت|تم الحل|ضبطت|اشتغل|اشتغلت|جربت|جربتها|حاولت|سويت|يظهر|يقول|يقولي|رساله|متصل|مو متصل|فقط|كلها|الجميع|انا فقط|وين|كيف اسوي|كيف افتح|كيف اجرب|ما نفع|ما ضبط|ما اشتغل|yes\b|no\b|tried\b|still\b|it says\b|error\b|didn t\b|worked\b|not yet\b)/u;
 if(active&&t.length<=300&&followup.test(t)&&!/تعرف|من هو|من هي|كم عمر|متي ولد|تكلم عن|حدثني عن|who is|tell me about/u.test(t))return null;
 if(!active&&(isExplanationFollowup(t)||isInstructionFollowup(t)||/^(?:لا\s*يعمل|لا\s*تعمل|ما نفع|جربت|لم افهم|ما فهمت)/u.test(t)))return small(en?'Which work device, service, or suggested step do you mean? Tell me what is not working so I can help.':'ما الجهاز أو خدمة العمل أو الخطوة التي تقصدها؟ أخبرني بما لا يعمل حتى أساعدك بدقة.','clarify','work_it');
 if(technical.test(t))return small(en?'Are you experiencing a fault with this work service? Describe what is not working and any error message, without passwords or verification codes.':'هل تواجه عطلًا في هذه الخدمة أثناء العمل؟ صف ما لا يعمل ورسالة الخطأ إن وجدت، دون كلمات مرور أو رموز تحقق.','clarify','work_it');
 return refuse();
}

export function isOutsideTopic(text){return outside.test(normalize(text));}

