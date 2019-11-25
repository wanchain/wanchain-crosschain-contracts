const smgAdmin = artifacts.require("StoremanGroupAdmin");

module.exports = function(deployer, _network,account) {
  let network = "gwanTestnet"
  console.log("network:",network)
  deployer.deploy(smgAdmin,network);
};


