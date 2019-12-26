const path = require('path');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

// '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274'
const adminPrivateKey = new Buffer.from('7d3e5d150fce5a3ca580e0a5728dac020be97396394948c6ff03de94cc468e7e', 'hex');

const txDataDir = tool.getOutputPath('txData');

async function buildDeployContract(privateKey) {
  let adminNonce = tool.getNonce('admin');
  let compiled, txData;
 
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

buildDeployContract(adminPrivateKey);