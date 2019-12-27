const fs = require('fs');
const path = require('path');
const keythereum = require('keythereum');
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
  let address = cfg.account[role].address;
  if (cfg.mode == 'debug') {
    address = cfg.debug[role].address;
  }
  return nonce[address];
}

const updateNonce = (role, nonce) => {
  let n = {};
  let address = cfg.account[role].address;
  if (cfg.mode == 'debug') {
    address = cfg.debug[role].address;
  }  
  try {
    n = JSON.parse(readFromFile(getOutputPath('nonce')));
  } catch {}
  n[address] = nonce;
  write2file(getOutputPath('nonce'), JSON.stringify(n));
}

const getPrivateKey = (role) => {
  let dir = path.join(__dirname, "../keystore/" + role);
  let files = fs.readdirSync(dir);
  let keystore = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
  let privateKey = keythereum.recover(cfg.account[role].keystorePwd, keystore);
  return privateKey;
}

module.exports = {
  write2file,
  readFromFile,
  getOutputPath,
  str2hex,
  getNonce,
  updateNonce,
  getPrivateKey
}
