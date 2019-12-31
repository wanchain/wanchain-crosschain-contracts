const path = require('path');
const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');
const tokenArray = require('../token.json');

const txDataDir = tool.getOutputPath('txData');

async function buildRegisterToken(privateKey) {
  let contract, txData, i;

  if (typeof(privateKey) == 'string') { // role
    privateKey = tool.getPrivateKey(privateKey);
  }
 
  let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');

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
    scTool.serializeTx(txData, adminNonce++, tmProxyAddress, '0', path.join(txDataDir, "registerToken" + t.symbol + ".dat"), privateKey);
  }

  // update admin nonce
  tool.updateNonce('admin', adminNonce);
}

if (cfg.mode == 'release') {
  buildRegisterToken('admin'); // role or privateKey
} else { // 'debug'
  buildRegisterToken(new Buffer.from(cfg.debug['admin'].privateKey, 'hex'));
}