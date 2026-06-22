const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const marker = '<script>\n        // Translations';
const open = html.indexOf(marker);
const close = html.indexOf('</script>', open);
if (open < 0 || close < 0) {
    throw new Error('Main app script block not found');
}

const js = html.slice(open + '<script>'.length, close).trim();
fs.writeFileSync(path.join(__dirname, '..', 'public', 'app.js'), `${js}\n`);

const updated = `${html.slice(0, open)}<script src="/app.js" defer></script>${html.slice(close + '</script>'.length)}`;
fs.writeFileSync(htmlPath, updated);
console.log(`Extracted ${js.length} chars → public/app.js`);
