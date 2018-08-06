const HTLCETH = artifacts.require('./HTLCETH.sol')
require('truffle-test-utils').init()
var BigNumber = require('bignumber.js');
const web3 = global.web3

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const HTLCLockedTime = 80;
const HTLCRevokeFeeRatio = 400;
const GasPrice = 200000000000;
let RATIO_PRECISE = 0;

// let SCAddr = '0x3c343b44701a18e815a39ed8c3f5902b14c15caf';
// let HTLCETHInstance = HTLCETH.at(SCAddr);

let SCAddr = '0x0';
let HTLCETHInstance;

let ownerAcc;


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
let xHash7 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f';

let x8 = '0x0000000000000000000000000000000000000000000000000000000000000008';
let xHash8 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f';

let x9 = '0x0000000000000000000000000000000000000000000000000000000000000009';
let xHash9 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f';

let xa = '0x000000000000000000000000000000000000000000000000000000000000000a';
let xHasha = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f';

let xb = '0x000000000000000000000000000000000000000000000000000000000000000b';
let xHashb = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f';


async function resetHalted (bHalted) {
    await HTLCETHInstance.setHalt(bHalted, {from:ownerAcc});
    assert.equal(await HTLCETHInstance.halted(), bHalted, `Failed to setHalt`);
}

contract('HTLCETH', ([recipient, ign1, ign2, ign3, ign4, ign5, ign6, ign7,owner, storeman, user]) => {

    ownerAcc = owner;

    before(`init`, async () => {

	await web3.personal.unlockAccount(recipient, 'wanglu', 99999)
        await web3.personal.unlockAccount(owner, 'wanglu', 99999)
        await web3.personal.unlockAccount(storeman, 'wanglu', 99999)
        await web3.personal.unlockAccount(user, 'wanglu', 99999)

        // await web3.personal.unlockAccount(web3.eth.accounts[0], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[1], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[2], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[3], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[4], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[5], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[6], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[8], 'wanglu', 99999);
        // await web3.personal.unlockAccount(web3.eth.accounts[9], 'wanglu', 99999);

        // Deploy
        HTLCETHInstance = await HTLCETH.new({from:owner});
        SCAddr = HTLCETHInstance.address;

        // Reset lockedTime
        await HTLCETHInstance.setLockedTime(HTLCLockedTime, {from:owner});
        assert.equal(await HTLCETHInstance.lockedTime(), HTLCLockedTime, "setLockedTime fail");

        // set revoke fee ratio
        await HTLCETHInstance.setRevokeFeeRatio(HTLCRevokeFeeRatio, {from:owner});
        assert.equal(await HTLCETHInstance.revokeFeeRatio(), HTLCRevokeFeeRatio, `setRecokeFeeRatio fail`);

        // get RATIO_PRECISE
        RATIO_PRECISE = await HTLCETHInstance.RATIO_PRECISE();

        //
        await resetHalted(false);

    })


    //// eth2wethLock

    it(`[HTLCETH-T1001]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCETHInstance.eth2wethLock(xHash1, storeman, recipient, {from:user, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, 'eth2wethLock should fail while in halting');
    });

    it(`[HTLCETH-T1002]`, async () => {

        let retError;
        try {
            await HTLCETHInstance.eth2wethLock(xHash1, storeman, recipient, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethLock should fail while tx.value is 0');
    });

    it(`[HTLCETH-T1004]`, async () => {
        let beforeUserBalance = web3.eth.getBalance(user);
        let beforeSCBalance = web3.eth.getBalance(SCAddr);

        let ret = await HTLCETHInstance.eth2wethLock(xHash1, storeman, recipient, {from:user, value:web3.toWei(1), gasPrice:"0x"+(GasPrice).toString(16)});
        assert.web3Event(ret, {
            event: 'ETH2WETHLock',
            args: {
                user: user,
                storeman: storeman,
                xHash: xHash1,
                value: parseInt(web3.toWei(1)),
                wanAddr: recipient
            }
        }, `eth2wethLock should successfull`);

        console.log("ret:", ret);

        let afterUserBalance = web3.eth.getBalance(user);
        let afterSCBalance = web3.eth.getBalance(SCAddr);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);
        let exceptUserBalance = beforeUserBalance.sub(new BigNumber(web3.toWei(1))).sub(gasPrice.mul(gasUsed));
        let exceptSCBalance = beforeSCBalance.add(web3.toWei(1));

        console.log("beforeUserBalance:", beforeUserBalance);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("afterUserBalance:", afterUserBalance);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("exceptUserBalance:", exceptUserBalance);
        console.log("exceptSCBalance:", exceptSCBalance);

        assert.equal(exceptUserBalance.toString(), afterUserBalance.toString(), "unexcept user balance");
        assert.equal(exceptSCBalance.toString(), afterSCBalance.toString(), "unexcept SC balance");

    });

    it('[HTLCETH-T1108]', async() => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRefund(x1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRefund can not replace eth2wethRefund`);
    });

    it('[HTLCETH-T1205]', async() => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRevoke(xHash1, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while tx is not timeout`)
    });

    it(`[HTLCETH-T1003]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethLock(xHash1, storeman, recipient, {from:user, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethLock should fail while xHash exist already');
    });


    ////// eth2wethRefund

    it(`[HTLCETH-T1101]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRefund(x1, {from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while tx.value is not 0');
    });


    it(`[HTLCETH-T1102]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCETHInstance.eth2wethRefund(x1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);
        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while halted is true');
    });


    it(`[HTLCETH-T1103]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRefund(x2, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'eth2wethRefund should fail while xHash doesnt exist');
    });


    it(`[HTLCETH-T1104]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRefund(x1, {from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRefund should fail while sender is not storeman`);
    });

    it(`[HTLCETH-T1105]`, async() => {
        await sleep((HTLCLockedTime+20)*2*1000);

        let retError;
        try {
            await HTLCETHInstance.eth2wethRefund(x1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRefund should fail while timeout`);
    });

    it(`[HTLCETH-T1106]`, async()=> {
        let ret = await HTLCETHInstance.eth2wethLock(xHash2, storeman, recipient, {from:user, value:web3.toWei(1)});
        assert.web3Event(ret, {
            event: 'ETH2WETHLock',
            args: {
                user: user,
                storeman: storeman,
                xHash: xHash2,
                value: parseInt(web3.toWei(1)),
                wanAddr: recipient
            }
        }, `eth2wethLock should successfull`);


        let beforeSCBalance = web3.eth.getBalance(SCAddr);
        let beforeStoremanBalance = web3.eth.getBalance(storeman);
        ret = await HTLCETHInstance.eth2wethRefund(x2, {from:storeman, gasPrice:"0x"+(GasPrice).toString(16)});
        assert.web3Event(ret, {
            event: 'ETH2WETHRefund',
            args: {
                storeman:storeman,
                user: user,
                xHash: xHash2,
                x: x2
            }
        }, `eth2wethRefund is fired!`);

        let afterSCBalance = web3.eth.getBalance(SCAddr);
        let afterStoremanBalance = web3.eth.getBalance(storeman);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        let exceptSCBalance = beforeSCBalance.sub(web3.toWei(1));
        let exceptStoremanBalance = beforeStoremanBalance.sub(gasPrice.mul(gasUsed)).add(web3.toWei(1));

        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("beforeStoremanBalance:", beforeStoremanBalance);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("afterStoremanBalance:", afterStoremanBalance);
        console.log("exceptSCBalance:", exceptSCBalance);
        console.log("exceptStoremanBalance:", exceptStoremanBalance);

        assert.equal(exceptSCBalance.toString(), afterSCBalance.toString(), "unexcept SC balance");
        assert.equal(exceptStoremanBalance.toString(), afterStoremanBalance.toString(), "unexcept storeman balance");
    });


    it('[HTLCETH-T1107]', async() => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRefund(x2, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRefund should fail while repeated refund`);
    });


    //////// eth2wethRevoke

    it(`[HTLCETH-T1201]`, async()=> {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRevoke(xHash1, {from:user, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, "eth2wethRevoke should fail while tx.value is not 0")
    });

    it('[HTLCETH-T1202]', async() => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCETHInstance.eth2wethRevoke(xHash1, {from:user});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while is halting`);
    });

    it('[HTLCETH-T1203]', async() => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRevoke(x3, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while xHash doesnt exist`);
    });

    it('[HTLCETH-T1204]', async() => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRevoke(x1, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while sender is not user`);
    });

    it('[HTLCETH-T1208]', async() => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRevoke(xHash1, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke can not replace eth2wethRevoke`);
    });


    it('[HTLCETH-T1206]', async() => {
        let beforeBalance = web3.eth.getBalance(user);
        let beforeStoremanBalance = web3.eth.getBalance(storeman);

        let ret = await HTLCETHInstance.eth2wethRevoke(xHash1, {from:user, gasPrice:"0x" + (GasPrice).toString(16)});
        assert.web3Event(ret, {
            event: "ETH2WETHRevoke",
            args:{
                user: user,
                xHash: xHash1
            }
        }, `eth2wethRevoke is fired`);

        let afterBalance = web3.eth.getBalance(user);
        let afterStoremanBalance = web3.eth.getBalance(storeman);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);
        let fee = new BigNumber(web3.toWei(1)).mul(HTLCRevokeFeeRatio).div(RATIO_PRECISE);

        expectBalance = beforeBalance.sub(gasPrice.mul(gasUsed)).add(web3.toWei(1)).sub(fee);
        expectStoremanBalance = beforeStoremanBalance.add(fee);

        console.log("beforeBalance:", beforeBalance.toString());
        console.log("beforeStoremanBalance:", beforeStoremanBalance.toString());
        console.log("afterBalance:", afterBalance.toString());
        console.log("afterStoremanBalance:", afterStoremanBalance.toString());
        console.log("expectBalance:", expectBalance.toString());
        console.log("expectStoremanBalance:", expectStoremanBalance.toString());

        assert.equal(expectBalance.toString(), afterBalance.toString(), "the revoking fee is wrong");
        assert.equal(expectStoremanBalance.toString(), afterStoremanBalance.toString(), "the fee add to storeman is wrong");
    });


    it('[HTLCETH-T1207]', async() => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRevoke(xHash1, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while repeated revoke`);
    });



    //////// weth2ethLock


    it(`[HTLCETH-T1301]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCETHInstance.weth2ethLock(xHash4, user, {from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);
        assert.notEqual(retError, undefined, 'weth2ethLock should fail while in halting');
    });

    it(`[HTLCETH-T1302]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethLock(xHash4, user, {from:storeman});
            retError = e;
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while tx.value is 0');
    });

    it(`[HTLCETH-T1304]`, async () => {
        let beforeStoremanBalance = web3.eth.getBalance(storeman);
        let beforeSCBalance = web3.eth.getBalance(SCAddr);

        let ret = await HTLCETHInstance.weth2ethLock(xHash4, user, {from:storeman, value:web3.toWei(1), gasPrice:"0x"+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: 'WETH2ETHLock',
            args: {
                user: user,
                storeman: storeman,
                xHash: xHash4,
                value: parseInt(web3.toWei(1))
            }
        }, `weth2ethLock should successfull`);

        let afterStoremanBalance = web3.eth.getBalance(storeman);
        let afterSCBlance = web3.eth.getBalance(SCAddr);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        let exceptStoremanBalance = beforeStoremanBalance.sub(gasPrice.mul(gasUsed)).sub(web3.toWei(1));
        let exceptSCBalance = beforeSCBalance.add(web3.toWei(1));

        console.log("beforeStoremanBalance:", beforeStoremanBalance);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("afterStoremanBalance:", afterStoremanBalance);
        console.log("afterSCBlance:", afterSCBlance);
        console.log("exceptStoremanBalance:", exceptStoremanBalance);
        console.log("exceptSCBalance:", exceptSCBalance);

        assert.equal(exceptStoremanBalance.toString(), afterStoremanBalance.toString(), "unexcept storeman balance");
        assert.equal(exceptSCBalance.toString(), afterSCBlance.toString(), "unexcept SC balance");
    });

    it(`[HTLCETH-T1408]`, async() => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRefund(x4, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRefund can not replace weth2ethRefund`);

    });

    it('[HTLCETH-T1505]', async() => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRevoke(xHash4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while tx is not timeout`)
    });

    it(`[HTLCETH-T1303]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethLock(xHash4, user, {from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethLock should fail while xHash exist already');
    });

    //////// weth2ethRefund


    it(`[HTLCETH-T1401]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRefund(x4, {from:user, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while tx.value is not 0');
    });


    it(`[HTLCETH-T1402]`, async () => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCETHInstance.weth2ethRefund(x4, {from:user});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);
        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while halted is true');
    });


    it(`[HTLCETH-T1403]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRefund(x5, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, 'weth2ethRefund should fail while xHash doesnt exist');
    });


    it(`[HTLCETH-T1404]`, async () => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRefund(x4, {from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRefund should fail while sender is not storeman`);
    });

    it(`[HTLCETH-T1405]`, async() => {
        await sleep((HTLCLockedTime+10)*1000);

        let retError;
        try {
            await HTLCETHInstance.weth2ethRefund(x4, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRefund should fail while timeout`);

    });

    it(`[HTLCETH-T1406]`, async()=> {
        let ret = await HTLCETHInstance.weth2ethLock(xHash5, user, {from:storeman, value:web3.toWei(1)});
        assert.web3Event(ret, {
            event: 'WETH2ETHLock',
            args: {
                user: user,
                storeman: storeman,
                xHash: xHash5,
                value: parseInt(web3.toWei(1))
            }
        }, `weth2ethLock should successfull`);

        let beforeUserBalance = web3.eth.getBalance(user);
        let beforeSCBalance = web3.eth.getBalance(SCAddr);

        ret = await HTLCETHInstance.weth2ethRefund(x5, {from:user, gasPrice:"0x"+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: 'WETH2ETHRefund',
            args: {
                storeman:storeman,
                user: user,
                xHash: xHash5,
                x: x5
            }
        }, `weth2ethRefund is fired!`);

        let afterUserBalance = web3.eth.getBalance(user);
        let afterSCBalance = web3.eth.getBalance(SCAddr);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        let exceptUserBalance = beforeUserBalance.sub(gasPrice.mul(gasUsed)).add(web3.toWei(1));
        let exceptSCBalance = beforeSCBalance.sub(web3.toWei(1));

        console.log("beforeUserBalance:", beforeUserBalance);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("afterUserBalance:", afterUserBalance);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("exceptUserBalance:", exceptUserBalance);
        console.log("exceptSCBalance:", exceptSCBalance);

        assert.equal(exceptSCBalance.toString(), afterSCBalance.toString(), "unexcept SC balance");
        assert.equal(exceptUserBalance.toString(), afterUserBalance.toString(), "unexcept user balance");
    });


    it('[HTLCETH-T1407]', async() => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRefund(x5, {from:user});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRefund should fail while repeated refund`);
    });


    //////// weth2ethRevoke

    it(`[HTLCETH-T1501]`, async()=> {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRevoke(xHash4, {from:storeman, value:web3.toWei(1)});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, "weth2ethRevoke should fail while tx.value is not 0")
    });

    it('[HTLCETH-T1502]', async() => {
        await resetHalted(true);

        let retError;
        try {
            await HTLCETHInstance.weth2ethRevoke(xHash4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);
        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while is halting`);
    });

    it('[HTLCETH-T1503]', async() => {
        await HTLCETHInstance.setHalt(false, {from:owner});
        assert.equal(await HTLCETHInstance.halted(), false, `setHalt fail`);

        let retError;
        try {
            await HTLCETHInstance.weth2ethRevoke(xHash6, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke should fail while xHash doesnt exist`);
    });

    it('[HTLCETH-T1504]', async() => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRevoke(xHash4, {from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while sender is not storeman`);
    });

    it('[HTLCETH-T1508]', async() => {
        let retError;
        try {
            await HTLCETHInstance.eth2wethRevoke(xHash4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `eth2wethRevoke can not replace weth2ethRevoke`);
    });


    it('[HTLCETH-T1506]', async() => {
        let beforeStoremanBalance = web3.eth.getBalance(storeman);
        let beforeSCBalance = web3.eth.getBalance(SCAddr);

        let ret = await HTLCETHInstance.weth2ethRevoke(xHash4, {from:storeman, gasPrice:"0x"+GasPrice.toString(16)});
        assert.web3Event(ret, {
            event: "WETH2ETHRevoke",
            args: {
                storeman: storeman,
                xHash: xHash4
            }
        }, `weth2ethRevoke is fired`);

        let afterStoremanBalance = web3.eth.getBalance(storeman);
        let afterSCBalance = web3.eth.getBalance(SCAddr);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);

        let exceptStoremanBalance = beforeStoremanBalance.sub(gasUsed.mul(gasPrice)).add(web3.toWei(1));
        let exceptSCBlance = beforeSCBalance.sub(web3.toWei(1));

        assert.equal(exceptStoremanBalance.toString(), afterStoremanBalance.toString(), "unexcept storeman balance");
        assert.equal(exceptSCBlance.toString(), afterSCBalance.toString(), "unexcept SC balance");
    });


    it('[HTLCETH-T1507]', async() => {
        let retError;
        try {
            await HTLCETHInstance.weth2ethRevoke(xHash4, {from:storeman});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `weth2ethRevoke should fail while repeated revoke`);
    });

    it('[HTLCETH-T1601]', async() => {
        await resetHalted(true);
        let retError;
        try {
            await HTLCETHInstance.kill({from:storeman});
        } catch (e) {
            retError = e;
        }

        await resetHalted(false);
        assert.notEqual(retError, undefined, `kill should fail while called by non owner`);
    });

    it('[HTLCETH-T1602]', async() => {
        let retError;
        try {
            await HTLCETHInstance.kill({from:owner});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined, `kill should fail while halted is false`);
    });


    it('[HTLCWETH-T1603]', async() => {
        await resetHalted(true);

        let beforeSCBalance = await web3.eth.getBalance(HTLCETHInstance.address);
        let beforeOwnerBalance = await web3.eth.getBalance(owner);
        console.log("beforeSCBalance:", beforeSCBalance);
        console.log("beforeOwnerBalance:", beforeOwnerBalance);

        let ret = await HTLCETHInstance.kill({from:owner, gasPrice:"0x"+GasPrice.toString(16)});
        assert.equal(ret.receipt.status, '0x1', 'kill HTLCWETH SC fail');

        let scCode = await web3.eth.getCode(HTLCETHInstance.address);
        console.log("scCode:", scCode);
        assert.equal(scCode, '0x', 'code data should be empoty');

        let afterSCBalance = await web3.eth.getBalance(HTLCETHInstance.address);
        let afterOwnerBalance = await web3.eth.getBalance(owner);
        console.log("afterSCBalance:", afterSCBalance);
        console.log("afterOwnerBalance:", afterOwnerBalance);

        let gasPrice = new BigNumber(GasPrice);
        let gasUsed = new BigNumber(ret.receipt.gasUsed);
        console.log("tx fee:", gasPrice.mul(gasUsed));

        assert.equal(afterSCBalance.toString(), "0", "unexcept SC balance");
        assert.equal(afterOwnerBalance.toString(), beforeOwnerBalance.add(beforeSCBalance).sub(gasPrice.mul(gasUsed)).toString(), "unexcept owner balance");

        assert.equal(await HTLCETHInstance.lockedTime(), 0, "unexcept locked time");
    });


})
