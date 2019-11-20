const config = require("./config");

module.exports = async (deployer, network, accounts) => {
  try {
    if (config.testSchnorrVerify) {
      const Secp256k1 = artifacts.require('Secp256k1');
      const SchnorrVerifier = artifacts.require('SchnorrVerifier');
      const commonLib = artifacts.require('commonLib');
      const CryptoInstance = artifacts.require("CryptoInstance");

      // lib
      await deployer.deploy(Secp256k1);
      console.log("Secp256k1 =>", Secp256k1.address);

      await deployer.link(Secp256k1, SchnorrVerifier);
      await deployer.deploy(SchnorrVerifier);
      console.log("SchnorrVerifier =>", SchnorrVerifier.address);

      await deployer.link(SchnorrVerifier, commonLib);
      await deployer.deploy(commonLib);
      console.log("commonLib =>", commonLib.address);

      // sc
      await deployer.link(Secp256k1, CryptoInstance);
      await deployer.link(SchnorrVerifier, CryptoInstance);
      await deployer.link(commonLib, CryptoInstance);
      await deployer.deploy(CryptoInstance);
      console.log("CryptoInstance =>", CryptoInstance.address);
    }
  } catch (err) {
    console.error("Deployment failed", err);
  }
}