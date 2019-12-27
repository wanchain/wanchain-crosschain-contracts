const path = require('path');
const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

const txDataDir = tool.getOutputPath('txData');

async function buildDeployContract(privateKey) {
  let compiled, txData;
 
  let adminNonce = tool.getNonce('admin');

  if (typeof(privateKey) == 'string') { // role
    privateKey = tool.getPrivateKey(privateKey);
  }

  /* 
   * build TokenManager contracts
   */

  // TokenManagerProxy
  compiled = scTool.compileContract('TokenManagerProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, adminNonce++, '', '0', path.join(txDataDir, "deployTokenManagerProxy.dat"), privateKey);

  // TokenManagerDelegate
  compiled = scTool.compileContract('TokenManagerDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, adminNonce++, '', '0', path.join(txDataDir, "deployTokenManagerDelegate.dat"), privateKey);
  
  /* 
   * build htlc contracts
   */

   // HTLCProxy
   compiled = scTool.compileContract('HTLCProxy');
   txData = await scTool.getDeployContractTxData(compiled);
   scTool.serializeTx(txData, adminNonce++, '', '0', path.join(txDataDir, "deployHTLCProxy.dat"), privateKey);

   // HTLCDelegate
   compiled = scTool.compileContract('HTLCDelegate');
   scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib', 'HTLCDebtLib', 'HTLCSmgLib', 'HTLCUserLib']);
   txData = await scTool.getDeployContractTxData(compiled);
   scTool.serializeTx(txData, adminNonce++, '', '0', path.join(txDataDir, "deployHTLCDelegate.dat"), privateKey);
  

  /*
   *  build StoremanGroupAdmin contracts
   */

  // StoremanGroupProxy
  compiled = scTool.compileContract('StoremanGroupProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, adminNonce++, '', '0', path.join(txDataDir, "deployStoremanGroupProxy.dat"), privateKey);

  // StoremanGroupDelegate
  compiled = scTool.compileContract('StoremanGroupDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, adminNonce++, '', '0', path.join(txDataDir, "deployStoremanGroupDelegate.dat"), privateKey);  

  // update admin adminNonce
  tool.updateNonce('admin', adminNonce);
}

if (cfg.mode == 'release') {
  buildDeployContract('admin'); // role or privateKey
} else { // 'debug'
  buildDeployContract(new Buffer.from(cfg.debug['admin'].privateKey, 'hex'));
}