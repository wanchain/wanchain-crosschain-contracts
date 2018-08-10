const HTLCWETH = artifacts.require('./HTLCWETH.sol')
const WETHManager = artifacts.require("./WETHManager.sol")
const WETH = artifacts.require("./WETH.sol")
const StoremanGroupAdmin = artifacts.require("./StoremanGroupAdmin.sol")
require('truffle-test-utils').init()
var BigNumber = require('bignumber.js');
const createKeccakHash = require('keccak');
const crypto = require('crypto');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const web3 = global.web3;

const HTLCLockedTime = 20;
const HTLCRevokeFeeRatio = 350;
const GasPrice = 200000000000;
let RATIO_PRECISE = 0;
let wan2CoinRatio;
let txFeeRatio;


let WETHInstance;
let WETHManagerInstance;// = WETHManager.at("0x103ba1a2fad145f3a3e8b126ef88cb3e096a1990");
let StoremanGroupAdminInstance;// = StoremanGroupAdmin.at("0x4b155d089245d126fd0695edd8df93c495fc5662");
let HTLCWETHInstance;// = HTLCWETH.at('0x34a0cfbcbc1182721cc03466de5c841268a34856');


let ownerAcc;


let emptyAddress = '0x0000000000000000000000000000000000000000';

let x1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
let xHash1 = '0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6';

let x2 = '0x0000000000000000000000000000000000000000000000000000000000000002';
let xHash2 = '0x405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace';

let x3 = '0x0000000000000000000000000000000000000000000000000000000000000003';
let xHash3 = '0xc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b';

let x4 = '0x0000000000000000000000000000000000000000000000000000000000000004';
let xHash4 = '0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b';

let x5 = '0x0000000000000000000000000000000000000000000000000000000000000005';
let xHash5 = '0x036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db0';

let x6 = '0x0000000000000000000000000000000000000000000000000000000000000006';
let xHash6 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f';

let x7 = '0x0000000000000000000000000000000000000000000000000000000000000007';
let xHash7 = '0xa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c688';

let x8 = '0x0000000000000000000000000000000000000000000000000000000000000008';
let xHash8 = '0xf3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee3';

let x9 = '0x0000000000000000000000000000000000000000000000000000000000000009';
let xHash9 = '0x6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af';

let xa = '0x000000000000000000000000000000000000000000000000000000000000000a';
let xHasha = '0xc65a7bb8d6351c1cf70c95a316cc6a92839c986682d98bc35f958f4883f9d2a8';

let xb = '0x000000000000000000000000000000000000000000000000000000000000000b';
let xHashb = '0x0175b7a638427703f0dbe7bb9bbf987a2551717b34e79f33b5b1008d1fa01db9';

let xc = '0x000000000000000000000000000000000000000000000000000000000000000c';
let xHashc = '0xdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8c7';

let xd = '0x000000000000000000000000000000000000000000000000000000000000000d';
let xHashd = '0xd7b6990105719101dabeb77144f2a3385c8033acd3af97e9423a695e81ad1eb5';


function getHashKey(key){
    let h = createKeccakHash('keccak256');
    let kBuf = new Buffer(key.slice(2), 'hex');
    h.update(kBuf);
    let hashKey = '0x' + h.digest('hex');
    DebugLog.debug('input key:', key);
    DebugLog.debug('input hash key:', hashKey);
    return hashKey;
}

function generatePrivateKey(){
    let randomBuf;
    do{
        randomBuf = crypto.randomBytes(32);
    }while (!secp256k1.privateKeyVerify(randomBuf));
    return '0x' + randomBuf.toString('hex');
}

async function resetHalted (bHalted) {
    await HTLCWETHInstance.setHalt(bHalted, {from:ownerAcc});
    assert.equal(await HTLCWETHInstance.halted(), bHalted, `Failed to setHalt`);
}

// async function emptyWETHManager() {
//     validWETHManager = await HTLCWETHInstance.wethManager();
//     console.log(validWETHManager);
//     assert.notEqual(validWETHManager, emptyAddress, 'the wethManager address get from SC is invalid.');
//
//     await resetHalted(true);
//     await HTLCWETHInstance.setWETHManager(emptyAddress, {from:ownerAcc});
//     await resetHalted(false);
//
//     console.log(await HTLCWETHInstance.wethManager());
//     assert.equal(await HTLCWETHInstance.wethManager(), emptyAddress, `failed to setWETHManager`);
// }

async function recoverWETHManager() {
    await resetHalted(true);
    await HTLCWETHInstance.setWETHManager(WETHManagerInstance.address, {from:ownerAcc});
    await resetHalted(false);

    assert.equal(await HTLCWETHInstance.wethManager(), WETHManagerInstance.address, `failed to setWETHManager`);
}

// async function emptyStoremanGroupAdmin() {
//     validStoremanGroupAdmin = await HTLCWETHInstance.storemanGroupAdmin();
//     console.log(validStoremanGroupAdmin);
//     assert.notEqual(validStoremanGroupAdmin, emptyAddress, 'the storemanGroupAdmin address get from SC is invalid.');
//
//     await resetHalted(true);
//     await HTLCWETHInstance.setStoremanGroupAdmin(emptyAddress, {from:ownerAcc});
//     await resetHalted(false);
//
//     assert.equal(await HTLCWETHInstance.storemanGroupAdmin(), emptyAddress, `failed to setWETHManager`);
// }
//
async function recoverStoremanGroupAdmin() {
    await resetHalted(true);
    await HTLCWETHInstance.setStoremanGroupAdmin(StoremanGroupAdminInstance.address, {from:ownerAcc});
    await resetHalted(false);

    assert.equal(await HTLCWETHInstance.storemanGroupAdmin(), StoremanGroupAdminInstance.address, `failed to storemanGroupAdmin`);
}



// contract('HTLCWETH', ([recipient, owner, ign2, ign3, ign4, ign5, ign6, ign7, ign8, ign9, ign10, ign1,user ,ign11, storeman]) => {
contract('HTLCWETH', ([miner, recipient, owner, user, storeman]) => {

   ownerAcc = owner;

   before(`init`, async () => {

         await web3.personal.unlockAccount(owner, 'wanglu', 99999)
         await web3.personal.unlockAccount(storeman, 'wanglu', 99999)
         await web3.personal.unlockAccount(user, 'wanglu', 99999)

       StoremanGroupAdminInstance = await StoremanGroupAdmin.new({from:owner})
       HTLCWETHInstance = await HTLCWETH.new({from:owner})

       WETHManagerInstance = await WETHManager.new(HTLCWETHInstance.address,StoremanGroupAdminInstance.address,{from:owner});


       let wethAddr = await WETHManagerInstance.WETHToken();
       WETHInstance = WETH.at(wethAddr);
       console.log("wethAddr:", wethAddr);

       let ETHEREUM_ID = 0;
       let ratio = 200000; //1 eth:20,it need to mul the precise 10000
       let defaultMinDeposit = web3.toWei(100);
       let htlcType = 0; //use contract

       let originalChainHtlc = '0x7452bcd07fc6bb75653de9d9459bd442ac3f5c52';

       let wanchainHtlcAddr = HTLCWETHInstance.address;
       let wanchainTokenAdminAddr = WETHManagerInstance.address;

       let withdrawDelayTime = (3600*72);
       console.log("initializeCoin:");
       res = await  StoremanGroupAdminInstance.initializeCoin(ETHEREUM_ID,
           ratio,
           defaultMinDeposit,
           htlcType,
           originalChainHtlc,
           wanchainHtlcAddr,
           wanchainTokenAdminAddr,
           withdrawDelayTime,
           {from:owner,gas:4000000}
       );

       console.log("set ratio");
       await StoremanGroupAdminInstance.setWToken2WanRatio(ETHEREUM_ID,ratio,{from: owner});


       //console.log(coinInfo);
       await StoremanGroupAdminInstance.setSmgEnableUserWhiteList(ETHEREUM_ID, false, {from: owner});

       console.log("storemanGroupRegister");
       regDeposit = web3.toWei(2000);

       console.log("set halt");
       await StoremanGroupAdminInstance.setHalt(false,{from: owner});
       await WETHManagerInstance.setHalt(false,{from:owner});

       preBal = web3.fromWei(web3.eth.getBalance(storeman));
       console.log("preBal" + preBal);


       await  StoremanGroupAdminInstance.storemanGroupRegister(ETHEREUM_ID,storeman,10,{from:storeman,value:regDeposit,gas:4000000});

       // Reset lockedTime
       await resetHalted(true);
       console.log("initialize group weth to set token admin");

       await HTLCWETHInstance.setWETHManager(wanchainTokenAdminAddr,{from: owner});
       getTokenAdmin = await  HTLCWETHInstance.wethManager();
       assert.equal(getTokenAdmin,wanchainTokenAdminAddr, 'wanchainTokenAdminAddr not match');

       await HTLCWETHInstance.setStoremanGroupAdmin(StoremanGroupAdminInstance.address,{from: owner});
       smgAdminAddr = await  HTLCWETHInstance.storemanGroupAdmin();
       assert.equal(smgAdminAddr,StoremanGroupAdminInstance.address, 'wanchainTokenAdminAddr not match');


       await HTLCWETHInstance.setLockedTime(HTLCLockedTime, {from:owner});
       assert.equal((await HTLCWETHInstance.lockedTime()).toString(10), (HTLCLockedTime).toString(10), "setLockedTime fail");

        // tmp
       // await recoverWETHManager();
       // await recoverStoremanGroupAdmin();
        // tmp

       // set revoke fee ratio
       await HTLCWETHInstance.setRevokeFeeRatio(HTLCRevokeFeeRatio, {from:owner});
       assert.equal(await HTLCWETHInstance.revokeFeeRatio(), HTLCRevokeFeeRatio, `setRecokeFeeRatio fail`);

       // get RATIO_PRECISE
       RATIO_PRECISE = await HTLCWETHInstance.RATIO_PRECISE();
       wan2CoinRatio = (await StoremanGroupAdminInstance.mapCoinInfo(ETHEREUM_ID))[0];
       txFeeRatio = (await StoremanGroupAdminInstance.mapCoinSmgInfo(ETHEREUM_ID, storeman))[3];
       console.log(`RATIO_PRECISE`, RATIO_PRECISE);
       console.log(`wan2CoinRatio`, wan2CoinRatio);
       console.log(`txFeeRatio`, txFeeRatio);

       await resetHalted(false);
   });



    ////// eth2wethLock
    it(`[HTLCWETH-T2001]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.eth2wethLock(xHash1, user, web3.toWei(1), {from:storeman});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, 'eth2wethLock should fail while in halting');
    });


    // it(`[HTLCWETH-T2002]`, async () => {
    //
    //     let retError;
    //     try {
    //         await HTLCWETHInstance.eth2wethLock(xHash1, user, web3.toWei(1), {from:storeman});
    //     } catch (e) {
    //         retError = e;
    //     }
    //
    //     await recoverWETHManager();
    //
    //     assert.notEqual(retError, undefined, 'eth2wethLock should fail wethManager is uninitialized');
    // });

    // it(`[HTLCWETH-T2002-1]`, async () => {
    //     let retError;
    //     try {
    //         await HTLCWETHInstance.eth2wethLock(xHash1, user, web3.toWei(1), {from:storeman});
    //     } catch (e) {
    //         retError = e;
    //     }
    //
    //     await recoverStoremanGroupAdmin();
    //
    //     assert.notEqual(retError, undefined, 'eth2wethLock should fail storemanGroupAdmin is uninitialized');
    // });


    it(`[HTLCWETH-T2003]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethLock(xHash1, user, web3.toWei(1), {from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }
        assert.notEqual(retError, undefined, 'eth2wethLock should fail while tx.value is not 0');
    });


    it(`[HTLCWETH-T2007]`, async () => {
        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);

        let ret = await HTLCWETHInstance.eth2wethLock(xHash1, user, web3.toWei(1), {from:storeman});
        assert.web3Event(ret, {
            event: "ETH2WETHLock",
            args: {
                storeman:storeman,
                wanAddr:user,
                xHash:xHash1,
                value:parseInt(web3.toWei(1))
            }
        }, `eth2wethLock failed`);

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].sub(web3.toWei(1)).toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].add(web3.toWei(1)).toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.toString(), "unexcept user token");
    });

    it(`[HTLCWETH-T2109]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x1, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund can not replace eth2wethRefund');
    });

    it('[HTLCWETH-T2206]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xHash1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while before HTLC timeout`);
    });

    it(`[HTLCWETH-T2004]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethLock(xHash1, user, web3.toWei(1), {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethLock should fail while xHash exist already');
    });


    it(`[HTLCWETH-T2005]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethLock(xHash2, user, 0, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethLock should fail while param.value is 0');
    });


    it(`[HTLCWETH-T2006]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethLock(xHash2, user, web3.toWei(1000000), {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethLock should fail while storeman quatable value is not enough');
    });



    //////// eth2wethRefund


    it(`[HTLCWETH-T2101]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x1, {from:user, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while tx.value is not 0');
    });


    it(`[HTLCWETH-T2102]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x1, {from:user});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);
        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while halted is true');
    });

    /*

    it(`[HTLCWETH-T2103]`, async () => {
        await HTLCWETHInstance.setWETHManager(emptyAddress, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), emptyAddress, `failed to setWETHManager`);

        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x1, {from:user});
        } catch (e) {
            retError = e;
        }

        await HTLCWETHInstance.setWETHManager(WETHManagerInstance.address, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), WETHManagerInstance.address, `failed to setWETHManager`);

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while wethManager is uninitialized');
    });

    */

    it(`[HTLCWETH-T2104]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x3, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while xHash doesnt exist');
    });

    it(`[HTLCWETH-T2105]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x1, {from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while sender is not user');
    });

    it(`[HTLCWETH-T2105-2]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while sender is not user');
    });

    it(`[HTLCWETH-T2106]`, async () => {
        await sleep((HTLCLockedTime+5)*1000);

        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x1, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail after HTLC timeout');
    });


    it(`[HTLCWETH-T2107]`, async () => {
        let ret = await HTLCWETHInstance.eth2wethLock(xHash3, user, web3.toWei(10), {from:storeman});
        assert.web3Event(ret, {
            event: "ETH2WETHLock",
            args: {
                storeman:storeman,
                wanAddr:user,
                xHash:xHash3,
                value:parseInt(web3.toWei(10))
            }
        }, `eth2wethLock failed`);

        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);

        ret = await HTLCWETHInstance.eth2wethRefund(x3, {from:user});
        assert.web3Event(ret, {
            event: "ETH2WETHRefund",
            args: {
                wanAddr: user,
                storeman: storeman,
                xHash: xHash3,
                x: x3
            }
        }, `eth2wethRefund fail`);

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].add(web3.toWei(10)).toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].sub(web3.toWei(10)).toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].add(web3.toWei(10)).toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.add(web3.toWei(10)).toString(), "unexcept user token");
    });


    it(`[HTLCWETH-T2108]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x3, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRefund should fail while repeat`);
    });


    //////// eth2wethRevoke

    it(`[HTLCWETH-T2201]`, async()=> {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xHash1, {from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, "eth2wethRevoke should fail while tx.value is not 0")
    });


    it('[HTLCWETH-T2202]', async() => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xHash1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while is halting`);
    });


    /*
    it('[HTLCWETH-T2203]', async() => {
        await HTLCWETHInstance.setWETHManager(emptyAddress, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), emptyAddress, `setWETHManager fail`);

        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xHash1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        await HTLCWETHInstance.setWETHManager(WETHManagerInstance.address, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), WETHManagerInstance.address, `setWETHManager fail`);

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail wethManager is uninitialized`);
    });
    */


    it('[HTLCWETH-T2204]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xb, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while xHash doesnt exist`);
    });


    it('[HTLCWETH-T2205]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xHash1, {from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while sender is not storeman`);
    });

    it('[HTLCWETH-T2205]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xHash1, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while sender is not storeman`);
    });


    it('[HTLCWETH-T2209]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(xHash1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke can not replace eth2wethRevoke`);
    });


    it('[HTLCWETH-T2207]', async() => {
        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);

        let ret = await HTLCWETHInstance.eth2wethRevoke(xHash1, {from:storeman});
        assert.web3Event(ret, {
            event: "ETH2WETHRevoke",
            args: {
                storeman: storeman,
                xHash: xHash1
            }
        }, `eth2wethRevoke fail`);

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].add(web3.toWei(1)).toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].sub(web3.toWei(1)).toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.toString(), "unexcept user token");
    });



    it('[HTLCWETH-T2208]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(x1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while repeated`);
    });


    // //////// weth2ethLock


    it(`[HTLCWETH-T2301]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethLock(xHash4, storeman, recipient, web3.toWei(1), {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while tx.value is 0');
    })


    it(`[HTLCWETH-T2302]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.weth2ethLock(xHash4, storeman, recipient, web3.toWei(1), {from:user});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while is halting');
    });


    /*
    it(`[HTLCWETH-T2303]`, async () => {
        await HTLCWETHInstance.setWETHManager(emptyAddress, { from: owner })
        assert.equal(await HTLCWETHInstance.wethManager(), emptyAddress, `Failed to setWETHManager`);

        let retError;
        try {
            await HTLCWETHInstance.weth2ethLock(xHash4, storeman, recipient, web3.toWei(1), {from:user});
        } catch (e) {
            retError = e;
        }

        await HTLCWETHInstance.setWETHManager(WETHManagerInstance.address, { from: owner })
        assert.equal(await HTLCWETHInstance.wethManager(), WETHManagerInstance.address, `Failed to setWETHManager`);

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while wethManager is uninitialized');
    });
    */

    it(`[HTLCWETH-T2304]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethLock(xHash1, storeman, recipient, web3.toWei(1), {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while xHash exist already');
    });


    it(`[HTLCWETH-T2305]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethLock(xHash4, storeman, recipient, 0, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while param.value is 0');
    });

    it(`[HTLCWETH-T2306]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethLock(xHash4, storeman, recipient, web3.toWei(100000), {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while storeman tokenable value not enough');
    });

    it(`[HTLCWETH-T2308]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethLock(xHash4, storeman, recipient, web3.toWei(1), {from:user, value:web3.toWei(0.00000019)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while fee is not enough')
    });


    it(`[HTLCWETH-T2307]`, async () => {
        let Weth2EthLockFee = wan2CoinRatio.mul(txFeeRatio).mul(web3.toWei(1)).div(RATIO_PRECISE).div(RATIO_PRECISE);

        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        let beforeSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);
        console.log("beforeSCToken:", beforeSCToken);

        let beforeUserBalance = await web3.eth.getBalance(user);
        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log("beforeUserBalance:", beforeUserBalance);
        console.log("beforeSCBalance:", beforeSCBalance);

        let ret = await HTLCWETHInstance.weth2ethLock(xHash4, storeman, recipient, web3.toWei(1), {from:user, value:Weth2EthLockFee, gasPrice:'0x'+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: "WETH2ETHLock",
            args: {
                wanAddr: user,
                storeman: storeman,
                xHash: xHash4,
                value: parseInt(web3.toWei(1)),
                ethAddr: recipient,
                fee: parseInt(Weth2EthLockFee)
            }
        })

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        let afterSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);
        console.log("afterSCToken:", afterSCToken);

        let afterUserBalance = await web3.eth.getBalance(user);
        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log("afterUserBalance:", afterUserBalance);
        console.log("afterSCBalance:", afterSCBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].sub(web3.toWei(1)).toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].add(web3.toWei(1)).toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.sub(web3.toWei(1)).toString(), "unexcept user token");
        assert.equal(afterSCToken.toString(), beforeSCToken.add(web3.toWei(1)).toString(), "unexcept SC token");

        assert.equal(afterUserBalance.toString(), beforeUserBalance.sub(gasPrice.mul(gasUsed)).sub(Weth2EthLockFee).toString(), "unexpect user balance");
        assert.equal(afterSCBalance.toString(), beforeSCBalance.add(Weth2EthLockFee).toString(), "unexpect SC balance");
    });



    it(`[HTLCWETH-T2307-2]`, async () => {
        let Weth2EthLockFee = wan2CoinRatio.mul(txFeeRatio).mul(web3.toWei(1)).div(RATIO_PRECISE).div(RATIO_PRECISE);

        let ret = await HTLCWETHInstance.eth2wethLock(xHash8, user, web3.toWei(1), {from:storeman});
        assert.web3Event(ret, {
            event: "ETH2WETHLock",
            args: {
                storeman:storeman,
                wanAddr:user,
                xHash:xHash8,
                value:parseInt(web3.toWei(1))
            }
        }, `eth2wethLock failed`);

        ret = await HTLCWETHInstance.eth2wethRefund(x8, {from:user});
        assert.web3Event(ret, {
            event: "ETH2WETHRefund",
            args: {
                wanAddr: user,
                storeman: storeman,
                xHash: xHash8,
                x: x8
            }
        }, `eth2wethRefund fail`);

        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        let beforeSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);
        console.log("beforeSCToken:", beforeSCToken);

        let beforeUserBalance = await web3.eth.getBalance(user);
        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log("beforeUserBalance:", beforeUserBalance);
        console.log("beforeSCBalance:", beforeSCBalance);

        ret = await HTLCWETHInstance.weth2ethLock(xHash9, storeman, recipient, web3.toWei(1), {from:user, value:web3.toWei(30), gasPrice:'0x'+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: "WETH2ETHLock",
            args: {
                wanAddr: user,
                storeman: storeman,
                xHash: xHash9,
                value: parseInt(web3.toWei(1)),
                ethAddr: recipient,
                fee: parseInt(Weth2EthLockFee)
            }
        })

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        let afterSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);
        console.log("afterSCToken:", afterSCToken);

        let afterUserBalance = await web3.eth.getBalance(user);
        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log("afterUserBalance:", afterUserBalance);
        console.log("afterSCBalance:", afterSCBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].sub(web3.toWei(1)).toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].add(web3.toWei(1)).toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.sub(web3.toWei(1)).toString(), "unexcept user token");
        assert.equal(afterSCToken.toString(), beforeSCToken.add(web3.toWei(1)).toString(), "unexcept SC token");

        assert.equal(afterUserBalance.toString(), beforeUserBalance.sub(gasPrice.mul(gasUsed)).sub(Weth2EthLockFee).toString(), "unexpect user balance");
        assert.equal(afterSCBalance.toString(), beforeSCBalance.add(Weth2EthLockFee).toString(), "unexpect SC balance");
    });


    it(`[HTLCWETH-T2307-3]`, async () => {
        let Weth2EthLockFee = wan2CoinRatio.mul(txFeeRatio).mul(web3.toWei(1)).div(RATIO_PRECISE).div(RATIO_PRECISE);

        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        let beforeSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);
        console.log("beforeSCToken:", beforeSCToken);

        let beforeUserBalance = await web3.eth.getBalance(user);
        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log("beforeUserBalance:", beforeUserBalance);
        console.log("beforeSCBalance:", beforeSCBalance);

        let ret = await HTLCWETHInstance.weth2ethLock(xHasha, storeman, recipient, web3.toWei(1), {from:user, value:Weth2EthLockFee, gasPrice:'0x'+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: "WETH2ETHLock",
            args: {
                wanAddr: user,
                storeman: storeman,
                xHash: xHasha,
                value: parseInt(web3.toWei(1)),
                ethAddr: recipient,
                fee: parseInt(Weth2EthLockFee)
            }
        })

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        let afterSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);
        console.log("afterSCToken:", afterSCToken);

        let afterUserBalance = await web3.eth.getBalance(user);
        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log("afterUserBalance:", afterUserBalance);
        console.log("afterSCBalance:", afterSCBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].sub(web3.toWei(1)).toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].add(web3.toWei(1)).toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.sub(web3.toWei(1)).toString(), "unexcept user token");
        assert.equal(afterSCToken.toString(), beforeSCToken.add(web3.toWei(1)).toString(), "unexcept SC token");

        assert.equal(afterUserBalance.toString(), beforeUserBalance.sub(gasPrice.mul(gasUsed)).sub(Weth2EthLockFee).toString(), "unexpect user balance");
        assert.equal(afterSCBalance.toString(), beforeSCBalance.add(Weth2EthLockFee).toString(), "unexpect SC balance");
    });


    it('[HTLCWETH-T2409]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRefund(x4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRefund can not replace weth2ethRefund`);
    });


    it('[HTLCWETH-T2506]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(x4, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while before HTLC timeout`);
    });



    //////// weth2ethRefund

    it(`[HTLCWETH-T2401]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x4, {from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while tx.value is not 0');
    });



    it(`[HTLCWETH-T2402]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while halted is true');
    });


    /*
    it(`[HTLCWETH-T2403]`, async () => {
        await  HTLCWETHInstance.setWETHManager(emptyAddress, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), emptyAddress, "fail to setHalt");

        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        await  HTLCWETHInstance.setWETHManager(WETHManagerInstance.address, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), WETHManagerInstance.address, "fail to setHalt");

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while wethManager is uninitialized');
    });
    */


    it(`[HTLCWETH-T2404]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x5, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while xHash does not exist');
    });


    it(`[HTLCWETH-T2405]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x4, {from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while sender is not storeman');
    });


    it(`[HTLCWETH-T2405-2]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x4, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while sender is not storeman');
    });


    it(`[HTLCWETH-T2406]`, async () => {
        await sleep((HTLCLockedTime*2+5)*1000);

        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while HTLC timeout already');
    });


    it(`[HTLCWETH-T2407]`, async () => {
        let Weth2EthLockFee = wan2CoinRatio.mul(txFeeRatio).mul(web3.toWei(1)).div(RATIO_PRECISE).div(RATIO_PRECISE);

         let ret = await HTLCWETHInstance.eth2wethLock(xHash7, user, web3.toWei(1), {from:storeman});
         assert.web3Event(ret, {
             event: "ETH2WETHLock",
             args: {
                 storeman:storeman,
                 wanAddr:user,
                 xHash:xHash7,
                 value:parseInt(web3.toWei(1))
             }
         }, `eth2wethLock failed`);

         ret = await HTLCWETHInstance.eth2wethRefund(x7, {from:user});
         assert.web3Event(ret, {
             event: "ETH2WETHRefund",
             args: {
                 wanAddr: user,
                 storeman: storeman,
                 xHash: xHash7,
                 x: x7
             }
         }, `eth2wethRefund fail`);

        ret = await HTLCWETHInstance.weth2ethLock(xHash5, storeman, recipient, web3.toWei(1), {from:user, value:web3.toWei(20)});
        assert.web3Event(ret, {
            event: "WETH2ETHLock",
            args: {
                wanAddr: user,
                storeman: storeman,
                xHash: xHash5,
                value: parseInt(web3.toWei(1)),
                ethAddr: recipient,
                fee: parseInt(Weth2EthLockFee)
            }
        }, `weth2ethLock fail`);


        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        let beforeStoremanToken = await WETHInstance.balanceOf(storeman);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeSCToken:", beforeSCToken);
        console.log("beforeStoremanToken:", beforeStoremanToken);

        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let beforeStoremanBalance = await web3.eth.getBalance(storeman);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("beforeStoremanBalance:", beforeStoremanBalance);


        ret = await HTLCWETHInstance.weth2ethRefund(x5, {from:storeman, gasPrice:'0x'+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: "WETH2ETHRefund",
            args: {
                storeman: storeman,
                wanAddr: user,
                xHash: xHash5,
                x: x5
            }
        }, `weth2ethRefund fail`);

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        let afterStoremanToken = await WETHInstance.balanceOf(storeman);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterSCToken:", afterSCToken);
        console.log("afterStoremanToken:", afterStoremanToken);

        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let afterStoremanBalance = await web3.eth.getBalance(storeman);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("afterStoremanBalance:", afterStoremanBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].add(web3.toWei(1)).toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].sub(web3.toWei(1)).toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].sub(web3.toWei(1)).toString(), "unexcept storeman debt");
        assert.equal(afterSCToken.toString(), beforeSCToken.sub(web3.toWei(1)).toString(), "unexcept SC token");
        assert.equal(afterStoremanToken.toString(), beforeStoremanToken.toString(), "unexcept storeman token");

        assert.equal(afterSCBalance.toString(), beforeSCBalance.sub(Weth2EthLockFee).toString(), "unexpect SC balance");
        assert.equal(afterStoremanBalance.toString(), beforeStoremanBalance.add(Weth2EthLockFee).sub(gasPrice.mul(gasUsed)).toString(), "unexpect storeman balance");

    });

    it(`[HTLCWETH-T2408]`, async () => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRefund(x5, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while repeated');
    });


    //////// weth2ethRevoke

    it(`[HTLCWETH-T2501]`, async()=> {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(xHash4, {from:user, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, "weth2ethRevoke should fail while tx.value is not 0")
    });

    it('[HTLCWETH-T2502]', async() => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(xHash4, {from:user});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while is halting`);
    });


    /*
    it('[HTLCWETH-T2503]', async() => {
        await HTLCWETHInstance.setWETHManager(emptyAddress, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), emptyAddress, `setWETHManager fail`);

        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(xHash4, {from:user});
        } catch (e) {
            retError = e;
        }

        await HTLCWETHInstance.setWETHManager(WETHManagerInstance.address, {from:owner});
        assert.equal(await HTLCWETHInstance.wethManager(), WETHManagerInstance.address, `setWETHManager fail`);

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while wethManager is uninitialized`);
    });
    */

    it('[HTLCWETH-T2504]', async() => {
        await sleep((HTLCLockedTime+5)*1000);
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(xHash6, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while xHash doesnt exist`);
    });


    it('[HTLCWETH-T2505]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(xHash4, {from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while sender is not user`);
    });

    it('[HTLCWETH-T2510]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.eth2wethRevoke(xHash4, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke can not replace weth2ethRevoke`);
    });


    it('HTLCWETH-T2507]', async() => {
        let Weth2EthLockFee = wan2CoinRatio.mul(txFeeRatio).mul(web3.toWei(1)).div(RATIO_PRECISE).div(RATIO_PRECISE);

        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        let beforeSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);
        console.log("beforeSCToken:", beforeSCToken);

        let beforeUserBalance = await web3.eth.getBalance(user);
        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let beforeStoremanBalance = await web3.eth.getBalance(storeman);
        console.log("beforeUserBalance:", beforeUserBalance);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("beforeStoremanBalance:", beforeStoremanBalance);


        let ret = await HTLCWETHInstance.weth2ethRevoke(xHash4, {from:user, gasPrice:'0x'+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: "WETH2ETHRevoke",
            args: {
                wanAddr: user,
                xHash: xHash4
            }
        }, `weth2ethRevoke fail`)

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        let afterSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);
        console.log("afterSCToken:", afterSCToken);

        let afterUserBalance = await web3.eth.getBalance(user);
        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let afterStoremanBalance = await web3.eth.getBalance(storeman);
        console.log("afterUserBalance:", afterUserBalance);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("afterStoremanBalance:", afterStoremanBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].add(web3.toWei(1)).toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].sub(web3.toWei(1)).toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.add(web3.toWei(1)).toString(), "unexcept user token");
        assert.equal(afterSCToken.toString(), beforeSCToken.sub(web3.toWei(1)).toString(), "unexcept SC token");

        let revokeFee = Weth2EthLockFee.mul(HTLCRevokeFeeRatio).div(RATIO_PRECISE);
        let leftFee = Weth2EthLockFee.sub(revokeFee);
        let exceptUserBalance = beforeUserBalance.sub(gasPrice.mul(gasUsed)).add(leftFee);
        let exceptStoremanBalance = beforeStoremanBalance.add(revokeFee);
        let exceptSCBalance = beforeSCBalance.sub(Weth2EthLockFee);
        console.log("revokeFee:", revokeFee);
        console.log("leftFee:", leftFee);
        console.log("exceptUserBalance:", exceptUserBalance);
        console.log("exceptSCBalance:", exceptSCBalance);
        console.log("exceptStoremanBalance:", exceptStoremanBalance);

        assert.equal(afterUserBalance.toString(), exceptUserBalance.toString(), "unexpect user balance");
        assert.equal(afterStoremanBalance.toString(), exceptStoremanBalance.toString(), "unexpect storeman balance");
        assert.equal(afterSCBalance.toString(), exceptSCBalance.toString(), "unexpect SC balance");

    });



    it('HTLCWETH-T2508]', async() => {
        let Weth2EthLockFee = wan2CoinRatio.mul(txFeeRatio).mul(web3.toWei(1)).div(RATIO_PRECISE).div(RATIO_PRECISE);

        let beforeStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let beforeUserToken = await WETHInstance.balanceOf(user);
        let beforeSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("beforeStoremanInfo:", beforeStoremanInfo);
        console.log("beforeUserToken:", beforeUserToken);
        console.log("beforeSCToken:", beforeSCToken);

        let beforeUserBalance = await web3.eth.getBalance(user);
        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let beforeStoremanBalance = await web3.eth.getBalance(storeman);
        console.log("beforeUserBalance:", beforeUserBalance);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("beforeStoremanBalance:", beforeStoremanBalance);


        let ret = await HTLCWETHInstance.weth2ethRevoke(xHasha, {from:storeman, gasPrice:'0x'+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: "WETH2ETHRevoke",
            args: {
                wanAddr: user,
                xHash: xHasha
            }
        }, `weth2ethRevoke fail`)

        let afterStoremanInfo = await WETHManagerInstance.getStoremanGroup(storeman);
        let afterUserToken = await WETHInstance.balanceOf(user);
        let afterSCToken = await WETHInstance.balanceOf(HTLCWETHInstance.address);
        console.log("afterStoremanInfo:", afterStoremanInfo);
        console.log("afterUserToken:", afterUserToken);
        console.log("afterSCToken:", afterSCToken);

        let afterUserBalance = await web3.eth.getBalance(user);
        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let afterStoremanBalance = await web3.eth.getBalance(storeman);
        console.log("afterUserBalance:", afterUserBalance);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("afterStoremanBalance:", afterStoremanBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        assert.equal(afterStoremanInfo[0].toString(), beforeStoremanInfo[0].toString(), "unexcept storeman quata");
        assert.equal(afterStoremanInfo[1].toString(), beforeStoremanInfo[1].toString(), "unexcept storeman inboundQuata");
        assert.equal(afterStoremanInfo[2].toString(), beforeStoremanInfo[2].add(web3.toWei(1)).toString(), "unexcept storeman outboundQuata");
        assert.equal(afterStoremanInfo[3].toString(), beforeStoremanInfo[3].toString(), "unexcept storeman receivable");
        assert.equal(afterStoremanInfo[4].toString(), beforeStoremanInfo[4].sub(web3.toWei(1)).toString(), "unexcept storeman payable");
        assert.equal(afterStoremanInfo[5].toString(), beforeStoremanInfo[5].toString(), "unexcept storeman debt");
        assert.equal(afterUserToken.toString(), beforeUserToken.add(web3.toWei(1)).toString(), "unexcept user token");
        assert.equal(afterSCToken.toString(), beforeSCToken.sub(web3.toWei(1)).toString(), "unexcept SC token");

        let revokeFee = Weth2EthLockFee.mul(HTLCRevokeFeeRatio).div(RATIO_PRECISE);
        let leftFee = Weth2EthLockFee.sub(revokeFee);
        let exceptUserBalance = beforeUserBalance.add(leftFee);
        let exceptStoremanBalance = beforeStoremanBalance.add(revokeFee).sub(gasPrice.mul(gasUsed));
        let exceptSCBalance = beforeSCBalance.sub(Weth2EthLockFee);
        console.log("revokeFee:", revokeFee);
        console.log("leftFee:", leftFee);
        console.log("exceptUserBalance:", exceptUserBalance);
        console.log("exceptSCBalance:", exceptSCBalance);
        console.log("exceptStoremanBalance:", exceptStoremanBalance);

        assert.equal(afterUserBalance.toString(), exceptUserBalance.toString(), "unexpect user balance");
        assert.equal(afterStoremanBalance.toString(), exceptStoremanBalance.toString(), "unexpect storeman balance");
        assert.equal(afterSCBalance.toString(), exceptSCBalance.toString(), "unexpect SC balance");

    });


    it('[HTLCWETH-T2509]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.weth2ethRevoke(xHash4, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while repeated`);
    });


    it('[HTLCWETH-T2701]', async() => {
        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log("beforeSCBalance:", beforeSCBalance);

        let retError;
        try {
            await HTLCWETHInstance.sendTransaction({from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        console.log(`afterSCBalance:`, afterSCBalance);

        assert.equal(beforeSCBalance.toString(), afterSCBalance.toString(), `SC balance should not be changed`)
        assert.notEqual(retError, undefined, `fallback function should be dispayable`);
    });


    it('[HTLCWETH-T2702]', async() => {
        await resetHalted(false);

        let retError;
        try {
            await HTLCWETHInstance.setHalt(true, {from:storeman, gas:4000000});
        } catch (e) {
            retError = e;
        }

        let afterHalted = await HTLCWETHInstance.halted();
        console.log(`afterHaled:`, afterHalted);

        assert.equal(false, afterHalted, `halted should not be changed`);
        assert.notEqual(retError, undefined, `setHalt should fail while called by non owner`);
    });

    it('[HTLCWETH-T2703]', async() => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setHalt(false, {from:storeman, gas:4000000});
        } catch (e) {
            retError = e;
        }

        let afterHalted = await HTLCWETHInstance.halted();
        console.log(`afterHaled:`, afterHalted);

        await resetHalted(false);
        assert.equal(true, afterHalted, `halted should not be changed`);
        assert.notEqual(retError, undefined, `setHalt should fail while called by non owner`);
    });


    it('[HTLCWETH-T2704]', async() => {
        let beforeLockedTime = await HTLCWETHInstance.lockedTime();
        console.log(`beforeLockedTime:`, beforeLockedTime);

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setLockedTime(beforeLockedTime.mul(2), {from:storeman, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterLockedTime = await HTLCWETHInstance.lockedTime();
        console.log(`afterLockedTime:`, afterLockedTime);

        assert.equal(beforeLockedTime.toString(), afterLockedTime.toString(), `lockedTime should not be changed`);
        assert.notEqual(retError, undefined, `setLockedTime should fail while called by non owner`);
    });

    it('[HTLCWETH-T2705]', async() => {
        let beforeLockedTime = await HTLCWETHInstance.lockedTime();
        console.log(`beforeLockedTime:`, beforeLockedTime);

        let retError;
        try {
            await HTLCWETHInstance.setLockedTime(beforeLockedTime.mul(2), {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        let afterLockedTime = await HTLCWETHInstance.lockedTime();
        console.log(`afterLockedTime:`, afterLockedTime);

        assert.equal(beforeLockedTime.toString(), afterLockedTime.toString(), `lockedTime should not be changed`);
        assert.notEqual(retError, undefined, `setLockedTime should fail while halted is false`);
    });

    it('[HTLCWETH-T2706]', async() => {
        let beforeLockedTime = await HTLCWETHInstance.lockedTime();
        console.log(`beforeLockedTime:`, beforeLockedTime);

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setLockedTime(beforeLockedTime.mul(2), {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterLockedTime = await HTLCWETHInstance.lockedTime();
        console.log(`afterLockedTime:`, afterLockedTime);

        assert.equal(beforeLockedTime.mul(2).toString(), afterLockedTime.toString(), `lockedTime should be changed`);
        assert.equal(retError, undefined, `setLockedTime fail`);
    });

    it(`[HTLCWETH-T2707]`, async() => {
        let beforeRevokeFeeRatio = await HTLCWETHInstance.revokeFeeRatio();
        console.log(`beforeRevokeFeeRatio:`, beforeRevokeFeeRatio);

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setRevokeFeeRatio(beforeRevokeFeeRatio.add(1), {from:storeman, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterRevokeFeeRatio = await HTLCWETHInstance.revokeFeeRatio();
        console.log(`afterRevokeFeeRatio:`, afterRevokeFeeRatio);

        assert.equal(afterRevokeFeeRatio.toString(), beforeRevokeFeeRatio.toString(), `revokeFeeRatio should not be changed`);
        assert.notEqual(retError, undefined, `setRevokeFeeRatio should fail while called by non owner`)
    })

    it(`[HTLCWETH-T2708]`, async() => {
        let beforeRevokeFeeRatio = await HTLCWETHInstance.revokeFeeRatio();
        console.log(`beforeRevokeFeeRatio:`, beforeRevokeFeeRatio);

        await resetHalted(false);

        let retError;
        try {
            await HTLCWETHInstance.setRevokeFeeRatio(beforeRevokeFeeRatio.add(1), {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(true);

        let afterRevokeFeeRatio = await HTLCWETHInstance.revokeFeeRatio();
        console.log(`afterRevokeFeeRatio:`, afterRevokeFeeRatio);

        assert.equal(afterRevokeFeeRatio.toString(), beforeRevokeFeeRatio.toString(), `revokeFeeRatio should not be changed`);
        assert.notEqual(retError, undefined, `setRevokeFeeRatio should fail while halted is false`)
    })

    it(`[HTLCWETH-T2709]`, async() => {
        let beforeRevokeFeeRatio = await HTLCWETHInstance.revokeFeeRatio();
        console.log(`beforeRevokeFeeRatio:`, beforeRevokeFeeRatio);

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setRevokeFeeRatio(beforeRevokeFeeRatio.add(1), {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterRevokeFeeRatio = await HTLCWETHInstance.revokeFeeRatio();
        console.log(`afterRevokeFeeRatio:`, afterRevokeFeeRatio);

        assert.equal(afterRevokeFeeRatio.toString(), beforeRevokeFeeRatio.add(1).toString(), `revokeFeeRatio should be changed`);
        assert.equal(retError, undefined, `setRevokeFeeRatio fail`)
    })


    it(`[HTLCWETH-T2710]`, async() => {
        let beforeWethManager = await HTLCWETHInstance.wethManager();
        console.log(`beforeWethManager:`, beforeWethManager);
        let newWethManager = '0x0000000000000000000000000000000000000011';

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setWETHManager(newWethManager, {from:storeman, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterWethManager = await HTLCWETHInstance.wethManager();
        console.log(`afterWethManager:`, afterWethManager);

        assert.equal(beforeWethManager, afterWethManager, `wethManager should not be changed`);
        assert.notEqual(retError, undefined, `setWETHManager should fail while called by non owner`)
    })

    it(`[HTLCWETH-T2711]`, async() => {
        let beforeWethManager = await HTLCWETHInstance.wethManager();
        console.log(`beforeWethManager:`, beforeWethManager);
        let newWethManager = '0x0000000000000000000000000000000000000011';

        let retError;
        try {
            await HTLCWETHInstance.setWETHManager(newWethManager, {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        let afterWethManager = await HTLCWETHInstance.wethManager();
        console.log(`afterWethManager:`, afterWethManager);

        assert.equal(beforeWethManager, afterWethManager, `wethManager should not be changed`);
        assert.notEqual(retError, undefined, `setWETHManager should fail while halted is true`)
    })


    it(`[HTLCWETH-T2712]`, async() => {
        let beforeWethManager = await HTLCWETHInstance.wethManager();
        console.log(`beforeWethManager:`, beforeWethManager);
        let newWethManager = '0x0000000000000000000000000000000000000011';

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setWETHManager(newWethManager, {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterWethManager = await HTLCWETHInstance.wethManager();
        console.log(`afterWethManager:`, afterWethManager);

        assert.equal(newWethManager, afterWethManager, `wethManager should be changed`);
        assert.equal(retError, undefined, `setWETHManager fail`)
    })


    it(`[HTLCWETH-T2713]`, async() => {
        let beforeStoremanGroupAdmin = await HTLCWETHInstance.storemanGroupAdmin();
        console.log(`beforeStoremanGroupAdmin:`, beforeStoremanGroupAdmin);
        let newAddress = '0x0000000000000000000000000000000000000011';

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setStoremanGroupAdmin(newAddress, {from:storeman, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterStoremanGroupAdmin = await HTLCWETHInstance.storemanGroupAdmin();
        console.log(`afterStoremanGroupAdmin:`, afterStoremanGroupAdmin);

        assert.equal(beforeStoremanGroupAdmin, afterStoremanGroupAdmin, `storemanGroupAdmin should not be changed`);
        assert.notEqual(retError, undefined, `setStoremanGroupAdmin should fail while called by non owner`)
    })


    it(`[HTLCWETH-T2714]`, async() => {
        let beforeStoremanGroupAdmin = await HTLCWETHInstance.storemanGroupAdmin();
        console.log(`beforeStoremanGroupAdmin:`, beforeStoremanGroupAdmin);
        let newAddress = '0x0000000000000000000000000000000000000011';

        let retError;
        try {
            await HTLCWETHInstance.setStoremanGroupAdmin(newAddress, {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        let afterStoremanGroupAdmin = await HTLCWETHInstance.storemanGroupAdmin();
        console.log(`afterStoremanGroupAdmin:`, afterStoremanGroupAdmin);

        assert.equal(beforeStoremanGroupAdmin, afterStoremanGroupAdmin, `storemanGroupAdmin should not be changed`);
        assert.notEqual(retError, undefined, `setStoremanGroupAdmin should fail while halted is true`)
    })


    it(`[HTLCWETH-T2715]`, async() => {
        let beforeStoremanGroupAdmin = await HTLCWETHInstance.storemanGroupAdmin();
        console.log(`beforeStoremanGroupAdmin:`, beforeStoremanGroupAdmin);
        let newAddress = '0x0000000000000000000000000000000000000011';

        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.setStoremanGroupAdmin(newAddress, {from:owner, gas:4000000});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        let afterStoremanGroupAdmin = await HTLCWETHInstance.storemanGroupAdmin();
        console.log(`afterStoremanGroupAdmin:`, afterStoremanGroupAdmin);

        assert.equal(newAddress, afterStoremanGroupAdmin, `storemanGroupAdmin should be changed`);
        assert.equal(retError, undefined, `setStoremanGroupAdmin fail`);
    })


    it('[HTLCWETH-T2601]', async() => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCWETHInstance.kill({from:storeman});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, `kill should fail while called by non owner`);
    });


    it('[HTLCWETH-T2602]', async() => {
        let retError;
        try {
            await HTLCWETHInstance.kill({from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `kill should fail while halted is true`);
    });

    it('[HTLCWETH-T2603]', async() => {
        await resetHalted(true);

        let beforeSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let beforeOwnerBalance = await web3.eth.getBalance(owner);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("beforeOwnerBalance:", beforeOwnerBalance);

        let ret = await HTLCWETHInstance.kill({from:owner, gasPrice:"0x"+GasPrice.toString(16)});
        assert.equal(ret.receipt.status, '0x1', 'kill HTLCWETH SC fail');

        let scCode = await web3.eth.getCode(HTLCWETHInstance.address);
        console.log("scCode:", scCode);
        assert.equal(scCode, '0x', 'code data should be empoty');

        let afterSCBalance = await web3.eth.getBalance(HTLCWETHInstance.address);
        let afterOwnerBalance = await web3.eth.getBalance(owner);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("afterOwnerBalance:", afterOwnerBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        assert.equal(afterSCBalance.toString(), "0", "unexcept SC balance");
        assert.equal(afterOwnerBalance.toString(), beforeOwnerBalance.add(beforeSCBalance).sub(gasPrice.mul(gasUsed)).toString(), "unexcept owner balance");

        assert.equal(await HTLCWETHInstance.lockedTime(), 0, "unexcept locked time");
    });

})