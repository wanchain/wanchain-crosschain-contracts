const scTool = require('../utils/scTool')
const contractAddress = require('../contractAddress');

async function deployLib() {
  let compiled, deployed;

  // HTLCLib
  compiled = scTool.compileContract('HTLCLib');
  deployed = await scTool.deployContract('HTLCLib', compiled);
  if (deployed) {
    contractAddress.setAddress('HTLCLib', deployed._address);
  } else {
    return false;
  }

  // QuotaLib
  compiled = scTool.compileContract('QuotaLib');
  deployed = await scTool.deployContract('QuotaLib', compiled);
  if (deployed) {
    contractAddress.setAddress('QuotaLib', deployed._address);
  } else {
    return false;
  }

  // Secp256k1
  compiled = scTool.compileContract('Secp256k1');
  deployed = await scTool.deployContract('Secp256k1', compiled);
  if (deployed) {
    contractAddress.setAddress('Secp256k1', deployed._address);
  } else {
    return false;
  }

  // SchnorrVerifier
  compiled = scTool.compileContract('SchnorrVerifier');
  scTool.linkContract(compiled, ['Secp256k1']);
  deployed = await scTool.deployContract('SchnorrVerifier', compiled);
  if (deployed) {
    contractAddress.setAddress('SchnorrVerifier', deployed._address);
  } else {
    return false;
  }

  // HTLCUserLib
  compiled = scTool.compileContract('HTLCUserLib');
  scTool.linkContract(compiled, ['QuotaLib', 'HTLCLib']);
  deployed = await scTool.deployContract('HTLCUserLib', compiled);
  if (deployed) {
    contractAddress.setAddress('HTLCUserLib', deployed._address);
  } else {
    return false;
  }
  
  // HTLCDebtLib
  compiled = scTool.compileContract('HTLCDebtLib');
  scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  deployed = await scTool.deployContract('HTLCDebtLib', compiled);
  if (deployed) {
    contractAddress.setAddress('HTLCDebtLib', deployed._address);
  } else {
    return false;
  }

  // HTLCSmgLib
  compiled = scTool.compileContract('HTLCSmgLib');
  scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  deployed = await scTool.deployContract('HTLCSmgLib', compiled);
  if (deployed) {
    contractAddress.setAddress('HTLCSmgLib', deployed._address);
  } else {
    return false;
  }
 
  return true;
}

deployLib();