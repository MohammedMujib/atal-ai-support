import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knowledge,selectArticles,situationTitles,normalize,turnKind} from '../knowledge.mjs';
const articles=knowledge.map((a,i)=>({...a,id:i+1,example:1}));
test('الدليل يغطي مجالات الدعم دون تكرار العناوين',()=>{
 assert.ok(knowledge.length>=40);assert.equal(new Set(knowledge.map(a=>a.title)).size,knowledge.length);
 assert.ok(knowledge.every(a=>a.body.length>80&&a.keywords.length>5));
 for(const category of ['network','email','access','software','hardware','other'])assert.ok(knowledge.some(a=>a.category===category));
});
for(const [query,expected] of [
 ['الإيميل مو راضي يرسل من Outlook','إرسال البريد والمرفقات'],
 ['الطابعة ما تطبع وتظهر offline','الطابعة لا تطبع أو تظهر غير متصلة'],
 ['جاني ايميل فيه رابط مشبوه phishing','رسالة بريد أو رابط مشبوه'],
 ['كاميرا Teams ما تشتغل في الاجتماع','الكاميرا أو الميكروفون لا يعملان في الاجتماع'],
 ['نسيت الباسورد والحساب مقفل','نسيت كلمة المرور أو الحساب مقفل'],
 ['بطارية اللابتوب منتفخة وفيها رائحة','حرارة شديدة أو رائحة أو انتفاخ بطارية'],
 ['ون درايف ما يسوي مزامنة','مزامنة OneDrive أو ملفات العمل'],
 ['كيف أحفظ ملف وورد بصيغة PDF','حفظ ملف PDF أو تحويل مستند'],
 ['VPN ما يتصل من المنزل','اتصال VPN لا يعمل']
])test(`استرجاع مصدر مرتبط: ${query}`,()=>{assert.ok(selectArticles(articles,query).some(a=>a.title===expected));});
test('المتابعة تبقى مرتبطة بسياق الموظف السابق',()=>{assert.ok(selectArticles(articles,'جربت الخطوة المقترحة وما انحلت المشكلة',[{role:'user',content:'الطابعة ما تطبع'}]).some(a=>a.title.includes('الطابعة')));});
test('سؤال الدخول لا يُربط بمقالة تجهيز موظف جديد',()=>{const found=selectArticles(articles,'ما أقدر أدخل على حساب العمل');assert.equal(found.some(a=>a.title.includes('تجهيز موظف')),false);const login=selectArticles(articles,'حساب العمل ما يدخلني');assert.ok(login.some(a=>a.title.includes('نسيت كلمة المرور')));assert.equal(login.some(a=>a.title.includes('الهاتف')),false);});
test('متابعة المحاولة تبقى على المقال السابق ولا تسحب تسليم الجهاز',()=>{const internet=articles.find(a=>a.title.includes('الإنترنت لا يعمل'));const history=[{role:'user',content:'الإنترنت لا يعمل'},{role:'assistant',content:'تحقق من المواقع',analysis:{sources:[internet.id]}}];const found=selectArticles(articles,'جربتها وما نفع',history);assert.deepEqual(found.map(a=>a.id),[internet.id]);});
test('المحتوى الذي يحتاج مراجعة لا يدخل الاسترجاع',()=>{const pending=articles.find(a=>a.review_status==='needs_review');assert.ok(pending);assert.equal(selectArticles(articles,pending.title).some(a=>a.review_status==='needs_review'),false);});
test('خطوات ويندوز لا تختلط مع مقالة ماك فقط',()=>{const found=selectArticles(articles,'Windows Start menu will not open');assert.equal(found.some(a=>a.os==='macOS'),false);});
test('الاسترجاع محدود حتى لا يرسل الدليل كله للنموذج',()=>{assert.ok(selectArticles(articles,'بريد شبكة برنامج جهاز حساب').length<=4);assert.equal(normalize('إيميل شَاشَة'),'ايميل شاشه');});
test('الوصف العام يعرض عناوين الحالات ولا يربط مقالة كأنها التشخيص',()=>{assert.equal(selectArticles(articles,'عندي مشكلة في الشبكة').length,0);const titles=situationTitles(articles,'عندي مشكلة في الشبكة');assert.ok(titles.length>1);assert.equal(titles.some(title=>title.includes('واي فاي')),true);const connected=selectArticles(articles,'متصل لكن المواقع لا تفتح');assert.ok(connected.some(a=>a.title.includes('الإنترنت لا يعمل')));assert.equal(connected.some(a=>/vpn/i.test(a.title)),false);assert.ok(selectArticles(articles,'كيف أشارك شاشتي في Teams؟').some(a=>a.title.includes('مشاركة الشاشة')));assert.equal(selectArticles(articles,'كيف أشارك شاشتي في Teams؟').some(a=>a.os==='Android'),false);});
test('كل موضوع عام له نص إنجليزي مكافئ',()=>{assert.ok(knowledge.every(a=>a.title_en&&a.body_en.length>80&&a.keywords_en.length>5));});
test('استرجاع مصدر مرتبط بالإنجليزية',()=>{assert.ok(selectArticles(articles,'VPN will not connect from home').some(a=>a.title==='اتصال VPN لا يعمل'));assert.ok(selectArticles(articles,'The printer is offline').some(a=>a.title.includes('الطابعة')));});
test('مقال منتج آخر لا يُستخدم لموقع الشركة',()=>{const found=selectArticles(articles,'طلع موقع الشركة فقط ما يفتح');assert.equal(found.some(a=>/sharepoint/i.test(a.title)),false);assert.equal(found.some(a=>a.title.includes('محجوب')),false);assert.equal(found.some(a=>a.title.includes('ملف لا يفتح')),false);assert.equal(found.some(a=>a.title.includes('الهاتف')),false);assert.ok(found.some(a=>a.title.includes('الإنترنت')));});
test('نفي الواي فاي لا يعيد مقالة الواي فاي',()=>{const found=selectArticles(articles,'الكيبل مو الواي فاي');assert.equal(found.some(a=>/واي فاي|الهاتف/.test(a.title)),false);});
test('عطل الإنترنت لا يُربط بمقالة الشاشة السوداء',()=>{const found=selectArticles(articles,'الإنترنت في جهاز العمل ما يشتغل');assert.equal(found.some(a=>a.title.includes('الشاشة سوداء')),false);assert.equal(found.some(a=>a.title.includes('جهاز شخصي')),false);assert.ok(found.some(a=>/الإنترنت|واي فاي/.test(a.title)));});
test('نوع الرسالة يفصل التحية والمشكلة والسر عن الدعم',()=>{
 assert.equal(turnKind('السلام عليكم ورحمة الله وبركاته',articles),'greeting');
 assert.equal(turnKind('عندي مشكلة',articles),'vague');
 assert.equal(turnKind('نسيت كلمة مرور حساب العمل',articles),'support');
 assert.ok(selectArticles(articles,'نسيت كلمة مرور حساب العمل').some(a=>a.title.includes('نسيت كلمة المرور')));
 assert.equal(turnKind('اكتب لي قصيدة عن المطر',articles),'outside');
 assert.equal(turnKind('اعطني كلمة مرور زميلي',articles),'secret');
 assert.equal(turnKind('واتساب ما يفتح',articles),'unclear');
 assert.equal(turnKind('أقصد الكيبل مو الواي فاي',articles),'support');
 assert.equal(turnKind('نعم',articles),'support');
});
