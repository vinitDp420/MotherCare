const fs = require('fs');
const path = require('path');
const dir = './frontend/dist/assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));
const css = fs.readFileSync(path.join(dir, files[0]), 'utf8');

const regexes = [
  /\.max-w-md\{[^}]+\}/g,
  /\.max-w-lg\{[^}]+\}/g,
  /\.max-w-sm\{[^}]+\}/g,
  /\.max-w-xl\{[^}]+\}/g,
];

for (const regex of regexes) {
  const matches = css.match(regex);
  if (matches) {
    matches.forEach(m => console.log('✓', m));
  } else {
    console.log('NOT FOUND:', regex);
  }
}
