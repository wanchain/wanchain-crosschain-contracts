const SimpleToken = artifacts.require("SimpleToken");

console.log("XXXXXXXXXXXXXXXXXXXXXXXsimpleToken:", SimpleToken)
module.exports = function(deployer) {
  deployer.deploy(SimpleToken);
};


