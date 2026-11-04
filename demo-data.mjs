import { randomBytes, scryptSync } from 'node:crypto';
import { rmSync } from 'node:fs';
import path from 'node:path';

export const DEMO_PASSWORD = 'AtalDemo2026!';
const PEOPLE = [
  ['admin@atal-demo.test', 'نورة العتيبي', 'admin', 'إدارة الأنظمة'],
  ['support@atal-demo.test', 'خالد الحربي', 'technician', 'الدعم الفني'],
  ['sara@atal-demo.test', 'سارة القحطاني', 'employee', 'المبيعات'],
  ['ahmad@atal-demo.test', 'أحمد الدوسري', 'employee', 'المالية'],
  ['reem@atal-demo.test', 'ريم الغامدي', 'employee', 'العمليات']
];

export function assertDemoPath(target, projectRoot) {
  const demo = path.resolve(projectRoot, 'data', 'demo');
  const resolved = path.resolve(target);
  if (resolved !== demo) {
    const error = new Error('رفض المسار: إعادة وضع العرض تعمل فقط على مجلد data/demo.');
    error.code = 'DEMO_PATH_REFUSED';
    throw error;
  }
  return demo;
}

export function resetDemoFiles(projectRoot) {
  const demo = assertDemoPath(path.join(projectRoot, 'data', 'demo'), projectRoot);
  const primary = path.resolve(projectRoot, 'data', 'atal.db');
  for (const name of ['atal.db', 'atal.db-wal', 'atal.db-shm']) {
    const file = path.resolve(demo, name);
    if (file === primary || !file.startsWith(demo + path.sep)) {
      const error = new Error('رفض المسار: لن تُمس قاعدة البيانات الأساسية.');
      error.code = 'DEMO_PATH_REFUSED';
      throw error;
    }
    rmSync(file, { force: true });
  }
  return demo;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  return { salt, passwordHash };
}

function onDay(daysAgo, hour, minute = 0) {
  const key = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
  return `${key}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
}

export function seedDemo(db) {
  const existingCompany = db.prepare('SELECT value FROM settings WHERE key=?').get('company_name');
  if (!existingCompany) db.prepare('INSERT INTO settings(key,value) VALUES(?,?)').run('company_name', 'شركة الأفق التجريبية');
  for (const [email, name, role, department] of PEOPLE) {
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) continue;
    const { salt, passwordHash } = hashPassword(DEMO_PASSWORD);
    db.prepare('INSERT INTO users(name,email,password,salt,role,department) VALUES(?,?,?,?,?,?)').run(name, email, passwordHash, salt, role, department);
  }
  const idOf = email => db.prepare('SELECT id FROM users WHERE email=?').get(email).id;
  const articleId = title => {
    const row = db.prepare('SELECT id FROM articles WHERE title=?').get(title);
    if (!row) throw new Error(`مقال العرض غير موجود: ${title}`);
    return row.id;
  };
  const sara = idOf('sara@atal-demo.test');
  const ahmad = idOf('ahmad@atal-demo.test');
  const reem = idOf('reem@atal-demo.test');
  const khalid = idOf('support@atal-demo.test');
  const mailArticle = articleId('إرسال البريد والمرفقات');

  const outlookQuestion = {
    category: 'email', explanation: 'قد يتعلق الأمر بالمرفق نفسه أو بصندوق الصادر، وليس بالضرورة بانقطاع البريد كله.',
    questions: ['هل تصل رسالة قصيرة بلا مرفق إلى المستلم؟'], steps: [], requires_it: false,
    title: 'Outlook لا يرسل المرفقات', summary: 'البريد النصي قد يعمل، والمرفقات لا تغادر صندوق الصادر.', sources: [mailArticle]
  };
  const outlookStep = {
    category: 'email', explanation: 'الرسالة بلا مرفق نجحت، لذلك الخطوة التالية هي تسجيل نص الخطأ الظاهر مع المرفق دون تغيير إعدادات الخادم.',
    questions: [], steps: ['جرّب من بريد الويب المعتمد مرفقًا صغيرًا، وسجّل نص الخطأ إن بقي في الصادر.'], requires_it: false,
    title: 'Outlook لا يرسل المرفقات', summary: 'رسالة بلا مرفق انرسلت. المرفقات تعلق في الصادر. لم يُغيّر إعداد الخادم.', sources: [mailArticle]
  };
  const samples = [
    {
      key: 'outlook-attachments', user: sara, assignee: null, status: 'new', category: 'email', impact: 'one', blocked: 0,
      title: 'Outlook لا يرسل المرفقات',
      summary: 'من جهاز المبيعات، رسائل Outlook النصية تصل، وأي مرفق يبقى في صندوق الصادر. لم تُحذف رسائل ولم تُغيّر إعدادات الخادم.',
      tried: 'جربت رسالة قصيرة بلا مرفق وانرسلت. المرفقات ما زالت تعلق في الصادر.',
      created: onDay(1, 9), updated: onDay(1, 9, 40), accepted: null, resolved: null,
      conversation: {
        created: onDay(1, 9),
        analysis: outlookStep,
        messages: [
          { role: 'user', content: 'Outlook ما يرسل المرفقات من جهاز المبيعات. الرسالة النصية تصل.', prepared: true },
          { role: 'assistant', content: JSON.stringify(outlookQuestion), analysis: outlookQuestion, prepared: true },
          { role: 'user', content: 'جربت رسالة قصيرة بلا مرفق وانرسلت، لكن أي مرفق يعلق في الصادر.', prepared: true },
          { role: 'assistant', content: JSON.stringify(outlookStep), analysis: outlookStep, prepared: true }
        ]
      },
      replies: [],
      events: [['created', null, 'new', 'أُنشئت التذكرة من محادثة العرض ولم يستلمها فني.']]
    },
    {
      key: 'printer-offline', user: ahmad, assignee: khalid, status: 'in_progress', category: 'hardware', impact: 'team', blocked: 1,
      title: 'طابعة المالية تظهر Offline',
      summary: 'طابعة قسم المالية تظهر غير متصلة، والطباعة متوقفة منذ الصباح. لم تُفتح الأجزاء الداخلية.',
      tried: 'تحققت من الطاقة ومن اختيار الطابعة الصحيحة. ما زالت تظهر Offline.',
      created: onDay(2, 8), updated: onDay(2, 9), accepted: onDay(2, 8, 30), resolved: null,
      replies: [[khalid, 'استلمت الطلب. لا تفتح الطابعة. أرسل اسم الطابعة الظاهر في Windows ونص الرسالة، وسأراجع قائمة الانتظار من طرف الدعم.']],
      events: [['created', null, 'new', ''], ['accepted', 'new', 'accepted', 'استلم خالد الحربي التذكرة.'], ['started', 'accepted', 'in_progress', 'بدأت المعالجة.']]
    },
    {
      key: 'vpn-home', user: reem, assignee: khalid, status: 'waiting', category: 'network', impact: 'one', blocked: 1,
      title: 'تعذر اتصال VPN من المنزل',
      summary: 'عميل VPN المعتمد لا يتصل من المنزل رغم وجود إنترنت. لم يُثبت عميل آخر ولم تُغلق الحماية.',
      tried: 'تأكدت من الإنترنت واستخدمت عميل VPN المعتمد وحساب العمل.',
      created: onDay(3, 7), updated: onDay(3, 8), accepted: onDay(3, 7, 20), resolved: null,
      replies: [[khalid, 'بانتظار نص الخطأ ووقت آخر محاولة. لا تثبت VPN آخر ولا تعطّل الحماية، ولا ترسل عنوان خادم أو مفاتيح.']],
      events: [['created', null, 'new', ''], ['accepted', 'new', 'accepted', ''], ['started', 'accepted', 'in_progress', ''], ['status', 'in_progress', 'waiting', 'بانتظار معلومات من الموظفة.']]
    },
    {
      key: 'teams-microphone', user: sara, assignee: khalid, status: 'resolved', category: 'software', impact: 'one', blocked: 0,
      title: 'الميكروفون لا يعمل في Teams',
      summary: 'الزملاء لا يسمعون سارة في اجتماع Teams. الكاميرا تعمل. لم تُغيّر سياسة الأمان.',
      tried: 'راجعت الكتم داخل Teams وأغلقت تطبيقًا آخر كان يستخدم الميكروفون.',
      solution: 'تم اختيار ميكروفون سماعة الاجتماع من داخل Teams وإلغاء الكتم. لم تُغيّر صلاحيات الجهاز أو سياسة الشركة.',
      rating: 5, created: onDay(6, 9), updated: onDay(6, 12), accepted: onDay(6, 9, 30), resolved: onDay(6, 15),
      replies: [[khalid, 'جربتِ اختيار جهاز الإدخال من إعدادات الاجتماع نفسها، لا من إعدادات النظام العامة.']],
      events: [['created', null, 'new', ''], ['accepted', 'new', 'accepted', ''], ['started', 'accepted', 'in_progress', ''], ['resolved', 'in_progress', 'resolved', 'سُجّل الحل.']]
    },
    {
      key: 'folder-access', user: ahmad, assignee: khalid, status: 'accepted', category: 'access', impact: 'one', blocked: 0,
      title: 'طلب صلاحية لمجلد عمل',
      summary: 'أحمد يحتاج القراءة من مجلد تقارير المالية المشترك، وتظهر رسالة رفض. لم يستخدم حساب زميل.',
      tried: 'فتحت المجلد من جهاز العمل بحسابي وظهرت رسالة الرفض.',
      note: 'منح الصلاحية ليس من المساعد ولا يتم من هذه الشاشة. يحتاج الإجراء المعتمد وموافقة مالك المجلد.',
      created: onDay(4, 11), updated: onDay(4, 11, 40), accepted: onDay(4, 11, 25), resolved: null,
      replies: [[khalid, 'استلمت الطلب. منح الصلاحية يتطلب الإجراء المعتمد وموافقة مالك المجلد. لا أستطيع فتح الوصول من هنا، وسأحوّل الاسم المطلوب بعد مراجعته.']],
      events: [['created', null, 'new', ''], ['accepted', 'new', 'accepted', 'مستلمة من الدعم بانتظار الإجراء المعتمد.']]
    }
  ];

  const insertTicket = db.prepare(`INSERT INTO tickets(user_id,conversation_id,title,summary,category,priority,status,note,rating,created,updated,resolved_at,assignee_id,accepted_at,impact,blocked,tried_steps,solution,seed_key)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertReply = db.prepare('INSERT INTO ticket_replies(ticket_id,user_id,body,created) VALUES(?,?,?,?)');
  const insertEvent = db.prepare('INSERT INTO ticket_events(ticket_id,user_id,action,from_status,to_status,detail,created) VALUES(?,?,?,?,?,?,?)');
  const priorityOf = (impact, blocked) => impact === 'company' && blocked ? 'urgent' : blocked || impact === 'company' ? 'high' : impact === 'team' ? 'medium' : 'low';

  for (const sample of samples) {
    if (db.prepare('SELECT id FROM tickets WHERE seed_key=?').get(sample.key)) continue;
    let conversationId = null;
    if (sample.conversation && !db.prepare('SELECT id FROM conversations WHERE seed_key=?').get(sample.key)) {
      conversationId = Number(db.prepare('INSERT INTO conversations(user_id,messages,analysis,created,prepared,seed_key) VALUES(?,?,?,?,1,?)')
        .run(sample.user, JSON.stringify(sample.conversation.messages), JSON.stringify(sample.conversation.analysis), sample.conversation.created, sample.key).lastInsertRowid);
    } else if (sample.conversation) conversationId = db.prepare('SELECT id FROM conversations WHERE seed_key=?').get(sample.key).id;
    const ticketId = Number(insertTicket.run(
      sample.user, conversationId, sample.title, sample.summary, sample.category, priorityOf(sample.impact, sample.blocked),
      sample.status, sample.note || '', sample.rating ?? null, sample.created, sample.updated, sample.resolved,
      sample.assignee, sample.accepted, sample.impact, sample.blocked, sample.tried || '', sample.solution || '', sample.key
    ).lastInsertRowid);
    sample.replies.forEach((reply, index) => insertReply.run(ticketId, reply[0], reply[1], sample.updated.replace(/:00\.000Z$/, `:${String(10 + index).padStart(2, '0')}.000Z`)));
    const eventTime = { created: sample.created, accepted: sample.accepted || sample.updated, status: sample.updated, resolved: sample.resolved || sample.updated };
    sample.events.forEach(item => insertEvent.run(ticketId, item[0] === 'created' ? sample.user : khalid, item[0], item[1], item[2], item[3], eventTime[item[0]] || sample.updated));
  }
}
