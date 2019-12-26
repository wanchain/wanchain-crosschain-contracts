const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');
const tokenArray = require('../token.json');
const smgArray = require('../smg.json');

// '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274'
const adminPrivateKey = new Buffer.from('7d3e5d150fce5a3ca580e0a5728dac020be97396394948c6ff03de94cc468e7e', 'hex');
const smgDelegatePrivateKey = new Buffer.from('59218f485a99cabb9075bab78c833233efa8e2ad7ed5bb45dc004d354702f6fd', 'hex');

const txDataDir = tool.getOutputPath('txData');

async function buildRegTokenSmg(adminPrivateKey, smgDelegatePrivateKey) {
  let adminNonce = tool.getNonce('admin')
  let smgDelegateNonce = tool.getNonce('smgDelegate');
  
  let contract, txData, i;

  let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
  let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy')

  /* 
   * build register token
   */

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
  contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
  for (i = 0; i < smgArray.length; i++) {
    let s = smgArray[i];
    txData = await contract.methods.storemanGroupRegister(s.tokenOrigAccount, s.storemanGroup, s.txFeeRatio).encodeABI();
    scTool.serializeTx(txData, smgDelegateNonce++, smgProxyAddress, s.wanDeposit.toString(), path.join(txDataDir, "regSmg" + s.tokenSymbol + ".dat"), smgDelegatePrivateKey);
  }

  // update smgDelegate nonce
  tool.updateNonce('smgDelegate', smgDelegateNonce);
}

buildRegTokenSmg(adminPrivateKey, smgDelegatePrivateKey);