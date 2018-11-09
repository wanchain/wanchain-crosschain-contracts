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

const storemanTxFeeRatio = 1
const regDeposit = 100
const GasPrice = 180000000000
const minDepositTestToken = web3.toWei(100)
const withdrawDelayTimeUnit = 60 * 60
const withdrawDelayTime4Test = 1

const tokenNameTest = 'WanChain2.x Test Token'
const tokenNameDelphy = 'Delphy Token'
const tokenSymbolTest = 'WCT'
const tokenSymbolDelphy = 'DPY'
const ratioTestToken = 200000 // 1 eth:20,it need to mul the precise 10000
const ratioDelphyToken = 2000 // 1 eth:20,it need to mul the precise 10000

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
  penalty

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

contract('QuotaLedger_UNITs', async ([owner, HTLCWAN, storemanGroupAdmin, storemanGroupETH, storemanGroupWAN, storemanGroupWANByDelegate, storemanGroupNotWL, senderNoUse, sender]) => {
  before('should do all preparations', async () => {

    // unlock accounts
    await web3.personal.unlockAccount(owner, 'wanglu', 99999)
    await web3.personal.unlockAccount(HTLCWAN, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupAdmin, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupETH, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupWAN, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupWANByDelegate, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupNotWL, 'wanglu', 99999)
    await web3.personal.unlockAccount(sender, 'wanglu', 99999)

    console.log(colors.green('[INFO] owner: ', owner))
    console.log(colors.green('[INFO] HTLCWAN: ', HTLCWAN))
    console.log(colors.green('[INFO] storemanGroupAdmin: ', storemanGroupAdmin))
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

    // set dependencies among these contracts
    await quotaLedgerInstance.setTokenManager(tokenManagerInstanceAddress, {from: owner})
    assert.equal(await quotaLedgerInstance.tokenManager(), tokenManagerInstanceAddress)

    await quotaLedgerInstance.setStoremanGroupAdmin(storemanGroupAdmin, {from: owner})
    assert.equal(await quotaLedgerInstance.storemanGroupAdmin(), storemanGroupAdmin)

    await quotaLedgerInstance.setHTLCWAN(HTLCWAN, {from: owner})
    assert.equal(await quotaLedgerInstance.HTLCWAN(), HTLCWAN)

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

    await setHalt(tokenManagerInstance, false, owner)
    await setHalt(quotaLedgerInstance, false, owner)
    await setHalt(storemanGroupAdminInstance, false, owner)

    // register testToken
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
  })

  it('[QuotaLedger_setHalt] should reject no owner to set halt', async () => {
    let unhaltError
      try {
        await setHalt(quotaLedgerInstance, true, sender)
      } catch(e) {
        unhaltError = e
      }
      assert.notEqual(unhaltError, undefined)
  })

  it('[QuotaLedger_setHalt] should allow owner to unhalt contract', async () => {
    await setHalt(quotaLedgerInstance, false, owner)
  })

  /**
     *
     * setStoremanGroupQuota tests
     *
     **/

  it('[QuotaLedger_setStoremanGroupQuota] should disallow no storemanGroupAdmin to set quota', async () => {
    let retError
    try {
      await quotaLedgerInstance.setStoremanGroupQuota(testTokenAddr, storemanGroupWAN, 100, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_setStoremanGroupQuota] should fail in case empty testTokenAddr provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.setStoremanGroupQuota(emptyAddress, storemanGroupWAN, 100, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_setStoremanGroupQuota] should fail in case empty storemanGroup address provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.setStoremanGroupQuota(testTokenAddr, emptyAddress, 100, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_setStoremanGroupQuota] should fail in case meaningless quota value provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.setStoremanGroupQuota(testTokenAddr, storemanGroupWAN, 0, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_setStoremanGroupQuota] should succeed to set storeman group\'s quota', async () => {
    let quota = manCalQuota(regDeposit, DEFAULT_PRECISE, ratioTestToken, decimals18, decimals18)
    console.log(colors.green('[INFO] storemanGroupWAN\'s quota of testToken: ', web3.fromWei(quota)))
    await quotaLedgerInstance.setStoremanGroupQuota(testTokenAddr, storemanGroupWAN, quota, {from: storemanGroupAdmin})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), quota)
    assert.equal(quotaInfo[1].toNumber(), quota)
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
  })

  it('[QuotaLedger_setStoremanGroupQuota] should fail to make a duplicated registration', async () => {
    let retError
    try {
      await quotaLedgerInstance.setStoremanGroupQuota(testTokenAddr, storemanGroupWAN, 1, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_setStoremanGroupQuota] should succeed to set another storeman group\'s quota', async () => {
    let quota = manCalQuota(regDeposit, DEFAULT_PRECISE, ratioTestToken, decimals18, decimals18)
    await quotaLedgerInstance.setStoremanGroupQuota(testTokenAddr, storemanGroupWANByDelegate, quota, {from: storemanGroupAdmin})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWANByDelegate) 
    assert.equal(quotaInfo[0].toNumber(), quota)
    assert.equal(quotaInfo[1].toNumber(), quota)
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
  })

  /**
     *
     * lockQuota tests
     *
     **/
  it('[QuotaLedger_lockQuota] should disallow storeman group to make an inbound corsschain transaction', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, storemanGroupWANByDelegate, 1, {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockQuota] should reject meaningless value', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, sender, 0, {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockQuota] should reject no HTLCWAN to invoke this method', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, sender, 1, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockQuota] should reject a value larger than its quota', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, sender, web3.toWei(5.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockQuota] should reject an invalid storeman group to conduct the transaction', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupNotWL, sender, 1, {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockQuota] should disallow make quota-lock in case contract is halted', async () => {
    await setHalt(quotaLedgerInstance, true, owner)
    let retError
    try {
      await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, sender, 1, {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    await setHalt(quotaLedgerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockQuota] should lock 1 unit of token', async () => {
    await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, sender, web3.toWei(quotaLockUnit), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(4))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
  })

  /**
     *
     * unlockQuota tests
     *
     **/
  it('[QuotaLedger_unlockQuota] should reject unlocking 0 value', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockQuota(testTokenAddr, storemanGroupWAN, 0, {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockQuota] should reject unlocking amount larger than receivable', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockQuota(testTokenAddr, storemanGroupWAN, web3.toWei(1.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockQuota] should reject unlocking given an invalid storeman group', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockQuota(testTokenAddr, storemanGroupNotWL, web3.toWei(0.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockQuota] should reject unlocking given an invalid storeman group and meaningless value', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockQuota(testTokenAddr, storemanGroupNotWL, web3.toWei(1.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockQuota] should reject unlocking given an invalid storeman group, meaningless value and invalid invoker', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockQuota(testTokenAddr, storemanGroupNotWL, web3.toWei(1.01), {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockQuota] should reject unlocking in case contract halted', async () => {
    let retError
    await setHalt(quotaLedgerInstance, true, owner)
    try {
      await quotaLedgerInstance.unlockQuota(testTokenAddr, storemanGroupWAN, web3.toWei(1.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    await setHalt(quotaLedgerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  /**
     *
     * mintToken tests
     *
     **/
  it('[QuotaLedger_mintToken] should disallow no HTLCWAN to mint token', async () => {
    let retError
    try {
      await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_mintToken] should fail to mint token in case contract halted', async () => {
    let retError
    await setHalt(quotaLedgerInstance, true, owner)
    try {
      await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    await setHalt(quotaLedgerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_mintToken] should fail to mint token in case invalid storeman group provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupNotWL, sender, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_mintToken] should fail to mint token in case invalid recipient provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, storemanGroupWANByDelegate, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_mintToken] should fail to mint 0 token', async () => {
    let retError
    try {
      await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(0), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_mintToken] should fail to mint an amount larger than receivable', async () => {
    let retError
    try {
      await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_mintToken] should mint token smoothly', async () => {
    await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(4))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(1))
    assert.equal((await testTokenMirrorInstance.totalSupply()).toNumber(), web3.toWei(1))
    assert.equal((await testTokenMirrorInstance.balanceOf(sender)).toNumber(), web3.toWei(1))
  })

  /**
     *
     * lockToken tests
     *
     **/
  it('[QuotaLedger_lockToken] should fail to lock token with an invalid storemanGroup provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWANByDelegate, sender, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockToken] should fail in case invoked by no HTLCWAN', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockToken] should fail in case value is 0', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, sender, 0, {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockToken] should fail to lock token with a storemanGroup who doesn\'t have enough quota', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWANByDelegate, sender, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockToken] should disallow a storemanGroup to make an outbound transaction', async () => {
    let retError
    try {
      await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, storemanGroupWANByDelegate, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockToken] should fail in case contract is halted', async () => {
    let retError
    await setHalt(quotaLedgerInstance, true, owner)
    try {
      await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    await setHalt(quotaLedgerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockToken] should succeed to lock token', async () => {
    await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(4))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(1))
  })

  /**
     *
     * unlockToken tests
     *
     **/
  it('[QuotaLedger_unlockToken] should fail in case contract halted', async () => {
    let retError
    await setHalt(quotaLedgerInstance, true, owner)
    try {
      await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    await setHalt(quotaLedgerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should disallow no HTLCWAN to unlock token', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail in case value provide is 0', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWAN, web3.toWei(0), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail in case provided value larger than payable value', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWAN, web3.toWei(1.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail in case unregistered storeman group provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupNotWL, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail in case given storeman group does not have enough quota', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWANByDelegate, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail in case given improper params', async () => {
    let retError
    try {
      await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWANByDelegate, web3.toWei(0), {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should succeed to unlock token of given value', async () => {
    await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(4))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(1))
  })

  /**
     *
     * burnToken tests
     *
     **/
  it('[QuotaLedger_unlockToken] should fail in case contract halted', async () => {
    // outbound lock first
    await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: HTLCWAN})
    assert.equal((await testTokenMirrorInstance.balanceOf(sender)).toNumber(), web3.toWei(1))
    await testTokenMirrorInstance.transfer(HTLCWAN, web3.toWei(1), {from: sender})
    await sleep(60*2*1000)
    assert.equal((await testTokenMirrorInstance.balanceOf(sender)).toNumber(), web3.toWei(0))
    assert.equal((await testTokenMirrorInstance.balanceOf(HTLCWAN)).toNumber(), web3.toWei(1))
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(4))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(1))

    let retError
    await setHalt(quotaLedgerInstance, true, owner)
    try {
      await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    await setHalt(quotaLedgerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should disallow no HTLCWAN to invoke this method', async () => {
    let retError
    try {
      await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail to burn 0 token', async () => {
    let retError
    try {
      await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupWAN, web3.toWei(0), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })  

  it('[QuotaLedger_unlockToken] should fail to burn an amount larger than its payable', async () => {
    let retError
    try {
      await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupWAN, web3.toWei(1.01), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail to burn with a storeman group without payable quota', async () => {
    let retError
    try {
      await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupWANByDelegate, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unlockToken] should fail to burn with an invalid storeman group specified', async () => {
    let retError
    try {
      await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupNotWL, web3.toWei(1), {from: HTLCWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })  

  it('[QuotaLedger_unlockToken] should fail to burn with improper params provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.burnToken(sender, storemanGroupNotWL, web3.toWei(1.01), {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })  

  it('[QuotaLedger_unlockToken] should burn token successfully', async () => {
    await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
    assert.equal((await testTokenMirrorInstance.totalSupply()).toNumber(), web3.toWei(0))
  })

  /**
     *
     * storemanGroup unregistration tests
     *
     **/
  it('[QuotaLedger_applyUnregistration] should reject no storemanGroupAdmin to call the function', async () => {
    let retError
      try {
        await quotaLedgerInstance.applyUnregistration(testTokenAddr, storemanGroupWAN, {from: owner})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should fail to invoke this method in case contract halted', async () => {
    let retError
    await setHalt(quotaLedgerInstance, true, owner)
      try {
        await quotaLedgerInstance.applyUnregistration(testTokenAddr, storemanGroupWAN, {from: storemanGroupAdmin})
      } catch (e) {
        retError = e
      }
      await setHalt(quotaLedgerInstance, false, owner)
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should reject an ordinary account to apply unregistration', async () => {
    let retError
      try {
        await quotaLedgerInstance.applyUnregistration(testTokenAddr, sender, {from: storemanGroupAdmin})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should apply unregistration successfully', async () => {
    // lock quota 
    await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, sender, web3.toWei(quotaLockUnit*5), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), 0)
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
    // mint token
    await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(3), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), 0)
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(3))
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(3))
    assert.equal((await testTokenMirrorInstance.totalSupply()).toNumber(), web3.toWei(3))
    assert.equal((await testTokenMirrorInstance.balanceOf(sender)).toNumber(), web3.toWei(3))
    // lock token
    await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(2), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), 0)
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[4].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(3))

    assert.equal(await quotaLedgerInstance.isActiveStoremanGroup(testTokenAddr, storemanGroupWAN), true)
    await quotaLedgerInstance.applyUnregistration(testTokenAddr, storemanGroupWAN, {from: storemanGroupAdmin})
    assert.equal(await quotaLedgerInstance.isStoremanGroup(testTokenAddr, storemanGroupWAN), true)
    assert.equal(await quotaLedgerInstance.isActiveStoremanGroup(testTokenAddr, storemanGroupWAN), false)
  })

  it('[QuotaLedger_applyUnregistration] should reject a duplicated unregistration application', async () => {
    let retError
      try {
        await quotaLedgerInstance.applyUnregistration(testTokenAddr, storemanGroupWAN, {from: storemanGroupAdmin})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should fail lock quota given a storeman group applied unregistration', async () => {
    let retError
      try {
        await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWAN, sender, 0, {from: HTLCWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should be still good to make inbound unlock operation', async () => {
    await quotaLedgerInstance.unlockQuota(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[4].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(3))
  })

  it('[QuotaLedger_lockQuota] should fail to call lockQuota for debt redemption in case having uncleared receivable or payable', async () => {
    let retError
      try {
        await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWANByDelegate, storemanGroupWAN, web3.toWei(3), {from: HTLCWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail to finish unregistration in case having uncleared receivable or payable', async () => {
    let retError
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWAN, true, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should be still good to make mint token operation', async () => {
    await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(4))
  })

  it('[QuotaLedger_lockQuota] should fail to call lockQuota for debt redemption in case having uncleared receivable or payable', async () => {
    let retError
      try {
        await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWANByDelegate, storemanGroupWAN, web3.toWei(3), {from: HTLCWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail to finish unregistration in case having uncleared receivable or payable', async () => {
    let retError
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWAN, true, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should fail to outbound lock token through a storeman group applied unregistration', async () => {
    let retError
      try {
        await quotaLedgerInstance.lockToken(testTokenAddr, storemanGroupWAN, sender, web3.toWei(1), {from: HTLCWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should be still good to make unlock token operation', async () => {
    await quotaLedgerInstance.unlockToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(3))
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(4))
  })

  it('[QuotaLedger_lockQuota] should fail to call lockQuota for debt redemption in case having uncleared receivable or payable', async () => {
    let retError
      try {
        await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWANByDelegate, storemanGroupWAN, web3.toWei(3), {from: HTLCWAN})
      } catch (e) {
        retError = e
      }
      assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail to finish unregistration in case having uncleared receivable or payable', async () => {
    let retError
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWAN, true, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_applyUnregistration] should be still good to make burn token operation', async () => {
    // transfer token to HTLCWAN
    assert.equal((await testTokenMirrorInstance.balanceOf(sender)).toNumber(), web3.toWei(4))
    await testTokenMirrorInstance.transfer(HTLCWAN, web3.toWei(1), {from: sender})
    await sleep(60*2*1000)
    assert.equal((await testTokenMirrorInstance.balanceOf(sender)).toNumber(), web3.toWei(3))
    assert.equal((await testTokenMirrorInstance.balanceOf(HTLCWAN)).toNumber(), web3.toWei(1))
    // make burn operation
    await quotaLedgerInstance.burnToken(testTokenAddr, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(3))
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(3))
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail to finish unregistration in case debt not been paidoff', async () => {
    let retError
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWAN, true, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_lockQuota] should succeed to transfer debt to another storeman group through lock quota inferface', async () => {
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWANByDelegate) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
    await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWANByDelegate, storemanGroupWAN, web3.toWei(1), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWANByDelegate) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(4))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(1))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
    await quotaLedgerInstance.lockQuota(testTokenAddr, storemanGroupWANByDelegate, storemanGroupWAN, web3.toWei(2), {from: HTLCWAN})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWANByDelegate) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), web3.toWei(3))
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
  })

  it('[QuotaLedger_mintToken] should succeed to payoff debt through mint token method', async () => {
    await quotaLedgerInstance.mintToken(testTokenAddr, storemanGroupWANByDelegate, storemanGroupWAN, web3.toWei(3), {from: HTLCWAN}) 
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail to finish unregistration in case contract is halted', async () => {
    let retError
    await setHalt(quotaLedgerInstance, true, owner)
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWAN, true, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    await setHalt(quotaLedgerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail to invoke this method by no storemanGroupAdmin', async () => {
    let retError
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWAN, true, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail in case an ordinary account provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, sender, true, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should fail in case an active storeman group address provided', async () => {
    let retError
    try {
      await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWANByDelegate, true, {from: storemanGroupAdmin})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[QuotaLedger_unregisterStoremanGroup] should succeed to unregister a storeman group', async () => {
    await quotaLedgerInstance.unregisterStoremanGroup(testTokenAddr, storemanGroupWAN, true, {from: storemanGroupAdmin})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), 0)
    assert.equal(quotaInfo[1].toNumber(), 0)
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
    assert.equal(await quotaLedgerInstance.isStoremanGroup(testTokenAddr, storemanGroupWAN), false)
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWANByDelegate)
    assert.equal(quotaInfo[0].toNumber(), web3.toWei(5))
    assert.equal(quotaInfo[1].toNumber(), web3.toWei(2))
    assert.equal(quotaInfo[2].toNumber(), web3.toWei(3))
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), web3.toWei(3))
  })

  it('[QuotaLedger_setStoremanGroupQuota] should succeed to reset this storeman group\'s quota', async () => {
    let quota = manCalQuota(regDeposit, DEFAULT_PRECISE, ratioTestToken, decimals18, decimals18)
    await quotaLedgerInstance.setStoremanGroupQuota(testTokenAddr, storemanGroupWAN, quota, {from: storemanGroupAdmin})
    quotaInfo = await getQuotaInfo(testTokenAddr, storemanGroupWAN) 
    assert.equal(quotaInfo[0].toNumber(), quota)
    assert.equal(quotaInfo[1].toNumber(), quota)
    assert.equal(quotaInfo[2].toNumber(), 0)
    assert.equal(quotaInfo[3].toNumber(), 0)
    assert.equal(quotaInfo[4].toNumber(), 0)
    assert.equal(quotaInfo[5].toNumber(), 0)
  })

  it('[StoremanGroupAdmin_kill] should kill storemanGroupAdmin', async () => {
    await setHalt(quotaLedgerInstance, true, owner)
    await quotaLedgerInstance.kill({from: owner})
  })
})

