// General, authored IT guidance. These are not any company's approved policies.
import {english} from './knowledge-en.mjs';
import {extraKnowledge} from './knowledge-extra.mjs';
const coreKnowledge = [
 ['إرسال البريد والمرفقات','email','ايميل إيميل بريد outlook اوتلوك يرسل ارسال مرفق مرفقات','تحقق هل الإرسال لا يعمل لكل الرسائل أم رسالة واحدة. جرّب رسالة قصيرة دون مرفق إلى مستلم معروف. راجع صندوق الصادر ورسالة الخطأ. إن كان المرفق كبيرًا استخدم وسيلة مشاركة الملفات المعتمدة، مع صلاحيات مناسبة. يمكن تجربة بريد الويب الرسمي. لا تحذف رسائل مهمة أو تغيّر إعدادات الخادم. صعّد إذا استمر الخطأ.'],
 ['البريد لا يستقبل أو الرسائل مفقودة','email','بريد ايميل يستقبل استقبال رسائل مفقودة spam junk inbox الوارد','ابحث باسم المرسل أو عنوان الرسالة، وافحص البريد غير الهام والأرشيف والقواعد من الواجهة المعتمدة. تحقق من مساحة صندوق البريد ورسالة التنبيه. اطلب من المرسل تأكيد عنوانك. لا تعطل فلاتر الحماية ولا تحذف رسائل لتفريغ المساحة دون مراجعتها. إذا اختفت رسائل كثيرة أو تغيّرت قواعد البريد دون علمك بلّغ الدعم.'],
 ['امتلاء صندوق البريد','email','بريد ايميل مساحة ممتلئ امتلاء mailbox quota full','تحقق من تنبيه المساحة في تطبيق البريد. راجع المرفقات الكبيرة والرسائل التي يمكن أرشفتها حسب سياسة الاحتفاظ. لا تحذف بريدًا تجاريًا أو قانونيًا ولا تفرغ المحذوفات تلقائيًا. اطلب من الدعم طريقة الأرشفة المعتمدة أو مراجعة سعة الحساب.'],
 ['التوقيع والرد التلقائي في البريد','email','توقيع ايميل بريد رد تلقائي اجازة إجازة signature automatic replies','حدد تطبيق البريد الذي تستخدمه، ثم ابحث في إعداداته عن التوقيع أو الردود التلقائية. استخدم قالب الشركة المعتمد وحدد مدة الغياب. تجنب وضع تفاصيل داخلية أو أرقام شخصية في الرد الخارجي. معاينة رسالة اختبار مفيدة قبل الاعتماد. إن لم تجد الإعداد اطلب دليل التطبيق من الدعم.'],
 ['رسالة بريد أو رابط مشبوه','access','تصيد احتيال مشبوه رابط phishing تهكير اختراق رسالة غريبة','لا تضغط الرابط أو تفتح المرفق ولا ترد على الرسالة. تحقق من هوية المرسل عبر قناة معروفة مستقلة. استخدم قناة الإبلاغ الأمني المعتمدة لدى الشركة. إذا أدخلت كلمة مرور أو رمز تحقق أخبر فريق الأمن فورًا عبر وسيلة رسمية، دون إرسال السر داخل المحادثة. لا تحذف الأدلة ولا تعيد توجيه المرفق لزملائك.',true],
 ['نسيت كلمة المرور أو الحساب مقفل','access','نسيت باسورد باسوورد كلمة مرور مقفل مقفول قفل حساب حسابي password locked login دخول','لا يتضمن هذا الدليل رابطًا أو إجراء استعادة خاصًا بالشركة. لا تفتح رابطًا وصل في رسالة غير متوقعة ولا تكرر المحاولة بكلمات عشوائية. إذا كان الحساب مقفلًا أو تعذر الدخول، اطلب فريق الدعم لمراجعة الحالة والتحقق من الهوية. لا تشارك كلمة المرور أو رمز التحقق.',true],
 ['رمز التحقق لا يصل أو تطبيق المصادقة لا يعمل','access','رمز تحقق كود mfa otp authenticator مصادقة جوال جديد','تحقق من اتصال الهاتف والوقت التلقائي ومن أنك تستخدم حساب العمل الصحيح. لا توافق على طلب مصادقة لم تبدأه. لا ترسل رمز التحقق لأي شخص. عند فقد الجهاز أو تبديله، يحتاج فريق الدعم إلى إجراء استعادة رسمي؛ لا تعطّل المصادقة ولا تحاول تجاوزها.',true],
 ['طلب صلاحية برنامج أو مجلد مشترك','access','صلاحية صلاحيات ممنوع denied permission access مجلد مشترك برنامج جديد','اذكر اسم النظام أو المجلد، والمهمة المطلوبة، ونص رسالة الرفض دون معلومات حساسة. لا تستخدم حساب زميلك ولا تحاول تغيير صلاحيات الملفات. قد يتطلب الطلب موافقة مالك الخدمة أو المدير حسب سياسة الشركة. يحوّل الطلب إلى الفني المخول.',true],
 ['طلب تجهيز موظف جديد أو جهاز عمل','other','موظف جديد مباشرة onboarding تجهيز جهاز حساب جديد','حدد تاريخ المباشرة والقسم والأدوات المطلوبة وطبيعة الاستخدام. يجهز طلب دعم بالتطبيقات والحسابات والمستلزمات اللازمة. إنشاء الحسابات ومنح الصلاحيات وتوفير الأجهزة يتم عبر فرق الشركة وموافقاتها؛ لا يعد المساعد بتجهيزها أو بموعد لم يُعتمد.',true],
 ['الواي فاي لا يتصل','network','واي فاي وايفاي wifi wi-fi شبكة شبكه اتصال انترنت نت','تحقق من تشغيل الاتصال اللاسلكي وعدم تشغيل وضع الطيران، واختيار شبكة الشركة المعتمدة. اسأل هل يتأثر زملاء قريبون أيضًا. جرّب فصل الاتصال ثم إعادة توصيله من جهازك. لا تطلب كلمة مرور الشبكة في المحادثة ولا تستخدم شبكة مجهولة. إذا استمرت المشكلة أرفق اسم الشبكة ورسالة الخطأ في التذكرة.'],
 ['متصل بالشبكة لكن الإنترنت لا يعمل','network','انترنت إنترنت نت شبكة متصل يفتح مواقع اتصال مقطوع no internet','تحقق من أكثر من موقع معروف ومسموح. حدد هل جميع المواقع متأثرة أم خدمة واحدة وهل المشكلة عند الجميع. جرّب إعادة الاتصال من جهازك. لا تغير DNS أو proxy أو إعدادات الراوتر والجدار الناري. إن تأثرت الشركة أو عدة أقسام افتح بلاغًا يوضح النطاق.'],
 ['بطء الإنترنت أو تقطع الاتصال','network','بطيء بطئ نت انترنت تقطيع يقطع اتصال سرعة latency','حدد وقت البطء وهل يظهر في كل الخدمات أو اجتماع أو برنامج واحد. أوقف تنزيلًا غير ضروري على جهازك إن كان ذلك لا يعطل عملًا جاريًا. جرّب مكانًا أقرب لنقطة الاتصال دون تغيير أجهزة الشبكة. سجّل الوقت والخدمة المتأثرة وأبلغ الدعم إذا تكرر. لا تدّعِ قياس سرعة دون بيانات فعلية.'],
 ['اتصال VPN لا يعمل','network','vpn في بي ان اتصال بعيد عن بعد شبكة منزل','تأكد من وجود إنترنت أولًا ومن استخدام عميل VPN المعتمد وحساب العمل الصحيح. سجّل رسالة الخطأ ووقت المحاولة. لا تثبت VPN شخصيًا ولا تعطل الحماية ولا تستخدم حساب زميل. مشاكل الإعداد أو المصادقة تحتاج فريق الدعم. لا تطلب عنوان خادم أو مفاتيح سرية داخل المحادثة.',true],
 ['موقع محجوب أو تحذير أمان في المتصفح','network','محجوب محظور شهادة certificate ssl اتصال غير خاص موقع خطير','تأكد من صحة العنوان بالرجوع لمصدر رسمي معروف. لا تتجاوز تحذير الشهادة ولا تعطل فحص الحماية أو تغيّر إعدادات الشبكة لفتح الموقع. أرسل اسم الخدمة ونص التحذير لفريق الدعم دون رموز جلسة أو روابط تحوي بيانات حساسة.',true],
 ['انقطاع شبكة في قسم أو فرع كامل','network','الفرع القسم الجميع كلنا انقطاع شبكة متوقف توقف عام','حدد الفرع أو القسم ووقت بداية الانقطاع والخدمات المتأثرة وهل يوجد بديل للعمل. لا تعد تشغيل الراوترات أو أجهزة الشبكة ولا تلمس التوصيلات العامة. جهّز تذكرة جماعية للفني بدل إنشاء بلاغات متكررة، مع التأكد من أن مشكلة عامة معلنة بالفعل قبل إخبار الموظفين بذلك.',true],
 ['الحاسب بطيء أو يتجمد','hardware','جهاز كمبيوتر لابتوب بطيء يعلق يهنق يتجمد تعليق بطء','احفظ عملك إن أمكن. أغلق التطبيقات غير المستخدمة من واجهتها المعتادة. إذا كان النظام مستجيبًا أعد تشغيله بعد التأكد من حفظ الملفات وعدم وجود تحديث جارٍ. لا تستخدم برامج تنظيف مجهولة أو تحذف ملفات النظام. سجل متى بدأ البطء وما التطبيق المفتوح. التعطل المتكرر يحتاج فنيًا.'],
 ['الجهاز لا يعمل أو الشاشة سوداء','hardware','شاشة شاشه سوداء اسود جهاز يشتغل مايفتح تشغيل باور power black screen','تحقق من اتصال مصدر الكهرباء والشاحن المعتمد ومن تشغيل الشاشة الخارجية إن وجدت. حدد هل توجد إضاءة أو صوت تشغيل. لا تفتح الجهاز ولا تستخدم شاحنًا غير مناسب ولا تكرر الإطفاء القسري. عند وجود سخونة أو تلف واضح توقف عن الاستخدام واطلب فنيًا.'],
 ['حرارة شديدة أو رائحة أو انتفاخ بطارية','hardware','حرارة سخونة حار يحتر بطارية منتفخة انتفاخ دخان ريحة احتراق','توقف عن استخدام الجهاز. لا تشحن بطارية منتفخة ولا تفتحها أو تضغط عليها أو تحاول إصلاحها. اتبع إجراءات السلامة في المنشأة واتصل بالجهة المختصة فورًا؛ الدخان أو خطر الحريق حالة سلامة عاجلة. معالجة الجهاز وتسليمه تكون لفريق مخول.',true],
 ['الشاحن أو البطارية لا يشحنان','hardware','شاحن شحن بطارية بطاريه يشحن battery charger','تحقق بصريًا من سلامة الكابل واتصاله واستخدم الشاحن المعتمد المناسب للجهاز. لا تستخدم كابلًا تالفًا أو شاحنًا غير معروف ولا تجرب إصلاح المنفذ. سجل رسالة النظام وحالة الإضاءة. إذا استمر العطل أو ظهرت حرارة أو رائحة توقف عن الاستخدام واطلب فنيًا.'],
 ['الشاشة الخارجية أو محطة التوصيل لا تعمل','hardware','شاشة خارجية ثانية شاشتين hdmi display dock docking بروجكتر عرض','تحقق من الطاقة ومن اختيار مدخل الشاشة الموافق للكابل، ومن إحكام التوصيل الخارجي دون قوة. حدد هل الجهاز يكتشف الشاشة. استخدم خيارات العرض المعتادة للتكرار أو التوسيع. لا تثبت تعريفات من مصدر غير معتمد. مشاكل المحطة أو استمرار فقد الإشارة تحتاج فنيًا.'],
 ['لوحة المفاتيح أو الفأرة لا تعمل','hardware','كيبورد كيبورد keyboard ماوس فارة فأرة mouse مفاتيح كتابة','تحقق من الطاقة أو البطارية والاتصال الخارجي. جرّب منفذًا آخر مسموحًا على الجهاز إن كان ذلك متاحًا. للأجهزة اللاسلكية تحقق من اتصال Bluetooth من الإعدادات المعتادة. لا تفك الجهاز أو تثبت برامج تعريف مجهولة. صعّد إذا استمرت المشكلة.'],
 ['الصوت أو السماعة لا تعمل','hardware','صوت سماعة سماعات speaker headset اسمع مافيه صوت','تحقق من مستوى الصوت وعدم الكتم، ومن اختيار مخرج الصوت الصحيح. جرّب مقطعًا معروفًا أو اختبار الصوت داخل تطبيق العمل. تحقق من اتصال السماعة. لا تشارك تسجيلات خاصة أو تثبت برامج غير معتمدة. إذا كانت المشكلة في تطبيق واحد حدد اسمه للفني.'],
 ['الطابعة لا تطبع أو تظهر غير متصلة','hardware','طابعة طابعه طباعة طباعه تطبع printer offline ورق','تحقق من الطاقة ومن اختيار الطابعة الصحيحة واتصالها المعتمد. راجع رسالة الشاشة وحالة الورق دون فتح أجزاء داخلية. لا تلغ مهام زملائك أو تطبع مستندات حساسة للاختبار. إن وُجدت مهمة تخصك عالقة يمكنك طلب مساعدة الدعم لإلغائها. لا تعالج انحشارًا داخليًا دون إجراء معتمد.'],
 ['الماسح الضوئي والمسح إلى ملف','hardware','سكانر سكان scan مسح ماسح ضوئي مستند','استخدم جهاز وتطبيق المسح المعتمدين، وتحقق من اختيار الوجهة الصحيحة قبل بدء المسح. احفظ المستند في مجلد العمل المخول وتحقق من وضوحه وعدد الصفحات. لا ترسل مستندات العمل إلى بريد شخصي أو أدوات تحويل عامة. مشاكل الربط أو الإعداد تحتاج الدعم.'],
 ['برنامج يتعطل أو لا يفتح','software','برنامج تطبيق ينهار crash توقف يفتح مايفتح خطا خطأ error','احفظ ما يمكن حفظه وسجل اسم البرنامج ورسالة الخطأ ووقت ظهورها. جرّب إغلاق البرنامج وإعادة فتحه من الواجهة المعتادة. لا تحذف إعداداته أو تعيد تثبيته بنفسك إذا كان يتطلب صلاحيات أو تراخيص. إذا تكرر الخطأ جهّز تذكرة مع الخطوات السابقة.'],
 ['تثبيت برنامج أو تحديثه أو ترخيصه','software','تثبيت تنزيل تحميل install update تحديث ترخيص license activation تفعيل','تحقق من كتالوج البرامج أو قناة التثبيت الرسمية لدى الشركة. اذكر اسم البرنامج وسبب الحاجة له. لا تستخدم نسخة مقرصنة أو أداة تفعيل ولا تحمل مثبتًا من رابط مجهول. تثبيت البرامج وصلاحيات المسؤول ومفاتيح الترخيص مسؤولية الفريق المخول.',true],
 ['اجتماع Teams أو Zoom لا يفتح','software','teams تيمز zoom زوم اجتماع اجتماع meeting دعوة رابط','تأكد من أنك تستخدم تطبيق الشركة المعتمد وحساب العمل الصحيح ورابط الدعوة الموثوق. تحقق من موعد الاجتماع واتصال الإنترنت. يمكن تجربة نسخة الويب الرسمية إذا كانت مسموحة. لا تنشر رابط اجتماع خاص أو رمز دخوله في قنوات عامة. سجل نص الخطأ إذا استمر.'],
 ['الكاميرا أو الميكروفون لا يعملان في الاجتماع','software','كاميرا كام كامرة مايك ميكروفون microphone camera فيديو تيمز زوم يسمعوني يشوفوني','تحقق من اختيار الكاميرا أو الميكروفون الصحيح داخل تطبيق الاجتماع، ومن عدم الكتم أو إغلاق غطاء الكاميرا. راجع إذن التطبيق من إعدادات الخصوصية المعتادة دون تغيير سياسة الشركة. أغلق تطبيقًا آخر قد يستخدم الجهاز. لا تمنح مواقع مجهولة الإذن ولا تثبت أدوات إصلاح خارجية.'],
 ['مشاركة الشاشة مع حماية المعلومات','software','مشاركة شاشة share screen اجتماع عرض بوربوينت powerpoint','قبل المشاركة أغلق النوافذ التي تحتوي بيانات حساسة. شارك نافذة العمل المطلوبة بدل الشاشة كاملة متى أمكن. تحقق من المشاركين ومن سياسة الشركة للتسجيل. لا تتجاوز صلاحيات المضيف؛ إذا كانت المشاركة ممنوعة اطلب منه تفعيلها بالطريقة المعتمدة.'],
 ['المتصفح بطيء أو صفحة لا تعمل','software','متصفح كروم ايدج chrome edge browser صفحة كاش cache','حدد هل المشكلة في صفحة واحدة أو جميع الصفحات. جرّب إعادة تحميل الصفحة بعد حفظ أي مدخلات مهمة. يمكن تجربة متصفح عمل آخر معتمد. لا تمسح جميع البيانات أو كلمات المرور ولا تعطّل إضافات الحماية. إذا كان الموقع يعرض تحذيرًا أمنيًا توقف ولا تتجاوزه.'],
 ['تغيير لغة الكتابة وحجم العرض','software','لغة لغه عربي انجليزي كيبورد خط صغير تكبير تصغير حجم عرض','حدد نظام التشغيل والتطبيق أولًا. يمكن تغيير لغة الإدخال من مؤشر اللغة، أو ضبط حجم العرض من إعدادات الجهاز المعتادة. إذا كان النص صغيرًا داخل المتصفح استخدم خيار التكبير من قائمته. لا تقترح اختصارًا خاصًا بنظام غير معروف ولا تغيّر إعدادات إدارة الشركة.'],
 ['التقاط لقطة شاشة لشرح المشكلة','software','لقطة سكرين شوت screenshot تصوير شاشة صورة خطأ','استخدم أداة التقاط الشاشة المدمجة في نظامك وحدد نافذة الخطأ فقط. أخفِ البريد والأسماء والبيانات الحساسة والرموز قبل مشاركتها عبر قناة الدعم المعتمدة. هذه النسخة من عَطَل تستقبل وصفًا نصيًا فقط ولا ترفع الصور؛ يمكنك نسخ نص الخطأ بدلًا من الصورة.'],
 ['ملف لا يفتح أو الصيغة غير مدعومة','software','ملف يفتح صيغة امتداد pdf word excel وورد اكسل مستند تالف','تحقق من امتداد الملف واسم التطبيق المعتمد لفتحه. تأكد من اكتمال تنزيله ومن أن المرسل معروف. لا تغيّر الامتداد عشوائيًا ولا تفعّل وحدات الماكرو أو المحتوى المحظور. جرّب نسخة أصلية أخرى من المصدر المعتمد. الملفات التالفة أو المهمة تحتاج دعمًا قبل أي محاولة إصلاح.'],
 ['حفظ ملف PDF أو تحويل مستند','software','pdf بي دي اف تحويل تصدير مستند وورد word طباعة ملف','استخدم خيار الحفظ أو التصدير إلى PDF داخل تطبيق الشركة المعتمد إن كان متاحًا. راجع الصفحات والتنسيق قبل المشاركة واحتفظ بالأصل القابل للتحرير. لا ترفع ملفات الشركة إلى مواقع تحويل عامة. إذا كان الخيار غير متاح اطلب الطريقة المعتمدة من الدعم.'],
 ['استرجاع ملف محذوف أو عمل غير محفوظ','software','حذفت حذف ضاع ملف ملفاتي استرجاع استعادة غير محفوظ recover autosave recycle','لا تكتب ملفات جديدة في المكان نفسه ولا تثبت برنامج استعادة. تحقق من سلة المحذوفات وسجل الإصدارات أو الاسترداد المدمج في التطبيق إن كانت متاحة ومسموحة. لا تفرغ السلة أو تستبدل النسخة الحالية قبل حفظها. أبلغ الدعم بموقع الملف ووقت فقده. الاسترجاع غير مضمون.',true],
 ['مزامنة OneDrive أو ملفات العمل','software','onedrive ون درايف مزامنة sync سحابة سحابه sharepoint درايف','تحقق من اتصال الإنترنت ومن دخول حساب العمل الصحيح ومن رسالة حالة المزامنة. لا تفصل الحساب أو تعيد ضبط المزامنة أو تحذف المجلد المحلي. إذا وجدت نسختين متعارضتين احتفظ بهما واطلب من الدعم تحديد النسخة الصحيحة. لا تنقل ملفات الشركة لحساب شخصي.'],
 ['مساحة الجهاز ممتلئة','hardware','مساحة قرص دسك هارد ممتلئ تخزين storage disk full','راجع عرض المساحة في إعدادات النظام لتحديد المجلدات الكبيرة. لا تحذف ملفات النظام أو مجلدات العمل المشتركة أو ملفات لا تعرفها. انقل الملفات فقط إلى موقع عمل معتمد وبعد التحقق من النسخ الاحتياطي. اطلب من الدعم مراجعة المساحة إذا لم تتضح الملفات الآمنة للإزالة.'],
 ['الوصول إلى مجلد الشبكة من المنزل','network','مجلد شبكة مشترك ملفات سيرفر server drive mapped عن بعد منزل','حدد موقع المجلد ورسالة الخطأ دون مشاركة مسارات حساسة علنًا. تحقق من اتصالك بالطريقة المعتمدة للعمل عن بعد إن كانت الشركة تتطلب VPN. لا تفتح منافذ الشبكة ولا تستخدم وسائل نقل شخصية لتجاوز المنع. الصلاحيات أو الربط تحتاج الدعم.',true],
 ['إعداد بريد العمل على الجوال','email','جوال هاتف موبايل بريد ايميل iphone اندرويد android outlook mobile','استخدم التطبيق المعتمد وقناة إعداد أجهزة العمل لدى الشركة. قد يلزم تسجيل الجهاز وإجراء موافقة؛ لا تضف بريد العمل إلى تطبيق غير معتمد ولا توافق على أذونات لا تفهمها. لا تشارك كلمة المرور أو رموز المصادقة. إذا لم يُذكر الإجراء المعتمد هنا، يوجهك فريق الدعم إليه.',true],
 ['هاتف العمل أو المكالمات لا تعمل','hardware','هاتف تلفون تحويلة مكالمات اتصال داخلي سنترال voip تحويل رقم','تحقق من الطاقة والتوصيل الخارجي للهاتف ومن أن الكتم غير مفعّل. حدد هل المشكلة في الاتصال الداخلي أو الخارجي أم جميع المكالمات. لا تغيّر إعدادات السنترال أو الشبكة. أبلغ الدعم بالتحويلة والخدمة المتأثرة دون نشر بيانات عملاء.'],
 ['فقد جهاز العمل أو الاشتباه بسرقته','access','فقد ضاع سرقة انسرق جهاز لابتوب جوال مفقود','أبلغ فريق الدعم أو الأمن فورًا عبر قناة رسمية، مع نوع الجهاز ووقت ومكان الفقد بالقدر اللازم. لا تنشر موقع الجهاز أو بياناته علنًا ولا تحاول ملاحقة شخص بنفسك. قفل الجهاز عن بعد أو مسحه أو إلغاء الجلسات من اختصاص الفريق المخول حسب إجراءات الشركة.',true],
 ['تنبيه فيروس أو طلب فدية','access','فيروس فدية ransomware malware تشفير ملفات هاكر تهكير حماية تنبيه','أوقف التفاعل مع التنبيه أو الملف ولا تدفع أو تتواصل مع الجهة المجهولة. اتصل بفريق الأمن أو الدعم فورًا من قناة موثوقة واتبع خطة الشركة للاستجابة. لا تحذف الأدلة أو تجرّب أدوات تنظيف أو إعادة تهيئة. لا تستخدم أجهزة أو حسابات أخرى لنقل ملفات مشبوهة.',true],
 ['طلب كلمة مرور أو تحكم عن بعد','access','يتصل دعم طلب باسورد رمز anydesk teamviewer تحكم عن بعد remote','لا تعطِ كلمة المرور أو رمز التحقق لأي شخص. تحقق من هوية الدعم من رقم أو قناة رسمية معروفة لديك. لا تثبت أداة تحكم عن بعد أو تمنح وصولًا بناء على اتصال مفاجئ. أبلغ أمن المعلومات إذا سبق أن شاركت بيانات دخول أو منحت وصولًا.',true],
 ['ما المعلومات المفيدة عند رفع بلاغ؟','other','بلاغ تذكرة دعم فني معلومات وصف مشكلة كيف ابلغ ticket','اذكر اسم الخدمة والجهاز، وصف ما توقعت حدوثه وما حدث فعلًا، وقت بداية المشكلة، نص الخطأ، من المتأثر، والخطوات التي جربتها. لا تكتب كلمات مرور أو رموز تحقق أو بيانات عملاء. عَطَل يحفظ تذكرتك داخله، ولا يرسلها خارجيًا تلقائيًا.'],
 ['متابعة التذكرة أو طلب تدخل بشري','other','متابعة حالة طلب تذكرة فني انسان بشري اكلم اتواصل الدعم','من صفحة طلبات الدعم افتح رقم تذكرتك لعرض الحالة وآخر ملاحظة. إذا لم يساعدك الحل اختر أحتاج فني لفتح تذكرة ومراجعة ملخصها. لا يعني إنشاء التذكرة أن فنيًا استلمها أو أن لها وقت حل مضمون؛ تعتمد المتابعة على فريق الدعم داخل الشركة.'],
 ['حماية بيانات الشركة عند استخدام أدوات الذكاء الاصطناعي','access','ذكاء اصطناعي chatgpt llama ai بيانات خصوصية سرية سري','استخدم أدوات الذكاء الاصطناعي المعتمدة في الشركة فقط. لا تدخل كلمات مرور أو أسرار أو بيانات عملاء أو ملفات داخلية في أداة غير معتمدة. احذف التفاصيل الحساسة من أمثلة المشاكل. التشغيل المحلي وحده لا يثبت الامتثال أو الأمان المؤسسي؛ راجع مسؤول الشركة عند الشك.'],
 ['سؤال غير واضح أو موضوع خارج الدعم التقني','other','مساعدة سؤال استفسار كيف استخدم ما اعرف مشكلتي','اطلب من الموظف وصف ما يحاول إنجازه واسم الجهاز أو البرنامج بلغة بسيطة. إذا كان الموضوع رواتب أو إجازات أو إجراء قانونيًا أو طبيًا، وضح أن عَطَل مخصص للدعم التقني ووجّهه للقسم المناسب دون اختلاق سياسة شركة أو إجابة تخصصية. لا تفتح تذكرة تقنية تلقائيًا لموضوع خارج الاختصاص.']
].map(([title,category,keywords,body,handover=false])=>{
 const en=english[title];
 if(!en) throw new Error(`Missing English guidance for: ${title}`);
 return {title,category,keywords,body,handover,title_en:en.title,keywords_en:en.keywords,body_en:en.body,slug:'',product:'',os:'',source_name:'',source_url:'',reviewed_at:'2026-11-02',review_status:'reviewed'};
});
export const knowledge = [...coreKnowledge, ...extraKnowledge];

export function normalize(text){return String(text).toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();}
const stop=new Set(['من','في','علي','عن','الي','ان','انا','هو','هي','هل','ما','مو','لا','لي','مع','كل','كيف','وش','بس','هذا','هذه','عندي','ابي','ابغي','اريد','اقدر','يكون','كان','اللي','راضي','جربت','مشكله','المشكله','مشكلتي','المقترحه','الخطوه','التاليه','انحلت','the','and','for','with','from','that','this','your','you','are','was','not','but','can','its','into','about','have','has','will','does','did']);
const generic=new Set(['حساب','حسابي','جديد','جهاز','برنامج','ملف','دخول','ادخل','عمل','شبكه','دعم','بريد','ايميل','نت','انترنت','خدمه','تطبيق','نظام','موظف','مجلد','غرفه','يعمل','يشتغل']);
const productName=new Set(['teams','تيمز','zoom','زوم','outlook','اوتلوك','vpn','windows','ويندوز','mac','ماك','android','اندرويد','iphone','ايفون','onedrive']);
function related(tag, token) {
 if (tag === token) return true;
 if(tag.endsWith('ه')&&token.endsWith('تي')&&tag.slice(0,-1)===token.slice(0,-2))return true;
 const access = /^(دخول|ادخل|يدخل|داخل|login)$/;
 if (access.test(tag) && /^(دخول|ادخل|يدخل|داخل|login)/.test(token)) return true;
 if (tag.length > 3 && token.length > 3 && (tag.startsWith(token) || token.startsWith(tag))) return true;
 const tail = token.length >= 4 ? token.slice(-4) : '';
 const head = token.length >= 4 ? token.slice(0, 4) : '';
 return false; // Shared four-letter fragments are not evidence of the same symptom.
}
function mentions(blob, pattern) { return pattern.test(blob); }
const namedProducts = [['sharepoint', /sharepoint|شير ?بوينت|شيربوينت/], ['outlook', /outlook|اوتلوك/], ['teams', /\bteams\b|تيمز/], ['zoom', /\bzoom\b|زوم/], ['onedrive', /onedrive|ون ?درايف/], ['windows', /windows|ويندوز/], ['macos', /macos|\bmac\b|ماك/], ['ios', /\bios\b|iphone|ايفون/], ['word', /\bword\b|وورد/], ['excel', /excel|اكسل/], ['powerpoint', /powerpoint|بور ?بوينت/], ['vpn', /\bvpn\b/], ['chrome', /chrome|كروم/], ['browser', /browser|متصفح/]];
function productClash(article, askedText, latestMessage = '') {
 const product = normalize(article.product || '');
 const latest = normalize(latestMessage || askedText);
 const aboutProduct = normalize(`${article.product || ''} ${article.title || ''} ${article.keywords || ''}`);
 if(article.category==='access'&&/excel|اكسل|word|وورد|powerpoint|onedrive|teams|zoom/u.test(normalize(askedText))&&!/حساب|دخول|مرور|باسورد|مصادق|رمز|account|sign in|login|password|authenticat/u.test(normalize(askedText)))return true;
 if (/واي فاي|wi fi|wifi/.test(aboutProduct) && /مو ال?واي فاي|ليس ال?واي فاي|not wi ?fi/.test(latest)) return true;
 const rule = namedProducts.find(([name, pattern]) => product === name || pattern.test(product));
 if (!rule) return false;
 return !rule[1].test(normalize(askedText));
}
export function turnKind(message, articles = []) {
 const text = normalize(message);
 if (!text) return 'empty';
 if (/(كلمه (المرور|السر)|باسورد|password).{0,24}(زميل|زملا|موظف اخر|شخص اخر|غيره)|اعطني (كلمه|باسورد)|كلمه مرور زميل|reveal (the )?password|another user.?s password/.test(text)) return 'secret';
 if (/اكتب (لي )?(قصه|شعر|مقال|نكت)|قصيده|وصفه طبخ|مباراه كره|نكت|راتب|اجازه سنويه|joke|poem|recipe|write (me )?(a )?(story|poem|essay)/.test(text)) return 'outside';
 const technical = /بريد|شبك|نت|انترنت|طابع|جهاز|حساب|دخول|اجتماع|ملف|برنامج|باسورد|مرور|طابعة|شاش|outlook|teams|vpn|windows|اوتلوك|تيمز/.test(text);
 if (/^(السلام عليكم|سلام عليكم|وعليكم السلام|مرحبا|اهلا|اهلين|هلا|صباح الخير|مساء الخير|hello|hi|hey|good morning|good evening)(\s|$)/.test(text) && text.split(' ').length <= 8 && !technical) return 'greeting';
 if (/^(شكرا|شكرا لك|مشكور|تسلم|الله يعطيك|thanks|thank you)(\s|$)/.test(text) && text.split(' ').length <= 6 && !technical) return 'thanks';
 if (/^(عندي|لدي) مشكل[هه]?\.?$|^i have a problem\.?$|^there is a problem\.?$/.test(text)) return 'vague';
 if (unknownTool(text, articles) && !/عمل|شركه|مكتب|وظيف|اقصد|الصحيح|مو كذا/.test(text)) return 'unclear';
 return 'support';
}
function unknownTool(text, articles) {
 const symptom = new Set(['يفتح','يشتغل','يرسل','مستمر','مستمره','جربت','جرت','اتصال','طلع','فقط','نفع','زال','بعد','الحين','شغال','واقف','بطيء','بطء','رساله','خطا','ظاهر','يظهر','تمام','صح','نعم','كيبل','كابل','كبل','سلك','راوتر']);
 const tokens = terms(text).filter(token => token.length >= 4 && !generic.has(token) && !symptom.has(token));
 if (!tokens.length || !articles.length) return false;
 const known = new Set();
 for (const article of articles) {
  if (article.review_status === 'needs_review') continue;
  for (const token of terms(`${article.product || ''} ${article.title || ''} ${article.keywords || ''} ${article.title_en || ''} ${article.keywords_en || ''}`)) known.add(token);
 }
 return tokens.some(token => ![...known].some(item => related(item, token)));
}
function symptomClash(article, askedText) {
 const asked = normalize(askedText);
 const about = normalize(`${article.title || ''} ${article.keywords || ''} ${article.title_en || ''} ${article.keywords_en || ''}`);
 if (/انترنت|مواقع|موقع/.test(asked) && /شاشه سود|black screen|باور|\bpower\b/.test(about) && !/انترنت|internet/.test(about)) return true;
 if (/يشتغل|لا يعمل|ما يعمل|مقطوع/.test(asked) && /شخصي|byod/.test(about) && !/شخصي|byod/.test(asked)) return true;
 if (/موقع/.test(asked) && !/محجوب|شهاده|ssl|certificate|تحذير|خطير/.test(asked) && /محجوب|شهاده|ssl|certificate/.test(about)) return true;
 if (/موقع/.test(asked) && !/برنامج|تطبيق/.test(asked) && /برنامج|تطبيق|application/.test(about) && !/موقع|انترنت|internet/.test(about)) return true;
 if (/حساب|باسورد|مرور|password|login|مقفل/.test(asked) && /واي فاي|wifi|لاسلك|هاتف|جوال|phone/.test(about) && !/حساب|باسورد|password|login|مقفل/.test(about)) return true;
 if (/موقع/.test(asked) && !/ملف|صيغه|امتداد/.test(asked) && /ملف|صيغه|امتداد/.test(about) && !/موقع|انترنت/.test(about)) return true;
 if (/موقع/.test(asked) && !/اجتماع|تيمز|زوم|teams|zoom/.test(asked) && /اجتماع|تيمز|زوم|teams|zoom/.test(about) && !/موقع|انترنت/.test(about)) return true;
 if (/موقع|انترنت/.test(asked) && /ذكاء اصطناعي|chatgpt/.test(about) && !/ذكاء|اصطناعي/.test(asked)) return true;
 if (/موقع/.test(asked) && !/هاتف|جوال|phone|واي فاي/.test(asked) && /هاتف|جوال|phone/.test(about) && !/موقع/.test(about)) return true;
 if (!/اسم المستخدم|username/.test(asked) && /اسم المستخدم/.test(about) && /غير مقبول|صيغه|format/.test(about)) return true;
 if (!/تنبيه|مكان|غير معتاد|alert/.test(asked) && /غير معتاد|unusual/.test(about)) return true;
 return false;
}
function contextClash(article, latest) {
 const asked = normalize(latest.join(' '));
 const stated = normalize(`${article.os || ''} ${article.title || ''} ${article.title_en || ''}`);
 const checks = [[/android|اندرويد/, /android|اندرويد/], [/ios|iphone|ايفون/, /ios|iphone|ايفون/], [/macos|\bmac\b|ماك/, /macos|\bmac\b|ماك/], [/windows|ويندوز/, /windows|ويندوز/], [/\bvpn\b/, /\bvpn\b/]];
 return checks.some(([marker, said]) => mentions(stated, marker) && !mentions(asked, said));
}
function terms(text){return [...new Set(normalize(text).split(' ').map(t=>t.startsWith('ال')&&t.length>4?t.slice(2):t).filter(t=>t.length>1&&!stop.has(t)))];}
function osClash(article, latest){
 const blob=normalize(`${article.os||article.os_name||''} ${article.keywords||''} ${article.title||''} ${article.title_en||''}`);
 const win=latest.some(t=>['windows','ويندوز','وندوز'].includes(t));
 const mac=latest.some(t=>['macos','mac','ماك','ماكنتوش'].includes(t));
 if(win&&!mac&&/\bmac\b|ماك|macos/.test(blob)&&!/windows|ويندوز/.test(blob))return true;
 if(mac&&!win&&/windows|ويندوز/.test(blob)&&!/\bmac\b|ماك|macos/.test(blob))return true;
 return false;
}
export function situationTitles(articles, message, language = 'ar') {
 const latest = terms(message);
 if (!latest.length || latest.some(token => !generic.has(token))) return [];
 const titles = [];
 for (const article of articles) {
  if (article.review_status === 'needs_review') continue;
  const tags = terms(`${article.keywords || ''} ${article.title || ''} ${article.keywords_en || ''} ${article.title_en || ''}`);
  if (!latest.some(token => tags.includes(token))) continue;
  const title = language === 'en' ? (article.title_en || article.title) : article.title;
  if (title && !titles.includes(title)) titles.push(title);
  if (titles.length === 4) break;
 }
 return titles;
}
export function selectArticles(articles,message,history=[],limit=4){
 const latest=terms(message);const earlier=terms(history.filter(m=>m.role==='user').map(m=>m.content).join(' '));
 const askedText=`${message} ${history.filter(m=>m.role==='user').map(m=>m.content).join(' ')}`;
 const failure=/يشتغل|مايفتح|لا يفتح|لا يعمل|ما يعمل|يتصل|مقطوع|بطيء|واقف|offline/.test(normalize(message));
 const ranked=articles.filter(a=>a.review_status!=='needs_review').map(a=>{
  if(osClash(a,latest)||contextClash(a,latest)||productClash(a,askedText,message)||symptomClash(a,askedText))return {a,score:0,specific:false};
  const title=terms(`${a.title||''} ${a.title_en||''}`),tags=terms(`${a.keywords||''} ${a.keywords_en||''}`),body=terms(`${a.body||''} ${a.body_en||''}`);
  let score=0,specific=false,breadth=0;
  for(const [items,weight] of [[latest,3],[earlier,1]])for(const t of items){
   const broad=generic.has(t)||['windows','ويندوز','mac','macos','ماك','android','اندرويد','ios'].includes(t);
   const hit=title.some(k=>related(k,t))||tags.some(k=>related(k,t));
   const faultTopic=broad&&failure&&['انترنت','نت','شبكه','بريد','ايميل'].includes(t);
   if(hit&&(!broad||faultTopic)){specific=true;if(weight===3&&!broad&&!productName.has(t))breadth+=1;}
   if(title.some(k=>related(k,t)))score+=(broad?1:5)*weight;
   if(tags.some(k=>k===t||(k.length>3&&t.length>3&&(k.startsWith(t)||t.startsWith(k)))))score+=(broad?1:7)*weight;
   else if(tags.some(k=>related(k,t)))score+=(broad?1:3)*weight;
   if(body.some(k=>related(k,t))&&!broad)score+=weight;
  }
  if(score&&specific&&!a.example)score+=2;
  return {a,score:specific?score:0,specific,breadth};
 }).sort((a,b)=>b.breadth-a.breadth||b.score-a.score||a.a.id-b.a.id);
 const matches=ranked.filter(x=>x.score>0).slice(0,limit);
 const result=matches.map(({a})=>a);
 const previous=[...history].reverse().find(m=>m.role==='assistant'&&m.analysis?.sources?.length)?.analysis.sources[0];
 const previousArticle=articles.find(a=>a.id===previous&&a.review_status!=='needs_review');
 const shortReply=/^(نعم|لا|اي|صح|تمام|yes|no|ايوه)( صح| تمام| بعد)?$/.test(normalize(message));
 const followUp=shortReply||/جرب|محاول|انحل|مستمر|التالي|فهم|اشرح|وضح|ابسط|اقصد|tried|still|remain|next|explain|simpler|actually/.test(normalize(message));
 const strongShift=!followUp&&!!matches[0]&&matches[0].score>=21&&!!previousArticle&&!terms(`${previousArticle.title} ${previousArticle.keywords} ${previousArticle.title_en||''}`).some(t=>latest.includes(t)&&!generic.has(t));
 if(followUp&&previousArticle){
  const changed=/اقصد|الصحيح|مو كذا|ليس كذلك|meant|actually/.test(normalize(message));
  if(!changed)return [previousArticle];
  const fresh=selectArticles(articles,message,[],limit);
  return fresh.length?fresh.slice(0,limit):[previousArticle];
 }
 if(previousArticle&&!strongShift&&!productClash(previousArticle,askedText,message)&&!symptomClash(previousArticle,message)&&!result.some(a=>a.id===previousArticle.id))return [previousArticle,...result].slice(0,limit);
 return result;
}
