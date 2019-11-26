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
const storemanDeposit = web3.utils.toWei('10');
const storeman = '0x042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c341619'; 

// token
const eosAccount = new crossChainAccount("eos", "ascii");

const eosToken = {
  origAddr: eosAccount.encodeAccount('eosio.token:EOS'),
  ratio: 2,
  minDeposit: web3.utils.toWei('10'),
  withdrawDelayTime: 60 * 60 * 72,
  name: encoder.str2hex('Wanchain EOS Crosschain Token'),
  symbol: encoder.str2hex('EOS'),
  decimals: 4
}

let tmSc, weosSc, smgSC, htlcSc, qlSc;

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

contract('StoremanGroupAdmin_UNITs', async ([owner, delegate, someone]) => {
  it('should do all preparations', async () => {
    // register eos token
    let tmProxy = await TokenManagerProxy.deployed();
    tmSc = await TokenManagerDelegate.at(tmProxy.address);
    await tmSc.addToken(eosToken.origAddr, eosToken.ratio, eosToken.minDeposit, eosToken.withdrawDelayTime, eosToken.name, eosToken.symbol, eosToken.decimals);
    let eosTokenInfo = await tmSc.getTokenInfo(eosToken.origAddr);
    weosSc = await WanToken.at(eosTokenInfo[3]);

    // register storeman
    let smgProxy = await StoremanGroupProxy.deployed();
    smgSC = await StoremanGroupDelegate.at(smgProxy.address);    
    // await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {value: storemanDeposit});

    // other sc
    let htlcProxy = await HTLCProxy.deployed();
    htlcSc = await HTLCDelegate.at(htlcProxy.address);
    qlSc = htlcSc; // quotaLedger act as a lib of htlc
  })

  // setDependence
  it('[StoremanGroupAdmin_setDependence] should fail in case invoked by not owner', async () => {
    let error = {};
    try {
      await smgSC.setDependence(tmSc.address, qlSc.address, {from: someone});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Not owner');
  })

  it('[StoremanGroupAdmin_setDependence] should fail in case invalide tokenManager address', async () => {
    let error = {};
    try {
      await smgSC.setDependence(ADDRESS_0, qlSc.address, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Invalide tokenManager address');
  })
  
  it('[StoremanGroupAdmin_setDependence] should fail in case invalide htlc address', async () => {
    let error = {};
    try {
      await smgSC.setDependence(tmSc.address, ADDRESS_0, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Invalide htlc address');
  })

  it('[StoremanGroupAdmin_setDependence] should success', async () => {
    let error = {};
    try {
      await smgSC.setDependence(tmSc.address, qlSc.address, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined);
  })  

  // enableSmgWhiteList
  it('[StoremanGroupAdmin_enableSmgWhiteList] should fail in case invoked by not owner', async () => {
    let error = {};
    try {
      await smgSC.enableSmgWhiteList(true, {from: someone});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Not owner');
  })

  it('[StoremanGroupAdmin_enableSmgWhiteList] should success', async () => {
    let error = {};
    try {
      await smgSC.enableSmgWhiteList(true, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined);
    let status = await smgSC.isWhiteListEnabled.call();
    assert.equal(status, true);
  })  

  // setSmgWhiteList
  it('[StoremanGroupAdmin_setSmgWhiteList] should fail in case invoked by not owner', async () => {
    let error = {};
    try {
      await smgSC.setSmgWhiteList(storeman, true, {from: someone});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Not owner');
  })

  it('[StoremanGroupAdmin_setSmgWhiteList] should fail in case invalid storeman group pk', async () => {
    let error = {};
    try {
      await smgSC.setSmgWhiteList('0x', true, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'PK is null')
  })

  it('[StoremanGroupAdmin_setSmgWhiteList_true] should success', async () => {
    let error = {};
    try {
      await smgSC.setSmgWhiteList(storeman, true, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined);
  })

  it('[StoremanGroupAdmin_setSmgWhiteList_false] should success', async () => {
    let error = {};
    try {
      await smgSC.setSmgWhiteList(storeman, false, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined);
  })
  
  it('[StoremanGroupAdmin_setSmgWhiteList_false_duplicate] should fail in case duplicate set', async () => {
    let error = {};
    try {
      await smgSC.setSmgWhiteList(storeman, false, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Duplicate set');
  })

  it('[StoremanGroupAdmin_setSmgWhiteList] should fail in case WhiteList is disable', async () => {
    let error = {};
    try {
      await smgSC.enableSmgWhiteList(false, {from: owner});
      await smgSC.setSmgWhiteList(storeman, true, {from: owner});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'White list is disabled');
  })

  // storemanGroupRegisterByDelegate
  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case invalid tokenOrigAccount', async () => {
    let error = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate('0x', storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Account is null')
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case invalid storeman group pk', async () => {
    let error = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, '0x', storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'PK is null')
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case invalid txFeeRatio', async () => {
    let error = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, 0, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Invalid txFeeRatio')
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case register non-exist token', async () => {
    let error = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate('0x00', storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Token not exist')
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case deposit less than minDeposit', async () => {
    let error = {};
    try {
      const deposit = new BN(storemanDeposit).sub(new BN(1));
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: deposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Value must be greater than minDeposit')
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case not in white list', async () => {
    let error = {};
    try {
      await smgSC.enableSmgWhiteList(true, {from: owner});
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Not in white list')
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should success', async () => {
    let error = {};
    try {
      await smgSC.setSmgWhiteList(storeman, true, {from: owner});
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined)
  })  

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case duplicate register', async () => {
    let error = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Duplicate register')
  })

  // smgApplyUnregisterByDelegate
  it('[StoremanGroupAdmin_smgApplyUnregisterByDelegate] should fail in case invoked by not initiator', async () => {
    let error = {};
    try {
      await smgSC.smgApplyUnregisterByDelegate(eosToken.origAddr, storeman, {from: someone});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupAdmin_smgApplyUnregisterByDelegate] should success', async () => {
    let error = {};
    try {
      await smgSC.smgApplyUnregisterByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined)
  })

  it('[StoremanGroupAdmin_smgApplyUnregisterByDelegate] should fail in case duplicate unregister', async () => {
    let error = {};
    try {
      await smgSC.smgApplyUnregisterByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Duplicate unregister')
  })

  // smgWithdrawDepositByDelegate
  it('[StoremanGroupAdmin_smgWithdrawDepositByDelegate] should fail in case invoked by not initiator', async () => {
    let error = {};
    try {
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: someone});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Sender must be initiator')
  })
 
  it('[StoremanGroupAdmin_smgWithdrawDepositByDelegate] should fail in case in delay time', async () => {
    let error = {};
    try {
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Must wait until delay time')
  })

  it('[StoremanGroupAdmin_smgWithdrawDepositByDelegate] should success', async () => {
    let error = {};
    try {
      const withdrawDelayTime = 10; // seconds
      await tmSc.updateToken(eosToken.origAddr, eosToken.ratio, eosToken.minDeposit, withdrawDelayTime, 
                             eosToken.name, eosToken.symbol, eosToken.decimals, weosSc.address,
                             {from: owner});
      await sleep(withdrawDelayTime + 2);
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined)
  })

  it('[StoremanGroupAdmin_smgWithdrawDepositByDelegate] should fail in case duplicate withdraw', async () => {
    let error = {};
    try {
      await smgSC.smgWithdrawDepositByDelegate(eosToken.origAddr, storeman, {from: delegate});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Sender must be initiator') // dunplicate withdraw
  })

  // smgAppendDepositByDelegate
  it('[StoremanGroupAdmin_smgAppendDepositByDelegate] should fail in case invalid tokenOrigAccount', async () => {
    let error = {};
    try {
      await smgSC.smgAppendDepositByDelegate('0x', storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Account is null')
  })

  it('[StoremanGroupAdmin_smgAppendDepositByDelegate] should fail in case invalid storeman group pk', async () => {
    let error = {};
    try {
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, '0x', {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'PK is null')
  })

  it('[StoremanGroupAdmin_smgAppendDepositByDelegate] should fail in case not registered', async () => {
    let error = {};
    try {
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Not registered')
  })

  it('[StoremanGroupAdmin_smgAppendDepositByDelegate] should fail in case invoked by not initiator', async () => {
    let error = {};
    try {
      await smgSC.storemanGroupRegisterByDelegate(eosToken.origAddr, storeman, storemanTxFeeRatio, {from: delegate, value: storemanDeposit});
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: someone, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, 'Sender must be initiator')
  })

  it('[StoremanGroupAdmin_smgAppendDepositByDelegate] should success', async () => {
    let error = {};
    try {
      await smgSC.smgAppendDepositByDelegate(eosToken.origAddr, storeman, {from: delegate, value: storemanDeposit});
    } catch (e) {
      error = e;
    }
    assert.equal(error.reason, undefined)
  })

  
})



