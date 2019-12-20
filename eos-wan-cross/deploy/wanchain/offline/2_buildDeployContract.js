const tool = require('../utils/tool')
const scTool = require('../utils/scTool')

const owner = '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274';
const ownerPriv = new Buffer('7d3e5d150fce5a3ca580e0a5728dac020be97396394948c6ff03de94cc468e7e', 'hex');

async function buildDeployContract(owner) {
  let nonce = JSON.parse(tool.readFromFile("../nonce.json"));
  let compiled, abi, bytecode, txData;
 
  // build TokenManager contracts
  compiled = scTool.compileContract('TokenManagerProxy.sol');
  compiled = compiled['TokenManagerProxy.sol:TokenManagerProxy'];
  txData = await scTool.getDeployContractTxData(compiled);
  console.log("TokenManager: %O", txData);
  scTool.serializeTx(txData, nonce.owner++, '', '0', "../txData/deployTokenManagerProxy.dat", ownerPriv);
  
  // build htlc contracts

  // build StoremanGroupAdmin contracts
}

buildDeployContract(owner);