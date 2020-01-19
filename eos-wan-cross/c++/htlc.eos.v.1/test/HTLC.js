function parseArgs() {
  let optimist = require('optimist')
  let argv = optimist
  .usage('Usage: $0 -n [node] -u [url] -c [chainId] [--htlc] [--sign] [--testnet]')
  .demand(['n'])
  .alias('h', 'help')
  .alias('n', 'node')
  .alias('u', 'url')
  .alias('c', 'chainId')
  .describe('h', 'display the usage')
  .describe('n', 'choose the node')
  .describe('u', 'custom node url')
  .describe('c', 'custom node chainId')
  .describe('htlc', 'the htlc contract account, format: {name:"xxx", privateKey:"xxx"}')
  .describe('sign', 'the signature verification contract account, format: {name:"xxx", privateKey:"xxx"}')
  .describe('testnet', 'identify whether using testnet or not, if no "--testnet", using mainnet as default')
  .default('testnet', false)
  .argv;

  if (argv.help) {
    optimist.showHelp();
    process.exit(0);
  }
  return argv;
}

function initGlobal(argv) {
  global.testnet = argv.testnet ? true : false;
  global.network = argv.testnet ? "testnet" : "mainnet";

  const config = require("./config");

  if (argv.n) {
    global.node = config.nodeDict[global.network][argv.n];
  } else if (argv.u && argv.c) {
      global.node = {
        url: argv.u,
        chainId: argv.c,
      };
  } else {
    console.error("require node network");
    process.exit(0);
  }

  if (argv.htlc) {
    global.htlc = argv.htlc;
  } else {
    global.htlc = config.customAccount[global.network]["htlc"];
  }

  if (argv.sign) {
    global.sign = argv.sign;
  } else {
    global.sign = config.customAccount[global.network]["sign"];
  }
  console.log("Auto test argv:", argv);
}


async function startAutoTest() {
  const config = require("./config");
  const utils = require("./utils");
  const lib = require("./lib");

  describe("EOS-WAN-Contract-AutoTest", function() {
    let log = console;
    let eoslime;
    let htlcAccount;
    let htlcContract;
    let tokenContract;
    let signAccount;
    let signContract;
    let user1;
    let user2;
    let storeman1;
    let storeman2;

    before(async () => {

      log.debug("init eoslime", JSON.stringify(global.node));
      eoslime = utils.getEosLime(global.node);

      let user1Config = config.customAccount[global.network]["user1"];
      log.debug("init user1 account", JSON.stringify(user1Config));
      user1 = eoslime.Account.load(
        user1Config.name, user1Config.privateKey, config.permissionDict.active);

      let user2Config = config.customAccount[global.network]["user2"];
      log.debug("init user2 account", JSON.stringify(user2Config));
      user2 = eoslime.Account.load(
        user2Config.name, user2Config.privateKey, config.permissionDict.active);
  
      let storeman1Config = config.customAccount[global.network]["storeman1"];
      log.debug("init storeman1 account", JSON.stringify(storeman1Config));
      storeman1 = eoslime.Account.load(
        storeman1Config.name, storeman1Config.privateKey, config.permissionDict.active);

      let storeman2Config = config.customAccount[global.network]["storeman2"];
      log.debug("init storeman2 account", JSON.stringify(storeman2Config));
      storeman2 = eoslime.Account.load(
        storeman2Config.name, storeman2Config.privateKey, config.permissionDict.active);
  
      log.debug("init sign contract", JSON.stringify(global.sign));
      // let htlcContract = await utils.getContractInstanceFromAbiFile(eoslime, global.htlc.name, global.htlc, config.htlcContractFile.ABI);
      signAccount = await utils.loadAccount(eoslime, global.sign.name, global.sign.privateKey, config.permissionDict.active);
      signContract = await utils.contractAtFromAbiFile(eoslime, config.signContractFile.ABI, global.sign.name, signAccount);

      try {
        log.debug("init htlc contract", JSON.stringify(global.htlc));
        htlcAccount = await utils.loadAccount(eoslime, global.htlc.name, global.htlc.privateKey, config.permissionDict.active);
        htlcContract = await utils.contractAtFromAbiFile(eoslime, config.htlcContractFile.ABI, global.htlc.name, htlcAccount);
        htlcContract.makeInline();//set eosio.code

      // 注册signature合约
        let regSigTx = await htlcContract.regsig(config.customSignContract.name, config.customSignContract.action);
        log.debug("regsig", config.customSignContract.name, config.customSignContract.action, regSigTx);
      } catch (err) {
        if (!utils.ignoreError(3050003, err)) {
          log.error("init contract failed:", err);
          lib.assertFail(err);
          // HTLC Contract not deployed
          // lib.expectToBeAnInstanceOf(err, Error);
          // lib.assertInclude(err.message, "Missing ABI for account", err);
        }
      }
    });

    it("inlock eosio.token EOS, it should be success", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let xHash = utils.sha256(config.xInfo[0]);
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(config.wanAddrs[0])
          .concat(separator).concat(config.pks[0]).concat(separator).concat(config.sysTokenContract.name);
        log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);

        let eosTokenTran = await eoslime.Provider.eos.transaction({
          actions:[
            {
              account: config.sysTokenContract.name,
              name: config.sysTokenContract.action,
              authorization:[
                {
                  actor: user1.name,
                  permission: config.permissionDict.active
                }
              ],
              data: {
                from:user1.name,
                to: htlcContract.name,
                quantity: value,
                memo: memo
              }
            }
          ]
        }, { broadcast: true, sign: true, keyProvider: user1.privateKey });
        // let eosioTokenContract = await utils.getContractInstance(eoslime, config.sysTokenContract.name, user1);

        // var tx = await eosioTokenContract.transfer(user1.name, htlcContract.name, value, memo);
        log.debug(JSON.stringify(eosTokenTran));
        log.debug("inlock success", eosTokenTran.transaction_id);

        let scope = htlcContract.name;
        if (!isNaN(Number(scope))) {
          scope = utils.getUint64AsNumber(scope);
        }
        log.debug(scope);
        let pkInfo = await eoslime.Provider.eos.getTableRows({json:true, code:htlcContract.name, scope:scope, table:config.htlcTblDict.pks});
        // lib.assertCommonEqual(pkInfo.length, 1);
        log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);
        // result = await tableTransfers.find();
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        // log.debug("result", JSON.stringify(result));
        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertCommonEqual(crossResult.length, 1);
        lib.assertCommonEqual(crossResult[0].user, user1.name);
        lib.assertCommonEqual(crossResult[0].quantity, value);
        lib.assertCommonEqual(crossResult[0].status, "inlock");
        lib.assertCommonEqual(crossResult[0].xHash, xHash);
        lib.assertCommonEqual(crossResult[0].wanAddr, config.wanAddrs[0]);
        lib.assertCommonEqual(crossResult[0].account, config.sysTokenContract.name);
        log.debug("crossResult", JSON.stringify(crossResult));
      } catch (err) {
        log.error("inlock failed:", err);
        lib.assertFail(err);
      }
    });
  });
}

initGlobal(parseArgs());
startAutoTest();