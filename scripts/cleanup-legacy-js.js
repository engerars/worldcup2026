const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jsDir = path.join(root, 'public', 'js');
if (fs.existsSync(jsDir)) {
  for (const file of fs.readdirSync(jsDir)) {
    fs.unlinkSync(path.join(jsDir, file));
  }
  fs.rmdirSync(jsDir);
  console.log('Removed legacy public/js/');
}

const publicDir = path.join(root, 'public');
const indexPath = path.join(publicDir, 'index.html');
const assetsDir = path.join(publicDir, 'assets');

if (fs.existsSync(indexPath) && fs.existsSync(assetsDir)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const referenced = new Set(
    [...indexHtml.matchAll(/\/assets\/([^\s"'?#]+)/g)].map((match) => match[1])
  );

  for (const file of fs.readdirSync(assetsDir)) {
    if (!referenced.has(file)) {
      fs.unlinkSync(path.join(assetsDir, file));
      console.log(`Removed stale asset public/assets/${file}`);
    }
  }
}
