var solc = require('solc');
var fs = require('fs');
var path = require('path');


const web3 = global.web3
//var compiled = solc.compile(content, 1);
//var icoContract = web3.eth.contract(JSON.parse(compiled.contracts[':WanchainContribution'].interface));


const smgAdmin = artifacts.require('./StoremanGroupAdmin.sol')

const WETH = artifacts.require('./WETH.sol')
const WETHManager = artifacts.require('./WETHManager.sol')

const HTLCWETH = artifacts.require('./HTLCWETH.sol')
const HTLCETH = artifacts.require('./HTLCETH.sol')



var htlcETHAbi = 'web3.eth.contract([{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashShadow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"storeman","type":"address"},{"name":"wanAddr","type":"address"}],"name":"eth2wethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"RATIO_PRECISE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"eth2wethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"weth2ethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashHTLCTxs","outputs":[{"name":"direction","type":"uint8"},{"name":"source","type":"address"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"status","type":"uint8"},{"name":"lockedTime","type":"uint256"},{"name":"beginLockedTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DEF_LOCKED_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"weth2ethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"xHashExist","outputs":[{"name":"exist","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lockedTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"revokeFeeRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"getHTLCLeftLockedTime","outputs":[{"name":"time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DEF_MAX_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"ratio","type":"uint256"}],"name":"setRevokeFeeRatio","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"time","type":"uint256"}],"name":"setLockedTime","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"user","type":"address"}],"name":"weth2ethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"eth2wethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"wanAddr","type":"address"}],"name":"ETH2WETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"ETH2WETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"ETH2WETHRevoke","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"WETH2ETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"WETH2ETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"WETH2ETHRevoke","type":"event"}])';

var wethAbi = 'web3.eth.contract([{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"tokenManager","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"burn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"lockTo","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"WETHManagerAddr","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenMintedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenBurntLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"value","type":"uint256"}],"name":"TokenLockedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"manager","type":"address"}],"name":"WETHManagerLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}])';

contract('deploy donctracts',  ()=> {

  //const owner = "0xbb9003ca8226f411811dd16a3f1a2c1b3f71825d"
  const owner = "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8"

  let HTLCETHAddr = '0x358b18d9dfa4cce042f2926d014643d4b3742b31';

  let storeManEthAddr = '0xdd91e4af8a3173702f22e88ca4963d53ff08df3f';
  let storeManWanAddr = '0x8d105ba8ce933f9761c8f1b4c2f5f2fc0f434584';

  let smgAdminInst;
  let htlcWETHInst;
  let wethManagerInst;

  let ETHEREUM_ID = 0;

  let defaultMinDeposit = web3.toWei(100);
  let htlcType = 1; //use contract
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

    console.log("\n")
    console.log("\nvar HTLCETHAbi=" + htlcETHAbi + ";");
    console.log("var HTLCETHInt=HTLCETHAbi.at(\'" + HTLCETHAddr + "\');");
    console.log("HTLCETHInt.setHalt(true,{from:\'"+ owner +"\'})");

    htlcWETHInst = await HTLCWETH.new({from:owner})
    console.log("\n")
    console.log("\nvar HTLCWETHInstAbi=web3.eth.contract(" + JSON.stringify(htlcWETHInst.abi) + ");");
    console.log("var HTLCWETHInst=HTLCWETHInstAbi.at(\'" + htlcWETHInst.address + "\');");
    console.log("HTLCWETHInst.setHalt(true,{from:\'"+ owner +"\'})");


    wethManagerInst = await WETHManager.new(htlcWETHInst.address,smgAdminInst.address,{from:owner})
    console.log("\n")
    console.log("\nvar wethManagerAbi=web3.eth.contract(" + JSON.stringify(wethManagerInst.abi) + ");");
    console.log("var wethManagerInt=wethManagerAbi.at(\'" + wethManagerInst.address + "\');");
    console.log("wethManagerInt.setHalt(true,{from:\'"+ owner +"\'})");

    wethTokenAddr = await wethManagerInst.WETHToken();
    console.log("\n")
    console.log("\nvar WETHTokenAbi=" + wethAbi + ";");
    console.log("var WETHTokenInt=WETHTokenAbi.at(\'" + wethTokenAddr + "\');");
    console.log("WETHTokenInt.setHalt(true,{from:\'"+ owner +"\'})");


    console.log("address info:\n")
    console.log("smgAdmin         address:" + smgAdminInst.address );
    console.log("HTLCETH          address:" + HTLCETHAddr );
    console.log("HTLCWETH         address:" + htlcWETHInst.address );
    console.log("WETHToken        address:" + wethTokenAddr );
    console.log("WETHTokenManager address:" + wethManagerInst.address);
  })

  it('initialize contracts step 1', async () => {

  })


  it('initialize contracts step 1', async () => {


    let originalChainHtlc = HTLCETHAddr;
    let wanchainHtlcAddr = htlcWETHInst.address;
    let wanchainTokenManagerAddr = wethManagerInst.address

    console.log("originalChainHtlc:"+ originalChainHtlc);
    console.log("wanchainHtlcAddr:"+ wanchainHtlcAddr);
    console.log("wanchainTokenManagerAddr:"+ wanchainTokenManagerAddr);
    console.log("smgAdminInstAddr:"+ smgAdminInst.address);

    console.log(withdrawDelayTime);

    res = await  smgAdminInst.initializeCoin(ETHEREUM_ID,
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

    coinInfo = await smgAdminInst.mapCoinInfo(ETHEREUM_ID);

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
    await smgAdminInst.setWToken2WanRatio(ETHEREUM_ID,ratio,{from: owner});

    console.log("set delay time");
    await smgAdminInst.setWithdrawDepositDelayTime(ETHEREUM_ID,60,{from: owner});

    console.log("set halt");
    await smgAdminInst.setHalt(false,{from: owner});
    console.log(coinInfo);

  })

  it('initialize contracts step 2', async () => {
    await htlcWETHInst.setStoremanGroupAdmin(smgAdminInst.address,{from: owner})
    smgAminAddrGot = await htlcWETHInst.storemanGroupAdmin()
    assert.equal(smgAdminInst.address,smgAminAddrGot)

    await htlcWETHInst.setWETHManager(wethManagerInst.address,{from: owner})
    WETHManagerAddrGot = await htlcWETHInst.wethManager()
    assert.equal(wethManagerInst.address,WETHManagerAddrGot)

    await htlcWETHInst.setHalt(false,{from: owner});

    await wethManagerInst.setHalt(false,{from: owner});
    htlcGet = await wethManagerInst.HTLCWETH();
    assert.equal(htlcGet,htlcWETHInst.address,"the htlc address not match");

    wethAddr = await wethManagerInst.WETHToken()
    wethInst = WETH.at(wethAddr);
    //
    wethManageAddrGot = await wethInst.tokenManager();
    assert.equal(wethManageAddrGot,wethManagerInst.address)
  })

  it('register storeman', async () => {

      await smgAdminInst.setHalt(true, {from: owner});
      await smgAdminInst.setSmgEnableUserWhiteList(ETHEREUM_ID, false, {from: owner});
      await smgAdminInst.setSystemEnableBonus(ETHEREUM_ID, false, 0, {from: owner});
      await smgAdminInst.setHalt(false, {from: owner});

      console.log("storemanGroupRegister 1");

      regDeposit = web3.toWei(400 * ratio / precise);//400 is quota,ration is coin2wan ration,2 is discount,the result is needed wancoin

      await  smgAdminInst.storemanGroupRegisterByDelegate(0, storeManWanAddr, storeManEthAddr, storeManTxFeeRatio, {
        from: owner,
        value: regDeposit,
        gas: 4000000
      });

      getCoinSmgInfo = await smgAdminInst.mapCoinSmgInfo(0, storeManWanAddr);
      console.log(getCoinSmgInfo);

      getDeposit = getCoinSmgInfo[0].toString(10);
      getOriginalChainAddr = getCoinSmgInfo[1].toString();
      getUnregisterApplyTime = getCoinSmgInfo[2].toString();
      gettxFeeRatio = getCoinSmgInfo[3].toString();
      getbonusBlockNumber = getCoinSmgInfo[4].toString();
      getinitiator = getCoinSmgInfo[5].toString();
      getPunished = getCoinSmgInfo[6];

      assert.equal(getDeposit, regDeposit, 'regDeposit not match');
      assert.equal(getOriginalChainAddr, storeManEthAddr, 'storeManEthAddr not match');
      assert.equal(getUnregisterApplyTime, 0, 'apply time not match');

      assert.equal(gettxFeeRatio, storeManTxFeeRatio, 'gettxFeeRatio not match');
      assert.notEqual(getbonusBlockNumber, 0, 'getbonusBlockNumber not match');
      assert.equal(getPunished, false, 'getPunished not match');
      assert.equal(getinitiator, owner, 'getinitiator not match');

      console.log("wethManager getStoremanGroup");
      ethAdminInfo = await wethManagerInst.getStoremanGroup(storeManWanAddr);

      console.log(ethAdminInfo);

      getQuota = parseInt(ethAdminInfo[0].toString());

      assert.equal(web3.fromWei(getQuota), web3.fromWei((regDeposit / ratio) * precise), 'quota not match');

  })

})