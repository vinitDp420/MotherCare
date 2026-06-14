const fs = require('fs');
const path = require('path');
const dir = './frontend/dist/assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));
const css = fs.readFileSync(path.join(dir, files[0]), 'utf8');

const checks = [
  '.p-margin-desktop',
  '.py-sm',
  '.text-title-lg',
  '.max-w-md',
  '.w-full'
];

for (const check of checks) {
  if (css.includes(check)) {
    console.log(`FOUND: ${check}`);
  } else {
    console.log(`MISSING: ${check}`);
  }
}
