const WETH = artifacts.require('./WETH.sol')
require('truffle-test-utils').init()
const web3 = global.web3
const singleStoremanGroupQuota = 1000
contract('WETH', ([owner, WETHManager, sender, recipient]) => {
  const nullAddr = '0x0000000000000000000000000000000000000000'

  let WETHInstance, 
      WETHInstanceAddr,  
      totalSupply

	before(`Unlock relevant accounts`, async () => {
    await web3.personal.unlockAccount(owner, 'wanglu', 99999)
    await web3.personal.unlockAccount(WETHManager, 'wanglu', 99999)
    await web3.personal.unlockAccount(sender, 'wanglu', 99999)
    await web3.personal.unlockAccount(recipient, 'wanglu', 99999)
	})

  /****************************************************************************
   **
   ** Environment
   **
   ****************************************************************************/
  it(`[WETH-T000]Should deploy WETH correctly`, async () => {
    // Deploy WETH
    WETHInstance = await WETH.new(WETHManager, { from: owner })
    assert.equal(await WETHInstance.owner(), owner, `[WETH-T000]WETH's Owner isn't set properly`)
    WETHInstanceAddr = WETHInstance.address
    assert.equal(await WETHInstance.tokenManager(), WETHManager, `[WETH-T000]WETHManager address isn't null`)
  })

  it(`[WETH-T005]Should return correct token name`, async () => {
    let tokenName = await WETHInstance.name()
    assert.equal(tokenName, 'Wanchain Ethereum Crosschain Token', `[WETH-T005]Should return correct token name`)
  })

  it(`[WETH-T006]Should return correct token symbol`, async () => {
    let tokenSymbol = await WETHInstance.symbol()
    assert.equal(tokenSymbol, 'WETH', `[WETH-T006]Should return correct token symbol`)
  })

  it(`[WETH-T007]Should return correct token decimal`, async () => {
    let tokenDecimal = await WETHInstance.decimals()
    assert.equal(tokenDecimal, 18, `[WETH-T007]Should return correct token decimal`)
  })

  // /****************************************************************************
  //  **
  //  ** Token Mint
  //  **
  //  ****************************************************************************/
  it(`[WETH-T100]Should disallow no WETHManager to mint WETH`, async () => {
    let mintTokenError
    try {
      await WETHInstance.mint(recipient, 1)
    } catch (e) {
      mintTokenError = e
    }
    assert.notEqual(mintTokenError, undefined, `[WETH-T100]Should disallow no WETHManager to mint WETH`)
  })

  it(`[WETH-T101]Should disallow to mint meaningless value of token`, async () => {
    let mintTokenError
    try {
      await WETHInstance.mint(recipient, 0, { from: WETHManager })
    } catch (e) {
      mintTokenError = e
    }
    assert.notEqual(mintTokenError, undefined, `[WETH-T101]Should disallow to mint meaningless token value`)
  })

  it(`[WETH-T102]Should disallow to mint to invalid address`, async () => {
    let mintTokenError
    try {
      await WETHInstance.mint("hello", 10, { from: WETHManager })
    } catch (e) {
      mintTokenError = e
    }
    assert.notEqual(mintTokenError, undefined, `[WETH-T102]Should disallow to mint invalid address`)
  })

  it(`[WETH-T103]Should mint 100 WETH to sender`, async () => {
    let ret = await WETHInstance.mint(sender, 100, { from: WETHManager })
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 100, `[WETH-T103]Should mint 100 WETH to sender`)
    assert.equal((await WETHInstance.totalSupply()).toNumber(), 100, `[WETH-T103]Should mint 100 WETH to sender`)
    assert.web3Event(ret, {
      event: 'TokenMintedLogger',
      args: {
        account: sender,
        value: 100,
        totalSupply: 100
      }
    })
  })

  // /****************************************************************************
  //  **
  //  ** Token Transfer
  //  **
  //  ****************************************************************************/
  it(`[WETH-T200]Should disallow to make a self-lockTo`, async () => {
    let lockToError
    try {
      await WETHInstance.lockTo(sender, sender, 1, { from: WETHManager })
    } catch (e) {
      lockToError = e
    }
    assert.notEqual(lockToError, undefined, `[WETH-T200]Should disallow to make a self-lockTo`)
  })

  it(`[WETH-T201]Should disallow no WETHManager to make a token lockTo`, async () => {
    let lockToError
    try {
      await WETHInstance.lockTo(sender, recipient, 1)
    } catch (e) {
      lockToError = e
    }
    assert.notEqual(lockToError, undefined, `[WETH-T201]Should disallow no WETHManager to make a token lockTo`)
  })

  it(`[WETH-T202]Should disallow to lock meaningless value of token`, async () => {
    let lockToError
    try {
      await WETHInstance.lockTo(sender, recipient, 0, { from: WETHManager })
    } catch (e) {
      lockToError = e
    }
    assert.notEqual(lockToError, undefined, `[WETH-T202]Should disallow to lock meaningless value of token`)
  })

  it(`[WETH-T203]Should make a successful lock of 50 WETH from sender to recipient`, async () => {
    let ret = await WETHInstance.lockTo(sender, recipient, 50, { from: WETHManager })
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 50, `[WETH-T203]Should make a successful lock of 50 WETH from sender to recipient`)
    assert.equal((await WETHInstance.balanceOf(recipient)).toNumber(), 50, `[WETH-T203]Should make a successful lock of 50 WETH from sender to recipient`)
    assert.equal((await WETHInstance.totalSupply()).toNumber(), 100, `[WETH-T203]Should make a successful lock of 50 WETH from sender to recipient`)
    assert.web3Event(ret, {
      event: 'TokenLockedLogger',
      args: {
        from: sender,
        to: recipient, 
        value: 50
      }
    })
  })

  // /****************************************************************************
  //  **
  //  ** Token Burn
  //  **
  //  ****************************************************************************/
  it(`[WETH-T300]Should disallow no WETHManager burn token`, async () => {
    let tokenBurnError 
    try {
      await WETHInstance.burn(sender, 25)
    } catch (e) {
      tokenBurnError = e
    }
    assert.notEqual(tokenBurnError, undefined, `[WETH-T300]Should disallow no WETHManager burn token`)
  })

  it(`[WETH-T301]Should disallow to burn meaningless value of token`, async () => {
    let tokenBurnError
    try {
      await WETHInstance.burn(sender, 0, { from: WETHManager })
    } catch (e) {
      tokenBurnError = e
    }
    assert.notEqual(tokenBurnError, undefined, `[WETH-T301]Should disallow to burn meaningless value of token`)
  })

  it(`[WETH-T302]Should failed to burn an amount of token larger than token owner's balance`, async () => {
    let balance = (await WETHInstance.balanceOf(sender)).toNumber()
    let tokenBurnError 
    try {
      await WETHInstance.burn(sender, balance + 1, { from: WETHManager })
    } catch(e) {
      tokenBurnError = e
    }
    assert.notEqual(tokenBurnError, undefined, `[WETH-T302]Should failed to burn an amount of token larger than totalSupply`)
  })

  it(`[WETH-T303]Should burn 25 WETH from both sender and recipient`, async () => {
    let ret
    ret = await WETHInstance.burn(sender, 25, { from: WETHManager })
    assert.web3Event(ret, {
      event: 'TokenBurntLogger',
      args: {
        account: sender,
        value: 25,
        totalSupply: 75
      }
    })
    ret = await WETHInstance.burn(recipient, 25, { from: WETHManager })
    assert.web3Event(ret, {
      event: 'TokenBurntLogger',
      args: {
        account: recipient,
        value: 25,
        totalSupply: 50
      }
    })
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 25, `[WETH-T303]Should burn 25 WETH from both sender and recipient`)
    assert.equal((await WETHInstance.balanceOf(recipient)).toNumber(), 25, `[WETH-T303]Should burn 25 WETH from both sender and recipient`)
    assert.equal((await WETHInstance.totalSupply()).toNumber(), 50, `[WETH-T303]Should burn 25 WETH from both sender and recipient`)
  })
  it(`[WETH-T304]Should correctly make normal transfer between sender and recipient`, async () => {
    let transferError
    ret = await WETHInstance.transfer(recipient, 5, { from: sender })
    assert.web3Event(ret, {
      event: 'Transfer',
      args: {
        _from: sender,
        _to: recipient, 
        _value: 5
      }
    })
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 20, `[WETH-T304]Should correctly make normal transfer between sender and recipient`)
    assert.equal((await WETHInstance.balanceOf(recipient)).toNumber(), 30, `[WETH-T304]Should correctly make normal transfer between sender and recipient`)
    ret = await WETHInstance.transfer(sender, 30, { from: recipient })
    assert.web3Event(ret, {
      event: 'Transfer',
      args: {
        _from: recipient,
        _to: sender, 
        _value: 30
      }
    })
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 50, `[WETH-T304]Should correctly make normal transfer between sender and recipient`)
    assert.equal((await WETHInstance.balanceOf(recipient)).toNumber(), 0, `[WETH-T304]Should correctly make normal transfer between sender and recipient`)
    
    ret = await WETHInstance.transfer(sender, 1, { from: recipient })
    assert.equal(ret.receipt.status, '0x1', `[WETH-T304]Should correctly make normal transfer between sender and recipient`)
    assert.equal((await WETHInstance.balanceOf(sender)).toNumber(), 50, `[WETH-T304]Should correctly make normal transfer between sender and recipient`)
    assert.equal((await WETHInstance.balanceOf(recipient)).toNumber(), 0, `[WETH-T304]Should correctly make normal transfer between sender and recipient`)
  })

})