const scTool = require('../utils/scTool')
const contractAddress = require('../contractAddress');

async function deployContract() {
  let txHash, address;
 
  /*
   * deploy TokenManager contracts
   */

  // TokenManagerProxy
  txHash = await scTool.sendSerializedTx("../txData/deployTokenManagerProxy.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('TokenManagerProxy', address);
    console.log("deployed TokenManagerProxy address: %s", address);
  } else {
    console.log("deploy TokenManagerProxy failed");
    return false;
  }

  // TokenManagerDelegate
  txHash = await scTool.sendSerializedTx("../txData/deployTokenManagerDelegate.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('TokenManagerDelegate', address);
    console.log("deployed TokenManagerDelegate address: %s", address);
  } else {
    console.log("deploy TokenManagerDelegate failed");
    return false;
  }

  /* 
   * deploy htlc contracts
   */
 
  // HTLCProxy
  txHash = await scTool.sendSerializedTx("../txData/deployHTLCProxy.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('HTLCProxy', address);
    console.log("deployed HTLCProxy address: %s", address);
  } else {
    console.log("deploy HTLCProxy failed");
    return false;
  }

  // HTLCDelegate
  txHash = await scTool.sendSerializedTx("../txData/deployHTLCDelegate.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('HTLCDelegate', address);
    console.log("deployed HTLCDelegate address: %s", address);
  } else {
    console.log("deploy HTLCDelegate failed");
    return false;
  }

  // deploy StoremanGroupAdmin contracts

  // StoremanGroupProxy
  txHash = await scTool.sendSerializedTx("../txData/deployStoremanGroupProxy.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('StoremanGroupProxy', address);
    console.log("deployed StoremanGroupProxy address: %s", address);
  } else {
    console.log("deploy StoremanGroupProxy failed");
    return false;
  }

  // StoremanGroupDelegate
  txHash = await scTool.sendSerializedTx("../txData/deployStoremanGroupDelegate.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('StoremanGroupDelegate', address);
    console.log("deployed StoremanGroupDelegate address: %s", address);
  } else {
    console.log("deploy StoremanGroupDelegate failed");
    return false;
  }  

  return true;
}

deployContract();