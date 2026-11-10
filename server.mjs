import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { knowledge, selectArticles } from './knowledge.mjs';
import {answerEmployee,installCoreGuides} from './conversation-engine.mjs';
import {redactSecrets} from './chat.mjs';
import {normalizeDialect} from './dialect.mjs';
import {installReviewedGuides} from './reviewed-guides.mjs';
import {completeChat, modelStatus} from './llm.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = process.env.DATA_DIR || path.join(root, 'data');
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(path.join(dir, 'atal.db'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,salt TEXT NOT NULL,role TEXT NOT NULL,department TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS conversations(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),messages TEXT NOT NULL DEFAULT '[]',analysis TEXT,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),conversation_id INTEGER UNIQUE REFERENCES conversations(id),title TEXT NOT NULL,summary TEXT NOT NULL,category TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',note TEXT NOT NULL DEFAULT '',rating INTEGER,created TEXT NOT NULL,updated TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS feedback(conversation_id INTEGER PRIMARY KEY REFERENCES conversations(id),user_id INTEGER REFERENCES users(id),resolved INTEGER NOT NULL,rating INTEGER,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS articles(id INTEGER PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,body TEXT NOT NULL,example INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ticket_replies(id INTEGER PRIMARY KEY,ticket_id INTEGER REFERENCES tickets(id),user_id INTEGER REFERENCES users(id),body TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ticket_events(id INTEGER PRIMARY KEY,ticket_id INTEGER REFERENCES tickets(id),user_id INTEGER,action TEXT NOT NULL,from_status TEXT,to_status TEXT,detail TEXT NOT NULL DEFAULT '',created TEXT NOT NULL);`);
function hasColumn(table, name) { return db.prepare(`PRAGMA table_info(${table})`).all().some(column => column.name === name); }
function addColumn(table, name, ddl) { if (!hasColumn(table, name)) db.exec(ddl); }
addColumn('tickets', 'resolved_at', 'ALTER TABLE tickets ADD COLUMN resolved_at TEXT');
addColumn('tickets', 'assignee_id', 'ALTER TABLE tickets ADD COLUMN assignee_id INTEGER REFERENCES users(id)');
addColumn('tickets', 'accepted_at', 'ALTER TABLE tickets ADD COLUMN accepted_at TEXT');
addColumn('tickets', 'impact', "ALTER TABLE tickets ADD COLUMN impact TEXT NOT NULL DEFAULT ''");
addColumn('tickets', 'blocked', 'ALTER TABLE tickets ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0');
addColumn('tickets', 'tried_steps', "ALTER TABLE tickets ADD COLUMN tried_steps TEXT NOT NULL DEFAULT ''");
addColumn('tickets', 'solution', "ALTER TABLE tickets ADD COLUMN solution TEXT NOT NULL DEFAULT ''");
addColumn('tickets', 'close_reason', "ALTER TABLE tickets ADD COLUMN close_reason TEXT NOT NULL DEFAULT ''");
addColumn('tickets', 'seed_key', 'ALTER TABLE tickets ADD COLUMN seed_key TEXT');
addColumn('articles', 'keywords', "ALTER TABLE articles ADD COLUMN keywords TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'handover', 'ALTER TABLE articles ADD COLUMN handover INTEGER NOT NULL DEFAULT 0');
addColumn('articles', 'title_en', "ALTER TABLE articles ADD COLUMN title_en TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'body_en', "ALTER TABLE articles ADD COLUMN body_en TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'keywords_en', "ALTER TABLE articles ADD COLUMN keywords_en TEXT NOT NULL DEFAULT ''");
addColumn('conversations', 'prepared', 'ALTER TABLE conversations ADD COLUMN prepared INTEGER NOT NULL DEFAULT 0');
addColumn('conversations', 'seed_key', 'ALTER TABLE conversations ADD COLUMN seed_key TEXT');
addColumn('conversations', 'ended', 'ALTER TABLE conversations ADD COLUMN ended INTEGER NOT NULL DEFAULT 0');
addColumn('conversations', 'ended_at', 'ALTER TABLE conversations ADD COLUMN ended_at TEXT');
addColumn('conversations', 'diagnosis', "ALTER TABLE conversations ADD COLUMN diagnosis TEXT NOT NULL DEFAULT ''");
addColumn('feedback', 'skipped', 'ALTER TABLE feedback ADD COLUMN skipped INTEGER NOT NULL DEFAULT 0');
addColumn('articles', 'slug', "ALTER TABLE articles ADD COLUMN slug TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'product', "ALTER TABLE articles ADD COLUMN product TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'os_name', "ALTER TABLE articles ADD COLUMN os_name TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'source_name', "ALTER TABLE articles ADD COLUMN source_name TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'source_url', "ALTER TABLE articles ADD COLUMN source_url TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'reviewed_at', "ALTER TABLE articles ADD COLUMN reviewed_at TEXT NOT NULL DEFAULT ''");
addColumn('articles', 'review_status', "ALTER TABLE articles ADD COLUMN review_status TEXT NOT NULL DEFAULT 'reviewed'");
addColumn('users', 'status', "ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
db.exec(`CREATE TABLE IF NOT EXISTS invitations(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),token_hash TEXT NOT NULL UNIQUE,expires INTEGER NOT NULL,used_at INTEGER,created TEXT NOT NULL);`);
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS tickets_seed_key ON tickets(seed_key) WHERE seed_key IS NOT NULL');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS conversations_seed_key ON conversations(seed_key) WHERE seed_key IS NOT NULL');

const baseArticles = [
  ['البريد لا يرسل', 'Email is not sending', 'email', 'بريد outlook صادر ارسال', 'email outlook outbox send', 'تحقق من اتصال الإنترنت. راجع وجود رسائل عالقة في صندوق الصادر وحجم المرفقات حسب الحد المعتمد في الشركة. جرّب نسخة الويب من البريد. لا تشارك كلمة مرورك أو رمز التحقق. إذا استمرت المشكلة سجّل نص الخطأ ووقت ظهوره واطلب فنيًا.', 'Check the internet connection, the outbox, and the attachment size against the company limit. Try the official web mailbox. Do not share your password or verification code. If it continues, record the error text and time and ask a technician.'],
  ['تعذر الاتصال بالشبكة', 'Cannot connect to the network', 'network', 'شبكة انترنت اتصال', 'network internet connection', 'تحقق من اتصال الجهاز بالشبكة المعتمدة. تحقق هل المشكلة في موقع واحد أم جميع المواقع، وهل يتأثر زملاؤك أيضًا. أعد الاتصال بالشبكة من إعدادات جهازك. لا تعدّل إعدادات الراوتر أو الجدار الناري. صعّد المشكلة لفريق الدعم إذا استمرت.', 'Check that the device is on the approved network, whether one site or all sites fail, and whether colleagues are affected. Reconnect from the device settings. Do not change router or firewall settings. Escalate to support if it continues.'],
  ['مشكلة الدخول والصلاحيات', 'Sign-in and access problem', 'access', 'دخول صلاحية حساب كلمة مرور', 'login access account password', 'تحقق من اسم المستخدم ورسالة الخطأ. هذا الدليل لا يتضمن رابط استعادة خاصًا بالشركة؛ إذا تعذر الدخول اطلب فريق الدعم للتحقق من الهوية. لا تشارك كلمة مرورك أو رمز التحقق. منح الصلاحيات وفتح الحسابات مسؤولية فريق الدعم المخول.', 'Check the username and the error text. This guide has no company-specific reset link; if sign-in fails, ask support to verify identity. Do not share your password or verification code. Granting access is for the authorized support team.'],
  ['بطء برنامج أو تعليقه', 'An application is slow or frozen', 'software', 'برنامج بطيء يتعطل', 'application slow frozen crash', 'احفظ عملك أولًا إن أمكن. أغلق البرنامج وأعد فتحه. سجّل اسم البرنامج ووقت المشكلة ورسالة الخطأ. لا تثبت برامج خارج المصادر المعتمدة ولا تحذف ملفات النظام. إذا تكررت المشكلة اطلب تدخل فني.', 'Save your work if you can, then close and reopen the application. Record its name, the time, and the error. Do not install software from outside approved sources or delete system files. Ask a technician if it repeats.'],
  ['الطابعة والأجهزة', 'Printers and devices', 'hardware', 'طابعة جهاز طباعة', 'printer device hardware', 'تحقق من الطاقة والتوصيل واختر الطابعة الصحيحة. سجّل رسالة الخطأ الظاهرة. لا تفتح الجهاز أو تلمس الأجزاء الداخلية. عند وجود دخان أو حرارة غير معتادة توقف عن استخدام الجهاز وبلّغ الجهة المختصة فورًا.', 'Check power, the connection, and the selected printer. Record the error. Do not open the device or touch internal parts. If there is smoke or unusual heat, stop using it and tell the responsible team immediately.']
];
const upsertArticle = db.prepare('UPDATE articles SET category=?,body=?,keywords=?,handover=?,title_en=?,body_en=?,keywords_en=?,slug=?,product=?,os_name=?,source_name=?,source_url=?,reviewed_at=?,review_status=? WHERE id=?');
const insertArticle = db.prepare('INSERT INTO articles(title,category,body,example,keywords,handover,title_en,body_en,keywords_en,slug,product,os_name,source_name,source_url,reviewed_at,review_status) VALUES(?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?)');
function articleFields(article = {}) {
  return [article.slug || '', article.product || '', article.os || '', article.source_name || '', article.source_url || '', article.reviewed_at || '', article.review_status || 'reviewed'];
}
for (const [title, titleEn, category, keywords, keywordsEn, body, bodyEn] of baseArticles) {
  const existing = db.prepare('SELECT id FROM articles WHERE title=? AND example=1').get(title);
  const fields = articleFields({ reviewed_at: '2026-11-02' });
  if (existing) upsertArticle.run(category, body, keywords, 0, titleEn, bodyEn, keywordsEn, ...fields, existing.id);
  else insertArticle.run(title, category, body, keywords, 0, titleEn, bodyEn, keywordsEn, ...fields);
}
for (const article of knowledge) {
  const existing = db.prepare('SELECT id FROM articles WHERE title=? AND example=1').get(article.title);
  const fields = articleFields(article);
  if (existing) upsertArticle.run(article.category, article.body, article.keywords, article.handover ? 1 : 0, article.title_en, article.body_en, article.keywords_en, ...fields, existing.id);
  else insertArticle.run(article.title, article.category, article.body, article.keywords, article.handover ? 1 : 0, article.title_en, article.body_en, article.keywords_en, ...fields);
}

installCoreGuides(db);
installReviewedGuides(db);
db.exec('CREATE TABLE IF NOT EXISTS chat_request_results(user_id INTEGER NOT NULL REFERENCES users(id),client_id TEXT NOT NULL,response TEXT NOT NULL,PRIMARY KEY(user_id,client_id))');

const categories = ['network', 'email', 'access', 'software', 'hardware', 'other'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['new', 'accepted', 'in_progress', 'waiting', 'resolved', 'closed'];
const roles = ['employee', 'technician', 'admin'];
function chatSchema(articleIds) {
  const sources = articleIds.length
    ? { type: 'array', items: { type: 'integer', enum: articleIds }, maxItems: Math.min(2, articleIds.length) }
    : { type: 'array', items: { type: 'integer' }, maxItems: 0 };
  return { type: 'object', properties: { reply: { type: 'string', maxLength: 700 }, needs_support: { type: 'boolean' }, sources }, required: ['reply', 'needs_support', 'sources'], additionalProperties: false };
}
const copy = {
  ar: { text: 'أدخل نصًا صحيحًا ضمن الحد المسموح.', email: 'البريد الإلكتروني غير صحيح.', password: 'استخدم كلمة مرور من 10 أحرف على الأقل.', setupDone: 'تم إعداد حساب المسؤول مسبقًا.', needAdmin: 'أنشئ حساب المسؤول أولًا.', emailUsed: 'البريد مسجل مسبقًا.', login: 'البريد أو كلمة المرور غير صحيحة.', json: 'صيغة الطلب غير صحيحة.', tooLarge: 'حجم الطلب أكبر من المسموح.', unauthorized: 'سجّل الدخول للمتابعة.', forbidden: 'ليس لديك صلاحية.', adminOnly: 'للمسؤول فقط.', ticketMissing: 'التذكرة غير موجودة.', conversationMissing: 'المحادثة غير موجودة.', conversationEnded: 'انتهت هذه المحادثة. ابدأ محادثة جديدة عند الحاجة.', impact: 'حدد عدد المتأثرين وأثر العطل.', category: 'التصنيف غير صحيح.', status: 'الحالة أو الأولوية غير صحيحة.', rate: 'يمكن تقييم الطلب بعد حله فقط.', rating: 'اختر تقييمًا من 1 إلى 5.', ratingUsed: 'سُجّل تقييم هذه المحادثة من قبل.', ratingClosed: 'يمكن تقييم المحادثة بعد إنهائها ولمرة واحدة.', taken: 'استلم فني آخر هذه التذكرة بالفعل.', acceptState: 'يمكن استلام التذاكر الجديدة غير المسندة فقط.', assignee: 'اختر فني دعم لإعادة الإسناد.', solution: 'اكتب الحل قبل تسجيل أن التذكرة محلولة.', transition: 'لا يمكن نقل التذكرة إلى هذه الحالة من وضعها الحالي.', closeReason: 'اكتب سبب الإغلاق الإداري قبل إغلاق التذكرة.', waitingNeed: 'اكتب ما تحتاجه من الموظف قبل تحويل الحالة إلى بانتظار الموظف.', confirm: 'يمكن تأكيد الحل بعد تسجيله فقط.', reopen: 'يمكن إعادة فتح التذكرة بعد تسجيل الحل.', busy: 'انتظر الرد الحالي قبل إرسال رسالة جديدة.', chatLimit: 'وصلت المحادثة للحد المسموح؛ ابدأ محادثة جديدة.', assistantUnavailable: 'المساعد غير متاح مؤقتًا. يمكنك إعادة المحاولة أو إنشاء طلب دعم مباشر.', modelMissing: 'النموذج غير جاهز.', modelRetry: 'تعذر إكمال الرد.', modelBad: 'الرد غير مكتمل ولم يُحفظ.', modelDown: 'تعذر الوصول إلى النموذج المحلي.', origin: 'مصدر الطلب غير مسموح.', contentType: 'استخدم JSON للطلب.', method: 'غير مسموح.', notFound: 'المسار غير موجود.', page: 'الصفحة غير موجودة.', rateLimit: 'طلبات كثيرة؛ انتظر دقيقة ثم حاول مجددًا.', internal: 'حدث خطأ داخلي. حاول مجددًا.', demoRegister: 'حسابات وضع العرض جاهزة. استخدم بطاقات الدخول أو الحسابات التجريبية.', registrationClosed: 'التسجيل العام متوقف. مسؤول النظام يضيف الحسابات.', roleLocked: 'لا يمكن اختيار الدور أو تغييره من هذا الطلب.', inviteInvalid: 'رابط التفعيل غير صالح.', inviteUsed: 'استُخدمت الدعوة من قبل.', inviteExpired: 'انتهت صلاحية الدعوة. اطلب رابطًا جديدًا من مسؤول النظام.', disabled: 'هذا الحساب معطّل. اطلب من مسؤول النظام إعادة تفعيله.', notActivated: 'الحساب لم يُفعَّل بعد، ولا يمكن تمكين الدخول قبل اختيار كلمة المرور.', lastAdmin: 'لا يمكن تعطيل آخر مسؤول مفعّل.', invitePending: 'هذا البريد مدعو بالفعل. أصدر رابطًا جديدًا من شاشة المستخدمين.' },
  en: { text: 'Enter valid text within the allowed limit.', email: 'The email address is not valid.', password: 'Use a password of at least 10 characters.', setupDone: 'The administrator account is already set up.', needAdmin: 'Create the administrator account first.', emailUsed: 'This email is already registered.', login: 'The email or password is incorrect.', json: 'The request format is not valid.', tooLarge: 'The request is larger than allowed.', unauthorized: 'Sign in to continue.', forbidden: 'You do not have permission.', adminOnly: 'Administrators only.', ticketMissing: 'The ticket was not found.', conversationMissing: 'The conversation was not found.', conversationEnded: 'This conversation has ended. Start a new one when you need to.', impact: 'Choose who is affected and whether work is blocked.', category: 'The category is not valid.', status: 'The status or priority is not valid.', rate: 'You can rate a request only after it is resolved.', rating: 'Choose a rating from 1 to 5.', ratingUsed: 'This conversation already has a rating.', ratingClosed: 'A conversation can be rated once, after it has ended.', taken: 'Another technician has already accepted this ticket.', acceptState: 'Only new, unassigned tickets can be accepted.', assignee: 'Choose a support technician to reassign the ticket.', solution: 'Write the solution before marking the ticket resolved.', transition: 'The ticket cannot move to that status from its current status.', closeReason: 'Write the administrative close reason before closing the ticket.', waitingNeed: 'Write what you need from the employee before setting the status to waiting.', confirm: 'The solution can be confirmed only after it is recorded.', reopen: 'The ticket can be reopened only after a solution is recorded.', busy: 'Wait for the current reply before sending another message.', chatLimit: 'This conversation reached its limit. Start a new one.', assistantUnavailable: 'The assistant is temporarily unavailable. Please try again or create a support request.', modelMissing: 'The model is not ready.', modelRetry: 'The reply could not be completed.', modelBad: 'The reply was incomplete and was not saved.', modelDown: 'The local model could not be reached.', origin: 'The request source is not allowed.', contentType: 'Send the request as JSON.', method: 'Method not allowed.', notFound: 'The route was not found.', page: 'The page was not found.', rateLimit: 'Too many requests. Wait a minute and try again.', internal: 'An internal error occurred. Try again.', demoRegister: 'Demo accounts are already prepared. Use the sign-in cards or the demo accounts.', registrationClosed: 'Open registration is closed. A system administrator adds accounts.', roleLocked: 'The role cannot be chosen or changed from this request.', inviteInvalid: 'This activation link is not valid.', inviteUsed: 'This invitation has already been used.', inviteExpired: 'This invitation has expired. Ask a system administrator for a new link.', disabled: 'This account is disabled. Ask a system administrator to enable it.', notActivated: 'This account is not activated yet. Sign-in stays closed until a password is chosen.', lastAdmin: 'The last active administrator cannot be disabled.', invitePending: 'This email already has an invitation. Issue a new link from the users screen.' }
};
const now = () => new Date().toISOString();
const demoPersonas = { employee: 'sara@atal-demo.test', technician: 'support@atal-demo.test', admin: 'admin@atal-demo.test' };
function langOf(req) { return req.headers['x-atal-lang'] === 'en' ? 'en' : 'ar'; }
function fail(key, status = 400) { throw Object.assign(new Error(key), { status, code: key }); }
function send(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function str(value, max = 4000) { if (typeof value !== 'string' || !value.trim() || value.length > max) fail('text'); return value.trim(); }
function optionalText(value, max = 4000) { if (value == null || value === '') return ''; if (typeof value !== 'string' || value.length > max) fail('text'); return value.trim(); }
function requiredText(value, key, max = 4000) { if (typeof value !== 'string' || !value.trim() || value.length > max) fail(key); return value.trim(); }
async function body(req) { let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 40000) fail('tooLarge', 413); } try { return JSON.parse(raw || '{}'); } catch { fail('json'); } }
const sessionCookie = process.env.DEMO_MODE === '1' ? 'atal_demo_session' : 'atal_company_session';
const sessionToken = req => new RegExp('(?:^|;\\s*)' + sessionCookie + '=([a-f0-9]+)').exec(req.headers.cookie || '')?.[1];
function userOf(req) { const token = sessionToken(req); return token && db.prepare("SELECT u.id,u.name,u.email,u.role,u.department FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.status='active'").get(token, Date.now()); }
function login(res, user) { const account = db.prepare('SELECT status FROM users WHERE id=?').get(user.id); if (!account || account.status !== 'active') fail('disabled', 403); const token = randomBytes(32).toString('hex'); db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now()); db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(token, user.id, Date.now() + 86400000); res.setHeader('Set-Cookie', `${sessionCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`); }
const INVITE_MS = 72 * 60 * 60 * 1000;
function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }
function passwordMatches(account, password) { if (!account?.password || !account.salt || account.password.length !== 128) return false; const actual = Buffer.from(account.password, 'hex'); const expected = scryptSync(password, account.salt, 64); return actual.length === expected.length && timingSafeEqual(actual, expected); }
function issueInvite(userId) { db.prepare('UPDATE invitations SET used_at=? WHERE user_id=? AND used_at IS NULL').run(Date.now(), userId); const token = randomBytes(32).toString('hex'); const expires = Date.now() + INVITE_MS; db.prepare('INSERT INTO invitations(user_id,token_hash,expires,created) VALUES(?,?,?,?)').run(userId, tokenHash(token), expires, now()); return { invitePath: `/?invite=${token}`, expires, emailSent: false, delivery: 'manual' }; }
function publicUser(row) { const pending = db.prepare('SELECT expires FROM invitations WHERE user_id=? AND used_at IS NULL ORDER BY id DESC LIMIT 1').get(row.id); return { id: row.id, name: row.name, email: row.email, department: row.department, role: row.role, status: row.status, inviteExpires: pending?.expires || null }; }
function inviteRow(token) { if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail('inviteInvalid'); const row = db.prepare('SELECT i.id,i.user_id,i.expires,i.used_at,u.name,u.email,u.department,u.role,u.status FROM invitations i JOIN users u ON u.id=i.user_id WHERE i.token_hash=?').get(tokenHash(token)); if (!row) fail('inviteInvalid'); return row; }
function supportRole(user) { return user.role === 'admin' || user.role === 'technician'; }
function companyName() { return db.prepare('SELECT value FROM settings WHERE key=?').get('company_name')?.value?.trim() || ''; }
function ownConversation(id, user) { const conversation = db.prepare('SELECT * FROM conversations WHERE id=? AND user_id=?').get(id, user.id); if (!conversation) fail('conversationMissing', 404); return conversation; }
function conversationState(id) {
  const row = db.prepare('SELECT c.id,c.ended,c.ended_at,f.rating,f.skipped,f.resolved FROM conversations c LEFT JOIN feedback f ON f.conversation_id=c.id WHERE c.id=?').get(id);
  return { id: row.id, ended: !!row.ended, ended_at: row.ended_at || null, rating: Number.isInteger(row.rating) ? row.rating : null, skipped: !!row.skipped, resolved: row.resolved == null ? null : !!row.resolved };
}
function ticketById(id) { const ticket = db.prepare(`SELECT t.*,u.name,u.department,a.name AS assignee_name FROM tickets t JOIN users u ON u.id=t.user_id LEFT JOIN users a ON a.id=t.assignee_id WHERE t.id=?`).get(id); if (!ticket) fail('ticketMissing', 404); return ticket; }
function canSeeTicket(ticket, user) { return user.role === 'admin' || user.role === 'technician' || ticket.user_id === user.id; }
function supportNext(from, to) {
  const allowed = { new: ['closed'], accepted: ['in_progress', 'waiting', 'resolved', 'closed'], in_progress: ['waiting', 'resolved', 'closed'], waiting: ['in_progress', 'resolved', 'closed'], resolved: ['closed'], closed: [] };
  return (allowed[from] || []).includes(to);
}
function event(ticketId, userId, action, fromStatus, toStatus, detail = '') { db.prepare('INSERT INTO ticket_events(ticket_id,user_id,action,from_status,to_status,detail,created) VALUES(?,?,?,?,?,?,?)').run(ticketId, userId || null, action, fromStatus, toStatus, String(detail || '').slice(0, 500), now()); }
const attempts = new Map();
const busy = new Set();
const recentChats = new Map();
function rate(req) { const key = req.socket.remoteAddress; const item = attempts.get(key) || { count: 0, until: Date.now() + 60000 }; if (item.until < Date.now()) { item.count = 0; item.until = Date.now() + 60000; } item.count++; attempts.set(key, item); if (item.count > 15) fail('rateLimit', 429); }
export function validateAnalysis(analysis, articleIds) {
  const hasReply = typeof analysis?.explanation === 'string' && (analysis.explanation.trim() || analysis.questions?.length || analysis.steps?.length);
  if (!analysis || !categories.includes(analysis.category) || typeof analysis.explanation !== 'string' || analysis.explanation.length > 5000 || !hasReply || typeof analysis.requires_it !== 'boolean' || typeof analysis.title !== 'string' || !analysis.title.trim() || analysis.title.length > 200 || typeof analysis.summary !== 'string' || !analysis.summary.trim() || analysis.summary.length > 8000) throw new Error('رد النموذج غير مكتمل');
  for (const [key, max] of [['steps', 5], ['questions', 3]]) if (!Array.isArray(analysis[key]) || analysis[key].length > max || analysis[key].some(item => typeof item !== 'string' || !item.trim() || item.length > 2000)) throw new Error('خطوات النموذج غير صحيحة');
  if (!Array.isArray(analysis.sources) || analysis.sources.some(id => !Number.isInteger(id) || !articleIds.includes(id))) throw new Error('مصادر النموذج غير صحيحة');
  if (analysis.steps.length && !analysis.sources.length) throw new Error('لا توجد مصادر لخطوات الحل');
  return analysis;
}
function fold(value) {
  return String(value || '').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function asksForMethod(value) {
  const text = fold(value);
  if (!text) return false;
  return /يجب ان اتبع|الذي يجب ان اتبع|التي يجب ان اتبع|ماذا افعل انا|ما الذي افعله|كيف اشخص|كيف ابدا|عند تشخيص|ما الخطوه الاولى|الخطوه الاولى التي|خطوه ابدا|اي خطوه تتبع|اي خطوات تتبع|ما الخطوات التي|كيف يمكنني (?!المساعد)|كيف تعرف|من اين تعرف|what is the first step|what step should i|how should i diagnose|how do i diagnose|what should i do|how do i start|how do you know/.test(text);
}
export function unsafeAdvice(value) {
  const text = fold(value);
  if (!text) return false;
  const secret = /(^| )(اكتب|ارسل|ادخل|اعطني) (كلمه المرور|رمز التحقق)|enter your password|send (me )?(the|your) password/.test(text);
  const harm = /(^| )و?(عطل|اوقف|الغ) ?(?:ال)?(حماي|جدار|مضاد)|(^| )و?(احذف|امسح) ?(?:ال)?(بيانات|نظام|ملفات)|(^| )و?(اعد تهيئه|فرمت)|disable (the )?(firewall|antivirus|protection)|delete (all )?(the )?data|reformat the/.test(text);
  return secret || harm;
}
function nearText(left, right) {
  const a = fold(left);
  const b = fold(right);
  if (!a || !b) return false;
  return a === b || (a.length > 12 && b.includes(a)) || (b.length > 12 && a.includes(b));
}
function loadDiagnosis(raw) {
  try { const parsed = JSON.parse(raw || ''); if (parsed && typeof parsed === 'object') return { facts: parsed.facts || [], tried: parsed.tried || [], pending: parsed.pending || '' }; } catch { /* rows written before this field */ }
  return { facts: [], tried: [], pending: '' };
}
function problemTitle(message) {
  const sentence = String(message || '').replace(/[?؟]/g, '').split(/[.!\n]/).map(part => part.trim()).find(Boolean) || '';
  return sentence.slice(0, 80);
}
function rememberTitle(current, userMessage, kind = 'support', language = 'ar') {
  const existing = String(current || '').trim();
  const placeholder = /^(محادثة دعم|support chat)$/.test(existing);
  const fresh = language === 'en' ? 'Support chat' : 'محادثة دعم';
  if (existing && !placeholder && existing.length <= 80 && !asksForMethod(existing)) return existing;
  if (kind !== 'support') return existing && !placeholder ? existing : fresh;
  return problemTitle(userMessage) || (language === 'en' ? 'Technical problem' : 'مشكلة تقنية');
}
function didNotUnderstand(answer) {
  return /لم افهم|ما فهمت|مو فاهم|اشرح|وضح|ابسط|did not understand|do not understand|explain/.test(fold(answer));
}
function correctsFact(answer) {
  return /اقصد|الصحيح|مو كذا|ليس كذلك|غلط|meant|actually/.test(fold(answer));
}
function noteUserTurn(previous, userMessage) {
  const diagnosis = { facts: [...(previous.facts || [])], tried: [...(previous.tried || [])], pending: previous.pending || '' };
  const answer = String(userMessage || '').trim();
  const short = /^(نعم|لا|اي|أيوه|ايوه|تمام|yes|no)\.?$/i.test(answer);
  const confused = didNotUnderstand(answer);
  if (confused && diagnosis.pending) diagnosis.facts.push({ prompt: diagnosis.pending.slice(0, 180), answer: answer.slice(0, 80) });
  else if (short && diagnosis.pending) diagnosis.facts.push({ prompt: diagnosis.pending.slice(0, 180), answer: answer.slice(0, 40) });
  else if (answer) diagnosis.facts.push({ note: answer.slice(0, 180) });
  const failed = !confused && diagnosis.pending && /ما زال|لم تنحل|ما انحل|لم تحل|ما نفع|مستمر|still|remain|لم تعمل/.test(answer);
  if (failed) diagnosis.tried.push({ step: diagnosis.pending.slice(0, 180), result: 'failed' });
  else if (!confused && /جربت|سبق|tried|already/.test(answer)) diagnosis.tried.push({ step: answer.slice(0, 180), result: 'already_tried' });
  diagnosis.facts = diagnosis.facts.slice(-8);
  diagnosis.tried = diagnosis.tried.slice(-6);
  return diagnosis;
}
function withPending(diagnosis, analysis) {
  const pending = analysis.questions?.[0] || analysis.steps?.[0] || analysis.explanation || '';
  return { ...diagnosis, pending: String(pending).slice(0, 240) };
}
function repeatsFailed(diagnosis, analysis) {
  const next = [analysis.explanation, ...(analysis.questions || []), ...(analysis.steps || [])].filter(Boolean).join(' ');
  return (diagnosis.tried || []).some(item => item.result === 'failed' && item.step && (nearText(item.step, next) || sameAction(item.step, next)));
}
function contentWords(text) {
  const generic = /^(تحقق|حاول|شبكه|الشبكه|جهاز|جهازك|انترنت|الانترنت|اعدادات|الاعدادات|اتصال|الاتصال|توصيل|التوصيل|مشكل|مشكله|المشكله|يمكن|يمكنك|يمكنني|موظف|الموظف|خطوه|الخطوه)$/;
  return fold(text).split(' ').filter(word => word.length > 3 && !generic.test(word));
}
function sameAction(left, right) {
  const words = contentWords(left);
  const other = new Set(contentWords(right));
  if (words.length < 2) return false;
  return words.filter(word => other.has(word)).length >= Math.ceil(words.length * 0.6);
}
function caseSummary(diagnosis, title) {
  const facts = (diagnosis.facts || []).map(item => item.prompt ? `${item.prompt} ← ${item.answer}` : item.note).filter(item => item && !nearText(item, title)).slice(-4);
  const tried = (diagnosis.tried || []).map(item => `${item.step} (${item.result})`).slice(-3);
  return [title, ...facts, ...tried].filter(Boolean).join(' · ').slice(0, 500);
}
function modelUserText(message, diagnosis, language) {
  const answer = String(message || '').trim().slice(0, 800);
  const pending = diagnosis?.pending || '';
  if (!pending) return answer;
  if (didNotUnderstand(answer)) return language === 'en' ? `${answer}\nExplain the same action more simply.` : `${answer}\nاشرح الإجراء نفسه ببساطة.`;
  if (/ما نفع|ما زال|مستمر|لم تنحل|still|did not work|tried/.test(fold(answer))) return language === 'en' ? `${answer}\nThat attempt failed. Do not repeat it.` : `${answer}\nهذه المحاولة لم تنفع. لا تكررها.`;
  if (correctsFact(answer)) return language === 'en' ? `${answer}\nThis corrects an earlier fact.` : `${answer}\nهذا تصحيح لمعلومة سابقة.`;
  if (/^(نعم|لا|اي|أيوه|ايوه|تمام|yes|no)\.?$/i.test(answer)) return language === 'en' ? `${answer}\nThis answers your previous reply.` : `${answer}\nهذه إجابة عن ردك السابق.`;
  return answer;
}
export function normalizeModelReply(raw, articleIds, articles = []) {
  const reject = kind => { throw Object.assign(new Error(kind), { kind, status: 502, code: 'assistantUnavailable' }); };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) reject('invalid_json');
  const reply = (typeof raw.reply === 'string' ? raw.reply : typeof raw.explanation === 'string' ? raw.explanation : '').replace(/\s+/g, ' ').trim();
  const needs = typeof raw.needs_support === 'boolean' ? raw.needs_support : raw.requires_it;
  if (typeof needs !== 'boolean' || !reply) reject('missing_fields');
  if (unsafeAdvice(reply) || asksForSecret(reply)) reject('unsafe');
  if (asksForMethod(reply)) reject('role');
  if (!Array.isArray(raw.sources) || raw.sources.some(id => !Number.isInteger(id) || !articleIds.includes(id))) reject('invalid_sources');
  const cited = raw.sources.filter(id => articleIds.includes(id)).slice(0, 2);
  const covered = cited.length ? cited : articles.filter(article => covers(article, reply)).map(article => article.id).slice(0, 2);
  const match = articles.find(article => covered.includes(article.id));
  const category = categories.includes(match?.category) ? match.category : 'other';
  const text = reply.slice(0, 700);
  if (fold(text).replace(/\s/g, '').length < 8) reject('missing_fields');
  return { category, explanation: text, questions: [], steps: [], requires_it: needs, title: text.slice(0, 80), summary: text.slice(0, 500), sources: covered };
}
export function getPriority(impact, blocked) { if (!['one', 'team', 'company'].includes(impact) || typeof blocked !== 'boolean') fail('impact'); return impact === 'company' && blocked ? 'urgent' : blocked || impact === 'company' ? 'high' : impact === 'team' ? 'medium' : 'low'; }
function guideFor(language, articles) {
  return articles.map(article => {
    const english = language === 'en' && article.body_en;
    const body = english ? article.body_en : article.body;
    return { id: article.id, title: english ? (article.title_en || article.title) : article.title, excerpt: guideExcerpt(body) };
  });
}
function arabicHeavy(text) { const arabic = (String(text).match(/[\u0600-\u06FF]/g) || []).length; const latin = (String(text).match(/[A-Za-z]/g) || []).length; return arabic >= 3 && arabic > latin; }
function englishSentence(articles, sources) { const match = articles.find(article => sources.includes(article.id) && article.body_en); return match?.body_en ? firstSentence(match.body_en) : ''; }
function localizeAnalysis(analysis, articles, language) {
  if (language !== 'en') return analysis;
  const fallback = englishSentence(articles, analysis.sources);
  const fix = value => (arabicHeavy(value) && fallback ? fallback : value);
  analysis.explanation = fix(analysis.explanation);
  analysis.summary = fix(analysis.summary);
  if (arabicHeavy(analysis.title) && fallback) analysis.title = fallback.slice(0, 80);
  analysis.steps = analysis.steps.map(step => (arabicHeavy(step) && fallback ? fallback : step));
  analysis.questions = analysis.questions.filter(question => !arabicHeavy(question));
  return analysis;
}
function firstSentence(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const match = clean.match(/^.{12,240}?[.!?؟](?:\s|$)/);
  return (match ? match[0] : clean.slice(0, 240)).trim();
}
function guideExcerpt(text) {
  const first = firstSentence(text);
  const rest = String(text).replace(/\s+/g, ' ').trim().slice(first.length).trim();
  const second = rest ? firstSentence(rest) : '';
  return [first, second].filter(Boolean).join(' ').slice(0, 360);
}
function focusReply(analysis) {
  const blocked = item => item && !asksForMethod(item) && !unsafeAdvice(item);
  analysis.questions = analysis.questions.map(item => item.trim()).filter(blocked).slice(0, 1);
  analysis.steps = analysis.steps.map(firstSentence).filter(blocked).slice(0, 1);
  if (analysis.questions[0] && nearText(analysis.questions[0], analysis.steps[0])) analysis.questions = [];
  if (asksForMethod(analysis.explanation) || unsafeAdvice(analysis.explanation) || analysis.explanation === analysis.questions[0] || analysis.explanation === analysis.steps[0]) analysis.explanation = '';
  return analysis;
}
const diagnostics = [];
const FORMAT_FAILURES = new Set(['truncated', 'invalid_json', 'missing_fields', 'invalid_sources', 'role', 'unsafe', 'loop', 'language', 'simpler', 'repeat']);
function recordDiagnostic(entry) { diagnostics.push(entry); if (diagnostics.length > 40) diagnostics.shift(); }
function modelHistory(history) {
  return history.slice(-8).map(item => {
    if (item.role !== 'assistant') return { role: 'user', content: String(item.content || '').slice(0, 800) };
    const analysis = item.analysis;
    const text = analysis ? [analysis.explanation, ...(analysis.questions || []), ...(analysis.steps || [])].filter(Boolean).join(' ').slice(0, 500) : String(item.content || '').slice(0, 500);
    return { role: 'assistant', content: text };
  });
}
function repairNote(language, kind) {
  if (kind === 'language') return 'Write the reply field in English.';
  if (kind === 'unsafe') return language === 'en'
    ? 'Do not ask for a password or code, and do not suggest disabling protection or deleting data.'
    : 'لا تطلب كلمة مرور أو رمزًا، ولا تقترح تعطيل الحماية أو حذف البيانات.';
  if (kind === 'repeat') return language === 'en'
    ? 'Do not repeat the previous reply. Explain the same action more simply, or give a different action from the excerpt.'
    : 'لا تكرر الرد السابق. اشرح الإجراء نفسه بكلمات أبسط، أو انتقل إلى إجراء مختلف من المقتطف.';
  return language === 'en'
    ? 'Put the action or the one clarifying question in reply. Do not leave it empty and do not send only an article title.'
    : 'اكتب الإجراء أو السؤال المحدد داخل reply. لا تتركه فارغًا ولا ترسل عنوان المقالة فقط.';
}
async function askModel(messages, articleIds, signal) {
  const started = Date.now();
  try {
    const completion = await completeChat(messages, { temperature: 0.2, maxTokens: 420, signal, schema: chatSchema(articleIds) });
    return { content: completion.content, stats: { modelMs: Date.now() - started, ...completion.stats } };
  } catch (error) {
    throw Object.assign(error, { status: error.status || 503, code: 'assistantUnavailable', modelMs: Date.now() - started });
  }
}
function isQuestion(text) {
  const value = String(text || '').trim();
  return /[?؟]/.test(value) || /^(هل|ما |ماذا|أين|اين|متى|من |أي |اي |كم )/.test(value);
}
function repeatsItself(text) {
  const value = fold(text);
  if (value.length < 100) return false;
  for (let index = 0; index + 20 <= value.length; index += 8) {
    const chunk = value.slice(index, index + 20).trim();
    if (chunk.length < 16) continue;
    if (value.split(chunk).length - 1 >= 3) return true;
  }
  return false;
}
function proposesAction(text) {
  return /اعاده الاتصال|اعاده تشغيل|اعد تشغيل|تشغيل الجهاز|تفعيل|اعدادات|restart|reinstall/.test(fold(text));
}
function dismissive(text) {
  return /تكرار السؤال|كرر السؤال|كرر رسالتك|انت في خطا|انت مخطئ|repeat (the|your) question|you are wrong/.test(fold(text));
}
function systemEcho(text) {
  return /يراه الموظف|لم يذكره|المقتطف|اكتب في|هذه التعليمات|الرد السابق|لم يفهم الموظف/.test(fold(text));
}
function isArticleTitle(text, catalog) {
  const folded = fold(text);
  return folded.length > 8 && catalog.some(article => fold(article.title) === folded || fold(article.title_en || '') === folded);
}
function restatesFact(text, facts) {
  return (facts || []).some(item => nearText(text, item.note || item.answer || item.prompt || ''));
}
function asksDenied(question, message) {
  const said = fold(message);
  const ask = fold(question);
  const match = said.match(/(?:^|\s)مو ([^\s]+(?: [^\s]+)?)/);
  if (!match || !ask.includes(match[1])) return false;
  return said.split(' ').some(word => word.length > 3 && !match[1].includes(word) && !ask.includes(word));
}
function covers(article, text) {
  const words = contentWords(text);
  const blob = fold(`${article.title || ''} ${article.title_en || ''} ${article.body || ''} ${article.body_en || ''}`);
  if (words.length < 2 || !blob) return false;
  const hits = words.filter(word => blob.includes(word));
  return hits.length >= 2 && hits.length >= Math.ceil(words.length * 0.5);
}
function groundedClause(article, text) {
  const parts = String(text || '').split(/[،,؛;\n.!?؟]/).map(part => part.trim()).filter(part => part.length >= 12);
  return parts.find(part => covers(article, part)) || '';
}
function asksForSecret(text) {
  return /تذكر كلمه|اكتب كلمه|اكتب الرمز|ارسل كلمه|ارسل الرمز|ما هي كلمه المرور|كلمه المرور الحاليه|كلمه المرور الجديده|رمز التحقق|current password|new password|verification code/.test(fold(text));
}
function inventedVendor(text, articles, recovery = '') {
  const folded = fold(text);
  const named = folded.match(/microsoft|office 365|active directory|مايكروسوفت|اوفس 365|بوابه استعاد|https?:\/\/\S+/g) || [];
  if (!named.length) return false;
  const allowed = fold(`${recovery} ${articles.map(article => `${article.title} ${article.body} ${article.title_en || ''} ${article.body_en || ''}`).join(' ')}`);
  return named.some(name => !allowed.includes(name));
}
function groundReply(analysis, articles, userMessage, language, catalog = [], pending = '', facts = [], kind = 'support', recovery = '') {
  const reject = kind => { throw Object.assign(new Error(kind), { kind, status: 502, code: 'assistantUnavailable' }); };
  const visible = [analysis.explanation, ...(analysis.questions || []), ...(analysis.steps || [])].filter(Boolean);
  if (unsafeAdvice(userMessage)) {
    const text = fold(visible.join(' '));
    if (!/دعم|support/.test(text) || /عطل|اوقف|افتح|disable|delete|احذف/.test(text)) reject('unsafe');
  }
  if (visible.some(asksForSecret)) reject('unsafe');
  if (visible.some(item => /رقم الهاتف|رقم الجوال|phone number/.test(fold(item)))) reject('role');
  if (visible.some(dismissive)) reject('role');
  if (language !== 'en' && visible.some(item => { const latin = (item.match(/[A-Za-z]/g) || []).length; const arabic = (item.match(/[\u0600-\u06FF]/g) || []).length; return latin > 8 && latin > arabic; })) reject('language');
  if (kind === 'support' && String(userMessage || '').trim().length > 12 && visible.some(item => /كيف يمكنني مساعد|ما هي المشكله التي|how can i help|what is the problem/.test(fold(item))) && !analysis.steps.length) reject('role');
  if (kind !== 'support') {
    analysis.steps = [];
    analysis.sources = [];
    const userFold = fold(userMessage);
    const introduced = text => (kind === 'greeting' || kind === 'thanks' || kind === 'vague') && /شبك|بريد|طابع|حساب|برنامج|تطبيق|جهاز|outlook|teams|vpn|windows/.test(fold(text)) && !/شبك|بريد|طابع|حساب|برنامج|تطبيق|جهاز|outlook|teams|vpn|windows/.test(userFold);
    const keepSocial = text => text && !proposesAction(text) && !inventedVendor(text, [], '') && !introduced(text) && !nearText(text, userMessage) ? text : '';
    analysis.explanation = keepSocial(analysis.explanation);
    analysis.questions = analysis.questions.map(keepSocial).filter(Boolean).slice(0, 1);
    if (analysis.questions.length && fold(analysis.explanation).split(' ').filter(Boolean).length < 3) analysis.explanation = '';
    const shown = fold([analysis.explanation, ...analysis.questions].join(' '));
    if (kind === 'outside' && (!/لا استطيع|لا اقدر|خارج|اختصاص|دعم|تقني|cannot|unable|outside|support/.test(shown) || /كان يا ما كان|ذات يوم/.test(shown))) reject('role');
    if (kind === 'unclear' && !/عمل|شركه|مكتب|تستخدم|work|company|used for/.test(shown)) reject('role');
    if (kind === 'vague' && !/مشكل|يحدث|وصف|ماذا|what|happen|describe/.test(shown)) reject('role');
    if (kind === 'secret' && /كلمه المرور|password/.test(shown) && !/لا |لا ت|cannot|do not|لا اطلب/.test(shown)) reject('unsafe');
    if (shown.replace(/\s/g, '').length < 8) reject('missing_fields');
    if ([analysis.explanation, ...analysis.questions].some(repeatsItself)) reject('loop');
    return analysis;
  }
  const keepInstruction = text => {
    if (!text || restatesFact(text, facts) || nearText(text, userMessage) || systemEcho(text) || isArticleTitle(text, catalog)) return '';
    const match = articles.find(article => groundedClause(article, text) || covers(article, text)) || null;
    const cite = article => article && !analysis.sources.includes(article.id) ? analysis.sources = [...analysis.sources, article.id].slice(0, 2) : null;
    if (isQuestion(text)) {
      if (/هل يمكنك|حاول |جرب |اعد |اعاده|افتح |اغلق /.test(fold(text)) && !match) return '';
      cite(match);
      return text;
    }
    if (!match) return '';
    cite(match);
    return groundedClause(match, text) || firstSentence(text);
  };
  analysis.explanation = keepInstruction(analysis.explanation);
  analysis.steps = analysis.steps.map(text => keepInstruction(text)).filter(Boolean).slice(0, 1);
  analysis.questions = analysis.questions.filter(question => {
    if (restatesFact(question, facts) || systemEcho(question) || isArticleTitle(question, catalog) || nearText(question, userMessage) || asksDenied(question, userMessage)) return false;
    if (/هل يمكنك|حاول |جرب |اعد |اعاده|افتح |اغلق /.test(fold(question)) && !articles.some(article => covers(article, question))) return false;
    const words = fold(question).split(' ').filter(word => word.length > 3);
    const user = fold(userMessage);
    return !(words.length >= 3 && words.filter(word => user.includes(word)).length >= Math.ceil(words.length * 0.5));
  });
  if (analysis.steps[0] && analysis.questions[0] && nearText(analysis.questions[0], analysis.steps[0])) analysis.questions = [];
  if (analysis.explanation && analysis.questions[0] && nearText(analysis.explanation, analysis.questions[0])) analysis.explanation = '';
  if (!analysis.questions.length && !analysis.steps.length && isQuestion(analysis.explanation)) {
    analysis.questions = [analysis.explanation];
    analysis.explanation = '';
  }
  if (!articles.length) {
    const known = fold(`${userMessage} خطا رساله شاشه زميل الجميع نظام برنامج شبكه موقع متصل بطء بطيء جهاز متصفح`);
    const invented = [...analysis.questions, analysis.explanation].filter(Boolean).some(text => {
      const extra = fold(text).split(' ').filter(word => word.length > 5 && !known.includes(word));
      return extra.length >= 2;
    });
    if (invented) reject('role');
  }
  if (articles.length) {
    const blob = fold(articles.map(article => `${article.title} ${article.body} ${article.title_en || ''} ${article.body_en || ''}`).join(' '));
    analysis.questions = analysis.questions.filter(question => contentWords(question).filter(word => blob.includes(word)).length >= 2);
    const moved = analysis.questions.find(question => !isQuestion(question) && articles.some(article => covers(article, question)));
    if (moved) {
      analysis.steps = [moved];
      analysis.questions = analysis.questions.filter(question => question !== moved);
      const match = articles.find(article => covers(article, moved));
      if (match && !analysis.sources.includes(match.id)) analysis.sources = [...analysis.sources, match.id].slice(0, 2);
    }
  }
  if (analysis.questions[0] && analysis.explanation.includes(analysis.questions[0])) analysis.explanation = '';
  if (analysis.steps[0] && analysis.explanation && nearText(analysis.explanation, analysis.steps[0])) analysis.explanation = '';
  const ungroundedAction = text => proposesAction(text) && !articles.some(article => covers(article, text));
  analysis.explanation = ungroundedAction(analysis.explanation) ? '' : analysis.explanation;
  analysis.questions = analysis.questions.filter(question => !ungroundedAction(question));
  analysis.steps = analysis.steps.filter(step => !ungroundedAction(step));
  const confused = didNotUnderstand(userMessage);
  const echoes = text => pending && text && (nearText(text, pending) || (!confused && sameAction(text, pending)));
  analysis.explanation = echoes(analysis.explanation) ? '' : analysis.explanation;
  analysis.questions = analysis.questions.filter(question => !echoes(question));
  analysis.steps = analysis.steps.filter(step => !echoes(step));
  if (confused && pending) {
    const visibleText = [analysis.explanation, ...analysis.questions, ...analysis.steps].filter(Boolean).join(' ');
    const pendingWords = contentWords(pending);
    const visibleWords = contentWords(visibleText);
    const shared = pendingWords.filter(word => visibleWords.includes(word));
    const extra = visibleWords.filter(word => !fold(pending).includes(word));
    if (!visibleText || nearText(visibleText, pending) || shared.length < 2 || extra.length > 2) reject('simpler');
  }
  const titled = text => isArticleTitle(text, catalog);
  analysis.explanation = titled(analysis.explanation) ? '' : analysis.explanation;
  analysis.questions = analysis.questions.filter(question => !titled(question));
  analysis.steps = analysis.steps.filter(step => !titled(step));
  const readable = fold([analysis.explanation, ...analysis.questions, ...analysis.steps].join(' ')).replace(/\s/g, '');
  if (readable.length < 8) reject(pending ? 'repeat' : 'missing_fields');
  if ([analysis.explanation, ...analysis.questions, ...analysis.steps].some(item => inventedVendor(item, articles, recovery))) reject('role');
  if ([analysis.explanation, ...analysis.questions, ...analysis.steps].some(repeatsItself)) reject('loop');
  return analysis;
}
function readModelReply(content, articleIds, doneReason, articles, language, recovery = '', userMessage = '') {
  try {
    if (doneReason === 'length') throw Object.assign(new Error('truncated'), { kind: 'truncated', status: 502, code: 'assistantUnavailable' });
    let raw; try { raw = JSON.parse(content); } catch { throw Object.assign(new Error('invalid_json'), { kind: 'invalid_json', status: 502, code: 'assistantUnavailable' }); }
    if (language === 'en' && arabicHeavy(raw.reply || '')) throw Object.assign(new Error('language'), { kind: 'language', status: 502, code: 'assistantUnavailable' });
    const analysis = normalizeModelReply(raw, articleIds, articles);
    const echoedTitle = articles.some(article => { const left = contentWords(analysis.explanation).slice().sort().join(' '); const right = contentWords(article.title).slice().sort().join(' '); return left.length > 4 && left === right; });
    if (isArticleTitle(analysis.explanation, articles) || echoedTitle) throw Object.assign(new Error('missing_fields'), { kind: 'missing_fields', status: 502, code: 'assistantUnavailable' });
    if (repeatsItself(analysis.explanation)) throw Object.assign(new Error('loop'), { kind: 'loop', status: 502, code: 'assistantUnavailable' });
    const explains = didNotUnderstand(userMessage);
    const asksSupport = /اطلب|ابلغ|فريق الدعم|الدعم التقني|ask support|contact support/.test(fold(analysis.explanation));
    if (articles.length && !analysis.sources.length && !explains && !asksSupport) throw Object.assign(new Error('missing_fields'), { kind: 'missing_fields', status: 502, code: 'assistantUnavailable' });
    if (articles.length && /لا يمكنني مساعد|لا استطيع مساعد|لا اقدر اساعد|لا استطيع تقديم/.test(fold(analysis.explanation)) && !/قصيد|شعر|نكت|poem|joke/.test(fold(userMessage))) throw Object.assign(new Error('role'), { kind: 'role', status: 502, code: 'assistantUnavailable' });
    if (['كيبل', 'كابل', 'راوتر', 'توجيه', 'تورنت', 'تلفزيون'].some(word => fold(analysis.explanation).includes(word) && !articles.some(article => fold(`${article.title} ${article.body} ${article.title_en || ''} ${article.body_en || ''}`).includes(word)))) throw Object.assign(new Error('role'), { kind: 'role', status: 502, code: 'assistantUnavailable' });
    if (inventedVendor(analysis.explanation, articles, recovery)) throw Object.assign(new Error('role'), { kind: 'role', status: 502, code: 'assistantUnavailable' });
    if (systemEcho(analysis.explanation)) throw Object.assign(new Error('role'), { kind: 'role', status: 502, code: 'assistantUnavailable' });
    if (/مو ال?واي فاي|ليس ال?واي فاي|not wi ?fi/.test(fold(userMessage)) && /وضع الطيران|الاتصال اللاسلكي|واي فاي/.test(fold(analysis.explanation))) throw Object.assign(new Error('role'), { kind: 'role', status: 502, code: 'assistantUnavailable' });
    if (/قصيد|شعر|نكت|وصفه طبخ|poem|joke/.test(fold(userMessage)) && !/لا استطيع|لا اقدر|دعم|تقني|اختصاص|cannot|support/.test(fold(analysis.explanation))) throw Object.assign(new Error('role'), { kind: 'role', status: 502, code: 'assistantUnavailable' });
    return validateAnalysis(analysis, articleIds);
  } catch (error) {
    if (error.kind) throw error;
    const kind = /مصادر/.test(error.message) ? 'invalid_sources' : 'missing_fields';
    throw Object.assign(error, { kind, status: error.status || 502, code: 'assistantUnavailable' });
  }
}
function diagnosticEntry({ requestId, retrievalMs, modelMs, stats, started, promptMessages, history, articles, failure }) {
  return { id: requestId, at: now(), retrievalMs, modelMs, validateMs: stats.validateMs || 0, totalMs: Date.now() - started, failure, loadMs: stats.loadMs ?? null, promptMs: stats.promptMs ?? null, evalMs: stats.evalMs ?? null, doneReason: stats.doneReason || '', promptChars: promptMessages[0].content.length, historyCount: modelHistory(history).length, sourceCount: articles.length, repaired: stats.repaired || null };
}
function recoverySetting() { return db.prepare('SELECT value FROM settings WHERE key=?').get('account_recovery')?.value?.trim() || ''; }
function promptFor(language, articles, previousReply = '', recovery = '') {
  const company = companyName() || (language === 'en' ? 'the company' : 'الشركة');
  const head = language === 'en'
    ? `Reply in English. You are عُطْل., technical support for employees at ${company}.`
    : `أجب بالعربية. أنت عُطْل.، مساعد الدعم التقني لموظفي ${company}.`;
  const rules = language === 'en'
    ? `Write only what the employee should read in reply. When the facts are enough, give one safe action. When one missing fact would change the action, ask that question. Do not ask where to start or for permission to begin a simple check. Do not ask for a password or code, and do not say you inspected the device. Excerpts are reference: use a matching one and put its id in sources. If none match, leave sources empty and do not invent a link, a setting, or a product.`
    : `اكتب في reply فقط ما يقرأه الموظف. إذا كفت المعلومات فقدم إجراءً آمنًا. إذا نقصت معلومة واحدة تغيّر الإجراء فاسألها. لا تسأل من أين نبدأ ولا تستأذن لبدء فحص بسيط. لا تطلب كلمة مرور أو رمزًا، ولا تقل إنك فحصت الجهاز. المقتطفات مرجع: استخدم ما يطابق وضع رقمه في sources. إذا لم يطابق شيء فاترك sources فارغة ولا تخترع رابطًا أو إعدادًا أو منتجًا.`;
  const earlier = previousReply ? `\n${language === 'en' ? 'Previous reply' : 'الرد السابق'}: ${previousReply.slice(0, 400)}` : '';
  const recoveryLine = recovery ? `\n${language === 'en' ? 'Approved recovery note, use only this' : 'ملاحظة الاستعادة المعتمدة، استخدمها فقط'}: ${recovery.slice(0, 400)}` : '';
  const guide = articles.length ? `\n${language === 'en' ? 'Excerpts' : 'مقتطفات'}:\n${JSON.stringify(guideFor(language, articles))}` : '';
  return `${head}\n${rules}${earlier}${recoveryLine}${guide}`;
}
function ticketDetail(id, user) {
  const ticket = ticketById(id);
  if (!canSeeTicket(ticket, user)) fail('forbidden', 403);
  const replies = db.prepare('SELECT r.id,r.user_id,r.body,r.created,u.name,u.role FROM ticket_replies r JOIN users u ON u.id=r.user_id WHERE r.ticket_id=? ORDER BY r.id').all(id);
  const events = db.prepare('SELECT e.id,e.action,e.from_status,e.to_status,e.detail,e.created,u.name FROM ticket_events e LEFT JOIN users u ON u.id=e.user_id WHERE e.ticket_id=? ORDER BY e.id').all(id);
  let conversation = null;
  if (ticket.conversation_id && (ticket.user_id === user.id || supportRole(user))) {
    const row = db.prepare('SELECT id,messages,analysis,created,prepared FROM conversations WHERE id=?').get(ticket.conversation_id);
    if (row) conversation = { ...row, messages: JSON.parse(row.messages), analysis: row.analysis ? JSON.parse(row.analysis) : null, prepared: !!row.prepared };
  }
  return { ...ticket, blocked: !!ticket.blocked, replies, events, conversation };
}
async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/session') return send(res, 200, { user: userOf(req) || null, needsSetup: !db.prepare('SELECT id FROM users LIMIT 1').get(), qa: process.env.QA_MODE === '1', demo: process.env.DEMO_MODE === '1', companyName: companyName() });
  if (req.method === 'POST' && url.pathname === '/api/demo-login') {
    if (process.env.DEMO_MODE !== '1') fail('notFound', 404);
    rate(req); const payload = await body(req); const email = demoPersonas[payload.role]; if (!email) fail('forbidden', 403);
    const account = db.prepare("SELECT id FROM users WHERE email=? AND status='active'").get(email); if (!account) fail('login', 401);
    login(res, account); return send(res, 200, { ok: true });
  }
  if (req.method === 'GET' && url.pathname === '/api/invite') {
    rate(req); const row = inviteRow(url.searchParams.get('token') || ''); if (row.used_at) fail('inviteUsed', 410); if (row.expires < Date.now()) fail('inviteExpired', 410); if (row.status === 'disabled') fail('disabled', 403);
    return send(res, 200, { name: row.name, email: row.email, department: row.department, role: row.role, expires: row.expires });
  }
  if (req.method === 'POST' && url.pathname === '/api/activate') {
    rate(req); const payload = await body(req); if (payload.role != null) fail('roleLocked'); const row = inviteRow(optionalText(payload.token, 80)); if (row.used_at) fail('inviteUsed', 410); if (row.expires < Date.now()) fail('inviteExpired', 410); if (row.status !== 'invited') fail(row.status === 'disabled' ? 'disabled' : 'inviteUsed', row.status === 'disabled' ? 403 : 410);
    const password = str(payload.password, 128); if (password.length < 10) fail('password'); const salt = randomBytes(16).toString('hex'); const passwordHash = scryptSync(password, salt, 64).toString('hex');
    db.exec('BEGIN IMMEDIATE');
    try {
      const changed = db.prepare("UPDATE users SET password=?,salt=?,status='active' WHERE id=? AND status='invited'").run(passwordHash, salt, row.user_id);
      const consumed = db.prepare('UPDATE invitations SET used_at=? WHERE id=? AND used_at IS NULL').run(Date.now(), row.id);
      if (!changed.changes || !consumed.changes) { db.exec('ROLLBACK'); fail('inviteUsed', 410); }
      db.exec('COMMIT');
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already closed */ } throw error; }
    login(res, { id: row.user_id }); return send(res, 200, { ok: true, role: row.role });
  }
  if (req.method === 'POST' && url.pathname === '/api/register') { rate(req); fail('registrationClosed', 403); }
  if (req.method === 'POST' && ['/api/setup', '/api/login'].includes(url.pathname)) {
    rate(req); const payload = await body(req); const email = str(payload.email, 150).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('email'); const password = str(payload.password, 128); if (password.length < 10) fail('password');
    let account;
    if (url.pathname === '/api/login') {
      account = db.prepare('SELECT * FROM users WHERE email=?').get(email); if (!account || !passwordMatches(account, password)) fail('login', 401); if (account.status === 'disabled') fail('disabled', 403); if (account.status !== 'active') fail('login', 401);
    } else {
      if (db.prepare('SELECT id FROM users LIMIT 1').get()) fail('setupDone', 409);
      const salt = randomBytes(16).toString('hex'); const inserted = db.prepare('INSERT INTO users(name,email,password,salt,role,department,status) VALUES(?,?,?,?,?,?,?)').run(str(payload.name, 80), email, scryptSync(password, salt, 64).toString('hex'), salt, 'admin', str(payload.department || 'عام', 80), 'active'); account = { id: Number(inserted.lastInsertRowid) };
    }
    login(res, account); return send(res, 200, { ok: true, role: db.prepare('SELECT role FROM users WHERE id=?').get(account.id).role });
  }
  const user = userOf(req); if (!user || !roles.includes(user.role)) fail('unauthorized', 401);
  if (req.method === 'POST' && url.pathname === '/api/logout') { const token = sessionToken(req); if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token); res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`); return send(res, 200, { ok: true }); }
  if (req.method === 'GET' && url.pathname === '/api/model') { if (user.role !== 'admin') fail('adminOnly', 403); return send(res, 200, await modelStatus()); }
  if (req.method === 'GET' && url.pathname === '/api/diagnostics') { if (user.role !== 'admin') fail('adminOnly', 403); return send(res, 200, { items: diagnostics }); }
  if (req.method === 'GET' && url.pathname === '/api/settings') { const bodyOut = { companyName: companyName() }; if (user.role === 'admin') bodyOut.accountRecovery = recoverySetting(); return send(res, 200, bodyOut); }
  if (req.method === 'PATCH' && url.pathname === '/api/settings') { if (user.role !== 'admin') fail('adminOnly', 403); const payload = await body(req); const name = str(payload.companyName, 80); db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('company_name', name); if (payload.accountRecovery != null) db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('account_recovery', optionalText(payload.accountRecovery, 500)); const bodyOut = { companyName: name }; if (user.role === 'admin') bodyOut.accountRecovery = recoverySetting(); return send(res, 200, bodyOut); }
  if (req.method === 'GET' && url.pathname === '/api/users') { if (user.role !== 'admin') fail('adminOnly', 403); return send(res, 200, db.prepare('SELECT id,name,email,department,role,status FROM users ORDER BY id').all().map(publicUser)); }
  const userMatch = /^\/api\/users\/(\d+)(?:\/invite)?$/.exec(url.pathname);
  if (req.method === 'POST' && url.pathname === '/api/users') {
    if (user.role !== 'admin') fail('adminOnly', 403); const payload = await body(req); if (!roles.includes(payload.role)) fail('roleLocked'); const email = str(payload.email, 150).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('email'); if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) fail('emailUsed', 409);
    const inserted = db.prepare("INSERT INTO users(name,email,password,salt,role,department,status) VALUES(?,?,?,?,?,?,?)").run(str(payload.name, 80), email, '', '', payload.role, str(payload.department, 80), 'invited');
    const id = Number(inserted.lastInsertRowid); return send(res, 201, { id, status: 'invited', ...issueInvite(id) });
  }
  if (userMatch && req.method === 'POST' && url.pathname.endsWith('/invite')) {
    if (user.role !== 'admin') fail('adminOnly', 403); const account = db.prepare('SELECT * FROM users WHERE id=?').get(Number(userMatch[1])); if (!account) fail('notFound', 404); if (account.status !== 'invited') fail('inviteUsed', 409);
    return send(res, 200, { id: account.id, status: 'invited', ...issueInvite(account.id) });
  }
  if (userMatch && req.method === 'PATCH') {
    if (user.role !== 'admin') fail('adminOnly', 403); const payload = await body(req); if (payload.role != null || payload.email != null || payload.password != null) fail('roleLocked'); const account = db.prepare('SELECT * FROM users WHERE id=?').get(Number(userMatch[1])); if (!account) fail('notFound', 404);
    if (payload.status === 'disabled') {
      if (account.role === 'admin' && account.status === 'active' && db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='admin' AND status='active' AND id!=?").get(account.id).c === 0) fail('lastAdmin');
      db.prepare("UPDATE users SET status='disabled' WHERE id=?").run(account.id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(account.id); return send(res, 200, publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(account.id)));
    }
    if (payload.status === 'active') { if (!account.password) fail('notActivated'); db.prepare("UPDATE users SET status='active' WHERE id=?").run(account.id); return send(res, 200, publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(account.id))); }
    fail('status');
  }
  if (req.method === 'GET' && url.pathname === '/api/articles') return send(res, 200, db.prepare('SELECT * FROM articles ORDER BY id DESC').all());
  if (req.method === 'POST' && url.pathname === '/api/articles') { if (user.role !== 'admin') fail('adminOnly', 403); const payload = await body(req); if (!categories.includes(payload.category)) fail('category'); db.prepare('INSERT INTO articles(title,category,body,example,title_en,body_en) VALUES(?,?,?,0,?,?)').run(str(payload.title, 150), payload.category, str(payload.body, 8000), optionalText(payload.title_en, 150), optionalText(payload.body_en, 8000)); return send(res, 201, { ok: true }); }
  if (req.method === 'GET' && url.pathname === '/api/conversations') return send(res, 200, db.prepare('SELECT c.id,c.messages,c.analysis,c.created,c.prepared,c.ended,c.ended_at,f.rating,f.skipped,(SELECT id FROM tickets WHERE conversation_id=c.id LIMIT 1) AS ticket_id FROM conversations c LEFT JOIN feedback f ON f.conversation_id=c.id WHERE c.user_id=? ORDER BY c.id DESC LIMIT 30').all(user.id).map(conversation => ({ ...conversation, messages: JSON.parse(conversation.messages), analysis: conversation.analysis ? JSON.parse(conversation.analysis) : null, prepared: !!conversation.prepared, ended: !!conversation.ended, skipped: !!conversation.skipped, rating: Number.isInteger(conversation.rating) ? conversation.rating : null, ticket_id: Number.isInteger(conversation.ticket_id) ? conversation.ticket_id : null })));
  if (req.method === 'GET' && url.pathname === '/api/technicians') { if (!supportRole(user)) fail('forbidden', 403); return send(res, 200, db.prepare("SELECT id,name,department FROM users WHERE role='technician' AND status='active' ORDER BY name").all()); }
  if(req.method==='POST'&&url.pathname==='/api/chat'){
    const payload=await body(req),clientId=optionalText(payload.client_id,80);
    const conversation=payload.conversation_id?ownConversation(payload.conversation_id,user):null;
    if(clientId){const cached=db.prepare('SELECT response FROM chat_request_results WHERE user_id=? AND client_id=?').get(user.id,clientId);if(cached)return send(res,200,JSON.parse(cached.response));}
    rate(req);if(conversation?.ended)fail('conversationEnded',409);
    const message=redactSecrets(str(payload.message));
    const language=payload.lang==='en'||langOf(req)==='en'?'en':'ar';
    const lock=user.id+':'+(conversation?.id||'new');if(busy.has(lock))fail('busy',409);
    const history=conversation?JSON.parse(conversation.messages):[];if(history.length>=160)fail('chatLimit');
    const controller=new AbortController();const disconnect=()=>{if(!res.writableEnded)controller.abort();};res.once?.('close',disconnect);
    const started=Date.now(),requestId=randomBytes(6).toString('hex');busy.add(lock);
    try{
      const catalog=db.prepare('SELECT * FROM articles').all();
      const result=await answerEmployee({message,history,catalog,rawState:conversation?.diagnosis,language,signal:controller.signal,
        retrieve:(items,text,log,state)=>{const eligible=items.filter(a=>a.review_status!=='needs_review');const category={network:'network',email:'email',access:'access',printer:'hardware'}[state.topic];return selectArticles(eligible.filter(a=>!category||a.category===category),normalizeDialect([state.problem,state.facts.product||'',text].join(' ')),log,3);}});
      controller.signal.throwIfAborted();
      const analysis=result.analysis;
      const saved=[...history,{id:randomBytes(6).toString('hex'),role:'user',content:message},{id:randomBytes(6).toString('hex'),role:'assistant',content:analysis.reply,analysis}];
      let id=conversation?.id;let bodyOut;
      db.exec('BEGIN IMMEDIATE');try{
        if(id)db.prepare('UPDATE conversations SET messages=?,analysis=?,diagnosis=? WHERE id=?').run(JSON.stringify(saved),JSON.stringify(analysis),JSON.stringify(result.diagnosis),id);
        else id=Number(db.prepare('INSERT INTO conversations(user_id,messages,analysis,created,diagnosis) VALUES(?,?,?,?,?)').run(user.id,JSON.stringify(saved),JSON.stringify(analysis),now(),JSON.stringify(result.diagnosis)).lastInsertRowid);
        bodyOut={conversation_id:id,analysis,messages:saved};
        if(clientId)db.prepare('INSERT INTO chat_request_results VALUES(?,?,?)').run(user.id,clientId,JSON.stringify(bodyOut));
        db.exec('COMMIT');
      }catch(error){db.exec('ROLLBACK');throw error;}
      recordDiagnostic({id:requestId,failure:null,totalMs:Date.now()-started,origin:analysis.origin||'llama',doneReason:analysis.origin==='knowledge_workflow'?'knowledge':'stop'});
      return send(res,200,bodyOut);
    }catch(error){
      if(controller.signal.aborted)return;
      recordDiagnostic({id:requestId,failure:error.kind||error.name||'connection',totalMs:Date.now()-started});
      return send(res,error.status||503,{error:copy[language].assistantUnavailable,code:'assistantUnavailable'});
    }finally{busy.delete(lock);res.removeListener?.('close',disconnect);}
  }
  const endMatch = /^\/api\/conversations\/(\d+)\/end$/.exec(url.pathname);
  if (req.method === 'POST' && endMatch) {
    const conversation = ownConversation(Number(endMatch[1]), user);
    const lock = `${user.id}:${conversation.id}`;
    if (busy.has(lock)) fail('busy', 409);
    busy.add(lock);
    try {
      db.exec('BEGIN IMMEDIATE');
      const current = db.prepare('SELECT ended FROM conversations WHERE id=?').get(conversation.id);
      if (!current.ended) {
        const endedAt = now();
        const changed = db.prepare('UPDATE conversations SET ended=1,ended_at=? WHERE id=? AND ended=0').run(endedAt, conversation.id);
        if (changed.changes) {
          const existing = db.prepare('SELECT conversation_id FROM feedback WHERE conversation_id=?').get(conversation.id);
          if (!existing) db.prepare('INSERT INTO feedback(conversation_id,user_id,resolved,rating,created,skipped) VALUES(?,?,?,?,?,0)').run(conversation.id, user.id, 1, null, endedAt);
        }
      }
      db.exec('COMMIT');
      return send(res, 200, conversationState(conversation.id));
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already closed */ } throw error; }
    finally { busy.delete(lock); }
  }
  if (req.method === 'POST' && url.pathname === '/api/feedback') {
    const payload = await body(req);
    const conversation = ownConversation(payload.conversation_id, user);
    if (!conversation.ended) fail('ratingClosed', 409);
    const existing = db.prepare('SELECT rating,skipped FROM feedback WHERE conversation_id=?').get(conversation.id);
    if (payload.action === 'skip') {
      if (Number.isInteger(existing?.rating)) fail('ratingUsed', 409);
      if (existing?.skipped) return send(res, 200, conversationState(conversation.id));
      if (existing) db.prepare('UPDATE feedback SET skipped=1 WHERE conversation_id=? AND rating IS NULL AND skipped=0').run(conversation.id);
      else db.prepare('INSERT INTO feedback(conversation_id,user_id,resolved,rating,created,skipped) VALUES(?,?,?,?,?,1)').run(conversation.id, user.id, 1, null, now());
      return send(res, 200, conversationState(conversation.id));
    }
    if (![1, 2, 3, 4, 5].includes(payload.rating)) fail('rating');
    if (existing?.skipped || Number.isInteger(existing?.rating)) fail('ratingUsed', 409);
    const saved = existing
      ? db.prepare('UPDATE feedback SET rating=?,skipped=0 WHERE conversation_id=? AND rating IS NULL AND skipped=0').run(payload.rating, conversation.id)
      : db.prepare('INSERT INTO feedback(conversation_id,user_id,resolved,rating,created,skipped) VALUES(?,?,?,?,?,0)').run(conversation.id, user.id, 1, payload.rating, now());
    if (!saved.changes) fail('ratingUsed', 409);
    return send(res, 200, conversationState(conversation.id));
  }
  const ticketMatch = /^\/api\/tickets\/(\d+)(?:\/(accept|replies|assign))?$/.exec(url.pathname);
  if (req.method === 'GET' && url.pathname === '/api/tickets') { const all = supportRole(user); return send(res, 200, db.prepare(`SELECT t.*,u.name,u.department,a.name AS assignee_name FROM tickets t JOIN users u ON u.id=t.user_id LEFT JOIN users a ON a.id=t.assignee_id ${all ? '' : 'WHERE t.user_id=?'} ORDER BY t.id DESC`).all(...(all ? [] : [user.id])).map(ticket => ({ ...ticket, blocked: !!ticket.blocked }))); }
  if (req.method === 'POST' && url.pathname === '/api/tickets') {
    const payload = await body(req); const priority = getPriority(payload.impact, payload.blocked); let analysis; if (payload.conversation_id) { const conversation = ownConversation(payload.conversation_id, user); analysis = JSON.parse(conversation.analysis || 'null'); const existing = db.prepare('SELECT id FROM tickets WHERE conversation_id=?').get(conversation.id); if (existing) return send(res, 200, { id: existing.id }); }
    const title = str(payload.title || analysis?.title, 200); const summary = str(payload.summary || analysis?.summary, 8000); const category = analysis?.category || payload.category || 'other'; if (!categories.includes(category)) fail('category'); const created = now();
    const id = Number(db.prepare('INSERT INTO tickets(user_id,conversation_id,title,summary,category,priority,impact,blocked,tried_steps,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(user.id, payload.conversation_id || null, title, summary, category, priority, payload.impact, payload.blocked ? 1 : 0, optionalText(payload.tried_steps, 4000), created, created).lastInsertRowid);
    event(id, user.id, 'created', null, 'new', ''); return send(res, 201, { id });
  }
  if (ticketMatch && req.method === 'GET' && !ticketMatch[2]) return send(res, 200, ticketDetail(Number(ticketMatch[1]), user));
  if (ticketMatch && req.method === 'POST' && ticketMatch[2] === 'accept') {
    if (!supportRole(user)) fail('forbidden', 403);
    const id = Number(ticketMatch[1]); db.exec('BEGIN IMMEDIATE');
    try {
      const ticket = db.prepare('SELECT * FROM tickets WHERE id=?').get(id); if (!ticket) { db.exec('ROLLBACK'); fail('ticketMissing', 404); }
      if (ticket.assignee_id || ticket.status !== 'new') { db.exec('ROLLBACK'); fail(ticket.assignee_id ? 'taken' : 'acceptState', 409); }
      const accepted = now(); const changed = db.prepare("UPDATE tickets SET assignee_id=?,status='accepted',accepted_at=?,updated=? WHERE id=? AND assignee_id IS NULL AND status='new'").run(user.id, accepted, accepted, id);
      if (!changed.changes) { db.exec('ROLLBACK'); fail('taken', 409); }
      event(id, user.id, 'accepted', 'new', 'accepted', user.name); db.exec('COMMIT');
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already closed */ } throw error; }
    return send(res, 200, ticketDetail(id, user));
  }
  if (ticketMatch && req.method === 'POST' && ticketMatch[2] === 'assign') {
    if (user.role !== 'admin') fail('adminOnly', 403); const id = Number(ticketMatch[1]); const ticket = ticketById(id); const payload = await body(req); const assignee = db.prepare("SELECT id,name FROM users WHERE id=? AND role='technician' AND status='active'").get(Number(payload.assignee_id)); if (!assignee) fail('assignee');
    const next = ticket.status === 'new' ? 'accepted' : ticket.status; const accepted = ticket.accepted_at || now();
    db.prepare('UPDATE tickets SET assignee_id=?,status=?,accepted_at=?,updated=? WHERE id=?').run(assignee.id, next, accepted, now(), id);
    event(id, user.id, 'reassigned', ticket.status, next, assignee.name); return send(res, 200, ticketDetail(id, user));
  }
  if (ticketMatch && req.method === 'POST' && ticketMatch[2] === 'replies') {
    const id = Number(ticketMatch[1]); const ticket = ticketById(id); if (!canSeeTicket(ticket, user)) fail('forbidden', 403); const payload = await body(req); const text = str(payload.body, 4000);
    const recent = db.prepare('SELECT body,created FROM ticket_replies WHERE ticket_id=? AND user_id=? ORDER BY id DESC LIMIT 1').get(id, user.id);
    if (!(recent && recent.body === text && Date.now() - Date.parse(recent.created) < 8000)) {
      db.prepare('INSERT INTO ticket_replies(ticket_id,user_id,body,created) VALUES(?,?,?,?)').run(id, user.id, text, now()); db.prepare('UPDATE tickets SET updated=? WHERE id=?').run(now(), id); event(id, user.id, 'reply', ticket.status, ticket.status, '');
    }
    return send(res, 201, ticketDetail(id, user));
  }
  if (req.method === 'PATCH' && ticketMatch && !ticketMatch[2]) {
    const id = Number(ticketMatch[1]); const ticket = ticketById(id); const payload = await body(req);
    if (user.role === 'employee') {
      if (ticket.user_id !== user.id) fail('forbidden', 403);
      if (payload.action === 'confirm') { if (ticket.status !== 'resolved') fail('confirm', 400); db.prepare("UPDATE tickets SET status='closed',close_reason='',updated=? WHERE id=?").run(now(), id); event(id, user.id, 'confirmed', 'resolved', 'closed', ''); return send(res, 200, { ok: true }); }
      if (payload.action === 'reopen') { if (!['resolved', 'closed'].includes(ticket.status)) fail('reopen', 400); const next = ticket.assignee_id ? 'in_progress' : 'new'; db.prepare('UPDATE tickets SET status=?,resolved_at=NULL,close_reason=?,updated=? WHERE id=?').run(next, '', now(), id); event(id, user.id, 'reopened', ticket.status, next, ''); return send(res, 200, { ok: true }); }
      if (!['resolved', 'closed'].includes(ticket.status) || ![1, 2, 3, 4, 5].includes(payload.rating)) fail('rate', 400);
      db.prepare('UPDATE tickets SET rating=?,updated=? WHERE id=?').run(payload.rating, now(), id); event(id, user.id, 'rated', ticket.status, ticket.status, String(payload.rating)); return send(res, 200, { ok: true });
    }
    if (user.role === 'technician') { if (ticket.assignee_id !== user.id) fail('forbidden', 403); }
    else if (user.role !== 'admin') fail('forbidden', 403);
    if (!statuses.includes(payload.status) || (payload.priority && !priorities.includes(payload.priority))) fail('status');
    const next = payload.status;
    if (next === 'closed' && user.role !== 'admin') fail('adminOnly', 403);
    if (ticket.status === 'closed' || (next !== ticket.status && !supportNext(ticket.status, next))) fail('transition');
    const priority = user.role === 'admin' && priorities.includes(payload.priority) ? payload.priority : ticket.priority;
    let note = ticket.note || '';
    if (payload.note != null) { if (typeof payload.note !== 'string') fail('text'); note = payload.note.slice(0, 4000); }
    let solution = ticket.solution || '';
    if (payload.solution != null) solution = optionalText(payload.solution, 4000);
    if (next === 'resolved' && !solution) fail('solution');
    const requestText = next === 'waiting' && ticket.status !== 'waiting' ? requiredText(payload.request, 'waitingNeed') : '';
    const closeReason = next === 'closed' ? requiredText(payload.closeReason, 'closeReason') : (ticket.close_reason || '');
    const stamp = now();
    const resolvedAt = ['resolved', 'closed'].includes(next) ? ticket.resolved_at || stamp : null;
    db.exec('BEGIN IMMEDIATE');
    try {
      if (requestText) { db.prepare('INSERT INTO ticket_replies(ticket_id,user_id,body,created) VALUES(?,?,?,?)').run(id, user.id, requestText, stamp); event(id, user.id, 'reply', ticket.status, ticket.status, ''); }
      db.prepare('UPDATE tickets SET status=?,priority=?,note=?,solution=?,updated=?,resolved_at=?,close_reason=? WHERE id=?').run(next, priority, note, solution || '', stamp, resolvedAt, closeReason, id);
      if (next !== ticket.status || (next === 'resolved' && solution !== (ticket.solution || ''))) {
        const action = next === 'resolved' ? 'resolved' : next === 'closed' ? 'adminClosed' : next === 'in_progress' && ticket.status === 'accepted' ? 'started' : 'status';
        const detail = next === 'closed' ? closeReason : requestText;
        event(id, user.id, action, ticket.status, next, detail);
      }
      db.exec('COMMIT');
    } catch (error) { try { db.exec('ROLLBACK'); } catch { /* already closed */ } throw error; }
    return send(res, 200, ticketDetail(id, user));
  }
  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    if (user.role !== 'admin') fail('adminOnly', 403);
    const tickets = db.prepare('SELECT * FROM tickets').all(); const feedback = db.prepare('SELECT * FROM feedback').all(); const linked = new Set(tickets.map(ticket => ticket.conversation_id).filter(Boolean)); const ratings = [...tickets.map(ticket => ticket.rating), ...feedback.map(item => item.rating)].filter(rating => Number.isInteger(rating) && rating >= 1 && rating <= 5); const done = tickets.filter(ticket => ['resolved', 'closed'].includes(ticket.status));
    return send(res, 200, { total: tickets.length, open: tickets.length - done.length, selfResolved: feedback.filter(item => item.resolved && !linked.has(item.conversation_id)).length, averageMinutes: done.length ? Math.round(done.reduce((sum, ticket) => sum + (new Date(ticket.resolved_at || ticket.updated) - new Date(ticket.created)) / 60000, 0) / done.length) : null, satisfaction: ratings.length ? Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length / 5 * 100) : null, categories: categories.map(category => ({ category, count: tickets.filter(ticket => ticket.category === category).length })), days: Array.from({ length: 7 }, (_, index) => { const date = new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10); return { date, count: tickets.filter(ticket => ticket.created.startsWith(date)).length }; }) });
  }
  fail('notFound', 404);
}
const server = http.createServer(async (req, res) => {
  const language = langOf(req);
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'same-origin'); res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      if (!['GET', 'HEAD'].includes(req.method)) { const origin = req.headers.origin; if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) fail('origin', 403); if (req.headers['content-type']?.split(';')[0] !== 'application/json') fail('contentType', 415); }
      await api(req, res, url); return;
    }
    if (req.method !== 'GET') fail('method', 405);
    const files = { '/': 'index.html', '/app.js': 'app.js', '/i18n.js': 'i18n.js', '/style.css': 'style.css', '/atal-logo-approved.png': 'atal-logo-approved.png', '/brand-word-light.png': 'brand-word-light.png', '/brand-mark-light.png': 'brand-mark-light.png', '/brand-word-dark.png': 'brand-word-dark.png', '/brand-mark-dark.png': 'brand-mark-dark.png' };
    const file = files[url.pathname]; if (!file) fail('page', 404);
    const type = file.endsWith('.png') ? 'image/png' : file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }); res.end(readFileSync(path.join(root, 'public', file)));
  } catch (error) {
    const message = copy[language][error.code] || copy[language].internal;
    if (!res.headersSent) send(res, error.status || 500, { error: error.status ? message : copy[language].internal, code: error.code || 'internal' }); else res.end();
  }
});
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`ATAL ready: http://localhost:${process.env.PORT || 3000} — local Llama, no paid API`));
export default server;
export { server, db };
