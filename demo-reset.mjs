import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetDemoFiles } from './demo-data.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
try {
  resetDemoFiles(root);
} catch (error) {
  console.error(error.code === 'DEMO_PATH_REFUSED' ? error.message : `تعذر إعادة وضع العرض. أوقف npm run demo ثم أعد المحاولة. ${error.message}`);
  process.exit(1);
}
process.env.DEMO_MODE = '1';
process.env.DATA_DIR = path.join(root, 'data', 'demo');
const { db } = await import('./server.mjs');
const { seedDemo } = await import('./demo-data.mjs');
seedDemo(db);
db.close();
console.log('أُعيد وضع العرض إلى حالته الأصلية داخل data/demo. لم تُمس قاعدة البيانات الأساسية.');
