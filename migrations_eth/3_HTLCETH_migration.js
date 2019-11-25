const HTLCETH = artifacts.require("HTLCETH");

console.log("XXXXXXXXXXXXXXXXXXXXXXXsimpleToken:", HTLCETH)
module.exports = function(deployer) {
  deployer.deploy(HTLCETH);
};


