const HTLCWAN = artifacts.require("HTLCWAN");

module.exports = function(deployer, _network,account) {
  let network = "gwanTestnet"
  console.log("network:",network)
  deployer.deploy(HTLCWAN,network);
};


