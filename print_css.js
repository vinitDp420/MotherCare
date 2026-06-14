const fs = require('fs');
const path = require('path');
const dir = './frontend/dist/assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));
const css = fs.readFileSync(path.join(dir, files[0]), 'utf8');

const regexes = [
  /\.p-margin-desktop\{[^}]+\}/g,
  /\.py-sm\{[^}]+\}/g,
  /\.text-title-lg\{[^}]+\}/g,
  /\.max-w-md\{[^}]+\}/g,
  /\.text-\[20px\]\{[^}]+\}/g
];

for (const regex of regexes) {
  const matches = css.match(regex);
  if (matches) {
    console.log(`Match for ${regex}:`);
    matches.forEach(m => console.log(m));
  } else {
    console.log(`No match for ${regex}`);
  }
}
