const path = require('path');
const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

// '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274'
const ownerPriv = new Buffer.from('7d3e5d150fce5a3ca580e0a5728dac020be97396394948c6ff03de94cc468e7e', 'hex');

const noncePath = tool.getOutputPath('nonce');
const txDataDir = tool.getOutputPath('txData');

async function buildDependency(privateKey) {
  let nonce = JSON.parse(tool.readFromFile(noncePath));
  let contract, txData;

  let tmProxyAddress = contractAddress.getAddress('TokenManagerProxy');
  let tmDelegateAddress = contractAddress.getAddress('TokenManagerDelegate');
  let htlcProxyAddress = contractAddress.getAddress('HTLCProxy');
  let htlcDelegateAddress = contractAddress.getAddress('HTLCDelegate');
  let smgProxyAddress = contractAddress.getAddress('StoremanGroupProxy')
  let smgDelegateAddress = contractAddress.getAddress('StoremanGroupDelegate');
 
  /* 
   * build TokenManager dependency
   */

  // TokenManagerProxy
  contract = await scTool.getDeployedContract('TokenManagerProxy', tmProxyAddress);
  txData = await contract.methods.upgradeTo(tmDelegateAddress).encodeABI();
  scTool.serializeTx(txData, nonce.owner++, tmProxyAddress, '0', path.join(txDataDir, "setTokenManagerImp.dat"), privateKey);
  contract = await scTool.getDeployedContract('TokenManagerDelegate', tmProxyAddress);
  txData = await contract.methods.setHtlcAddr(htlcProxyAddress).encodeABI();
  scTool.serializeTx(txData, nonce.owner++, tmProxyAddress, '0', path.join(txDataDir, "setTokenManagerHtlc.dat"), privateKey);

  /* 
   * build htlc dependency
   */

   // HTLCProxy
   contract = await scTool.getDeployedContract('HTLCProxy', htlcProxyAddress);
   txData = await contract.methods.upgradeTo(htlcDelegateAddress).encodeABI();
   scTool.serializeTx(txData, nonce.owner++, htlcProxyAddress, '0', path.join(txDataDir, "setHTLCImp.dat"), privateKey);
   contract = await scTool.getDeployedContract('HTLCDelegate', htlcProxyAddress);
   txData = await contract.methods.setEconomics(tmProxyAddress, smgProxyAddress, cfg.htlcRatio).encodeABI();
   scTool.serializeTx(txData, nonce.owner++, htlcProxyAddress, '0', path.join(txDataDir, "setHTLCEconomics.dat"), privateKey);

  /*
   *  build StoremanGroupAdmin dependency
   */

  // StoremanGroupProxy
  contract = await scTool.getDeployedContract('StoremanGroupProxy', smgProxyAddress);
  txData = await contract.methods.upgradeTo(smgDelegateAddress).encodeABI();
  scTool.serializeTx(txData, nonce.owner++, smgProxyAddress, '0', path.join(txDataDir, "setStoremanGroupAdminImp.dat"), privateKey);
  contract = await scTool.getDeployedContract('StoremanGroupDelegate', smgProxyAddress);
  txData = await contract.methods.setDependence(tmProxyAddress, htlcProxyAddress).encodeABI();
  scTool.serializeTx(txData, nonce.owner++, smgProxyAddress, '0', path.join(txDataDir, "setStoremanGroupAdminDependency.dat"), privateKey);

  // update nonce
  tool.write2file(noncePath, JSON.stringify(nonce));
}

buildDependency(ownerPriv);