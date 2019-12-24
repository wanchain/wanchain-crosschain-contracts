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
  compiled = scTool.compileContract('TokenManagerProxy.sol');
  compiled = compiled['TokenManagerProxy.sol:TokenManagerProxy'];
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployTokenManagerProxy.dat", privateKey);

  // TokenManagerDelegate
  compiled = scTool.compileContract('TokenManagerDelegate.sol');
  compiled = compiled['TokenManagerDelegate.sol:TokenManagerDelegate'];
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployTokenManagerDelegate.dat", privateKey);
  
  /* 
   * build htlc contracts
   */

   // HTLCProxy
   compiled = scTool.compileContract('HTLCProxy.sol');
   compiled = compiled['HTLCProxy.sol:HTLCProxy'];
   txData = await scTool.getDeployContractTxData(compiled);
   scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployHTLCProxy.dat", privateKey);

   // HTLCDelegate
   compiled = scTool.compileContract('HTLCDelegate.sol');
   compiled = compiled['HTLCDelegate.sol:HTLCDelegate'];
   scTool.linkContract(compiled, ['SchnorrVerifier', 'QuotaLib', 'HTLCLib', 'HTLCDebtLib', 'HTLCSmgLib', 'HTLCUserLib']);
   txData = await scTool.getDeployContractTxData(compiled);
   scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployHTLCDelegate.dat", privateKey);
  

  /*
   *  build StoremanGroupAdmin contracts
   */

  // StoremanGroupProxy
  compiled = scTool.compileContract('StoremanGroupProxy.sol');
  compiled = compiled['StoremanGroupProxy.sol:StoremanGroupProxy'];
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployStoremanGroupProxy.dat", privateKey);

  // StoremanGroupDelegate
  compiled = scTool.compileContract('StoremanGroupDelegate.sol');
  compiled = compiled['StoremanGroupDelegate.sol:StoremanGroupDelegate'];
  txData = await scTool.getDeployContractTxData(compiled);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployStoremanGroupDelegate.dat", privateKey);  


  // update nonce
  tool.write2file("../nonce.json", JSON.stringify(nonce));
}

buildDeployContract(ownerPriv);