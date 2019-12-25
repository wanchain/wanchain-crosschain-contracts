const scTool = require('../utils/scTool');

const txArray = [
  // TokenManager dependency
  'setTokenManagerImp',
  'setTokenManagerHtlc',
  // HTLC dependency
  'setHTLCImp',
  'setHTLCEconomics',
  // StoremanGroupAdmin dependency
  'setStoremanGroupAdminImp',
  'setStoremanGroupAdminDependency'
]

async function setDependency(index) {
  if (index >= txArray.length) {
    // console.log("setDependency finished");
    return true;
  }
  let txName = txArray[index];
  let txFile = "../txData/" + txName + ".dat";
  let txHash = await scTool.sendSerializedTx(txFile);
  let success = await scTool.waitReceipt(txHash, 30, false);
  if (success) {
    console.log(txName + " success");
    return setDependency(index + 1);
  } else {
    console.log(txName + " failed");
    return false;
  }
}

setDependency(0);