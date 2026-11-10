process.env.DATA_DIR ||= '/tmp/atal';
const { server } = await import('../server.mjs');

export default function handler(req, res) {
  server.emit('request', req, res);
}
