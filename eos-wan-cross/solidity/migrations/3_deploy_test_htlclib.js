const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');
const Secp256k1 = artifacts.require('Secp256k1');
const SchnorrVerifier = artifacts.require('SchnorrVerifier');
const QuotaLib = artifacts.require('QuotaLib');
const HTLCLib = artifacts.require('HTLCLib');
const HTLCProxy = artifacts.require('HTLCProxy');
const HTLCDelegate = artifacts.require('HTLCDelegate');
const StoremanGroupProxy = artifacts.require('StoremanGroupProxy');
const StoremanGroupDelegate = artifacts.require('StoremanGroupDelegate');
const TestHTLCLib = artifacts.require('TestHTLCLib');

module.exports = async (deployer) => {
  try{
    await deployer.deploy(HTLCLib);
    await deployer.link(HTLCLib, TestHTLCLib);
    await deployer.deploy(TestHTLCLib);
  }
  catch (err) {
    console.error("Deployment TestHTLCLib failed", err);
  }
}