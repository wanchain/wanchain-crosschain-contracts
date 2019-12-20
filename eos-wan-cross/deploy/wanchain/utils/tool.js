const fs = require('fs');
const path = require('path');

const createFolder = (filePath) => { 
  var sep = path.sep
  var folders = path.dirname(filePath).split(sep);
  var p = '';
  while (folders.length) {
    p += folders.shift() + sep;
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
    }
  }
}

const write2file = (filePath, content) => {
  createFolder(filePath);
  fs.writeFileSync(filePath, content, {flag: 'w', encoding: 'utf-8', mode: '0666'})
}

const readFromFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
  write2file,
  readFromFile
}
