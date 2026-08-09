const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function walk(dir, cb) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'docs') continue;
      walk(full, cb);
    } else {
      cb(full);
    }
  }
}

const extsTs = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const extsCss = new Set(['.css']);
const root = process.cwd();
const changed = [];
walk(root, (file) => {
  const rel = path.relative(root, file);
  if (rel.startsWith('docs') || rel.startsWith('node_modules') || rel.startsWith('.git') || rel.startsWith('tools')) return;
  const ext = path.extname(file);
  try {
    if (extsTs.has(ext)) {
      const src = fs.readFileSync(file, 'utf8');
      const result = ts.transpileModule(src, {
        compilerOptions: {
          removeComments: true,
          jsx: ext === '.tsx' || ext === '.jsx' ? ts.JsxEmit.Preserve : undefined,
          target: ts.ScriptTarget.ESNext,
        },
        fileName: file,
      });
      const out = result.outputText;
      if (out !== src) {
        fs.writeFileSync(file, out, 'utf8');
        changed.push(rel);
      }
    } else if (extsCss.has(ext)) {
      let src = fs.readFileSync(file, 'utf8');
      const out = src.replace(/\/\*[\s\S]*?\*\//g, '');
      if (out !== src) {
        fs.writeFileSync(file, out, 'utf8');
        changed.push(rel);
      }
    }
  } catch (e) {
    console.error('error', file, e.message);
  }
});
console.log('changed', changed.length);
changed.forEach(f=>console.log(' -', f));
