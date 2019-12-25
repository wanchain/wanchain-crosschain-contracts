const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

// '0x574ec77cb2905515e1e218014819a38119324a56';
const devPrivateKey = new Buffer.from('2727714014292a6ee6d9047538c176df80205d98abcb736c70653b7f126ccfa5', 'hex');

async function deployLib(privateKey) {
  let compiled, address;

  // HTLCLib
  compiled = scTool.compileContract('HTLCLib');
  address = await scTool.deployContract('HTLCLib', compiled, privateKey);
  if (address) {
    contractAddress.setAddress('HTLCLib', address);
  } else {
    return false;
  }

  // QuotaLib
  compiled = scTool.compileContract('QuotaLib');
  address = await scTool.deployContract('QuotaLib', compiled, privateKey);
  if (address) {
    contractAddress.setAddress('QuotaLib', address);
  } else {
    return false;
  }

  // Secp256k1
  compiled = scTool.compileContract('Secp256k1');
  address = await scTool.deployContract('Secp256k1', compiled, privateKey);
  if (address) {
    contractAddress.setAddress('Secp256k1', address);
  } else {
    return false;
  }

  // SchnorrVerifier
  compiled = scTool.compileContract('SchnorrVerifier');
  scTool.linkContract(compiled, ['Secp256k1']);
  address = await scTool.deployContract('SchnorrVerifier', compiled, privateKey);
  if (address) {
    contractAddress.setAddress('SchnorrVerifier', address);
  } else {
    return false;
  }

  // HTLCUserLib
  compiled = scTool.compileContract('HTLCUserLib');
  scTool.linkContract(compiled, ['QuotaLib', 'HTLCLib']);
  address = await scTool.deployContract('HTLCUserLib', compiled, privateKey);
  if (address) {
    contractAddress.setAddress('HTLCUserLib', address);
  } else {
    return false;
  }
  
  // HTLCDebtLib
  compiled = scTool.compileContract('HTLCDebtLib');
  scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  address = await scTool.deployContract('HTLCDebtLib', compiled, privateKey);
  if (address) {
    contractAddress.setAddress('HTLCDebtLib', address);
  } else {
    return false;
  }

  // HTLCSmgLib
  compiled = scTool.compileContract('HTLCSmgLib');
  scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  address = await scTool.deployContract('HTLCSmgLib', compiled, privateKey);
  if (address) {
    contractAddress.setAddress('HTLCSmgLib', address);
  } else {
    return false;
  }
 
  return true;
}

deployLib(devPrivateKey);