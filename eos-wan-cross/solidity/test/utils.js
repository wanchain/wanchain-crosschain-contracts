
function sha256(message) {
  const crypto=require('crypto');
  return crypto.createHash('SHA256').update(message, "utf8").digest('hex');
}

function keccak(message) {
  const keccak = require('keccak');
  return keccak('keccak256').update(message).digest('hex');
}

function newContract(contract, ...args) {
  const deployment = contract.new(...args);
  return new web3.eth.Contract(contract.abi, deployment.address);
}

function newContractAt(contract, address) {
  return new web3.eth.Contract(contract.abi, address);
}

function contractAt(contract, address) {
  return contract.at(address);
}

async function deployContract(contract, ...args) {
  const deployment = await contract.new(...args);
  return contract.at(deployment.address);
}

function linkLibrary(contract, ...args) {
  let isInstance = (args.length === 1);
  if (isInstance) {
    // 0: libInstance
    return contract.link(args[0]);
  }
  // 0: libName, 1: libAddress
  return contract.link(args[0], args[1]);
}

/**
 * {
 *   "libName": libAddress
 * }
 */
function linkMultiLibrary(contract, libs) {
  return contract.link(libs);
}

module.exports = {
  sha256: sha256,
  keccak: keccak,
  newContract: newContract,
  newContractAt: newContractAt,
  contractAt: contractAt,
  deployContract: deployContract,
  linkLibrary: linkLibrary,
  linkMultiLibrary: linkMultiLibrary,
};