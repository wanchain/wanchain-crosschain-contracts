const smgAdmin = artifacts.require('./StoremanGroupAdmin.sol')

const WETH = artifacts.require('./WETH.sol')
const WETHAdmin = artifacts.require('./WETHManager.sol')

const groupWethProxy = artifacts.require('./HTLCWETH.sol')
const groupEthProxy = artifacts.require('./HTLCETH.sol')

const web3 = global.web3

account1 = "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8"
account2 = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e"
account3 = "0x130407476fff4616d01f6eadd90845dc8a65e23a"


originalSCAddr = "0x18f940983efda661f29b8b18609daf28d0cd5bff"
wanProcxSCAddr = "0x7be51825b86e250c0ba25388e47ab7530cd0b3f5"

storeManEthAddr = '0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e';
storeManWanAddr = '0xcd5a7fcc744481d75ab3251545befb282e785882';

storeManEthAddr1 = '0x21e7f6c5fe0e26609f271f6e9f1343bb753f1096';
storeManWanAddr1 = '0x1c8a5e26abf1bd54c562519beb402fefea1549f9';

storeManEthAddr2 = '0x21e7f6c5fe0e26609f271f6e9f1343bb753f1096';
storeManWanAddr2 = '0xf0c5303cac409131397822e4acd7a79540ac7a51';

storeManEthAddr3 = '0x21e7f6c5fe0e26609f271f6e9f1343bb753f1096';
storeManWanAddr3 = '0x7d055985cee158d8eb48fc18cabf78e3e398525e';

zeroBalnaceAddr = '0xcb651cb4fdcd905922cb850ad8000fd862695444'

ethRatio = 10;
regDeposit = 20;

delayTime = 1;

const ETHEREUM_ID = 0;

function sleep(milliSeconds) {
  var startTime = new Date().getTime();
  while (new Date().getTime() < startTime + milliSeconds);
};
var wethAbi = web3.eth.contract([{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"tokenManager","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"burn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"lockTo","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"WETHManagerAddr","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenMintedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenBurntLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"value","type":"uint256"}],"name":"TokenLockedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"manager","type":"address"}],"name":"WETHManagerLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]);

contract('StoremanAdminSC', ([owner, admin, proxy, storemanGroup])=> {

  let WETHInstance;
  let WETHAdminInstance;


  let smgAdminInstance;
  let groupWethProxyInst;
  let storeManTxFeeRatio = 1;//need to mul the precie 10000,1/10000

  before('set up contract before test', async () => {

    await web3.personal.unlockAccount(owner, 'wanglu', 99999)
    await web3.personal.unlockAccount(admin, 'wanglu', 99999)
    await web3.personal.unlockAccount(proxy, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroup, 'wanglu', 99999)
    await web3.personal.unlockAccount(account1, 'wanglu', 99999)
    await web3.personal.unlockAccount(account2, 'wanglu', 99999)
    await web3.personal.unlockAccount(account3, 'wanglu', 99999)

    await web3.personal.unlockAccount(storeManWanAddr1, 'wanglu', 99999)
    await web3.personal.unlockAccount(storeManWanAddr2, 'wanglu', 99999)
    await web3.personal.unlockAccount(storeManWanAddr3, 'wanglu', 99999)
    await web3.eth.sendTransaction({from:account1,to:storeManWanAddr2,value:web3.toWei(101)})

    smgAdminInstance = await smgAdmin.new({from:owner})
    groupWethProxyInst = await groupWethProxy.new({from:owner})

//    WETHInstance = await WETH.new({from: owner})
    WETHAdminInstance = await WETHAdmin.new(groupWethProxyInst.address,smgAdminInstance.address,{from:owner});

    WETHInstanceAddr = await WETHAdminInstance.WETHToken();
    WETHInstance = wethAbi.at(WETHInstanceAddr);

  })

  it('initialize contracts - [smgAmin-T00100]', async () => {

      let ratio = 200000; //1 eth:20,it need to mul the precise 10000
      let defaultMinDeposit = web3.toWei(100);
      let htlcType = 1; //use contract

      let originalChainHtlc = '0x7452bcd07fc6bb75653de9d9459bd442ac3f5c52';

      let wanchainHtlcAddr = groupWethProxyInst.address;
      let wanchainTokenAddr = WETHInstance.address;
      let wanchainTokenAdminAddr = WETHAdminInstance.address;

      let withdrawDelayTime = (3600*72);

      console.log("originalChainHtlc:"+ originalChainHtlc);
      console.log("wanchainHtlcAddr:"+ wanchainHtlcAddr);
      console.log("wanchainTokenAddr:"+ wanchainTokenAddr);
      console.log("wanchainTokenAminAddr:"+ wanchainTokenAdminAddr);
      console.log("smgAdminInstance:"+ smgAdminInstance.address);

      console.log(withdrawDelayTime);



      res = await  smgAdminInstance.initializeCoin(ETHEREUM_ID,
        ratio,
        defaultMinDeposit,
        htlcType,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );
      //console.log(res);

      coinInfo = await smgAdminInstance.mapCoinInfo(ETHEREUM_ID);

      console.log(coinInfo);

      getRatio = coinInfo[0].toString();
      getDefaultMinDeposit = coinInfo[1].toString();
      getHtlcType = coinInfo[2].toString();
      getOriginalChainHtlc = coinInfo[3].toString();
      getWanchainHtlcAddr = coinInfo[4].toString();
      getWanchainTokenAdminAddr = coinInfo[5].toString();
      getWithdrawDelayTime = coinInfo[6].toString();

      assert.equal(getRatio,ratio, 'ratio not match');
      assert.equal(getDefaultMinDeposit,defaultMinDeposit, 'defaultMinDeposit not match');
      assert.equal(getHtlcType,htlcType, 'defaultMinDeposit not match');
      assert.equal(getOriginalChainHtlc,originalChainHtlc, 'originalChainHtlc not match');
      assert.equal(getWanchainHtlcAddr,wanchainHtlcAddr, 'originalChainHtlc not match');
      assert.equal(getWanchainTokenAdminAddr,wanchainTokenAdminAddr, 'wanchainTokenAddr not match');
      assert.equal(getWithdrawDelayTime,withdrawDelayTime, 'withdrawDelayTime not match');

      console.log("set ratio");
      await smgAdminInstance.setWToken2WanRatio(ETHEREUM_ID,ratio,{from: account1});

      console.log("set delay time");
      await smgAdminInstance.setWithdrawDepositDelayTime(ETHEREUM_ID,delayTime,{from: account1});

      console.log("set halt");
      await smgAdminInstance.setHalt(false);
      //console.log(coinInfo);

      console.log("initialize token admin's proxy address");
      getProxyAddr = await  WETHAdminInstance.HTLCWETH();
      assert.equal(getProxyAddr,groupWethProxyInst.address, 'wanchainTokenAddr not match');

      console.log("initialize token admin's smgAdmin address");
      getAdminAddr = await  WETHAdminInstance.storemanGroupAdmin();
      assert.equal(getAdminAddr,smgAdminInstance.address, 'wanchainTokenAddr not match');

      await WETHAdminInstance.setHalt(false);

      console.log("initialize group weth to set token admin");

      await groupWethProxyInst.setWETHManager(wanchainTokenAdminAddr,{from: account1});
      getTokenAdmin = await  groupWethProxyInst.wethManager();
      assert.equal(getTokenAdmin,wanchainTokenAdminAddr, 'wanchainTokenAdminAddr not match');

      await groupWethProxyInst.setStoremanGroupAdmin(smgAdminInstance.address,{from: account1});
      smgAdminAddr = await  groupWethProxyInst.storemanGroupAdmin();
      assert.equal(smgAdminAddr,smgAdminInstance.address, 'wanchainTokenAdminAddr not match');

      await groupWethProxyInst.setHalt(false);

      await smgPrepare1();

    })



    async function smgPrepare1() {

      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
      await smgAdminInstance.setWithdrawDepositDelayTime(ETHEREUM_ID,1,{from: account1});
      await smgAdminInstance.setHalt(false,{from: account1});

      console.log("storemanGroupRegister");
      regDeposit = web3.toWei(100);

      preBal = web3.fromWei(web3.eth.getBalance(smgAdminInstance.address));
      console.log("preBal" + preBal);
      await  smgAdminInstance.storemanGroupRegister(0,storeManEthAddr,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});

      getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,account1);

      getDeposit = getCoinSmgInfo[0].toString();
      getOriginalChainAddr =  getCoinSmgInfo[1].toString();
      getUnregisterApplyTime =  getCoinSmgInfo[2].toString();

      assert.equal(getDeposit,regDeposit, 'regDeposit not match');
      assert.equal(getOriginalChainAddr,storeManEthAddr, 'storeManEthAddr not match');
      assert.equal(getUnregisterApplyTime,0, 'regDeposit not match');

      res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:account1,gas:1000000});
      coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,account1);

      getUnregisterApplyTime =  coinSmgInfo[2].toString();
      assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

      sleep(delayTime*2*1000);
    }

  async function smgPrepare2() {

    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
    await smgAdminInstance.setWithdrawDepositDelayTime(ETHEREUM_ID,60*60,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});

    console.log("storemanGroupRegister");
    regDeposit = web3.toWei(100);

    preBal = web3.fromWei(web3.eth.getBalance(smgAdminInstance.address));
    console.log("preBal" + preBal);
    await  smgAdminInstance.storemanGroupRegister(0,storeManEthAddr1,storeManTxFeeRatio,{from:storeManWanAddr1,value:regDeposit,gas:4000000});

    getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr1);

    getDeposit = getCoinSmgInfo[0].toString();
    getOriginalChainAddr =  getCoinSmgInfo[1].toString();
    getUnregisterApplyTime =  getCoinSmgInfo[2].toString();

    assert.equal(getDeposit,regDeposit, 'regDeposit not match');
    assert.equal(getOriginalChainAddr,storeManEthAddr1, 'storeManEthAddr not match');
    assert.equal(getUnregisterApplyTime,0, 'regDeposit not match');

  }

  it('initializeCoin - [smgAmin-T00101]',async () => {
    let setErr;

    try {

      await smgAdminInstance.setHalt(true,{from: account1});

      res = await  smgAdminInstance.initializeCoin(3,
        ratio,
        defaultMinDeposit,
        htlcType,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:storeManWanAddr1,gas:4000000}
      );

      await smgAdminInstance.setHalt(false,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00101]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00102]',async () => {
    let setErr;

    await smgAdminInstance.setHalt(false,{from: account1});

    try {

      res = await  smgAdminInstance.initializeCoin(3,
        ratio,
        defaultMinDeposit,
        htlcType,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00102]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00103]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        ratio,
        defaultMinDeposit,
        htlcType,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00103]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00104]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        0,
        defaultMinDeposit,
        htlcType,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00104]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00105]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        ratio,
        9,
        originalChainHtlc,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00105]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00106]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        ratio,
        defaultMinDeposit,
        2,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00106]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00107]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        ratio,
        defaultMinDeposit,
        htlcType,
        "0x",
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00107]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00108]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        ratio,
        defaultMinDeposit,
        0,
        originalChainHtlc,
        "0x",
        wanchainTokenAdminAddr,
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00100]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00109]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        ratio,
        defaultMinDeposit,
        htlcType,
        originalChainHtlc,
        wanchainHtlcAddr,
        "0x",
        withdrawDelayTime,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00109]Error must be thrown');
  })

  it('initializeCoin - [smgAmin-T00110]',async () => {
    let setErr;

    try {
      res = await  smgAdminInstance.initializeCoin(0,
        ratio,
        defaultMinDeposit,
        htlcType,
        originalChainHtlc,
        wanchainHtlcAddr,
        wanchainTokenAdminAddr,
        3600*48,
        {from:account1,gas:4000000}
      );

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00110]Error must be thrown');
  })

/////////////////////////////////////////////////////////////////////////////////////
  it('setWithdrawDepositDelayTime - [smgAmin-T00211]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});

    try {

      res =  await smgAdminInstance.setWithdrawDepositDelayTime(ETHEREUM_ID,7200,{from: account2});

    } catch (err) {
      setErr = err;
    }

    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00211]Error must be thrown');
  })

  it('setWithdrawDepositDelayTime - [smgAmin-T00212]',async () => {
    let setErr;

    try {

      res =  await smgAdminInstance.setWithdrawDepositDelayTime(ETHEREUM_ID,7200,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00212]Error must be thrown');
  })


  it('setWithdrawDepositDelayTime - [smgAmin-T00213]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    try {

      res =  await smgAdminInstance.setWithdrawDepositDelayTime(3,7200,{from: account1});

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00213]Error must be thrown');
  })

  it('setWithdrawDepositDelayTime - [smgAmin-T00214]',async () => {
    let setErr;

    await smgAdminInstance.setHalt(true,{from: account1});

    try {

      res =  await smgAdminInstance.setWithdrawDepositDelayTime(ETHEREUM_ID,0,{from: account1});

    } catch (err) {
      setErr = err;
    }


    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00214]Error must be thrown');
  })
/////////////////////////////////////////////////////////////////////////////////////
  it('setWToken2WanRatio - [smgAmin-T00201]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});

    try {

      res =  await smgAdminInstance.setWToken2WanRatio(ETHEREUM_ID,880,{from: account2});

    } catch (err) {
      setErr = err;
    }

    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00201]Error must be thrown');
  })

  it('setWToken2WanRatio - [smgAmin-T00202]',async () => {
    let setErr;

    try {

      res =  await smgAdminInstance.setWToken2WanRatio(ETHEREUM_ID,880,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00202]Error must be thrown');
  })


  it('setWToken2WanRatio - [smgAmin-T00203]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    try {

      res =  await smgAdminInstance.setWToken2WanRatio(3,880,{from: account1});

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00203]Error must be thrown');
  })

  it('setWToken2WanRatio - [smgAmin-T00204]',async () => {
    let setErr;

    await smgAdminInstance.setHalt(true,{from: account1});

    try {

      res =  await smgAdminInstance.setWToken2WanRatio(ETHEREUM_ID,0,{from: account1});

    } catch (err) {
      setErr = err;
    }


    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00204]Error must be thrown');
  })
/////////////////////////////////////////////////////////////////////////////////////
  it('setSystemEnableBonus - [smgAmin-T00221]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});

    try {

      res =  await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,{from: account2});

    } catch (err) {
      setErr = err;
    }

    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00221]Error must be thrown');
  })

  it('setSystemEnableBonus - [smgAmin-T00222]',async () => {
    let setErr;

    try {

      res =  await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00222]Error must be thrown');
  })


  it('setSystemEnableBonus - [smgAmin-T00223]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    try {

      res =  await smgAdminInstance.setSystemEnableBonus(3,true,0,{from: account1});

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00223]Error must be thrown');
  })

  it('setSystemBonusPeriod - [smgAmin-T00224]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});

    try {

      res =  await smgAdminInstance.setSystemBonusPeriod(ETHEREUM_ID,1,{from: account2});

    } catch (err) {
      setErr = err;
    }

    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00224]Error must be thrown');
  })

  it('setSystemEnableBonus - [smgAmin-T00225]',async () => {
    let setErr;

    try {

      res =  await smgAdminInstance.setSystemBonusPeriod(ETHEREUM_ID,1,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00225]Error must be thrown');
  })


  it('setSystemEnableBonus - [smgAmin-T00226]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    try {

      res =  await smgAdminInstance.setSystemBonusPeriod(3,1,{from: account1});

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00226]Error must be thrown');
  })

  it('setSystemEnableBonus - [smgAmin-T00227]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    try {

      res =  await smgAdminInstance.setSystemBonusPeriod(0,0,{from: account1});

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00226]Error must be thrown');
  })
/////////////////////////////////////////////////////////////////////////////////////
  it('setSmgEnableUserWhiteList - [smgAmin-T00231]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});

    try {

      res =  await smgAdminInstance.setSmgEnableUserWhiteList(ETHEREUM_ID,true,{from: account2});

    } catch (err) {
      setErr = err;
    }

    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00231]Error must be thrown');
  })

  it('setSmgEnableUserWhiteList - [smgAmin-T00232]',async () => {
    let setErr;

    try {

      res =  await smgAdminInstance.setSmgEnableUserWhiteList(ETHEREUM_ID,true,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00232]Error must be thrown');
  })


  it('setSmgEnableUserWhiteList - [smgAmin-T00233]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    try {

      res =  await smgAdminInstance.setSmgEnableUserWhiteList(3,true,{from: account1});

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00233]Error must be thrown');
  })


/////////////////////////////////////////////////////////////////////////////////////
  it('depositSmgBonus - [smgAmin-T00241]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    res =  await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});
    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.depositSmgBonus(ETHEREUM_ID,{from: account2,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    await smgAdminInstance.setHalt(false,{from: account1});

    assert.notEqual(setErr, undefined, '[smgAmin-T00241]Error must be thrown');
  })


  it('depositSmgBonus - [smgAmin-T00242]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    res =  await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});

    try {

      res =  await smgAdminInstance.depositSmgBonus(3,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00242]Error must be thrown');
  })


  it('depositSmgBonus - [smgAmin-T00243]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    res =  await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,false,0,{from: account1});
    try {
      res =  await smgAdminInstance.depositSmgBonus(ETHEREUM_ID,{from: account1,value:regDeposit});;

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00243]Error must be thrown');
  })

  it('depositSmgBonus - [smgAmin-T00244]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    try {

      res =  await smgAdminInstance.depositSmgBonus(ETHEREUM_ID,{from: account1,value:0});;

    } catch (err) {
      setErr = err;
    }
    await smgAdminInstance.setHalt(false,{from: account1});
    assert.notEqual(setErr, undefined, '[smgAmin-T00244]Error must be thrown');
  })
//////////////////////////////////////////////////////////////////////////////////////
  it('setSmgWhiteList - [smgAmin-T00251]',async () => {

    let setErr;

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.setSmgWhiteList(ETHEREUM_ID,account3,{from: account2,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00251]Error must be thrown');
  })

  it('setSmgWhiteList - [smgAmin-T00252]',async () => {

    let setErr;

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.setSmgWhiteList(3,account3,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00252]Error must be thrown');
  })

  it('setSmgWhiteList - [smgAmin-T00253]',async () => {

    let setErr;

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.setSmgWhiteList(ETHEREUM_ID,"0x",{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00253]Error must be thrown');
  })

  it('setSmgWhiteList - [smgAmin-T00254]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSmgEnableUserWhiteList(ETHEREUM_ID,false,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.setSmgWhiteList(ETHEREUM_ID,account3,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00254]Error must be thrown');
  })

  it('setSmgWhiteList - [smgAmin-T00255]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSmgEnableUserWhiteList(ETHEREUM_ID,true,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.setSmgWhiteList(ETHEREUM_ID,account1,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00255]Error must be thrown');
  })

  it('setSmgWhiteList - [smgAmin-T00256]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSmgEnableUserWhiteList(ETHEREUM_ID,true,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});

    await smgAdminInstance.setSmgWhiteList(ETHEREUM_ID,account2,{from: account1});

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.setSmgWhiteList(ETHEREUM_ID,account2,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00256]Error must be thrown');
  })
////////////////////////////////////////////////////////////////////////////////////
  it('punishStoremanGroup - [smgAmin-T00261]',async () => {

    let setErr;

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,account1,100,{from: account2,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00261]Error must be thrown');
  })

  it('punishStoremanGroup - [smgAmin-T00262]',async () => {

    let setErr;

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.setSmgWhiteList(3,account3,100,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00262]Error must be thrown');
  })



  it('punishStoremanGroup - [smgAmin-T00264]',async () => {

    let setErr;

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,account1,101,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00264]Error must be thrown');
  })

  it('punishStoremanGroup - [smgAmin-T00265]',async () => {

    let setErr;

    regDeposit = web3.toWei(100);
    try {

      res =  await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,account2,100,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00265]Error must be thrown');
  })
/////////////////////////////////////////////////////////////////////////////////////
  it('storemanGroupClaimSystemBonus - [smgAmin-T00301]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});

    try {

      res =  await smgAdminInstance.storemanGroupClaimSystemBonus(ETHEREUM_ID,account1,{from: account1,value:regDeposit});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00301]Error must be thrown');
  })

  it('storemanGroupClaimSystemBonus - [smgAmin-T00302]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});

    await smgAdminInstance.setHalt(false,{from: account1});
    try {

      res =  await smgAdminInstance.storemanGroupClaimSystemBonus(3,account1,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00302]Error must be thrown');
  })

  it('storemanGroupClaimSystemBonus - [smgAmin-T00303]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,false,0,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});
    try {

      res =  await smgAdminInstance.storemanGroupClaimSystemBonus(ETHEREUM_ID,account1,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00303]Error must be thrown');
  })

  it('storemanGroupClaimSystemBonus - [smgAmin-T00304]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});
    try {

      res =  await smgAdminInstance.storemanGroupClaimSystemBonus(ETHEREUM_ID,account3,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00304]Error must be thrown');
  })

  it('storemanGroupClaimSystemBonus - [smgAmin-T00305]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});
    await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,account1,100,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});
    try {

      res =  await smgAdminInstance.storemanGroupClaimSystemBonus(ETHEREUM_ID,account1,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00305]Error must be thrown');
  })

  it('storemanGroupClaimSystemBonus - [smgAmin-T00306]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});

    await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,account1,0,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});
    try {

      res =  await smgAdminInstance.storemanGroupClaimSystemBonus(ETHEREUM_ID,account1,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00306]Error must be thrown');
  })

  it('storemanGroupClaimSystemBonus - [smgAmin-T00307]',async () => {

    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(ETHEREUM_ID,true,0,{from: account1});

    await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,account1,0,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});

    try {

      res =  await smgAdminInstance.storemanGroupClaimSystemBonus(ETHEREUM_ID,account1,{from: account1});

    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00307]Error must be thrown');
  })
/////////////////////////////////////////////////////////////////////////////////////

  it('storemanGroupWithdrawDeposit - [smgAmin-T00813]',async () => {
    let setErr;

    try {

      await smgAdminInstance.setHalt(true,{from: account1});
      res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: account1, gas: 1000000});
      await smgAdminInstance.setHalt(false,{from: account1});
    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00813]Error must be thrown');
  })

  it('storemanGroupWithdrawDeposit - [smgAmin-T00814]',async () => {
    let setErr;

    try {
      res = await smgAdminInstance.storemanGroupWithdrawDeposit(3, {from: account1, gas: 1000000});
    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00814]Error must be thrown');

  })

  it('storemanGroupWithdrawDeposit - [smgAmin-T00815]',async () => {
    let setErr;

    try {
      res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: account2, gas: 1000000});
    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00815]Error must be thrown');

  })

  it('storemanGroupWithdrawDeposit - [smgAmin-T00816]',async () => {
    let setErr;

    await smgPrepare2()

    try {
      res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: storeManWanAddr1, gas: 1000000});
    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00816]Error must be thrown');

  })


  it('storemanGroupWithdrawDeposit - [smgAmin-T00817]',async () => {
    let setErr;
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSystemEnableBonus(0,false,0,{from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});
    res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:storeManWanAddr1,gas:1000000});

    coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr1);
    getUnregisterApplyTime =  coinSmgInfo[2].toString();
    assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

    try {

      res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: storeManWanAddr1, gas: 1000000});
    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00817]Error must be thrown');

  })


  it('storemanGroupWithdrawDeposit - [smgAmin-T00818]',async () => {
    let setErr;

    try {
      await  smgAdminInstance.punishStoremanGroup(0,storeManWanAddr1,100,{from:account1});
      res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: account1, gas: 1000000});
    } catch (err) {
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00818]Error must be thrown');
  })

/////////////////////////////////////////////////////////////////
  it('storemanGroupRegisterByDelegate  - [smgAmin-T00914]', async () => {
    let setErr
    try {

      regDeposit = web3.toWei(100);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(3, storeManWanAddr2, storeManEthAddr2, storeManTxFeeRatio, {
        from: account1,
        value: regDeposit,
        gas: 4000000
      });


    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00913]Error must be thrown');

  })

  it('storemanGroupRegisterByDelegate  - [smgAmin-T00915]', async () => {
    let setErr
    try {

      regDeposit = web3.toWei(100);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(0, "0x0", storeManEthAddr2, storeManTxFeeRatio, {
        from: account1,
        value: regDeposit,
        gas: 4000000
      });


    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00915]Error must be thrown');

  })

  it('storemanGroupRegisterByDelegate  - [smgAmin-T00916]', async () => {
    let setErr
    try {

      regDeposit = web3.toWei(10);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(0, storeManWanAddr2, storeManEthAddr2, storeManTxFeeRatio, {
        from: account1,
        value: regDeposit,
        gas: 4000000
      });


    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00916]Error must be thrown');

  })

  it('storemanGroupRegisterByDelegate  - [smgAmin-T00917]', async () => {
    let setErr
    try {

      regDeposit = web3.toWei(100);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(0, storeManWanAddr1, storeManEthAddr1, storeManTxFeeRatio, {
        from: account1,
        value: regDeposit,
        gas: 4000000
      });


    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00917]Error must be thrown');

  })

  it('storemanGroupRegisterByDelegate  - [smgAmin-T00918]', async () => {
    let setErr
    try {

      regDeposit = web3.toWei(100);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(0, storeManWanAddr1, "0x", storeManTxFeeRatio, {
        from: account1,
        value: regDeposit,
        gas: 4000000
      });


    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00918]Error must be thrown');

  })

  it('storemanGroupRegisterByDelegate  - [smgAmin-T00919]', async () => {
    let setErr
    try {

      regDeposit = web3.toWei(100);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(0, storeManWanAddr1, storeManEthAddr1, 0, {
        from: account1,
        value: regDeposit,
        gas: 4000000
      });


    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00919]Error must be thrown');

  })

  it('storemanGroupRegisterByDelegate  - [smgAmin-T00920]', async () => {
    let setErr
    try {

      regDeposit = web3.toWei(100);
      await smgAdminInstance.setHalt(true,{from: account1});
      await  smgAdminInstance.storemanGroupRegisterByDelegate(0, storeManWanAddr2, storeManEthAddr2, storeManTxFeeRatio, {
        from: account1,
        value: regDeposit,
        gas: 4000000
      });


    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00920]Error must be thrown');

  })
/////////////////////////////////////////////////////////////////////////////
  it('setHalt  - [smgAmin-T00902]', async () => {
    let setErr
    try {
      await smgAdminInstance.setHalt(true,{from: account2});
    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00902]Error must be thrown');

  })

  it('setHalt  - [smgAmin-T00903]', async () => {
    let setErr
    try {
      await smgAdminInstance.setHalt(true,{from: account2});
    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00903]Error must be thrown');

  })
//////////////////////////////////////////////////////////////////////////
  it('tranferDeposit  - [smgAmin-T02001]', async () => {
    let setErr
    try {
      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.tranferDeposit({from:account2})
    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T02001]Error must be thrown');

  })

  it('tranferDeposit  - [smgAmin-T02002]', async () => {
    let setErr
    try {
      await smgAdminInstance.setHalt(false,{from: account1});
      await smgAdminInstance.tranferDeposit({from:account1})
    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T02002]Error must be thrown');

  })
/////////////////////////////////////////////////////////////////////////
  it('kill-- [smgAmin-T003001] ', async () => {
    let setErr
    try {
      await smgAdminInstance.setHalt(true, {from: account1});
      await smgAdminInstance.kill({from: account2})
    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T03001]Error must be thrown');
  })

  it('kill-- [smgAmin-T003002] ', async () => {
    let setErr
    try {
      await smgAdminInstance.setHalt(false, {from: account1});
      await smgAdminInstance.kill({from: account1})
    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T03002]Error must be thrown');
  })

  it('kill-- [smgAmin-T003000]', async () => {
      preBal = web3.eth.getBalance(account1);
      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.kill({from:account1})

      bal = web3.eth.getBalance(account1) - preBal;

      assert.notEqual(bal,regDeposit,"transfer contract depoit not correct")
    })



})