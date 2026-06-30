/**
 * copy-panel.js — copies public/panel into dist/panel after expo export
 */
const fs   = require('fs');
const path = require('path');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const src = path.resolve(__dirname, '../public/panel');
const dst = path.resolve(__dirname, '../dist/panel');

if (!fs.existsSync(src)) {
  console.error('public/panel not found — skipping copy');
  process.exit(0);
}

copyDir(src, dst);
console.log(`✅ Copied public/panel → dist/panel (${fs.readdirSync(dst).length} entries)`);
