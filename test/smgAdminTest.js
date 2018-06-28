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

delayTime = 20;

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

  it('storemanGroupRegister  - [smgAmin-T00601]-test not initialized', async () => {

    try {
      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
      await smgAdminInstance.setHalt(false,{from: account1});

      await  smgAdminInstance.storemanGroupRegister(0, storeManEthAddr, {
        from: account1,
        value: web3.toWei(regDeposit),
        gas: 4000000
      })

    } catch (err){
      //console.log(err)
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00601]Error must be thrown');

  })

  it('initialize contracts - [smgAmin-T00100]', async () => {

    let ratio = 200000; //1 eth:20,it need to mul the precise 10000
    let defaultMinDeposit = web3.toWei(100);
    let htlcType = 1; //use contract

    let originalChainHtlc = '0x7452bcd07fc6bb75653de9d9459bd442ac3f5c52';

    let wanchainHtlcAddr = groupWethProxyInst.address;
    let wanchainTokenAddr = await WETHAdminInstance.WETHToken();
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
    await smgAdminInstance.setHalt(false,{from: account1});
    //console.log(coinInfo);

    await WETHAdminInstance.setHalt(false,{from:account1});

    console.log("initialize group weth to set token admin");

    await groupWethProxyInst.setWETHManager(wanchainTokenAdminAddr,{from: account1});
    getTokenAdmin = await  groupWethProxyInst.wethManager();
    assert.equal(getTokenAdmin,wanchainTokenAdminAddr, 'wanchainTokenAdminAddr not match');

    await groupWethProxyInst.setStoremanGroupAdmin(smgAdminInstance.address,{from: account1});
    smgAdminAddr = await  groupWethProxyInst.storemanGroupAdmin();
    assert.equal(smgAdminAddr,smgAdminInstance.address, 'wanchainTokenAdminAddr not match');

    await groupWethProxyInst.setHalt(false);

  })


  it('storemanGroupRegister  - [smgAmin-T00600]', async () => {
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
    await smgAdminInstance.setHalt(false,{from: account1});

    console.log("storemanGroupRegister");
    regDeposit = web3.toWei(100);

    preBal = web3.fromWei(web3.eth.getBalance(smgAdminInstance.address));
    console.log("preBal" + preBal);
    await  smgAdminInstance.storemanGroupRegister(0,storeManEthAddr,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});

    getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,account1);
    console.log(getCoinSmgInfo);

    afterBal = web3.fromWei(web3.eth.getBalance(smgAdminInstance.address));
    console.log("afterBal" + afterBal);

    getDeposit = getCoinSmgInfo[0].toString();
    getOriginalChainAddr =  getCoinSmgInfo[1].toString();
    getUnregisterApplyTime =  getCoinSmgInfo[2].toString();

    assert.equal(getDeposit,regDeposit, 'regDeposit not match');
    assert.equal(getOriginalChainAddr,storeManEthAddr, 'storeManEthAddr not match');
    assert.equal(getUnregisterApplyTime,0, 'regDeposit not match');

    console.log("WETHAdmin getStoremanGroup");
    ethAdminInfo = await WETHAdminInstance.getStoremanGroup(account1);

    console.log(ethAdminInfo);
    getQuota = ethAdminInfo[0];

    assert.equal(web3.fromWei(getQuota),web3.fromWei(regDeposit/200000*10000), 'regDeposit not match');

    assert.equal(afterBal - preBal,100,"balance is not right")


  })



  it('storemanGroupRegister  - [smgAmin-T00602]', async () => {

    try {

      await  smgAdminInstance.storemanGroupRegister(3, storeManEthAddr, storeManTxFeeRatio,{
        from: account1,
        value: web3.toWei(regDeposit),
        gas: 4000000
      })

    } catch (err){
      //console.log(err)
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00602]Error must be thrown');

  })


  it('storemanGroupRegister  - [smgAmin-T00603]', async () => {

    try {

      await  smgAdminInstance.storemanGroupRegister(0, "0x", storeManTxFeeRatio,{
        from: account1,
        value: web3.toWei(regDeposit),
        gas: 4000000
      })

    } catch (err){
      //console.log(err)
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00601]Error must be thrown');

  })

  it('storemanGroupRegister  - [smgAmin-T00604]', async () => {

    try {

      await  smgAdminInstance.storemanGroupRegister(0, storeManEthAddr,storeManTxFeeRatio,{
        from: account1,
        value: web3.toWei(1),
        gas: 4000000
      })

    } catch (err){
      //console.log(err)
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00604]Error must be thrown');

  })

  it('storemanGroupRegister  - [smgAmin-T00605]', async () => {

    try {

      await  smgAdminInstance.storemanGroupRegister(0, storeManEthAddr,storeManTxFeeRatio,{
        from: account1,
        value: web3.toWei(regDeposit),
        gas: 4000000
      })

    } catch (err){
      //console.log(err)
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00605]Error must be thrown');

  })


  it('StoremanGroupApplyUnregister - [smgAmin-T00700]',async () => {
    let setErr;

    try {

      res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:account1,gas:1000000});
      coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,account1);

      getUnregisterApplyTime =  coinSmgInfo[2].toString();
      assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

    } catch (err){
      setErr = err;
    }

    assert.equal(setErr, undefined, '[smgAmin-T00700]Error must not be thrown');

  });

  it('StoremanGroupApplyUnregister - [smgAmin-T00701]',async () => {
    let setErr;

    try {

      res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:account1,gas:1000000});
      coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,account1);

      getUnregisterApplyTime =  coinSmgInfo[2].toString();
      assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00701]Error must be thrown');

  });

  it('StoremanGroupApplyUnregister - [smgAmin-T00702]',async () => {
    let setErr;

    try {

      res = await smgAdminInstance.storemanGroupApplyUnregister(2,{from:account1,gas:1000000});
      coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(2,account1);

      getUnregisterApplyTime =  coinSmgInfo[2].toString();
      assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00702]Error must be thrown');

  });

  it('StoremanGroupApplyUnregister - [smgAmin-T00703]',async () => {
    let setErr;

    try {

      res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:storeManEthAddr,gas:1000000});
      coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManEthAddr);

      getUnregisterApplyTime =  coinSmgInfo[2].toString();
      assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00703]Error must be thrown');

  });

  async function registerStoreman() {
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

  }


  it('StoremanGroupApplyUnregister - [smgAmin-T00704]',async () => {
    let setErr;

    try {

      res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:account1,gas:1000000});

    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00704]Error must be thrown');
    console.log("test finished")

  });

  it('StoremanGroupApplyUnregister - [smgAmin-T00705]',async () => {
    let setErr;

    try {

      //await registerStoreman()
      await smgAdminInstance.setHalt(true,{from: account1});
      res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:account2,gas:1000000});

    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00705]Error must be thrown');


    console.log("test finished")

  });



  /////////////////////////StoremanGroupWithdrawDeposit////////////////////////////////////////////////////
  it('StoremanGroupWithdrawDeposit  - [smgAmin-T00800]', async () => {

    try {

      res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: account1, gas: 4000000})
      //console.log(res);

      quotaSet = await WETHAdminInstance.mapStoremanGroup(account1);

      console.log(quotaSet);
      totalQuota = quotaSet[0].toString();
      receivable = quotaSet[1].toString();
      payable = quotaSet[2].toString();
      debt = quotaSet[3].toString();

      assert.equal(web3.fromWei(totalQuota), 0, 'weth balance did not set properly');
      assert.equal(web3.fromWei(receivable), 0, 'receivable did not set properly');
      assert.equal(web3.fromWei(payable), 0, 'payable did not set properly');
      assert.equal(web3.fromWei(debt), 0, 'debt did not set properly');

      gotEthAddr = await smgAdminInstance.getStoremanOriginalChainAddr(0, account1);

      assert.equal(gotEthAddr.toString(), "0x", "smgAdminInstance StoremanGroupWithdrawDeposit not right")

      gotTxFeeRatio = await smgAdminInstance.getStoremanTxFeeRatio(0, account1);

      assert.equal(gotTxFeeRatio, 1, "smgAdminInstance StoremanGroupWithdrawDeposit not right");
    } catch (err){
      setErr = err;
    }

    assert.notEqual(setErr, undefined, '[smgAmin-T00800]Error must be thrown');

  })



  it('StoremanGroupWithdrawDeposit  - [smgAmin-T00801]', async () => {

    sleep(delayTime*2*1000);

    await smgAdminInstance.setHalt(true,{from: account1});

    await smgAdminInstance.setSystemEnableBonus(0,false,10,{from: account1});

    await smgAdminInstance.setHalt(false,{from: account1});

    preBal = web3.fromWei(web3.eth.getBalance(account1));
    console.log("pre balance=" + preBal)

    preBalContract = web3.fromWei(web3.eth.getBalance(smgAdminInstance.address));
    console.log("preBalContract=" + preBalContract)

    res  = await smgAdminInstance.storemanGroupWithdrawDeposit(0,{from:account1,gas:4000000});

    sleep(delayTime*2*50);


    quotaSet = await WETHAdminInstance.mapStoremanGroup(account1);

    console.log(quotaSet);
    totalQuota = quotaSet[0].toString();
    receivable = quotaSet[1].toString();
    payable = quotaSet[2].toString();
    debt = quotaSet[3].toString();

    assert.equal(web3.fromWei(totalQuota),0, 'weth balance did not set properly');
    assert.equal(web3.fromWei(receivable),0, 'receivable did not set properly');
    assert.equal(web3.fromWei(payable),0, 'payable did not set properly');
    assert.equal(web3.fromWei(debt),0, 'debt did not set properly');

    gotEthAddr = await smgAdminInstance.getStoremanOriginalChainAddr(0,account1);

    assert.equal(gotEthAddr.toString(),"0x","smgAdminInstance StoremanGroupWithdrawDeposit not right")

    gotTxFeeRatio = await smgAdminInstance.getStoremanTxFeeRatio(0,account1);

    assert.equal(gotTxFeeRatio,1,"smgAdminInstance StoremanGroupWithdrawDeposit not right")

    afterBal = web3.fromWei(web3.eth.getBalance(account1));

    console.log("after balance=" + afterBal)

    diffBal = afterBal - preBal;

    assert.equal(parseInt(diffBal),100,"smgAdminInstance StoremanGroupWithdrawDeposit balance not right")

    afterBalContract = web3.fromWei(web3.eth.getBalance(smgAdminInstance.address));
    console.log("afterBalContract=" + afterBalContract);

    assert.equal(parseInt(preBalContract - afterBalContract),100,"smgAdminInstance StoremanGroupWithdrawDeposit balance not right");

  })



  it('storemanGroupRegisterByDelegate  - [smgAmin-T00810]', async () => {

    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
    await smgAdminInstance.setSystemEnableBonus(0,true,10,{from: account1})
    await smgAdminInstance.setHalt(false,{from: account1});

    console.log("storemanGroupRegister");
    regDeposit = web3.toWei(100);

    await  smgAdminInstance.storemanGroupRegisterByDelegate(0,storeManWanAddr1,storeManEthAddr1,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});

    await  smgAdminInstance.depositSmgBonus(0,{from:account1,value:regDeposit,gas:4000000});

    getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr1);
    console.log(getCoinSmgInfo);

    getDeposit = getCoinSmgInfo[0].toString();
    getOriginalChainAddr =  getCoinSmgInfo[1].toString();
    getUnregisterApplyTime =  getCoinSmgInfo[2].toString();

    assert.equal(getDeposit,regDeposit, 'regDeposit not match');
    assert.equal(getOriginalChainAddr,storeManEthAddr1, 'storeManEthAddr not match');
    assert.equal(getUnregisterApplyTime,0, 'apply time not match');

    console.log("WETHAdmin getStoremanGroup");
    ethAdminInfo = await WETHAdminInstance.getStoremanGroup(storeManWanAddr1);

    console.log(ethAdminInfo);
    getQuota = ethAdminInfo[0];

    assert.equal(web3.fromWei(getQuota),web3.fromWei(regDeposit/200000*10000), 'quota not match');

  })

  it('StoremanGroupApplyUnregister - [smgAmin-T00811]',async () => {

      initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));
      res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:storeManWanAddr1,gas:1000000});

      initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

      assert.notEqual(initiatorAfeterBal-initiatorPreBal,0, 'StoremanGroupApplyUnregister bonus is not right');
      coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr1);

      getUnregisterApplyTime =  coinSmgInfo[2].toString();
      assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

  });

  it('StoremanGroupWithdrawDeposit  - [smgAmin-T00812]', async () => {



      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.setSystemEnableBonus(0,true,10,{from: account1});
      await smgAdminInstance.setHalt(false,{from: account1});

      regDeposit = web3.toWei(100);
      await  smgAdminInstance.depositSmgBonus(0,{from:account1,value:regDeposit,gas:4000000});

      sleep(delayTime*2*1000);

      initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

      res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: storeManWanAddr1, gas: 4000000})
      //console.log(res);

      quotaSet = await WETHAdminInstance.mapStoremanGroup(storeManWanAddr1);

      console.log(quotaSet);
      totalQuota = quotaSet[0].toString();
      receivable = quotaSet[1].toString();
      payable = quotaSet[2].toString();
      debt = quotaSet[3].toString();

      assert.equal(web3.fromWei(totalQuota), 0, 'weth balance did not set properly');
      assert.equal(web3.fromWei(receivable), 0, 'receivable did not set properly');
      assert.equal(web3.fromWei(payable), 0, 'payable did not set properly');
      assert.equal(web3.fromWei(debt), 0, 'debt did not set properly');

      gotEthAddr = await smgAdminInstance.getStoremanOriginalChainAddr(0, storeManWanAddr1);

      assert.equal(gotEthAddr.toString(), "0x", "smgAdminInstance StoremanGroupWithdrawDeposit not right")

      gotTxFeeRatio = await smgAdminInstance.getStoremanTxFeeRatio(0, storeManWanAddr1);

      assert.equal(gotTxFeeRatio, 1, "smgAdminInstance StoremanGroupWithdrawDeposit not right");

      initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

      diffBal = parseInt(initiatorAfeterBal - initiatorPreBal);

      console.log("withdraw bal = " + diffBal);
      assert.equal(diffBal,100,"smgAdminInstance StoremanGroupWithdrawDeposit balance not right")
  })

  it('storemanGroupRegisterByDelegate  - [smgAmin-T00913]', async () => {
    let setErr
    try {
      await smgAdminInstance.setHalt(true, {from: account1});
      await smgAdminInstance.setSmgEnableUserWhiteList(0, false, {from: account1});
      await smgAdminInstance.setHalt(false, {from: account1});

      console.log("storemanGroupRegister");
      regDeposit = web3.toWei(100);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(0, storeManWanAddr1, storeManEthAddr1, storeManTxFeeRatio, {
        from: zeroBalnaceAddr,
        value: regDeposit,
        gas: 4000000
      });


  } catch (err){
    setErr = err;
  }

  assert.notEqual(setErr, undefined, '[smgAmin-T00913]Error must be thrown');

  })


    it('storemanGroupRegister with punish  - [smgAmin-T00820]', async () => {

      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
      await smgAdminInstance.setHalt(false,{from: account1});

      console.log("storemanGroupRegister");
      regDeposit = web3.toWei(100);

      await  smgAdminInstance.storemanGroupRegisterByDelegate(0,storeManWanAddr3,storeManEthAddr3,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});
      await  smgAdminInstance.depositSmgBonus(0,{from:account1,value:regDeposit,gas:4000000});
      await  smgAdminInstance.punishStoremanGroup(0,storeManWanAddr3,100,{from:account1});

      getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr3);
      console.log(getCoinSmgInfo);

      getDeposit = getCoinSmgInfo[0].toString();
      getOriginalChainAddr =  getCoinSmgInfo[1].toString();
      getUnregisterApplyTime =  getCoinSmgInfo[2].toString();
      gettxFeeRatio = getCoinSmgInfo[3].toString();
      getbonusBlockNumber = getCoinSmgInfo[4].toString();
      getinitiator =  getCoinSmgInfo[5].toString();
      getPunished =  getCoinSmgInfo[6];

      assert.equal(getDeposit,regDeposit, 'regDeposit not match');
      assert.equal(getOriginalChainAddr,storeManEthAddr3, 'storeManEthAddr not match');
      assert.equal(getUnregisterApplyTime,0, 'apply time not match');

      assert.equal(gettxFeeRatio,storeManTxFeeRatio, 'gettxFeeRatio not match');
      assert.notEqual(getbonusBlockNumber,0, 'getbonusBlockNumber not match');
      assert.equal(getPunished,100, 'getPunished not match');
      assert.equal(getinitiator,account1, 'getinitiator not match');

      console.log("WETHAdmin getStoremanGroup");
      ethAdminInfo = await WETHAdminInstance.getStoremanGroup(storeManWanAddr3);

      console.log(ethAdminInfo);
      getQuota = ethAdminInfo[0];

      assert.equal(web3.fromWei(getQuota),web3.fromWei(regDeposit/200000*10000), 'quota not match');

    })

    it('StoremanGroupApplyUnregister  with punish  - [smgAmin-T00821]',async () => {

      let setErr
      try {
        res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:storeManWanAddr1,gas:1000000});
        coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr1);

        getUnregisterApplyTime =  coinSmgInfo[2].toString();
        assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

      } catch (err){
        setErr = err;
      }

      assert.notEqual(setErr, undefined, '[smgAmin-T00821]Error must be thrown');

    });

    it('StoremanGroupWithdrawDeposit  with punish  - [smgAmin-T00822]', async () => {
      let setErr
      try {
        sleep(delayTime*2*1000);

        await smgAdminInstance.setHalt(true,{from: account1});
        await smgAdminInstance.setSystemEnableBonus(0,true,10,{from: account1});
        await smgAdminInstance.setHalt(false,{from: account1});


        initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

        res = await smgAdminInstance.storemanGroupWithdrawDeposit(0, {from: storeManWanAddr1, gas: 4000000})
        //console.log(res);

        quotaSet = await WETHAdminInstance.mapStoremanGroup(account1);

        console.log(quotaSet);
        totalQuota = quotaSet[0].toString();
        receivable = quotaSet[1].toString();
        payable = quotaSet[2].toString();
        debt = quotaSet[3].toString();

        assert.equal(web3.fromWei(totalQuota), 0, 'weth balance did not set properly');
        assert.equal(web3.fromWei(receivable), 0, 'receivable did not set properly');
        assert.equal(web3.fromWei(payable), 0, 'payable did not set properly');
        assert.equal(web3.fromWei(debt), 0, 'debt did not set properly');

        gotEthAddr = await smgAdminInstance.getStoremanOriginalChainAddr(0, storeManWanAddr1);

        assert.equal(gotEthAddr.toString(), "0x", "smgAdminInstance StoremanGroupWithdrawDeposit not right")

        gotTxFeeRatio = await smgAdminInstance.getStoremanTxFeeRatio(0, storeManWanAddr1);

        assert.equal(gotTxFeeRatio, 1, "smgAdminInstance StoremanGroupWithdrawDeposit not right");

        initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

        diffBal = parseInt(initiatorAfeterBal - initiatorPreBal);

        console.log("withdraw bal = " + diffBal);
        assert.equal(diffBal,100,"smgAdminInstance StoremanGroupWithdrawDeposit balance not right");

      } catch (err){
        setErr = err;
      }

      assert.notEqual(setErr, undefined, '[smgAmin-T00822]Error must be thrown');
    })



    it('Coin htlc stop  - [smgAmin-T00900]', async () => {

       await smgAdminInstance.setHalt(true,{from: account1});
       await WETHAdminInstance.setHalt(true,{from: account1});
       await groupWethProxyInst.setHalt(true,{from: account1});

       halted = await WETHAdminInstance.halted();
       assert.equal(halted,true, 'smgAdmin halt error');

       halted = await WETHAdminInstance.halted();
       assert.equal(halted,true, 'wethAmin halt error');

       halted = await groupWethProxyInst.halted();
       assert.equal(halted,true, 'groupWethProxy halt error')

    })

    it('Coin htlc recover  - [smgAmin-T00901]', async () => {

      await smgAdminInstance.setHalt(false,{from: account1});
      await WETHAdminInstance.setHalt(false,{from: account1});
      await groupWethProxyInst.setHalt(false,{from: account1});

      halted = await WETHAdminInstance.halted();
      assert.equal(halted,false, 'smgAdmin halt error');

      halted = await WETHAdminInstance.halted();
      assert.equal(halted,false, 'wethAmin halt error');

      halted = await groupWethProxyInst.halted();
      assert.equal(halted,false, 'groupWethProxy halt error')

    })

    it('setSmgEnableUserWhiteList  - [smgAmin-T01000]', async () => {

      await smgAdminInstance.setHalt(true,{from: account1});

      await smgAdminInstance.setSmgEnableUserWhiteList(0,true, {from: account1});

      coinInfo = await smgAdminInstance.mapCoinInfo(0);
      console.log(coinInfo);

      isControlRegister = coinInfo[coinInfo.length - 5];
      assert.equal(isControlRegister, true, 'setSmgEnableUserWhiteList set true,get false error');

      await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
      coinInfo = await smgAdminInstance.mapCoinInfo(0);

      isControlRegister = coinInfo[coinInfo.length - 5];
      assert.equal(isControlRegister, false, 'setSmgEnableUserWhiteList set false,get true error');
    })

    it('setSystemBonusPeriod  - [smgAmin-T01001]', async () => {

      await smgAdminInstance.setHalt(true,{from: account1});

      await smgAdminInstance.setSystemEnableBonus(0,true,10,{from: account1});

      coinInfo = await smgAdminInstance.mapCoinInfo(0);
      console.log(coinInfo);

      isSystemBonusPeriod = coinInfo[coinInfo.length - 4];
      assert.notEqual(isSystemBonusPeriod, 0, 'setSmgEnableUserWhiteList set true,get false error');

      await smgAdminInstance.setSystemEnableBonus(0,false,10,{from: account1});
      coinInfo = await smgAdminInstance.mapCoinInfo(0);

      isSystemBonusPeriod = coinInfo[coinInfo.length - 4];
      assert.equal(isSystemBonusPeriod, 0, 'setSmgEnableUserWhiteList set false,get true error');
    })

    it('setSmgWhiteList  - [smgAmin-T01002]', async () => {
      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.setSmgEnableUserWhiteList(0,true, {from: account1});
      await smgAdminInstance.setHalt(false,{from: account1});

      await smgAdminInstance.setSmgWhiteList(0,account3, {from: account1});

      getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,account3);
      console.log(getCoinSmgInfo);

      getDeposit = getCoinSmgInfo[0].toString();
      getOriginalChainAddr =  getCoinSmgInfo[1].toString();
      getUnregisterApplyTime =  getCoinSmgInfo[2].toString();
      blockNum =  getCoinSmgInfo[3].toString();

      assert.equal(getDeposit,0, 'regDeposit not match');
      assert.equal(getOriginalChainAddr,"0x", 'storeManEthAddr not match');
      assert.equal(getUnregisterApplyTime,0, 'regDeposit not match');
      assert.equal(blockNum,0, 'blockNum not match');

    })

    it('setSmgWhiteList  - [smgAmin-T01003]', async () => {

      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.setSmgEnableUserWhiteList(0,true, {from: account1});
      await smgAdminInstance.setHalt(false,{from: account1});

      regDeposit = web3.toWei(100);
      await  smgAdminInstance.storemanGroupRegister(0,storeManEthAddr,storeManTxFeeRatio,{from:account3,value:regDeposit,gas:4000000});

      getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,account3);
      console.log(getCoinSmgInfo);

      getDeposit = getCoinSmgInfo[0].toString();
      getOriginalChainAddr =  getCoinSmgInfo[1].toString();
      getUnregisterApplyTime =  getCoinSmgInfo[2].toString();
      blockNum =  getCoinSmgInfo[3].toString();

      assert.equal(getDeposit,regDeposit, 'regDeposit not match');
      assert.equal(getOriginalChainAddr,storeManEthAddr, 'storeManEthAddr not match');
      assert.equal(getUnregisterApplyTime,0, 'regDeposit not match');
      assert.notEqual(blockNum,0, 'blockNum not match');

    })


    it('storemanGroupClaimSystemBonus  - [smgAmin-T01100]', async () => {

      await smgAdminInstance.setHalt(true,{from: account1});
      await smgAdminInstance.setSmgEnableUserWhiteList(0,false, {from: account1});
      await smgAdminInstance.setSystemEnableBonus(0,true,2 ,{from: account1});
        await smgAdminInstance.setHalt(false,{from: account1});


      regDeposit = web3.toWei(100);
      await  smgAdminInstance.depositSmgBonus(0,{from:account1,value:regDeposit,gas:4000000});

      preBlks = web3.eth.blockNumber;

      regDeposit = web3.toWei(100);
      await  smgAdminInstance.storemanGroupRegister(0,storeManEthAddr2,storeManTxFeeRatio,{from:storeManWanAddr2,value:regDeposit,gas:4000000});

      getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr2);
      console.log(getCoinSmgInfo);

      getDeposit = getCoinSmgInfo[0].toString();
      getOriginalChainAddr =  getCoinSmgInfo[1].toString();
      getUnregisterApplyTime =  getCoinSmgInfo[2].toString();
      blockNum =  getCoinSmgInfo[3].toString();

      assert.equal(getDeposit,regDeposit, 'regDeposit not match');
      assert.equal(getOriginalChainAddr,storeManEthAddr2, 'storeManEthAddr not match');
      assert.equal(getUnregisterApplyTime,0, 'regDeposit not match');
      assert.notEqual(blockNum,0, 'blockNum not match');

      sleep(delayTime*2*1000);

      preBal = web3.fromWei(web3.eth.getBalance(storeManWanAddr2));
      await  smgAdminInstance.storemanGroupClaimSystemBonus(0,{from:storeManWanAddr2});

      blks = web3.eth.blockNumber - preBlks;
      console.log("passed blks = " + blks);

      sleep(delayTime*2*100);

      bonus = web3.fromWei(web3.eth.getBalance(storeManWanAddr2)) - preBal;

      console.log("got bonus=" + bonus);

      DEFUALT_BONUS_PERIOD_BLOCKS = 10;//6 * 10 * 60 * 24;
      DEFUALT_BONUS_RATIO_FOR_DEPOSIT = 20;//2;

      cycles = blks/DEFUALT_BONUS_PERIOD_BLOCKS;
      console.log("passed cycles = " + cycles)

      calBonus = 100*DEFUALT_BONUS_RATIO_FOR_DEPOSIT/10000;

      calBonus = calBonus*cycles;

      console.log("cal bonus=" + calBonus);

      assert.notEqual(bonus,0,"bonus is not right")

    })

  it('tranferDeposit  - [smgAmin-T02000]', async () => {
    preBal = web3.eth.getBalance(account1);
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.transferDeposit({from:account1})

    bal = web3.eth.getBalance(account1) - preBal;

    assert.notEqual(bal,regDeposit,"transfer contract depoit not correct")
  })

  it('depositSmgBonus  - [smgAmin-T02001]', async () => {
    await smgAdminInstance.setHalt(false,{from: account1});

    coinInfo = await smgAdminInstance.mapCoinInfo(0);

    pretotalBalance = coinInfo[coinInfo.length - 3];
    console.log("totalBalance=" + pretotalBalance);

    preBalance = web3.eth.getBalance(smgAdminInstance.address);
    deposit = web3.toWei(100);
    await smgAdminInstance.depositSmgBonus(0, {from: account1,value:deposit});
    coinInfo = await smgAdminInstance.mapCoinInfo(0);

    totalBalance = coinInfo[coinInfo.length - 3];
    console.log("totalBalance=" + totalBalance);

    balanceChange = web3.eth.getBalance(smgAdminInstance.address) - preBalance;
    console.log("getBalance=" + balanceChange);

    assert.equal(totalBalance - pretotalBalance, deposit, 'totalBalance error');

    assert.equal(balanceChange, deposit, 'getBalance error');
  })


  it('kill  - [smgAmin-T03000]', async () => {
    preBal = web3.eth.getBalance(account1);
    await smgAdminInstance.setHalt(true,{from: account1});
    await smgAdminInstance.kill({from:account1})

    bal = web3.eth.getBalance(account1) - preBal;

    assert.notEqual(bal,regDeposit,"transfer contract depoit not correct")
  })




})