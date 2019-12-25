const scTool = require('../utils/scTool');
const contractAddress = require('../contractAddress');

const scArray = [
  // deploy TokenManager
  'TokenManagerProxy',
  'TokenManagerDelegate',
  // deploy HTLC
  'HTLCProxy',
  'HTLCDelegate',
  // deploy StoremanGroupAdmin
  'StoremanGroupProxy',
  'StoremanGroupDelegate'
]

async function deployContract(index) {
  if (index >= scArray.length) {
    // console.log("deployContract finished");
    return true;
  }

  let scName = scArray[index];
  let txFile = "../txData/deploy" + scName + ".dat";
  let txHash = await scTool.sendSerializedTx(txFile);
  let address = await scTool.waitReceipt(txHash, 30, true);
  if (address) {
    contractAddress.setAddress(scName, address);
    console.log("deployed %s address: %s", scName, address);
    return deployContract(index + 1);
  } else {
    console.log("deploy %s failed", scName);
    return false;
  }
}

deployContract(0);