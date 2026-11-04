import { translate } from './i18n.js';

const $ = (selector, el = document) => el.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icons = { chat: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z', grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', ticket: 'M7 3h10l4 4v14H3V3h4 M7 9h10 M7 13h10 M7 17h6', book: 'M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v16', arrow: 'm22 2-7 20-4-9-9-4 20-7ZM22 2 11 13', plus: 'M12 5v14 M5 12h14', spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z', shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z M8 12l3 3 5-6', wifi: 'M2 8a16 16 0 0 1 20 0 M5 12a11 11 0 0 1 14 0 M8 16a6 6 0 0 1 8 0 M12 20h.01', mail: 'M3 5h18v14H3z M3 5l9 8 9-8', key: 'M14 4a6 6 0 1 1-5 9L3 19v3h4v-3h3l3-3 M16 8h.01', clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', check: 'm5 12 4 4L19 6', device: 'M3 3h18v14H3z M8 21h8 M12 17v4', tool: 'M14.7 6.3a5 5 0 0 0-6.4 6.4L2 19l3 3 6.3-6.3a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' };
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.tool}"/></svg>`;
const catIcon = { network: 'wifi', email: 'mail', access: 'key', software: 'grid', hardware: 'device', other: 'tool' };
const catKeys = ['network', 'email', 'access', 'software', 'hardware', 'other'];
const statusKeys = ['new', 'accepted', 'in_progress', 'waiting', 'resolved', 'closed'];
const priorityKeys = ['low', 'medium', 'high', 'urgent'];
const eventKeys = { created: 'eventCreated', accepted: 'eventAccepted', started: 'eventStarted', reassigned: 'eventReassigned', status: 'eventStatus', reply: 'eventReply', resolved: 'eventResolved', reopened: 'eventReopened', confirmed: 'eventConfirmed', adminClosed: 'eventAdminClosed', rated: 'eventRated' };
const statusHelpKey = { new: 'helpNew', accepted: 'helpAccepted', in_progress: 'helpProgress', waiting: 'helpWaiting', resolved: 'helpResolved', closed: 'helpClosed' };
const state = { lang: 'ar', theme: 'system', screen: 'home', user: null, page: 'support', booted: false, model: null, diagnostics: [], articles: [], tickets: [], technicians: [], accounts: [], conversations: [], conversation: null, messages: [], analysis: null, busy: false, ending: false, ended: false, ratingValue: null, skipped: false, endError: '', error: '', draft: '', replyDraft: '', search: '', filter: '', deskFilter: { status: '', category: '', priority: '', assignee: '', q: '' }, deskQueue: '', selected: null, detail: null, dash: null, demo: false, qa: false, company: '', recovery: '', needsSetup: false, inviteNotice: null, inviteToken: '', loadError: '', linkedTicket: null };
let fieldMemory = null;
let toastTimer;
let chatController = null;
let chatEpoch = 0;
const t = (key, vars) => translate(state.lang, key, vars);
const locale = () => state.lang === 'en' ? 'en-GB' : 'ar-SA';
const catName = key => key === 'email' ? t('emailCat') : t(key);
const num = value => Number(value).toLocaleString(locale());
const date = value => { const when = new Date(value); return Number.isNaN(when.getTime()) ? '' : when.toLocaleString(locale(), { calendar: 'gregory', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
function dateStamp(value) {
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return '';
  const day = when.toLocaleDateString(locale(), { calendar: 'gregory', month: 'short', day: 'numeric' });
  const time = when.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  return `<span class="datestamp"><span class="datepart">${esc(day)}</span><span class="timepart" dir="ltr">${esc(time)}</span></span>`;
}
const dayName = value => new Date(`${value}T12:00:00`).toLocaleDateString(locale(), { calendar: 'gregory', weekday: 'short' });
const ticketNo = id => `IT-${String(id).padStart(4, '0')}`;
const supportUser = () => state.user && (state.user.role === 'admin' || state.user.role === 'technician');
const articleText = article => {
  if (state.lang === 'en') return article.title_en && article.body_en ? { title: article.title_en, body: article.body_en, missing: false } : { title: article.title_en || t('englishMissing'), body: '', missing: true };
  return { title: article.title, body: article.body, missing: false };
};
function applyLanguage(lang) {
  state.lang = lang === 'en' ? 'en' : 'ar';
  localStorage.setItem('atal-lang', state.lang);
  document.documentElement.lang = state.lang === 'en' ? 'en' : 'ar';
  document.documentElement.dir = state.lang === 'en' ? 'ltr' : 'rtl';
  document.title = t('pageTitle');
}
function applyTheme(choice, persist = true) {
  state.theme = ['light', 'dark', 'system'].includes(choice) ? choice : 'system';
  if (persist) localStorage.setItem('atal-theme', state.theme);
  const dark = state.theme === 'dark' || (state.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.themeChoice = state.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101816' : '#F6F3EA');
}
function rememberFields() {
  fieldMemory = {};
  document.querySelectorAll('input, textarea, select').forEach(el => {
    const key = el.id || el.name;
    if (!key || el.type === 'file') return;
    fieldMemory[key] = el.value;
    if (el.id === 'message') state.draft = el.value;
  });
}
function recallFields() {
  if (!fieldMemory) return;
  Object.entries(fieldMemory).forEach(([key, value]) => {
    const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
    if (el && 'value' in el) el.value = value;
  });
  syncStatusFields();
}
function bindChrome() {
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.onclick = event => { event.stopPropagation(); if (button.dataset.lang !== state.lang) retint(() => applyLanguage(button.dataset.lang)); };
    button.onkeydown = event => moveSeg(event, button);
  });
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.onclick = event => { event.stopPropagation(); if (button.dataset.themeChoice !== state.theme) retint(() => applyTheme(button.dataset.themeChoice)); };
    button.onkeydown = event => moveSeg(event, button);
  });
}
function moveSeg(event, button) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  const buttons = [...button.parentElement.querySelectorAll('button')];
  const index = buttons.indexOf(button);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
  event.preventDefault();
  buttons[next].focus();
  buttons[next].click();
}
async function retint(change) {
  rememberFields();
  change();
  if (state.user) render();
  else if (state.screen === 'login') auth(state.needsSetup);
  else if (state.screen === 'activate') await activateScreen(state.inviteToken);
  else home();
  recallFields();
  filterKnowledge();
}
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4500); }
async function api(url, method = 'GET', data, options = {}) {
  let r;
  try { r = await fetch(url, { method, signal: options.signal, headers: { 'X-Atal-Lang': state.lang, ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) }); }
  catch (error) { if (error.name === 'AbortError') throw error; throw Error(t('offlineTitle')); }
  let payload; try { payload = await r.json(); } catch { throw Error(t('offlineTitle')); }
  if (!r.ok) { if (r.status === 401 && state.user) { state.user = null; location.reload(); } const failure = Error(payload.error || t('offlineTitle')); failure.diagnostic = payload.diagnostic; throw failure; }
  return payload;
}
function brand(place = 'full') {
  const onDark = place === 'sidebar' || document.documentElement.dataset.theme === 'dark';
  const tone = onDark ? 'dark' : 'light';
  const mark = `<img class="brand-mark" src="/brand-mark-${tone}.png" alt="" width="232" height="190">`;
  const word = `<img class="brand-word" src="/brand-word-${tone}.png" alt="${esc(t('logoAlt'))}" width="429" height="211">`;
  if (place === 'mark') return `<span class="brand is-mark">${mark}</span>`;
  return `<span class="brand is-${place === 'sidebar' ? 'nav' : place}">${word}${mark}</span>`;
}
function badge(value, label) { return `<span class="badge ${esc(value)}">${esc(label)}</span>`; }
function langSwitch() {
  return `<div class="seg" role="group" aria-label="${esc(t('langGroup'))}">${[['ar', 'العربية'], ['en', 'English']].map(([code, label]) => `<button type="button" class="segbtn" data-lang="${code}" aria-pressed="${state.lang === code}">${label}</button>`).join('')}</div>`;
}
function themeSwitch() {
  return `<div class="seg theme" role="radiogroup" aria-label="${esc(t('themeGroup'))}">${[['light', 'themeLight'], ['dark', 'themeDark'], ['system', 'themeSystem']].map(([id, key]) => `<button type="button" class="segbtn" role="radio" data-theme-choice="${id}" aria-checked="${state.theme === id}">${t(key)}</button>`).join('')}</div>`;
}
function chrome() { return `<div class="controls">${langSwitch()}${themeSwitch()}</div>`; }
function demoBanner() { return state.demo ? `<div class="demobanner" role="status">${t('demoBanner')}</div>` : ''; }
function emptyBox(title, help, action = '') { return `<div class="empty"><h2>${esc(title)}</h2><p>${esc(help)}</p>${action}</div>`; }
function nextFor(ticket) {
  if (ticket.status === 'waiting') return t('youReply');
  if (ticket.status === 'resolved') return t('youConfirm');
  if (ticket.status === 'closed') return t('youClosed');
  return t('youWait');
}
function pages() {
  const items = [['support', 'chat']];
  if (state.user.role === 'employee') items.push(['tickets', 'ticket']);
  if (supportUser()) items.push(['desk', 'tool']);
  items.push(['knowledge', 'book']);
  if (state.user.role === 'admin') items.push(['dashboard', 'grid'], ['users', 'users']);
  return items;
}
function home() {
  state.screen = 'home';
  const roles = [['users', 'cardEmployee', 'cardEmployeeBody'], ['tool', 'cardTech', 'cardTechBody'], ['shield', 'cardAdmin', 'cardAdminBody']];
  const steps = ['journey1', 'journey2', 'journey3'];
  const demo = state.demo ? `<section class="demoblock"><h2>${t('tryRoles')}</h2><p class="small muted">${t('demoCardsNote')}</p><div class="democards">${[['employee', 'demoEmployee', 'demoAs'], ['technician', 'demoTechnician', 'demoTechAs'], ['admin', 'demoAdmin', 'demoAdminAs']].map(([role, label, name]) => `<button type="button" data-demo="${role}"><b>${t(label)}</b><span>${esc(t(name))}</span></button>`).join('')}</div><p class="small muted" dir="ltr">${esc(t('demoPassword'))}: AtalDemo2026!</p></section>` : '';
  $('#app').innerHTML = `${demoBanner()}<div class="home"><header class="homebar">${brand('full')}<div class="controls">${chrome()}<button class="btn" type="button" data-go="login">${t('signInCta')}</button></div></header><section class="hero"><h1>${t('authHero')}</h1><p>${t('homeLead')}</p><button class="btn" type="button" data-go="login">${t('signInCta')}</button></section><section class="cards">${roles.map(([glyph, title, body]) => `<article class="card"><div class="boticon">${icon(glyph)}</div><h2>${t(title)}</h2><p>${t(body)}</p></article>`).join('')}</section><h2 class="sectiontitle">${t('journeyTitle')}</h2><section class="journey">${steps.map((key, index) => `<article class="step"><span class="num">${num(index + 1)}</span><h3>${t(key)}</h3></article>`).join('')}</section>${demo}</div>`;
  bindChrome();
  document.querySelectorAll('[data-go="login"]').forEach(button => button.onclick = () => auth(state.needsSetup));
  document.querySelectorAll('[data-demo]').forEach(button => button.onclick = async () => { button.disabled = true; try { await api('/api/demo-login', 'POST', { role: button.dataset.demo }); await boot(); } catch (error) { toast(error.message); button.disabled = false; } });
}
function auth(setup = false) {
  state.screen = 'login';
  $('#app').innerHTML = `${demoBanner()}<div class="gate"><div class="gatecard"><div class="authbar">${brand('nav')}${chrome()}</div><h1>${setup ? t('setupTitle') : t('loginTitle')}</h1><p class="muted small">${setup ? t('setupHelp') : t('loginHelp')}</p><form id="authform">${setup ? `<label for="name">${t('name')}</label><input id="name" name="name" autocomplete="name" required maxlength="80"><label for="department">${t('department')}</label><input id="department" name="department" required maxlength="80" placeholder="${esc(t('departmentPh'))}">` : ''}<label for="email">${t('email')}</label><input id="email" name="email" type="email" autocomplete="username" dir="ltr" required maxlength="150" placeholder="you@company.com"><label for="password">${t('password')}</label><input id="password" name="password" type="password" autocomplete="${setup ? 'new-password' : 'current-password'}" minlength="10" maxlength="128" required placeholder="${esc(t('passwordPh'))}"><div id="autherror" class="formerror" role="alert"></div><button class="btn" type="submit">${setup ? t('createWorkspace') : t('signIn')}</button></form><p class="pagefoot">${t('localFoot')}</p><button class="btn ghost" type="button" data-go="home">${t('backHome')}</button></div></div>`;
  bindChrome();
  document.querySelector('[data-go="home"]').onclick = () => home();
  $('#authform').onsubmit = async event => { event.preventDefault(); const button = $('button[type=submit]', event.target); button.disabled = true; $('#autherror').textContent = ''; try { await api(setup ? '/api/setup' : '/api/login', 'POST', Object.fromEntries(new FormData(event.target))); history.replaceState(null, '', '/'); await boot(); } catch (error) { $('#autherror').textContent = error.message; button.disabled = false; } };
}
async function activateScreen(token) {
  state.screen = 'activate'; state.inviteToken = token;
  let preview = null; let previewError = '';
  try { preview = await api(`/api/invite?token=${encodeURIComponent(token)}`); } catch (error) { previewError = error.message; }
  $('#app').innerHTML = `${demoBanner()}<div class="gate"><div class="gatecard"><div class="authbar">${brand('nav')}${chrome()}</div><h1>${t('activateTitle')}</h1><p class="muted small">${t('activateHelp')}</p>${preview ? `<div class="notes"><b>${esc(preview.name)}</b><div dir="ltr">${esc(preview.email)}</div><div>${esc(preview.department)} · ${esc(t(preview.role === 'admin' ? 'roleAdmin' : preview.role === 'technician' ? 'roleTechnician' : 'roleEmployee'))}</div></div><form id="activateform"><label for="password">${t('choosePassword')}</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required placeholder="${esc(t('passwordPh'))}"><label for="confirm">${t('confirmPassword')}</label><input id="confirm" name="confirm" type="password" autocomplete="new-password" minlength="10" maxlength="128" required><div id="autherror" class="formerror" role="alert"></div><button class="btn" type="submit">${t('activateAction')}</button></form>` : `<div id="autherror" class="formerror" role="alert">${esc(previewError)}</div><p><button class="btn ghost" type="button" data-go="home">${t('backHome')}</button></p>`}<p class="pagefoot">${t('localFoot')}</p></div></div>`;
  bindChrome();
  document.querySelector('[data-go="home"]')?.addEventListener('click', () => { history.replaceState(null, '', '/'); home(); });
  $('#activateform')?.addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const button = $('button[type=submit]', event.target); if (data.password !== data.confirm) { $('#autherror').textContent = t('passwordMismatch'); return; } button.disabled = true; $('#autherror').textContent = ''; try { await api('/api/activate', 'POST', { token, password: data.password }); history.replaceState(null, '', '/'); await boot(); } catch (error) { $('#autherror').textContent = error.message; button.disabled = false; } });
}
async function refresh() {
  try {
    const requests = [api('/api/articles'), api('/api/tickets'), api('/api/conversations')];
    if (supportUser()) requests.push(api('/api/technicians'));
    const [articles, tickets, conversations, technicians] = await Promise.all(requests);
    state.articles = articles; state.tickets = tickets; state.conversations = conversations; state.technicians = technicians || []; state.model = null; state.diagnostics = [];
    if (state.user.role === 'admin') { try { state.model = await api('/api/model'); state.diagnostics = (await api('/api/diagnostics')).items || []; } catch { state.model = null; } state.dash = await api('/api/dashboard'); state.accounts = await api('/api/users'); const settings = await api('/api/settings'); state.company = settings.companyName || state.company; state.recovery = settings.accountRecovery || ''; }
    if (state.selected) { try { state.detail = await api(`/api/tickets/${state.selected}`); } catch { state.selected = null; state.detail = null; } }
    state.loadError = '';
  } catch (error) {
    state.loadError = error.message || t('loadFailed');
    throw error;
  }
}
async function boot() {
  try {
    const session = await api('/api/session');
    state.user = session.user; state.qa = session.qa; state.demo = session.demo; state.company = session.companyName || ''; state.needsSetup = session.needsSetup;
    if (!state.user) { const invite = new URLSearchParams(location.search).get('invite'); if (invite) return activateScreen(invite); if (new URLSearchParams(location.search).get('login') === '1') return auth(session.needsSetup); return home(); }
    state.screen = 'app';
    if (!state.booted) { state.page = supportUser() ? 'desk' : 'support'; state.booted = true; }
    await refresh(); render();
  } catch (error) {
    $('#app').innerHTML = `${demoBanner()}${emptyBox(t('loadFailed'), error.message || t('loadFailedHelp'), `<button class="btn" id="reload">${t('retryLoad')}</button>`)}`;
    $('#reload').onclick = boot;
  }
}
function render() {
  if (!pages().some(([key]) => key === state.page)) state.page = pages()[0][0];
  const role = state.user.role === 'admin' ? t('roleAdmin') : state.user.role === 'technician' ? t('roleTechnician') : t('roleEmployee');
  $('#app').innerHTML = `${demoBanner()}<div class="shell"><aside class="sidebar"><div class="brandwrap">${brand('sidebar')}</div>${state.company ? `<div class="small companyname">${esc(state.company)}</div>` : ''}<p class="sidecaption">${t('sideCaption')}</p><nav class="nav" aria-label="${esc(t('navLabel'))}">${pages().map(([key, glyph]) => `<button data-page="${key}" class="${state.page === key ? 'active' : ''}" ${state.page === key ? 'aria-current="page"' : ''}>${icon(glyph)}${t(key)}</button>`).join('')}</nav><div class="sidebottom"><div class="localtag">${t('localTag')}<br>${t('localTag2')}</div><div class="userbox"><div class="avatar">${esc(state.user.name.slice(0, 1))}</div><div><div class="small">${esc(state.user.name)}</div><div class="small">${role}${state.user.role === 'employee' ? ` · ${esc(state.user.department)}` : ''}</div></div><button class="logout" id="logout">${t('logout')}</button></div></div></aside><main class="main"><header class="topbar"><div><span class="mobilebrand">${brand('mark')}</span><div class="crumb">${t(state.page)}</div></div><div class="topinfo">${chrome()}<span class="when">${new Date().toLocaleDateString(locale(), { calendar: 'gregory', weekday: 'long', day: 'numeric', month: 'long' })}</span></div></header><div id="content">${page()}</div><footer class="pagefoot">${t('footer', { year: String(new Date().getFullYear()) })}</footer></main></div>`;
  bind();
}
function page() { if (state.page === 'support') return support(); if (state.page === 'tickets') return ticketsPage(); if (state.page === 'desk') return desk(); if (state.page === 'knowledge') return knowledge(); if (state.page === 'users') return usersPage(); return dashboard(); }
function roleName(role) { return t(role === 'admin' ? 'roleAdmin' : role === 'technician' ? 'roleTechnician' : 'roleEmployee'); }
function statusName(status) { return t(status === 'invited' ? 'statusInvited' : status === 'disabled' ? 'statusDisabled' : 'statusActive'); }
function usersPage() {
  if (state.user.role !== 'admin') return `<div class="empty">${t('forbiddenPage')}</div>`;
  const notice = state.inviteNotice ? `<section class="panel invitebox" role="status"><h3>${t('inviteIssued')}</h3><p>${esc(state.inviteNotice.name)} · <span dir="ltr">${esc(state.inviteNotice.email)}</span></p><p class="small">${t('noMail')}</p><label for="invitelink">${t('inviteLink')}</label><input id="invitelink" dir="ltr" readonly value="${esc(state.inviteNotice.url)}"><button class="btn secondary" id="copylink" type="button">${t('copyLink')}</button><p class="small muted">${t('mailFuture')} ${t('inviteUntil', { when: date(state.inviteNotice.expires) })}</p></section>` : '';
  const rows = state.accounts.map(account => `<tr><td>${esc(account.name)}</td><td dir="ltr">${esc(account.email)}</td><td>${esc(account.department)}</td><td>${esc(roleName(account.role))}</td><td>${badge(account.status, statusName(account.status))}${account.status === 'invited' && account.inviteExpires && account.inviteExpires < Date.now() ? `<div class="small muted">${t('linkExpired')}</div>` : ''}</td><td>${account.status === 'active' && account.id !== state.user.id ? `<button class="btn secondary" type="button" data-disable="${account.id}">${t('disableUser')}</button>` : ''}${account.status === 'disabled' ? `<button class="btn secondary" type="button" data-enable="${account.id}">${t('enableUser')}</button>` : ''}${account.status === 'invited' ? `<button class="btn secondary" type="button" data-reinvite="${account.id}">${t('newInvite')}</button>` : ''}</td></tr>`).join('');
  return `${heading(t('usersTitle'), t('usersSub'))}${notice}<form id="userform" class="panel detailbody"><h3>${t('addUser')}</h3><p class="small muted">${t('usersHelp')}</p><div class="formrow"><div><label for="username">${t('name')}</label><input id="username" name="name" required maxlength="80"></div><div><label for="userdepartment">${t('department')}</label><input id="userdepartment" name="department" required maxlength="80"></div></div><div class="formrow"><div><label for="useremail">${t('workEmail')}</label><input id="useremail" name="email" type="email" dir="ltr" required maxlength="150" placeholder="name@company.com"></div><div><label for="userrole">${t('roleField')}</label><select id="userrole" name="role"><option value="employee">${t('roleEmployee')}</option><option value="technician">${t('roleTechnician')}</option><option value="admin">${t('roleAdmin')}</option></select></div></div><button class="btn" type="submit">${t('addUser')}</button></form><div class="tablewrap"><table><thead><tr><th>${t('name')}</th><th>${t('workEmail')}</th><th>${t('department')}</th><th>${t('roleField')}</th><th>${t('accountStatus')}</th><th>${t('accessAction')}</th></tr></thead><tbody>${rows || `<tr><td colspan="6">${t('noUsers')}</td></tr>`}</tbody></table></div>`;
}
function heading(title, subtitle, action = '', eyebrow = t('supportEyebrow')) { return `<div class="heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`; }
function support() {
  if (state.loadError) return emptyBox(t('loadFailed'), state.loadError, `<button class="btn" id="retryload">${t('retryLoad')}</button>`);
  const mine = state.tickets.filter(ticket => ticket.user_id === state.user.id);
  return `${heading(t('supportTitle'), t('supportSub'), `<button class="btn secondary" id="newchat">${icon('plus')}${t('newChat')}</button>`)}<div class="startrow"><button class="btn" id="focuschat" type="button">${icon('chat')}${t('newChat')}</button><button class="btn secondary" id="directticket" type="button">${icon('plus')}${t('directTicket')}</button></div><div class="supportgrid"><section class="panel chatpanel" aria-label="${esc(t('chatLabel'))}"><div class="panelhead"><div class="boticon">${icon('spark')}</div><div><h3>${t('assistant')}</h3><div class="small muted">${t('assistantSub')}</div></div><span class="pill">${t('internal')}</span></div><div class="messages" id="messages" role="log" aria-live="polite">${state.messages.length ? state.messages.map(messageHTML).join('') : state.busy || state.pending ? '' : welcome()}${state.pending ? `<div class="message user">${esc(state.pending)}</div>` : ''}${state.busy ? `<div class="loading" role="status"><span class="spinner"></span><span>${t('waitingReply')}</span><button type="button" class="btn secondary" id="cancelchat">${t('cancelWait')}</button></div>` : ''}${state.error ? `<div class="errorbox" role="alert">${esc(state.error)}<div class="actions"><button class="btn secondary" id="retrychat">${t('retry')}</button><button class="btn secondary" id="errorticket">${t('directFromError')}</button></div></div>` : ''}</div>${composer()}</section><aside class="aside"><div class="panel"><div class="minihead"><h3>${t('recent')}</h3><button class="textlink" data-page="${state.user.role === 'employee' ? 'tickets' : 'desk'}">${t('viewAll')}</button></div>${mine.slice(0, 3).map(ticket => `<div class="ticketmini"><div class="minihead" style="margin:0"><span class="ticketid">${ticketNo(ticket.id)}</span>${badge(ticket.status, t(ticket.status))}</div><p class="tickettitle">${esc(ticket.title)}</p><p class="small muted">${nextFor(ticket)}</p>${dateStamp(ticket.updated || ticket.created)}</div>`).join('') || `<div class="empty"><p>${t('emptyAll')}</p><p>${t('emptyAllHelp')}</p></div>`}</div><div class="panel tip"><h3>${t('tipTitle')}</h3><p>${t('tipBody')}</p></div>${state.conversations.length ? `<div class="panel"><h3>${t('history')}</h3>${state.conversations.slice(0, 5).map(conversation => { const title = conversation.analysis?.title || t('historyItem'); return `<button class="historyitem" data-conversation="${conversation.id}" title="${esc(title)}">${conversation.prepared ? `<span class="prepared">${t('prepared')}</span>` : ''}${conversation.ended ? `<span class="prepared">${t('endedMark')}</span>` : ''}<span class="historytitle">${esc(title)}</span><div class="small muted">${dateStamp(conversation.created)}</div></button>`; }).join('')}</div>` : ''}</aside></div>`;
}
function composer() {
  if (state.ended) return `<div class="composer endedbox" role="status"><p>${t('endedOk')}</p><button class="btn" type="button" id="startnew">${t('startNew')}</button></div>`;
  return `<div class="composer">${chatTools()}<form id="chatform"><div class="composerbox"><label class="sr" for="message">${t('messageLabel')}</label><textarea id="message" maxlength="4000" placeholder="${esc(t('messagePh'))}" ${state.busy ? 'disabled' : ''}>${esc(state.draft)}</textarea><button class="send" aria-label="${esc(t('send'))}" type="submit" ${state.busy ? 'disabled' : ''}>${icon('arrow')}</button></div><p class="disclaimer">${t('disclaimer')}</p></form></div>`;
}
function chatTools() {
  if (!state.messages.some(message => message.role === 'assistant' && (message.analysis?.case_state ? !!(message.analysis.case_state.topic || message.analysis.case_state.problem && (['guide','handover'].includes(message.analysis.intent) || message.analysis.category !== 'other')) : message.analysis?.category && message.analysis.category !== 'other'))) return '';
  const chips = state.analysis?.intent === 'resolved' ? '' : `<div class="chips"><button type="button" class="chip" data-fill="${esc(t('simplerFill'))}">${t('simpler')}</button><button type="button" class="chip" data-fill="${esc(t('followup'))}">${t('tried')}</button></div>`;
  const linked = state.linkedTicket ? `<p class="small ticketlink">${t('ticketOpen', { id: ticketNo(state.linkedTicket) })} <button type="button" class="textlink" id="openticket">${t('followTicket')}</button></p>` : '';
  return `${linked}${chips}<div class="chattools"><button type="button" class="btn secondary" id="endchat" ${state.ending ? 'disabled' : ''}>${icon('check')}${t('solved')}</button><button type="button" class="btn secondary" id="escalate">${icon('tool')}${t('needTech')}</button></div>${state.endError ? `<p class="errorbox" role="alert">${esc(state.endError)} <button class="btn secondary" type="button" id="retryend">${t('retry')}</button></p>` : ''}`;
}
function welcome() { return `<div class="welcome"><h2>${t('welcomeTitle')}</h2><p>${t('welcomeBody')}</p><div class="suggestions">${[['email', 'suggestEmail', 'suggestEmailFill'], ['network', 'suggestNet', 'suggestNetFill'], ['access', 'suggestAccess', 'suggestAccessFill'], ['hardware', 'suggestPrinter', 'suggestPrinterFill']].map(([key, label, fill]) => `<button type="button" data-suggest="${esc(t(fill))}"><span class="suggesticon">${icon(catIcon[key])}</span><span class="suggesttext">${t(label)}</span></button>`).join('')}</div></div>`; }
function messageHTML(message, index) {
  if (message.role === 'user') return `<div class="message user">${esc(message.content)}</div>`;
  const analysis = message.analysis; if (!analysis) return '';
  const question = (analysis.questions || []).find(item => item.trim()) || '';
  const stepText = (analysis.steps || []).find(item => item.trim()) || '';
  const explanation = analysis.explanation?.trim() && analysis.explanation.trim() !== question && analysis.explanation.trim() !== stepText ? analysis.explanation : '';
  const step = stepText && stepText !== question ? stepText : '';
  const sources = (analysis.sources || []).map(id => { const article = state.articles.find(item => item.id === id && item.review_status !== 'needs_review'); if (!article) return ''; const text = articleText(article); return `<button class="source" type="button" data-article="${id}">↗ ${esc(text.title)}${article.example ? ` · ${t('general')}` : ''}</button>`; }).filter(Boolean);
  return `<div class="message assistant">${message.prepared ? `<div class="prepared">${t('prepared')}</div>` : ''}${analysis.category!=='other'?`<span class="badge">${catName(analysis.category)}</span>`:''}${explanation ? `<p style="margin-top:10px;white-space:pre-line">${esc(explanation)}</p>` : ''}${question ? `<h3>${t('clarify')}</h3><p>${esc(question)}</p>` : ''}${step ? `<h3>${t('tryStep')}</h3><ol class="steps"><li><span class="num">${num(1)}</span><span>${esc(step)}</span></li></ol>` : ''}${sources.length ? `<div>${sources.join('')}</div>` : ''}</div>`;
}
function ticketRows(rows, showRequester, sourceCount = rows.length) {
  if (state.loadError) return emptyBox(t('loadFailed'), state.loadError, `<button class="btn" id="retryload">${t('retryLoad')}</button>`);
  if (!sourceCount) return emptyBox(t('emptyAll'), t('emptyAllHelp'), state.user.role === 'employee' ? `<button class="btn" id="directticket">${t('newRequest')}</button>` : '');
  if (!rows.length) return emptyBox(t('noMatch'), t('noMatchHelp'), `<button class="btn secondary" id="clearfilters">${t('clearFilters')}</button>`);
  return `<div class="tablewrap"><table><thead><tr><th>${t('colId')}</th><th>${t('colProblem')}</th>${showRequester ? `<th>${t('colRequester')}</th><th>${t('colAssignee')}</th>` : ''}<th>${t('colCategory')}</th><th>${t('colPriority')}</th><th>${t('colStatus')}</th><th>${t('colDate')}</th><th></th></tr></thead><tbody>${rows.map(ticket => `<tr data-ticket="${ticket.id}" tabindex="0" role="button" aria-label="${esc(t('openTicket'))} ${ticketNo(ticket.id)}"><td class="ticketid">${ticketNo(ticket.id)}</td><td class="titlecell"><p class="tickettitle">${esc(ticket.title)}</p>${state.user.role === 'employee' ? `<p class="small muted">${nextFor(ticket)}</p>${dateStamp(ticket.updated || ticket.created)}` : ''}</td>${showRequester ? `<td>${esc(ticket.name)}</td><td>${esc(ticket.assignee_name || t('unassigned'))}</td>` : ''}<td>${catName(ticket.category)}</td><td>${badge(ticket.priority, t(ticket.priority))}</td><td>${badge(ticket.status, t(ticket.status))}</td><td class="datecell">${dateStamp(ticket.created)}</td><td>›</td></tr>`).join('')}</tbody></table></div>`;
}
function ticketsPage() {
  const rows = state.tickets.filter(ticket => (!state.filter || ticket.status === state.filter) && (!state.search || `${ticket.title} ${ticketNo(ticket.id)} ${ticket.name || ''}`.toLowerCase().includes(state.search.toLowerCase())));
  return `${heading(t('myTicketsTitle'), t('myTicketsSub'), `<button class="btn" id="directticket">${icon('plus')}${t('newRequest')}</button>`)}<div class="toolbar"><input id="ticketsearch" aria-label="${esc(t('searchTickets'))}" placeholder="${esc(t('searchTicketsPh'))}" value="${esc(state.search)}"><select id="statusfilter" aria-label="${esc(t('filterStatus'))}"><option value="">${t('allStatuses')}</option>${statusKeys.map(key => `<option value="${key}" ${state.filter === key ? 'selected' : ''}>${t(key)}</option>`).join('')}</select><button class="btn secondary" id="refresh">${t('refresh')}</button></div><div class="panel" id="tickettable">${ticketRows(rows, false, state.tickets.length)}</div>${detailPanel()}`;
}
function inQueue(ticket) {
  if (state.deskQueue === 'new') return ticket.status === 'new';
  if (state.deskQueue === 'mine') return ticket.assignee_id === state.user.id;
  if (state.deskQueue === 'progress') return ticket.status === 'in_progress';
  if (state.deskQueue === 'waiting') return ticket.status === 'waiting';
  return true;
}
function desk() {
  const filter = state.deskFilter;
  const queued = state.tickets.filter(inQueue);
  const rows = queued.filter(ticket => (!filter.status || ticket.status === filter.status) && (!filter.category || ticket.category === filter.category) && (!filter.priority || ticket.priority === filter.priority) && (!filter.assignee || (filter.assignee === 'none' ? !ticket.assignee_id : String(ticket.assignee_id) === filter.assignee)) && (!filter.q || `${ticket.title} ${ticketNo(ticket.id)} ${ticket.name} ${ticket.department}`.toLowerCase().includes(filter.q.toLowerCase())));
  const queues = [['', 'queueAll', state.tickets.length], ['new', 'queueNew', state.tickets.filter(ticket => ticket.status === 'new').length], ['mine', 'queueMine', state.tickets.filter(ticket => ticket.assignee_id === state.user.id).length], ['progress', 'queueProgress', state.tickets.filter(ticket => ticket.status === 'in_progress').length], ['waiting', 'queueWaiting', state.tickets.filter(ticket => ticket.status === 'waiting').length]];
  return `${heading(t('deskTitle'), t('deskSub'), '', t('deskEyebrow'))}<div class="queues" role="group" aria-label="${esc(t('deskTitle'))}">${queues.map(([id, key, count]) => `<button class="btn ${state.deskQueue === id ? '' : 'secondary'}" type="button" data-queue="${id}" aria-pressed="${state.deskQueue === id}">${t(key)} ${num(count)}</button>`).join('')}</div><div class="toolbar"><input id="desksearch" aria-label="${esc(t('searchTickets'))}" placeholder="${esc(t('searchTicketsPh'))}" value="${esc(filter.q)}"><select id="deskstatus" aria-label="${esc(t('filterStatus'))}"><option value="">${t('allStatuses')}</option>${statusKeys.map(key => `<option value="${key}" ${filter.status === key ? 'selected' : ''}>${t(key)}</option>`).join('')}</select><select id="deskcategory" aria-label="${esc(t('filterCategory'))}"><option value="">${t('allTopics')}</option>${catKeys.map(key => `<option value="${key}" ${filter.category === key ? 'selected' : ''}>${catName(key)}</option>`).join('')}</select><select id="deskpriority" aria-label="${esc(t('filterPriority'))}"><option value="">${t('allPriorities')}</option>${priorityKeys.map(key => `<option value="${key}" ${filter.priority === key ? 'selected' : ''}>${t(key)}</option>`).join('')}</select><select id="deskassignee" aria-label="${esc(t('filterAssignee'))}"><option value="">${t('allTechnicians')}</option><option value="none" ${filter.assignee === 'none' ? 'selected' : ''}>${t('unassigned')}</option>${state.technicians.map(person => `<option value="${person.id}" ${filter.assignee === String(person.id) ? 'selected' : ''}>${esc(person.name)}</option>`).join('')}</select></div><div class="panel">${ticketRows(rows, true, state.tickets.length)}</div>${detailPanel()}`;
}
function syncStatusFields() {
  const select = $('#ticketstatus');
  if (!select) return;
  const status = select.value;
  const waiting = $('#waitingbox');
  const closing = $('#closebox');
  const resolved = $('#resolvedhint');
  if (waiting) waiting.hidden = status !== 'waiting';
  if (closing) closing.hidden = status !== 'closed';
  if (resolved) resolved.hidden = status !== 'resolved';
  const request = $('#waitingrequest');
  const reason = $('#closereason');
  if (request) request.disabled = status !== 'waiting';
  if (reason) reason.disabled = status !== 'closed';
  const help = $('#statushelp');
  if (help) help.textContent = t(statusHelpKey[status] || 'helpNew');
}
function statusOptions(ticket) {
  const admin = state.user.role === 'admin';
  const next = {
    new: admin ? ['closed'] : [],
    accepted: ['in_progress', 'waiting', 'resolved'].concat(admin ? ['closed'] : []),
    in_progress: ['waiting', 'resolved'].concat(admin ? ['closed'] : []),
    waiting: ['in_progress', 'resolved'].concat(admin ? ['closed'] : []),
    resolved: admin ? ['closed'] : [],
    closed: []
  };
  return [ticket.status, ...(next[ticket.status] || [])].filter((value, index, list) => list.indexOf(value) === index);
}
function detailHead(ticket) {
  return `<div class="panelhead"><div><h2>${esc(ticket.title)}</h2><div class="small ticketid">${ticketNo(ticket.id)}</div></div><div class="actions">${badge(ticket.status, t(ticket.status))}${badge(ticket.priority, t(ticket.priority))}<span class="badge">${catName(ticket.category)}</span></div></div>`;
}
function problemSection(ticket) {
  const impact = `${ticket.impact === 'company' ? t('impactCompany') : ticket.impact === 'team' ? t('impactTeam') : t('impactOne')} · ${ticket.blocked ? t('blockedYes') : t('blockedNo')}`;
  const owner = ticket.user_id === state.user.id;
  const closedNote = ticket.status !== 'closed' ? '' : ticket.close_reason ? `<p class="help">${t('adminClosedNote')}</p><p>${esc(ticket.close_reason)}</p>` : `<p class="help">${t('employeeClosedNote')}</p>`;
  return `<section class="detailsection" aria-labelledby="problemheading"><h3 id="problemheading">${t('sectionProblem')}</h3><div class="deskmeta"><div><b>${t('requester')}</b><p>${esc(ticket.name)} · ${esc(ticket.department)}</p></div><div><b>${t('colAssignee')}</b><p>${esc(ticket.assignee_name || t('unassigned'))}</p></div><div><b>${t('impact')}</b><p>${impact}</p></div><div><b>${t('colDate')}</b><p>${dateStamp(ticket.created)}</p></div></div><h4>${t('description')}</h4><p class="modalbody">${esc(ticket.summary)}</p><h4>${t('triedSteps')}</h4><p class="modalbody">${esc(ticket.tried_steps || t('noTried'))}</p>${ticket.note ? `<h4>${t('lastUpdate')}</h4><p class="modalbody">${esc(ticket.note)}</p>` : ''}${owner ? `<p class="statusnotice">${nextFor(ticket)}</p>` : ''}${closedNote}</section>`;
}
function talkSection(ticket) {
  const conversation = ticket.conversation ? `<div class="notes">${ticket.conversation.prepared ? `<div class="prepared">${t('prepared')}</div>` : ''}${ticket.conversation.messages.map(message => message.role === 'user' ? `<p><b>${esc(ticket.name)}:</b> ${esc(message.content)}</p>` : message.analysis ? `<p><b>${t('assistant')}:</b> ${esc(message.analysis.explanation)}</p>` : '').join('')}</div>` : `<p class="help">${t('noConversation')}</p>`;
  const thread = ticket.replies.length ? ticket.replies.map(reply => `<div class="bubble ${reply.user_id === state.user.id ? 'mine' : ''}"><b>${esc(reply.name)}</b> <span class="small muted">${dateStamp(reply.created)}</span><p>${esc(reply.body)}</p></div>`).join('') : `<p class="help">${t('noReplies')}</p>`;
  return `<section class="detailsection" aria-labelledby="talkheading"><h3 id="talkheading">${t('sectionTalk')}</h3><h4>${t('conversationTitle')}</h4>${conversation}<h4>${t('replies')}</h4><div class="thread">${thread}</div><form id="replyform" class="detailform"><label for="replybody">${t('replyLabel')}</label><textarea id="replybody" name="body" maxlength="4000" aria-describedby="replyhelp" placeholder="${esc(t('replyPh'))}">${esc(state.replyDraft || '')}</textarea><p id="replyhelp" class="help">${t('replyHelp')}</p><button class="btn" type="submit">${t('sendReply')}</button></form></section>`;
}
function manageSection(ticket) {
  const admin = state.user.role === 'admin';
  const technician = state.user.role === 'technician';
  if (!admin && !technician) return '';
  const mine = ticket.assignee_id === state.user.id;
  const canAccept = ticket.status === 'new' && !ticket.assignee_id;
  const acceptReason = ticket.assignee_id ? t('assignedReason', { name: ticket.assignee_name || '' }) : t('acceptOnlyNew');
  const canStart = ticket.status === 'accepted' && (admin || mine);
  const canEdit = admin ? ticket.status !== 'closed' : technician && mine && ['accepted', 'in_progress', 'waiting', 'resolved'].includes(ticket.status);
  const acceptBtn = `<button class="btn${canAccept ? '' : ' is-locked'}" id="accept" type="button" ${canAccept ? '' : 'disabled'} aria-describedby="accepthelp${canAccept ? '' : ' acceptwhy'}">${t('accept')}</button>`;
  const startBtn = canStart ? `<button class="btn secondary" id="startwork" type="button" aria-describedby="starthelp">${t('startWork')}</button>` : '';
  const assign = admin && state.technicians.length ? `<form id="assignform" class="detailform"><label for="assignee">${t('reassign')}</label><select id="assignee" name="assignee_id" aria-describedby="reassignhelp">${state.technicians.map(person => `<option value="${person.id}" ${ticket.assignee_id === person.id ? 'selected' : ''}>${esc(person.name)}</option>`).join('')}</select><p id="reassignhelp" class="help">${t('reassignHelp')}</p><button class="btn secondary" type="submit">${t('reassignAction')}</button></form>` : '';
  const options = statusOptions(ticket).map(key => `<option value="${key}" ${ticket.status === key ? 'selected' : ''}>${t(key)}</option>`).join('');
  const statusForm = canEdit ? `<form id="statusform" class="detailform"><label for="ticketstatus">${t('statusUpdate')}</label><select id="ticketstatus" name="status" aria-describedby="statushelp">${options}</select><p id="statushelp" class="help">${t(statusHelpKey[ticket.status] || 'helpNew')}</p><div id="waitingbox" ${ticket.status === 'waiting' ? '' : 'hidden'}><label for="waitingrequest">${t('waitingField')}</label><textarea id="waitingrequest" maxlength="4000" aria-describedby="waitinghelp" ${ticket.status === 'waiting' ? '' : 'disabled'}></textarea><p id="waitinghelp" class="help">${t('waitingHelp')}</p></div><div id="closebox" hidden><label for="closereason">${t('closeField')}</label><textarea id="closereason" maxlength="4000" aria-describedby="closehelp" disabled></textarea><p id="closehelp" class="help">${t('closeHelp')}</p></div><p id="resolvedhint" class="help" ${ticket.status === 'resolved' ? '' : 'hidden'}>${t('resolvedHint')}</p>${admin ? `<label for="ticketpriority">${t('colPriority')}</label><select id="ticketpriority" name="priority">${priorityKeys.map(key => `<option value="${key}" ${ticket.priority === key ? 'selected' : ''}>${t(key)}</option>`).join('')}</select>` : ''}<label for="supportnote">${t('supportNote')}</label><textarea id="supportnote" name="note" maxlength="4000">${esc(ticket.note || '')}</textarea><button class="btn" type="submit">${t('saveStatus')}</button></form>` : '';
  return `<section class="detailsection" aria-labelledby="manageheading"><h3 id="manageheading">${t('sectionManage')}</h3><div class="actionrow">${acceptBtn}${startBtn}<button class="btn ghost" id="statusguide" type="button">${t('statusGuide')}</button></div><p id="accepthelp" class="help">${t('acceptHelp')}</p>${canAccept ? '' : `<p id="acceptwhy" class="help">${acceptReason}</p>`}${canStart ? `<p id="starthelp" class="help">${t('startHelp')}</p>` : ''}${assign}${statusForm}</section>`;
}
function solutionSection(ticket) {
  const admin = state.user.role === 'admin';
  const technician = state.user.role === 'technician';
  const owner = ticket.user_id === state.user.id;
  const canRecord = (admin || (technician && ticket.assignee_id === state.user.id)) && ['accepted', 'in_progress', 'waiting', 'resolved'].includes(ticket.status);
  const shown = canRecord ? '' : ticket.solution ? `<p class="modalbody">${esc(ticket.solution)}</p>` : `<p class="help">${t('noSolutionYet')}</p>`;
  const form = canRecord ? `<form id="solutionform" class="detailform"><label for="solutionbody">${t('solution')}</label><textarea id="solutionbody" name="solution" maxlength="4000" aria-describedby="solutionhelp" placeholder="${esc(t('solutionPh'))}">${esc(ticket.solution || '')}</textarea><p id="solutionhelp" class="help">${t('solutionHelp')}</p><button class="btn" type="submit">${t('saveSolution')}</button></form>` : `<p class="help">${t('solutionHelp')}</p>`;
  const ownerActions = owner && ticket.status === 'resolved' ? `<div class="actionrow"><button class="btn" id="confirmfix" type="button">${t('confirmFix')}</button><button class="btn secondary" id="reopen" type="button">${t('reopen')}</button></div>` : owner && ticket.status === 'closed' ? `<div class="actionrow"><button class="btn secondary" id="reopen" type="button">${t('reopen')}</button></div>` : '';
  const rating = owner && ['resolved', 'closed'].includes(ticket.status) ? `<p>${t('rateService')} ${ticket.rating ? t('currentRating', { n: num(ticket.rating) }) : ''}</p><div class="stars">${[1, 2, 3, 4, 5].map(score => `<button type="button" data-ticket-rating="${score}" aria-label="${esc(t('ratingName', { n: num(score), label: t(`rate${score}`) }))}">${num(score)} ★ ${t(`rate${score}`)}</button>`).join('')}</div>` : '';
  return `<section class="detailsection" aria-labelledby="solutionheading"><h3 id="solutionheading">${t('sectionSolution')}</h3>${shown}${form}${ownerActions}${rating}</section>`;
}
function timeSection(ticket) {
  const items = ticket.events.map(item => `<li><b>${t(eventKeys[item.action] || 'eventStatus')}</b> ${item.from_status || item.to_status ? `${item.from_status ? t(item.from_status) : ''} ${item.to_status ? `→ ${t(item.to_status)}` : ''}` : ''}<div class="small muted">${item.name ? t('by', { name: item.name }) : ''} ${dateStamp(item.created)}</div>${item.detail ? `<div>${esc(item.detail)}</div>` : ''}</li>`).join('');
  return `<section class="detailsection" aria-labelledby="timeheading"><h3 id="timeheading">${t('timeline')}</h3><ol class="timeline">${items}</ol></section>`;
}
function detailPanel() {
  const ticket = state.detail;
  if (!ticket || ticket.id !== state.selected) return '';
  return `<section class="panel detail" id="ticketdetail">${detailHead(ticket)}<div class="detailbody">${problemSection(ticket)}${talkSection(ticket)}${manageSection(ticket)}${solutionSection(ticket)}${timeSection(ticket)}</div></section>`;
}
function knowledge() {
  if (state.loadError) return emptyBox(t('loadFailed'), state.loadError, `<button class="btn" id="retryload">${t('retryLoad')}</button>`);
  if (!state.articles.length) return `${heading(t('knowledgeTitle'), t('knowledgeSub'))}${emptyBox(t('emptyGuide'), t('emptyAllHelp'), state.user.role === 'admin' ? `<button class="btn" id="addarticle">${icon('plus')}${t('addArticle')}</button>` : '')}`;
  return `${heading(t('knowledgeTitle'), t('knowledgeSub'), state.user.role === 'admin' ? `<button class="btn" id="addarticle">${icon('plus')}${t('addArticle')}</button>` : '')}<div class="statusnotice">${state.company ? esc(state.company) + ' — ' : ''}${t('knowledgeNotice')}</div><div class="toolbar"><input id="knowledgesearch" aria-label="${esc(t('searchKnowledge'))}" placeholder="${esc(t('searchKnowledgePh'))}"><select id="knowledgecategory" aria-label="${esc(t('filterCategory'))}"><option value="">${t('allTopics')}</option>${catKeys.map(key => `<option value="${key}">${catName(key)}</option>`).join('')}</select><span class="pill" id="knowledgecount">${t('topicCount', { n: num(state.articles.length) })}</span></div><div class="articlegrid">${state.articles.map(article => { const text = articleText(article); const search = `${article.title} ${article.title_en || ''} ${article.keywords || ''} ${article.keywords_en || ''} ${article.body} ${article.body_en || ''}`; const review = article.review_status === 'needs_review'; return `<button class="panel article" data-article="${article.id}" data-category="${article.category}" data-search="${esc(search)}"><div class="minihead"><div class="articleicon">${icon(catIcon[article.category])}</div><span class="badge">${review ? t('needsReview') : article.example ? t('general') : t('official')}</span></div><h3>${esc(text.title)}</h3><p>${text.missing ? esc(t('englishMissing')) : esc(text.body.slice(0, 105))}…</p><div class="small more">${t('readMore')}</div></button>`; }).join('')}</div><div class="panel empty" id="knowledgeempty" hidden>${t('knowledgeEmpty')}</div>`;
}
function dashboard() {
  if (state.loadError) return emptyBox(t('loadFailed'), state.loadError, `<button class="btn" id="retryload">${t('retryLoad')}</button>`);
  const data = state.dash; if (!data) return `<div class="empty">${t('loading')}</div>`;
  const max = Math.max(1, ...data.days.map(day => day.count));
  return `${heading(t('dashTitle'), t('dashSub'), `<button class="btn secondary" id="refresh">${t('refresh')}</button>`, t('dashEyebrow'))}<form id="companyform" class="panel"><div class="toolbar"><label for="companyname">${t('companySetting')}</label><input id="companyname" name="companyName" maxlength="80" value="${esc(state.company)}" required></div><label for="recovery">${t('recoverySetting')}</label><textarea id="recovery" name="accountRecovery" maxlength="500">${esc(state.recovery || '')}</textarea><p class="small">${t('recoveryHelp')}</p><button class="btn secondary" type="submit">${t('saveCompany')}</button></form><div class="stats">${[['ticket', num(data.open), t('openStat'), t('openFoot')], ['check', num(data.selfResolved), t('selfStat'), t('selfFoot')], ['clock', data.averageMinutes === null ? t('none') : t('minutes', { n: num(data.averageMinutes) }), t('timeStat'), t('timeFoot')], ['chat', data.satisfaction === null ? t('none') : `${num(data.satisfaction)}%`, t('satStat'), t('satFoot')]].map(([glyph, value, label, foot]) => `<div class="panel stat"><div class="icon">${icon(glyph)}</div><div class="label">${label}</div><div class="value">${value}</div><div class="foot">${foot}</div></div>`).join('')}</div><div class="dashgrid"><section class="panel chartpanel"><div class="minihead"><h3>${t('chartTitle')}</h3><span class="small muted">${t('chartTotal', { n: num(data.total) })}</span></div><div class="chart" role="img" aria-label="${esc(t('chartLabel'))}: ${data.days.map(day => `${day.date}: ${day.count}`).join(', ')}">${data.days.map(day => `<div class="barcol"><span>${num(day.count)}</span><div class="bar" style="height:${day.count / max * 110}px"></div><span>${dayName(day.date)}</span></div>`).join('')}</div></section><section class="panel chartpanel"><h3>${t('topicsTitle')}</h3>${data.categories.map(item => `<div class="categoryrow"><span>${catName(item.category)}</span><div class="track"><div class="fill" style="width:${data.total ? item.count / data.total * 100 : 0}%"></div></div><span class="muted">${num(item.count)}</span></div>`).join('')}</section></div><section class="panel"><div class="panelhead"><h3>${t('latest')}</h3><button class="textlink end" data-page="desk">${t('viewAll')}</button></div>${ticketRows(state.tickets.slice(0, 6), true)}</section><div class="notes">${t('dashNote')}</div>${systemPanel()}`;
}
function systemPanel() {
  const model = state.model;
  const status = !model ? t('modelUnknown') : model.ready ? (model.loaded ? t('modelReadyLoaded') : t('modelReadyIdle')) : model.connected ? t('modelPartial') : t('modelOffline');
  const rows = (state.diagnostics || []).slice(-8).reverse().map(item => `<tr><td dir="ltr">${esc(item.id)}</td><td dir="ltr">${esc(item.failure || 'ok')}</td><td dir="ltr">${num(item.totalMs || 0)}</td><td dir="ltr">${item.modelMs == null ? '—' : num(item.modelMs)}</td><td dir="ltr">${item.loadMs == null ? '—' : num(item.loadMs)}</td><td dir="ltr">${esc(item.doneReason || '')}</td></tr>`).join('');
  return `<section class="panel systembox"><h3>${t('systemTitle')}</h3><p>${t('systemInfo')}</p><p>${esc(status)}${model?.model ? ` · <b dir="ltr">${esc(model.model)}</b>` : ''}</p><button class="btn secondary" type="button" id="checkmodel">${t('checkModel')}</button><div class="tablewrap"><table><thead><tr><th>${t('diagId')}</th><th>${t('diagFailure')}</th><th>${t('diagTotal')}</th><th>${t('diagModel')}</th><th>${t('diagLoad')}</th><th>${t('diagDone')}</th></tr></thead><tbody>${rows || `<tr><td colspan="6">${t('diagEmpty')}</td></tr>`}</tbody></table></div></section>`;
}
function bind() {
  if (state.qa && !$('#qa-banner')) { const banner = document.createElement('div'); banner.id = 'qa-banner'; banner.className = 'statusnotice'; banner.textContent = t('qaBanner'); $('#content').prepend(banner); }
  bindChrome();
  document.querySelectorAll('[data-fill]').forEach(button => button.onclick = () => { state.draft = button.dataset.fill; const field = $('#message'); if (field) { field.value = state.draft; field.focus(); } });
  document.querySelectorAll('[data-page]').forEach(button => button.onclick = () => { if (state.busy) return toast(t('waitNav')); state.page = button.dataset.page; state.error = ''; render(); });
  $('#logout').onclick = async () => { if (state.busy) return toast(t('waitChat')); await api('/api/logout', 'POST', {}); state.messages = []; state.conversation = null; location.reload(); };
  $('#checkmodel')?.addEventListener('click', async event => { event.currentTarget.disabled = true; try { state.model = await api('/api/model'); state.diagnostics = (await api('/api/diagnostics')).items || []; render(); } catch (error) { toast(error.message); event.currentTarget.disabled = false; } });
  const startFresh = () => { if (state.ending) return; chatEpoch++; chatController?.abort(); chatController = null; state.busy = false; state.clientFor = ''; state.clientId = ''; state.messages = []; state.conversation = null; state.analysis = null; state.pending = null; state.error = ''; state.endError = ''; state.draft = ''; state.ended = false; state.ratingValue = null; state.skipped = false; state.linkedTicket = null; render(); $('#message')?.focus(); };
  $('#newchat')?.addEventListener('click', startFresh);
  $('#startnew')?.addEventListener('click', startFresh);
  $('#chatform')?.addEventListener('submit', event => { event.preventDefault(); sendChat(); });
  $('#message')?.addEventListener('input', event => state.draft = event.target.value);
  $('#message')?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendChat(); } });
  document.querySelectorAll('[data-suggest]').forEach(button => button.onclick = () => { state.draft = button.dataset.suggest; $('#message').value = state.draft; $('#message').focus(); });
  document.querySelectorAll('[data-article]').forEach(button => button.onclick = () => articleModal(Number(button.dataset.article)));
  document.querySelectorAll('[data-conversation]').forEach(button => button.onclick = () => { if (state.busy || state.ending) return; openConversation(state.conversations.find(item => item.id === Number(button.dataset.conversation))); });
  document.querySelectorAll('#directticket').forEach(button => button.addEventListener('click', () => ticketModal(false)));
  $('#escalate')?.addEventListener('click', () => ticketModal(true));
  $('#openticket')?.addEventListener('click', async () => { if (!state.linkedTicket) return; state.page = state.user.role === 'employee' ? 'tickets' : 'desk'; state.selected = state.linkedTicket; try { state.detail = await api(`/api/tickets/${state.linkedTicket}`); } catch (error) { toast(error.message); } render(); });
  $('#errorticket')?.addEventListener('click', () => ticketModal(false));
  $('#retrychat')?.addEventListener('click', () => sendChat());
  $('#cancelchat')?.addEventListener('click', () => chatController?.abort());
  $('#endchat')?.addEventListener('click', event => endConversation(event.currentTarget));
  $('#retryend')?.addEventListener('click', event => endConversation(event.currentTarget));
  $('#addarticle')?.addEventListener('click', addArticleModal);
  $('#refresh')?.addEventListener('click', async event => { event.target.disabled = true; try { await refresh(); render(); toast(t('refreshed')); } catch (error) { toast(error.message); render(); } });
  $('#retryload')?.addEventListener('click', async event => { event.target.disabled = true; try { await refresh(); render(); } catch (error) { toast(error.message); render(); } });
  $('#clearfilters')?.addEventListener('click', () => { state.search = ''; state.filter = ''; state.deskQueue = ''; state.deskFilter = { status: '', category: '', priority: '', assignee: '', q: '' }; render(); });
  document.querySelectorAll('[data-queue]').forEach(button => button.onclick = () => { state.deskQueue = button.dataset.queue; render(); });
  $('#focuschat')?.addEventListener('click', startFresh);
  $('#ticketsearch')?.addEventListener('input', event => { state.search = event.target.value; $('#tickettable').innerHTML = ticketRows(state.tickets.filter(ticket => (!state.filter || ticket.status === state.filter) && (!state.search || `${ticket.title} ${ticketNo(ticket.id)}`.toLowerCase().includes(state.search.toLowerCase()))), false); bindTickets(); });
  $('#statusfilter')?.addEventListener('change', event => { state.filter = event.target.value; render(); });
  ['desksearch', 'deskstatus', 'deskcategory', 'deskpriority', 'deskassignee'].forEach(id => { const el = $('#' + id); if (!el) return; const key = { desksearch: 'q', deskstatus: 'status', deskcategory: 'category', deskpriority: 'priority', deskassignee: 'assignee' }[id]; el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', event => { state.deskFilter[key] = event.target.value; render(); const next = $('#' + id); next?.focus(); }); });
  $('#companyform')?.addEventListener('submit', async event => { event.preventDefault(); try { const saved = await api('/api/settings', 'PATCH', Object.fromEntries(new FormData(event.target))); state.company = saved.companyName; render(); toast(t('companySaved')); } catch (error) { toast(error.message); } });
  $('#userform')?.addEventListener('submit', async event => { event.preventDefault(); const button = $('button[type=submit]', event.target); button.disabled = true; try { const created = await api('/api/users', 'POST', Object.fromEntries(new FormData(event.target))); state.inviteNotice = { name: event.target.name.value, email: event.target.email.value, url: `${location.origin}${created.invitePath}`, expires: created.expires }; await refresh(); render(); } catch (error) { toast(error.message); button.disabled = false; } });
  $('#copylink')?.addEventListener('click', async () => { const value = $('#invitelink')?.value; if (!value) return; try { await navigator.clipboard.writeText(value); toast(t('copied')); } catch { $('#invitelink')?.select(); toast(t('copyManual')); } });
  document.querySelectorAll('[data-disable]').forEach(button => button.onclick = async () => { button.disabled = true; try { await api(`/api/users/${button.dataset.disable}`, 'PATCH', { status: 'disabled' }); state.inviteNotice = null; await refresh(); render(); toast(t('userDisabled')); } catch (error) { toast(error.message); button.disabled = false; } });
  document.querySelectorAll('[data-enable]').forEach(button => button.onclick = async () => { button.disabled = true; try { await api(`/api/users/${button.dataset.enable}`, 'PATCH', { status: 'active' }); await refresh(); render(); toast(t('userEnabled')); } catch (error) { toast(error.message); button.disabled = false; } });
  document.querySelectorAll('[data-reinvite]').forEach(button => button.onclick = async () => { button.disabled = true; try { const created = await api(`/api/users/${button.dataset.reinvite}/invite`, 'POST', {}); const account = state.accounts.find(item => item.id === Number(button.dataset.reinvite)); state.inviteNotice = { name: account?.name || '', email: account?.email || '', url: `${location.origin}${created.invitePath}`, expires: created.expires }; await refresh(); render(); } catch (error) { toast(error.message); button.disabled = false; } });
  bindTickets(); bindDetail();
  const messages = $('#messages'); if (messages) messages.scrollTop = messages.scrollHeight;
}
function bindTickets() { document.querySelectorAll('[data-ticket]').forEach(row => { const open = () => openTicket(Number(row.dataset.ticket)); row.onclick = open; row.onkeydown = event => { if (event.key === 'Enter') open(); }; }); }
async function openTicket(id) { state.replyDraft = ''; state.selected = id; state.detail = await api(`/api/tickets/${id}`); state.page = state.user.role === 'employee' ? 'tickets' : 'desk'; render(); document.getElementById('ticketdetail')?.scrollIntoView({ block: 'nearest' }); }
function holdButton(button) {
  if (!button || button.dataset.holding === '1' || button.disabled) return false;
  button.dataset.holding = '1';
  button.dataset.hadLabel = button.hasAttribute('aria-label') ? '1' : '0';
  button.dataset.prevLabel = button.getAttribute('aria-label') || '';
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.setAttribute('aria-label', t('saving'));
  button.classList.add('is-busy');
  return true;
}
function releaseButton(button) {
  if (!button) return;
  button.dataset.holding = '0';
  button.disabled = false;
  button.removeAttribute('aria-busy');
  button.classList.remove('is-busy');
  if (button.dataset.hadLabel === '1') button.setAttribute('aria-label', button.dataset.prevLabel || '');
  else button.removeAttribute('aria-label');
}
function bindDetail() {
  $('#accept')?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget;
    if (!holdButton(button)) return;
    try { state.detail = await api(`/api/tickets/${state.selected}/accept`, 'POST', {}); await refresh(); render(); toast(t('acceptedToast')); }
    catch (error) { toast(error.message); releaseButton(button); }
  });
  $('#startwork')?.addEventListener('click', async event => {
    event.preventDefault();
    const button = event.currentTarget;
    if (!holdButton(button)) return;
    try { await api(`/api/tickets/${state.selected}`, 'PATCH', { status: 'in_progress' }); await refresh(); render(); toast(t('startedToast')); }
    catch (error) { toast(error.message); releaseButton(button); }
  });
  $('#statusguide')?.addEventListener('click', () => modal(t('statusGuideTitle'), `<dl class="statusguide">${statusKeys.map(key => `<dt>${t(key)}</dt><dd>${t(statusHelpKey[key])}</dd>`).join('')}</dl>`));
  $('#ticketstatus')?.addEventListener('change', syncStatusFields);
  syncStatusFields();
  $('#replybody')?.addEventListener('input', event => { state.replyDraft = event.target.value; });
  $('#replyform')?.addEventListener('submit', async event => {
    event.preventDefault();
    const field = $('#replybody');
    const body = field?.value || '';
    if (!String(body).trim()) return toast(t('writeReply'));
    const button = $('button[type=submit]', event.target);
    if (!holdButton(button)) return;
    try { state.replyDraft = ''; state.detail = await api(`/api/tickets/${state.selected}/replies`, 'POST', { body }); await refresh(); render(); toast(t('replySaved')); }
    catch (error) { toast(error.message); releaseButton(button); }
  });
  $('#assignform')?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('button[type=submit]', event.target);
    if (!holdButton(button)) return;
    try { state.detail = await api(`/api/tickets/${state.selected}/assign`, 'POST', Object.fromEntries(new FormData(event.target))); await refresh(); render(); toast(t('reassigned')); }
    catch (error) { toast(error.message); releaseButton(button); }
  });
  $('#statusform')?.addEventListener('submit', async event => {
    event.preventDefault();
    const status = $('#ticketstatus')?.value;
    const payload = { status, note: $('#supportnote')?.value || '' };
    if ($('#ticketpriority')) payload.priority = $('#ticketpriority').value;
    if (status === 'waiting') payload.request = $('#waitingrequest')?.value || '';
    if (status === 'closed') payload.closeReason = $('#closereason')?.value || '';
    if (status === 'resolved') payload.solution = $('#solutionbody')?.value || '';
    if (status === 'resolved' && !String(payload.solution).trim()) { toast(t('needSolution')); $('#solutionbody')?.focus(); return; }
    if (status === 'waiting' && state.detail?.status !== 'waiting' && !String(payload.request).trim()) { toast(t('needRequest')); $('#waitingrequest')?.focus(); return; }
    if (status === 'closed' && !String(payload.closeReason).trim()) { toast(t('needCloseReason')); $('#closereason')?.focus(); return; }
    const button = $('button[type=submit]', event.target);
    if (!holdButton(button)) return;
    try { await api(`/api/tickets/${state.selected}`, 'PATCH', payload); await refresh(); render(); toast(t('updated')); }
    catch (error) { toast(error.message); releaseButton(button); }
  });
  $('#solutionform')?.addEventListener('submit', async event => {
    event.preventDefault();
    const field = $('#solutionbody');
    const solution = field?.value || '';
    if (!String(solution).trim()) { toast(t('needSolution')); field?.focus(); return; }
    const button = $('button[type=submit]', event.target);
    if (!holdButton(button)) return;
    try { await api(`/api/tickets/${state.selected}`, 'PATCH', { status: 'resolved', solution }); await refresh(); render(); toast(t('updated')); }
    catch (error) { toast(error.message); releaseButton(button); }
  });
  $('#confirmfix')?.addEventListener('click', event => ticketAction('confirm', t('confirmed'), event.currentTarget));
  $('#reopen')?.addEventListener('click', event => ticketAction('reopen', t('reopened'), event.currentTarget));
  document.querySelectorAll('[data-ticket-rating]').forEach(button => button.onclick = async () => {
    if (!holdButton(button)) return;
    try { await api(`/api/tickets/${state.selected}`, 'PATCH', { rating: Number(button.dataset.ticketRating) }); await refresh(); render(); toast(t('thanks')); }
    catch (error) { toast(error.message); releaseButton(button); }
  });
}
async function ticketAction(action, message, button) {
  if (button && !holdButton(button)) return;
  try { await api(`/api/tickets/${state.selected}`, 'PATCH', { action }); await refresh(); render(); toast(message); }
  catch (error) { toast(error.message); releaseButton(button); }
}
function openConversation(conversation) {
  if (!conversation) return;
  chatEpoch++; chatController?.abort(); chatController = null; state.busy = false; state.pending = null; state.clientFor = ''; state.clientId = '';
  state.messages = conversation.messages; state.conversation = conversation.id; state.analysis = conversation.analysis; state.ended = !!conversation.ended; state.ratingValue = conversation.rating ?? null; state.skipped = !!conversation.skipped; state.linkedTicket = conversation.ticket_id || null; state.error = ''; state.endError = ''; state.draft = ''; render();
  if (state.ended && state.ratingValue == null && !state.skipped) ratingModal();
}
async function endConversation(button) {
  if (!state.conversation || state.ending || state.ended) return;
  if (button && !holdButton(button)) return;
  state.ending = true; state.endError = '';
  try {
    const result = await api(`/api/conversations/${state.conversation}/end`, 'POST', {});
    state.ended = !!result.ended; state.ratingValue = result.rating ?? null; state.skipped = !!result.skipped; state.ending = false;
    state.conversations = await api('/api/conversations');
    render();
    if (result.rating == null && !result.skipped) ratingModal();
  } catch (error) {
    state.ending = false; state.endError = error.message; render();
  }
}
async function sendChat() {
  if (state.busy || state.ended || chatController) return;
  const message = state.draft.trim();
  if (!message) return toast(t('writeFirst'));
  state.busy = true; state.pending = message; state.draft = ''; state.error = '';
  const controller = new AbortController();
  const epoch = chatEpoch;
  chatController = controller;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 185000);
  render();
  try {
    if (state.clientFor !== message) { state.clientFor = message; state.clientId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
    const result = await api('/api/chat', 'POST', { message, conversation_id: state.conversation, lang: state.lang, client_id: state.clientId }, { signal: controller.signal });
    if (epoch !== chatEpoch) return;
    state.messages = result.messages; state.conversation = result.conversation_id; state.analysis = result.analysis; state.pending = null; state.clientFor = ''; state.clientId = '';
    const conversations = await api('/api/conversations');
    if (epoch !== chatEpoch) return;
    state.conversations = conversations;
    state.linkedTicket = state.conversations.find(item => item.id === state.conversation)?.ticket_id || state.linkedTicket;
  } catch (error) {
    if (epoch !== chatEpoch) return;
    state.pending = null; state.draft = message;
    if (error.name === 'AbortError' && !timedOut) state.error = t('cancelled');
    else if (state.user?.role === 'admin' && error.diagnostic) state.error = `${t('assistantUnavailable')} · ${error.diagnostic.id} · ${error.diagnostic.failure}`;
    else state.error = t('assistantUnavailable');
  } finally { clearTimeout(timeout); if (epoch === chatEpoch) { chatController = null; state.busy = false; render(); $('#message')?.focus(); } }
}
function modal(title, html) { const dialog = $('#dialog'); dialog.oncancel = null; dialog.innerHTML = `<div class="modalhead"><h2>${title}</h2><button class="close" type="button" aria-label="${esc(t('close'))}">×</button></div>${html}`; $('.close', dialog).onclick = () => dialog.close(); if (!dialog.open) dialog.showModal(); }
function articleModal(id) {
  const article = state.articles.find(item => item.id === id); const text = articleText(article);
  const review = article.review_status === 'needs_review';
  const source = !review && article.source_name ? `<p class="small"><span>${t('sourceLabel')}: ${esc(article.source_name)}</span>${article.source_url ? ` <a href="${esc(article.source_url)}" dir="ltr" target="_blank" rel="noopener">${esc(article.source_url)}</a>` : ''}${article.reviewed_at ? `<br>${t('reviewedOn')}: <span dir="ltr">${esc(article.reviewed_at)}</span>` : ''}</p>` : '';
  modal(esc(text.title), `<span class="badge">${review ? t('needsReview') : article.example ? t('exampleNote') : t('officialNote')}</span>${review ? `<p class="modalbody">${t('needsReviewNote')}</p>` : ''}${source}${text.missing ? `<p class="modalbody">${t('englishMissing')}</p>` : `<p class="modalbody" style="margin-top:20px">${esc(text.body)}</p>`}`);
}
function ticketModal(fromChat) {
  const analysis = fromChat ? state.analysis : null;
  const tried = analysis?.case_state ? Object.values(analysis.case_state.attempts || {}).map(attempt => attempt.user_text).join('\n') : state.messages.filter(message => message.role === 'user' && /جرب|نفذت|حاول|سويت|tried|performed/i.test(message.content)).map(message => message.content).join('\n');
  modal(t('ticketModal'), `<p class="small muted">${t('priorityHelp')}</p><form id="ticketform"><label>${t('problemTitle')}</label><input name="title" required maxlength="200" value="${esc(analysis?.title || '')}"><label>${t('problemSummary')}</label><textarea name="summary" required maxlength="8000">${esc(analysis?.summary || state.draft)}</textarea><label>${t('triedLabel')}</label><textarea name="tried_steps" maxlength="4000">${esc(tried)}</textarea>${!analysis ? `<label>${t('colCategory')}</label><select name="category">${catKeys.map(key => `<option value="${key}">${catName(key)}</option>`).join('')}</select>` : ''}<div class="formrow"><div><label>${t('who')}</label><select name="impact"><option value="one">${t('onlyMe')}</option><option value="team">${t('team')}</option><option value="company">${t('wholeCompany')}</option></select></div><div><label>${t('blocked')}</label><select name="blocked"><option value="false">${t('notBlocked')}</option><option value="true">${t('isBlocked')}</option></select></div></div><p class="small muted" style="margin-top:12px">${t('ticketFoot')}</p><div class="formerror" id="ticketerror" role="alert"></div><button class="btn" type="submit">${t('createTicket')}</button></form>`);
  $('#ticketform').onsubmit = async event => { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.target)); payload.blocked = payload.blocked === 'true'; const button = $('button[type=submit]', event.target); button.disabled = true; try { const result = await api('/api/tickets', 'POST', { ...payload, ...(analysis ? { conversation_id: state.conversation } : {}) }); $('#dialog').close(); await refresh(); if (analysis && state.conversation) { state.linkedTicket = result.id; state.page = 'support'; const current = state.conversations.find(item => item.id === state.conversation); if (current) current.ticket_id = result.id; } else { state.page = state.user.role === 'employee' ? 'tickets' : 'desk'; state.selected = result.id; state.detail = await api(`/api/tickets/${result.id}`); } render(); toast(t('ticketSaved', { id: ticketNo(result.id) })); } catch (error) { $('#ticketerror').textContent = error.message; button.disabled = false; } };
}
function ratingModal() {
  let selected = 0;
  let saving = false;
  const dialog = $('#dialog');
  const choiceText = () => selected ? t('ratingChosen', { n: num(selected), total: num(5), label: t('rate' + selected) }) : t('ratingPick');
  const paint = () => { dialog.innerHTML = `<div class="modalhead"><h2 id="ratingtitle">${t('ratingTitle')}</h2><button class="close" type="button" aria-label="${esc(t('close'))}">×</button></div><p id="ratinghelp">${t('ratingOptional')}</p><div class="rater" role="radiogroup" aria-labelledby="ratingtitle">${[1, 2, 3, 4, 5].map(score => `<button type="button" role="radio" data-rating="${score}" aria-checked="${selected === score}" aria-label="${esc(t('ratingName', { n: num(score), label: t('rate' + score) }))}" tabindex="${selected === score || (!selected && score === 1) ? '0' : '-1'}"><span class="rate-mark" aria-hidden="true">★</span><span class="rate-num">${num(score)}</span><span class="rate-word">${t('rate' + score)}</span></button>`).join('')}</div><p class="ratingchoice" aria-live="polite">${esc(choiceText())}</p><p class="formerror" id="ratingerror" role="alert"></p><div class="actions"><button class="btn" type="button" id="saverating" ${selected ? '' : 'disabled'}>${t('saveRating')}</button><button class="btn secondary" type="button" id="skiprating">${t('skipRating')}</button></div>`; wire(); };
  const focusStar = score => dialog.querySelector(`[data-rating="${score}"]`)?.focus();
  async function skip() {
    if (saving || state.ratingValue) return;
    saving = true;
    try { const result = await api('/api/feedback', 'POST', { conversation_id: state.conversation, action: 'skip' }); state.skipped = !!result.skipped; state.ratingValue = result.rating ?? null; dialog.close(); }
    catch (error) { saving = false; const box = $('#ratingerror'); if (box) box.textContent = error.message; }
  }
  async function save() {
    if (saving || !selected) return;
    saving = true; const choice = selected;
    try { const result = await api('/api/feedback', 'POST', { conversation_id: state.conversation, rating: choice }); state.ratingValue = result.rating; state.skipped = !!result.skipped; dialog.close(); toast(t('ratingSavedValue', { n: num(result.rating), total: num(5), label: t('rate' + result.rating) })); }
    catch (error) { saving = false; selected = choice; paint(); const box = $('#ratingerror'); if (box) box.textContent = error.message; focusStar(choice); }
  }
  function wire() {
    $('.close', dialog).onclick = skip;
    dialog.querySelectorAll('[data-rating]').forEach(button => {
      button.onclick = () => { selected = Number(button.dataset.rating); paint(); focusStar(selected); };
      button.onkeydown = event => {
        const current = Number(button.dataset.rating);
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1;
          selected = Math.min(5, Math.max(1, (selected || current) + delta));
          paint(); focusStar(selected);
        }
      };
    });
    $('#saverating').onclick = save;
    $('#skiprating').onclick = skip;
  }
  dialog.oncancel = event => { event.preventDefault(); skip(); };
  paint();
  if (!dialog.open) dialog.showModal();
  focusStar(1);
}

function addArticleModal() {
  modal(t('addTitle'), `<form id="articleform"><label>${t('articleTitle')}</label><input name="title" required maxlength="150"><label>${t('colCategory')}</label><select name="category">${catKeys.map(key => `<option value="${key}">${catName(key)}</option>`).join('')}</select><label>${t('articleBody')}</label><textarea name="body" required maxlength="8000" placeholder="${esc(t('articlePh'))}"></textarea><label>${t('articleEn')}</label><input name="title_en" maxlength="150"><label>${t('articleBodyEn')}</label><textarea name="body_en" maxlength="8000"></textarea><p class="small muted">${t('articleHelp')}</p><button class="btn" style="margin-top:15px">${t('addArticle')}</button></form>`);
  $('#articleform').onsubmit = async event => { event.preventDefault(); const button = $('button', event.target); button.disabled = true; try { await api('/api/articles', 'POST', Object.fromEntries(new FormData(event.target))); await refresh(); $('#dialog').close(); render(); toast(t('articleAdded')); } catch (error) { toast(error.message); button.disabled = false; } };
}
const normalizeSearch = text => String(text).toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
function filterKnowledge() {
  if (!$('#knowledgesearch')) return; const query = normalizeSearch($('#knowledgesearch').value).trim().split(/\s+/).filter(Boolean); const category = $('#knowledgecategory').value; let count = 0;
  document.querySelectorAll('.article[data-search]').forEach(card => { const text = normalizeSearch(card.dataset.search); const show = (!category || card.dataset.category === category) && query.every(term => text.includes(term)); card.hidden = !show; if (show) count++; });
  $('#knowledgecount').textContent = count === 1 ? t('topicCountOne') : t('topicCount', { n: num(count) }); $('#knowledgeempty').hidden = count !== 0;
}
document.addEventListener('input', event => { if (event.target.id === 'knowledgesearch') filterKnowledge(); });
document.addEventListener('change', event => { if (event.target.id === 'knowledgecategory') filterKnowledge(); });
applyLanguage(localStorage.getItem('atal-lang') || 'ar');
applyTheme(localStorage.getItem('atal-theme') || 'system', false);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.theme === 'system') retint(() => applyTheme('system', false)); });
boot();
