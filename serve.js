// Local only by default; LURE_HOST=0.0.0.0 opens it to the home network (e.g. to play on a phone).
const HOST = process.env.LURE_HOST || '127.0.0.1';
// Serves the game and appends each run's reaction to data/taste-log.jsonl.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, 'game');
const LOG = path.join(__dirname, 'data', 'taste-log.jsonl');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
fs.mkdirSync(path.dirname(LOG), { recursive: true });

const readLog = () => fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];

http.createServer((req, res) => {
  if (req.url === '/api/log' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { fs.appendFileSync(LOG, JSON.stringify(JSON.parse(body)) + '\n'); res.writeHead(204).end(); }
      catch { res.writeHead(400).end(); }
    });
    return;
  }
  // Pods are discovered from disk, so deleting a pod folder removes the feature with no code change.
  if (req.url === '/api/pods') {
    const dir = path.join(ROOT, 'pods');
    const pods = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => fs.existsSync(path.join(dir, n, 'pod.js'))).sort() : [];
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(pods));
  }
  if (req.url === '/api/log' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(readLog()));
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(8765, HOST, () => console.log(`Lure on http://${HOST}:8765`));
