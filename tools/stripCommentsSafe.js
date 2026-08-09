const fs = require('fs');
const path = require('path');
const strip = require('strip-comments');

function walk(dir, cb) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'docs') continue;
      walk(full, cb);
    } else cb(full);
  }
}

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css']);
const root = process.cwd();
const changed = [];
walk(root, (file) => {
  const rel = path.relative(root, file);
  if (rel.startsWith('docs') || rel.startsWith('node_modules') || rel.startsWith('.git') || rel.startsWith('tools')) return;
  const ext = path.extname(file);
  if (!exts.has(ext)) return;
  let src = fs.readFileSync(file, 'utf8');
  try {
    let out;
    if (ext === '.css') {
      out = src.replace(/\/\*[\s\S]*?\*\//g, '');
    } else {
      out = strip(src);
    }
    if (out !== src) {
      fs.writeFileSync(file, out, 'utf8');
      changed.push(rel);
    }
  } catch (e) {
    console.error('failed', rel, e.message);
  }
});
console.log('changed', changed.length);
changed.forEach(f => console.log(' -', f));
