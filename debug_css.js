const fs = require('fs');
const path = require('path');
const dir = './frontend/dist/assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));
const css = fs.readFileSync(path.join(dir, files[0]), 'utf8');

// Check how max-w is compiled for an arbitrary known spacing key 
// Also check if there's a breakpoint prefix to understand compilation
const idx = css.indexOf('.max-w-md');
if (idx !== -1) {
  console.log('max-w-md context:', css.slice(idx, idx + 200));
}

// Also check if there is any --tw-* or @property for max-w
const propIdx = css.indexOf('max-width');
if (propIdx !== -1) {
  console.log('First max-width occurrence:', css.slice(Math.max(0, propIdx-50), propIdx+100));
}
