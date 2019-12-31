const SchnorrVerifier = artifacts.require('SchnorrVerifier');
const QuotaLib = artifacts.require('QuotaLib');
const HTLCLib = artifacts.require('HTLCLib');
const HTLCDebtLib = artifacts.require('HTLCDebtLib');
const HTLCSmgLib = artifacts.require('HTLCSmgLib');
const HTLCUserLib = artifacts.require('HTLCUserLib');
const HTLCProxy = artifacts.require('HTLCProxy');
const HTLCDelegate = artifacts.require('HTLCDelegate');

module.exports = async (deployer) => {
  /* upgrade HTLCLib, INCLUDING upgrage TokenManagerDelegate */

  await deployer.deploy(HTLCLib);

  await deployer.link(SchnorrVerifier, HTLCDebtLib);
  await deployer.link(QuotaLib, HTLCDebtLib);
  await deployer.link(HTLCLib, HTLCDebtLib);
  await deployer.deploy(HTLCDebtLib);

  await deployer.link(SchnorrVerifier, HTLCSmgLib);
  await deployer.link(QuotaLib, HTLCSmgLib);
  await deployer.link(HTLCLib, HTLCSmgLib);
  await deployer.deploy(HTLCSmgLib);

  await deployer.link(QuotaLib, HTLCUserLib);
  await deployer.link(HTLCLib, HTLCUserLib);
  await deployer.deploy(HTLCUserLib);

  await deployer.link(SchnorrVerifier, HTLCDelegate);
  await deployer.link(QuotaLib, HTLCDelegate);
  await deployer.link(HTLCLib, HTLCDelegate);
  await deployer.link(HTLCDebtLib, HTLCDelegate);
  await deployer.link(HTLCSmgLib, HTLCDelegate);
  await deployer.link(HTLCUserLib, HTLCDelegate);
  let htlcProxy = await HTLCProxy.deployed();
  await deployer.deploy(HTLCDelegate);
  let htlcDelegate = await HTLCDelegate.deployed();
  await htlcProxy.upgradeTo(htlcDelegate.address);
}