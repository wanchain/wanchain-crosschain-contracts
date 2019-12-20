const cfg = require('../config.json');
const path = require('path');
const tool = require('./tool');
const solc = require('solc');
const linker = require('solc/linker')
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
const source = require('../source');
const contractAddress = require('../contractAddress');
const keythereum = require('keythereum');
const wanUtil = require('wanchain-util');
// const Tx = wanUtil.wanchainTx;
const Tx = require('ethereumjs-tx');

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
          result[ref] = contractAddress.getAddress(lib);
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
  let contract = new web3.eth.Contract(JSON.parse(compiled.interface), {data: '0x' + compiled.bytecode});
  try {
    let inst = await contract.deploy()
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

const getNonce = async (address) => {
  let nonce = await web3.eth.getTransactionCount(address);
  console.log("getNonce: %s, %d", address, nonce);
  return nonce;
}

const getDeployContractTxData = async (compiled) => {
  let contract = new web3.eth.Contract(JSON.parse(compiled.interface), {data: '0x' + compiled.bytecode});
  return await contract.deploy().encodeABI();
}

const serializeTx = async (data, nonce, contractAddr, value, filePath, priv) => {
  console.log("txdata=" + data);
  if (0 != data.indexOf('0x')){
    data = '0x' + data;
  }

  value = web3.utils.toWei(value, 'ether');
  value = new web3.utils.BN(value);
  value = '0x' + value.toString(16);
  nonce = '0x' + nonce.toString(16);

  rawTx = {
      // Txtype: 0x01,
      nonce: nonce,
      gasPrice: cfg.gasPrice,
      // gas: cfg.gas,
      gasLimit: cfg.gasLimit,
      to: contractAddr,
      value: value,
      // from: keythereum.privateKeyToAddress(priv),
      data: data
  };
  console.log("rawTx: %O", rawTx)

  tx = new Tx(rawTx);
  tx.sign(priv);

  let serialized = tx.serialize();
  console.log("serialized tx: " + serialized.toString('hex'));
  tool.write2file(filePath, serialized.toString('hex'));
  // let result = await web3.eth.sendSignedTransaction('0x' + serialized.toString('hex'));
  // console.log("offline serializeTx test: ", result)
}

const sendSerializedTx = async (filePath) => {
  let serialized = tool.readFromFile(filePath);
  let receipt = await web3.eth.sendSignedTransaction('0x' + serialized.toString('hex'));
  return receipt.transactionHash;
}

const waitReceipt = async (txHash, waitBlocks, isDeploySc) => {
  console.log("waitReceipt txHash %d: %s", waitBlocks, txHash);
  if (waitBlocks == 0) {
    return null;
  }
  let receipt = await web3.eth.getTransactionReceipt(txHash);
  if (receipt) {
    if (isDeploySc) {
      if (receipt.status) {
        return receipt.contractAddress;
      } else {
        return null;
      }
    } else {
      return (receipt.status == 0x1);
    }
  } else {
    return await waitReceipt(txHash, waitBlocks - 1, isDeploySc);
  }
}

const getDeployedContract = async (fileName, contractName, address) => {
  let compiled = compileContract(fileName);
  let key = fileName + ':' + contractName;
  let contract = new web3.eth.Contract(JSON.parse(compiled[key].interface));
  return contract.at(address);
}

module.exports = {
  compileContract,
  linkContract,
  deployContract,
  getNonce,
  getDeployContractTxData,
  serializeTx,
  sendSerializedTx,
  waitReceipt,
  getDeployedContract
}
