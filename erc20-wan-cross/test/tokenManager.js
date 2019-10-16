require('truffle-test-utils').init()
const colors = require('colors/safe')
const web3 = global.web3
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
const withdrawDelayTimeUnit = 3600

const tokenNameTest = 'Test Token'
const tokenNameDelphy = 'Delphy Token'
const tokenSymbolTest = 'WCT'
const tokenSymbolDelphy = 'DPY'
const ratioTestToken = 200000 // 1 eth:20,it need to mul the precise 10000
const ratioDelphyToken = 2000 // 1 eth:20,it need to mul the precise 10000

const bonusRatio = 0.001*10000
const decimals6 = 6
const decimals8 = 8
const decimals18 = 18
const DEFAULT_BONUS_PERIOD_BLOCKS = 6 * 60 * 24
const DEFAULT_BONUS_RATIO_FOR_DEPOSIT = 20

const transferAmount = 1

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
  quotaInfo,
  key,
  ret,
  beforeTokenBalance,
  afterTokenBalance,
  blockNumber

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

async function getBalance(contract, owner) {
    return web3.fromWei((await contract.balanceOf(owner)).toNumber())
}

async function approve(token, owner, spender, amount) {
    await token.approve(spender, web3.toWei(amount), {from: owner})
    await sleep(60 * 1000)
    assert.equal((await token.allowance(owner, spender)).toNumber(), web3.toWei(amount))
}

contract('TokenManager_UNITs', async ([owner, storemanGroupETH, storemanGroupWAN, sender]) => {
  before('should do all preparations', async () => {
    // unlock relevant accounts
    // await web3.personal.unlockAccount(owner, 'wanglu', 99999)
    // await web3.personal.unlockAccount(storemanGroupETH, 'wanglu', 99999)
    // await web3.personal.unlockAccount(storemanGroupWAN, 'wanglu', 99999)
    // await web3.personal.unlockAccount(sender, 'wanglu', 99999)

    console.log(colors.green('[INFO] owner: ', owner))
    console.log(colors.green('[INFO] storemanGroupWAN: ', storemanGroupWAN))

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

    // set dependencies among these contracts
    await storemanGroupAdminInstance.injectDependencies(tokenManagerInstanceAddress, quotaLedgerInstanceAddress, {from: owner})
    await quotaLedgerInstance.setTokenManager(tokenManagerInstanceAddress, {from: owner})
    assert.equal(await quotaLedgerInstance.tokenManager(), tokenManagerInstanceAddress)

    await tokenManagerInstance.injectDependencies(storemanGroupAdminInstanceAddress, quotaLedgerInstanceAddress, origHtlc, wanHtlc, {from: owner})
    assert.equal(await tokenManagerInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)    
    assert.equal(await tokenManagerInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)
    assert.equal(await tokenManagerInstance.origHtlc(), origHtlc)
    assert.equal(await tokenManagerInstance.wanHtlc(), wanHtlc)
    console.log(colors.green('[INFO] origHtlc: ', origHtlc))
    console.log(colors.green('[INFO] wanHtlc: ', wanHtlc))

    DEFAULT_PRECISE = (await tokenManagerInstance.DEFAULT_PRECISE()).toNumber()
    console.log(colors.green('[INFO] DEFAULT_PRECISE: ', DEFAULT_PRECISE))

    await setHalt(tokenManagerInstance, false, owner)
    await setHalt(quotaLedgerInstance, false, owner)
  })

  it('[TokenManager_addCandidate] should fail in case tx.value field is not 0', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, minDepositTestToken, withdrawDelayTimeUnit*72, tokenNameTest, tokenSymbolTest, decimals, {from: owner, value: web3.toWei(0.001)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should fail in case invoked by no owner', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, minDepositTestToken, withdrawDelayTimeUnit*72, tokenNameTest, tokenSymbolTest, decimals, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should reject invalid token-wan-trade-rate', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, 0, minDepositTestToken, withdrawDelayTimeUnit*72, tokenNameTest, tokenSymbolTest, decimals, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should reject invalid min deposit', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(9.9999), withdrawDelayTimeUnit*72, tokenNameTest, tokenSymbolTest, decimals, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should reject invalid withdrawDelayTime', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(10), withdrawDelayTimeUnit*71.9, tokenNameTest, tokenSymbolTest, decimals, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should reject invalid token name', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(10), withdrawDelayTimeUnit*144, '', tokenSymbolTest, decimals, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should reject invalid token symbol', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(10), withdrawDelayTimeUnit*144, tokenNameTest, '', decimals, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should reject invalid token decimals', async () => {
    let retError 
    try {
      await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(10), withdrawDelayTimeUnit*144, tokenNameTest, tokenSymbolTest, 0, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addCandidate] should add testToken as a candidate', async () => {
    ret = await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(100), withdrawDelayTimeUnit*72, tokenNameTest, tokenSymbolTest, decimals8, {from: owner})
    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        ratio: ratioTestToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*72,
        name: web3.fromAscii(tokenNameTest),
        symbol: web3.fromAscii(tokenSymbolTest),
        decimals: decimals8
      }
    })
    candidateInfo = await tokenManagerInstance.mapCandidateInfo(testTokenAddr)
    assert.equal(candidateInfo[0], true)
    assert.equal(candidateInfo[1].toString(), web3.fromAscii(tokenNameTest))
    assert.equal(candidateInfo[2].toString(), web3.fromAscii(tokenSymbolTest))
    assert.equal(candidateInfo[3].toNumber(), decimals8)
    assert.equal(candidateInfo[4].toNumber(), ratioTestToken)
    assert.equal(candidateInfo[5].toNumber(), web3.toWei(100))
    assert.equal(candidateInfo[6].toNumber(), withdrawDelayTimeUnit*72)
    assert.equal(await tokenManagerInstance.isTokenRegistered(testTokenAddr), false)
  })

  it('[TokenManager_addToken] should reject a non-candidate\'s request', async () => {
    let retError
    try {
      await tokenManagerInstance.addToken(delphyTokenAddr, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_addToken] should register test token smoothly', async () => {
    ret = await tokenManagerInstance.addToken(testTokenAddr, {from: sender})
    key = await tokenManagerInstance.mapKey(testTokenAddr)
    console.log(colors.green('[INFO] First time token key: ', key))
    assert.equal(key, "0xae7515be9b0616c164193b3940267d912c91535cb078fd99a956b58182cc6b4c")

    tokenInfo = await tokenManagerInstance.mapTokenInfo(key)
      testTokenMirrorInstanceAddress = tokenInfo[1].toString()
      
      console.log(colors.green('[INFO] First TestTokenMirrorAddress: ', testTokenMirrorInstanceAddress))
    assert.web3Event(ret, {
      event: 'TokenAddedLogger',
      args: {
        tokenOrigAddr: testTokenAddr, 
        tokenWanAddr: testTokenMirrorInstanceAddress,
        ratio: tokenInfo[2].toNumber(),
        minDeposit: tokenInfo[3].toNumber(),
        origHtlc: origHtlc,
        wanHtlc: wanHtlc,
        withdrawDelayTime: withdrawDelayTimeUnit*72,
        tokenHash: "0xae7515be9b0616c164193b3940267d912c91535cb078fd99a956b58182cc6b4c"
      }
    })
  })

  it('[TokenManager_addToken] should reject a duplicated reg request', async () => {
    let retError
    try {
      await tokenManagerInstance.addToken(testTokenAddr, {from: sender})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_isTokenRegistered] token registration checker should work correctly', async () => {
    assert.equal(await tokenManagerInstance.isTokenRegistered(testTokenAddr), true)
    assert.equal(await tokenManagerInstance.isTokenRegistered(delphyTokenAddr), false)
    assert.equal(await tokenManagerInstance.isTokenRegistered(augurTokenAddr), false)
    assert.equal(await tokenManagerInstance.isTokenRegistered(gnosisTokenAddr), false)
  })

  it('[TokenManager_addToken] should add testToken again with correct decimals', async () => {
    await tokenManagerInstance.removeCandidate(testTokenAddr)
    candidateInfo = await tokenManagerInstance.mapCandidateInfo(testTokenAddr)
    assert.equal(candidateInfo[0], false)
    assert.equal(candidateInfo[1].toString(), '0x')
    assert.equal(candidateInfo[2].toString(), '0x')
    assert.equal(candidateInfo[3].toNumber(), 0)
    assert.equal(candidateInfo[4].toNumber(), 0)
    assert.equal(candidateInfo[5].toNumber(), 0)
    assert.equal(candidateInfo[6].toNumber(), 0)

    ret = await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(100), withdrawDelayTimeUnit*72, tokenNameTest, tokenSymbolTest, decimals18, {from: owner})
    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        ratio: ratioTestToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*72,
        name: web3.fromAscii(tokenNameTest),
        symbol: web3.fromAscii(tokenSymbolTest),
        decimals: decimals18
      }
    })
    candidateInfo = await tokenManagerInstance.mapCandidateInfo(testTokenAddr)
    assert.equal(candidateInfo[0], true)
    assert.equal(candidateInfo[1].toString(), web3.fromAscii(tokenNameTest))
    assert.equal(candidateInfo[2].toString(), web3.fromAscii(tokenSymbolTest))
    assert.equal(candidateInfo[3].toNumber(), decimals18)
    assert.equal(candidateInfo[4].toNumber(), ratioTestToken)
    assert.equal(candidateInfo[5].toNumber(), web3.toWei(100))
    assert.equal(candidateInfo[6].toNumber(), withdrawDelayTimeUnit*72)

    ret = await tokenManagerInstance.addToken(testTokenAddr, {from: sender})
    key = await tokenManagerInstance.mapKey(testTokenAddr)
    console.log(colors.green('[INFO] Second time token key: ', key))
    assert.equal(key, "0x124a43e4add70b71c3f11b6c48959a2ef744386aaa070909dc1f61e127ab23f6")
    tokenInfo = await tokenManagerInstance.mapTokenInfo(key)
      testTokenMirrorInstanceAddress = tokenInfo[1].toString()
      console.log(colors.green('[INFO] Second TestTokenMirrorAddress: ', testTokenMirrorInstanceAddress))
      assert.web3Event(ret, {
      event: 'TokenAddedLogger',
      args: {
        tokenOrigAddr: testTokenAddr, 
        tokenWanAddr: testTokenMirrorInstanceAddress,
        ratio: tokenInfo[2].toNumber(),
        minDeposit: tokenInfo[3].toNumber(),
        origHtlc: origHtlc,
        wanHtlc: wanHtlc,
        withdrawDelayTime: withdrawDelayTimeUnit*72,
        tokenHash: "0x124a43e4add70b71c3f11b6c48959a2ef744386aaa070909dc1f61e127ab23f6"
      }
    })

    testTokenMirrorInstance = WanToken.at(testTokenMirrorInstanceAddress)
    let retError
    try {
      await tokenManagerInstance.addToken(testTokenAddr, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setTokenEconomics] should fail to set params in case contract not halted', async () => {
    let retError
    try {
      await tokenManagerInstance.setTokenEconomics(testTokenAddr, ratioTestToken, withdrawDelayTimeUnit*100, bonusRatio, owner, {from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setTokenEconomics] should fail to set params in case invoked by no owner', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setTokenEconomics(testTokenAddr, ratioTestToken, withdrawDelayTimeUnit*100, bonusRatio, owner, {from: sender})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setTokenEconomics] should fail to set params in case an invalid token address provided', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setTokenEconomics(delphyTokenAddr, ratioTestToken, withdrawDelayTimeUnit*100, bonusRatio, owner, {from: owner})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setTokenEconomics] should fail to set params in case an invalid trade ratio provided', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setTokenEconomics(testTokenAddr, 0, withdrawDelayTimeUnit*100, bonusRatio, owner, {from: owner})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setTokenEconomics] should fail to set params in case an invalid under bonusRatio provided', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setTokenEconomics(testTokenAddr, ratioTestToken, withdrawDelayTimeUnit*100, 0, owner, {from: owner})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })  

  it('[TokenManager_setTokenEconomics] should fail to set params in case an invalid over bonusRatio provided', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setTokenEconomics(testTokenAddr, ratioTestToken, withdrawDelayTimeUnit*100, 10001, owner, {from: owner})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setTokenEconomics] should succeed to set params', async () => {
    // before set
    key = await tokenManagerInstance.mapKey(testTokenAddr)
    tokenInfo = await tokenManagerInstance.mapTokenInfo(key)
    assert.equal(tokenInfo[4].toNumber(), 60*60*72)
    assert.equal(tokenInfo[8].toNumber(), 6*60*24)
    assert.equal(tokenInfo[9].toNumber(), 20)
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    ret = await tokenManagerInstance.setTokenEconomics(testTokenAddr, ratioTestToken, withdrawDelayTimeUnit/10, bonusRatio, owner, {from: owner})
    await setHalt(tokenManagerInstance, false, owner)
    // after set
    key = await tokenManagerInstance.mapKey(testTokenAddr)
    tokenInfo = await tokenManagerInstance.mapTokenInfo(key)
    assert.equal(tokenInfo[4].toNumber(), 60*6)
    assert.equal(tokenInfo[8].toNumber(), 6*60*24)
    assert.equal(tokenInfo[9].toNumber(), bonusRatio)
  })  

  it('[TokenManager_setSmgEnableUserWhiteList] should fail to set setSmgEnableUserWhiteList in case invoked by no owner', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setSmgEnableUserWhiteList(testTokenAddr, false, {from: sender})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setSmgEnableUserWhiteList] should fail to set setSmgEnableUserWhiteList in case invalid token address provided', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setSmgEnableUserWhiteList(delphyTokenAddr, false, {from: owner})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setSmgEnableUserWhiteList] should reset setSmgEnableUserWhiteList correctly', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    ret = await tokenManagerInstance.setSmgEnableUserWhiteList(testTokenAddr, false, {from: owner})
    await setHalt(tokenManagerInstance, false, owner)
    tokenInfo = await tokenManagerInstance.mapTokenInfo(testTokenAddr)
    assert.equal(tokenInfo[4], false)
  })

  it('[TokenManager_setSystemEnableBonus] should fail to set setSystemEnableBonus in case invoked by no owner', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setSystemEnableBonus(testTokenAddr, true, 6 * 60 * 48, {from: sender})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setSystemEnableBonus] should fail to set setSystemEnableBonus in case invalid token address provided', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    let retError
    try {
      await tokenManagerInstance.setSystemEnableBonus(delphyTokenAddr, true, 6 * 60 * 48, {from: owner})
    } catch (e) {
      retError = e
    }
    await setHalt(tokenManagerInstance, false, owner)
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_setSystemEnableBonus] should reset setSystemEnableBonus correctly', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    ret = await tokenManagerInstance.setSystemEnableBonus(testTokenAddr, true, 6 * 60 * 48, {from: owner})
    await setHalt(tokenManagerInstance, false, owner)
    key = await tokenManagerInstance.mapKey(testTokenAddr)
    tokenInfo = await tokenManagerInstance.mapTokenInfo(key)
    assert.notEqual(tokenInfo[6].toNumber(), 0)
    assert.equal(tokenInfo[8].toNumber(), 6 * 60 * 48)
  })

  it('[TokenManager_updateTotalBonus] should fail in case an invalid token provided', async () => {
    let retError
    try {
      await tokenManagerInstance.updateTotalBonus(delphyTokenAddr, web3.toWei(0.01), true)
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_updateTotalBonus] should fail in case invoked by no StoremanGroupAdmin', async () => {
    let retError
    try {
      await tokenManagerInstance.updateTotalBonus(testTokenAddr, web3.toWei(0.01), true)
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[TokenManager_updateTotalBonus] should update total bonus correctly', async () => {
    await tokenManagerInstance.setSystemEnableBonus(testTokenAddr, true, testBonusPeriodBlocks, {from: owner})

    tokenInfo = await getTokenInfo(testTokenAddr)
    assert.equal(tokenInfo[8].toNumber(), testBonusPeriodBlocks)
    assert.notEqual(tokenInfo[6].toNumber(), 0)

    ret = await storemanGroupAdminInstance.depositSmgBonus(testTokenAddr, {from: owner, value: web3.toWei(100)})
    assert.web3Event(ret, {
      event: 'StoremanGroupDepositBonusLogger',
      args: {
        tokenOrigAddr: testTokenAddr,
        sender: owner,
        wancoin: parseInt(web3.toWei(100))
      }
    })

    tokenInfo = await getTokenInfo(testTokenAddr)
    assert.equal(tokenInfo[7].toNumber(), parseInt(web3.toWei(100)))
  })
})


