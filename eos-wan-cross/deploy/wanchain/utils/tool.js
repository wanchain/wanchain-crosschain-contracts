const fs = require('fs');
const path = require('path');
const cfg = require('../config.json')

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

const getOutputPath = (type) => {
  if (type == 'nonce') {
    return path.join(__dirname, "../nonce.json");
  } else if (type == 'contractAddress') {
    return path.join(__dirname, "../contractAddress.json");
  } else if (type == 'txData') {  // folder
    return path.join(__dirname, "../txData/");
  } else {
    return path.join(__dirname, "..");
  }
}

const str2hex = (str) => {
  let content = new Buffer.from(str).toString('hex');
  return '0x' + content;
}

const getNonce = (role) => {
  let nonce = JSON.parse(readFromFile(getOutputPath('nonce')));
  return nonce[cfg[role]];
}

const updateNonce = (role, nonce) => {
  let n = {};
  try {
    n = JSON.parse(readFromFile(getOutputPath('nonce')));
  } catch {}
  n[cfg[role]] = nonce;
  write2file(getOutputPath('nonce'), JSON.stringify(n));
}

module.exports = {
  write2file,
  readFromFile,
  getOutputPath,
  str2hex,
  getNonce,
  updateNonce
}
