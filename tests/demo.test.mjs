import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { assertDemoPath, resetDemoFiles, seedDemo } from '../demo-data.mjs';

test('إعادة وضع العرض ترفض الأساس ولا تكرره', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'atal-demo-root-'));
  mkdirSync(path.join(root, 'data', 'demo'), { recursive: true });
  writeFileSync(path.join(root, 'data', 'atal.db'), 'primary');
  writeFileSync(path.join(root, 'data', 'demo', 'atal.db'), 'demo');
  assert.throws(() => assertDemoPath(path.join(root, 'data'), root), error => error.code === 'DEMO_PATH_REFUSED');
  assert.throws(() => assertDemoPath(path.join(root, 'data', 'atal.db'), root), error => error.code === 'DEMO_PATH_REFUSED');
  resetDemoFiles(root);
  assert.equal(readFileSync(path.join(root, 'data', 'atal.db'), 'utf8'), 'primary');
  assert.equal(existsSync(path.join(root, 'data', 'demo', 'atal.db')), false);

  const temp = mkdtempSync(path.join(tmpdir(), 'atal-demo-db-'));
  process.env.DATA_DIR = temp;
  delete process.env.DEMO_MODE;
  const { server, db } = await import('../server.mjs');
  async function request(url, method = 'GET', body, cookie) {
    return await new Promise((resolve, reject) => {
      const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
      req.url = url; req.method = method; req.socket = { remoteAddress: 'demo-client' };
      req.headers = { host: 'localhost', ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) };
      const headers = {};
      const res = { headersSent: false, statusCode: 200, setHeader(key, value) { headers[key.toLowerCase()] = value; }, writeHead(status, extra) { this.statusCode = status; Object.entries(extra || {}).forEach(([key, value]) => this.setHeader(key, value)); this.headersSent = true; }, end(data) { try { resolve({ status: this.statusCode, json: JSON.parse(data || '{}'), cookie: headers['set-cookie']?.split(';')[0] }); } catch (error) { reject(error); } } };
      server.emit('request', req, res);
    });
  }
  try {
    seedDemo(db);
    seedDemo(db);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM users').get().c, 5);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM tickets').get().c, 5);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM conversations WHERE prepared=1').get().c, 1);
    const ages = db.prepare('SELECT created FROM tickets').all().map(row => Date.now() - new Date(row.created).getTime());
    assert.ok(ages.every(age => age >= 0 && age < 8 * 86400000));
    assert.equal((await request('/api/demo-login', 'POST', { role: 'employee' })).status, 404);
    process.env.DEMO_MODE = '1';
    const sara = await request('/api/demo-login', 'POST', { role: 'employee' });
    const khalid = await request('/api/demo-login', 'POST', { role: 'technician' });
    const noura = await request('/api/demo-login', 'POST', { role: 'admin' });
    assert.equal((await request('/api/session', 'GET', null, sara.cookie)).json.user.email, 'sara@atal-demo.test');
    assert.equal((await request('/api/tickets', 'GET', null, sara.cookie)).json.length, 2);
    assert.equal((await request('/api/tickets', 'GET', null, khalid.cookie)).json.length, 5);
    const dash = await request('/api/dashboard', 'GET', null, noura.cookie);
    assert.equal(dash.json.total, 5);
    assert.equal(dash.json.open, 4);
    assert.equal((await request('/api/dashboard', 'GET', null, sara.cookie)).status, 403);
    const outlook = db.prepare("SELECT id FROM tickets WHERE seed_key='outlook-attachments'").get().id;
    const detail = await request(`/api/tickets/${outlook}`, 'GET', null, sara.cookie);
    assert.equal(detail.json.conversation.prepared, true);
    assert.equal(detail.json.status, 'new');
    assert.equal(detail.json.assignee_id, null);
  } finally {
    delete process.env.DEMO_MODE;
    db.close();
    rmSync(temp, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
});
