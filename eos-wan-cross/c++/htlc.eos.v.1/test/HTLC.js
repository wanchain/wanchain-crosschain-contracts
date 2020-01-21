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
    let htlcContractUser1;
    let htlcContractUser2;
    let htlcContractSmg1;
    let htlcContractSmg2;
    let tokenContract;
    let signAccount;
    let signContract;
    let user1;
    let user2;
    let storeman1;
    let storeman2;

    before(async () => {

      // log.debug("init eoslime", JSON.stringify(global.node));
      eoslime = utils.getEosLime(global.node);

      let user1Config = config.customAccount[global.network]["user1"];
      // log.debug("init user1 account", JSON.stringify(user1Config));
      user1 = eoslime.Account.load(
        user1Config.name, user1Config.privateKey, config.permissionDict.active);

      let user2Config = config.customAccount[global.network]["user2"];
      // log.debug("init user2 account", JSON.stringify(user2Config));
      user2 = eoslime.Account.load(
        user2Config.name, user2Config.privateKey, config.permissionDict.active);
  
      let storeman1Config = config.customAccount[global.network]["storeman1"];
      // log.debug("init storeman1 account", JSON.stringify(storeman1Config));
      storeman1 = eoslime.Account.load(
        storeman1Config.name, storeman1Config.privateKey, config.permissionDict.active);

      let storeman2Config = config.customAccount[global.network]["storeman2"];
      // log.debug("init storeman2 account", JSON.stringify(storeman2Config));
      storeman2 = eoslime.Account.load(
        storeman2Config.name, storeman2Config.privateKey, config.permissionDict.active);
  
      // log.debug("init sign contract", JSON.stringify(global.sign));
      // let htlcContract = await utils.getContractInstanceFromAbiFile(eoslime, global.htlc.name, global.htlc, config.htlcContractFile.ABI);
      signAccount = await utils.loadAccount(eoslime, global.sign.name, global.sign.privateKey, config.permissionDict.active);
      signContract = await utils.contractAtFromAbiFile(eoslime, config.signContractFile.ABI, global.sign.name, signAccount);

      try {
        // log.debug("init htlc contract", JSON.stringify(global.htlc));
        htlcAccount = await utils.loadAccount(eoslime, global.htlc.name, global.htlc.privateKey, config.permissionDict.active);
        htlcContract = await utils.contractAtFromAbiFile(eoslime, config.htlcContractFile.ABI, global.htlc.name, htlcAccount);
        htlcContract.makeInline();//set eosio.code

        htlcContractUser1 = await utils.getContractInstance(eoslime, htlcAccount.name, user1);
        htlcContractUser2 = await utils.getContractInstance(eoslime, htlcAccount.name, user2);
        htlcContractSmg1 = await utils.getContractInstance(eoslime, htlcAccount.name, storeman1);
        htlcContractSmg2 = await utils.getContractInstance(eoslime, htlcAccount.name, storeman2);

      // 注册signature合约
        let regSigTx = await htlcContract.regsig(config.customSignContract.name, config.customSignContract.action);
        // log.debug("regsig", config.customSignContract.name, config.customSignContract.action, regSigTx);
      } catch (err) {
        if (!utils.ignoreError(3050003, err)) {
          // log.error("init contract failed:", err);
          lib.assertFail(err);
          // HTLC Contract not deployed
          // lib.expectToBeAnInstanceOf(err, Error);
          // lib.assertInclude(err.message, "Missing ABI for account", err);
        }
      }
    });

    it("cross EOS chain: eosio.token EOS inBound user1 => storeman1, it should be success", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pk = config.pks[0];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
          .concat(separator).concat(pk).concat(separator).concat(config.sysTokenContract.name);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        // log.debug(JSON.stringify(eosTokenTran));
        // log.debug("inlock success", eosTokenTran.transaction_id);

        let scope = utils.getUint64AsNumber(htlcContract.name);
        // let scope = htlcContract.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);
        let pkInfo = await eoslime.Provider.eos.getTableRows({json:true, code:htlcContract.name, scope:scope, table:config.htlcTblDict.pks});
        lib.assertStrictEqual(pkInfo.rows.length > 0, true);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let pkId = -1;
        let pkHash;
        for (let info of pkInfo.rows) {
          if (info.pk === pk) {
            pkId = info.id;
            pkHash = info.pkHash;
            break;
          }
        }
        lib.assertNotStrictEqual(pkId, -1);
        lib.assertStrictEqual(pkHash, utils.sha256(Buffer.from(pk)));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkId);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "inlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].wanAddr, wanAddr);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        let smg1RedeemTx = await htlcContractSmg1.inredeem(x);
        // log.debug("inredeem success", JSON.stringify(smg1RedeemTx));

      } catch (err) {
        // log.error("inBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS outBound storeman1 => user1, it should be success", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pk = config.pks[0];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
        let r = "";
        let s = "";

        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, r, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);
        // let scope = htlcContractSmg1.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);
        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "outlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        let user1RedeemTx = await htlcContractUser1.outredeem(user1.name, x);
        // log.debug("outredeem success", JSON.stringify(user1RedeemTx));

      } catch (err) {
        // log.error("outBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence xhash, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let wanAddr = config.wanAddrs[0];
        let pk = config.pks[0];
        let memo = "inlock".concat(separator).concat(wanAddr)
          .concat(separator).concat(pk).concat(separator).concat(config.sysTokenContract.name);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);

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
        lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence xhash, it should be throw error");
      } catch (err) {
        lib.assertExists(err);
        // lib.expectToBeAnInstanceOf(err, Error);
        // lib.assertInclude(err.message, "invalid token account", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence wanAddr, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pk = config.pks[0];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator)
          .concat(separator).concat(pk).concat(separator).concat(config.sysTokenContract.name);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence wanAddr, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));
        // log.debug(err);
        lib.assertExists(err);
        // lib.assertInclude(err.message, "invalid memo", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence pk, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
          .concat(separator).concat(config.sysTokenContract.name);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence pk, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));
        // log.debug(err);
        lib.assertExists(err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence token account, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pk = config.pks[0];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
          .concat(separator).concat(pk);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence token account, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));
        // log.debug(err);
        lib.assertExists(err);
        // lib.assertInclude(err.message, "invalid token account", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, invalid token account, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pk = config.pks[0];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
          .concat(separator).concat(pk).concat(separator).concat(config.customTokenContract.name);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence token account, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));
        // log.debug(err);
        lib.assertExists(err);
        // lib.assertInclude(err.message, "invalid token account", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, invalid memo, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let memo = "inlock".concat("afrgbtrhbazsrhbsz");
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, invalid memo, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));
        // log.debug(err);
        lib.assertExists(err);
        // lib.assertInclude(err.message, "invalid token account", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, inrevoke in redeem time, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let nonX = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pk = config.pks[0];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
          .concat(separator).concat(pk).concat(separator).concat(config.sysTokenContract.name);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        // log.debug(JSON.stringify(eosTokenTran));
        // log.debug("inlock success", eosTokenTran.transaction_id);

        let scope = utils.getUint64AsNumber(htlcContract.name);
        // let scope = htlcContract.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);
        let pkInfo = await eoslime.Provider.eos.getTableRows({json:true, code:htlcContract.name, scope:scope, table:config.htlcTblDict.pks});
        lib.assertStrictEqual(pkInfo.rows.length > 0, true);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let pkId = -1;
        let pkHash;
        for (let info of pkInfo.rows) {
          if (info.pk === pk) {
            pkId = info.id;
            pkHash = info.pkHash;
            break;
          }
        }
        lib.assertNotStrictEqual(pkId, -1);
        lib.assertStrictEqual(pkHash, utils.sha256(Buffer.from(pk)));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkId);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "inlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].wanAddr, wanAddr);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        try {
          let user1RevokeTx = await htlcContractUser1.inrevoke(xHash);
          lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, inrevoke in redeem time, it should be throw error");
        } catch (err) {
          lib.assertExists(err);
        }

        try {
          let smg1RedeemTx = await htlcContractSmg1.inredeem(nonX);
          lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, inredeem with invalid parameter about x, it should be throw error");
        } catch (err) {
          // log.debug("inredeem with invalid parameter about x, it should be throw error:", err);
          lib.assertExists(err);
        }

        let smg1RedeemTx = await htlcContractSmg1.inredeem(x);
        // log.debug("inredeem success", JSON.stringify(smg1RedeemTx));
    } catch (err) {
        // log.error("inBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, invalid token account, it should be throw error", async () => {
      let value = "1.0000 EOS";
      let x = config.xInfo[1];
      let xHash = utils.sha256(Buffer.from(x, 'hex'));
      let pk = config.pks[0];
      let r = "";
      let s = "";

      try {
        // invalid token account
        let tokenAccount = "invalidtoken"
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, tokenAccount, value, xHash, pk, r, s);
        lib.assertFail("eosio.token EOS outlock storeman1 => user1, invalid token account contract, it should be throw error");
      } catch (err) {
        lib.assertExists(err);
        // lib.assertInclude(err.message, "invalid token account", err);
      }

      try {
        // invalid token account name, length overflow
        let tokenAccount = "invalid.token";
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, tokenAccount, value, xHash, pk, r, s);
        lib.assertFail("eosio.token EOS outlock storeman1 => user1, invalid token account name, it should be throw error");
      } catch (err) {
        lib.assertExists(err);
        // lib.assertInclude(err.message, "A name can be up to 12 characters long", err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, invalid symbol, it should be throw error", async () => {
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pk = config.pks[0];
        let r = "";
        let s = "";

        try {
          // invalid token precision
          let value = "1.00 EOS";
          let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, r, s);
          lib.assertFail("eosio.token EOS outlock storeman1 => user1, invalid symbol precision, it should be throw error");
        } catch (err) {
          lib.assertExists(err);
          // lib.assertInclude(err.message, "not enough quantity", err);
        }

        try {
          // invalid token symbol_code
          let value = "1.0000 EoS";
          let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, r, s);
          lib.assertFail("eosio.token EOS outlock storeman1 => user1, invalid symbol_code, it should be throw error");
        } catch (err) {
          lib.assertExists(err);
        }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, outrevoke in redeem time, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[1];
        let nonX = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pk = config.pks[0];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
        let r = "";
        let s = "";

        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, r, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);
        // let scope = htlcContractSmg1.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);
        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "outlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        try {
          let smg1RevokeTx = await htlcContractSmg1.outrevoke(xHash);
          lib.assertFail("eosio.token EOS outlock storeman1 => user1, outrevoke in redeem time, it should be throw error");
        } catch (err) {
          // only can revoke after lockedTime
          lib.assertExists(err);
        }

        try {
          let user2RedeemTx = await htlcContractUser2.outredeem(user2.name, x);
          lib.assertFail("outredeem with invalid parameter about user, it should be throw error");
        } catch (err) {
          // log.debug("outredeem with invalid parameter about user, it should be throw error:", err);
          lib.assertExists(err);
        }

        try {
          let user1RedeemTx = await htlcContractUser1.outredeem(user1.name, nonX);
          lib.assertFail("outredeem with invalid parameter about x, it should be throw error");
        } catch (err) {
          // log.debug("outredeem with invalid parameter about x, it should be throw error:", err);
          lib.assertExists(err);
        }

        let user1RedeemTx = await htlcContractUser1.outredeem(user1.name, x);
        // log.debug("outredeem success", JSON.stringify(user1RedeemTx));

      } catch (err) {
        // log.error("outBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, outrevoke in redeem time, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pk = config.pks[0];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
        let r = "";
        let s = "";

        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, r, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);
        // let scope = htlcContractSmg1.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);
        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "outlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        try {
          let smg1RevokeTx = await htlcContractSmg1.outrevoke(xHash);
          lib.assertFail("eosio.token EOS outlock storeman1 => user1, outrevoke in redeem time, it should be throw error");
        } catch (err) {
          // only can revoke after lockedTime
          lib.assertExists(err);
        }

        let user1RedeemTx = await htlcContractUser1.outredeem(user1.name, x);
        // log.debug("outredeem success", JSON.stringify(user1RedeemTx));

      } catch (err) {
        // log.error("outBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, storeman1 has not enough quantity, it should be throw error", async () => {
      try {
        let value;
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pk = config.pks[0];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
        let r = "";
        let s = "";

        let scope = utils.getUint64AsNumber(htlcContract.name);
        // let scope = htlcContract.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let assetScope = String(pkInfo[0].id);
        let tableAssets = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.assets, assetScope);
        let assetInfo = await tableAssets.find();
        // let assetInfo = await eoslime.Provider.eos.getTableRows({json:true, code:htlcContract.name, scope:assetScope, table:config.htlcTblDict.assets});
        // log.debug(pkInfo[0].pk, "assets", JSON.stringify(assetInfo));

        assetInfo.some(asset => {
          let assetEles = asset.balance.split(" ");
          let symCode = assetEles[1];
          if (asset.account === config.sysTokenContract.name && symCode === "EOS") {
            let amount = Number(assetEles[0]) + 1;
            value = amount.toFixed(4) + " " + symCode;
            return true;
          }
          return false;
        });
        if (!value) {
          value = "1.0000 EOS";
        }
        // log.debug("outlock ", value);

        try {
          let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, r, s);
          lib.assertFail("storeman1 has not enough quantity, it should be throw error");
        } catch (err) {
          // log.debug("storeman1 has not enough quantity, it should be throw error:", err);
          lib.assertExists(err);
        }
      } catch (err) {
        // log.error("outBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, inrevoke in revoke time, it should be success", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let nonX = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pk = config.pks[0];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
          .concat(separator).concat(pk).concat(separator).concat(config.sysTokenContract.name);
        // log.debug("eosio.token transfer from", user1.name, "to", htlcAccount.name, value, memo);
        // log.debug("x:", x);
        // log.debug("xHash:", xHash);

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
        // log.debug(JSON.stringify(eosTokenTran));
        // log.debug("inlock success", eosTokenTran.transaction_id);

        let scope = utils.getUint64AsNumber(htlcContract.name);
        // let scope = htlcContract.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);
        let pkInfo = await eoslime.Provider.eos.getTableRows({json:true, code:htlcContract.name, scope:scope, table:config.htlcTblDict.pks});
        lib.assertStrictEqual(pkInfo.rows.length > 0, true);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let pkId = -1;
        let pkHash;
        for (let info of pkInfo.rows) {
          if (info.pk === pk) {
            pkId = info.id;
            pkHash = info.pkHash;
            break;
          }
        }
        lib.assertNotStrictEqual(pkId, -1);
        lib.assertStrictEqual(pkHash, utils.sha256(Buffer.from(pk)));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkId);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "inlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].wanAddr, wanAddr);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        // s -> ms
        let sleepTime = (crossResult[0].lockedTime + 1)* 1000;

        log.debug("await inrevoke", sleepTime, "ms");
        await utils.sleepMs(sleepTime);

        try {
          let smg1RedeemTx = await htlcContractSmg1.inredeem(x);
          lib.assertFail("cross EOS chain: eosio.token EOS inlock user1 => storeman1, inredeem in revoke time, it should be throw error");
        } catch (err) {
          // log.debug("inredeem in revoke time, it should be throw error:", err);
          lib.assertExists(err);
        }

        let user1RevokeTx = await htlcContractUser1.inrevoke(xHash);
        // log.debug("inrevoke success", JSON.stringify(user1RevokeTx));
    } catch (err) {
        // log.error("inBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, outrevoke in revoke time, it should be success", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pk = config.pks[0];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
        let r = "";
        let s = "";

        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, r, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);
        // let scope = htlcContractSmg1.name;
        // if (!isNaN(Number(scope))) {
        //   scope = utils.getUint64AsNumber(scope);
        // }
        // log.debug(scope);

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);
        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "outlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        // s -> ms
        let sleepTime = (crossResult[0].lockedTime + 1) * 1000;

        log.debug("await outrevoke", sleepTime, "ms");
        await utils.sleepMs(sleepTime);

        try {
          let user1RedeemTx = await htlcContractUser1.outredeem(user1.name, x);
          lib.assertFail("eosio.token EOS outlock storeman1 => user1, outredeem in revoke time, it should be throw error");
        } catch (err) {
          // only can revoke after lockedTime
          // log.debug("outredeem in revoke time, it should be throw error:", err);
          lib.assertExists(err);
        }

        let smg1RevokeTx = await htlcContractSmg1.outrevoke(xHash);
        // log.debug("revoke success:", smg1RevokeTx);

      } catch (err) {
        // log.error("outBound failed:", err);
        lib.assertFail(err);
      }
    });

  });
}

initGlobal(parseArgs());
startAutoTest();