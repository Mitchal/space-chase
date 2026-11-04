// Serves the game and appends each run's reaction to data/taste-log.jsonl.
// Local only by default; LURE_HOST=0.0.0.0 opens it to the home network (e.g. to play on a phone).
// LURE_DIST=1 serves the player build (dist/, from tools/build-web.js) on port 8766 instead, as a plain static host.
// LURE_PORT picks another port (e.g. when an old server still holds the default one).
const http = require('http'), fs = require('fs'), path = require('path');
const HOST = process.env.LURE_HOST || '127.0.0.1', DIST = !!process.env.LURE_DIST, PORT = +process.env.LURE_PORT || (DIST ? 8766 : 8765);
const ROOT = path.join(__dirname, DIST ? 'dist' : 'game');
const LOG = path.join(__dirname, 'data', 'taste-log.jsonl');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.apk': 'application/vnd.android.package-archive' };
fs.mkdirSync(path.dirname(LOG), { recursive: true });

const readLog = () => fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];

http.createServer((req, res) => {
  if (DIST) return serveFile(req, res);
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
  serveFile(req, res);
}).listen(PORT, HOST, () => console.log(`Space Chase${DIST ? ' (player build)' : ''} on http://${HOST}:${PORT}`));

function serveFile(req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  // The Android build (npm run android) is offered for download next to the game: open /space-chase.apk on the phone.
  const file = p === '/space-chase.apk' ? path.join(__dirname, 'release', 'space-chase.apk') : path.join(ROOT, p);
  if (!file.startsWith(ROOT) && p !== '/space-chase.apk') return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}
