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
  const schnorr = require('./schnorr/tools');

  describe("EOS-WAN-Contract-AutoTest", function() {
    let log = console;
    let eoslime;
    let htlcAccount;
    let htlcContract;
    let htlcContractUser1;
    let htlcContractUser2;
    let htlcContractSmg1;
    let htlcContractSmg2;
    let signAccount;
    let signContract;
    let user1;
    let user2;
    let storeman1;
    let storeman2;
    let buildMpcSign;
    let globalPks = [];

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

      for (let idx = 0; idx < config.skSmgs.length; ++idx) {
        globalPks.push(schnorr.getPKBySk(config.skSmgs[idx]));
      }
      // globalPks = config.skSmgs.map(sk => schnorr.getPKBySk(sk));
      // log.debug(globalPks);

      buildMpcSign = (sk, ...args) => {
        let result = {
          R: schnorr.getR(),
          s: schnorr.getS(sk, args)
        };

        // log.debug("buildMpcSign args:", args);
        // log.debug("buildMpcSign R:", result.R);
        // log.debug("buildMpcSign s:", result.s);
        return result;
      }

    });

    it("cross EOS chain: eosio.token EOS inBound user1 => storeman1, it should be success", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
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

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
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
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));

        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);

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

    it("cross EOS chain: eosio.token EOS inBound user1 => storeman1, set ravoke ratio, it should be success", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
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

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
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

        let ratio = 2;
        let ratioTx = await htlcContract.setratio(ratio);
        // log.debug("set ratio", ratio, "success:", ratioTx);

        let user1RevokeTx = await htlcContractUser1.inrevoke(xHash);
        // log.debug("inredeem success", JSON.stringify(user1RevokeTx));

      } catch (err) {
        // log.error("inBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, xhash too long, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex')) + "a";
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
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
        lib.assertFail("xhash too long, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("xhash too long, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid xHash", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, xhash too short, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'))
        xHash = xHash.slice(0, xHash.length - 1);
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
        let memo = "inlock".concat(separator).concat(xHash).concat(separator).concat(wanAddr)
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
        lib.assertFail("xhash too short, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("xhash too short, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid xHash", err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, xhash too long, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex')) + "a";
        let pkId = 0;
        let pk = globalPks[pkId];

        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("xhash too long, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid xHash", err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, xhash too short, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        xHash = xHash.slice(0, xHash.length - 1);
        let pkId = 0;
        let pk = globalPks[pkId];

        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("xhash too short, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid xHash", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence xhash, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
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
        lib.assertFail("absence xhash, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("absence xhash, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid token account", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence wanAddr, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pkId = 0;
        let pk = globalPks[pkId];
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
        lib.assertFail("absence wanAddr, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("absence pk, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid memo", err);
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
        lib.assertFail("absence pk, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("absence pk, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid token account", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, absence token account, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
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
        lib.assertFail("absence token account, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("absence token account, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid token account", err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, invalid token account, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
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
        lib.assertFail("absence token account, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("invalid memo, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid token account", err);
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
        lib.assertFail("invalid memo, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("invalid memo, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid token account", err);
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
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
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

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "inlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].wanAddr, wanAddr);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        try {
          let user1RevokeTx = await htlcContractUser1.inrevoke(xHash);
          lib.assertFail("inrevoke in redeem time, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("inrevoke in redeem time, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "only can revoke after lockedTime", err);
        }

        try {
          let smg1RedeemTx = await htlcContractSmg1.inredeem(nonX);
          lib.assertFail("inredeem with invalid parameter about x, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("inredeem with invalid parameter about x, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "not found valid record", err);
        }

        let smg1RedeemTx = await htlcContractSmg1.inredeem(x);
        // log.debug("inredeem success", JSON.stringify(smg1RedeemTx));
    } catch (err) {
        // log.error("inBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: eosio.token EOS inlock user1 => storeman1, set revoke ratio, inrevoke in redeem time, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let separator = ":";
        let x = config.xInfo[0];
        let nonX = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
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

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);
        // log.debug("before cross, limit result", JSON.stringify(pkInfo));

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
        lib.assertStrictEqual(crossResult[0].user, user1.name);
        lib.assertStrictEqual(crossResult[0].quantity, value);
        lib.assertStrictEqual(crossResult[0].status, "inlock");
        lib.assertStrictEqual(crossResult[0].xHash, xHash);
        lib.assertStrictEqual(crossResult[0].wanAddr, wanAddr);
        lib.assertStrictEqual(crossResult[0].account, config.sysTokenContract.name);
        // log.debug("crossResult", JSON.stringify(crossResult));

        try {
          let user1RevokeTx = await htlcContractUser1.inrevoke(xHash);
          lib.assertFail("inrevoke in redeem time, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("inrevoke in redeem time, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "only can revoke after lockedTime", err);
        }

        try {
          let smg1RedeemTx = await htlcContractSmg1.inredeem(nonX);
          lib.assertFail("inredeem with invalid parameter about x, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("inredeem with invalid parameter about x, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "not found valid record", err);
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
      let pkId = 0;
      let pk = globalPks[pkId];

      try {
        // invalid token account
        let tokenAccount = "invalidtoken"
        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, tokenAccount, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, tokenAccount, value, xHash, pk, R, s);
        lib.assertFail("invalid token account contract, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//string
        // log.debug("invalid token account contract, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "invalid token account", err);
      }

      try {
        // invalid token account name, length overflow
        let tokenAccount = "invalid.token";
        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, tokenAccount, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, tokenAccount, value, xHash, pk, R, s);
        lib.assertFail("invalid token account name, it should be throw error");
      } catch (err) {
        // log.debug(typeof(err));//Object
        // log.debug("invalid token account name, it should be throw error:", err);
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, TypeError);
        lib.assertInclude(err.message, "A name can be up to 12 characters long", err);
      }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, invalid symbol, it should be throw error", async () => {
        let x = config.xInfo[1];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pkId = 0;
        let pk = globalPks[pkId];

        try {
          // invalid token precision
          let value = "1.00 EOS";
          let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
          let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
          lib.assertFail("invalid symbol precision, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("invalid symbol precision, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "not enough quantity", err);
        }

        try {
          // invalid token symbol_code
          let value = "1.0000 EoS";
          let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
          let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
          lib.assertFail("invalid symbol_code, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//Object
          // log.debug("invalid symbol_code, it should be throw error:", err);
          lib.assertExists(err);
          lib.expectToBeAnInstanceOf(err, Error);
          lib.assertInclude(err.message, "symbol is a required string outlock.quantity action.data transaction.actions", err);
          }
    });

    it("cross EOS chain: eosio.token EOS outlock storeman1 => user1, outrevoke in redeem time, it should be throw error", async () => {
      try {
        let value = "1.0000 EOS";
        let x = config.xInfo[1];
        let nonX = config.xInfo[0];
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));

        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);

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
          lib.assertFail("outrevoke in redeem time, it should be throw error");
        } catch (err) {
          // only can revoke after lockedTime
          // log.debug(typeof(err));//string
          // log.debug("outrevoke in redeem time, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "only can revoke after lockedTime", err);
        }

        try {
          let user2RedeemTx = await htlcContractUser2.outredeem(user2.name, x);
          lib.assertFail("outredeem with invalid parameter about user, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("outredeem with invalid parameter about user, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "not found valid record", err);
        }

        try {
          let user1RedeemTx = await htlcContractUser1.outredeem(user1.name, nonX);
          lib.assertFail("outredeem with invalid parameter about x, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("outredeem with invalid parameter about x, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "not found valid record", err);
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
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));

        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);

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
          lib.assertFail("outrevoke in redeem time, it should be throw error");
        } catch (err) {
          // only can revoke after lockedTime
          // log.debug(typeof(err));//string
          // log.debug("outrevoke in redeem time, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "only can revoke after lockedTime", err);
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
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));

        let scope = utils.getUint64AsNumber(htlcContract.name);

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
          let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
          let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
          lib.assertFail("storeman1 has not enough quantity, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("storeman1 has not enough quantity, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "not enough quantity", err);
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
        let xHash = utils.sha256(Buffer.from(x, 'hex'));
        let wanAddr = config.wanAddrs[0];
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));
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

        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);

        let tableTransfers = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.transfers, scope);

        // result = await tableTransfers.find();
        // log.debug("result", JSON.stringify(result));
        // let result = await htlcContract.provider.select(global.htlc.name).from("transfers").limit(10).find();
        // log.debug("after cross, limit result", JSON.stringify(result));

        let crossResult = await tableTransfers.equal(xHash).index(2, "sha256").find();
        lib.assertStrictEqual(crossResult.length, 1);
        lib.assertStrictEqual(crossResult[0].pid, pkInfo[0].id);
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
          lib.assertFail("inredeem in revoke time, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("inredeem in revoke time, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "redeem timeout, only can redeem in lockedTime", err);
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
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));

        let {R, s} = buildMpcSign(config.skSmgs[pkId], user1.name, config.sysTokenContract.name, value, xHash);
        let smg1OutlockTx = await htlcContractSmg1.outlock(user1.name, config.sysTokenContract.name, value, xHash, pk, R, s);
        // log.debug("outlock success", JSON.stringify(smg1OutlockTx));

        let scope = utils.getUint64AsNumber(htlcContractSmg1.name);

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
          lib.assertFail("outredeem in revoke time, it should be throw error");
        } catch (err) {
          // only can revoke after lockedTime
          // log.debug(typeof(err));//string
          // log.debug("outredeem in revoke time, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "redeem timeout, only can redeem in lockedTime", err);
        }

        let smg1RevokeTx = await htlcContractSmg1.outrevoke(xHash);
        // log.debug("revoke success:", smg1RevokeTx);

      } catch (err) {
        // log.error("outBound failed:", err);
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: HTLC regsig, duplicate register, it should be throw error", async () => {
      try {
        let regSigTx = await htlcContract.regsig(config.customSignContract.name, config.customSignContract.action);
        lib.assertFail("HTLC regsig, duplicate register, it should be throw error");
      } catch(err) {
        // log.debug(typeof(err));//string
        // log.debug("HTLC regsig, duplicate register, it should be throw error:", err);
        lib.assertExists(err);
        lib.assertStrictEqual(typeof(err), "string");
        lib.assertInclude(err, "reduplicative record", err);
        // lib.assertInclude(err, "duplicate transaction", err);
      }
    });

    it("cross EOS chain: HTLC regsig, updatesig, unregsig, it should be success", async () => {
      try {
        let scope = utils.getUint64AsNumber(htlcContract.name);

        let tableSig = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.signer, scope);
        let sigInfo = await tableSig.find();
        lib.assertStrictEqual(sigInfo.length, 1);
        lib.assertStrictEqual(sigInfo[0].code, config.customSignContract.name);
        lib.assertStrictEqual(sigInfo[0].action, config.customSignContract.action);
        // log.debug("before update signature", JSON.stringify(sigInfo));

        let invalidSigner = {
          name:"invalidaccnt",
          action: config.customSignContract.action
        };

        let updateSigTx = await htlcContract.updatesig(config.customSignContract.name, invalidSigner.name, invalidSigner.action);
        sigInfo = await tableSig.find();
        lib.assertStrictEqual(sigInfo.length, 1);
        lib.assertStrictEqual(sigInfo[0].code, invalidSigner.name);
        lib.assertStrictEqual(sigInfo[0].action, invalidSigner.action);
        // log.debug("update signature", JSON.stringify(sigInfo));

        let unregSigTx = await htlcContract.unregsig(invalidSigner.name);
        sigInfo = await tableSig.find();
        lib.assertStrictEqual(sigInfo.length, 0);
        // log.debug("unregister signature", JSON.stringify(sigInfo));

        let regSigTx = await htlcContract.regsig(config.customSignContract.name, config.customSignContract.action);
        sigInfo = await tableSig.find();
        lib.assertStrictEqual(sigInfo.length, 1);
        lib.assertStrictEqual(sigInfo[0].code, config.customSignContract.name);
        lib.assertStrictEqual(sigInfo[0].action, config.customSignContract.action);
        // log.debug("register signature", JSON.stringify(sigInfo));

      } catch(err) {
        lib.assertFail(err);
      }
    });

    it("cross EOS chain: HTLC storeman1 withdraw, it should be success", async () => {
      try {
        let pkId = 0;
        let pk = globalPks[pkId];
        let pkHash = utils.sha256(Buffer.from(pk, 'utf8'));

        let scope = utils.getUint64AsNumber(htlcContract.name);
        let tablePks = await utils.getContractTable(htlcContract, htlcAccount.name, config.htlcTblDict.pks, scope);
        let pkInfo = await tablePks.equal(pkHash).index(2, "sha256").find();
        lib.assertStrictEqual(pkInfo.length, 1);
        lib.assertStrictEqual(pkInfo[0].pk, pk);
        lib.assertStrictEqual(pkInfo[0].pkHash, pkHash);

        // log.debug("pk:", pk, "pkHash:", pkHash);
        // log.debug("pkInfo:", JSON.stringify(pkInfo));
        try {
          let nowTime = String(0);
          let sym = "4,EOS";
          let {R, s} = buildMpcSign(config.skSmgs[pkId], nowTime, storeman1.name, config.sysTokenContract.name, sym);
          let withdrawTx = await htlcContractSmg1.withdraw(config.sysTokenContract.name, sym, pk, nowTime, storeman1.name, R, s);
          lib.assertFail("timestamp too short, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("timestamp too short, it should be throw error:", err);
          lib.assertExists(err);
          if (typeof(err) === "string") {
            lib.assertInclude(err, "time stamp (uint:s) is too big", err);
          } else {
            lib.expectToBeAnInstanceOf(err, Error);
            lib.assertInclude(err.message, "time stamp (uint:s) is too big", err);
          }
        }

        try {
          let invalidSym = "ERR";
          let nowTime = (Date.now() / 1000).toFixed(0);
          let {R, s} = buildMpcSign(config.skSmgs[pkId], nowTime, storeman1.name, config.sysTokenContract.name, invalidSym);
          let withdrawTx = await htlcContractSmg1.withdraw(config.sysTokenContract.name, invalidSym, pk, nowTime, storeman1.name, R, s);
          lib.assertFail("invalid symbol, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("invalid symbol, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "invalid symbol", err);
        }

        try {
          let undefinedSym = "4,ERR";
          let nowTime = (Date.now() / 1000).toFixed(0);
          let {R, s} = buildMpcSign(config.skSmgs[pkId], nowTime, storeman1.name, config.sysTokenContract.name, undefinedSym);
          let withdrawTx = await htlcContractSmg1.withdraw(config.sysTokenContract.name, undefinedSym, pk, nowTime, storeman1.name, R, s);
          lib.assertFail("not found valid record, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//string
          // log.debug("not found valid record, it should be throw error:", err);
          lib.assertExists(err);
          lib.assertStrictEqual(typeof(err), "string");
          lib.assertInclude(err, "not found valid record", err);
        }

        let now = new Date((Date.now() + 8*60*60*1000)).getTime();
        let nowTime = (now / 1000).toFixed(0);
        // let nowTime = (Date.now() / 1000).toFixed(0);
        let smgFeeReceiverTimeout = 20;
        // let tokenAccount = config.sysTokenContract.name;
        // let tokenSym = "4,EOS";
        let tokenAccount = "";
        tokenAccount = tokenAccount.trim();
        let tokenSym = "";
        tokenSym = tokenSym.trim();
        // log.debug("nowTime:\"", nowTime, "\"");
        // log.debug("tokenAccount:\"", tokenAccount, "\"");
        // log.debug("tokenSym:\"", tokenSym, "\"");

        let R, s;
        let mpcSignResult = buildMpcSign(config.skSmgs[pkId], nowTime, storeman1.name, tokenAccount, tokenSym);
        R = mpcSignResult.R;
        s = mpcSignResult.s;
        // log.debug("R:", R);
        // log.debug("s:", s);

        let packedTx = await eoslime.Provider.eos.transaction({
          actions:[
            {
              account: htlcContract.name,
              name: "withdraw",
              authorization:[
                {
                  actor: storeman1.name,
                  permission: config.permissionDict.active
                }
              ],
              data: {
                account:tokenAccount,
                sym: tokenSym,
                pk: pk,
                timeStamp: nowTime,
                receiver: storeman1.name,
                r: R,
                s: s,
              }
            }
          ]
        }, { broadcast: false, sign: true, keyProvider: storeman1.privateKey });
        // log.debug("pack tx:", JSON.stringify(packedTx));

        try {
          let tx = await eoslime.Provider.eos.pushTransaction(packedTx.transaction);
          // log.debug("withdraw success:", tx);
        } catch(err) {
          lib.assertFail(err);
        }

        let sleepTime = (smgFeeReceiverTimeout + 1) * 1000;
        log.debug("await withdraw timeout", sleepTime, "ms");
        await utils.sleepMs(sleepTime)

        try {
          tx = await eoslime.Provider.eos.pushTransaction(packedTx.transaction);
          lib.assertFail("duplicate withdraw while timeout, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//Object
          // log.debug("duplicate withdraw while timeout, it should be throw error:", err);
          lib.assertExists(err);
          lib.expectToBeAnInstanceOf(err, Error);
          lib.assertInclude(err.message, "duplicate transaction", err);
        }

        try {
          let replyTx = await eoslime.Provider.eos.transaction({
            actions:[
              {
                account: htlcContract.name,
                name: "withdraw",
                authorization:[
                  {
                    actor: storeman1.name,
                    permission: config.permissionDict.active
                  }
                ],
                data: {
                  account:tokenAccount,
                  sym: tokenSym,
                  pk: pk,
                  timeStamp: nowTime,
                  receiver: storeman1.name,
                  r: R,
                  s: s,
                }
              }
            ]
          }, { broadcast: false, sign: false, keyProvider: storeman1.privateKey });
          // log.debug("reply tx:", JSON.stringify(replyTx));

          replyTx.transaction.signatures = packedTx.transaction.signatures;
          tx = await eoslime.Provider.eos.pushTransaction(replyTx.transaction);
          lib.assertFail("not satisfy withdraw while timeout, it should be throw error");
        } catch (err) {
          // log.debug(typeof(err));//Object
          // log.debug("not satisfy withdraw while timeout, it should be throw error:", err);
          lib.assertExists(err);
          lib.expectToBeAnInstanceOf(err, Error);
          lib.assertInclude(err.message, "Provided keys, permissions, and delays do not satisfy declared authorizations", err);
        }

      } catch(err) {
        lib.assertFail(err);
      }
    });

  });
}

initGlobal(parseArgs());
startAutoTest();