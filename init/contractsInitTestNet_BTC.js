var solc = require('solc');
var fs = require('fs');
var path = require('path');

const smgAdmin = artifacts.require('./StoremanGroupAdmin.sol')
const WBTC = artifacts.require('./WBTC.sol')
const WBTCManager = artifacts.require('./WBTCManager.sol')
const HTLCWBTC = artifacts.require('./HTLCWBTC.sol')

require('truffle-test-utils').init()
const web3 = global.web3


contract('deploy donctracts',  ([miner, owner]) => {

  let smgAdminInst;
  let htlcWBTCInst;
  let wbtcManagerInst;
  let wbtcInst;

  let BTC_ID = 1;
  let defaultMinDeposit = web3.toWei(100);
  let htlcType = 1; //use script
  let withdrawDelayTime = (3600*72);
  let ratio = 1600000*2; //1 eth:20,it need to mul the precise 10000,there are a discount 50% for quota caculation,the the quota is deposit/(ratio)
  let storeManTxFeeRatio = 10;//1/1000,need to mul the precie 10000
  let precise = 10000;

  before('set up contract before test', async () => {
    await web3.personal.unlockAccount(owner, 'wanglu', 99999)

    smgAdminInst = await smgAdmin.new({from:owner})
    console.log("\n")
    console.log("\nvar smgAdminAbi=web3.eth.contract(" + JSON.stringify(smgAdminInst.abi)  + ");");
    console.log("var smgAdminInst=smgAdminAbi.at(\'" + smgAdminInst.address + "\');");
    console.log("smgAdminInst.setHalt(true,{from:\'"+ owner +"\'})");

    htlcWBTCInst = await HTLCWBTC.new({from:owner})
    console.log("\n")
    console.log("\nvar HTLCWBTCInstAbi=web3.eth.contract(" + JSON.stringify(htlcWBTCInst.abi) + ");");
    console.log("var HTLCWBTCInst=HTLCWBTCInstAbi.at(\'" + htlcWBTCInst.address + "\');");
    console.log("HTLCWBTCInst.setHalt(true,{from:\'"+ owner +"\'})");


    wbtcManagerInst = await WBTCManager.new(htlcWBTCInst.address,smgAdminInst.address,{from:owner})
    console.log("\n")
    console.log("\nvar wbtcManagerAbi=web3.eth.contract(" + JSON.stringify(wbtcManagerInst.abi) + ");");
    console.log("var wbtcManagerInt=wbtcManagerAbi.at(\'" + wbtcManagerInst.address + "\');");
    console.log("wbtcManagerInt.setHalt(true,{from:\'"+ owner +"\'})");


    wbtcTokenAddr = await wbtcManagerInst.WBTCToken();
    wbtcInst = WBTC.at(wbtcTokenAddr);
    console.log("\n")
    console.log("\nvar WBTCTokenAbi=web3.eth.contract(" + JSON.stringify(wbtcInst.abi) + ");");
    console.log("var WBTCTokenInt=WBTCTokenAbi.at(\'" + wbtcTokenAddr + "\');");
    console.log("WBTCTokenInt.setHalt(true,{from:\'"+ owner +"\'})");


    console.log("address info:\n")
    console.log("smgAdmin         address:" + smgAdminInst.address );
    console.log("HTLCWBTC         address:" + htlcWBTCInst.address );
    console.log("WBTCToken        address:" + wbtcTokenAddr );
    console.log("WBTCTokenManager address:" + wbtcManagerInst.address);
  })


  it('initialize contracts step 1', async () => {


    let originalChainHtlc = '0x00';
    let wanchainHtlcAddr = htlcWBTCInst.address;
    let wanchainTokenManagerAddr = wbtcManagerInst.address

    console.log("originalChainHtlc:"+ originalChainHtlc);
    console.log("wanchainHtlcAddr:"+ wanchainHtlcAddr);
    console.log("wanchainTokenManagerAddr:"+ wanchainTokenManagerAddr);
    console.log("smgAdminInstAddr:"+ smgAdminInst.address);

    console.log(withdrawDelayTime);

    res = await  smgAdminInst.initializeCoin(BTC_ID,
                                            ratio,
                                            defaultMinDeposit,
                                            htlcType,
                                            originalChainHtlc,
                                            wanchainHtlcAddr,
                                            wanchainTokenManagerAddr,
                                            withdrawDelayTime,
                                            {from:owner,gas:4000000}
                                          );
    console.log(res);

    coinInfo = await smgAdminInst.mapCoinInfo(BTC_ID);

    console.log(coinInfo);

    getRatio = coinInfo[0].toString();
    getDefaultMinDeposit = coinInfo[1].toString();
    getHtlcType = coinInfo[2].toString();
    getOriginalChainHtlc = coinInfo[3].toString();
    getWanchainHtlcAddr = coinInfo[4].toString();
    getWanchainTokenManagerAddr = coinInfo[5].toString();
    getWithdrawDelayTime = coinInfo[6].toString();

    assert.equal(getRatio,ratio, 'ratio not match');
    assert.equal(getDefaultMinDeposit,defaultMinDeposit, 'defaultMinDeposit not match');
    assert.equal(getHtlcType,htlcType, 'defaultMinDeposit not match');
    assert.equal(getOriginalChainHtlc,originalChainHtlc, 'originalChainHtlc not match');
    assert.equal(getWanchainHtlcAddr,wanchainHtlcAddr, 'originalChainHtlc not match');
    assert.equal(getWanchainTokenManagerAddr,wanchainTokenManagerAddr, 'wanchainTokenManagerAddr not match');
    assert.equal(getWithdrawDelayTime,withdrawDelayTime, 'withdrawDelayTime not match');

    console.log("set ratio");
    await smgAdminInst.setWToken2WanRatio(BTC_ID,ratio,{from: owner});

    console.log("set delay time");
    await smgAdminInst.setWithdrawDepositDelayTime(BTC_ID,60,{from: owner});

    console.log("set halt");
    await smgAdminInst.setHalt(false,{from: owner});
    console.log(coinInfo);

  })

  it('initialize contracts step 2', async () => {
    await htlcWBTCInst.setStoremanGroupAdmin(smgAdminInst.address,{from: owner})
    smgAminAddrGot = await htlcWBTCInst.storemanGroupAdmin()
    assert.equal(smgAdminInst.address,smgAminAddrGot)

    await htlcWBTCInst.setWBTCManager(wbtcManagerInst.address,{from: owner})
    WBTCManagerAddrGot = await htlcWBTCInst.wbtcManager()
    assert.equal(wbtcManagerInst.address,WBTCManagerAddrGot)

    await htlcWBTCInst.setHalt(false,{from: owner});

    await wbtcManagerInst.setHalt(false,{from: owner});
    htlcGet = await wbtcManagerInst.HTLCWBTC();
    assert.equal(htlcGet,htlcWBTCInst.address,"the htlc address not match");

    wbtcManageAddrGot = await wbtcInst.tokenManager();
    assert.equal(wbtcManageAddrGot,wbtcManagerInst.address)
  })

  // it('register storeman', async () => {
  //
  //     let storeManWanAddr = '0x00';
  //     let storeManBTCAddr = '0x00';
  //
  //     await smgAdminInst.setHalt(true, {from: owner});
  //     await smgAdminInst.setSmgEnableUserWhiteList(BTC_ID, false, {from: owner});
  //     await smgAdminInst.setSystemEnableBonus(BTC_ID, false, 0, {from: owner});
  //     await smgAdminInst.setHalt(false, {from: owner});
  //
  //     console.log("storemanGroupRegister 1");
  //
  //     regDeposit = web3.toWei(400 * ratio / precise);//400 is quota,ration is coin2wan ration,2 is discount,the result is needed wancoin
  //
  //     await  smgAdminInst.storemanGroupRegisterByDelegate(BTC_ID, storeManWanAddr, storeManBtcAddr, storeManTxFeeRatio, {
  //       from: owner,
  //       value: regDeposit,
  //       gas: 4000000
  //     });
  //
  //     getCoinSmgInfo = await smgAdminInst.mapCoinSmgInfo(BTC_ID, storeManWanAddr);
  //     console.log(getCoinSmgInfo);
  //
  //     getDeposit = getCoinSmgInfo[0].toString(10);
  //     getOriginalChainAddr = getCoinSmgInfo[1].toString();
  //     getUnregisterApplyTime = getCoinSmgInfo[2].toString();
  //     gettxFeeRatio = getCoinSmgInfo[3].toString();
  //     getbonusBlockNumber = getCoinSmgInfo[4].toString();
  //     getinitiator = getCoinSmgInfo[5].toString();
  //     getPunished = getCoinSmgInfo[6];
  //
  //     assert.equal(getDeposit, regDeposit, 'regDeposit not match');
  //     assert.equal(getOriginalChainAddr, storeManBtcAddr, 'storeManBtcAddr not match');
  //     assert.equal(getUnregisterApplyTime, 0, 'apply time not match');
  //
  //     assert.equal(gettxFeeRatio, storeManTxFeeRatio, 'gettxFeeRatio not match');
  //     assert.notEqual(getbonusBlockNumber, 0, 'getbonusBlockNumber not match');
  //     assert.equal(getPunished, false, 'getPunished not match');
  //     assert.equal(getinitiator, owner, 'getinitiator not match');
  //
  //     console.log("wbtcManager getStoremanGroup");
  //     btcAdminInfo = await wbtcManagerInst.getStoremanGroup(storeManWanAddr);
  //
  //     console.log(btcAdminInfo);
  //
  //     getQuota = parseInt(btcAdminInfo[0].toString());
  //
  //     assert.equal(web3.fromWei(getQuota), web3.fromWei((regDeposit / ratio) * precise), 'quota not match');
  //
  // })

})