const contractAddress = require('../contractAddress');
const scTool = require('../utils/scTool')

const owner = '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274';

async function deployContract(owner) {
  let txHash, address, contract;
 
  /*
   * deploy TokenManager contracts
   */

  // TokenManagerProxy
  txHash = await scTool.sendSerializedTx("../txData/deployTokenManagerProxy.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('TokenManagerProxy', address);
    console.log("deploy TokenManagerProxy address: %s", address);
  } else {
    console.log("deploy TokenManagerProxy failed");
    return false;
  }

  // TokenManagerDelegate
  txHash = await scTool.sendSerializedTx("../txData/deployTokenManagerDelegate.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('TokenManagerDelegate', address);
    console.log("deploy TokenManagerDelegate address: %s", address);
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
    console.log("deploy HTLCProxy address: %s", address);
  } else {
    console.log("deploy HTLCProxy failed");
    return false;
  }

  // HTLCDelegate
  txHash = await scTool.sendSerializedTx("../txData/deployHTLCDelegate.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('HTLCDelegate', address);
    console.log("deploy HTLCDelegate address: %s", address);
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
    console.log("deploy StoremanGroupProxy address: %s", address);
  } else {
    console.log("deploy StoremanGroupProxy failed");
    return false;
  }

  // StoremanGroupDelegate
  txHash = await scTool.sendSerializedTx("../txData/deployStoremanGroupDelegate.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('StoremanGroupDelegate', address);
    console.log("deploy StoremanGroupDelegate address: %s", address);
  } else {
    console.log("deploy StoremanGroupDelegate failed");
    return false;
  }

  return true;
}

deployContract(owner);