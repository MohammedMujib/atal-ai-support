// Everyday, non-sensitive work-device explanations. Sensitive changes stay with a technician.
const askOs = { ar: 'عشان أشرحها على جهازك بالضبط: نظامك ويندوز ولا ماك؟', en: 'So I can match the steps to your device: is it Windows or a Mac?' };
export const howTos = {
 ticket: { needsOs: false, category: 'other', sensitive: false,
  ar: 'من صفحة المحادثة اضغط زر «طلب مساعدة فنية». راجع العنوان والوصف، ثم أرسل التذكرة بنفسك. ما أرسلها عنك.',
  en: 'On the chat page, press “Request technical help”. Review the title and description, then send the ticket yourself. I do not send it for you.' },
 language: { needsOs: true, category: 'software', sensitive: false,
  windows: { ar: 'على ويندوز: اضغط مفتاح ويندوز وحرف المسافة معًا للتبديل بين العربية والإنجليزية. إذا ما تغيّرت، اضغط رمز اللغة بجانب الساعة (ع أو EN) واختر اللغة. لا تحذف لغة الشركة.', en: 'On Windows, press the Windows key and the spacebar together to switch between Arabic and English. If it does not change, click the language icon by the clock and choose the language. Do not remove the company language.' },
  mac: { ar: 'على ماك: اضغط Control والمسافة معًا للتبديل. أو اضغط علم اللغة في الشريط الأعلى واختر العربية أو English. لا تحذف لغة الشركة إذا ما تعرف وش بيصير.', en: 'On a Mac, press Control and the spacebar together to switch. Or click the language flag in the top bar and choose Arabic or English. Do not remove the company language if you are unsure.' } },
 screenshot: { needsOs: true, category: 'software', sensitive: false,
  windows: { ar: 'على ويندوز: اضغط مفتاح ويندوز و Shift وحرف S معًا، ثم حدّد الجزء بالماوس. الصورة تننسخ وتقدر تحفظها أو تلصقها في ملف. الشات ما يستقبل صور. لا تصوّر كلمة مرور أو بيانات زملاء.', en: 'On Windows, press Windows, Shift, and S together, then drag over the area. The picture is copied and you can save it or paste it into a file. This chat does not accept pictures. Do not capture a password or a colleague’s data.' },
  mac: { ar: 'على ماك: اضغط Shift و Command و 4، ثم حدّد الجزء. الصورة تنحفظ غالبًا على سطح المكتب. الشاشة كاملة: Shift و Command و 3. لا تصوّر كلمة مرور.', en: 'On a Mac, press Shift, Command, and 4, then select the area. The picture is usually saved to the desktop. For the full screen: Shift, Command, and 3. Do not capture a password.' } },
 recording: { needsOs: true, category: 'software', sensitive: false,
  windows: { ar: 'على ويندوز: اضغط مفتاح ويندوز وحرف G لفتح شريط التسجيل، ثم زر التسجيل. إذا ما ظهر الشريط قل لي. لا تسجّل اجتماعًا فيه بيانات حساسة بدون موافقة.', en: 'On Windows, press the Windows key and G to open the capture bar, then the record button. Tell me if the bar does not appear. Do not record a meeting that shows sensitive data without agreement.' },
  mac: { ar: 'على ماك: اضغط Shift و Command و 5، اختر تسجيل الشاشة، ثم تسجيل. الإيقاف من الزر في الشريط العلوي. لا تسجّل بيانات حساسة بدون موافقة.', en: 'On a Mac, press Shift, Command, and 5, choose record screen, then Record. Stop from the button in the top bar. Do not record sensitive data without agreement.' } },
 cables: { needsOs: false, category: 'hardware', sensitive: false,
  ar: 'فرّق الأسلاك من شكل الطرف، بدون ما تفك الجهاز:\nسلك الكهرباء أكبر ويدخل في الفيش.\nكابل الشاشة HDMI عريض وزواياه مائلة.\nUSB صغير ومستطيل، للوحة المفاتيح أو الفأرة.\nكابل الشبكة أعرض من رأس سلك الهاتف.\nإذا ما دخل الطرف بسهولة، لا تضغطه وقل لي لون الطرف أو الجهاز اللي يطلع منه.',
  en: 'Tell the cables apart by the plug, without opening the device. The power plug is larger and goes to the wall. HDMI for the screen is wide with slanted corners. USB is a small rectangle for a keyboard or mouse. A network cable is wider than a phone plug. If it does not fit easily, do not force it. Tell me the plug color or which device it leaves.' },
 ports: { needsOs: true, category: 'hardware', sensitive: false,
  windows: { ar: 'على ويندوز المنافذ على جانب الجهاز أو خلفه: USB مستطيل صغير للوحة المفاتيح والفأرة، HDMI أعرض للشاشة، مدخل الكهرباء أكبر، ومدخل السماعة دائرة صغيرة. لا تدخل سلكًا بالقوة.', en: 'On a Windows device the ports are on the side or back: a small rectangular USB port for the keyboard and mouse, a wider HDMI port for the screen, a larger power port, and a small round headphone port. Do not force a plug.' },
  mac: { ar: 'على ماك غالبًا المنافذ على الجانب: USB-C أو Thunderbolt فتحة بيضاوية صغيرة للشحن أو الشاشة، وأحيانًا HDMI إذا كانت الشاشة تطلبه عبر محول. لا تدخل سلكًا بالقوة، وإذا ما ثبت استخدم المحول المعتمد من الشركة.', en: 'On a Mac the ports are usually on the side: a small oval USB-C or Thunderbolt port for charging or the display, and sometimes HDMI through an approved adapter. Do not force a plug.' } },
 bluetooth: { needsOs: true, category: 'hardware', sensitive: false,
  windows: { ar: 'على ويندوز: افتح الإعدادات وابحث عن Bluetooth وشغّله. خلّ الماوس أو السماعة في وضع الاقتران، ثم اختر اسمها من القائمة. لا تقترن بسماعة شخصية فيها ملفات عمل.', en: 'On Windows, open Settings, search for Bluetooth, and turn it on. Put the mouse or headset in pairing mode, then choose its name. Do not pair a personal headset that would hold work files.' },
  mac: { ar: 'على ماك: اضغط أيقونة Bluetooth في الشريط الأعلى وشغّله. خلّ الجهاز في وضع الاقتران ثم اختر اسمه. لا تقترن بجهاز شخصي لملفات العمل.', en: 'On a Mac, click the Bluetooth icon in the top bar and turn it on. Put the device in pairing mode, then choose its name. Do not pair a personal device for work files.' } },
 displaymode: { needsOs: true, category: 'hardware', sensitive: false,
  windows: { ar: 'على ويندوز: وصّل كابل الشاشة، ثم اضغط مفتاح ويندوز وحرف P. اختر تكرار إذا تبي نفس الصورة، أو توسيع إذا تبي شاشة ثانية. إذا ما ظهرت الشاشة، تأكد أنك على مدخل HDMI الصحيح في الشاشة نفسها.', en: 'On Windows, connect the display cable, then press the Windows key and P. Choose Duplicate for the same picture or Extend for a second screen. If it stays blank, check that the monitor is on the matching HDMI input.' },
  mac: { ar: 'على ماك: وصّل الكابل أو المحول المعتمد. من قائمة Apple افتح شاشات العرض. إذا الشاشة ما ظهرت، افصل الكابل وأعده بهدوء وتأكد من مدخل الشاشة. لا تثبّت تعريفًا من موقع غير معروف.', en: 'On a Mac, connect the cable or the approved adapter. From the Apple menu open Displays. If the screen does not appear, unplug and reconnect gently and check the monitor input. Do not install a driver from an unknown site.' } },
 format: { needsOs: false, category: 'hardware', sensitive: true,
  ar: 'تهيئة الجهاز أو فرمتته تمسح ملفات العمل وتحتاج الفني. ما أنفّذها من الشات. اضغط «طلب مساعدة فنية»، اكتب أنك تريد تهيئة الجهاز، راجع التذكرة وأرسلها بنفسك. ما أرسلتها.',
  en: 'Formatting the device erases work files and needs a technician. I will not do it from chat. Press “Request technical help”, write that you need the device formatted, review the ticket, and send it yourself. I have not sent it.' }
};
const rules = [
 ['format', /فرمت|فورمات|format|تهيئه الجهاز|اعاده ضبط المصنع|factory reset|امسح الجهاز|وامسح النظام/u],
 ['ticket', /طلب الدعم|اطلب الدعم|ارفع تذكر|فتح تذكر|كيف .{0,20}دعم/u],
 ['language', /لغه|كيبورد عربي|بدل اللغ|تغيير اللغ|تغيير لغة/u],
 ['recording', /تسجيل الشاش|اختصار تسجيل/u],
 ['screenshot', /تصوير الشاش|لقطه|سكرين|screenshot|اختصار تصوير|print screen|برنت سكرين/u],
 ['cables', /اسلاك|الكابلات|افرق بين السلك|افرق بين الاسلاك/u],
 ['ports', /مداخل|منافذ/u],
 ['bluetooth', /بلوتوث|bluetooth/u],
 ['displaymode', /شاشه ثانيه|شاشتين|توصيل الشاش|hdmi/u]
];
export function howtoKind(text) {
 const t = String(text);
 for (const [kind, pattern] of rules) if (pattern.test(t)) return kind;
 if (/^(?:كيف|شلون|ابي|ابغى|ابغي|اريد)(?:\s|$)/u.test(t) && /جهاز|برنامج|نظام|شاش|طابع|كيبورد|ماوس|سلك|منفذ/u.test(t)) return 'general';
 return '';
}
export function planHowto(state, language = 'ar') {
 if (state.topic !== 'howto') return null;
 const spec = howTos[state.facts.howto_kind];
 if (!spec) return null;
 const en = language === 'en';
 if (spec.sensitive) return { reply: en ? spec.en : spec.ar, intent: 'handover', category: spec.category, sources: [], origin: 'sensitive_handover', scope: 'work_it' };
 if (state.facts.howto_kind === 'general') {
  if (!state.facts.os) {
   state.awaiting = { id: 'howto.os', slot: 'os', kind: 'question', success_resolves: false };
   return { reply: en ? askOs.en : askOs.ar, intent: 'clarify', category: 'other', sources: [], origin: 'knowledge_workflow', scope: 'work_it', plan_node: state.awaiting };
  }
  const mac = state.facts.os === 'macos' || state.facts.os === 'ios';
  const reply = mac
   ? (en ? 'On a Mac I can walk you through it. Name the exact thing: keyboard language, a screenshot, a cable, or the app that will not open.' : 'على الماك أقدر أمشيك. حدّد لي بالضبط: لغة الكيبورد، تصوير الشاشة، السلك، أو البرنامج اللي ما يفتح.')
   : (en ? 'On Windows I can walk you through it. Name the exact thing: keyboard language, a screenshot, a cable, or the app that will not open.' : 'على ويندوز أقدر أمشيك. حدّد لي بالضبط: لغة الكيبورد، تصوير الشاشة، السلك، أو البرنامج اللي ما يفتح.');
  return { reply, intent: 'clarify', category: 'software', sources: [], origin: 'knowledge_workflow', scope: 'work_it' };
 }
 if (spec.needsOs && !state.facts.os) {
  state.awaiting = { id: 'howto.os', slot: 'os', kind: 'question', success_resolves: false };
  return { reply: en ? askOs.en : askOs.ar, intent: 'clarify', category: spec.category, sources: [], origin: 'knowledge_workflow', scope: 'work_it', plan_node: state.awaiting };
 }
 const mac = state.facts.os === 'macos' || state.facts.os === 'ios';
 const text = spec.needsOs ? spec[mac ? 'mac' : 'windows'] : spec;
 state.awaiting = { id: 'howto.' + state.facts.howto_kind, slot: 'howto', kind: 'action', success_resolves: true };
 state.proposed.push({ id: state.awaiting.id, text: en ? text.en : text.ar, turn: state.turn });
 return { reply: en ? text.en : text.ar, intent: 'guide', category: spec.category, sources: [], origin: 'knowledge_workflow', scope: 'work_it', plan_node: state.awaiting };
}
