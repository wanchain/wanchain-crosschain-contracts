const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');

module.exports = async (deployer) => {
  await deployer.deploy(TokenManagerProxy);
  await deployer.deploy(TokenManagerDelegate);
}