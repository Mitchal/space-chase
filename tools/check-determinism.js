// Static determinism check for game/: a run must replay to the same bits on any engine (core/replay-run.js), and the
// leaderboard Worker must be able to load the simulation with no screen.
//   1. No Math.random anywhere in game/ (outside legacy/): the simulation draws from the run's seed
//      (core/course-seed.js), decoration from its own stream (core/visual-random.js).
//   2. Simulation code, meaning every file reachable by imports from core/sim-kernel.js, core/replay-run.js and each
//      pod's sim.js (and bots/bot-run.js, which tests run headlessly), uses only exact math: no Math.sin, cos, atan2,
//      hypot, pow, exp, log… and no ** (core/det-math.js has deterministic versions). Engines may round those
//      differently in the last bit.
//   3. Simulation code reads no clock, screen, storage or browser API (Date, performance, document, window,
//      localStorage, Intl, timers, toLocaleString…), and reaches no file marked `// host-only` at its top.
// Usage: node tools/check-determinism.js   (exit code 1 on any violation)
const fs = require('fs'), path = require('path');
const GAME = path.join(__dirname, '..', 'game');
const SKIP = new Set(['legacy']);

const UNSAFE_MATH = /\bMath\.(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|exp|expm1|log|log1p|log2|log10|pow|hypot|cbrt|fround|random)\b/g;
const POWER = /\*\*/g;
const HOST_API = /\b(Date|performance|document|window|globalThis|self|localStorage|sessionStorage|navigator|location|matchMedia|requestAnimationFrame|setTimeout|setInterval|addEventListener|crypto|fetch|innerWidth|innerHeight|devicePixelRatio|Intl|toLocaleString|toLocaleLowerCase|toLocaleUpperCase|localeCompare)\b/g;

function jsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    if (SKIP.has(d.name)) return [];
    const p = path.join(dir, d.name);
    return d.isDirectory() ? jsFiles(p) : d.name.endsWith('.js') ? [p] : [];
  });
}
const rel = p => path.relative(GAME, p).split(path.sep).join('/');

// The source with comments blanked and string/regex contents emptied (template expressions are kept: they're code).
function codeOnly(src) {
  let out = '', i = 0, prev = '';
  const stack = []; // open template literals, each with the brace depth of its current ${ … }
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { const end = src.indexOf('*/', i + 2); i = end < 0 ? src.length : end + 2; out += ' '; continue; }
    if (c === '"' || c === "'") {
      i++; while (i < src.length && src[i] !== c) i += src[i] === '\\' ? 2 : 1;
      i++; out += c + c; prev = c; continue;
    }
    if (c === '`' || (c === '}' && stack.length && stack[stack.length - 1] === 0)) {
      if (c === '}') stack.pop();
      i++;
      while (i < src.length && src[i] !== '`' && !(src[i] === '$' && src[i + 1] === '{')) i += src[i] === '\\' ? 2 : 1;
      if (src[i] === '$') { stack.push(0); i += 2; out += '`${'; } else { i++; out += '``'; }
      prev = '`'; continue;
    }
    if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]|^$/.test(prev)) { // a regex literal
      i++; let cls = false;
      while (i < src.length && (src[i] !== '/' || cls)) { if (src[i] === '[') cls = true; else if (src[i] === ']') cls = false; i += src[i] === '\\' ? 2 : 1; }
      i++; out += '/./'; prev = '/'; continue;
    }
    if (stack.length && c === '{') stack[stack.length - 1]++;
    if (stack.length && c === '}') stack[stack.length - 1]--;
    out += c; if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}

const importsOf = src => [...src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\s*\(\s*['"`]([^'"`$]+)/g)]
  .map(m => m[1] || m[2] || m[3]).filter(s => s.startsWith('.'));
const lineOf = (src, index) => src.slice(0, index).split('\n').length;

const errors = [];
const files = jsFiles(GAME), code = new Map(files.map(f => [f, codeOnly(fs.readFileSync(f, 'utf8'))]));

// 1. Math.random anywhere.
for (const [file, src] of code) for (const m of src.matchAll(/\bMath\.random\b/g)) errors.push(`${rel(file)}:${lineOf(src, m.index)} uses Math.random`);

// 2 + 3. Everything the simulation can reach.
const roots = [path.join(GAME, 'core', 'sim-kernel.js'), path.join(GAME, 'core', 'replay-run.js'), path.join(GAME, 'pods', 'bots', 'bot-run.js'),
  ...fs.readdirSync(path.join(GAME, 'pods')).map(n => path.join(GAME, 'pods', n, 'sim.js'))].filter(f => fs.existsSync(f));
const reached = new Map(); // file → the file that imported it
const queue = roots.map(r => [r, null]);
while (queue.length) {
  const [file, from] = queue.shift();
  if (reached.has(file)) continue;
  if (!fs.existsSync(file)) { errors.push(`${from ? rel(from) : '?'} imports a missing file: ${rel(file)}`); continue; }
  reached.set(file, from);
  const raw = fs.readFileSync(file, 'utf8');
  for (const spec of importsOf(raw)) queue.push([path.resolve(path.dirname(file), spec), file]);
}
const via = f => reached.get(f) ? ` (reached from ${rel(reached.get(f))})` : '';
for (const file of reached.keys()) {
  const raw = fs.readFileSync(file, 'utf8'), src = code.get(file) ?? codeOnly(raw);
  if (/^\/\/\s*host-only\b/.test(raw)) { errors.push(`${rel(file)} is host-only but the simulation imports it${via(file)}`); continue; }
  for (const m of src.matchAll(UNSAFE_MATH)) if (m[1] !== 'random') errors.push(`${rel(file)}:${lineOf(src, m.index)} uses Math.${m[1]} in simulation code (core/det-math.js)${via(file)}`);
  for (const m of src.matchAll(POWER)) errors.push(`${rel(file)}:${lineOf(src, m.index)} uses ** in simulation code (core/det-math.js)${via(file)}`);
  for (const m of src.matchAll(HOST_API)) errors.push(`${rel(file)}:${lineOf(src, m.index)} uses ${m[1]} in simulation code${via(file)}`);
}

for (const e of errors) console.log('ERROR', e);
console.log(errors.length ? `${errors.length} violation(s).`
  : `OK: deterministic (${reached.size} simulation files of ${files.length} checked).`);
process.exit(errors.length ? 1 : 0);
