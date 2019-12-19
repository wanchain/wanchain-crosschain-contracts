const SchnorrVerifier = artifacts.require('SchnorrVerifier');
const QuotaLib = artifacts.require('QuotaLib');
const HTLCLib = artifacts.require('HTLCLib');
const HTLCDebtLib = artifacts.require('HTLCDebtLib');
const HTLCSmgLib = artifacts.require('HTLCSmgLib');
const HTLCUserLib = artifacts.require('HTLCUserLib');
const HTLCProxy = artifacts.require('HTLCProxy');
const HTLCDelegate = artifacts.require('HTLCDelegate');

const owner = '0xb9dd855dc6a9340ea6b566a5b454202115bcf485';

module.exports = async (deployer) => {

  /* upgrade HTLCDelegate */

  // deploy HTLCDelegate
  await deployer.link(SchnorrVerifier, HTLCDelegate);
  await deployer.link(QuotaLib, HTLCDelegate);
  await deployer.link(HTLCLib, HTLCDelegate);
  await deployer.link(HTLCDebtLib, HTLCDelegate);
  await deployer.link(HTLCSmgLib, HTLCDelegate);
  await deployer.link(HTLCUserLib, HTLCDelegate);
  await deployer.deploy(HTLCDelegate, {from: owner});
  let htlcDelegate = await HTLCDelegate.deployed();

  // update htlcProxy dependence
  let htlcProxy = await HTLCProxy.deployed();
  await htlcProxy.upgradeTo(htlcDelegate.address, {from: owner});
}