const path = require('path');
const tool = require('./tool');
const solc = require('solc');
const linker = require('solc/linker')
const Web3 = require('web3');
const cfg = require('../config.json');
const source = require('../source');
const contractAddress = require('../contractAddress');
const keythereum = require('keythereum');
const wanUtil = require('wanchain-util');
const iwanSdk = require('iwan-sdk');
let Tx = wanUtil.wanchainTx;
let web3 = new Web3();
if (cfg.mode == 'debug') {
  Tx = require('ethereumjs-tx');
  web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545/'));
}

const iwanCfg = {
  options: {
    url: "apitest.wanchain.org",
    port: 8443,
    flag: "ws",
    version: "v3"
  },
  apiKey: "e43c0f18710ed763d73d87cff6458563b7b05e2b200fdcaab29f3ad468de438a",
  secretKey: "305d6d1a718eb9f63ebd03bd10acf7f02426bd353681f26afbc717ec4c2da09d"
};

const iwan = new iwanSdk(iwanCfg.apiKey, iwanCfg.secretKey, iwanCfg.options);

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

const compileContract = (name) => {
  let input = {};
  let fileName = name + ".sol";
  let key = fileName + ":" + name;
  input[fileName] = source[fileName];
  let output = solc.compile({sources: input}, 1, getImport);
  return output.contracts[key];
}

const linkContract = (compiled, libs) => {
  let refs = linker.findLinkReferences(compiled.bytecode);
  // console.log("findLinkReferences: %O", refs);
  compiled.bytecode = linker.linkBytecode(compiled.bytecode, getLibAddress(libs, refs));
}

const getDeployContractTxData = async (compiled) => {
  let contract = new web3.eth.Contract(JSON.parse(compiled.interface), {data: '0x' + compiled.bytecode});
  return await contract.deploy().encodeABI();
}

const serializeTx = (data, nonce, contractAddr, value, filePath, privateKey) => {
  // console.log("txdata=" + data);
  if (0 != data.indexOf('0x')){
    data = '0x' + data;
  }

  value = web3.utils.toWei(value, 'ether');
  value = new web3.utils.BN(value);
  value = '0x' + value.toString(16);

  rawTx = {
      Txtype: 0x01, // wanchain only
      nonce: nonce,
      gasPrice: cfg.gasPrice,
      gasLimit: cfg.gasLimit,
      to: contractAddr,
      value: value,
      from: keythereum.privateKeyToAddress(privateKey),
      data: data
  };
  // console.log("rawTx: %O", rawTx)

  tx = new Tx(rawTx);
  tx.sign(privateKey);
  let serialized = tx.serialize();
  // console.log("serialized tx: " + serialized.toString('hex'));
  if (filePath) {
    tool.write2file(filePath, serialized.toString('hex'));
    console.log("tx is serialized to %s", filePath);
    return true;
  } else {
    return serialized;
  }
}

const sendSerializedTx = async (tx) => {
  if (typeof(tx) == 'string') { // filePath
    tx = tool.readFromFile(tx);
  }
  let txData = '0x' + tx.toString('hex');
  if (cfg.mode == 'debug') {
    let receipt = await web3.eth.sendSignedTransaction(txData);
    return receipt.transactionHash;
  } else {
    let txHash = await iwan.sendRawTransaction('WAN', txData);
    return txHash;
  }
}

const waitReceipt = async (txHash, isDeploySc, times = 0) => {
  if (times >= 100) {
    return null;
  }
  let receipt = null;
  try {
    if (cfg.mode == 'debug') {
      receipt = await web3.eth.getTransactionReceipt(txHash);
    } else {
      receipt = await iwan.getTransactionReceipt('WAN', txHash);
    }
  } catch {
    // console.log("%s times %d no receipt", txHash, times);
  }
  if (receipt) {
    // console.log("%s times %d receipt: %O", txHash, times, receipt);
    if (isDeploySc) {
      if (receipt.status) {
        return receipt.contractAddress;
      } else {
        console.log("%s times %d receipt failed", txHash, times);
        return null;
      }
    } else {
      return (receipt.status == 0x1);
    }
  } else {
    return await waitReceipt(txHash, times + 1, isDeploySc);
  }
}

const deployContract = async (name, compiled, privateKey) => {
  let txData = await getDeployContractTxData(compiled);
  let nonce = await getNonce(keythereum.privateKeyToAddress(privateKey));
  let serialized = serializeTx(txData, nonce, '', '0', null, privateKey);
  let txHash = await sendSerializedTx(serialized);
  // console.log("deploy %s txHash: %s", name, txHash);
  let address = await waitReceipt(txHash, true);
  if (address) {
    console.log("deployed %s address: %s", name, address);
    return address;
  } else {
    console.log("deploy %s failed", name);
    return null;
  }
}

const getDeployedContract = async (name, address) => {
  let compiled = compileContract(name);
  return new web3.eth.Contract(JSON.parse(compiled.interface), address);
}

const getNonce = async (roleOrAddress) => {
  let nonce, address = '';
  if (roleOrAddress.length != 42) { // role
    address = cfg.account[roleOrAddress].address.toLowerCase();
    if (cfg.mode == 'debug') {
      address = cfg.debug[roleOrAddress].address;
    }
  } else {
    address = roleOrAddress;
  }
  if (cfg.mode == 'debug') {
    nonce = await web3.eth.getTransactionCount(address);
  } else {
    nonce = Number(await iwan.getNonce('WAN', address));
  }
  // console.log("getNonce: %s(%s), %d", roleOrAddress, address, nonce);
  return nonce;
}

const getTxLog = async (txHash, contract, eventName, eventIndex) => {
  let abi = contract._jsonInterface;
  let item, eventAbi = null;
  for (let i = 0; i < abi.length; i++) {
    item = abi[i];
    if ((item.type == 'event') && (item.name == eventName)) {
      eventAbi = item.inputs;
    }
  }
  if (eventAbi == null) {
    console.error("event %s not found", eventName);
    return null;
  }
  let receipt;
  if (cfg.mode == 'debug') {
    receipt = await web3.eth.getTransactionReceipt(txHash);
  } else {
    receipt = await iwan.getTransactionReceipt('WAN', txHash);
  } 
  let log = await web3.eth.abi.decodeLog(eventAbi, receipt.logs[eventIndex].data, receipt.logs[eventIndex].topics);
  return log;
}

const wan2win = (wan) => {
  return web3.utils.toWei(wan.toString(), 'ether');
}

module.exports = {
  compileContract,
  linkContract,
  getDeployContractTxData,
  serializeTx,
  sendSerializedTx,
  waitReceipt,
  deployContract,
  getDeployedContract,
  getNonce,
  getTxLog,
  wan2win
}