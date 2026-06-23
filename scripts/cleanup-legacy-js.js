const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '..', 'public', 'js');
if (fs.existsSync(jsDir)) {
  for (const file of fs.readdirSync(jsDir)) {
    fs.unlinkSync(path.join(jsDir, file));
  }
  fs.rmdirSync(jsDir);
  console.log('Removed legacy public/js/');
}
