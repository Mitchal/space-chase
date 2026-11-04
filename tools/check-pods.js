// Static architecture check for game/: pods must be removable.
//   1. Nothing outside a pod imports from pods/ (the kernel discovers pods at runtime).
//   2. A pod imports only from core/ or from inside its own folder (no sideways pod-to-pod imports).
//   3. Files stay small: warn above 200 lines.
// Usage: node tools/check-pods.js   (exit code 1 on any violation)
const fs = require('fs'), path = require('path');
const GAME = path.join(__dirname, '..', 'game');
const MAX_LINES = 200;
const SKIP = new Set(['legacy']);

function jsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    if (SKIP.has(d.name)) return [];
    const p = path.join(dir, d.name);
    return d.isDirectory() ? jsFiles(p) : d.name.endsWith('.js') ? [p] : [];
  });
}

// Static `import … from`, `export … from`, bare side-effect `import '…'`, and literal dynamic `import('…')`.
const importsOf = src => [...src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\s*\(\s*['"`]([^'"`$]+)/g)]
  .map(m => m[1] || m[2] || m[3]);
const rel = p => path.relative(GAME, p).split(path.sep).join('/');
const podOf = p => { const r = rel(p).split('/'); return r[0] === 'pods' ? r[1] : null; };

const errors = [], warnings = [];
for (const file of jsFiles(GAME)) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n').length;
  if (lines > MAX_LINES) warnings.push(`${rel(file)}: ${lines} lines (aim for ≤ ${MAX_LINES})`);
  const myPod = podOf(file);
  for (const spec of importsOf(src)) {
    if (!spec.startsWith('.')) continue;
    const target = path.resolve(path.dirname(file), spec);
    const targetRel = rel(target), targetPod = podOf(target);
    if (!myPod && targetPod) errors.push(`${rel(file)} imports pod internals: ${spec}`);
    if (myPod && targetPod && targetPod !== myPod) errors.push(`${rel(file)} imports another pod (${targetPod}): ${spec}`);
    if (myPod && !targetPod && !targetRel.startsWith('core/')) errors.push(`${rel(file)} imports outside core/: ${spec}`);
  }
}

for (const w of warnings) console.log('warn ', w);
for (const e of errors) console.log('ERROR', e);
console.log(errors.length ? `${errors.length} violation(s).` : `OK: pods are removable (${jsFiles(GAME).length} files checked).`);
process.exit(errors.length ? 1 : 0);
