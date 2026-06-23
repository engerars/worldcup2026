const fs = require('fs');
const path = require('path');

const legacyPath = path.join(__dirname, '..', 'public', 'index.html');
const legacy = fs.readFileSync(legacyPath, 'utf8');
const headStart = legacy.indexOf('<head>') + 6;
let headEnd = legacy.indexOf('<!-- Umami');
if (headEnd === -1) headEnd = legacy.indexOf('</head>');
const head = legacy
  .slice(headStart, headEnd)
  .replace(/<script[^>]*\/assets\/[^>]*><\/script>/gi, '')
  .replace(/<link[^>]*\/assets\/[^>]*>/gi, '')
  .trim();
const analytics = legacy
  .slice(legacy.indexOf('<!-- Umami'), legacy.indexOf('</head>'))
  .replace(/<script[^>]*\/assets\/[^>]*><\/script>/gi, '')
  .replace(/<link[^>]*\/assets\/[^>]*>/gi, '')
  .trim();
const noscript = legacy.match(/<noscript>[\s\S]*?<\/noscript>/)[0];

const out = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
${head}
${analytics}
</head>
<body>
${noscript}
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '..', 'client', 'index.html'), out);
console.log('Wrote client/index.html');
