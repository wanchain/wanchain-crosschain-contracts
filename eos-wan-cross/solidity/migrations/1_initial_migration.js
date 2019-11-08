const StoremanGroupAdmin = artifacts.require("StoremanGroupAdmin");
const StoremanGroupPKRegistrar = artifacts.require("StoremanGroupPKRegistrar");
const StoremanGroupPKAdmin = artifacts.require("StoremanGroupPKAdmin");
const StoremanGroupPKDeposit = artifacts.require("StoremanGroupPKDeposit");
const StoremanGroupPKStorage = artifacts.require("StoremanGroupPKStorage");
const TokenManager = artifacts.require("TokenManager");
const QuotaLedger = artifacts.require("QuotaLedger");

module.exports = function(deployer) {
  // deployer.deploy(StoremanGroupAdmin);
  // deployer.deploy(StoremanGroupPKAdmin);
  // deployer.deploy(StoremanGroupPKRegistrar);
  // deployer.deploy(StoremanGroupPKDeposit);
  // deployer.deploy(StoremanGroupPKStorage);
  deployer.deploy(TokenManager);
  // deployer.deploy(QuotaLedger);
};
