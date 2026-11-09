import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './load-env.mjs';

loadEnv(path.dirname(fileURLToPath(import.meta.url)));
process.env.PORT ||= '3002';
process.env.HOST ||= '127.0.0.1';
const {server}=await import('./server.mjs');
server.listen(Number(process.env.PORT),process.env.HOST,()=>console.log(`Current ATAL: http://127.0.0.1:${process.env.PORT}`));
