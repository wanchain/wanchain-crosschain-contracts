const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');
const QuotaLib = artifacts.require('QuotaLib');
const HTLCLib = artifacts.require('HTLCLib');
// const HTLCDelegate = artifacts.require('HTLCDelegate');

module.exports = async (deployer) => {
  // await deployer.deploy(TokenManagerProxy);
  // await deployer.deploy(TokenManagerDelegate);
  await deployer.deploy(QuotaLib);
  await deployer.deploy(HTLCLib);

  // await deployer.link(QuotaLib, HTLCDelegate);
  
  // await deployer.deploy(HTLCDelegate);
}