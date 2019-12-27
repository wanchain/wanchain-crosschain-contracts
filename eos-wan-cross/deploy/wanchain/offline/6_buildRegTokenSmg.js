const path = require('path');
const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');
const tokenArray = require('../token.json');
const smgArray = require('../smg.json');

const txDataDir = tool.getOutputPath('txData');

async function buildRegTokenSmg(adminPrivateKey, smgDelegatePrivateKey) {
  let contract, txData, i;

  if (typeof(adminPrivateKey) == 'string') { // role
    adminPrivateKey = tool.getPrivateKey(adminPrivateKey);
  }

  if (typeof(smgDelegatePrivateKey) == 'string') { // role
    smgDelegatePrivateKey = tool.getPrivateKey(smgDelegatePrivateKey);
  }  

  let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
  let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy')

  /* 
   * build register token
   */

  let adminNonce = tool.getNonce('admin');

  contract = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
  for (i = 0; i < tokenArray.length; i++) {
    let t = tokenArray[i];
    txData = await contract.methods.addToken(t.tokenOrigAccount, t.token2WanRatio, scTool.wan2win(t.minDeposit), t.withdrawDelayTime,
                                      tool.str2hex(t.name), tool.str2hex(t.symbol), t.decimals)
                                   .encodeABI();
    scTool.serializeTx(txData, adminNonce++, tmProxyAddress, '0', path.join(txDataDir, "regToken" + t.symbol + ".dat"), adminPrivateKey);
  }

  // update admin nonce
  tool.updateNonce('admin', adminNonce); 
   

  /* 
   * build register storemanGroup
   */

  let smgDelegateNonce = tool.getNonce('smgDelegate');   

  contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
  for (i = 0; i < smgArray.length; i++) {
    let s = smgArray[i];
    txData = await contract.methods.storemanGroupRegister(s.tokenOrigAccount, s.storemanGroup, s.txFeeRatio).encodeABI();
    scTool.serializeTx(txData, smgDelegateNonce++, smgProxyAddress, s.wanDeposit.toString(), path.join(txDataDir, "regSmg" + s.tokenSymbol + ".dat"), smgDelegatePrivateKey);
  }

  // update smgDelegate nonce
  tool.updateNonce('smgDelegate', smgDelegateNonce);
}

if (cfg.mode == 'release') {
  buildRegTokenSmg('admin', 'smgDelegate'); // role or privateKey
} else { // 'debug'
  buildRegTokenSmg(new Buffer.from(cfg.debug['admin'].privateKey, 'hex'), new Buffer.from(cfg.debug['smgDelegate'].privateKey, 'hex'));
}