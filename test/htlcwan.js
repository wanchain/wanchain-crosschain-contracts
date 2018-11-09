require('truffle-test-utils').init()
const colors = require('colors/safe')
const web3 = global.web3
const BigNumber = require('bignumber.js')
const StoremanGroupAdmin = artifacts.require('./StoremanGroupAdmin.sol')
const TokenManager = artifacts.require('./TokenManager.sol')
const QuotaLedger = artifacts.require('./QuotaLedger.sol')
const HTLCWAN = artifacts.require('./HTLCWAN.sol')
const WanTokenABI = artifacts.require('./WanToken.sol').abi
const WanToken = web3.eth.contract(WanTokenABI)

// ERC20 compliant token addresses
const testTokenAddr = '0xd87b59aadf86976a2877e3947b364a4f5ac93bd3'
const delphyTokenAddr = '0x6c2adc2073994fb2ccc5032cc2906fa221e9b391'
const augurTokenAddr = '0x1985365e9f78359a9B6AD760e32412f4a445E862'
const gnosisTokenAddr = '0x6810e776880C02933D47DB1b9fc05908e5386b96'

const origHtlc = '0x28edd768b88c7c5ced685d9cee3fc205aa2e225c'
const wanHtlc = '0x28edd768b88c7c5ced685d9cee3fc205aa2e225c'

const HTLCRevokeFeeRatio = 400
const HTLCLockedTime = 60 // in seconds
const storemanTxFeeRatio = 0.0001*10000
const regDeposit = 100
const GasPrice = 180000000000
const minDepositTestToken = web3.toWei(100)
const withdrawDelayTimeUnit = 60 * 60
const withdrawDelayTime4Test = 1

const tokenNameTest = 'WanChain2.x Test Token'
const tokenNameDelphy = 'Delphy Token'
const tokenSymbolTest = 'WCT'
const tokenSymbolDelphy = 'DPY'
const ratioTestToken = 20 * 10000 // 1 eth:20,it need to mul the precise 10000
const ratioDelphyToken = 0.2 * 10000 // 1 eth:20,it need to mul the precise 10000

const bonusRatio = 10
const decimals6 = 6
const decimals8 = 8
const decimals18 = 18
const DEFAULT_BONUS_PERIOD_BLOCKS = 6 * 60 * 24
const DEFAULT_BONUS_RATIO_FOR_DEPOSIT = 20
const testBonusPeriodBlocks = 1

const transferAmount = 1
const quotaLockUnit = 1

const MIN_DEPOSIT = web3.toWei(10)
const MIN_WITHDRAW_WINDOW = 3600 * 72

const emptyAddress = '0x0000000000000000000000000000000000000000';

const x1 = '0x0000000000000000000000000000000000000000000000000000000000000001'
const xHash1 = '0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6'

const x2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
const xHash2 = '0x405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace'

const x3 = '0x0000000000000000000000000000000000000000000000000000000000000003'
const xHash3 = '0xc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b'

const x4 = '0x0000000000000000000000000000000000000000000000000000000000000004'
const xHash4 = '0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b'

const x5 = '0x0000000000000000000000000000000000000000000000000000000000000005'
const xHash5 = '0x036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db0'

const x6 = '0x0000000000000000000000000000000000000000000000000000000000000006'
const xHash6 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f'

const x7 = '0x0000000000000000000000000000000000000000000000000000000000000007'
const xHash7 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f'

const x8 = '0x0000000000000000000000000000000000000000000000000000000000000008'
const xHash8 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f'

const x9 = '0x0000000000000000000000000000000000000000000000000000000000000009'
const xHash9 = '0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f'

let storemanGroupAdminInstance,
  storemanGroupAdminInstanceAddress,
  tokenManagerInstance,
  tokenManagerInstanceAddress,
  quotaLedgerInstance,
  quotaLedgerInstanceAddress,
  HTLCWANInstance,
  HTLCWANInstanceAddress,
  DEFAULT_PRECISE,
  candidateInfo,
  tokenInfo,
  testTokenMirrorInstance,
  testTokenMirrorInstanceAddress,
  storemanGroupInfo,
  quota,
  quotaInfo,
  ret,
  beforeTokenBalance,
  afterTokenBalance,
  beforeReceiverBalance,
  afterReceiverBalance,
  blockNumber,
  penalty,
  refundFee,
  revokeFee

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function setHalt(contract, state, operator) {
    await contract.setHalt(state, {from: operator})
    assert.equal(await contract.halted(), state)
}

async function setLockedTime(lockedTime, operator) {
  await HTLCWANInstance.setLockedTime(lockedTime, {from: operator})
  assert.equal(await HTLCWANInstance.lockedTime(), lockedTime)
  console.log(colors.green('[INFO] HTLCETH\'s lock time: ', lockedTime + ' seconds'))
}

async function getBalance(account, contract) {  
  if (arguments.length == 1) {
    return await web3.eth.getBalance(account)
  }
    return await contract.balanceOf(account)
}

async function approve(token, owner, spender, amount) {
    await token.approve(spender, web3.toWei(amount), {from: owner})
    await sleep(60 * 1000)
    assert.equal((await token.allowance(owner, spender)).toNumber(), web3.toWei(amount))
}

async function getTokenInfo(addr) {
  let key = await tokenManagerInstance.mapKey(addr)
  return await tokenManagerInstance.mapTokenInfo(key)
}

async function getQuotaInfo(tokenAddr, storemanGroup) {
  return await quotaLedgerInstance.queryStoremanGroupQuota(tokenAddr, storemanGroup)
}

function manCalBonus(startBlk, endBlk, bonusPeriodInBlks, deposit, bonusRatio, precise) {
  let bonus
  bonus = deposit*bonusRatio*(endBlk-startBlk)/bonusPeriodInBlks/precise
  return parseInt(web3.toWei(bonus))
  // parseInt(web3.toWei(regDeposit*bonusRatio*(ret.receipt.blockNumber-startBonusBlockNumber)/testBonusPeriodBlocks/DEFAULT_PRECISE))
}

function manCalPenalty(deposit, rate) {
  return web3.toWei(deposit*rate/100)
}

function manCalQuota(deposit, precise, ratio, decNumerator, decDenominator) {
  let x = new BigNumber(10)
  let quota = (x.exponentiatedBy(decNumerator)).dividedBy(x.exponentiatedBy(decDenominator)).dividedBy(ratio).multipliedBy(precise).multipliedBy(parseInt(web3.toWei(deposit)))
  return quota.toNumber()
}

function manCalRefundFee(val, precise) {
  let x = new BigNumber(val)
  return x.multipliedBy(storemanTxFeeRatio).multipliedBy(ratioTestToken).dividedBy(precise).dividedBy(precise)
}

function manCalRevokeFee(base, ratio, precise) {
  return base.multipliedBy(ratio).dividedBy(precise)
}

contract('HTLCWAN_UNITs', async ([owner, storemanGroupETH, storemanGroupWAN, storemanGroupWANByDelegate, storemanGroupNotWL, sender, recipient]) => {
  before('should do all preparations', async () => {
    // unlock accounts
    // await web3.personal.unlockAccount(owner, 'wanglu', 99999)
    // await web3.personal.unlockAccount(storemanGroupETH, 'wanglu', 99999)
    // await web3.personal.unlockAccount(storemanGroupWAN, 'wanglu', 99999)
    // await web3.personal.unlockAccount(storemanGroupWANByDelegate, 'wanglu', 99999)
    // await web3.personal.unlockAccount(storemanGroupNotWL, 'wanglu', 99999)
    // await web3.personal.unlockAccount(sender, 'wanglu', 99999)
    // await web3.personal.unlockAccount(recipient, 'wanglu', 99999)

    console.log(colors.green('[INFO] owner: ', owner))
    console.log(colors.green('[INFO] storemanGroupWAN: ', storemanGroupWAN))
    console.log(colors.green('[INFO] storemanGroupWANByDelegate: ', storemanGroupWANByDelegate))

    // deploy token manager
      tokenManagerInstance = await TokenManager.new({from: owner})
    tokenManagerInstanceAddress = tokenManagerInstance.address
    console.log(colors.green('[INFO] tokenManagerInstanceAddress: ', tokenManagerInstanceAddress))
    assert.equal(await tokenManagerInstance.halted(), true)

    // deploy quota ledger 
    quotaLedgerInstance = await QuotaLedger.new({from: owner})
    quotaLedgerInstanceAddress = quotaLedgerInstance.address
    console.log(colors.green('[INFO] quotaLedgerInstanceAddress: ', quotaLedgerInstanceAddress))
    assert.equal(await quotaLedgerInstance.halted(), true)

    // deploy storemanGroup admin
    storemanGroupAdminInstance = await StoremanGroupAdmin.new({from: owner})
    storemanGroupAdminInstanceAddress = storemanGroupAdminInstance.address
    assert.equal(await storemanGroupAdminInstance.halted(), true)

    // deploy HTLCWAN contract
    HTLCWANInstance = await HTLCWAN.new({from: owner})
    assert.equal(await HTLCWANInstance.halted(), true)
    HTLCWANInstanceAddress = HTLCWANInstance.address
    console.log(colors.green('[INFO] HTLCWANInstanceAddress: ', HTLCWANInstanceAddress))

    // set dependencies among these contracts
    await quotaLedgerInstance.setTokenManager(tokenManagerInstanceAddress, {from: owner})
    await quotaLedgerInstance.setStoremanGroupAdmin(storemanGroupAdminInstanceAddress, {from: owner})
    await quotaLedgerInstance.setHTLCWAN(HTLCWANInstanceAddress, {from: owner})
    assert.equal(await quotaLedgerInstance.tokenManager(), tokenManagerInstanceAddress)
    assert.equal(await quotaLedgerInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)
    assert.equal(await quotaLedgerInstance.HTLCWAN(), HTLCWANInstanceAddress)

    await tokenManagerInstance.injectDependencies(storemanGroupAdminInstanceAddress, quotaLedgerInstanceAddress, origHtlc, wanHtlc, {from: owner})
    assert.equal(await tokenManagerInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)
    assert.equal(await tokenManagerInstance.quotaLedger(), quotaLedgerInstanceAddress)
    assert.equal(await tokenManagerInstance.origHtlc(), origHtlc)
    assert.equal(await tokenManagerInstance.wanHtlc(), wanHtlc)
    console.log(colors.green('[INFO] origHtlc: ', origHtlc))
    console.log(colors.green('[INFO] wanHtlc: ', wanHtlc))

    await storemanGroupAdminInstance.injectDependencies(tokenManagerInstanceAddress, quotaLedgerInstanceAddress, {from: owner})
    assert.equal(await storemanGroupAdminInstance.tokenManager(), tokenManagerInstanceAddress)
    assert.equal(await storemanGroupAdminInstance.quotaLedger(), quotaLedgerInstanceAddress)
    assert.equal(await storemanGroupAdminInstance.halted(), true)

    DEFAULT_PRECISE = (await tokenManagerInstance.DEFAULT_PRECISE()).toNumber()
    console.log(colors.green('[INFO] DEFAULT_PRECISE: ', DEFAULT_PRECISE))

    await HTLCWANInstance.setQuotaLedger(quotaLedgerInstanceAddress, {from: owner})
    await HTLCWANInstance.setTokenManager(tokenManagerInstanceAddress, {from: owner})
    await HTLCWANInstance.setStoremanGroupAdmin(storemanGroupAdminInstanceAddress, {from: owner})
    await HTLCWANInstance.setLockedTime(HTLCLockedTime, {from: owner})
    await HTLCWANInstance.setRevokeFeeRatio(HTLCRevokeFeeRatio, {from: owner})
    assert.equal(await HTLCWANInstance.quotaLedger(), quotaLedgerInstanceAddress)
    assert.equal(await HTLCWANInstance.tokenManager(), tokenManagerInstanceAddress)
    assert.equal(await HTLCWANInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)
    assert.equal(await HTLCWANInstance.lockedTime(), HTLCLockedTime)
    assert.equal((await HTLCWANInstance.revokeFeeRatio()).toNumber(), HTLCRevokeFeeRatio)

    await setHalt(tokenManagerInstance, false, owner)
    await setHalt(quotaLedgerInstance, false, owner)
    await setHalt(storemanGroupAdminInstance, false, owner)
    await setHalt(HTLCWANInstance, false, owner)

    // register testToken and its storeman group
    ret = await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(100), withdrawDelayTimeUnit*100, tokenNameTest, tokenSymbolTest, decimals18, {from: owner})

    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        ratio: ratioTestToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*100,
        name: web3.fromAscii(tokenNameTest),
        symbol: web3.fromAscii(tokenSymbolTest),
        decimals: decimals18
      }
    })
    ret = await tokenManagerInstance.addToken(testTokenAddr, {from: sender})
    tokenInfo = await getTokenInfo(testTokenAddr)
      testTokenMirrorInstanceAddress = tokenInfo[1].toString()
      testTokenMirrorInstance = WanToken.at(testTokenMirrorInstanceAddress)
      console.log(colors.green('[INFO] TestTokenMirrorAddress: ', testTokenMirrorInstanceAddress))
    assert.web3Event(ret, {
      event: 'TokenAddedLogger',
      args: {
        tokenOrigAddr: testTokenAddr, 
        tokenWanAddr: testTokenMirrorInstanceAddress,
        ratio: tokenInfo[2].toNumber(),
        minDeposit: tokenInfo[3].toNumber(),
        origHtlc: origHtlc,
        wanHtlc: wanHtlc,
        withdrawDelayTime: withdrawDelayTimeUnit*100,
        tokenHash: '0x8a75d6e3698badaa16d108e1654cbbedad272b0d5f0b71350734131d5bb0af23'
      }
    })

    // register delphyToken
    ret = await tokenManagerInstance.addCandidate(delphyTokenAddr, ratioDelphyToken, web3.toWei(100), withdrawDelayTimeUnit*100, tokenNameDelphy, tokenSymbolDelphy, decimals8, {from: owner})
    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: delphyTokenAddr,
        ratio: ratioDelphyToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*100,
        name: web3.fromAscii(tokenNameDelphy),
        symbol: web3.fromAscii(tokenSymbolDelphy),
        decimals: decimals8
      }
    })
    ret = await tokenManagerInstance.addToken(delphyTokenAddr, {from: sender})
    // disable token registration whitelist
    await setHalt(tokenManagerInstance, true, owner)
    ret = await tokenManagerInstance.setSmgEnableUserWhiteList(testTokenAddr, false, {from: owner})
    ret = await tokenManagerInstance.setSmgEnableUserWhiteList(delphyTokenAddr, false, {from: owner})
    await setHalt(tokenManagerInstance, false, owner)
    tokenInfo = await getTokenInfo(testTokenAddr)
    assert.equal(tokenInfo[5], false)
    tokenInfo = await getTokenInfo(delphyTokenAddr)
    assert.equal(tokenInfo[5], false)

    // register storeman group for test token
    ret = await storemanGroupAdminInstance.storemanGroupRegister(testTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupWAN, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    quota = manCalQuota(regDeposit, DEFAULT_PRECISE, ratioTestToken, decimals18, decimals18) 
    console.log(colors.green('[INFO] quota of 100 wan coin: ', web3.fromWei(quota)))
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWAN,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(regDeposit)),
        quota: quota,
        txFeeRatio: storemanTxFeeRatio
      }
    })
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWAN), false)
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWAN)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), emptyAddress)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)
  })

  /**
     *
     * inboundLock tests
     *
     **/
  it('[HTLCWAN_inboundLock] should throw an exception in case Tx value field not 0', async () => {
        let retError
        try {
            await HTLCWANInstance.inboundLock(testTokenAddr, xHash1, recipient, web3.toWei(transferAmount), {from: storemanGroupWAN, value: web3.toWei(1)})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundLock] should fail in case contract halted', async () => {
        let retError
        await setHalt(HTLCWANInstance, true, owner)
        try {
            await HTLCWANInstance.inboundLock(testTokenAddr, xHash1, recipient, web3.toWei(transferAmount), {from: storemanGroupWAN})
        } catch (e) {
            retError = e
        }
        await setHalt(HTLCWANInstance, false, owner)
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundLock] should fail in case invoked by an unregistered storeman group', async () => {
        let retError
        try {
            await HTLCWANInstance.inboundLock(testTokenAddr, xHash1, recipient, web3.toWei(transferAmount), {from: storemanGroupWANByDelegate})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundLock] should fail in case token not supported', async () => {
        let retError
        try {
            await HTLCWANInstance.inboundLock(gnosisTokenAddr, xHash1, recipient, web3.toWei(transferAmount), {from: storemanGroupWAN})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundLock] should fail in case meaningless value provided', async () => {
        let retError
        try {
            await HTLCWANInstance.inboundLock(testTokenAddr, xHash1, recipient, web3.toWei(0), {from: storemanGroupWAN})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundLock] should inbound lock smoothly', async () => {
      ret = await HTLCWANInstance.inboundLock(testTokenAddr, xHash1, recipient, web3.toWei(transferAmount), {from: storemanGroupWAN})
        assert.web3Event(ret, {
          event: 'InboundLockLogger',
          args: {
            storemanGroup: storemanGroupWAN,
            wanAddr: recipient,
            xHash: xHash1,
            value: parseInt(web3.toWei(transferAmount)),
            tokenOrigAddr: testTokenAddr
          }
        })
        quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(4))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
    })

    it('[HTLCWAN_inboundLock] should throw an error if xHash is duplicated', async () => {
        let retError
        try {
            await HTLCWANInstance.inboundLock(testTokenAddr, xHash1, recipient, web3.toWei(transferAmount), {from: storemanGroupWAN})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRevoke] should make inboundRevoke fail in case Tx is not timeout', async () => {
        let retError
        try {
            await HTLCWANInstance.inboundRevoke(testTokenAddr, xHash1, {from: storemanGroupWAN})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    /**
     *
     * inboundRefund tests
     *
     **/
    it('[HTLCWAN_inboundRedeem] should throw an exception in case Tx value field not 0', async () => {
      let retError
        try {
            await HTLCWANInstance.inboundRedeem(testTokenAddr, x1, {from: recipient, value: web3.toWei(1)})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRedeem] should throw an exception in case contract is halted', async () => {
      let retError
      await setHalt(HTLCWANInstance, true, owner)
        try {
            await HTLCWANInstance.inboundRedeem(testTokenAddr, x1, {from: recipient})
        } catch (e) {
            retError = e
        }
        await setHalt(HTLCWANInstance, false, owner)
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRedeem] should fail in case xHash doesn\'t exist', async () => {
      let retError
        try {
            await HTLCWANInstance.inboundRedeem(testTokenAddr, x2, {from: recipient})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

  it('[HTLCWAN_inboundRedeem] should fail in case tx sender doesn\'t match', async () => {
      let retError
        try {
            await HTLCWANInstance.inboundRedeem(testTokenAddr, x1, {from: sender})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRedeem] should fail in case tx time out', async () => {
      await sleep((HTLCLockedTime+5)*1000)
      let retError
        try {
            await HTLCWANInstance.inboundRedeem(testTokenAddr, x1, {from: recipient})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRedeem] should refund correctly', async () => {
      // inbound lock
      ret = await HTLCWANInstance.inboundLock(testTokenAddr, xHash2, recipient, web3.toWei(transferAmount*2), {from: storemanGroupWAN})
        assert.web3Event(ret, {
          event: 'InboundLockLogger',
          args: {
            storemanGroup: storemanGroupWAN,
            wanAddr: recipient,
            xHash: xHash2,
            value: parseInt(web3.toWei(transferAmount*2)),
            tokenOrigAddr: testTokenAddr
          }
        })
        quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(3))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
    // inbound refund
    ret = await HTLCWANInstance.inboundRedeem(testTokenAddr, x2, {from: recipient})
    assert.web3Event(ret, {
      event: 'InboundRedeemLogger',
      args: {
        wanAddr: recipient,
        storemanGroup: storemanGroupWAN,
        xHash: xHash2,
        x: x2,
        tokenOrigAddr: testTokenAddr
      }
    })
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(2))
    })

    it('[HTLCWAN_inboundRedeem] should fail in case a duplicated refund operation', async () => {
      let retError
        try {
            await HTLCWANInstance.inboundRedeem(testTokenAddr, x2, {from: recipient})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    /**
     *
     * inboundRevoke tests
     *
     **/
    it('[HTLCWAN_inboundRevoke] should throw an exception in case Tx value field not 0', async () => {
      let retError
      try {
        await HTLCWANInstance.inboundRevoke(testTokenAddr, xHash1, {from: storemanGroupWAN, value: web3.toWei(0.001)})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRevoke] should throw an exception in case contract halted', async () => {
      let retError
      await setHalt(HTLCWANInstance, true, owner)
      try {
        await HTLCWANInstance.inboundRevoke(testTokenAddr, xHash1, {from: storemanGroupWAN})
      } catch (e) {
        retError = e
      }
      await setHalt(HTLCWANInstance, false, owner)
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRevoke] should throw an exception in case xHash doesn\'t exist', async () => {
      let retError
      try {
        await HTLCWANInstance.inboundRevoke(testTokenAddr, xHash3, {from: storemanGroupWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRevoke] should throw an exception in case tx sender doesn\'t match', async () => {
      let retError
      try {
        await HTLCWANInstance.inboundRevoke(testTokenAddr, xHash1, {from: recipient})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRevoke] should throw an exception in case outboundRevoke is invoked in a process of an inbound tx', async () => {
      let retError
      try {
        await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash1, {from: storemanGroupWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_inboundRevoke] should revoke smoothly', async () => {
      ret = await HTLCWANInstance.inboundRevoke(testTokenAddr, xHash1, {from: storemanGroupWAN})
    assert.web3Event(ret, {
      event: 'InboundRevokeLogger',
      args: {
        storemanGroup: storemanGroupWAN,
        xHash: xHash1,
        tokenOrigAddr: testTokenAddr
      }
    })
      quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(3))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(2))
      
    })

    /**
     *
     * outboundLock tests
     *
     **/ 
    it('[HTLCWAN_outboundLock] should throw an exception in case Tx value less than tx fee', async () => {
      refundFee = await manCalRefundFee(web3.toWei(transferAmount), 10000)
      console.log(colors.green('revoke fee for ', web3.toWei(transferAmount), ' test token is ', refundFee.toNumber()))
      await approve(testTokenMirrorInstance, recipient, HTLCWANInstanceAddress, web3.toWei(transferAmount))
      // input value which less than revoke fee calculated
      let value = refundFee.toNumber()*0.99
        let retError 
        try {
            await HTLCWANInstance.outboundLock(testTokenAddr, xHash3, storemanGroupWAN, sender, web3.toWei(transferAmount), {from: recipient, value: value})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundLock] should fail in case contract halted', async () => {
        let retError 
        await setHalt(HTLCWANInstance, true, owner)
        try {
            await HTLCWANInstance.outboundLock(testTokenAddr, xHash3, storemanGroupWAN, sender, web3.toWei(transferAmount), {from: recipient, value: refundFee.toNumber()})
        } catch (e) {
            retError = e
        }
        await setHalt(HTLCWANInstance, false, owner)
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundLock] should fail in case invalid storeman group provided', async () => {
        let retError 
        try {
            await HTLCWANInstance.outboundLock(testTokenAddr, xHash3, storemanGroupNotWL, sender, web3.toWei(transferAmount), {from: recipient, value: refundFee.toNumber()})
        } catch (e) {
            retError = e
        }
        assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundLock] should outbound lock correctly', async () => {
      beforeTokenBalance = await getBalance(HTLCWANInstanceAddress, testTokenMirrorInstance)
      console.log(colors.green('before balance of htlcwan: ', beforeTokenBalance.toNumber()))
      ret = await HTLCWANInstance.outboundLock(testTokenAddr, xHash3, storemanGroupWAN, sender, web3.toWei(transferAmount), {from: recipient, value: refundFee.toNumber()})
        assert.web3Event(ret, {
          event: 'OutboundLockLogger',
          args: {
            wanAddr: recipient,
            storemanGroup: storemanGroupWAN,
            xHash: xHash3,
            value: parseInt(web3.toWei(transferAmount)),
            ethAddr: sender,
            fee: refundFee.toNumber(),
            tokenOrigAddr: testTokenAddr
          }
        })
        afterTokenBalance = await getBalance(HTLCWANInstanceAddress, testTokenMirrorInstance)
        console.log(colors.green('after balance of htlcwan: ', afterTokenBalance.toNumber()))
        assert.equal((beforeTokenBalance.plus(web3.toWei(transferAmount))).toNumber(), afterTokenBalance.toNumber())
    })

    it('[HTLCWAN_outboundLock] should reject an outbound lock with duplicated hashes', async () => {
      await approve(testTokenMirrorInstance, recipient, HTLCWANInstanceAddress, web3.toWei(transferAmount))
      let retError
      try {
        await HTLCWANInstance.outboundLock(testTokenAddr, xHash3, storemanGroupWAN, sender, web3.toWei(transferAmount), {from: recipient, value: refundFee.toNumber()})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundLock] should fail to revoke before timeout', async () => {
      let retError
      try {
        await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash3, {from: recipient })
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    /**
     *
     * outboundRefund tests
     *
     **/
    it('[HTLCWAN_outboundRedeem] should fail in case tx value is not 0', async () => {
      let retError 
      try {
        await HTLCWANInstance.outboundRedeem(testTokenAddr, x3, {from: storemanGroupWAN, value: web3.toWei(0.001)})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRedeem] should fail in case contract halted', async () => {
      let retError 
      await setHalt(HTLCWANInstance, true, owner)
      try {
        await HTLCWANInstance.outboundRedeem(testTokenAddr, x3, {from: storemanGroupWAN})
      } catch (e) {
        retError = e
      }
      await setHalt(HTLCWANInstance, false, owner)
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRedeem] should fail in case xHash does not match', async () => {
      let retError 
      try {
        await HTLCWANInstance.outboundRedeem(testTokenAddr, x4, {from: storemanGroupWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRedeem] should fail in case tx sender does not match', async () => {
      let retError 
      try {
        await HTLCWANInstance.outboundRedeem(testTokenAddr, x3, {from: storemanGroupNotWL})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRedeem] should fail to refund in case timeout', async () => {
      await sleep((2*HTLCLockedTime+10)*1000)
      let retError 
      try {
        await HTLCWANInstance.outboundRedeem(testTokenAddr, x3, {from: storemanGroupWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRedeem] should outbound refund correctly', async () => {
      console.log(colors.green('test token mirror balance: ', (await getBalance(recipient, testTokenMirrorInstance)).toNumber()))
      ret = await HTLCWANInstance.outboundLock(testTokenAddr, xHash4, storemanGroupWAN, sender, web3.toWei(transferAmount), {from: recipient, value: refundFee.toNumber()})
        assert.web3Event(ret, {
          event: 'OutboundLockLogger',
          args: {
            wanAddr: recipient,
            storemanGroup: storemanGroupWAN,
            xHash: xHash4,
            value: parseInt(web3.toWei(transferAmount)),
            ethAddr: sender,
            fee: refundFee.toNumber(),
            tokenOrigAddr: testTokenAddr
          }
        })
        beforeBalance = await getBalance(storemanGroupWAN)
        ret = await HTLCWANInstance.outboundRedeem(testTokenAddr, x4, {from: storemanGroupWAN})
        let gasUsed = new BigNumber(ret.receipt.gasUsed)
        let gasFee = gasUsed.multipliedBy(GasPrice)
        afterBalance = await getBalance(storemanGroupWAN)
        assert.equal((beforeBalance.minus(gasFee).plus(refundFee)).toNumber(), afterBalance.toNumber())
        assert.equal((await testTokenMirrorInstance.totalSupply()).toNumber(), web3.toWei(transferAmount))
        assert.web3Event(ret, {
          event: 'OutboundRedeemLogger',
          args: {
            storemanGroup: storemanGroupWAN,
            wanAddr: recipient,
            xHash: xHash4,
            x: x4,
            tokenOrigAddr: testTokenAddr
          }
        })
    })

    it('[HTLCWAN_outboundRedeem] should fail to make a duplicated refund with same x', async () => {
      let retError
      try {
        await HTLCWANInstance.outboundRedeem(testTokenAddr, x4, {from: storemanGroupWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    /**
     *
     * outboundRevoke tests
     *
     **/
    it('[HTLCWAN_outboundRevoke] should fail in case tx value field is not 0', async () => {
      let retError
      try {
        await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash3, {from: receipt, value: web3.toWei(0.0001)})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRevoke] should fail in case contract halted', async () => {
      let retError
      await setHalt(HTLCWANInstance, true, owner)
      try {
        await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash3, {from: receipt})
      } catch (e) {
        retError = e
      }
      await setHalt(HTLCWANInstance, false, owner)
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRevoke] should fail in case xHash does not exist', async () => {
      let retError
      try {
        await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash5, {from: receipt})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRevoke] should fail in case invalid tx sender', async () => {
      let retError
      try {
        await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash3, {from: owner})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRevoke] should throw an error if inboundRevoke is invoked in an outbound Tx', async () => {
      let retError
      try {
        await HTLCWANInstance.inboundRevoke(testTokenAddr, xHash3, {from: receipt})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCWAN_outboundRevoke] should revoke successfully', async () => {
      let userActual, smgActual, beforeSMGBalance, afterSMGBalance, gasUsed, gasFee
      beforeBalance = await getBalance(recipient)
      beforeSMGBalance = await getBalance(storemanGroupWAN)
      revokeFee = manCalRevokeFee(refundFee, HTLCRevokeFeeRatio, DEFAULT_PRECISE)
      ret = await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash3, {from: recipient})
      afterBalance = await getBalance(recipient)
      afterSMGBalance = await getBalance(storemanGroupWAN)
      gasUsed = new BigNumber(ret.receipt.gasUsed)
        gasFee = gasUsed.multipliedBy(GasPrice)
      assert.web3Event(ret, {
        event: 'OutboundRevokeLogger',
        args: {
          wanAddr: recipient,
          xHash: xHash3,
          tokenOrigAddr: testTokenAddr
        }
      })
      userActual = (beforeBalance.plus(refundFee.minus(revokeFee))).minus(gasFee)
      smgActual = beforeSMGBalance.plus(revokeFee)
      // console.log(colors.green('revokeFee: ', revokeFee.toNumber()))
      // console.log(colors.green('userExpected: ', afterBalance.toNumber()))
      // console.log(colors.green('smgExpected: ', afterSMGBalance.toNumber()))
      // console.log(colors.green('userActual: ', userActual.toNumber()))
      // console.log(colors.green('smgActual: ', smgActual.toNumber()))

      assert.equal(userActual.toNumber(), afterBalance.toNumber())
      assert.equal(smgActual.toNumber(), afterSMGBalance.toNumber())
    })

    it('[HTLCWAN_outboundRevoke] should fail in case a duplicated revoke', async () => {
      let retError
      try {
        await HTLCWANInstance.outboundRevoke(testTokenAddr, xHash3, {from: recipient})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
    })

    it('[HTLCETH_kill] should fail to kill the contract by no contract owner', async () => {
        let killError
        await setHalt(HTLCWANInstance, true, owner)
        try {
            await HTLCWANInstance.kill({from: sender})
        } catch (e) {
            killError = e
        }
        await setHalt(HTLCWANInstance, false, owner)
        assert.notEqual(killError, undefined)
    })

    it('[HTLCETH_kill] should kill the contract correctly', async () => {
        await setHalt(HTLCWANInstance, true, owner)

        ret = await HTLCWANInstance.kill({from: owner})
        assert.equal(ret.receipt.status, '0x1')

        ret = await web3.eth.getCode(HTLCWANInstanceAddress)
        assert.equal(ret, '0x')
    })
})

