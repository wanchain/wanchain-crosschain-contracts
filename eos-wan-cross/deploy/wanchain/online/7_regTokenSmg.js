const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');
const tokenArray = require('../token.json');
const smgArray = require('../smg.json');

const txDataDir = tool.getOutputPath('txData');
const tmProxyAddr = contractAddress.getAddress('TokenManagerProxy');

async function regToken(index) {
  if (index >= tokenArray.length) {
    // console.log("regToken finished");
    return true;
  }
  let symbol = tokenArray[index].symbol;
  let txFile = path.join(txDataDir, "regToken" + symbol + ".dat");
  let txHash = await scTool.sendSerializedTx(txFile);
  let success = await scTool.waitReceipt(txHash, 30, false);
  if (success) {
    let tm = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddr);
    let tokenInfo = await tm.methods.getTokenInfo(tokenArray[index].tokenOrigAccount).call();
    let address = tokenInfo[3];
    contractAddress.setAddress(symbol, address);
    console.log("registered %s token address: %s", symbol, address);
    return regToken(index + 1);
  } else {
    console.log("register %s token failed", symbol);
    return false;
  }
}

async function regSmg(index) {
  if (index >= smgArray.length) {
    // console.log("regSmg finished");
    return true;
  }
  let symbol = smgArray[index].tokenSymbol;
  let txFile = path.join(txDataDir, "regSmg" + symbol + ".dat");
  let txHash = await scTool.sendSerializedTx(txFile);
  let success = await scTool.waitReceipt(txHash, 30, false);
  if (success) {
    console.log("register storemanGroup for %s token success", symbol);
    return regSmg(index + 1);
  } else {
    console.log("register storemanGroup for %s token failed", symbol);
    return false;
  }
}

async function regTokenSmg() {
  // register token
  let success = await regToken(0);
  if (success == false) {
    return false;
  }
  // register smg
  return await regSmg(0);
}

regTokenSmg();