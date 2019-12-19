const utils = require('../utils')
const address = require('../address');

async function deployLib() {
  let compiled, deployed;

  // HTLCLib
  compiled = utils.compileContract('HTLCLib.sol');
  deployed = await utils.deployContract('HTLCLib', compiled['HTLCLib.sol:HTLCLib']);
  if (deployed) {
    address.addContractAddress('HTLCLib', deployed._address);
  } else {
    return;
  }

  // QuotaLib
  compiled = utils.compileContract('QuotaLib.sol');
  deployed = await utils.deployContract('QuotaLib', compiled['QuotaLib.sol:QuotaLib']);
  if (deployed) {
    address.addContractAddress('QuotaLib', deployed._address);
  } else {
    return;
  }  

  // Secp256k1
  compiled = utils.compileContract('Secp256k1.sol');
  deployed = await utils.deployContract('Secp256k1', compiled['Secp256k1.sol:Secp256k1']);
  if (deployed) {
    address.addContractAddress('Secp256k1', deployed._address);
  } else {
    return;
  }

  // SchnorrVerifier
  compiled = utils.compileContract('SchnorrVerifier.sol');
  compiled = compiled['SchnorrVerifier.sol:SchnorrVerifier'];
  utils.linkContract(compiled, ['Secp256k1']);
  deployed = await utils.deployContract('SchnorrVerifier', compiled);
  if (deployed) {
    address.addContractAddress('SchnorrVerifier', deployed._address);
  } else {
    return;
  }

  // HTLCUserLib
  compiled = utils.compileContract('HTLCUserLib.sol');
  compiled = compiled['HTLCUserLib.sol:HTLCUserLib'];
  utils.linkContract(compiled, ['QuotaLib', 'HTLCLib']);
  deployed = await utils.deployContract('HTLCUserLib', compiled);
  if (deployed) {
    address.addContractAddress('HTLCUserLib', deployed._address);
  } else {
    return;
  }
  
  // HTLCDebtLib
  compiled = utils.compileContract('HTLCDebtLib.sol');
  compiled = compiled['HTLCDebtLib.sol:HTLCDebtLib'];
  utils.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  deployed = await utils.deployContract('HTLCDebtLib', compiled);
  if (deployed) {
    address.addContractAddress('HTLCDebtLib', deployed._address);
  } else {
    return;
  }

  // HTLCSmgLib
  compiled = utils.compileContract('HTLCSmgLib.sol');
  compiled = compiled['HTLCSmgLib.sol:HTLCSmgLib'];
  utils.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib']);
  deployed = await utils.deployContract('HTLCSmgLib', compiled);
  if (deployed) {
    address.addContractAddress('HTLCSmgLib', deployed._address);
  } else {
    return;
  }

  console.log("depolyed contracts: %O", address.getContractAddress());
}

deployLib();