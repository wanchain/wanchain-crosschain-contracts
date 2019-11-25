const tm = artifacts.require("TokenManager");

module.exports = function(deployer, _network,account) {
  let network = "gwanTestnet"
  console.log("network:",network)
  deployer.deploy(tm,network);
};


