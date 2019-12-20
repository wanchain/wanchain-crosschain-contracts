const contractAddress = require('../contractAddress');
const scTool = require('../utils/scTool')

const owner = '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274';

async function deployContract(owner) {
  let txHash, address, contract;
 
  // deploy TokenManager contracts
  txHash = await scTool.sendSerializedTx("../txData/deployTokenManagerProxy.dat")
  address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress('TokenMagerProxy', address);
    console.log("deploy TokenManagerProxy address: %s", address);
  } else {
    console.log("deploy TokenManagerProxy failed");
    return false;
  }
  // deploy htlc contracts

  // deploy StoremanGroupAdmin contracts

  return true;
}

deployContract(owner);