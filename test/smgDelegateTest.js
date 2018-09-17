const coinAdmin = artifacts.require('./CoinAdmin.sol')

const smgAdmin = artifacts.require('./StoremanGroupAdmin.sol')

const WETH = artifacts.require('./WETH.sol')
const WETHAdmin = artifacts.require('./WETHManager.sol')

const groupWethProxy = artifacts.require('./HTLCWETH.sol')
const groupEthProxy = artifacts.require('./HTLCETH.sol')

require('truffle-test-utils').init()

const web3 = global.web3

let account2 = "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8"
let account1 = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e"
let account3 = "0x130407476fff4616d01f6eadd90845dc8a65e23a"

let wanProcxSCAddr = "0x7be51825b86e250c0ba25388e47ab7530cd0b3f5"

let storeManBTCAddr = '0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e';
let storeManWanAddr = '0xcd5a7fcc744481d75ab3251545befb282e785882';

let storeManBTCAddr1 = '0x21e7f6c5fe0e26609f271f6e9f1343bb753f1096';
let storeManWanAddr1 = '0x1c8a5e26abf1bd54c562519beb402fefea1549f9';

let storeManBTCAddr2 = '0x21e7f6c5fe0e26609f271f6e9f1343bb753f1096';
let storeManWanAddr2 = '0xf0c5303cac409131397822e4acd7a79540ac7a51';

let storeManBTCAddr3 = '0x21e7f6c5fe0e26609f271f6e9f1343bb753f1096';
let storeManWanAddr3 = '0x7d055985cee158d8eb48fc18cabf78e3e398525e';

let zeroBalnaceAddr = '0xcb651cb4fdcd905922cb850ad8000fd862695444'

ethRatio = 10;
regDeposit = 20;

delayTime = 20;

const ETHEREUM_ID = 0;

function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};

var wethAbi = web3.eth.contract([{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"tokenManager","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"burn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"lockTo","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"WETHManagerAddr","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenMintedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenBurntLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"value","type":"uint256"}],"name":"TokenLockedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"manager","type":"address"}],"name":"WETHManagerLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]);

let start;
let end;
let periodBlks;
let deposit = web3.toWei(100);

function getBounus(){
    let cycles =  ((end - start)/periodBlks).toFixed(0);
    let bonus = (deposit*20)/10000;
    bonus = (bonus*cycles);
    console.log('bonus=' + bonus);

    return bonus;
}

contract('StoremanAdminSC', ([owner, admin, proxy, storemanGroup])=> {

    let WETHInstance;
    let WETHAdminInstance;
    let coinAdminInst;

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
        await web3.eth.sendTransaction({from: account1, to: storeManWanAddr2, value: web3.toWei(101)})

        coinAdminInst = await coinAdmin.new({from: owner})
        smgAdminInstance = await smgAdmin.new({from: owner})
        groupWethProxyInst = await groupWethProxy.new({from: owner})

//    WETHInstance = await WETH.new({from: owner})
        WETHAdminInstance = await WETHAdmin.new(groupWethProxyInst.address, smgAdminInstance.address, {from: owner});

        let WETHInstanceAddr = await WETHAdminInstance.WETHToken();
        WETHInstance = wethAbi.at(WETHInstanceAddr);

    })

    it('initialize contracts', async () => {

        let ratio = 200000; //1 eth:20,it need to mul the precise 10000
        let defaultMinDeposit = web3.toWei(100);
        let htlcType = 1; //use contract

        let originalChainHtlc = '0x7452bcd07fc6bb75653de9d9459bd442ac3f5c52';

        let wanchainHtlcAddr = groupWethProxyInst.address;
        let wanchainTokenAddr = await WETHAdminInstance.WETHToken();
        let wanchainTokenAdminAddr = WETHAdminInstance.address;

        let withdrawDelayTime = (3600 * 72);//for test

        console.log("originalChainHtlc:" + originalChainHtlc);
        console.log("wanchainHtlcAddr:" + wanchainHtlcAddr);
        console.log("wanchainTokenAddr:" + wanchainTokenAddr);
        console.log("wanchainTokenAminAddr:" + wanchainTokenAdminAddr);
        console.log("smgAdminInstance:" + smgAdminInstance.address);

        console.log(withdrawDelayTime);


        res = await coinAdminInst.initializeCoin(ETHEREUM_ID,
            ratio,
            defaultMinDeposit,
            htlcType,
            originalChainHtlc,
            wanchainHtlcAddr,
            wanchainTokenAdminAddr,
            withdrawDelayTime,
            {from: owner, gas: 4000000}
        );

        //console.log(res);

        coinInfo = await coinAdminInst.mapCoinInfo(ETHEREUM_ID);

        console.log(coinInfo);

        getRatio = coinInfo[0].toString();
        getDefaultMinDeposit = coinInfo[1].toString();
        getHtlcType = coinInfo[2].toString();
        getOriginalChainHtlc = coinInfo[3].toString();
        getWanchainHtlcAddr = coinInfo[4].toString();
        getWanchainTokenAdminAddr = coinInfo[5].toString();
        getWithdrawDelayTime = coinInfo[6].toString();

        assert.equal(getRatio, ratio, 'ratio not match');
        assert.equal(getDefaultMinDeposit, defaultMinDeposit, 'defaultMinDeposit not match');
        assert.equal(getHtlcType, htlcType, 'defaultMinDeposit not match');
        assert.equal(getOriginalChainHtlc, originalChainHtlc, 'originalChainHtlc not match');
        assert.equal(getWanchainHtlcAddr, wanchainHtlcAddr, 'originalChainHtlc not match');
        assert.equal(getWanchainTokenAdminAddr, wanchainTokenAdminAddr, 'wanchainTokenAddr not match');
        assert.equal(getWithdrawDelayTime, withdrawDelayTime, 'withdrawDelayTime not match');

        console.log("setCoinPunishReciever");
        await coinAdminInst.setCoinPunishReciever(ETHEREUM_ID,account3,{from: owner});

        console.log("set ratio");
        await coinAdminInst.setWToken2WanRatio(ETHEREUM_ID, ratio, {from: owner});

        console.log("set delay time");
        await coinAdminInst.setWithdrawDepositDelayTime(ETHEREUM_ID, delayTime, {from: owner});

        console.log("coin admin set halt");
        await coinAdminInst.setHalt(false, {from: owner});

        console.log("set coinAdmin in smgAdmin")
        res = await smgAdminInstance.setCoinAdmin(coinAdminInst.address, {from: owner});

        let gotCoinAdminAddr = await smgAdminInstance.coinAminAddr();
        assert.equal(gotCoinAdminAddr, coinAdminInst.address, "the coinAdmin address is not match");


        console.log("smgAdmin set halt");
        await smgAdminInstance.setHalt(false, {from: owner});

        await WETHAdminInstance.setHalt(false, {from: owner});

        console.log("initialize group weth to set token admin");

        await groupWethProxyInst.setWETHManager(wanchainTokenAdminAddr, {from: owner});
        getTokenAdmin = await groupWethProxyInst.wethManager();
        assert.equal(getTokenAdmin, wanchainTokenAdminAddr, 'wanchainTokenAdminAddr not match');

        await groupWethProxyInst.setAdmin(smgAdminInstance.address, coinAdminInst.address, {from: owner});
        smgAdminAddr = await groupWethProxyInst.storemanGroupAdmin();
        assert.equal(smgAdminAddr, smgAdminInstance.address, 'wanchainTokenAdminAddr not match');

        await groupWethProxyInst.setHalt(false,{from: owner});

    })


    it('storemanGroupRegisterByDelegate  - [smgAmin-T00900]', async () => {

        await coinAdminInst.setHalt(true,{from: owner});
        await coinAdminInst.setSmgEnableUserWhiteList(0,false, {from: owner});
        await coinAdminInst.setSystemEnableBonus(0,true,10,{from: owner})
        await coinAdminInst.setHalt(false,{from: owner});

        console.log("storemanGroupRegister");
        let regDeposit = web3.toWei(100);

        await  smgAdminInstance.depositSmgBonus(0,{from:owner,value:10*regDeposit,gas:4000000});

       let res = await  smgAdminInstance.storemanGroupRegisterByDelegate(0,storeManWanAddr1,storeManBTCAddr1,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});

        periodBlks = 10;
        start = res.receipt.blockNumber;

        getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr1);
        console.log(getCoinSmgInfo);

        getDeposit = getCoinSmgInfo[0].toString();
        getOriginalChainAddr =  getCoinSmgInfo[1].toString();
        getUnregisterApplyTime =  getCoinSmgInfo[2].toString();
        initiator =  getCoinSmgInfo[5].toString();

        assert.equal(getDeposit,regDeposit, 'regDeposit not match');
        assert.equal(getOriginalChainAddr,storeManBTCAddr1, 'storeManEthAddr not match');
        assert.equal(getUnregisterApplyTime,0, 'apply time not match');
        assert.equal(initiator,account1,'initiator is not match');

        console.log("WETHAdmin getStoremanGroup");
        ethAdminInfo = await WETHAdminInstance.getStoremanGroup(storeManWanAddr1);

        console.log(ethAdminInfo);
        getQuota = ethAdminInfo[0];

        assert.equal(web3.fromWei(getQuota),web3.fromWei(regDeposit/200000*10000), 'quota not match');

    })
///*
    it('smgClaimSystemBonus By delegate - [smgAmin-T00901]',async () => {

        console.log("smgClaimSystemBonusByDelegate")

        sleep(delayTime*1000);

        initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

        res = await smgAdminInstance.smgClaimSystemBonusByDelegate(0,storeManWanAddr1,{from:account1,gas:1000000});
        console.log(res);

        end = res.receipt.blockNumber;
        initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));
        assert.web3Event(res, {
            event: "SmgClaimSystemBonus",
            args: {
                smgAddress:account1,
                coin:0,
                bonus:getBounus(),

            }
        }, `SmgClaimSystemBonus failed`);

        start = res.receipt.blockNumber;
     });
    ///*
        it('StoremanGroupApplyUnregister By delegate - [smgAmin-T00902]',async () => {
            sleep(delayTime*1000);

            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

            res = await smgAdminInstance.smgApplyUnregisterByDelegate(0,storeManWanAddr1,{from:account1,gas:1000000});
            end = res.receipt.blockNumber;

            assert.web3Event(res, {
                event: "SmgClaimSystemBonus",
                args: {
                    smgAddress:account1,
                    coin:0,
                    bonus:getBounus(),

                }
            }, `SmgClaimSystemBonus failed`);

            initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

            assert.notEqual(initiatorAfeterBal-initiatorPreBal,0, 'StoremanGroupApplyUnregister bonus is not right');

            coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr1);

            getUnregisterApplyTime =  coinSmgInfo[2].toString();

            assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

        });


        it('StoremanGroupWithdrawDeposit by delegate  - [smgAmin-T00903]', async () => {

            sleep(delayTime*1000);

            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

            res = await smgAdminInstance.smgWithdrawDepositByDelegate(0,storeManWanAddr1,{from:account1, gas: 4000000})
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

            gotTxFeeRatio = await smgAdminInstance.getStoremanTxFeeRatio(0, storeManWanAddr1);

            assert.equal(gotTxFeeRatio, 1, "smgAdminInstance StoremanGroupWithdrawDeposit not right");

            initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

            diffBal = parseInt(initiatorAfeterBal - initiatorPreBal);

            console.log("withdraw bal = " + diffBal);

            assert.web3Event(res, {
                event: "SmgWithdraw",
                args: {
                    smgAddress:account1,
                    coin:0,
                    actualReturn:parseInt(deposit,10),
                    deposit:parseInt(deposit,10)

                }
            }, `SmgWithdraw failed`);


        })


        it('storemanGroupRegisterByDelegate  - [smgAmin-T00904]', async () => {

            await coinAdminInst.setHalt(true,{from: owner});
            await coinAdminInst.setSmgEnableUserWhiteList(0,false, {from: owner});
            await coinAdminInst.setSystemEnableBonus(0,true,10,{from: owner})
            await coinAdminInst.setHalt(false,{from: owner});

            periodBlks = 10;

            console.log("storemanGroupRegister");
            let regDeposit = web3.toWei(100);//storeManWanAddr1

           let res = await  smgAdminInstance.storemanGroupRegisterByDelegate(0,storeManWanAddr2,storeManBTCAddr2,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});
           console.log(res);

           start = res.receipt.blockNumber;

            await  smgAdminInstance.depositSmgBonus(0,{from:owner,value:regDeposit,gas:4000000});

            getCoinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr2);
            console.log(getCoinSmgInfo);

            getDeposit = getCoinSmgInfo[0].toString();
            getOriginalChainAddr =  getCoinSmgInfo[1].toString();
            getUnregisterApplyTime =  getCoinSmgInfo[2].toString();

            assert.equal(getDeposit,regDeposit, 'regDeposit not match');
            assert.equal(getOriginalChainAddr,storeManBTCAddr1, 'storeManEthAddr not match');
            assert.equal(getUnregisterApplyTime,0, 'apply time not match');

            console.log("WETHAdmin getStoremanGroup");
            ethAdminInfo = await WETHAdminInstance.getStoremanGroup(storeManWanAddr2);

            console.log(ethAdminInfo);
            getQuota = ethAdminInfo[0];

            assert.equal(web3.fromWei(getQuota),web3.fromWei(regDeposit/200000*10000), 'quota not match');

        })



        it('smgClaimSystemBonus to initiator - [smgAmin-T00905]',async () => {
            sleep(delayTime*1000);

            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

            res = await smgAdminInstance.storemanGroupClaimSystemBonus(0,{from:storeManWanAddr2,gas:1000000});
            console.log(res);

            end = res.receipt.blockNumber;

            console.log(res.receipt.logs)

            assert.web3Event(res, {
                event: "SmgClaimSystemBonus",
                args: {
                    smgAddress:account1,
                    coin:0,
                    bonus:getBounus(),

                }
            }, `SmgClaimSystemBonus failed`);

            start = res.receipt.blockNumber;

            initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

            console.log("diff=" + (initiatorAfeterBal - initiatorPreBal));

            assert.notEqual(initiatorAfeterBal - initiatorPreBal,0, 'StoremanGroupApplyUnregister bonus should not 0');

        });


        it('StoremanGroupApplyUnregister - [smgAmin-T00906]',async () => {
            sleep(delayTime*1000);

            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

            res = await smgAdminInstance.storemanGroupApplyUnregister(0,{from:storeManWanAddr2,gas:1000000});

            initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

            end = res.receipt.blockNumber;

            console.log(res.receipt.logs)

            assert.web3Event(res, {
                event: "SmgClaimSystemBonus",
                args: {
                    smgAddress:account1,
                    coin:0,
                    bonus:getBounus(),

                }
            }, `SmgClaimSystemBonus failed`);

            coinSmgInfo = await smgAdminInstance.mapCoinSmgInfo(0,storeManWanAddr2);

            getUnregisterApplyTime =  coinSmgInfo[2].toString();

            assert.notEqual(getUnregisterApplyTime,0, 'apply unregister start time did not set properly');

        });

        it('StoremanGroupWithdrawDeposit  - [smgAmin-T00907]', async () => {

            sleep(delayTime*1000);

            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

            res = await smgAdminInstance.storemanGroupWithdrawDeposit(0,{from:storeManWanAddr2, gas: 4000000})
            //console.log(res);

            quotaSet = await WETHAdminInstance.mapStoremanGroup(storeManWanAddr2);

            console.log(quotaSet);
            totalQuota = quotaSet[0].toString();
            receivable = quotaSet[1].toString();
            payable = quotaSet[2].toString();
            debt = quotaSet[3].toString();

            assert.equal(web3.fromWei(totalQuota), 0, 'weth balance did not set properly');
            assert.equal(web3.fromWei(receivable), 0, 'receivable did not set properly');
            assert.equal(web3.fromWei(payable), 0, 'payable did not set properly');
            assert.equal(web3.fromWei(debt), 0, 'debt did not set properly');

           // gotEthAddr = await smgAdminInstance.getStoremanOriginalChainAddr(0, storeManWanAddr2);

           // assert.equal(gotEthAddr.toString(), "0x", "smgAdminInstance StoremanGroupWithdrawDeposit not right")

            gotTxFeeRatio = await smgAdminInstance.getStoremanTxFeeRatio(0, storeManWanAddr2);

            assert.equal(gotTxFeeRatio.toString(), '1', "smgAdminInstance StoremanGroupWithdrawDeposit not right");

            initiatorAfeterBal = web3.fromWei(web3.eth.getBalance(account1));

            diffBal = parseInt(initiatorAfeterBal - initiatorPreBal);

            console.log("withdraw bal = " + diffBal);
            assert.equal(diffBal,100,"smgAdminInstance StoremanGroupWithdrawDeposit balance not right")

        })

        it('Set punish deposit reciever  - [smgAmin-T00907]', async () => {
            await coinAdminInst.setHalt(true,{from: owner});
            let res = await coinAdminInst.setCoinPunishReciever(ETHEREUM_ID,account2,{from:owner})
            await coinAdminInst.setHalt(false,{from: owner});

            let reciever = await coinAdminInst.mapCoinPunishReceiver(ETHEREUM_ID)
            console.log(reciever)

            assert.equal(account2,reciever,"the punish deposit is different with setting")
        })
//*/

        it('test punish deposit transfer  - [smgAmin-T00908]', async () => {

            await coinAdminInst.setHalt(true,{from: owner});
            console.log("set delay time");
            await coinAdminInst.setWithdrawDepositDelayTime(ETHEREUM_ID, 1, {from: owner});

            await coinAdminInst.setSmgEnableUserWhiteList(0,false, {from: owner});
            await coinAdminInst.setSystemEnableBonus(0,true,10,{from: owner})
            await coinAdminInst.setHalt(false,{from: owner});


            let regDeposit = web3.toWei(100);

            await  smgAdminInstance.depositSmgBonus(0,{from:owner,value:regDeposit,gas:4000000});

            console.log("storemanGroupRegister");
            let res = await  smgAdminInstance.storemanGroupRegisterByDelegate(0,storeManWanAddr2,storeManBTCAddr2,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});
            console.log(res)

            console.log("=============================punish smg 100%=======================================================");
            res = await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,storeManWanAddr2,100,{from:owner});
            console.log(res);

            console.log("================================unregister smg====================================================");
            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));
            console.log("begin unregister")
            res = await smgAdminInstance.smgApplyUnregisterByDelegate(0,storeManWanAddr2,{from:account1,gas:1000000});
            console.log(res)

            afterBal = web3.fromWei(web3.eth.getBalance(account1));
            assert.equal(afterBal-initiatorPreBal<=0,true,'delegate should not get bonus if smg is punished')

            console.log("==============================withdraw deposit after punish 100%======================================================");
            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));

            punishRecieverPreBal = web3.fromWei(web3.eth.getBalance(account2));

            res = await smgAdminInstance.storemanGroupWithdrawDeposit(0,{from:storeManWanAddr2, gas: 4000000})
            console.log(res);
            assert.web3Event(res, {
                event: "SmgWithdraw",
                args: {
                    smgAddress:storeManWanAddr2,
                    coin:0,
                    actualReturn:parseInt(web3.toWei(0)),
                    deposit:parseInt(web3.toWei(100))

                }
            }, `SmgWithdraw failed`);
            afterBal = web3.fromWei(web3.eth.getBalance(account1));
            console.log("before balance=" + initiatorPreBal + "||after balance=" + afterBal);
            assert.equal(afterBal-initiatorPreBal<=0,true,'delegate should not get deposit if smg is punished')

            punishRecieverAfterBal = web3.fromWei(web3.eth.getBalance(account2));
            console.log("punish reciever before balance=" + punishRecieverPreBal + "||after balance=" + punishRecieverAfterBal);
            assert.equal(parseInt(punishRecieverAfterBal) - parseInt(punishRecieverPreBal) == 100,true,'punish reciever should get the punished deposit if smg is punished')
        })


        it('test punish deposit transfer  - [smgAmin-T00909]', async () => {

            await coinAdminInst.setHalt(true,{from: owner});
            console.log("set delay time");
            await coinAdminInst.setWithdrawDepositDelayTime(ETHEREUM_ID, 1, {from: owner});
            await coinAdminInst.setSmgEnableUserWhiteList(0,false, {from: owner});
            await coinAdminInst.setSystemEnableBonus(0,true,10,{from: owner})
            await coinAdminInst.setHalt(false,{from: owner});

            console.log("storemanGroupRegister");
            let regDeposit = web3.toWei(100);

            await  smgAdminInstance.depositSmgBonus(0,{from:owner,value:regDeposit,gas:4000000});

            let res = await  smgAdminInstance.storemanGroupRegisterByDelegate(0,storeManWanAddr2,storeManBTCAddr2,storeManTxFeeRatio,{from:account1,value:regDeposit,gas:4000000});
           // console.log(res)

            console.log("=============================punish smg 50%=======================================================");
            res = await smgAdminInstance.punishStoremanGroup(ETHEREUM_ID,storeManWanAddr2,50,{from:owner});
           // console.log(res);

            console.log("================================unregister smg====================================================");
            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));
            console.log("begin unregister")
            res = await smgAdminInstance.smgApplyUnregisterByDelegate(0,storeManWanAddr2,{from:account1,gas:1000000});
           // console.log(res)

            afterBal = web3.fromWei(web3.eth.getBalance(account1));
            assert.equal(afterBal-initiatorPreBal<=0,true,'delegate should not get bonus if smg is punished')

            console.log("==============================withdraw deposit after punish 50%======================================================");
            punishRecieverPreBal = web3.fromWei(web3.eth.getBalance(account2));
            initiatorPreBal = web3.fromWei(web3.eth.getBalance(account1));
            res = await smgAdminInstance.storemanGroupWithdrawDeposit(0,{from:storeManWanAddr2, gas: 4000000})
            console.log(res);

            afterBal = web3.fromWei(web3.eth.getBalance(account1));
            console.log("before balance=" + initiatorPreBal + "||after balance=" + afterBal);
            assert.web3Event(res, {
                    event: "SmgWithdraw",
                    args: {
                        smgAddress:storeManWanAddr2,
                        coin:0,
                        actualReturn:parseInt(web3.toWei(50)),
                        deposit:parseInt(web3.toWei(100))

                    }
                }, `SmgWithdraw failed`);

            assert.equal(afterBal-initiatorPreBal>(50 - 2),true,"the transfered deposit should be around 50 ether")
            punishRecieverAfterBal = web3.fromWei(web3.eth.getBalance(account2));

            console.log("punish reciever before balance=" + punishRecieverPreBal + "||after balance=" + punishRecieverAfterBal);
            assert.equal(parseInt(punishRecieverAfterBal) - parseInt(punishRecieverPreBal) == 50,true,'punish reciever should get the punished deposit if smg is punished')

        })



        it('test transfer deposit by owner - [smgAmin-T00910]', async () => {

            await coinAdminInst.setHalt(true, {from: owner});
            await coinAdminInst.setSmgEnableUserWhiteList(0, false, {from: owner});
            await coinAdminInst.setSystemEnableBonus(0, true, 10, {from: owner})
            await coinAdminInst.setHalt(false, {from: owner});

            periodBlks = 10;

            console.log("storemanGroupRegister");
            let regDeposit = web3.toWei(100);

            await  smgAdminInstance.depositSmgBonus(0,{from:owner,value:2*regDeposit,gas:4000000});


            let res = await smgAdminInstance.storemanGroupRegisterByDelegate(0, storeManWanAddr2, storeManBTCAddr2, storeManTxFeeRatio, {
                from: account1,
                value: regDeposit,
                gas: 4000000
            });

            start = res.receipt.blockNumber;


            sleep(60*1000);

            console.log('tranfer out the smg deposit')
            let preBal = web3.fromWei(web3.eth.getBalance(storeManWanAddr3));
            res = await  smgAdminInstance.transferSmgDeposit(0,storeManWanAddr2,storeManWanAddr3,{from:owner});
            console.log(res);

            end = res.receipt.blockNumber;


            let afterBal = web3.fromWei(web3.eth.getBalance(storeManWanAddr3));
            console.log("before balance=" + preBal + "||after balance=" + afterBal);

            assert.web3Event(res, {
                event: "SmgClaimSystemBonus",
                args: {
                    smgAddress:storeManWanAddr3,
                    coin:0,
                    bonus:getBounus(),

                }
            }, `SmgClaimSystemBonus failed`);

            assert.web3Event(res, {
                event: "SmgTranferDeposit",
                args: {
                    smgAddress:storeManWanAddr2,
                    coin:0,
                    destAddress:storeManWanAddr3,
                    deposit:parseInt(web3.toWei(100)),
                }
            }, `SmgTranferDeposit failed`);




        });

    //*/


})//end