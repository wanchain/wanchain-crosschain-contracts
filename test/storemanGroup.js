
//                            _           _           _
//  __      ____ _ _ __   ___| |__   __ _(_)_ __   __| | _____   __
//  \ \ /\ / / _` | '_ \ / __| '_ \ / _` | | '_ \@/ _` |/ _ \ \ / /
//   \ V  V / (_| | | | | (__| | | | (_| | | | | | (_| |  __/\ V /
//    \_/\_/ \__,_|_| |_|\___|_| |_|\__,_|_|_| |_|\__,_|\___| \_/
//
//  Code style according to: https://github.com/wanchain/wanchain-token/blob/master/style-guide.rst

/*
  this test script just for  storeman group sc to :

  to check the reliable of the staking related functions
  to check the reliable of the lottery related functions
  to check the reliable of the interactive between smg admin
  
*/
require('truffle-test-utils').init()
const colors = require('colors/safe')
const web3 = global.web3
const BigNumber = require('bignumber.js')
const StoremanLottery = artifacts.require('./StoremanLottery.sol')
const StoremanGroup = artifacts.require('./StoremanGroup.sol')
const StoremanGroupAdmin = artifacts.require('./ImprovedStoremanGroupAdmin.sol')
const TokenManager = artifacts.require('./TokenManager.sol')
const QuotaLedger = artifacts.require('./QuotaLedger.sol')
const HTLCWAN = artifacts.require('./HTLCWAN.sol')
const HTLCETH = artifacts.require('./HTLCETH.sol')
const WanTokenABI = artifacts.require('./WanToken.sol').abi
const WanToken = web3.eth.contract(WanTokenABI)

// ERC20 compliant token addresses
const testTokenAddr = '0xd87b59aadf86976a2877e3947b364a4f5ac93bd3'
const delphyTokenAddr = '0x6c2adc2073994fb2ccc5032cc2906fa221e9b391'
const augurTokenAddr = '0x1985365e9f78359a9b6ad760e32412f4a445e862'
const gnosisTokenAddr = '0x6810e776880C02933D47DB1b9fc05908e5386b96'

const storemanTxFeeRatio = 1
const regDeposit = 100
const GasPrice = 180000000000
const withdrawDelayTimeUnit = 60 

const tokenNameTest = 'WanChain2.x Test Token'
const tokenNameDelphy = 'Delphy Token'
const tokenNameAugur = 'Augur Token'
const tokenSymbolTest = 'WCT'
const tokenSymbolDelphy = 'DPY'
const tokenSymbolAugur = 'REP'
const ratioTestToken = 200000 // 1 testToken = 20 wan, it need to mul the precise 10000
const ratioDelphyToken = 2000 // 1 delphy = 0.2 wan,it need to mul the precise 10000
const ratioAugurToken = 10000 // 1 augur = 1 wan,it need to mul the precise 10000

const decimals6 = 6
const decimals8 = 8
const decimals18 = 18

const MIN_WITHDRAW_WINDOW = 3600 * 72
const SMG_NAP_TIME = 30
const STAKING_DURING_TIME = 60 * 2
const RUNNING_DURING_TIME = 60 * 2

const emptyAddress = '0x0000000000000000000000000000000000000000';

let lotteryNum = 6
let lotteryBonus = 1000
const smgBonus = 1000
const minSmgStakingDeposit = 1000

let SCStatus = {
  Invalid : 0,
  StakerElection: 1,
  Lottery: 2,
  Initial: 3,
  Registered: 4,
  Unregistered: 5,
  Withdrawed: 6,
  WorkDone: 7
}

let storemanGroupAdminInstance,
  storemanGroupAdminInstanceAddress,
  tokenManagerInstance,
  tokenManagerInstanceAddress,
  quotaLedgerInstance,
  quotaLedgerInstanceAddress,
  DEFAULT_PRECISE,
  tokenInfo,
  storemanGroupInfo,
  ret,
  storemanGroupInstance,
  storemanGroupInstanceAddress,
  storemanLotteryInstance,
  storemanLotteryInstanceAddress,
  ethHtlcAddr,
  wanHtlcAddr  

const  tokenArray = []
const  stakerArray = []
const  lotterArray = []
const  depositorArray = []
const  depositAccountsArray  = []

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function setHalt(contract, state, operator) {
    await contract.setHalt(state, {from: operator})
    assert.equal(await contract.halted(), state)
}

async function getTokenInfo(addr) {
  let key = await tokenManagerInstance.mapKey(addr)
  return await tokenManagerInstance.mapTokenInfo(key)
}

contract('StoremanGroupAdmin_UNITs', async ([owner,bid1,bid2,bid3,bid4,bid5,bid6,bid7,bid8,bid9,bidA,bidB,bidC,bidD,sender,smgETH,smgWAN]) => {
  it('should do all preparations', async () => {

    // unlock accounts
    await web3.personal.unlockAccount(owner, '123456', 99999)
    await web3.personal.unlockAccount(bid1, '123456', 99999)
    await web3.personal.unlockAccount(bid2, '123456', 99999)
    await web3.personal.unlockAccount(bid3, '123456', 99999)
    await web3.personal.unlockAccount(bid4, '123456', 99999)
    await web3.personal.unlockAccount(bid5, '123456', 99999)
    await web3.personal.unlockAccount(bid6, '123456', 99999)
    await web3.personal.unlockAccount(bid7, '123456', 99999)
    await web3.personal.unlockAccount(bid8, '123456', 99999)
    await web3.personal.unlockAccount(bid9, '123456', 99999)
    await web3.personal.unlockAccount(bidA, '123456', 99999)
    await web3.personal.unlockAccount(bidB, '123456', 99999)
    await web3.personal.unlockAccount(bidC, '123456', 99999)
    await web3.personal.unlockAccount(bidD, '123456', 99999)
    await web3.personal.unlockAccount(sender, '123456', 99999)
    await web3.personal.unlockAccount(smgETH, '123456', 99999)
    await web3.personal.unlockAccount(smgWAN, '123456', 99999)

    depositAccountsArray.push(bid1)
    depositAccountsArray.push(bid2)
    depositAccountsArray.push(bid3)
    depositAccountsArray.push(bid4)
    depositAccountsArray.push(bid5)
    depositAccountsArray.push(bid6)
    depositAccountsArray.push(bid7)
    depositAccountsArray.push(bid8)
    depositAccountsArray.push(bid9)
    depositAccountsArray.push(bidA)
    depositAccountsArray.push(bidB)
    depositAccountsArray.push(bidC)
    depositAccountsArray.push(bidD)

    stakerArray.push(bid1)
    stakerArray.push(bid2)
    stakerArray.push(bid3)
    stakerArray.push(bid4)

    lotterArray.push(bid6)
    lotterArray.push(bid8)
    lotterArray.push(bid9)

    depositorArray.push(bid5)
    depositorArray.push(bid7)
    depositorArray.push(bidA)
    depositorArray.push(bidB)
    depositorArray.push(bidC)
    depositorArray.push(bidD)

    console.log(colors.green('[INFO] owner: ', owner))

    ////////////////////////////////////////////////////
    // part 1: to check already existed sc object info//
    // to get the deploied already quota ledger       //
    ////////////////////////////////////////////////////
    tokenManagerInstance = await TokenManager.new({from: owner}) // to edit with exist tokenManager address
    tokenManagerInstanceAddress = tokenManagerInstance.address  // to edit with exist tokenManager address
    console.log(colors.green('[INFO] tokenManagerInstanceAddress: ', tokenManagerInstanceAddress))
    assert.equal(await tokenManagerInstance.halted(), true)

    // to get the deploied already quota ledger 
    quotaLedgerInstance = await QuotaLedger.new({from: owner})
    quotaLedgerInstanceAddress = quotaLedgerInstance.address   // to edit with exist quotaLeger address
    console.log(colors.green('[INFO] quotaLedgerInstanceAddress: ', quotaLedgerInstanceAddress))
    assert.equal(await quotaLedgerInstance.halted(), true)

    // to get the deploied  new version storemangroup admin instance
    storemanGroupAdminInstance = await StoremanGroupAdmin.new({from: owner})
    storemanGroupAdminInstanceAddress = storemanGroupAdminInstance.address
    console.log(colors.green('[INFO] storemanGroupAdminInstanceAddress: ', storemanGroupAdminInstanceAddress))

    wanHtlc = await HTLCWAN.new({from:owner})
    wanHtlcAddr = wanHtlc.address
    console.log(colors.green('[INFO] wanHtlcAddr: ', wanHtlcAddr))

    ethHtlc = await HTLCETH.new({from:owner})
    ethHtlcAddr = ethHtlc.address
    console.log(colors.green('[INFO] ethHtlcAddr: ', ethHtlcAddr))

    // set dependencies among these contracts
    await storemanGroupAdminInstance.injectDependencies(tokenManagerInstanceAddress, quotaLedgerInstanceAddress, {from: owner})
    assert.equal(await storemanGroupAdminInstance.tokenManager(), tokenManagerInstanceAddress)
    assert.equal(await storemanGroupAdminInstance.quotaLedger(), quotaLedgerInstanceAddress)
    assert.equal(await storemanGroupAdminInstance.halted(), true)

    await quotaLedgerInstance.setTokenManager(tokenManagerInstanceAddress, {from: owner})
    assert.equal(await quotaLedgerInstance.tokenManager(), tokenManagerInstanceAddress)
    await quotaLedgerInstance.setStoremanGroupAdmin(storemanGroupAdminInstanceAddress, {from: owner})
    assert.equal(await quotaLedgerInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)

    await tokenManagerInstance.injectDependencies(storemanGroupAdminInstanceAddress, quotaLedgerInstanceAddress, ethHtlcAddr, wanHtlcAddr, {from: owner})
    assert.equal(await tokenManagerInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)
    assert.equal(await tokenManagerInstance.quotaLedger(), quotaLedgerInstanceAddress)
    assert.equal(await tokenManagerInstance.origHtlc(), ethHtlcAddr)
    assert.equal(await tokenManagerInstance.wanHtlc(), wanHtlcAddr)
    console.log(colors.green('[INFO] origHtlc: ', ethHtlcAddr))
    console.log(colors.green('[INFO] wanHtlc: ', wanHtlcAddr))

    // to deploy the new storemanGroup instance
    storemanGroupInstance = await StoremanGroup.new({from: owner})
    storemanGroupInstanceAddress = storemanGroupInstance.address
    assert.equal(await storemanGroupInstance.halted(), true)
    console.log(colors.green('[INFO] storemanGroupInstanceAddress: ', storemanGroupInstanceAddress))

    // to deploy the new storemanLottery instance
    storemanLotteryInstance = await StoremanLottery.new({from: owner})
    storemanLotteryInstanceAddress = storemanLotteryInstance.address
    assert.equal(await storemanLotteryInstance.halted(), true)
    console.log(colors.green('[INFO] storemanLotteryInstanceAddress: ', storemanLotteryInstanceAddress))

    await storemanLotteryInstance.setStoremanGroupAddr(storemanGroupInstanceAddress, {from: owner})
    assert.equal(await storemanLotteryInstance.storemanGroupAddr(), storemanGroupInstanceAddress)
    
    DEFAULT_PRECISE = (await tokenManagerInstance.DEFAULT_PRECISE()).toNumber()
    console.log(colors.green('[INFO] DEFAULT_PRECISE: ', DEFAULT_PRECISE))

    await setHalt(storemanGroupAdminInstance, false, owner)
    await setHalt(storemanLotteryInstance, false, owner)
    await setHalt(storemanGroupInstance, false, owner)
    await setHalt(tokenManagerInstance, false, owner)
    await setHalt(quotaLedgerInstance, false, owner)
    await setHalt(wanHtlc, false, owner)
    await setHalt(ethHtlc, false, owner)

    ///////////////////////////////////////////////////////////////
    // part 2: to add token info to token manager                //
    ///////////////////////////////////////////////////////////////
    //register testToken
    ret = await tokenManagerInstance.addCandidate(testTokenAddr, ratioTestToken, web3.toWei(100), withdrawDelayTimeUnit*1, tokenNameTest, tokenSymbolTest, decimals18, {from: owner})
    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: testTokenAddr,
        ratio: ratioTestToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*1,
        name: web3.fromAscii(tokenNameTest),
        symbol: web3.fromAscii(tokenSymbolTest),
        decimals: decimals18
      }
    })
    console.log(colors.green('[INFO] testTokenAddr: ', testTokenAddr))

    ret = await tokenManagerInstance.addToken(testTokenAddr, {from: sender})
    tokenInfo = await getTokenInfo(testTokenAddr)
    testTokenMirrorInstanceAddress = tokenInfo[1].toString()
    instance = WanToken.at(testTokenMirrorInstanceAddress)
    assert.equal((await instance.decimals()).toNumber(), decimals18)
    console.log(colors.green('[INFO] testTokenAddr TestTokenMirrorAddress: ', testTokenMirrorInstanceAddress))

    ret = await storemanGroupAdminInstance.setSmgWhiteList(testTokenAddr, smgWAN, {from: owner})
    assert.web3Event(ret, {
        event: 'SmgEnableWhiteListLogger', 
        args: {
          smgWanAddr: smgWAN,
          tokenOrigAddr: testTokenAddr
        }
    })

    // register delphyToken
    ret = await tokenManagerInstance.addCandidate(delphyTokenAddr, ratioDelphyToken, web3.toWei(100), withdrawDelayTimeUnit*1, tokenNameDelphy, tokenSymbolDelphy, decimals8, {from: owner})
    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: delphyTokenAddr,
        ratio: ratioDelphyToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*1,
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
    console.log(colors.green('[INFO] delphyTokenAddr TestTokenMirrorAddress: ', testTokenMirrorInstanceAddress))

    ret = await storemanGroupAdminInstance.setSmgWhiteList(delphyTokenAddr, smgWAN, {from: owner})
    assert.web3Event(ret, {
        event: 'SmgEnableWhiteListLogger', 
        args: {
          smgWanAddr: smgWAN,
          tokenOrigAddr: delphyTokenAddr
        }
    })

    // register augurToken
    ret = await tokenManagerInstance.addCandidate(augurTokenAddr, ratioAugurToken, web3.toWei(100), withdrawDelayTimeUnit*1, tokenNameAugur, tokenSymbolAugur, decimals6, {from: owner})
    assert.web3Event(ret, {
      event: 'CandidateAddedLogger', 
      args: {
        tokenOrigAddr: augurTokenAddr,
        ratio: ratioAugurToken,
        minDeposit: parseInt(web3.toWei(100)),
        withdrawDelayTime: withdrawDelayTimeUnit*1,
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
    console.log(colors.green('[INFO] augurTokenAddr TestTokenMirrorAddress: ', testTokenMirrorInstanceAddress))

    ret = await storemanGroupAdminInstance.setSmgWhiteList(augurTokenAddr, smgWAN, {from: owner})
    assert.web3Event(ret, {
        event: 'SmgEnableWhiteListLogger', 
        args: {
          smgWanAddr: smgWAN,
          tokenOrigAddr: augurTokenAddr
        }
    })

    tokenArray.push(augurTokenAddr)
    tokenArray.push(delphyTokenAddr)
    tokenArray.push(testTokenAddr)  
  })


  //
  ///////////////////////////////////////////////////////////////
  // part 3: to do the storemanGroup interface unit testing    //
  ///////////////////////////////////////////////////////////////
  //StoremanGroup_setSmgAdmin: to inject deposit during staking (storemanGroupAdminInstanceAddress,storemanLotteryInstance,smgWAN)
  it('[StoremanGroup_InjectDependencies] should fail in case of noHalt status ', async () => {
    let retError

    try {
      await storemanGroupInstance.InjectDependencies(storemanGroupAdminInstanceAddress,storemanLotteryInstanceAddress,smgWAN,{from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_InjectDependencies] should fail in case of invalid admin address', async () => {
    let retError

    await setHalt(storemanGroupInstance, true, owner)

    try {
      await storemanGroupInstance.InjectDependencies(emptyAddress,storemanLotteryInstanceAddress,smgWAN,{from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_InjectDependencies] should fail in case of invalid lottery address', async () => {
    let retError

    try {
      await storemanGroupInstance.InjectDependencies(storemanGroupAdminInstanceAddress,emptyAddress,smgWAN,{from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_InjectDependencies] should fail in case of invalid mpc address', async () => {
    let retError

    try {
      await storemanGroupInstance.InjectDependencies(storemanGroupAdminInstanceAddress,storemanLotteryInstanceAddress,emptyAddress,{from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_InjectDependencies] should fail in case of non-owner ', async () => {
    let retError

    try {
      await storemanGroupInstance.InjectDependencies(storemanGroupAdminInstanceAddress,storemanLotteryInstanceAddress,smgWAN,{from: sender})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_InjectDependencies] should succeed in case of valid admin address by owner', async () => {  
    
    await storemanGroupInstance.InjectDependencies(storemanGroupAdminInstanceAddress,storemanLotteryInstanceAddress,smgWAN,{from: owner})
    assert.equal(await storemanGroupInstance.storemanGroupAdmin(), storemanGroupAdminInstanceAddress)
    assert.equal(await storemanGroupInstance.locatedLotteryAddr(), storemanLotteryInstanceAddress)
    assert.equal(await storemanGroupInstance.locatedMpcAddr(), smgWAN)

    await setHalt(storemanGroupInstance, false, owner)

  })

  // StoremanGroup_setSmgStakingTime: to inject deposit during staking
  it('[StoremanGroup_setSmgStakingTime] should succeed in case of not halt', async () => {
    let now = (Date.now() - Date.now()%1000)/1000;
    let retError

    try{
      await storemanGroupInstance.setSmgStakingTime(now + SMG_NAP_TIME, now + SMG_NAP_TIME + STAKING_DURING_TIME, {from: owner})   
    }catch(e){
      retError = e
    }

    assert.notEqual(retError, undefined)
    await setHalt(storemanGroupInstance, true, owner)

  })

  it('[StoremanGroup_setSmgStakingTime] should fail in case of non-owner', async () => {
    let retError
    let now = (Date.now() - Date.now()%1000)/1000;

    let utc_start = Date.UTC(2019,3,15,0,0,0,0)/1000  // the unit of utc time is 'ms', needed to transfer to 's'
    let utc_end = Date.UTC(2019,3,31,23,59,0,0)/1000

    console.log(colors.green('[INFO] StoremanGroup_setSmgStakingTime current time: ', now))
    console.log(colors.green('[INFO] StoremanGroup_setSmgStakingTime utc_start: ', utc_start))
    console.log(colors.green('[INFO] StoremanGroup_setSmgStakingTime utc_end: ', utc_end))

    try {
      await storemanGroupInstance.setSmgStakingTime(now, now + STAKING_DURING_TIME, {from: sender})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgStakingTime] should fail in case of invalid timeset', async () => {
    let retError
    let now = (Date.now() - Date.now()%1000)/1000;

    try {
      await storemanGroupInstance.setSmgStakingTime(now + SMG_NAP_TIME, now, {from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgStakingTime] should succeed in case of valid timeset by owner', async () => {
    let now = (Date.now() - Date.now()%1000)/1000;
    await storemanGroupInstance.setSmgStakingTime(now + SMG_NAP_TIME, now + SMG_NAP_TIME + STAKING_DURING_TIME, {from: owner})   

    assert.equal(await storemanGroupInstance.stakingStartTime(), now + SMG_NAP_TIME) 
    assert.equal(await storemanGroupInstance.stakingEndTime(), now + SMG_NAP_TIME + STAKING_DURING_TIME)


    await setHalt(storemanGroupInstance, false, owner)
  })

  /////////////////////////////////////////
  // storemanGroup staking unit testing  //
  /////////////////////////////////////////
  // StoremanGroup_handleSmgStaking: to inject deposit during staking
  it('[StoremanGroup_handleSmgStaking] should fail in case of invalid deposit when commit deposit for the first time', async () => {
    let retError

    await sleep(SMG_NAP_TIME * 1000);

    let money = web3.toWei(1)
    console.log(colors.green('[INFO] StoremanGroup_handleSmgStaking money: ', money))

    let refundTx
    try {
    refundTx =  await web3.eth.sendTransaction({from: bidD, to: storemanGroupInstanceAddress, value: money, gas: 500000})

    } catch (e) {
      retError = e
      console.log(colors.green('[INFO] StoremanGroup_handleSmgStaking: ', testTokenMirrorInstanceAddress))
    }

    await sleep(3 * 1000);
    let status = await web3.eth.getTransactionReceipt(refundTx).status
    assert.equal(status, false);
  })

  it('[StoremanGroup_handleSmgStaking] should fail in case of invalid account during staking', async () => {
    let retError
    let refundTx

    try {
    refundTx =  await web3.eth.sendTransaction({from: emptyAddress, to: storemanGroupInstanceAddress, value: web3.toWei(minSmgStakingDeposit), gas: 500000})

    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_handleSmgStaking] should succeed in case of valid account with valid repeated deposit during staking', async () => {
   
    for(let i = 1; i < 5; i++){
      let deposit =  web3.toWei((minSmgStakingDeposit - (minSmgStakingDeposit % i)))/ i
      console.log(colors.blue('[INFO] depositor: ', sender))
      console.log(colors.blue('[INFO] deposit: ', deposit))

      // let beforeBalance = web3.eth.getBalance(storemanGroupInstanceAddress)
      // console.log(colors.green('[INFO] storemanGroupInstance Before Balance: ', beforeBalance))

      let refundTx = await web3.eth.sendTransaction({from: sender, to:storemanGroupInstanceAddress, value: deposit, gas: 500000}) 

      await sleep(3 * 1000);
      let status = await web3.eth.getTransactionReceipt(refundTx).status
      assert.equal(status, true);

      // let afterBalance = web3.eth.getBalance(storemanGroupInstanceAddress)
      // console.log(colors.green('[INFO] storemanGroupInstance After Balance: ', afterBalance))
      // assert.equal(afterBalance-beforeBalance, deposit)
    }

    let bider = await storemanGroupInstance.mapDepositorInfo(sender)
    console.log(colors.blue('[INFO] sender deposit: ', bider[0].toNumber()))

  })

  it('[StoremanGroup_handleSmgStaking] should succeed in case of valid account with valid deposit array during staking', async () => {
   
    for(let i = 0; i < depositAccountsArray.length; i++){
      let deposit = web3.toWei((minSmgStakingDeposit * 15 - ((minSmgStakingDeposit * 15) % (i+1)))) / (i+1)
      console.log(colors.blue('[INFO] depositor: ', depositAccountsArray[i]))
      console.log(colors.blue('[INFO] deposit: ', deposit))

      // let beforeBalance = web3.eth.getBalance(storemanGroupInstanceAddress)
      // console.log(colors.green('[INFO] storemanGroupInstance Before Balance: ', beforeBalance)) 
      
      let refundTx = await web3.eth.sendTransaction({from: depositAccountsArray[i], to:storemanGroupInstanceAddress, value: deposit, gas: 500000}) 
     
      await sleep(3 * 1000);
      let status = await web3.eth.getTransactionReceipt(refundTx).status
      assert.equal(status, true);   

      // let afterBalance = web3.eth.getBalance(storemanGroupInstanceAddress)
      // console.log(colors.green('[INFO] storemanGroupInstance After Balance: ', afterBalance))
      // assert.equal(afterBalance-beforeBalance, deposit)      

      let bider = await storemanGroupInstance.mapDepositorInfo(depositAccountsArray[i])   
      console.log(colors.blue('[INFO] deposit: ', bider[0].toNumber()))
    }
  })


  // StoremanGroup_setSmgStakerInfo: to set finally stake list 
  it('[StoremanGroup_setSmgStakerInfo] should fail in case of staking time is not over', async () => {
    let retError

    try {
      await storemanGroupInstance.setSmgStakerInfo(stakerArray,{from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })
 

  it('[StoremanGroup_setSmgStakerInfo] should fail in case of non owner', async () => {
    console.log(colors.green('[INFO] StoremanGroup_setSmgStakerInfo  sleep for : ', STAKING_DURING_TIME))
    await sleep(STAKING_DURING_TIME * 1000);    

    let now = (Date.now() - Date.now()%1000)/1000;
    console.log('[INFO] current time: ', now)
    let stakeEndTime = await storemanGroupInstance.stakingEndTime()
    console.log('[INFO] staking End time: ', stakeEndTime)

    let retError
    try {
      await storemanGroupInstance.setSmgStakerInfo(stakerArray,{from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgStakerInfo] should fail in case of invalid depositor with empty address', async () => {
    let retError
    // to prepare staker list
    let tempStakerArray = []
    tempStakerArray.push('0x0000000000000000000000000000000000000000')  

    try {
      await storemanGroupInstance.setSmgStakerInfo(tempStakerArray,{from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgStakerInfo] should succeed in case of valid owner and valid depositor', async () => {

    let fullStaker = await storemanGroupInstance.isReachedMaxDeposit()
    assert.equal(fullStaker, false)

    ret = await storemanGroupInstance.setSmgStakerInfo(stakerArray,{from: owner})

    for(let i = 0; i < stakerArray.length; i++){
      let bider = await storemanGroupInstance.mapDepositorInfo(stakerArray[i])
      console.log(colors.blue('[INFO] staker: ', stakerArray[i]))
      console.log(colors.blue('[INFO] deposit: ', bider[0].toNumber()))
      console.log(colors.blue('[INFO] quota: ', bider[2].toNumber()))
      console.log(colors.blue('[INFO] rank: ', bider[1].toNumber()))
    }

    fullStaker = await storemanGroupInstance.isReachedMaxDeposit()
    assert.equal(fullStaker, true)

  })

  it('[StoremanGroup_setSmgStakerInfo] should fail while smg has Reached Max Deposit', async () => {
    let retError

    // to prepare staker list
    let tempStakerArray = []
    tempStakerArray.push(bid5)
    tempStakerArray.push(bid6)

    try {
      await storemanGroupInstance.setSmgStakerInfo(tempStakerArray,{from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  /////////////////////////////////////////
  // storemanGroup lottery unit testing  //
  /////////////////////////////////////////
  //StoremanGroup_injectLotteryBonus: to injuect lottery bonus
  it('[StoremanGroup_injectLotteryBonus] should fail in case of invalid lotter num', async () => {
    let retError
    try {
      await storemanGroupInstance.injectLotteryBonus(0, {from: sender, value: web3.toWei(lotteryBonus)})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_injectLotteryBonus] should fail in case of invalid lottery bonus', async () => {
    let retError
    try {
      await storemanGroupInstance.injectLotteryBonus(lotteryNum, {from: sender, value: 0})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_injectLotteryBonus] should succeed to inject lottery bonus', async () => {

    ret = await storemanGroupInstance.injectLotteryBonus(lotteryNum, {from: owner, value: web3.toWei(lotteryBonus), gas: 500000})
    // assert.web3Event(ret, {
    //   event: 'StoremanGroupInjectLotteryBonusLogger',
    //   args: {
    //     _foundationAddr: sender,
    //     _bonus: parseInt(web3.toWei(lotteryBonus)),
    //     _totalLotterBonus: parseInt(await storemanGroupInstance.totalLotteryBonus()),
    //     _lotterNum: lotteryNum
    //   }
    // })

    let bonus = await storemanLotteryInstance.totalLotteryBonus()
    let num = await storemanLotteryInstance.totalLotterNum()
    console.log('[Info] storemanLotteryInstance.totalLotteryBonus(): ', bonus)
    console.log('[Info] storemanLotteryInstance.totalLotterNum(): ', num)
    assert.equal(bonus, parseInt(web3.toWei(lotteryBonus)))
    assert.equal(num, lotteryNum)
  })

  // StoremanGroup_setSmgLotterInfo: to set lotter info during lottery
  it('[StoremanGroup_setSmgLotterInfo] should fail in case of non-owner', async () => {
    let retError

    let rankBonus = parseInt(web3.toWei(100))
    let rank = parseInt(2)

    try {
      await storemanGroupInstance.setSmgLotterInfo(lotterArray, rankBonus, rank,{from: sender})

    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgLotterInfo] should fail in case of invalid rankBonus', async () => {
    let retError

    let rankBonus = parseInt(web3.toWei(500))
    let rank = parseInt(2)

    try {
      await storemanGroupInstance.setSmgLotterInfo(lotterArray, rankBonus, rank,{from: owner})

    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgLotterInfo] should fail in case of non-lotter object', async () => {
    let retError
    // invalid lotter object: it's a staker object
    // to prepare lotter list
    let rankBonus = parseInt(web3.toWei(1))
    let rank = parseInt(3)

    try {
      await storemanGroupInstance.setSmgLotterInfo(stakerArray, rankBonus, rank,{from: owner})

    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgLotterInfo] should succeed in case of valid lotter object and valid bonus by owner', async () => {

    let rankBonus = parseInt(web3.toWei(50))
    let rank = parseInt(2)

    ret = await storemanGroupInstance.setSmgLotterInfo(lotterArray, rankBonus, rank,{from: owner})

    for(let i = 0; i < lotterArray.length; i++){
        let bider = await storemanGroupInstance.mapDepositorInfo(lotterArray[i])
        console.log(colors.blue('[INFO] staker: ', lotterArray[i]))
        console.log(colors.blue('[INFO] deposit: ', bider[0].toNumber()))
        console.log(colors.blue('[INFO] stakerRank: ', bider[1].toNumber()))
        console.log(colors.blue('[INFO] stakerQuota: ', bider[2].toNumber()))
        console.log(colors.blue('[INFO] stakerBonus: ', bider[3].toNumber()))
        console.log(colors.blue('[INFO] lotterRank: ', bider[4].toNumber()))
        console.log(colors.blue('[INFO] lotterBonus: ', bider[5].toNumber()))
        console.log(colors.blue('[INFO] hasRevoked: ', Boolean(bider[6])))
        console.log(colors.blue('[INFO] bidTimeStamp: ', bider[7].toNumber()))
    }
    // assert.web3Event(ret, [
    //   {
    //   event: 'StoremanGroupLotteryLogger',
    //   args: {
    //     _lotterAddr: lotterArray[0],
    //     _lotterDeposit: parseInt(mapDepositorInfo[lotterArray[0]].deposit),
    //     _lotterBonus: parseInt(mapDepositorInfo[lotterArray[0]].lotterBonus),
    //     _lotterRank: parseInt(mapDepositorInfo[lotterArray[0]].lotterRank)
    //   }},
    //   {
    //   event: 'StoremanGroupLotteryLogger',
    //   args: {
    //     _lotterAddr: lotterArray[1],
    //     _lotterDeposit: parseInt(mapDepositorInfo[lotterArray[1]].deposit),
    //     _lotterBonus: parseInt(mapDepositorInfo[lotterArray[1]].lotterBonus),
    //     _lotterRank: parseInt(mapDepositorInfo[lotterArray[1]].lotterRank)
    //   }},
    //   {
    //   event: 'StoremanGroupLotteryLogger',
    //   args: {
    //     _lotterAddr: lotterArray[2],
    //     _lotterDeposit: parseInt(mapDepositorInfo[lotterArray[2]].deposit),
    //     _lotterBonus: parseInt(mapDepositorInfo[lotterArray[2]].lotterBonus),
    //     _lotterRank: parseInt(mapDepositorInfo[lotterArray[2]].lotterRank)
    //   }}
    // ])

  })

  it('[StoremanGroup_setSmgLotterInfo] should fail in case of object is a invalid lotter object', async () => {
    let retError

    let rankBonus = parseInt(web3.toWei(0.5))
    let rank = parseInt(4)

    try {
      await storemanGroupInstance.setSmgLotterInfo(lotterArray, rankBonus, rank,{from: owner})

    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  // StoremanGroup_finishLottery: finish lottery
  it('[StoremanGroup_finishLottery] should fail in case of non owner', async () => {
    let retError

    try {
      await storemanGroupInstance.finishLottery({from: sender})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_finishLottery] should succeed to add deposit', async () => {

    await storemanGroupInstance.finishLottery({from: owner})
    
    let status = await storemanGroupInstance.scStatus()
    assert.equal(status, SCStatus.Lottery)
  })

  // StoremanGroup_revokeDepositorsAsset: revoke depositors asset
  it('[StoremanGroup_revokeDepositorsAsset] should fail in case of non-owner', async () => {
    let retError
    try {
      await storemanGroupInstance.revokeDepositorsAsset(depositorArray, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_revokeDepositorsAsset] should fail in case of invalid revoker object', async () => {
    let retError
    try {
      // invalid revoke object include : it's a staker object which shouldn't be revoked by now
      await storemanGroupInstance.revokeDepositorsAsset(stakerArray, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_revokeDepositorsAsset] should fail in case of invalid revoker object', async () => {
    let retError
    // invalid revoke object include : it's a object which has been revoked
    try {
      await storemanGroupInstance.revokeDepositorsAsset(lotterArray, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })


  it('[StoremanGroup_revokeDepositorsAsset] should succeed in case of valid lotter object and valid bonus', async () => {

    let beforeDepositSum = await web3.eth.getBalance(storemanGroupInstanceAddress)
    console.log(colors.yellow('[INFO] deposit before :', beforeDepositSum))


    ret = await storemanGroupInstance.revokeDepositorsAsset(depositorArray, {from: owner})

    sleep(2 * 1000)

    let afterDepositSum = await web3.eth.getBalance(storemanGroupInstanceAddress)
    console.log(colors.yellow('[INFO] deposit sum :', beforeDepositSum - afterDepositSum))

    let count = 0

    for(let i = 0; i < depositorArray.length; i++){
      let bider = await storemanGroupInstance.mapDepositorInfo(depositorArray[i])
      console.log(colors.blue('[INFO] staker: ', depositorArray[i]))
      console.log(colors.blue('[INFO] deposit: ', bider[0].toNumber()))
      console.log(colors.blue('[INFO] stakerRank: ', bider[1].toNumber()))
      console.log(colors.blue('[INFO] stakerQuota: ', bider[2].toNumber()))
      console.log(colors.blue('[INFO] stakerBonus: ', bider[3].toNumber()))
      console.log(colors.blue('[INFO] lotterRank: ', bider[4].toNumber()))
      console.log(colors.blue('[INFO] lotterBonus: ', bider[5].toNumber()))
      console.log(colors.blue('[INFO] hasRevoked: ', Boolean(bider[6])))
      console.log(colors.blue('[INFO] bidTimeStamp: ', bider[7].toNumber()))

      count = count +  bider[0].toNumber()
    }

    console.log(colors.yellow('[INFO] count sum :', count))

    // assert.web3Event(ret, {
    //   event: 'DepositorRefeemAssertLogger',
    //   args: {
    //     _depositorAddr: depositorArray[0],
    //     _deposit: parseInt(await storemanGroupInstance.mapDepositorInfo(lotterArray[i]).deposit),
    //     _bonus: parseInt(mapDepositorInfo[depositorArray[0]].lotterBonus)
    //   }
    // })
    // assert.equal(mapDepositorInfo[depositorArray[0]].hasRevoked, true)
  })

  // StoremanGroup_finishDepositorAssetRevoke: inject smg bonus tests
  it('[StoremanGroup_finishDepositorAssetRevoke] should fail in case of non owner', async () => {
    let retError
    try {
      await storemanGroupInstance.finishDepositorAssetRevoke({from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_finishDepositorAssetRevoke] should succeed in case of valid owner', async () => {

    await storemanGroupInstance.finishDepositorAssetRevoke({from: owner})    

    let status =  await storemanGroupInstance.scStatus()
    assert.equal(status, SCStatus.Initial)
  })

  /////////////////////////////////////////
  //   register StoremanGroup tests      //
  /////////////////////////////////////////
  // StoremanGroup_setSmgRunningTime: to set smg running time 

    
  it('[StoremanGroup_setSmgRunningTime] should fail in case of not halt ', async () => {
    let retError
    let now = (Date.now() - Date.now()%1000)/1000;

    try {      
      await storemanGroupInstance.setSmgRunningTime(now + SMG_NAP_TIME, now + SMG_NAP_TIME + RUNNING_DURING_TIME,{from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)

    await setHalt(storemanGroupInstance, true, owner)
  })

  it('[StoremanGroup_setSmgRunningTime] should fail in case of non-owner', async () => {
    let retError
    let now = (Date.now() - Date.now()%1000)/1000;

    try {
      await storemanGroupInstance.setSmgRunningTime(now, now + RUNNING_DURING_TIME,{from: sender})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgRunningTime] should fail in case of invalid timeset', async () => {
    let retError
    let now = (Date.now() - Date.now()%1000)/1000;

    try {
      await storemanGroupInstance.setSmgRunningTime(now + RUNNING_DURING_TIME, now,{from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_setSmgRunningTime] should succeed in case of valid timeset by owner', async () => {
    
    let now = (Date.now() - Date.now()%1000)/1000;    
    
    await storemanGroupInstance.setSmgRunningTime(now + SMG_NAP_TIME, now + SMG_NAP_TIME + RUNNING_DURING_TIME,{from: owner})

    let startTime = await storemanGroupInstance.runningStartTime()
    console.log(colors.green('[INFO] running Start Time: ', startTime))
    let endTime = await storemanGroupInstance.runningEndTime()
    console.log(colors.green('[INFO] running End Time: ', endTime))

    assert.equal(startTime, now + SMG_NAP_TIME)
    assert.equal(endTime, now + SMG_NAP_TIME + RUNNING_DURING_TIME)

    await setHalt(storemanGroupInstance, false, owner)

  })

  // StoremanGroup_applyRegisterSmgToAdmin: to register smg to admin 
  it('[StoremanGroup_applyRegisterSmgToAdmin] should fail in case provided _originalChainAddr address is invalid', async () => {
    let retError
    try {
      await storemanGroupInstance.applyRegisterSmgToAdmin(testTokenAddr, 0, storemanTxFeeRatio, web3.toWei(regDeposit), {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_applyRegisterSmgToAdmin] should fail in case provided _tokenOrigAddr address is invalid', async () => {
    let retError
    try {
      await storemanGroupInstance.applyRegisterSmgToAdmin(0, smgETH, storemanTxFeeRatio, web3.toWei(regDeposit), {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_applyRegisterSmgToAdmin] should fail in case provided token not been supported', async () => {
    let retError
    try {
      await storemanGroupInstance.applyRegisterSmgToAdmin(gnosisTokenAddr, smgETH, storemanTxFeeRatio, web3.toWei(regDeposit), {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_applyRegisterSmgToAdmin] should fail in case deposit is less than minDeposit of the token', async () => {
    let retError
    try {
      await storemanGroupInstance.applyRegisterSmgToAdmin(testTokenAddr, smgETH, storemanTxFeeRatio, web3.toWei(parseInt(regDeposit - 1)),{from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)    
  })

  it('[StoremanGroup_applyRegisterSmgToAdmin] should fail to register in case of non owner', async () => {
    let retError
    try {
      await storemanGroupInstance.applyRegisterSmgToAdmin(testTokenAddr, smgETH, storemanTxFeeRatio, web3.toWei(regDeposit), {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_applyRegisterSmgToAdmin] should register storemanGroup to smg admin', async () => {

    let smgAdmin = await storemanGroupInstance.storemanGroupAdmin()
    assert.equal(smgAdmin, storemanGroupAdminInstanceAddress)

    for(let i = 0; i < tokenArray.length; i++){

      let tokenAddr = tokenArray[i]
      
      let totalSmgDeposit = await storemanGroupInstance.totalSmgDeposit()
      let depositedQuota = await storemanGroupInstance.depositedQuota()

      let status = await storemanGroupInstance.scStatus()
      let balance = await web3.eth.getBalance(storemanGroupInstanceAddress)

      console.log(colors.green('[INFO] totalSmgDeposit: ', totalSmgDeposit))
      console.log(colors.green('[INFO] depositedQuota: ', depositedQuota))
      console.log(colors.green('[INFO] status: ', status))
      console.log(colors.green('[INFO] balance: ', balance))
      console.log(colors.green('[INFO] regDeposit: ', web3.toWei(regDeposit)))

      let tokenInfo = await storemanGroupInstance.mapTokenSmgStatus(tokenAddr)
      console.log(colors.green('[INFO] token status: ', tokenInfo[1].toNumber()))

      // register smgWAN
      ret = await storemanGroupInstance.applyRegisterSmgToAdmin(tokenAddr, smgETH, storemanTxFeeRatio,  web3.toWei(regDeposit), {from: owner, gas: 500000})
      
      assert.web3Event(ret, {
        event: 'StoremanGroupApplyRegisterLogger', 
        args: {
          _smgAmin: storemanGroupAdminInstanceAddress,
          _tokenOrigAddr: tokenAddr,
          _smgRegAddr: smgWAN,
          _originalChainAddr: smgETH,
          _deposit: parseInt(web3.toWei(regDeposit)),
          _txFeeRatio: storemanTxFeeRatio
        }
      })

      console.log(colors.green('[INFO] tokenArray address: ', tokenAddr))
      storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(tokenAddr, smgWAN)
      assert.equal(storemanGroupInfo[0].toNumber(), web3.toWei(regDeposit))
      assert.equal(storemanGroupInfo[1].toString(), smgETH)
      assert.equal(storemanGroupInfo[3].toNumber(), storemanTxFeeRatio)
      assert.equal(storemanGroupInfo[5].toString(), storemanGroupInstanceAddress)
      assert.equal(storemanGroupInfo[6].toNumber(), 0)

      // to check the smg token status
      let smgTokenInfo = await storemanGroupInstance.mapTokenSmgStatus(tokenAddr)
      assert.equal(smgTokenInfo[0].toNumber(), web3.toWei(regDeposit))
      assert.equal(smgTokenInfo[1].toNumber(), SCStatus.Registered)
      assert.equal(smgTokenInfo[2].toNumber(), 0)
    }
  })
      
  it('[StoremanGroup_applyRegisterSmgToAdmin] should fail to make a duplicated registration', async () => {
    let retError
    try {
      await storemanGroupInstance.applyRegisterSmgToAdmin(testTokenAddr, smgETH, storemanTxFeeRatio, web3.toWei(regDeposit), {from: owner, gas: 500000})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  /////////////////////////////////////////
  //   inject smg bonus tests            //
  /////////////////////////////////////////
  it('[StoremanGroup_injectSmgBonus] should fail in case of invalid lottery bonus', async () => {
    let retError
    try {
      await storemanGroupInstance.injectSmgBonus({from: sender, value: 0})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_injectSmgBonus] should succeed to add deposit', async () => {

    ret = await storemanGroupInstance.injectSmgBonus({from: owner, value: web3.toWei(smgBonus)})
    assert.web3Event(ret, {
      event: 'StoremanGroupInjectSmgBonusLogger',
      args: {
        _foundationAddr: owner,
        _bonus: parseInt(web3.toWei(smgBonus)),
        _totalBonus: parseInt(web3.toWei(smgBonus)),
      }
    })    
    
    assert.equal(await storemanGroupInstance.totalBonus(), parseInt(web3.toWei(smgBonus)))
  })

  /////////////////////////////////////////
  // storemanGroup Apply Unregister tests//
  /////////////////////////////////////////
  it('[StoremanGroup_applyUnregisterSmgFromAdmin] should fail while running time is not over', async () => {
    let retError
    try {
      await storemanGroupInstance.applyUnregisterSmgFromAdmin(testTokenAddr, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_applyUnregisterSmgFromAdmin] should fail in case of token not been supported', async () => {

    await sleep((SMG_NAP_TIME + RUNNING_DURING_TIME) * 1000)  

    let retError
    try {
      await storemanGroupInstance.applyUnregisterSmgFromAdmin(gnosisTokenAddr, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_applyUnregisterSmgFromAdmin] should fail in case invoked not by owner', async () => {
    let retError
    try {
      await storemanGroupInstance.applyUnregisterSmgFromAdmin(testTokenAddr, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_withDrawSmgFromAdmin] should fail to invoke this method in case of smg which is still register status', async () => {

    let smgTokenInfo = await storemanGroupInstance.mapTokenSmgStatus(testTokenAddr)
    assert.equal(smgTokenInfo[1].toNumber(), SCStatus.Registered)

    let retError
    try {
      await storemanGroupInstance.withDrawSmgFromAdmin(testTokenAddr, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_applyUnregisterSmgFromAdmin] should succeed to make an unregistration application', async () => {

    for(let i = 0; i < tokenArray.length; i++){
      
      let tokenAddr = tokenArray[i]
      assert.notEqual(tokenArray[1], emptyAddress)
      
      let storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(tokenAddr, smgWAN)

      let smgTokenInfo = await storemanGroupInstance.mapTokenSmgStatus(tokenAddr)
      assert.equal(smgTokenInfo[1].toNumber(), SCStatus.Registered)
      console.log(colors.green('[INFO] token status before unregister: ', smgTokenInfo[1].toNumber()))

      ret = await storemanGroupInstance.applyUnregisterSmgFromAdmin(tokenAddr, {from: owner, gas: 500000})
      assert.web3Event(ret, {
        event: 'StoremanGroupApplyUnRegisterLogger',
        args: {
          _smgAmin: storemanGroupAdminInstanceAddress,
          _tokenOrigAddr: tokenAddr,
          _smgRegAddr: smgWAN
        }
      })

      smgTokenInfo = await storemanGroupInstance.mapTokenSmgStatus(tokenAddr)
      assert.equal(smgTokenInfo[1].toNumber(), SCStatus.Unregistered)
      console.log(colors.green('[INFO] token status after unregister: ', smgTokenInfo[1].toNumber()))

      storemanGroupInfo = await storemanGroupAdminInstance.mapStoremanGroup(tokenAddr, smgWAN)
      assert.notEqual(storemanGroupInfo[2].toNumber(), 0)
    }

  })

  /////////////////////////////////////////
  // storemanGroup Withdraw Deposit tests//
  /////////////////////////////////////////  

  it('[StoremanGroup_withDrawSmgFromAdmin] should fail to invoke this method in case of delay time is not over', async () => {

    let retError
    try {
      await storemanGroupInstance.withDrawSmgFromAdmin(testTokenAddr, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_withDrawSmgFromAdmin] should fail to invoke this method in case provided token not been supported', async () => {

    await sleep(withdrawDelayTimeUnit * 1 * 1000)  

    let retError
    try {
      await storemanGroupInstance.withDrawSmgFromAdmin(gnosisTokenAddr, {from: owner})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_withDrawSmgFromAdmin] should fail to invoke this method in case of non owner', async () => {

    let retError
    try {
      await storemanGroupInstance.withDrawSmgFromAdmin(testTokenAddr, {from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_withDrawSmgFromAdmin] should succeed to unregister and withdraw deposit, including penalty distribution, through unregisterAndWithdrawDeposit', async () => {

    for(let i = 0; i < tokenArray.length; i++){

      let tokenAddr = tokenArray[i]
      assert.notEqual(tokenArray[1], emptyAddress)

      let StoremanGroupQuota = await quotaLedgerInstance.mapQuota(tokenAddr, smgWAN)
      console.log(colors.green('[INFO] _quota : ', StoremanGroupQuota[0].toNumber()))
      console.log(colors.green('[INFO] _receivable : ', StoremanGroupQuota[1].toNumber()))
      console.log(colors.green('[INFO] _payable : ', StoremanGroupQuota[2].toNumber()))
      console.log(colors.green('[INFO] _debt : ', StoremanGroupQuota[3].toNumber()))

      let beUnregisted = await quotaLedgerInstance.mapUnregistration(tokenAddr, smgWAN)
      console.log(colors.green('[INFO] beUnregisted : ', beUnregisted))

      let smgTokenInfo = await storemanGroupInstance.mapTokenSmgStatus(tokenAddr)
      assert.equal(smgTokenInfo[1].toNumber(), SCStatus.Unregistered)
      console.log(colors.green('[INFO] SCStatus : ', smgTokenInfo[1].toNumber()))

      // make the transaction
      ret = await storemanGroupInstance.withDrawSmgFromAdmin(tokenAddr, {from: owner, gas: 500000})
    
      let newSmgTokenInfo = await storemanGroupInstance.mapTokenSmgStatus(tokenAddr)
      let revokedDeposit = newSmgTokenInfo[2].toNumber();
      console.log(colors.green('[INFO] revokedDeposit : ', revokedDeposit))
      let restDeposit = storemanGroupInstance.depositedQuota()
      console.log(colors.green('[INFO] restDeposit : ', restDeposit))

      // make sure the event been fired and correctly logged
      // assert.web3Event(ret, {
      //   event: 'StoremanGroupRefeemDepositLogger',
      //   args: {
      //     _smgAmin: storemanGroupAdminInstanceAddress,
      //     _tokenOrigAddr: tokenAddr,
      //     _depositRevoked: parseInt(revokedDeposit),
      //     _restDeposit: restDeposit
      //   }
      // })
    
      smgTokenInfo = await storemanGroupInstance.mapTokenSmgStatus(tokenAddr)
      assert.equal(smgTokenInfo[1].toNumber(), SCStatus.Withdrawed)
    }
    
    assert.equal(await storemanGroupInstance.scStatus(), SCStatus.Withdrawed)

  })

  // /////////////////////////////////////////
  // //  revoke depositors asset tests      //
  // ///////////////////////////////////////// 
  it('[StoremanGroup_revokeStakersAsset] should fail in case of non-owner', async () => {
    
    assert.equal(await storemanGroupInstance.scStatus(), SCStatus.Withdrawed)

    let retError
    try {
      await storemanGroupInstance.revokeStakersAsset(stakerArray, {from: sender})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_revokeStakersAsset] should fail in case of invalid revoker object', async () => {
    
    assert.equal(await storemanGroupInstance.scStatus(), SCStatus.Withdrawed)
    let retError
    
    // invalid revoke object include : it's a invalid staker object;
    try {
      await storemanGroupInstance.revokeStakersAsset(lotterArray, {from: owner})

    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_revokeStakersAsset] should succeed in case of valid lotter object and valid bonus', async () => {
    
    assert.equal(await storemanGroupInstance.scStatus(), SCStatus.Withdrawed)

    console.log(colors.green('[INFO] stakers before revoked: '))
    for(let i = 0; i < stakerArray.length; i++){
      let bider = await storemanGroupInstance.mapDepositorInfo(stakerArray[i])
      console.log(colors.blue('[INFO] staker: ', stakerArray[i]))
      console.log(colors.blue('[INFO] deposit: ', bider[0].toNumber()))
      console.log(colors.blue('[INFO] stakerRank: ', bider[1].toNumber()))
      console.log(colors.blue('[INFO] stakerQuota: ', bider[2].toNumber()))
      console.log(colors.blue('[INFO] stakerBonus: ', bider[3].toNumber()))
      console.log(colors.blue('[INFO] lotterRank: ', bider[4].toNumber()))
      console.log(colors.blue('[INFO] lotterBonus: ', bider[5].toNumber()))
      console.log(colors.blue('[INFO] hasRevoked: ', Boolean(bider[6])))
      console.log(colors.blue('[INFO] bidTimeStamp: ', bider[7].toNumber()))
    }
    
    ret = await storemanGroupInstance.revokeStakersAsset(stakerArray, {from: owner})

    console.log(colors.green('[INFO] stakers after revoked: '))
    for(let i = 0; i < stakerArray.length; i++){
      let bider = await storemanGroupInstance.mapDepositorInfo(stakerArray[i])
      console.log(colors.blue('[INFO] staker: ', stakerArray[i]))
      console.log(colors.blue('[INFO] deposit: ', bider[0].toNumber()))
      console.log(colors.blue('[INFO] stakerRank: ', bider[1].toNumber()))
      console.log(colors.blue('[INFO] stakerQuota: ', bider[2].toNumber()))
      console.log(colors.blue('[INFO] stakerBonus: ', bider[3].toNumber()))
      console.log(colors.blue('[INFO] lotterRank: ', bider[4].toNumber()))
      console.log(colors.blue('[INFO] lotterBonus: ', bider[5].toNumber()))
      console.log(colors.blue('[INFO] hasRevoked: ', Boolean(bider[6])))
      console.log(colors.blue('[INFO] bidTimeStamp: ', bider[7].toNumber()))
    }

    // assert.web3Events(ret, [
    //   {
    //   event: 'DepositorRefeemAssertLogger',
    //   args: {
    //     _depositorAddr: stakerArray[0],
    //     _deposit: parseInt(mapDepositorInfo[stakerArray[0]].deposit),
    //     _bonus: parseInt(mapDepositorInfo[stakerArray[0]].stakerBonus)
    //   }},
    //   {
    //   event: 'DepositorRefeemAssertLogger',
    //   args: {
    //     _depositorAddr: stakerArray[1],
    //     _deposit: parseInt(mapDepositorInfo[stakerArray[1]].deposit),
    //     _bonus: parseInt(mapDepositorInfo[stakerArray[1]].stakerBonus)
    //   }},
    //   {
    //   event: 'DepositorRefeemAssertLogger',
    //   args: {
    //     _depositorAddr: stakerArray[2],
    //     _deposit: parseInt(mapDepositorInfo[stakerArray[2]].deposit),
    //     _bonus: parseInt(mapDepositorInfo[stakerArray[2]].stakerBonus)
    //   }},
    //   {
    //   event: 'DepositorRefeemAssertLogger',
    //   args: {
    //     _depositorAddr: stakerArray[3],
    //     _deposit: parseInt(mapDepositorInfo[stakerArray[3]].deposit),
    //     _bonus: parseInt(mapDepositorInfo[stakerArray[3]].stakerBonus)
    //   }}
    // ])

    // assert.equal(mapDepositorInfo[stakerArray[0]].hasRevoked, true)
  })

  it('[StoremanGroup_revokeStakersAsset] should fail in case of invalid object whcih has been revoked', async () => {
    
    assert.equal(await storemanGroupInstance.scStatus(), SCStatus.Withdrawed)
    let retError

    try {
      await storemanGroupInstance.revokeStakersAsset(stakerArray, {from: owner})
    } catch (e) {
      retError = e
    }

    assert.notEqual(retError, undefined)
  })

  /////////////////////////////////////////
  //  finish Stakers Asset Revoke        //
  ///////////////////////////////////////// 
  it('[StoremanGroup_finishStakersAssetRevoke] should fail in case of non owner', async () => {
    let retError
    try {
      await storemanGroupInstance.finishStakersAssetRevoke({from: sender})
    } catch (e) {
      retError = e
    }
    assert.notEqual(retError, undefined)
  })

  it('[StoremanGroup_finishStakersAssetRevoke] should succeed to add deposit', async () => {

    await storemanGroupInstance.finishStakersAssetRevoke({from: owner})
    
    assert.equal(await storemanGroupInstance.scStatus(), SCStatus.WorkDone)
  })

  /////////////////////////////////////////
  //  to self-destruct                   //
  ///////////////////////////////////////// 
  it('[StoremanGroup_kill] should kill storemanGroup', async () => {
    await setHalt(storemanGroupInstance, true, owner)
    await storemanGroupInstance.kill({from: owner})
  })

})



