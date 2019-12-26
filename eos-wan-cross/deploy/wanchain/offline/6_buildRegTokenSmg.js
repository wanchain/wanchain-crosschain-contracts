const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');
const tokenArray = require('../token.json');
const smgArray = require('../smg.json');

// '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274'
const ownerPriv = new Buffer.from('7d3e5d150fce5a3ca580e0a5728dac020be97396394948c6ff03de94cc468e7e', 'hex');

const noncePath = tool.getOutputPath('nonce');
const txDataDir = tool.getOutputPath('txData');

async function buildRegTokenSmg(privateKey) {
  let nonce = JSON.parse(tool.readFromFile(noncePath));
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
    scTool.serializeTx(txData, nonce.owner++, tmProxyAddress, '0', path.join(txDataDir, "regToken" + t.symbol + ".dat"), privateKey);
  }

  /* 
   * build register storemanGroup
   */
  contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
  for (i = 0; i < smgArray.length; i++) {
    let s = smgArray[i];
    txData = await contract.methods.storemanGroupRegister(s.tokenOrigAccount, s.storemanGroup, s.txFeeRatio).encodeABI();
    scTool.serializeTx(txData, nonce.owner++, smgProxyAddress, s.wanDeposit.toString(), path.join(txDataDir, "regSmg" + s.tokenSymbol + ".dat"), privateKey);
  }

  // update nonce
  tool.write2file(noncePath, JSON.stringify(nonce));
}

buildRegTokenSmg(ownerPriv);