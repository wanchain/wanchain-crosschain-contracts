const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');
const QuotaLib = artifacts.require('QuotaLib');
const HTLCLib = artifacts.require('HTLCLib');
const HTLCDelegate = artifacts.require('HTLCDelegate');
const StoremanGroupProxy = artifacts.require('StoremanGroupProxy');
const StoremanGroupDelegate = artifacts.require('StoremanGroupDelegate');

module.exports = async (deployer) => {
  await deployer.deploy(TokenManagerProxy);
  await deployer.deploy(TokenManagerDelegate);
  await deployer.deploy(QuotaLib);
  await deployer.deploy(HTLCLib);

  await deployer.link(QuotaLib, HTLCDelegate);
  await deployer.link(HTLCLib, HTLCDelegate);
  await deployer.deploy(HTLCDelegate);
  
  await deployer.deploy(StoremanGroupProxy);
  await deployer.deploy(StoremanGroupDelegate);
}