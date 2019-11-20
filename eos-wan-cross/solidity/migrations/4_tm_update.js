const config = require("./config");

module.exports = async (deployer, network, accounts) => {
  try {
    if (config.testTMUpdate) {
      const TokenManagerProxy = artifacts.require('TokenManagerProxy');
      const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');
      const TokenManagerDelegateV2 = artifacts.require('TokenManagerDelegateV2');
      // const BasicStorageLib = artifacts.require('BasicStorageLib');

      // lib
      // await deployer.deploy(BasicStorageLib);
      // console.log("BasicStorageLib =>", BasicStorageLib.address);
  
      // token manager sc
      // await deployer.link(BasicStorageLib, TokenManagerProxy);
      await deployer.deploy(TokenManagerProxy);
      // let tmProxy = await TokenManagerProxy.deployed();
      console.log("TokenManagerProxy =>", TokenManagerProxy.address);
  
      await deployer.deploy(TokenManagerDelegate);
      // let tmDelegate = await TokenManagerDelegate.deployed();
      console.log("TokenManagerDelegate =>", TokenManagerDelegate.address);
  
      // await deployer.link(BasicStorageLib, TokenManagerDelegateV2);
      await deployer.deploy(TokenManagerDelegateV2);
      // let tmDelegate = await TokenManagerDelegateV2.deployed();
      console.log("TokenManagerDelegateV2 =>", TokenManagerDelegateV2.address);
    }
  } catch (err) {
    console.error("Deployment failed", err);
  }
}