const encoder = require("../utils/encoder");
const crossChainAccount = require('../utils/account/crossChainAccount');
var BN = web3.utils.BN;

const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');
const WanToken = artifacts.require('WanToken');
const Secp256k1 = artifacts.require('Secp256k1');
const SchnorrVerifier = artifacts.require('SchnorrVerifier');
const QuotaLib = artifacts.require('QuotaLib');
const HTLCLib = artifacts.require('HTLCLib');
const HTLCDebtLib = artifacts.require('HTLCDebtLib');
const HTLCSmgLib = artifacts.require('HTLCSmgLib');
const HTLCUserLib = artifacts.require('HTLCUserLib');
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
  quota: new BN(Math.pow(10, 8) / 2), // (msg.value).mul(defaultPricise).div(token2WanRatio).mul(10**uint(decimals)).div(1 ether)
}

let tmSc, smgProxy, smgDelegate, smgSC, htlcSc, qlSc;

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

contract('StoremanGroupAdmin_UNITs', async ([owner, delegate, someone]) => {
  it('should do all preparations', async () => {
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
    qlSc = htlcSc; // quotaLedger act as a lib of htlc
  })

  // upgradeTo
  it('[StoremanGroupProxy_upgradeTo] should fail in case invoked by not owner', async () => {
    let result = {};
    try {
      await smgProxy.upgradeTo(smgDelegate.address, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not owner');
  })

  it('[StoremanGroupProxy_upgradeTo] should fail in case duplicate upgrade', async () => {
    let result = {};
    try {
      await smgProxy.upgradeTo(smgDelegate.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Cannot upgrade to the same implementation');
  })

  it('[StoremanGroupProxy_upgradeTo] should success', async () => {
    let result = {};
    try {
      await smgProxy.upgradeTo(ADDRESS_0, {from: owner});
      await smgProxy.upgradeTo(smgDelegate.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined);
    assert.equal(await smgProxy._implementation.call(), smgDelegate.address)
  })

  // setDependence
  it('[StoremanGroupDelegate_setDependence] should fail in case invoked by not owner', async () => {
    let result = {};
    try {
      await smgSC.setDependence(tmSc.address, qlSc.address, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not owner');
  })

  it('[StoremanGroupDelegate_setDependence] should fail in case invalide tokenManager address', async () => {
    let result = {};
    try {
      await smgSC.setDependence(ADDRESS_0, qlSc.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalide tokenManager address');
  })
  
  it('[StoremanGroupDelegate_setDependence] should fail in case invalide htlc address', async () => {
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
      await smgSC.setDependence(tmSc.address, qlSc.address, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined);
    assert.equal(await smgSC.tokenManager.call(), tmSc.address);
    assert.equal(await smgSC.quotaLedger.call(), qlSc.address);
  })  

  // enableSmgWhiteList
  it('[StoremanGroupDelegate_enableSmgWhiteList] should fail in case invoked by not owner', async () => {
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
  it('[StoremanGroupDelegate_setSmgWhiteList] should fail in case invoked by not owner', async () => {
    let result = {};
    try {
      await smgSC.setSmgWhiteList(storeman, true, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not owner');
  })

  it('[StoremanGroupDelegate_setSmgWhiteList] should fail in case invalid storeman group pk', async () => {
    let result = {};
    try {
      await smgSC.setSmgWhiteList('0x', true, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'PK is null')
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
  
  it('[StoremanGroupDelegate_setSmgWhiteList_duplicate] should fail in case duplicate set', async () => {
    let result = {};
    try {
      await smgSC.setSmgWhiteList(storeman, false, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Duplicate set');
  })

  it('[StoremanGroupDelegate_setSmgWhiteList] should fail in case WhiteList is disabled', async () => {
    let result = {};
    try {
      await smgSC.enableSmgWhiteList(false, {from: owner});
      await smgSC.setSmgWhiteList(storeman, true, {from: owner});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'White list is disabled');
  })

  // storemanGroupRegisterByDelegate
  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case invalid tokenOrigAccount', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.storemanGroupRegisterByDelegate('0x', storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Account is null')
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case invalid storeman group pk', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, '0x', storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'PK is null')
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case invalid txFeeRatio', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, 0, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Invalid txFeeRatio')
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case register non-exist token', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate('0x00', storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Token not exist')
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case deposit less than minDeposit', async () => {
    let result = {};
    try {
      const deposit = new BN(storemanDeposit).sub(new BN(1));
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: deposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Value must be greater than minDeposit')
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case not in WhiteList', async () => {
    let result = {};
    try {
      await smgSC.enableSmgWhiteList(true, {from: owner});
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not in white list')
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should success', async () => {
    let result = {};
    try {
      await smgSC.setSmgWhiteList(storeman, true, {from: owner});
      result = await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    assert.equal(event.wanDeposit, storemanDeposit)
    assert.equal(event.quota.eq(eosToken.quota.mul(new BN(storemanDepositWan))), true)
    assert.equal(event.txFeeRatio, storemanTxFeeRatio)
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should success in case WhiteList is disabled', async () => {
    let result = {};
    let fakeSmg = encoder.str2hex('fake_storeman');
    try {
      await smgSC.enableSmgWhiteList(false, {from: owner});
      result = await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, fakeSmg, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, fakeSmg)
    assert.equal(event.wanDeposit, storemanDeposit)
    assert.equal(event.quota.eq(eosToken.quota.mul(new BN(storemanDepositWan))), true)
    assert.equal(event.txFeeRatio, storemanTxFeeRatio)
  })

  it('[StoremanGroupDelegate_storemanGroupRegisterByDelegate] should fail in case duplicate register', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Duplicate register')
  })

  // smgApplyUnregisterByDelegate
  it('[StoremanGroupDelegate_smgApplyUnregisterByDelegate] should fail in case halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.smgApplyUnregisterByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_smgApplyUnregisterByDelegate] should fail in case invoked by not initiator', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.smgApplyUnregisterByDelegate(eosToken.origAddr, storeman, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupDelegate_smgApplyUnregisterByDelegate] should success', async () => {
    let result = {};
    try {
      result = await smgSC.smgApplyUnregisterByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    // assert.equal(event.applyTime, 0)
  })

  it('[StoremanGroupDelegate_smgApplyUnregisterByDelegate] should fail in case duplicate unregister', async () => {
    let result = {};
    try {
      await smgSC.smgApplyUnregisterByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Duplicate unregister')
  })

  // smgWithdrawDepositByDelegate
  it('[StoremanGroupDelegate_smgWithdrawDepositByDelegate] should fail in case halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_smgWithdrawDepositByDelegate] should fail in case invoked by not initiator', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: someone});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })
 
  it('[StoremanGroupDelegate_smgWithdrawDepositByDelegate] should fail in case in delay time', async () => {
    let result = {};
    try {
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Must wait until delay time')
  })

  it('[StoremanGroupDelegate_smgWithdrawDepositByDelegate] should success', async () => {
    let result = {};
    try {
      await sleep(eosToken.withdrawDelayTime);
      result = await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    assert.equal(new BN(event.actualReturn.toString()).lte(new BN(storemanDeposit.toString())), true)
    assert.equal(event.deposit, storemanDeposit)
  })

  it('[StoremanGroupDelegate_smgWithdrawDepositByDelegate] should fail in case duplicate withdraw', async () => {
    let result = {};
    try {
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator') // dunplicate withdraw
  })

  // smgAppendDepositByDelegate
  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should fail in case halted', async () => {
    let result = {};
    try {
      await smgSC.setHalt(true, {from: owner});
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Smart contract is halted')
  })

  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should fail in case invalid tokenOrigAccount', async () => {
    let result = {};
    try {
      await smgSC.setHalt(false, {from: owner});
      await smgSC.smgAppendDepositByDelegate('0x', storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Account is null')
  })

  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should fail in case invalid storeman group pk', async () => {
    let result = {};
    try {
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, '0x', {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'PK is null')
  })

  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should fail in case not registered', async () => {
    let result = {};
    try {
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Not registered')
  })

  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should fail in case invoked by not initiator', async () => {
    let result = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: someone, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should fail in case invoked value too small', async () => {
    let result = {};
    try {
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: delegate, value: 0});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, 'Value too small')
  })

  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should success', async () => {
    let result = {};
    try {
      result = await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      result = e;
    }
    assert.equal(result.reason, undefined)
    let event = result.logs[0].args;
    assert.equal(event.tokenOrigAccount, eosToken.origAddr)
    assert.equal(event.storemanGroup, storeman)
    assert.equal(event.wanDeposit, storemanDeposit)
    assert.equal(event.quota.eq(eosToken.quota.mul(new BN(storemanDepositWan))), true)
  })

  it('[StoremanGroupDelegate_smgAppendDepositByDelegate] should fail in case unsupported function', async () => {
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



