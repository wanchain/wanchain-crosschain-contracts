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
const augurTokenAddr = '0x1985365e9f78359a9b6ad760e32412f4a445e862'
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
const tokenNameAugur = 'Augur Token'
const tokenSymbolTest = 'WCT'
const tokenSymbolDelphy = 'DPY'
const tokenSymbolAugur = 'REP'
const ratioTestToken = 200000 // 1 testToken = 20 wan, it need to mul the precise 10000
const ratioDelphyToken = 2000 // 1 delphy = 0.2 wan,it need to mul the precise 10000
const ratioAugurToken = 10000 // 1 augur = 1 wan,it need to mul the precise 10000

const bonusRatio = 10
const decimals6 = 6
const decimals8 = 8
const decimals18 = 18
const DEFAULT_BONUS_PERIOD_BLOCKS = 6 * 60 * 24
const DEFAULT_BONUS_RATIO_FOR_DEPOSIT = 20
const testBonusPeriodBlocks = 1

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

contract('StoremanGroupAdmin_UNITs', async ([owner, storemanGroupETH, storemanGroupWAN, storemanGroupWANByDelegate, storemanGroupNotWL, storemanGroupWANEvil, sender, penaltyReceiver]) => {
  it('should do all preparations', async () => {

    // unlock accounts
    await web3.personal.unlockAccount(owner, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupETH, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupWAN, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupWANByDelegate, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupNotWL, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroupWANEvil, 'wanglu', 99999)
    await web3.personal.unlockAccount(sender, 'wanglu', 99999)

    console.log(colors.green('[INFO] owner: ', owner))
    console.log(colors.green('[INFO] storemanGroupWAN: ', storemanGroupWAN))
    console.log(colors.green('[INFO] storemanGroupWANByDelegate: ', storemanGroupWANByDelegate))
    console.log(colors.green('[INFO] penaltyReceiver: ', penaltyReceiver))

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
    console.log(colors.green('[INFO] storemanGroupAdminInstanceAddress: ', storemanGroupAdminInstanceAddress))

    // set dependencies among these contracts
    await quotaLedgerInstance.setTokenManager(tokenManagerInstanceAddress, {from: owner})
    assert.equal(await quotaLedgerInstance.tokenManager(), tokenManagerInstanceAddress)

    await quotaLedgerInstance.setStoremanGroupAdmin(storemanGroupAdminInstanceAddress, {from: owner})
    assert.equal(await quotaLedgerInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)

    await tokenManagerInstance.injectDependencies(quotaLedgerInstanceAddress, origHtlc, wanHtlc, {from: owner})
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
      instance = WanToken.at(testTokenMirrorInstanceAddress)
      assert.equal((await instance.decimals()).toNumber(), decimals18)
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
    tokenInfo = await getTokenInfo(delphyTokenAddr)
      testTokenMirrorInstanceAddress = tokenInfo[1].toString()
      instance = WanToken.at(testTokenMirrorInstanceAddress)
      assert.equal((await instance.decimals()).toNumber(), decimals8)

    // disable delphyToken whitelist registration
    await setHalt(tokenManagerInstance, true, owner)
    ret = await tokenManagerInstance.setSmgEnableUserWhiteList(delphyTokenAddr, false, {from: owner})
    await setHalt(tokenManagerInstance, false, owner)
    tokenInfo = await getTokenInfo(delphyTokenAddr)
    assert.equal(tokenInfo[5], false)

    // register augurToken
    ret = await tokenManagerInstance.addCandidate(augurTokenAddr, ratioAugurToken, web3.toWei(100), withdrawDelayTimeUnit*100, tokenNameAugur, tokenSymbolAugur, decimals6, {from: owner})
    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: augurTokenAddr,
        ratio: ratioAugurToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*100,
        name: web3.fromAscii(tokenNameAugur),
        symbol: web3.fromAscii(tokenSymbolAugur),
        decimals: decimals6
      }
    })
    ret = await tokenManagerInstance.addToken(augurTokenAddr, {from: sender})
    tokenInfo = await getTokenInfo(augurTokenAddr)
      testTokenMirrorInstanceAddress = tokenInfo[1].toString()
      instance = WanToken.at(testTokenMirrorInstanceAddress)
      assert.equal((await instance.decimals()).toNumber(), decimals6)

    // disable delphyToken whitelist registration
    await setHalt(tokenManagerInstance, true, owner)
    ret = await tokenManagerInstance.setSmgEnableUserWhiteList(augurTokenAddr, false, {from: owner})
    await setHalt(tokenManagerInstance, false, owner)
    tokenInfo = await getTokenInfo(augurTokenAddr)
    assert.equal(tokenInfo[5], false)
  })

  // setSmgWhiteList tests

  it('[StoremanGroupAdmin_setSmgEnableUserWhiteList] should fail in case invoked by no owner', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.setSmgWhiteList(testTokenAddr, storemanGroupWAN, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_setSmgEnableUserWhiteList] should fail in case passed an unsupported token address', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.setSmgWhiteList(gnosisTokenAddr, storemanGroupWAN, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_setSmgEnableUserWhiteList] should fail in case passed an empty token address', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.setSmgWhiteList(emptyAddress, storemanGroupWAN, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_setSmgEnableUserWhiteList] should fail in case passed an empty storemanGroup address', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.setSmgWhiteList(testTokenAddr, emptyAddress, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_setSmgEnableUserWhiteList] should fail to setSmgEnableUserWhiteList in case token\'s useWhiteList is false', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.setSmgWhiteList(delphyTokenAddr, storemanGroupWAN, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_setSmgEnableUserWhiteList] should succeed to setSmgEnableUserWhiteList if useWhiteList is true', async () => {
    // all these three storeman groups will be added through whitelist mechanism
    ret = await storemanGroupAdminInstance.setSmgWhiteList(testTokenAddr, storemanGroupWAN, {from: owner})
    assert.web3Event(ret, {
            event: 'SmgEnableWhiteListLogger', 
            args: {
              smgWanAddr: storemanGroupWAN,
              tokenOrigAddr: testTokenAddr
            }
        })
        assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWAN), true)
        ret = await storemanGroupAdminInstance.setSmgWhiteList(testTokenAddr, storemanGroupWANByDelegate, {from: owner})
    assert.web3Event(ret, {
            event: 'SmgEnableWhiteListLogger', 
            args: {
              smgWanAddr: storemanGroupWANByDelegate,
              tokenOrigAddr: testTokenAddr
            }
        })
        assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWANByDelegate), true)
        ret = await storemanGroupAdminInstance.setSmgWhiteList(testTokenAddr, storemanGroupWANEvil, {from: owner})
        assert.web3Event(ret, {
          event: 'SmgEnableWhiteListLogger', 
            args: {
              smgWanAddr: storemanGroupWANEvil,
              tokenOrigAddr: testTokenAddr
            }
        })
  })

  it('[StoremanGroupAdmin_setSmgEnableUserWhiteList] should fail to do a duplicated registration on the whitelist', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.setSmgWhiteList(testTokenAddr, storemanGroupWAN, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  // registerStoremanGroup/registerStoremanGroupByDelegate tests

  it('[StoremanGroupAdmin_storemanGroupRegister] should register storemanGroups on the whitelist through registerStoremanGroup', async () => {
    // register storemanGroupWAN
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWAN), true)
    ret = await storemanGroupAdminInstance.storemanGroupRegister(testTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupWAN, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWAN,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(regDeposit)),
        quota: web3.toWei(regDeposit)*DEFAULT_PRECISE*(Math.pow(10, decimals18))/ratioTestToken/(Math.pow(10, decimals18)),
        txFeeRatio: storemanTxFeeRatio
      }
    })
    // console.log('quota of 100 wan coin to testToken: ', web3.toWei(regDeposit)*DEFAULT_PRECISE/ratioTestToken)
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWAN), false)
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWAN)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), emptyAddress)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)

    // register storemanGroupWANEvil
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWANEvil), true)
    ret = await storemanGroupAdminInstance.storemanGroupRegister(testTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupWANEvil, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWANEvil,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(regDeposit)),
        quota: web3.toWei(regDeposit)*DEFAULT_PRECISE*(Math.pow(10, decimals18))/ratioTestToken/(Math.pow(10, decimals18)),
        txFeeRatio: storemanTxFeeRatio
      }
    })
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWANEvil), false)
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWANEvil)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), emptyAddress)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)
  })
      
  it('[StoremanGroupAdmin_storemanGroupRegister] should fail to make a duplicated registration', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupRegister(testTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupWAN, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail to make a duplicated registration through proxy', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupRegisterByDelegate(testTokenAddr, storemanGroupWAN, storemanGroupETH, storemanTxFeeRatio, {from: owner, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupRegister] should fail in case deposit is less than minDeposit of the token', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupRegister(testTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupWANByDelegate, value: web3.toWei(parseInt(regDeposit - 1)), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)    
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should fail in case deposit is less than minDeposit of this token', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupRegisterByDelegate(testTokenAddr, storemanGroupWANByDelegate, storemanGroupETH, storemanTxFeeRatio, {from: owner, value: web3.toWei(parseInt(regDeposit - 1)), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupRegisterByDelegate] should register a storemanGroup on the whitelist through registerStoremanGroupByDelegate', async () => {
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWANByDelegate), true)
    ret = await storemanGroupAdminInstance.storemanGroupRegisterByDelegate(testTokenAddr, storemanGroupWANByDelegate, storemanGroupETH, storemanTxFeeRatio, {from: owner, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWANByDelegate,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(regDeposit)),
        quota: web3.toWei(regDeposit)*DEFAULT_PRECISE*(Math.pow(10, decimals18))/ratioTestToken/(Math.pow(10, decimals18)),
        txFeeRatio: storemanTxFeeRatio
      }
    })
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(testTokenAddr, storemanGroupWANByDelegate), false)
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWANByDelegate)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), owner)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)
  })

  it('[StoremanGroupAdmin_storemanGroupRegister] should fail to register an account as a storemanGroup through registerStoremanGroup in case it is not on the whitelist', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupRegister(testTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupNotWL, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupRegister] should fail to register an account as a storemanGroup through registerStoremanGroupByDelegate in case it is not on the whitelist', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupRegisterByDelegate(testTokenAddr, storemanGroupNotWL, storemanGroupETH, storemanTxFeeRatio, {from: owner, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupRegister] should register an address as a storemanGroup of testToken through registerStoremanGroup in case whitelist mechanism is off', async () => {
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(delphyTokenAddr, storemanGroupWAN), false)
    ret = await storemanGroupAdminInstance.storemanGroupRegister(delphyTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupWAN, value: web3.toWei(regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: delphyTokenAddr,
        smgWanAddr: storemanGroupWAN,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(regDeposit)),
        quota: manCalQuota(regDeposit, DEFAULT_PRECISE, ratioDelphyToken, decimals8, decimals18),
        txFeeRatio: storemanTxFeeRatio
      }
    })
    console.log(manCalQuota(regDeposit, DEFAULT_PRECISE, ratioDelphyToken, decimals8, decimals18))
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(delphyTokenAddr, storemanGroupWAN)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), emptyAddress)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)
  })

  it('[StoremanGroupAdmin_registerStoremanGroupByDelegate] should register an address as a storemanGroup of testToken through registerStoremanGroupByDelegate in case whitelist mechanism is off', async () => {
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(delphyTokenAddr, storemanGroupWANByDelegate), false)
    ret = await storemanGroupAdminInstance.storemanGroupRegisterByDelegate(delphyTokenAddr, storemanGroupWANByDelegate, storemanGroupETH, storemanTxFeeRatio, {from: owner, value: web3.toWei(10*regDeposit), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: delphyTokenAddr,
        smgWanAddr: storemanGroupWANByDelegate,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(10*regDeposit)),
        quota: manCalQuota(10*regDeposit, DEFAULT_PRECISE, ratioDelphyToken, decimals8, decimals18),
        txFeeRatio: storemanTxFeeRatio
      }
    })
    console.log(manCalQuota(10*regDeposit, DEFAULT_PRECISE, ratioDelphyToken, decimals8, decimals18))
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(delphyTokenAddr, storemanGroupWANByDelegate)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(10*regDeposit))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), owner)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)
  })

  it('[StoremanGroupAdmin_storemanGroupRegister] should register an address as a storemanGroup of augurToken through registerStoremanGroup in case whitelist mechanism is off', async () => {
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(augurTokenAddr, storemanGroupWAN), false)
    ret = await storemanGroupAdminInstance.storemanGroupRegister(augurTokenAddr, storemanGroupETH, storemanTxFeeRatio, {from: storemanGroupWAN, value: web3.toWei(regDeposit*99 + 99), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: augurTokenAddr,
        smgWanAddr: storemanGroupWAN,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(regDeposit*99 + 99)),
        quota: manCalQuota(regDeposit*99 + 99, DEFAULT_PRECISE, ratioAugurToken, decimals6, decimals18),
        txFeeRatio: storemanTxFeeRatio
      }
    })
    console.log(manCalQuota(regDeposit*99 + 99, DEFAULT_PRECISE, ratioAugurToken, decimals6, decimals18))
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(augurTokenAddr, storemanGroupWAN)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit*99 + 99))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), emptyAddress)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)
  })

  it('[StoremanGroupAdmin_registerStoremanGroupByDelegate] should register an address as a storemanGroup of augurToken through registerStoremanGroupByDelegate in case whitelist mechanism is off', async () => {
    assert.equal(await storemanGroupAdminInstance.mapSmgWhiteList(augurTokenAddr, storemanGroupWANByDelegate), false)
    ret = await storemanGroupAdminInstance.storemanGroupRegisterByDelegate(augurTokenAddr, storemanGroupWANByDelegate, storemanGroupETH, storemanTxFeeRatio, {from: owner, value: web3.toWei(regDeposit*99 + 99), gas: 4700000, gasPrice: "0x"+(GasPrice).toString(16)})
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger', 
      args: {
        tokenOrigAddr: augurTokenAddr,
        smgWanAddr: storemanGroupWANByDelegate,
        smgOrigAddr: storemanGroupETH,
        wanDeposit: parseInt(web3.toWei(regDeposit*99 + 99)),
        quota: manCalQuota(regDeposit*99 + 99, DEFAULT_PRECISE, ratioAugurToken, decimals6, decimals18),
        txFeeRatio: storemanTxFeeRatio
      }
    })
    console.log(manCalQuota(regDeposit*99 + 99, DEFAULT_PRECISE, ratioAugurToken, decimals6, decimals18))
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(augurTokenAddr, storemanGroupWANByDelegate)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit*99 + 99))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), owner)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)
  })

  // depositSmgBonus tests
  it('[StoremanGroupAdmin_depositSmgBonus] should fail in case token not been supported', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.depositSmgBonus(gnosisTokenAddr, {from: sender, value: web3.toWei(1)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_depositSmgBonus] should fail in case invoked by no owner', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.depositSmgBonus(testTokenAddr, {from: sender, value: web3.toWei(1)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_depositSmgBonus] should fail in case token\'s bonus not been enabled', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.depositSmgBonus(testTokenAddr, {from: sender, value: web3.toWei(1)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_depositSmgBonus] should succeed to add deposit', async () => {
    await setHalt(tokenManagerInstance, true, owner)
    await tokenManagerInstance.setSystemEnableBonus(testTokenAddr, true, testBonusPeriodBlocks)
    await setHalt(tokenManagerInstance, false, owner)

    tokenInfo = await getTokenInfo(testTokenAddr)
    assert.equal(tokenInfo[8].toNumber(), 1)
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

  // punishStoremanGroup tests

  it('[StoremanGroupAdmin_punishStoremanGroup] should fail in case invoked by no owner', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.punishStoremanGroup(testTokenAddr, storemanGroupWAN, 50, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_punishStoremanGroup] should fail in case providing a token not supported', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.punishStoremanGroup(gnosisTokenAddr, storemanGroupWAN, 50, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_punishStoremanGroup] should fail in case providing a unregistered storemanGroup', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.punishStoremanGroup(testTokenAddr, storemanGroupNotWL, 50, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_punishStoremanGroup] should fail in case providing an zero punish percent', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.punishStoremanGroup(testTokenAddr, storemanGroupWAN, 0, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_punishStoremanGroup] should fail in case providing an inproper punish percent', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.punishStoremanGroup(testTokenAddr, storemanGroupWAN, 101, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_punishStoremanGroup] should invoke this method successfully', async () => {
    ret = await storemanGroupAdminInstance.punishStoremanGroup(testTokenAddr, storemanGroupWAN, 50, {from: owner})
    assert.web3Event(ret, {
      event: 'StoremanGroupPunishedLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWAN,
        punishPercent: 50
      }
    })
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWAN)
    assert.equal(storemanGroupInfo[6].toNumber(), 50)
  })

  // storemanGroupApplyUnregister/smgApplyUnregisterByDelegate tests

  it('[StoremanGroupAdmin_storemanGroupApplyUnregister] should fail in case provided token not been supported', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupApplyUnregister(gnosisTokenAddr, {from: storemanGroupWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupApplyUnregister] should fail in case invoked by non-storemanGroup nor non-initiator', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupApplyUnregister(testTokenAddr, {from: storemanGroupNotWL})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_smgApplyUnregisterByDelegate] should fail in case invoked by no storemanGroup or initiator', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.smgApplyUnregisterByDelegate(testTokenAddr, storemanGroupWAN, {from: storemanGroupNotWL})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_smgApplyUnregisterByDelegate] should fail in case an unregistered storeman group\'s address is provided', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.smgApplyUnregisterByDelegate(testTokenAddr, storemanGroupNotWL, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupApplyUnregister] should succeed to make an unregistration application', async () => {
    await sleep(60*2*1000)
    tokenInfo = await getTokenInfo(testTokenAddr)
    let startBonusBlockNumber, endBonusBlockNumber, bonusRatio, bonus
    // startBlocks > 0
    // console.log(tokenInfo[7].toNumber())
    assert.notEqual(tokenInfo[6].toNumber(), 0)
    ret = await storemanGroupAdminInstance.storemanGroupApplyUnregister(testTokenAddr, {from: storemanGroupWAN})
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWAN)
    assert.notEqual(storemanGroupInfo[2].toNumber(), 0)

    startBonusBlockNumber = tokenInfo[6].toNumber()
    endBonusBlockNumber = ret.receipt.blockNumber
    bonusRatio = tokenInfo[9].toNumber()
        // calculate bonus with given params
    bonus = manCalBonus(startBonusBlockNumber, endBonusBlockNumber, testBonusPeriodBlocks, regDeposit, bonusRatio, DEFAULT_PRECISE)
    assert.web3Event(ret, {
      event: 'StoremanGroupApplyUnRegistrationLogger',
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWAN,
        applyTime: storemanGroupInfo[2].toNumber()
      }
    })
  })

  // storemanGroupWithdrawDeposit/smgWithdrawDepositByDelegate tests
  it('[StoremanGroupAdmin_storemanGroupWithdrawDeposit] should fail to invoke this method in case provided token not been supported', async () => {
    // change withdraw delay time window
    await setHalt(tokenManagerInstance, true, owner)
    ret = await tokenManagerInstance.setTokenEconomics(testTokenAddr, ratioTestToken, withdrawDelayTime4Test, bonusRatio, penaltyReceiver, {from: owner})
    await setHalt(tokenManagerInstance, false, owner)
    tokenInfo = await getTokenInfo(testTokenAddr)
    assert.equal(tokenInfo[4].toNumber(), withdrawDelayTime4Test)

    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupWithdrawDeposit(gnosisTokenAddr, {from: storemanGroupWAN})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_storemanGroupWithdrawDeposit] should fail to invoke storemanGroupWithdrawDeposit method in case apply unregistration not yet been done', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.storemanGroupWithdrawDeposit(testTokenAddr, {from: storemanGroupWANByDelegate})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_smgWithdrawDepositByDelegate] should fail to invoke this method in case apply unregistration not yet been done', async () => {
    let retError
    try {
      await storemanGroupAdminInstance.smgWithdrawDepositByDelegate(testTokenAddr, storemanGroupWANByDelegate, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_smgWithdrawDepositByDelegate] should succeed to make an unregistration application through applyUnregistrationByDelegate', async () => {
    tokenInfo = await getTokenInfo(testTokenAddr)
    let startBonusBlockNumber, endBonusBlockNumber, bonusRatio, bonus
    assert.notEqual(tokenInfo[8].toNumber(), 0)
    ret = await storemanGroupAdminInstance.smgApplyUnregisterByDelegate(testTokenAddr, storemanGroupWANByDelegate, {from: owner})
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWANByDelegate)
    assert.notEqual(storemanGroupInfo[2].toNumber(), 0)
    startBonusBlockNumber = tokenInfo[6].toNumber()
    endBonusBlockNumber = ret.receipt.blockNumber
    bonusRatio = tokenInfo[9].toNumber()
    bonus = manCalBonus(startBonusBlockNumber, endBonusBlockNumber, testBonusPeriodBlocks, regDeposit, bonusRatio, DEFAULT_PRECISE)
    assert.web3AllEvents(ret, [{
      event: 'StoremanGroupClaimSystemBonusLogger',
      args: {
        tokenOrigAddr: testTokenAddr,
        bonusRecipient: owner,
        bonus: bonus
      } 
    }, {
      event: 'StoremanGroupApplyUnRegistrationLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWANByDelegate,
        applyTime: storemanGroupInfo[2].toNumber()
      }
    }])
  })  

  it('[StoremanGroupAdmin_storemanGroupWithdrawDeposit] should succeed to unregister and withdraw deposit, including penalty distribution, through unregisterAndWithdrawDeposit', async () => {
    // penalty receiver's wan coin balance before transaction
    beforeReceiverBalance = await getBalance(penaltyReceiver)
    // calculate penalty offchain
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(testTokenAddr, storemanGroupWAN)
    penaltyRate = storemanGroupInfo[6].toNumber()
    penalty = manCalPenalty(regDeposit, penaltyRate)
    penalty = new BigNumber(penalty)
    // storeman group's balance before transaction
    beforeBalance = await getBalance(storemanGroupWAN)
    // make the transaction
    ret = await storemanGroupAdminInstance.storemanGroupWithdrawDeposit(testTokenAddr, {from: storemanGroupWAN, gasPrice: "0x"+(GasPrice).toString(16)})
    // calculate fuel used by the transaction
    let gasUsed = new BigNumber(ret.receipt.gasUsed)
    let gasPrice = new BigNumber(GasPrice)

    afterBalance = await getBalance(storemanGroupWAN)
    let actual = beforeBalance.minus(gasUsed.times(gasPrice))
    actual = actual.plus(new BigNumber(web3.toWei(regDeposit)))
    actual = actual.minus(penalty)
    actual = actual.toNumber()
    let expected = afterBalance.toNumber()
    // test against storeman group's balance
    assert.equal(actual, expected)
    afterReceiverBalance = await getBalance(penaltyReceiver)
    // test against penalty receiver's balance
    assert.equal(beforeReceiverBalance.toNumber(), (afterReceiverBalance.minus(penalty)).toNumber())
    // make sure the event been fired and correctly logged
    assert.web3Event(ret, {
      event: 'StoremanGroupWithdrawLogger',
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWAN,
        actualReturn: parseInt(web3.toWei(regDeposit)) - penalty,
        deposit: parseInt(web3.toWei(regDeposit))
      }
    })
  })

  it('[StoremanGroupAdmin_smgWithdrawDepositByDelegate] should succeed to unregister and withdraw deposit through smgWithdrawDepositByDelegate', async () => {
    beforeBalance = await web3.eth.getBalance(storemanGroupWANByDelegate)
    ret = await storemanGroupAdminInstance.smgWithdrawDepositByDelegate(testTokenAddr, storemanGroupWANByDelegate, {from: owner, gasPrice: "0x"+(GasPrice).toString(16)})
    let gasUsed = new BigNumber(ret.receipt.gasUsed)
    let gasPrice = new BigNumber(GasPrice)
    afterBalance = await web3.eth.getBalance(storemanGroupWANByDelegate)
    let actual = beforeBalance.minus(gasUsed.times(gasPrice))
    actual = actual.plus(new BigNumber(web3.toWei(regDeposit)))
    actual = actual.toNumber()
    let expected = afterBalance.toNumber()
    assert.web3Event(ret, {
      event: 'StoremanGroupWithdrawLogger',
      args: {
        tokenOrigAddr: testTokenAddr,
        smgWanAddr: storemanGroupWANByDelegate,
        actualReturn: parseInt(web3.toWei(regDeposit)),
        deposit: parseInt(web3.toWei(regDeposit))
      }
    })
  })

  it('[StoremanGroupAdmin_smgClaimSystemBonusByDelegate] should fail to claim bonus in case invoked by no token initiator', async () => {
    let retError 
    try {
      await storemanGroupAdminInstance.smgClaimSystemBonusByDelegate(delphyTokenAddr, storemanGroupWANByDelegate, {from: owner, gasPrice: "0x"+(GasPrice).toString(16)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_smgClaimSystemBonusByDelegate] should succeed to enable bonus mechanism', async () => {
    // enable delphy token bonus mechanism
    await tokenManagerInstance.setSystemEnableBonus(delphyTokenAddr, true, testBonusPeriodBlocks)

    tokenInfo = await getTokenInfo(delphyTokenAddr)
    assert.equal(tokenInfo[8].toNumber(), testBonusPeriodBlocks)
    assert.notEqual(tokenInfo[6].toNumber(), 0)
    // deposit wan token for future bonus claim
    ret = await storemanGroupAdminInstance.depositSmgBonus(delphyTokenAddr, {from: owner, value: web3.toWei(100)})
    assert.web3Event(ret, {
      event: 'StoremanGroupDepositBonusLogger',
      args: {
        tokenOrigAddr: delphyTokenAddr,
        sender: owner,
        wancoin: parseInt(web3.toWei(100))
      }
    })
    tokenInfo = await getTokenInfo(delphyTokenAddr)
    assert.equal(tokenInfo[7].toNumber(), parseInt(web3.toWei(100)))
    // make sure storemanGroupWANByDelegate is a valid storemanGroup for delphy token
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(delphyTokenAddr, storemanGroupWANByDelegate)
    assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(10*regDeposit))
    assert.equal(storemanGroupInfo[1].toString(), storemanGroupETH)
    assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
    assert.equal(storemanGroupInfo[5].toString(), sender)
    assert.equal(storemanGroupInfo[6].toNumber(), 0)  
  })

  it('[StoremanGroupAdmin_smgClaimSystemBonusByDelegate] should succeed to claim bonus', async () => {
    await sleep(30*1000*3)
    let startBonusBlockNumber, endBonusBlockNumber, bonusRatio, bonus
    ret = await storemanGroupAdminInstance.smgClaimSystemBonusByDelegate(delphyTokenAddr, storemanGroupWANByDelegate, {from: sender})
    storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(delphyTokenAddr, storemanGroupWANByDelegate)
    // affirm this smg has not applied unregistration
    assert.equal(storemanGroupInfo[2].toNumber(), 0)
    tokenInfo = await getTokenInfo(delphyTokenAddr)
    startBonusBlockNumber = tokenInfo[6].toNumber()
    endBonusBlockNumber = ret.receipt.blockNumber
    bonusRatio = tokenInfo[9].toNumber()
        // calculate bonus with given params
    bonus = manCalBonus(startBonusBlockNumber, endBonusBlockNumber, testBonusPeriodBlocks, web3.fromWei(storemanGroupInfo[0].toNumber()), bonusRatio, DEFAULT_PRECISE)
    assert.web3Event(ret, {
      event: 'StoremanGroupClaimSystemBonusLogger',
      args: {
        tokenOrigAddr: delphyTokenAddr,
        bonusRecipient: sender,
        bonus: bonus
      } 
    })
  })

  // transferDeposit
  it('[StoremanGroupAdmin_transferSmgDeposit] should fail to invoke transferDeposit in case by no owner', async () => {
   let retError
   try {
     await storemanGroupAdminInstance.transferSmgDeposit(delphyTokenAddr, storemanGroupWANByDelegate, sender, false, {from: sender})
   } catch (e) {
     retError = e
   }
   assert.notEqual(retError, undefined)
  })

  it('[StoremanGroupAdmin_transferSmgDeposit] should transfer deposit to the a specific address', async ()=> {
   let smgInfo = await storemanGroupAdminInstance.mapStoremanGroup(delphyTokenAddr, storemanGroupWANByDelegate)
   let deposit = smgInfo[0]
    
   beforeBalance = await getBalance(sender)
   beforeSCBalance = await web3.eth.getBalance(storemanGroupAdminInstanceAddress)
   assert.equal(await quotaLedgerInstance.isStoremanGroup(delphyTokenAddr, storemanGroupWANByDelegate), true)
   await storemanGroupAdminInstance.transferSmgDeposit(delphyTokenAddr, storemanGroupWANByDelegate, sender, false, {from: owner})
   afterBalance = await getBalance(sender)
   afterSCBalance = await web3.eth.getBalance(storemanGroupAdminInstanceAddress)
   assert.equal(await quotaLedgerInstance.isStoremanGroup(delphyTokenAddr, storemanGroupWANByDelegate), false)
   assert.equal(beforeBalance.plus(deposit).toNumber(), afterBalance.toNumber())
   assert.equal(beforeSCBalance.toNumber(), afterSCBalance.plus(deposit).toNumber())
  })

  it('[StoremanGroupAdmin_transferSmgDeposit] should transfer residual to owner', async ()=> {
   await setHalt(storemanGroupAdminInstance, true, owner)
   beforeSCBalance = web3.fromWei((await getBalance(storemanGroupAdminInstanceAddress)).toNumber())
   await storemanGroupAdminInstance.transferSmgDeposit(delphyTokenAddr, storemanGroupWANByDelegate, sender, true, {from: owner})
   afterSCBalance = web3.fromWei((await getBalance(storemanGroupAdminInstanceAddress)).toNumber())
   await setHalt(storemanGroupAdminInstance, false, owner)
   assert.equal(afterSCBalance, 0)
  })

  it('[StoremanGroupAdmin_kill] should kill storemanGroupAdmin', async () => {
    await setHalt(storemanGroupAdminInstance, true, owner)
    await storemanGroupAdminInstance.kill({from: owner})
  })
})



