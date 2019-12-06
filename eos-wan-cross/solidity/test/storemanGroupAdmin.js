const encoder = require("../utils/encoder");
const crossChainAccount = require('../utils/account/crossChainAccount');
const BN = web3.utils.BN;

const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');
const HTLCProxy = artifacts.require('HTLCProxy');
const HTLCDelegate = artifacts.require('HTLCDelegate');
const StoremanGroupProxy = artifacts.require('StoremanGroupProxy');
const StoremanGroupDelegate = artifacts.require('StoremanGroupDelegate');

// common
const ADDRESS_0 = '0x0000000000000000000000000000000000000000';

// storeman
const storemanTxFeeRatio = 10; // 0.001
const storemanDepositWan = 10;
const storemanDeposit = web3.utils.toWei(storemanDepositWan.toString());
const DEFAULT_PRECISE = 10000;
const storeman = '0x042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c341619';

// token
const eosAccount = new crossChainAccount("eos", "ascii");

const eosToken = {
  // for register
  origAddr: eosAccount.encodeAccount('eosio.token:EOS'),
  ratio: 2,
  minDeposit: web3.utils.toWei('10'),
  withdrawDelayTime: 10, // for test, normal value is 60 * 60 * 72,
  name: encoder.str2hex('Wanchain EOS Crosschain Token'),
  symbol: encoder.str2hex('EOS'),
  decimals: 4,
  // for test
  quota: new BN(Math.pow(10, 8) / 2), // (msg.value).mul(defaultPrecise).div(token2WanRatio).mul(10**uint(decimals)).div(1 ether)
}

let tmSc, smgProxy, smgDelegate, smgSC, htlcSc;

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

contract('StoremanGroupAdmin_UNITs', async ([owner, delegate, someone]) => {
  it('should do all preparations', async () => {
    // unlock account
    await web3.eth.personal.unlockAccount(owner, 'wl', 99999);
    await web3.eth.personal.unlockAccount(delegate, 'wl', 99999);
    await web3.eth.personal.unlockAccount(someone, 'wl', 99999);

    // register eos token
    let tmProxy = await TokenManagerProxy.deployed();
    tmSc = await TokenManagerDelegate.at(tmProxy.address);
    await tmSc.addToken(eosToken.origAddr, eosToken.ratio, eosToken.minDeposit, eosToken.withdrawDelayTime, eosToken.name, eosToken.symbol, eosToken.decimals);

    // register storeman
    smgProxy = await StoremanGroupProxy.deployed();
    smgSC = await StoremanGroupDelegate.at(smgProxy.address);
    smgDelegate = await StoremanGroupDelegate.deployed();

    // other sc
    let htlcProxy = await HTLCProxy.deployed();
    htlcSc = await HTLCDelegate.at(htlcProxy.address);
  })

  // upgradeTo
  it('[StoremanGroupProxy_upgradeTo] should fail: not owner', async () => {
    let result = {};
    try {
      await smgProxy.upgradeTo(smgDelegate.address, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not owner');
  })

  it('[StoremanGroupProxy_upgradeTo] should fail: invalid implementation address', async () => {
    let result = {};
    try {
      await smgProxy.upgradeTo(ADDRESS_0, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Cannot upgrade to invalid address');
  })

  it('[StoremanGroupProxy_upgradeTo] should success', async () => {
    let result = {};
    try {
      await smgProxy.upgradeTo(smgProxy.address, {from: owner}); // set self address temporarily
      await smgProxy.upgradeTo(smgDelegate.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined);
    assert.equal(await smgProxy.implementation(), smgDelegate.address)
  })

  it('[StoremanGroupProxy_upgradeTo] should fail: duplicate upgrade', async () => {
    let result = {};
    try {
      await smgProxy.upgradeTo(smgDelegate.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Cannot upgrade to the same implementation');
  })  

  // setDependence
  it('[StoremanGroupDelegate_setDependence] should fail: not owner', async () => {
    let result = {};
    try {
      await smgSC.setDependence(tmSc.address, htlcSc.address, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not owner');
  })

  it('[StoremanGroupDelegate_setDependence] should fail: invalide tokenManager address', async () => {
    let result = {};
    try {
      await smgSC.setDependence(ADDRESS_0, htlcSc.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalide tokenManager address');
  })
  
  it('[StoremanGroupDelegate_setDependence] should fail: invalide htlc address', async () => {
    let result = {};
    try {
      await smgSC.setDependence(tmSc.address, ADDRESS_0, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalide htlc address');
  })

  it('[StoremanGroupDelegate_setDependence] should success', async () => {
    let result = {};
    try {
      await smgSC.setDependence(tmSc.address, htlcSc.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined);
    assert.equal(await smgSC.tokenManager.call(), tmSc.address);
    assert.equal(await smgSC.htlc.call(), htlcSc.address);
  })  

  // enableSmgWhiteList
  it('[StoremanGroupDelegate_enableSmgWhiteList] should fail: not owner', async () => {
    let result = {};
    try {
      await smgSC.enableSmgWhiteList(true, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not owner');
  })

  it('[StoremanGroupDelegate_enableSmgWhiteList] should success', async () => {
    let result = {};
    try {
      await smgSC.enableSmgWhiteList(true, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined);
    assert.equal(await smgSC.isWhiteListEnabled.call(), true);
  })  

  // setSmgWhiteList
  it('[StoremanGroupDelegate_setSmgWhiteList] should fail: not owner', async () => {
    let result = {};
    try {
      await smgSC.setSmgWhiteList(storeman, true, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not owner');
  })

  it('[StoremanGroupDelegate_setSmgWhiteList] should fail: invalid storemanGroup', async () => {
    let result = {};
    try {
      await smgSC.setSmgWhiteList('0x', true, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalid storemanGroup')
  })

  it('[StoremanGroupDelegate_setSmgWhiteList_true] should success', async () => {
    let result = {};
    try {
      result = await smgSC.setSmgWhiteList(storeman, true, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined);
    let event = result.logs[0].args;
    assert.equal(event.storemanGroup, storeman)
    assert.equal(event.isEnable, true)
  })

  it('[StoremanGroupDelegate_setSmgWhiteList_false] should success', async () => {
    let result = {};
    try {
      result = await smgSC.setSmgWhiteList(storeman, false, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined);
    let event = result.logs[0].args;
    assert.equal(event.storemanGroup, storeman)
    assert.equal(event.isEnable, false)
  })
  
  it('[StoremanGroupDelegate_setSmgWhiteList_duplicate] should fail: duplicate set', async () => {
    let result = {};
    try {
      await smgSC.setSmgWhiteList(storeman, false, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Duplicate set');
  })

  it('[StoremanGroupDelegate_setSmgWhiteList] should fail: WhiteList is disabled', async () => {
    let result = {};
    try {
      await smgSC.enableSmgWhiteList(false, {from: owner});
      await smgSC.setSmgWhiteList(storeman, true, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'White list is disabled');
  })

  // storemanGroupRegister
  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.storemanGroupRegister(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: invalid tokenOrigAccount', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.storemanGroupRegister('0x', storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalid tokenOrigAccount')
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: invalid storemanGroup', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegister(eosToken.origAddr, '0x', storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalid storemanGroup')
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: invalid txFeeRatio', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegister(eosToken.origAddr, storeman, DEFAULT_PRECISE, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalid txFeeRatio')
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: non-exist token', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegister('0x00', storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Token not exist')
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: less than minDeposit', async () => {
    let result = {};
    try {
      const deposit = new BN(storemanDeposit).sub(new BN(1));
      await smgSC.storemanGroupRegister(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: deposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'At lease minDeposit')
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: not in WhiteList', async () => {
    let result = {};
    try {
      await smgSC.enableSmgWhiteList(true, {from: owner});
      await smgSC.storemanGroupRegister(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not in white list')
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should success', async () => {
    let result = {};
    let beforeBalance = 0, afterBalance = 0;
    try {
      beforeBalance = await web3.eth.getBalance(smgSC.address);
      await smgSC.setSmgWhiteList(storeman, true, {from: owner});
      result = await smgSC.storemanGroupRegister(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
      afterBalance = await web3.eth.getBalance(smgSC.address);
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    assert.equal(new BN(afterBalance).sub(new BN(beforeBalance)).eq(new BN(storemanDeposit)), true)
    // check smg info
    let smgInfo = await smgSC.getStoremanGroupInfo(eosToken.origAddr, storeman);
    assert.equal(smgInfo[0], delegate)
    assert.equal(smgInfo[1], storemanDeposit)
    assert.equal(smgInfo[2], storemanTxFeeRatio)
    assert.equal(smgInfo[3], 0)
    // check event
    let event = result.logs[0].args;
    let expectedQuota = eosToken.quota.mul(new BN(storemanDepositWan));
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    assert.equal(event.wanDeposit, storemanDeposit)
    assert.equal(event.quota.eq(expectedQuota), true)
    assert.equal(event.txFeeRatio, storemanTxFeeRatio)
    // check htlc quota
    let htlc = await htlcSc.queryStoremanGroupQuota(eosToken.origAddr, storeman);
    assert.equal(new BN(htlc[0]).eq(expectedQuota), true)
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should success: WhiteList is disabled', async () => {
    let result = {};
    let beforeBalance = 0, afterBalance = 0;
    let fakeSmg = encoder.str2hex('fake_storeman');
    try {
      beforeBalance = await web3.eth.getBalance(smgSC.address);
      await smgSC.enableSmgWhiteList(false, {from: owner});
      result = await smgSC.storemanGroupRegister(eosToken.origAddr, fakeSmg, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
      afterBalance = await web3.eth.getBalance(smgSC.address);
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    assert.equal(new BN(afterBalance).sub(new BN(beforeBalance)).eq(new BN(storemanDeposit)), true)
    // check smg info
    let smgInfo = await smgSC.getStoremanGroupInfo(eosToken.origAddr, fakeSmg);
    assert.equal(smgInfo[0], delegate)
    assert.equal(smgInfo[1], storemanDeposit)
    assert.equal(smgInfo[2], storemanTxFeeRatio)
    assert.equal(smgInfo[3], 0)
    // check event
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, fakeSmg)
    assert.equal(event.wanDeposit, storemanDeposit)
    assert.equal(event.quota.eq(eosToken.quota.mul(new BN(storemanDepositWan))), true)
    assert.equal(event.txFeeRatio, storemanTxFeeRatio)
  })

  it('[StoremanGroupDelegate_storemanGroupRegister] should fail: duplicate register', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegister(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Duplicate register')
  })

  // storemanGroupUnregister
  it('[StoremanGroupDelegate_storemanGroupUnregister] should fail: halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.storemanGroupUnregister(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_storemanGroupUnregister] should fail: not initiator', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.storemanGroupUnregister(eosToken.origAddr, storeman, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupDelegate_storemanGroupUnregister] should success', async () => {
    let result = {};
    try {
      result = await smgSC.storemanGroupUnregister(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    // check smg info
    let smgInfo = await smgSC.getStoremanGroupInfo(eosToken.origAddr, storeman);
    assert.equal(smgInfo[0], delegate)
    assert.equal(smgInfo[1], storemanDeposit)
    assert.equal(smgInfo[2], storemanTxFeeRatio)
    assert.notEqual(smgInfo[3], 0)
    // check event
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    // assert.equal(event.applyTime, 0)
  })

  it('[StoremanGroupDelegate_storemanGroupUnregister] should fail: duplicate unregister', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupUnregister(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Duplicate unregister')
  })

  // storemanGroupWithdrawDeposit
  it('[StoremanGroupDelegate_storemanGroupWithdrawDeposit] should fail: halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.storemanGroupWithdrawDeposit(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_storemanGroupWithdrawDeposit] should fail: not initiator', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.storemanGroupWithdrawDeposit(eosToken.origAddr, storeman, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })
 
  it('[StoremanGroupDelegate_storemanGroupWithdrawDeposit] should fail: in delay time', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupWithdrawDeposit(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Must wait until delay time')
  })

  it('[StoremanGroupDelegate_storemanGroupWithdrawDeposit] should success', async () => {
    let result = {};
    let beforeBalance = 0, afterBalance = 0;
    try {
      await sleep(eosToken.withdrawDelayTime + 2);
      beforeBalance = await web3.eth.getBalance(delegate);
      result = await smgSC.storemanGroupWithdrawDeposit(eosToken.origAddr, storeman, {from: delegate});
      afterBalance = await web3.eth.getBalance(delegate);
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    assert.equal(new BN(afterBalance).sub(new BN(beforeBalance)).add(new BN(web3.utils.toWei('1'))).gt(new BN(storemanDeposit)), true)
    // check smg info
    let smgInfo = await smgSC.getStoremanGroupInfo(eosToken.origAddr, storeman);
    assert.equal(smgInfo[0], ADDRESS_0)
    assert.equal(smgInfo[1], 0)
    assert.equal(smgInfo[2], 0)
    assert.equal(smgInfo[3], 0)
    // check event
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    assert.equal(new BN(event.actualReturn.toString()).lte(new BN(storemanDeposit.toString())), true)
    assert.equal(event.deposit, storemanDeposit)
  })

  it('[StoremanGroupDelegate_storemanGroupWithdrawDeposit] should fail: duplicate withdraw', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupWithdrawDeposit(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator') // dunplicate withdraw
  })

  // storemanGroupAppendDeposit
  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.storemanGroupAppendDeposit(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: invalid tokenOrigAccount', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.storemanGroupAppendDeposit('0x', storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: invalid storemanGroup', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupAppendDeposit(eosToken.origAddr, '0x', {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: not registered', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupAppendDeposit(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: not initiator', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegister(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
      await smgSC.storemanGroupAppendDeposit(eosToken.origAddr, storeman, {from: someone, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: Value too small', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupAppendDeposit(eosToken.origAddr, storeman, {from: delegate, value: 0});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Value too small')
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should success', async () => {
    let result = {};
    let beforeBalance = 0, afterBalance = 0;
    try {
      beforeBalance = await web3.eth.getBalance(smgSC.address);
      result = await smgSC.storemanGroupAppendDeposit(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
      afterBalance = await web3.eth.getBalance(smgSC.address);
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    assert.equal(new BN(afterBalance).sub(new BN(beforeBalance)).eq(new BN(storemanDeposit)), true)
    // check smg info
    let expectedDeposit = new BN(storemanDeposit).mul(new BN(2));
    let expectedQuota = eosToken.quota.mul(new BN(storemanDepositWan * 2));
    let smgInfo = await smgSC.getStoremanGroupInfo(eosToken.origAddr, storeman);
    assert.equal(new BN(smgInfo[1]).eq(expectedDeposit), true)
    // check event
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    assert.equal(new BN(event.wanDeposit).eq(expectedDeposit), true)
    assert.equal(new BN(event.quota).eq(expectedQuota), true)
    // check htlc quota
    let htlc = await htlcSc.queryStoremanGroupQuota(eosToken.origAddr, storeman);
    assert.equal(new BN(htlc[0]).eq(expectedQuota), true)
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: inactive', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupUnregister(eosToken.origAddr, storeman, {from: delegate});
      await smgSC.storemanGroupAppendDeposit(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Inactive')
  })

  it('[StoremanGroupDelegate_storemanGroupAppendDeposit] should fail: unsupported function', async () => {
    let result = null;
    try {
      let fakeSC = await TokenManagerDelegate.at(smgProxy.address);
      await fakeSC.getTokenInfo(eosToken.origAddr);
    } catch (e) {
      result = e;
    }
    assert.notEqual(result, null)
  })
  
})