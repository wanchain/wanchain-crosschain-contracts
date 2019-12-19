const path = require('path');
const solc = require('solc');
const linker = require('solc/linker')
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
const source = require('./source');
const address = require('./address');

const deployAddr = '0x574EC77cb2905515E1e218014819a38119324a56';
const gasEstimate = 5000000;

function getImport(filePath) {
  let fileName = path.basename(filePath);
  let content = source[fileName];
  if (content) {
    return {contents: source[fileName]};
  } else {
    return {error: 'File not found'}
  }
}

function getLibAddress(libs, refs) {
  /* IMPORTANT !!!
     libs is contract name, refs contains relative path, and has max 36 chars
     make sure contract has short name and relative path
  */
  let result = {};
  if (libs && libs.length > 0) {
    for (var ref in refs) {
      libs.forEach(lib => {
        if (ref.indexOf(lib) >= 0) {
          result[ref] = address.getContractAddress(lib);
        }
      })      
    }
  }
  // console.log("getLibAddress: %O", result);
  return result;
}

const compileContract = (fileName) => {
  let input = {};
  input[fileName] = source[fileName];
  let output = solc.compile({sources: input}, 1, getImport);
  return output.contracts;
}

const linkContract = (compiled, libs) => {
  let refs = linker.findLinkReferences(compiled.bytecode);
  // console.log("findLinkReferences: %O", refs);
  compiled.bytecode = linker.linkBytecode(compiled.bytecode, getLibAddress(libs, refs));
}

const deployContract = async (contractName, compiled) => {
  let contact = new web3.eth.Contract(JSON.parse(compiled.interface), {data: '0x' + compiled.bytecode});
  try {
    let inst = await contact.deploy()
                            .send({from: deployAddr, gas: gasEstimate})
                            .on('transactionHash', txHash => {
                              console.log("deploy %s txHash: %s", contractName, txHash);
                            });
    return inst;
  } catch(err) {
    console.log("deploy %s failed: %O", contractName, err);
    return null;
  }
}

module.exports = {
  compileContract,
  linkContract,
  deployContract
}
