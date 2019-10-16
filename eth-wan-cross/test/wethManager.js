const web3 = global.web3
const WETHABI = artifacts.require('./WETH.sol').abi
const WETH = web3.eth.contract(WETHABI)
const WETHManager = artifacts.require('./WETHManager.sol')
require('truffle-test-utils').init()
const singleStoremanGroupQuota = 1000
contract('WETHManager', ([owner, storemanGroupAdmin, HTLCWETH, storemanGroup_One, storemanGroup_Two, sender, recipient]) => {
  // Null address
  const nullAddr = '0x0000000000000000000000000000000000000000'

  let ret,
      WETHManagerInstance,
      WETHManagerInstanceAddr,
      WETHInstance, 
      WETHInstanceAddr,
      storemanGroupRetrieved, 
      totalQuota, 
      quotaRecord,
      singleTotalQuota,
      inboundQuota, 
      outboundQuota, 
      receivable, 
      payable, 
      debt, 
      totalSupply

  before(`Unlock relevant accounts`, async () => {
    await web3.personal.unlockAccount(storemanGroupAdmin, 'wanglu', 99999)
    await web3.personal.unlockAccount(HTLCWETH, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroup_One, 'wanglu', 99999)
    await web3.personal.unlockAccount(storemanGroup_Two, 'wanglu', 99999)
    await web3.personal.unlockAccount(sender, 'wanglu', 99999)
    await web3.personal.unlockAccount(recipient, 'wanglu', 99999)
  })

  it(`[WETHManager-T000]Should deploy WETHManager correctly`, async () => {
    // Deploy WETHManager
    WETHManagerInstance = await WETHManager.new(HTLCWETH, storemanGroupAdmin, { from: owner })
    assert.equal(await WETHManagerInstance.owner(), owner, `[WETHManager-T000]WETHManager's Owner isn't set properly`)
    assert.equal(await WETHManagerInstance.halted(), true, `[WETHManager-T000]WETHManager isn't locked proerly`)
    assert.equal(await WETHManagerInstance.HTLCWETH(), HTLCWETH, `[WETHManager-T000]HTLCWETH isn't locked proerly`)
    assert.equal(await WETHManagerInstance.storemanGroupAdmin(), storemanGroupAdmin, `[WETHManager-T000]StoremanGroupAdmin isn't locked proerly`)
    WETHManagerInstanceAddr = WETHManagerInstance.address
    WETHInstanceAddr = await WETHManagerInstance.WETHToken()
    WETHInstance = WETH.at(WETHInstanceAddr)
  })

  it(`[WETHManager-T001]Should disallow no owner to unhalt`, async () => {
    let unhaltError
    try {
      await WETHManagerInstance.setHalt(false,{from:sender});
    } catch(e) {
      unhaltError = e
    }
    assert.notEqual(unhaltError, undefined, `[WETHManager-T001]Should disallow no owner to unhalt`)
  })

  it(`[WETHManager-T002]Should allow owner to unhalt WETHManager contract`, async () => {
    await WETHManagerInstance.setHalt(false, { from: owner })
    assert.equal(await WETHManagerInstance.halted(), false, `[WETHManager-T004]Failed to unlock WETHManager`)
  })



  it(`[WETHManager-T100]Should disallow no storemanGroupAdmin to register storemanGroup`, async () => {
    let registerError
    try {
      await WETHManagerInstance.registerStoremanGroup(storemanGroup_One, singleStoremanGroupQuota, { from: HTLCWETH })
    } catch (e) {
      registerError = e
    }
    assert.notEqual(registerError, undefined, `[WETHManager-T100]Should disallow no storemanGroupAdmin to register storemanGroup`)
  })  

  it(`[WETHManager-T101]Should reject meaningless storemanGroup address to be registered`, async () => {
    let registerError
    try {
      await WETHManagerInstance.registerStoremanGroup(nullAddr, singleStoremanGroupQuota, { from: storemanGroupAdmin })
    } catch (e) {
      registerError = e
    }
    assert.notEqual(registerError, undefined, `[WETHManager-T101]Should reject meaningless storemanGroup address to be registered`)
  })

  it(`[WETHManager-T102]Should disallow register a sotremanGroup with 0 quota`, async () => {
    let registerError
    try {
      await WETHManagerInstance.registerStoremanGroup(storemanGroup_One, 0, { from: storemanGroupAdmin })
    } catch (e) {
      registerError = e
    }
    assert.notEqual(registerError, undefined, `[WETHManager-T102]Shuld disallow register a sotremanGroup with 0 quota`)
  })

  it(`[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`, async () => {
    let registerError
    await WETHManagerInstance.setHalt(true, { from: owner })
    assert.equal(await WETHManagerInstance.halted(), true, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    try {
      await WETHManagerInstance.registerStoremanGroup(storemanGroup_One, 100, { from: storemanGroupAdmin })
    } catch (e) {
      registerError = e
    }
    assert.notEqual(registerError, undefined, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 0, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    assert.equal(inboundQuota, 0, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    assert.equal(outboundQuota, 0, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    assert.equal(receivable, 0, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    assert.equal(payable, 0, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    assert.equal(debt, 0, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
    assert.equal(await WETHManagerInstance.halted(), false, `[WETHManager-T103]Should fail to register a storemanGroup in case contract is halted`)
  })

  it(`[WETHManager-T104]Should register storemanGroup_One`, async () => {
    await WETHManagerInstance.setHalt(false, { from: owner })
    assert.equal(await WETHManagerInstance.halted(), false)
    ret = await WETHManagerInstance.registerStoremanGroup(storemanGroup_One, 5 * singleStoremanGroupQuota, { from: storemanGroupAdmin })
    totalQuota = (await WETHManagerInstance.getTotalQuota({from: owner})).toNumber()
    assert.equal(totalQuota, 5 * singleStoremanGroupQuota, `[WETHManager-T104]Total quota doesn' match after one storemanGroup registered!`)
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger',
      args: {
        storemanGroup: storemanGroup_One,
        quota: 5 * singleStoremanGroupQuota,
        totalQuota: totalQuota
      }
    }, `StoremanGroupRegistrationLogger is fired!`)
  })

  it(`[WETHManager-T105]Should not allow duplicated storemanGroup address registration`, async () => {
    let registerError
    try {
      await WETHManagerInstance.registerStoremanGroup(storemanGroup_One, singleStoremanGroupQuota, { from: storemanGroupAdmin })
    } catch (error) {
      registerError = error
    }
    assert.notEqual(registerError, undefined, '[WETHManager-T105]Error must be thrown!')
  })

  it(`[WETHManager-T106]Should register another storemanGroup`, async () => {
    ret = await WETHManagerInstance.registerStoremanGroup(storemanGroup_Two, singleStoremanGroupQuota, { from: storemanGroupAdmin })
    totalQuota = (await WETHManagerInstance.getTotalQuota({from: owner})).toNumber()
    assert.equal(totalQuota, 6 * singleStoremanGroupQuota, `[WETHManager-T106]Total quota doesn' match after the second storemanGroup added!`)
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger',
      args: {
        storemanGroup: storemanGroup_Two,
        quota: singleStoremanGroupQuota,
        totalQuota: totalQuota
      }
    }, `StoremanGroupRegistrationLogger is fired!`)
  })



  it('[WETHManager-T200]Should disallow storemanGroup_Two make an inbound corsschain transaction', async () => {
    let lockError
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, storemanGroup_Two, 100, { from: HTLCWETH })
    } catch (error) {
      lockError = error
    }
    assert.notEqual(lockError, undefined, '[WETHManager-T200]Should disallow storemanGroup_Two make an inbound corsschain transaction')
  })

  it(`[WETHManager-T201]Should reject meaningless value lock`, async () => {
    let lockError
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, recipient, 0, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T201]Should reject meaningless value lock`)
  })

  it(`[WETHManager-T202]Should disallow no HTLCWETH to lock quota`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, recipient, 100, { from: storemanGroupAdmin })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T202]Should disallow no HTLCWETH to lock quota`)
  })

  it(`[WETHManager-T203]Should reject lock a value larger than storemanGroup's quota`, async () => {
    let lockError
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, recipient, 5 * singleStoremanGroupQuota + 1, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T203]Should reject lock a value larger than storemanGroup's quota`)
  })

  it(`[WETHManager-T204]Should disallow invalid storemanGroup address to conduct the transaction`, async () => {
    let lockError
    try {
      await WETHManagerInstance.lockQuota(sender, recipient, 100, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T204]Should disallow invalid storemanGroup address to conduct the transaction`)
  })

  it(`[WETHManager-T205]Should disallow make quota-lock in case contract is halted`, async () => {
    let lockError
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, recipient, 100, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T205]Should disallow make quota-lock in case contract is halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
  })

  it(`[WETHManager-T206]Shoudld lock 100 WETH from storemanGroup_Two`, async () => {
    await WETHManagerInstance.lockQuota(storemanGroup_Two, sender, 100, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T206]Shoudld lock 100 WETH from storemanGroup_Two`)
    assert.equal(inboundQuota, 900, `[WETHManager-T206]Shoudld lock 100 WETH from storemanGroup_Two`)
    assert.equal(outboundQuota, 0, `[WETHManager-T206]Shoudld lock 100 WETH from storemanGroup_Two`)
    assert.equal(receivable, 100, `[WETHManager-T206]Shoudld lock 100 WETH from storemanGroup_Two`)
    assert.equal(payable, 0, `[WETHManager-T206]Shoudld lock 100 WETH from storemanGroup_Two`)
    assert.equal(debt, 0, `[WETHManager-T206]Shoudld lock 100 WETH from storemanGroup_Two`)
  })

  it(`[WETHManager-T207]Should reject unlocking 0 WETH`, async () => {
    let unlockError 
    try {
      await WETHManagerInstance.unlockQuota(storemanGroup_Two, 0, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T207]Should reject to unlock 0 WETH`)
  })

  it(`[WETHManager-T208]Should reject unlocking amount of WETH larger than receivable`, async () => {
    let unlockError 
    try {
      await WETHManagerInstance.unlockQuota(storemanGroup_Two, 101, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T208]Should reject unlocking amount of WETH larger than receivable`)
  })

  it(`[WETHManager-T209]Should reject unlocking given invalid storemanGroup`, async () => {
    let unlockError 
    try {
      await WETHManagerInstance.unlockQuota(sender, 10, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T209]Should reject unlocking give invalid storemanGroup`)
  })

  it(`[WETHManager-T210]Should reject unlocking given invalid storemanGroup and meaningless value`, async () => {
    let unlockError 
    try {
      await WETHManagerInstance.unlockQuota(sender, 101, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T210]Should reject unlocking given invalid storemanGroup and meaningless value`)
  })

  it(`[WETHManager-T211]Should reject unlocking given invalid storemanGroup and meaningless value from no storemanGroupAdmin`, async () => {
    let unlockError 
    try {
      await WETHManagerInstance.unlockQuota(sender, 101, { from: storemanGroupAdmin })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T211]Should reject unlocking given invalid storemanGroup and meaningless value from no storemanGroupAdmin`)
  })

  it(`[WETHManager-T212]Should fail to unlock quota in case of halted`, async () => {
    let unlockError
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.unlockQuota(storemanGroup_Two, 10, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T212]Should fail to unlock quota in case of halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
  })


  it(`[WETHManager-T213]Should disallow no HTLCWETH to mint token`, async () => {
    let mintError
    try {
      await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 10, { from: storemanGroupAdmin })
    } catch (e) {
      mintError = e
    }
    assert.notEqual(mintError, undefined, `[WETHManager-T213]Should disallow no HTLCWETH to mint token`)
  })

  it(`[WETHManager-T214]Should fail to mint token in case contract halted`, async () => {
    let mintError
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 10, { from: HTLCWETH })
    } catch (e) {
      mintError = e
    }
    assert.notEqual(mintError, undefined, `[WETHManager-T214]Should fail to mint token in case contract halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
  })

  it(`[WETHManager-T215]Should fail to mint token with an invalid storemanGroup address`, async () => {
    let mintError 
    try {
      await WETHManagerInstance.mintToken(sender, recipient, 10, { from: HTLCWETH })
    } catch (e) {
      mintError = e
    }
    assert.notEqual(mintError, undefined, `[WETHManager-T215]Should fail to mint token with an invalid storemanGroup address`)
  })

  it(`[WETHManager-T216]Should fail to mint token to an invalid recipient`, async () => {
    let mintError 
    try {
      await WETHManagerInstance.mintToken(storemanGroup_Two, storemanGroup_One, 10, { from: HTLCWETH })
    } catch (e) {
      mintError = e
    }
    assert.notEqual(mintError, undefined, `[WETHManager-T216]Should fail to mint token to an invalid recipient`)
  })

  it(`[WETHManager-T217]Should fail to mint 0 token to an invalid recipient`, async () => {
    let mintError 
    try {
      await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 0, { from: HTLCWETH })
    } catch (e) {
      mintError = e
    }
    assert.notEqual(mintError, undefined, `[WETHManager-T217]Should fail to mint 0 token to an invalid recipient`)
  })

  it(`[WETHManager-T218]Should fail to mint amount of token larger than receivable`, async () => {
    let mintError
    try {
      await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 1000000, { from: HTLCWETH })
    } catch (e) {
      mintError = e
    }
    assert.notEqual(mintError, undefined, `[WETHManager-T218]Should fail to mint amount of token larger than receivable`)
  })

  it(`[WETHManager-T219]Should mint 75 WETH to the recipient`, async () => {
    ret = (await WETHInstance.totalSupply()).toNumber()
    assert.equal(ret, 0, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 75, { from: HTLCWETH })
    assert.equal((await WETHInstance.balanceOf(recipient)).toNumber(), 75, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    totalSupply = await WETHInstance.totalSupply()
    assert.equal(totalSupply.toNumber(), 75, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    assert.equal(inboundQuota, 900, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    assert.equal(outboundQuota, 75, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    assert.equal(receivable, 25, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    assert.equal(payable, 0, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
    assert.equal(debt, 75, `[WETHManager-T219]Should mint 75 WETH to the recipient`)
  })



  it(`[WETHManager-T300]Should fail to lock token with an invalid storemanGroup provided`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockToken(sender, recipient, 5, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T300]Should fail to lock token with an invalid storemanGroup provided`)
  })

  it(`[WETHManager-T301]Disallow no HTLCWETH to call this function`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockToken(storemanGroup_Two, recipient, 5, { from: storemanGroupAdmin })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T300]Disallow no HTLCWETH to call this function`)
  })

  it(`[WETHManager-T302]Fail to lock token with 0 value input`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockToken(storemanGroup_Two, recipient, 0, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T300]Fail to lock token with 0 value input`)
  })  

  it(`[WETHManager-T303]Should fail to lock token with a storemanGroup who doesn't have enough quota`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockToken(storemanGroup_One, recipient, 1, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T303]Should fail to lock token with a storemanGroup who doesn't have enough quota`)
  })

  it(`[WETHManager-T304]Should disallow a storemanGroup to make an outbound transaction`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockToken(storemanGroup_Two, storemanGroup_One, 10, { from: HTLCWETH }) 
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T304]Should disallow a storemanGroup to make an outbound transaction`)
  })

  it(`[WETHManager-T305]Should fail to lock token in case WETHManager contract is halted`, async () => {
    let lockError
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.lockToken(storemanGroup_Two, recipient, 5, { from: HTLCWETH }) 
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T305]Should fail to lock token in case WETHManager contract is halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
  })

  it(`[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`, async () => {
    await WETHManagerInstance.lockToken(storemanGroup_Two, recipient, 25, { from: HTLCWETH })
    assert.equal((await WETHInstance.balanceOf(recipient)).toNumber(), 50, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    assert.equal((await WETHInstance.balanceOf(HTLCWETH)).toNumber(), 25, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    totalSupply = await WETHInstance.totalSupply()
    assert.equal(totalSupply.toNumber(), 75, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    assert.equal(inboundQuota, 900, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    assert.equal(outboundQuota, 50, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    assert.equal(receivable, 25, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    assert.equal(payable, 25, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
    assert.equal(debt, 75, `[WETHManager-T306]Should lock 25 WETH from recipient to HTLCWETH`)
  })

  

  it(`[WETHManager-T307]Fail to unlock token in case contract is halted`, async () => {
    let unlockError
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.unlockToken(storemanGroup_Two, recipient, 10, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T307]Fail to unlock token in case contract is halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
  })

  it(`[WETHManager-T308]Should disallow no HTLCWETH to unlock token`, async () => {
    let unlockError
    try {
      await WETHManagerInstance.unlockToken(storemanGroup_Two, recipient, 10, { from: storemanGroupAdmin })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T308]Should disallow no HTLCWETH to unlock token`)
  })

  it(`[WETHManager-T309]Should fail to unlock token given value = 0`, async () => {
    let unlockError
    try {
      await WETHManagerInstance.unlockToken(storemanGroup_Two, recipient, 0, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T309]Should disallow no HTLCWETH to unlock token`)
  })

  it(`[WETHManager-T310]Should fail to unlock token given value larger than storemanGroup's payable ability`, async () => {
    let unlockError
    try {
      await WETHManagerInstance.unlockToken(storemanGroup_Two, recipient, 26, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T310]Should fail to unlock token given value larger than storemanGroup's payable ability`)
  })

  it(`[WETHManager-T311]Should fail to unlock token with invalid storemanGroup provided`, async () => {
    let unlockError
    try {
      await WETHManagerInstance.unlockToken(sender, recipient, 1, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T311]Should fail to unlock token with invalid storemanGroup provided`)
  })

  it(`[WETHManager-T312]Should fail to unlock token with a storemanGroup doesn't have enough quota`, async () => {
    let unlockError
    try {
      await WETHManagerInstance.unlockToken(storemanGroup_One, recipient, 1, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T312]Should fail to unlock token with a storemanGroup doesn't have enough quota`)
  })

  it(`[WETHManager-T313]Should fail to unlock token with inproper params`, async () => {
    let unlockError
    try {
      await WETHManagerInstance.unlockToken(storemanGroup_One, recipient, 0, { from: HTLCWETH })
    } catch (e) {
      unlockError = e
    }
    assert.notEqual(unlockError, undefined, `[WETHManager-T313]Should fail to unlock token with inproper params`)
  })

  it(`[WETHManager-T314]Should unlock 10 WETH to sender`, async () => {
    await WETHManagerInstance.unlockToken(storemanGroup_Two, sender, 10, { from: HTLCWETH })
    assert.equal((await WETHInstance.balanceOf(HTLCWETH)).toNumber(), 15, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 10, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    totalSupply = await WETHInstance.totalSupply()
    assert.equal(totalSupply.toNumber(), 75, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    assert.equal(inboundQuota, 900, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    assert.equal(outboundQuota, 60, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    assert.equal(receivable, 25, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    assert.equal(payable, 15, `[WETHManager-T314]Should unlock 10 WETH to sender`)
    assert.equal(debt, 75, `[WETHManager-T314]Should unlock 10 WETH to sender`)
  })

 //  /************************************************************
 //   **
 //   ** Burn token
 //   **
 //   ************************************************************/

   it(`[WETHManager-T315]Should fail to burn token in case contract is halted`, async () => {
    let burnError
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.burnToken(storemanGroup_Two, 1, { from: HTLCWETH })
    } catch (e) {
      burnError = e
    }
    assert.notEqual(burnError, undefined, `[WETHManager-T315]Should fail to burn token in case contract is halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
   })

   it(`[WETHManager-T316]Should disallow no HTLCWETH to burn token`, async () => {
    let burnError
    try {
      await WETHManagerInstance.burnToken(storemanGroup_Two, 1, { from: storemanGroupAdmin })
    } catch (e) {
      burnError = e
    }
    assert.notEqual(burnError, undefined, `[WETHManager-T316]Should fail to burn token in case contract is halted`)
   })

   it(`[WETHManager-T317]Fail to burn 0 WETH`, async () => {
    let burnError
    try {
      await WETHManagerInstance.burnToken(storemanGroup_Two, 0, { from: HTLCWETH })
    } catch (e) {
      burnError = e
    }
    assert.notEqual(burnError, undefined, `[WETHManager-T317]Fail to burn 0 WETH`)
   })

  it(`[WETHManager-T318]Fail to burn WETH larger than storemanGroup’s payable`, async () => {
    let burnError
    try {
      await WETHManagerInstance.burnToken(storemanGroup_Two, 1000, { from: HTLCWETH })
    } catch (e) {
      burnError = e
    }
    assert.notEqual(burnError, undefined, `[WETHManager-T318]Fail to burn WETH larger than storemanGroup’s payable`)
   })

  it(`[WETHManager-T319]Fail to burn WETH given a storemanGroup’s without payable quota`, async () => {
    let burnError
    try {
      await WETHManagerInstance.burnToken(storemanGroup_One, 1, { from: HTLCWETH })
    } catch (e) {
      burnError = e
    }
    assert.notEqual(burnError, undefined, `[WETHManager-T319]Fail to burn WETH given a storemanGroup’s without payable quota`)
   })

  it(`[WETHManager-T320]Fail to burn WETH given an invalid storemanGroup address`, async () => {
    let burnError
    try {
      await WETHManagerInstance.burnToken(sender, 1, { from: HTLCWETH })
    } catch (e) {
      burnError = e
    }
    assert.notEqual(burnError, undefined, `[WETHManager-T320]Fail to burn WETH given an invalid storemanGroup address`)
  })  

  it(`[WETHManager-T321]Fail to burn WETH given wrong params`, async () => {
    let burnError
    try {
      await WETHManagerInstance.burnToken(sender, 0, { from: storemanGroupAdmin })
    } catch (e) {
      burnError = e
    }
    assert.notEqual(burnError, undefined, `[WETHManager-T321]Fail to burn WETH given wrong params`)
  })

  it(`[WETHManager-T322]Should burn token successfully`, async () => {
    await WETHManagerInstance.burnToken(storemanGroup_Two, 10, { from: HTLCWETH })
    assert.equal((await WETHInstance.balanceOf(HTLCWETH)).toNumber(), 5, `[WETHManager-T322]Should burn token successfully`)
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 10, `[WETHManager-T322]Should burn token successfully`)
    totalSupply = await WETHInstance.totalSupply()
    assert.equal(totalSupply.toNumber(), 65, `[WETHManager-T322]Should burn token successfully`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T322]Should burn token successfully`)
    assert.equal(inboundQuota, 910, `[WETHManager-T322]Should burn token successfully`)
    assert.equal(outboundQuota, 60, `[WETHManager-T322]Should burn token successfully`)
    assert.equal(receivable, 25, `[WETHManager-T322]Should burn token successfully`)
    assert.equal(payable, 5, `[WETHManager-T322]Should burn token successfully`)
    assert.equal(debt, 65, `[WETHManager-T322]Should burn token successfully`)
  })

  /// StoremanGroup unregistration

  it(`[WETHManager-T400]Disallow no storemanGroupAdmin to call the function`, async () => {
    let applyError
    try {
      await WETHManagerInstance.applyUnregistration(storemanGroup_Two, { from: HTLCWETH })
    } catch (e) {
      applyError = e
    }
    assert.notEqual(applyError, undefined, `[WETHManager-T400]Disallow no storemanGroupAdmin to call the function`)
  })

  it(`[WETHManager-T401]Disallow to call the function in case contract is halted`, async () => {
    let applyError
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.applyUnregistration(storemanGroup_Two, { from: storemanGroupAdmin })
    } catch (e) {
      applyError = e
    }
    assert.notEqual(applyError, undefined, `[WETHManager-T401]Disallow to call the function in case contract is halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
  })

  it(`[WETHManager-T402]Should reject an ordinary account to apply unregistration`, async () => {
    let applyError
    try {
      await WETHManagerInstance.applyUnregistration(sender, { from: storemanGroupAdmin })
    } catch (e) {
      applyError = e
    }
    assert.notEqual(applyError, undefined, `[WETHManager-T402]Should reject an ordinary account to apply unregistration`)
  })

  it(`[WETHManager-T403]Should apply unregistration successfully`, async () => {
    let ret
    await WETHManagerInstance.applyUnregistration(storemanGroup_Two, { from: storemanGroupAdmin })
    ret = await WETHManagerInstance.isStoremanGroup(storemanGroup_Two)
    assert.equal(ret, true, `[WETHManager-T403]Should apply unregistration successfully`)
    ret = await WETHManagerInstance.isActiveStoremanGroup(storemanGroup_Two)
    assert.equal(ret, false, `[WETHManager-T403]Should apply unregistration successfully`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T403]Should apply unregistration successfully`)
    assert.equal(inboundQuota, 910, `[WETHManager-T403]Should apply unregistration successfully`)
    assert.equal(outboundQuota, 60, `[WETHManager-T403]Should apply unregistration successfully`)
    assert.equal(receivable, 25, `[WETHManager-T403]Should apply unregistration successfully`)
    assert.equal(payable, 5, `[WETHManager-T403]Should apply unregistration successfully`)
    assert.equal(debt, 65, `[WETHManager-T403]Should apply unregistration successfully`)
  })

  it(`[WETHManager-T404]Should fail to call lockQuota with a storemanGroup applied unregistration having receivable not equal to 0 or payable not equal to 0`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, storemanGroup_Two, 1, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T404]Should fail to call lockQuota with a storemanGroup applied unregistration having receivable not equal to 0`)
  })

  it(`[WETHManager-T405]Should reject a duplicated application`, async () => {
    let applyError
    try {
      await WETHManagerInstance.applyUnregistration(storemanGroup_Two, { from: storemanGroupAdmin })
    } catch (e) {
      applyError = e
    }
    assert.notEqual(applyError, undefined, `[WETHManager-T405]Should reject a duplicated application`)
  })

  it(`[WETHManager-T406]Fail to lock inbound quota with a storemanGroup applied unregistration`, async () => {
    let lockError
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_Two, recipient, 1, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T406]Fail to lock inbound quota with a storemanGroup applied unregistration`)
  })

  it(`[WETHManager-T407]Should be Still good to unlock inbound quota with a storemanGroup applied unregistration`, async () => {
    await WETHManagerInstance.unlockQuota(storemanGroup_Two, 1, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T407]Should be Still good to unlock inbound quota with a storemanGroup applied unregistration`)
    assert.equal(inboundQuota, 911, `[WETHManager-T407]Should be Still good to unlock inbound quota with a storemanGroup applied unregistration`)
    assert.equal(outboundQuota, 60, `[WETHManager-T407]Should be Still good to unlock inbound quota with a storemanGroup applied unregistration`)
    assert.equal(receivable, 24, `[WETHManager-T407]Should be Still good to unlock inbound quota with a storemanGroup applied unregistration`)
    assert.equal(payable, 5, `[WETHManager-T407]Should be Still good to unlock inbound quota with a storemanGroup applied unregistration`)
    assert.equal(debt, 65, `[WETHManager-T407]Should be Still good to unlock inbound quota with a storemanGroup applied unregistration`)
  })

  it(`[WETHManager-T408]Should be Still good to mint token with a storemanGroup applied unregistration`, async () => {
    await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 1, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T408]Should be Still good to mint token with a storemanGroup applied unregistration`)
    assert.equal(inboundQuota, 911, `[WETHManager-T408]Should be Still good to mint token with a storemanGroup applied unregistration`)
    assert.equal(outboundQuota, 61, `[WETHManager-T408]Should be Still good to mint token with a storemanGroup applied unregistration`)
    assert.equal(receivable, 23, `[WETHManager-T408]Should be Still good to mint token with a storemanGroup applied unregistration`)
    assert.equal(payable, 5, `[WETHManager-T408]Should be Still good to mint token with a storemanGroup applied unregistration`)
    assert.equal(debt, 66, `[WETHManager-T408]Should be Still good to mint token with a storemanGroup applied unregistration`)
  })
 
  it(`[WETHManager-T409]Fail to lock outbound quota with a storemanGroup applied unregistration`, async () => {
    let lockError
    try {
      await WETHManagerInstance.lockToken(storemanGroup_Two, recipient, 1, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T409]Fail to lock outbound quota with a storemanGroup applied unregistration`)
  })

  it(`[WETHManager-T410]Should be still good to unlock outbound quota with a storemanGroup applied unregistration`, async () => {
    await WETHManagerInstance.unlockToken(storemanGroup_Two, recipient, 1, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T410]Should be still good to unlock outbound quota with a storemanGroup applied unregistration`)
    assert.equal(inboundQuota, 911, `[WETHManager-T410]Should be still good to unlock outbound quota with a storemanGroup applied unregistration`)
    assert.equal(outboundQuota, 62, `[WETHManager-T410]Should be still good to unlock outbound quota with a storemanGroup applied unregistration`)
    assert.equal(receivable, 23, `[WETHManager-T410]Should be still good to unlock outbound quota with a storemanGroup applied unregistration`)
    assert.equal(payable, 4, `[WETHManager-T410]Should be still good to unlock outbound quota with a storemanGroup applied unregistration`)
    assert.equal(debt, 66, `[WETHManager-T410]Should be still good to unlock outbound quota with a storemanGroup applied unregistration`)
  })

  it(`[WETHManager-T411]Should be still good to burn token with a storemanGroup applied unregistration`, async () => {
    await WETHManagerInstance.burnToken(storemanGroup_Two, 1, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T411]Should be still good to burn token with a storemanGroup applied unregistration`)
    assert.equal(inboundQuota, 912, `[WETHManager-T411]Should be still good to burn token with a storemanGroup applied unregistration`)
    assert.equal(outboundQuota, 62, `[WETHManager-T411]Should be still good to burn token with a storemanGroup applied unregistration`)
    assert.equal(receivable, 23, `[WETHManager-T411]Should be still good to burn token with a storemanGroup applied unregistration`)
    assert.equal(payable, 3, `[WETHManager-T411]Should be still good to burn token with a storemanGroup applied unregistration`)
    assert.equal(debt, 65, `[WETHManager-T411]Should be still good to burn token with a storemanGroup applied unregistration`)
  })  

  it(`[WETHManager-T412]Should fail to finish unregistration in case contract is halted`, async () => {
    let unregistrationError 
    await WETHManagerInstance.setHalt(true, { from: owner })
    try {
      await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_Two, { from: storemanGroupAdmin })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T412]Should fail to finish unregistration in case contract is halted`)
    await WETHManagerInstance.setHalt(false, { from: owner })
  })

  it(`[WETHManager-T413]Should disallow no storemanGroupAdmin to call unregisterStoremanGroup`, async () => {
    let unregistrationError 
    try {
      await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_Two, { from: HTLCWETH })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T413]Should disallow no storemanGroupAdmin to call unregisterStoremanGroup`)
  })

  it(`[WETHManager-T414]Should fail with an ordinary account address provided`, async () => {
    let unregistrationError 
    try {
      await WETHManagerInstance.unregisterStoremanGroup(sender, { from: storemanGroupAdmin })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T414]Should fail with an ordinary account address provided`)
  })

  it(`[WETHManager-T415]Should fail with an active storemanGroup's address provided`, async () => {
    let unregistrationError 
    try {
      await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_One, { from: storemanGroupAdmin })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T415]Should fail with an active storemanGroup's address provided`)
  })  

  it(`[WETHManager-T416]Should fail to finish unregistration until receivable, payable and debt are clear`, async () => {
    let unregistrationError
    try {
      await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_Two, { from: storemanGroupAdmin })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T416]Should fail to finish unregistration until clearing receivable, payable and debt`)
  })

  it(`[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`, async () => {
    let unregistrationError
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    await WETHManagerInstance.unlockQuota(storemanGroup_Two, quotaRecord[3].toNumber(), { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`)
    assert.equal(inboundQuota, 935, `[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`)
    assert.equal(outboundQuota, 62, `[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`)
    assert.equal(receivable, 0, `[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`)
    assert.equal(payable, 3, `[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`)
    assert.equal(debt, 65, `[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`)
    try {
      await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_Two, { from: storemanGroupAdmin })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T417]Should fail to finish unregistration until payable and debt are clear`)
  })

  it(`[WETHManager-T418]Should fail to call lockQuota with a storemanGroup applied unregistration having payable not equal to 0`, async () => {
    let lockError 
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, storemanGroup_Two, 1, { from: HTLCWETH })
    } catch (e) {
      lockError = e
    }
    assert.notEqual(lockError, undefined, `[WETHManager-T418]Should fail to call lockQuota with a storemanGroup applied unregistration having receivable not equal to 0`)
  })

  it(`[WETHManager-T419]Should allow storemanGroup to burn token`, async () => {
    await WETHManagerInstance.burnToken(storemanGroup_Two, 2, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T419]Should allow storemanGroup to burn token`)
    assert.equal(inboundQuota, 937, `[WETHManager-T419]Should allow storemanGroup to burn token`)
    assert.equal(outboundQuota, 62, `[WETHManager-T419]Should allow storemanGroup to burn token`)
    assert.equal(receivable, 0, `[WETHManager-T419]Should allow storemanGroup to burn token`)
    assert.equal(payable, 1, `[WETHManager-T419]Should allow storemanGroup to burn token`)
    assert.equal(debt, 63, `[WETHManager-T419]Should allow storemanGroup to burn token`)
  })

  it(`[WETHManager-T420]Should allow someone to unlock token`, async () => {
    await WETHManagerInstance.unlockToken(storemanGroup_Two, recipient, 1, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, singleStoremanGroupQuota, `[WETHManager-T420]Should allow someone to unlock token`)
    assert.equal(inboundQuota, 937, `[WETHManager-T420]Should allow someone to unlock token`)
    assert.equal(outboundQuota, 63, `[WETHManager-T420]Should allow someone to unlock token`)
    assert.equal(receivable, 0, `[WETHManager-T420]Should allow someone to unlock token`)
    assert.equal(payable, 0, `[WETHManager-T420]Should allow someone to unlock token`)
    assert.equal(debt, 63, `[WETHManager-T420]Should allow someone to unlock token`)
  })

  it(`[WETHManager-T421]Should fail to finish unregistration until debt is clear`, async () => {
    let unregistrationError
    try {
      await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_Two, { from: HTLCWETH })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T421]Should fail to finish unregistration until debt is clear`)
  })

  it(`[WETHManager-T422]Should allow a storemanGroup applied unregistration to lock quota from another active storemanGroup`, async () => {
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    debt = quotaRecord[5].toNumber()
    await WETHManagerInstance.lockQuota(storemanGroup_One, storemanGroup_Two, debt - 1, { from: HTLCWETH })
    await WETHManagerInstance.lockQuota(storemanGroup_One, storemanGroup_Two, 1, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_One)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 5 * singleStoremanGroupQuota, `[WETHManager-T422]Should allow a storemanGroup applied unregistration to lock quota from another active storemanGroup`)
    assert.equal(inboundQuota, 5 * singleStoremanGroupQuota - 63, `[WETHManager-T422]Should allow a storemanGroup applied unregistration to lock quota from another active storemanGroup`)
    assert.equal(outboundQuota, 0, `[WETHManager-T422]Should allow a storemanGroup applied unregistration to lock quota from another active storemanGroup`)
    assert.equal(receivable, 63, `[WETHManager-T422]Should allow a storemanGroup applied unregistration to lock quota from another active storemanGroup`)
    assert.equal(payable, 0, `[WETHManager-T422]Should allow a storemanGroup applied unregistration to lock quota from another active storemanGroup`)
    assert.equal(debt, 0, `[WETHManager-T422]Should allow a storemanGroup applied unregistration to lock quota from another active storemanGroup`)
  })

  it(`[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`, async () => {
    ret = await WETHManagerInstance.isStoremanGroup(storemanGroup_Two)
    assert.equal(ret, true, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
    ret = await WETHManagerInstance.mintToken(storemanGroup_One, storemanGroup_Two, 63, { from: HTLCWETH })
    await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_Two, { from: storemanGroupAdmin })
    ret = await WETHManagerInstance.isStoremanGroup(storemanGroup_Two)
    assert.equal(ret, false, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 0, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
    assert.equal(inboundQuota, 0, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
    assert.equal(outboundQuota, 0, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
    assert.equal(receivable, 0, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
    assert.equal(payable, 0, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
    assert.equal(debt, 0, `[WETHManager-T423]Should unregister a storemanGroup successfully after debt is clear`)
  })

  it(`[WETHManager-T424]Register a storemanGroup been unregistered`, async () => {
    ret = await WETHManagerInstance.registerStoremanGroup(storemanGroup_Two, 2 * singleStoremanGroupQuota, { from: storemanGroupAdmin })
    totalQuota = (await WETHManagerInstance.getTotalQuota({from: owner})).toNumber()
    assert.equal(totalQuota, 7 * singleStoremanGroupQuota, `[WETHManager-T006]Total quota doesn' match after the second storemanGroup added!`)
    assert.web3Event(ret, {
      event: 'StoremanGroupRegistrationLogger',
      args: {
        storemanGroup: storemanGroup_Two,
        quota: 2 * singleStoremanGroupQuota,
        totalQuota: totalQuota
      }
    }, `StoremanGroupRegistrationLogger is fired!`)
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T424]Register a storemanGroup been unregistered`)
    assert.equal(inboundQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T424]Register a storemanGroup been unregistered`)
    assert.equal(outboundQuota, 0, `[WETHManager-T424]Register a storemanGroup been unregistered`)
    assert.equal(receivable, 0, `[WETHManager-T424]Register a storemanGroup been unregistered`)
    assert.equal(payable, 0, `[WETHManager-T424]Register a storemanGroup been unregistered`)
    assert.equal(debt, 0, `[WETHManager-T424]Register a storemanGroup been unregistered`)
    ret = await WETHManagerInstance.isStoremanGroup(storemanGroup_Two)
    assert.equal(ret, true, `[WETHManager-T424]Register a storemanGroup been unregistered`)
    ret = await WETHManagerInstance.isActiveStoremanGroup(storemanGroup_Two)
    assert.equal(ret, true, `[WETHManager-T424]Register a storemanGroup been unregistered`)
  })

  it(`[WETHManager-T425]StoremanGroup life cycle test`, async () => {
    let unregistrationError
    await WETHManagerInstance.lockQuota(storemanGroup_Two, recipient, 300, { from: HTLCWETH })
    await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 150, { from: HTLCWETH })
    await WETHManagerInstance.lockToken(storemanGroup_Two, recipient, 50, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(inboundQuota, 2 * singleStoremanGroupQuota - 300, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(outboundQuota, 100, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(receivable, 150, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(payable, 50, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(debt, 150, `[WETHManager-T425]StoremanGroup life cycle test`)
    await WETHManagerInstance.lockQuota(storemanGroup_Two, recipient, 100, { from: HTLCWETH })
    await WETHManagerInstance.applyUnregistration(storemanGroup_Two, { from: storemanGroupAdmin })
    await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 150, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(inboundQuota, 1600, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(outboundQuota, 250, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(receivable, 100, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(payable, 50, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(debt, 300, `[WETHManager-T425]StoremanGroup life cycle test`)
    await WETHManagerInstance.mintToken(storemanGroup_Two, recipient, 100, { from: HTLCWETH })
    await WETHManagerInstance.burnToken(storemanGroup_Two, 50, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(inboundQuota, 1650, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(outboundQuota, 350, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(receivable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(payable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(debt, 350, `[WETHManager-T425]StoremanGroup life cycle test`)
    await WETHManagerInstance.lockQuota(storemanGroup_One, storemanGroup_Two, 1000, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_One)
    singleTotalQuota = quotaRecord[0].toNumber()
    // console.log(singleTotalQuota)
    inboundQuota = quotaRecord[1].toNumber()
    // console.log(inboundQuota)
    outboundQuota = quotaRecord[2].toNumber()
    // console.log(outboundQuota)
    receivable = quotaRecord[3].toNumber()
    // console.log(receivable)
    payable = quotaRecord[4].toNumber()
    // console.log(payable)
    debt = quotaRecord[5].toNumber()
    // console.log(debt)
    assert.equal(singleTotalQuota, 5 * singleStoremanGroupQuota, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(inboundQuota, 3937, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(outboundQuota, 63, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(receivable, 1000, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(payable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(debt, 63, `[WETHManager-T425]StoremanGroup life cycle test`)
    await WETHManagerInstance.mintToken(storemanGroup_One, storemanGroup_Two, 50, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(inboundQuota, 1700, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(outboundQuota, 300, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(receivable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(payable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(debt, 300, `[WETHManager-T425]StoremanGroup life cycle test`)
    await WETHManagerInstance.mintToken(storemanGroup_One, storemanGroup_Two, 100, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(inboundQuota, 1800, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(outboundQuota, 200, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(receivable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(payable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(debt, 200, `[WETHManager-T425]StoremanGroup life cycle test`)
    await WETHManagerInstance.mintToken(storemanGroup_One, storemanGroup_Two, 201, { from: HTLCWETH })
    quotaRecord = await WETHManagerInstance.getStoremanGroup(storemanGroup_Two)
    singleTotalQuota = quotaRecord[0].toNumber()
    inboundQuota = quotaRecord[1].toNumber()
    outboundQuota = quotaRecord[2].toNumber()
    receivable = quotaRecord[3].toNumber()
    payable = quotaRecord[4].toNumber()
    debt = quotaRecord[5].toNumber()
    assert.equal(singleTotalQuota, 2 * singleStoremanGroupQuota, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(inboundQuota, 2000, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(outboundQuota, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(receivable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(payable, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    assert.equal(debt, 0, `[WETHManager-T425]StoremanGroup life cycle test`)
    try {
      await WETHManagerInstance.lockQuota(storemanGroup_One, storemanGroup_Two, 1, { from: HTLCWETH })
    } catch (e) {
      unregistrationError = e
    }
    assert.notEqual(unregistrationError, undefined, `[WETHManager-T425]StoremanGroup life cycle test`)
    await WETHManagerInstance.unregisterStoremanGroup(storemanGroup_Two, { from: storemanGroupAdmin })
    ret = await WETHManagerInstance.isStoremanGroup(storemanGroup_Two)
    assert.equal(ret, false, `[WETHManager-T425]StoremanGroup life cycle test`)
  })

})