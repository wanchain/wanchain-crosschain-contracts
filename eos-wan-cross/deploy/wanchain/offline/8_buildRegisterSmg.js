const path = require('path');
const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');
const smgArray = require('../smg.json');

const txDataDir = tool.getOutputPath('txData');

async function buildRegisterSmg(privateKey) {
  let contract, txData, i;

  if (typeof(privateKey) == 'string') { // role
    privateKey = tool.getPrivateKey(privateKey);
  }  

  let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy');

  let smgDelegateNonce = tool.getNonce('smgDelegate');   

  contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
  for (i = 0; i < smgArray.length; i++) {
    let s = smgArray[i];
    txData = await contract.methods.storemanGroupRegister(s.tokenOrigAccount, s.storemanGroup, s.txFeeRatio).encodeABI();
    scTool.serializeTx(txData, smgDelegateNonce++, smgProxyAddress, s.wanDeposit.toString(), path.join(txDataDir, "registerSmg" + s.tokenSymbol + ".dat"), privateKey);
  }

  // update smgDelegate nonce
  tool.updateNonce('smgDelegate', smgDelegateNonce);
}

if (cfg.mode == 'release') {
  buildRegisterSmg('smgDelegate'); // role or privateKey
} else { // 'debug'
  buildRegisterSmg(new Buffer.from(cfg.debug['smgDelegate'].privateKey, 'hex'));
}