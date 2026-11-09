import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './load-env.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
loadEnv(root);
process.env.DEMO_MODE = '1';
process.env.DATA_DIR = path.join(root, 'data', 'demo');
process.env.HOST = process.env.HOST || '127.0.0.1';
if (!process.env.PORT) process.env.PORT = '3020';

const { server, db } = await import('./server.mjs');
const { seedDemo } = await import('./demo-data.mjs');
seedDemo(db);
const port = Number(process.env.PORT);
server.listen(port, process.env.HOST, () => console.log(`ATAL demo: http://127.0.0.1:${port} — fictional data, local only`));
