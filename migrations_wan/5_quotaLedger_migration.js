const ql = artifacts.require("QuotaLedger");

module.exports = function(deployer, _network,account) {
  let network = "gwanTestnet"
  console.log("network:",network)
  deployer.deploy(ql,network);
};


