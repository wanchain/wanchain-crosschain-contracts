const tool = require('../utils/tool')
const scTool = require('../utils/scTool')

// '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274'
const ownerPriv = new Buffer.from('7d3e5d150fce5a3ca580e0a5728dac020be97396394948c6ff03de94cc468e7e', 'hex');

async function buildDeployContract(privateKey) {
  let nonce = JSON.parse(tool.readFromFile("../nonce.json"));
  let compiled, txData;
 
  /* 
   * build TokenManager contracts
   */

  // TokenManagerProxy
  compiled = scTool.compileContract('TokenManagerProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployTokenManagerProxy.dat", privateKey);

  // TokenManagerDelegate
  compiled = scTool.compileContract('TokenManagerDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployTokenManagerDelegate.dat", privateKey);
  
  /* 
   * build htlc contracts
   */

   // HTLCProxy
   compiled = scTool.compileContract('HTLCProxy');
   txData = await scTool.getDeployContractTxData(compiled);
   scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployHTLCProxy.dat", privateKey);

   // HTLCDelegate
   compiled = scTool.compileContract('HTLCDelegate');
   scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib', 'HTLCDebtLib', 'HTLCSmgLib', 'HTLCUserLib']);
   txData = await scTool.getDeployContractTxData(compiled);
   scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployHTLCDelegate.dat", privateKey);
  

  /*
   *  build StoremanGroupAdmin contracts
   */

  // StoremanGroupProxy
  compiled = scTool.compileContract('StoremanGroupProxy');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployStoremanGroupProxy.dat", privateKey);

  // StoremanGroupDelegate
  compiled = scTool.compileContract('StoremanGroupDelegate');
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployStoremanGroupDelegate.dat", privateKey);  

  // update nonce
  tool.write2file("../nonce.json", JSON.stringify(nonce));
}

buildDeployContract(ownerPriv);