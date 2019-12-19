const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');

const owner = '0xb9dd855dc6a9340ea6b566a5b454202115bcf485';

module.exports = async (deployer) => {

  /* upgrade TokenManagerDelegate */

  // deploy TokenManagerDelegate
  await deployer.deploy(TokenManagerDelegate, {from: owner});
  let tmDelegate = await TokenManagerDelegate.deployed();

  // update TokenManagerProxy dependence
  let tmProxy = await TokenManagerProxy.deployed();
  await tmProxy.upgradeTo(tmDelegate.address, {from: owner});
}