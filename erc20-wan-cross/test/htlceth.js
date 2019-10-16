require('truffle-test-utils').init()
const colors = require('colors/safe')
const HTLCETH = artifacts.require('./HTLCETH.sol')
const TestToken = artifacts.require('./TestToken.sol')
const TestTokenABI = artifacts.require('./TestToken.sol').abi
const BigNumber = require('bignumber.js')

const walletAddress = '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38'

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

const HTLCLockedTime = 60 // in seconds
const HTLCRevokeFeeRatio = 400
const GasPrice = 18000000000
const initialAllocatedAmount = 1000
const transferAmount = 10

let testTokenInstance,
    testTokenInstanceAddress,
    HTLCETHInstance,
    HTLCETHInstanceAddress,
    ret,
    RATIO_PRECISE,
    revokeFee,
    beforeBalance,
    afterBalance,
    beforeSCBalance, 
    afterSCBalance

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function setHalt(state, operator) {
    await HTLCETHInstance.setHalt(state, {from: operator})
    assert.equal(await HTLCETHInstance.halted(), state)
}

async function approve(token, owner, spender, amount) {
    await testTokenInstance.approve(spender, web3.toWei(amount), {from: owner})
    await sleep(60 * 1000)
    assert.equal((await token.allowance(owner, spender)).toNumber(), web3.toWei(amount))
}

async function setRevokeFeeRatio(ratio, operator) {
    await HTLCETHInstance.setRevokeFeeRatio(ratio, {from: operator})
    assert.equal((await HTLCETHInstance.revokeFeeRatio()).toNumber(), ratio)
}

async function getBalance(user) {
    return web3.fromWei((await testTokenInstance.balanceOf(user)).toNumber())
}

contract('HTLCETH_UNITs', ([owner, storemanGroupETH, storemanGroupWAN, sender, recipient]) => {
    before(`Unlock relevant accounts`, async () => {
        // unlock relevant accounts
        await web3.personal.unlockAccount(owner, 'wanglu', 99999)
        await web3.personal.unlockAccount(storemanGroupETH, 'wanglu', 99999)
        await web3.personal.unlockAccount(storemanGroupWAN, 'wanglu', 99999)
        await web3.personal.unlockAccount(sender, 'wanglu', 99999)
        await web3.personal.unlockAccount(recipient, 'wanglu', 99999)
        console.log(colors.green('[INFO] storemanGroupETH address: ', storemanGroupETH))        
        console.log(colors.green('[INFO] storemanGroupWAN address: ', storemanGroupWAN))
        console.log(colors.green('[INFO] owner address: ', owner))

        // deploy test token contract
        testTokenInstance = await TestToken.new(sender, walletAddress, walletAddress, web3.toWei(initialAllocatedAmount), {from: owner})
        testTokenInstanceAddress = testTokenInstance.address
        console.log(colors.green('[INFO] test token instance address: ', testTokenInstanceAddress))

        // deploy HTLCETH.sol
        HTLCETHInstance = await HTLCETH.new({from: owner})
        HTLCETHInstanceAddress = await HTLCETHInstance.address
        console.log(colors.green('[INFO] HTLCETHInstanceAddress: ', HTLCETHInstanceAddress))

        // customize locked time
        await HTLCETHInstance.setLockedTime(HTLCLockedTime, {from: owner})
        // assert.equal(await HTLCETHInstance.lockedTime(), HTLCLockedTime)

        // retrieve ratio_precise
        RATIO_PRECISE = (await HTLCETHInstance.RATIO_PRECISE()).toNumber()

        // unhalt relevant contracts
        await setHalt(false, owner)
    })

    /**
     *
     * inboundLock tests
     *
     **/

    it('[HTLCETH_inboundLock] should throw an exception in case Tx value field not 0', async () => {
        let lockError
        try {
            await HTLCETHInstance.inboundLock(testTokenInstanceAddress, xHash1, storemanGroupETH, recipient, web3.toWei(transferAmount), {from: sender, value: web3.toWei(1)})
        } catch (e) {
            lockError = e
        }

        assert.notEqual(lockError, undefined)
    })

    it('[HTLCETH_inboundLock] should fail when contract is halted', async () => {
        let lockError
        await setHalt(true, owner)

        try {
            await HTLCETHInstance.inboundLock(testTokenInstanceAddress, xHash1, storemanGroupETH, recipient, web3.toWei(transferAmount), {from: sender})
        } catch (e) {
            lockError = e
        }

        await setHalt(false, owner)
        assert.notEqual(lockError, undefined)
    })

    it('[HTLCETH_inboundLock] should fail in case token approval isn\'t done in the first place', async ()=> {
        let lockError
        try {
            await HTLCETHInstance.inboundLock(testTokenInstanceAddress, xHash1, storemanGroupETH, recipient, web3.toWei(transferAmount), {from: sender})
        } catch (e) {
            lockError = e
        }

        assert.notEqual(lockError, undefined)
    })

    it('[HTLCETH_inboundLock] should lock correct amount test token', async () => {
        beforeBalance = await testTokenInstance.balanceOf(sender)
        await approve(testTokenInstance, sender, HTLCETHInstanceAddress, transferAmount)
        ret = await HTLCETHInstance.inboundLock(testTokenInstanceAddress, xHash1, storemanGroupETH, recipient, web3.toWei(transferAmount), {from: sender})
        assert.web3Event(ret, {
            event: 'InboundLockLogger', 
            args: {
                user: sender,
                storemanGroup: storemanGroupETH,
                xHash: xHash1,
                value: parseInt(web3.toWei(transferAmount)),
                wanAddr: recipient,
                tokenOrigAddr: testTokenInstanceAddress
            }
        })
        afterBalance = await testTokenInstance.balanceOf(sender)
        assert.equal((beforeBalance.minus(afterBalance)).toNumber(), web3.toWei(transferAmount))
        assert.equal((await testTokenInstance.balanceOf(HTLCETHInstanceAddress)).toNumber(), web3.toWei(transferAmount))
    })

    it('[HTLCETH_inboundLock] should throw an error if outboundRefund is invoked in an inbound Tx', async () => {
        let refundError
        try {
            await HTLCETHInstance.outboundRefund(x1, {from: storemanGroupETH})
        } catch (e) {
            refundError = e
        }
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_inboundLock] should make inboundRevoke fail in case Tx is not timeout', async () => {
        let revokeError
        try {
            await HTLCETHInstance.inboundRevoke(xHash1, {from: sender})
        } catch (e) {
            revokeError = e
        }
        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_inboundLock] should throw an error in case duplicated xHash used when invoking inboundLock', async () => {
        let lockError
        await approve(testTokenInstance, sender, HTLCETHInstanceAddress, transferAmount)
        try {
            await HTLCETHInstance.inboundLock(testTokenInstanceAddress, xHash1, storemanGroupETH, recipient, web3.toWei(transferAmount), {from: sender})
        } catch (e) {
            lockError = e
        }
        assert.notEqual(lockError, undefined)
        await approve(testTokenInstance, sender, HTLCETHInstanceAddress, 0)
    })

    /**
     *
     * inboundRedeem tests
     *
     **/

    it('[HTLCETH_inboundRedeem] should throw an exception in case Tx value field not 0', async () => {
        let refundError
        try {
            await HTLCETHInstance.inboundRedeem(testTokenInstanceAddress, x1, {from: storemanGroupETH, value: web3.toWei(1)})
        } catch (e) {
            refundError = e
        }

        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_inboundRedeem] should fail to do inbound refund in case contract is halted', async () => {
        let refundError
        await setHalt(true, owner)
        try {
            await HTLCETHInstance.inboundRedeem(testTokenInstanceAddress, x1, {from: storemanGroupETH})
        } catch (e) {
            refundError = e
        }

        await setHalt(false, owner)
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_inboundRedeem] should fail in case xHash doesn\'t exist', async () => {
        let refundError
        try {
            await HTLCETHInstance.inboundRedeem(testTokenInstanceAddress, x2, {from: storemanGroupETH})
        } catch (e) {
            refundError = e
        }

        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_inboundRedeem] should fail in case Tx sender doesn\'t match', async () => {
        let refundError
        try {
            await HTLCETHInstance.inboundRedeem(testTokenInstanceAddress, x1, {from: sender})
        } catch (e) {
            refundError = e
        }

        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_inboundRedeem] should fail in case timeout', async () => {
        await sleep((2 * HTLCLockedTime + 10) * 1000)
        let refundError 

        try {
            await HTLCETHInstance.inboundRedeem(testTokenInstanceAddress, x1, {from: storemanGroupETH})
        } catch (e) {
            refundError = e
        }

        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_inboundRedeem] should refund successfully', async () => {
        // inboundLock
        beforeBalance = await testTokenInstance.balanceOf(sender)
        
        await approve(testTokenInstance, sender, HTLCETHInstanceAddress, transferAmount)
        ret = await HTLCETHInstance.inboundLock(testTokenInstanceAddress, xHash2, storemanGroupETH, recipient, web3.toWei(transferAmount), {from: sender})
        assert.web3Event(ret, {
            event: 'InboundLockLogger', 
            args: {
                user: sender,
                storemanGroup: storemanGroupETH,
                xHash: xHash2,
                value: parseInt(web3.toWei(transferAmount)),
                wanAddr: recipient,
                tokenOrigAddr: testTokenInstanceAddress
            }
        })

        afterBalance = await testTokenInstance.balanceOf(sender)
        assert.equal((beforeBalance.minus(afterBalance)).toNumber(), web3.toWei(transferAmount))

        // inboundRedeem
        beforeBalance = await testTokenInstance.balanceOf(storemanGroupETH)
        ret = await HTLCETHInstance.inboundRedeem(testTokenInstanceAddress, x2, {from: storemanGroupETH})
        assert.web3Event(ret, {
            event: 'InboundRedeemLogger',
            args: {
                storemanGroup: storemanGroupETH,
                user: sender,
                xHash: xHash2,
                x: x2,
                tokenOrigAddr: testTokenInstanceAddress
            }
        })

        afterBalance = await testTokenInstance.balanceOf(storemanGroupETH)
        assert.equal(afterBalance - beforeBalance, web3.toWei(transferAmount))
    })

    it('[HTLCETH_inboundRedeem] should fail in case duplicated refund', async () => {
        let refundError

        try {
           await HTLCETHInstance.inboundRedeem(testTokenInstanceAddress, x2, {from: storemanGroupETH})
        } catch (e) {
            refundError = e
        }

        assert.notEqual(refundError, undefined)
    })

    /**
     *
     * inboundRevoke tests
     *
     **/

    it('[HTLCETH_inboundRevoke] should throw an exception in case Tx value field not 0', async () => {
        let revokeError

        try {
            await HTLCETHInstance.inboundRevoke(testTokenInstanceAddress, xHash1, {from: sender, value: web3.toWei(0.001)})
        } catch (e) {
            revokeError = e 
        }

        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_inboundRevoke] should fail to do inbound revoke in case contract is halted', async () => {
        let revokeError
        await setHalt(true, owner)

        try {
            await HTLCETHInstance.inboundRevoke(testTokenInstanceAddress, xHash1, {from: sender})
        } catch (e) {
            revokeError = e
        }

        await setHalt(false, owner)
        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_inboundRevoke] should fail to do inbound revoke in case xHash doesn\'t match', async () => {
        let revokeError

        try {
            await HTLCETHInstance.inboundRevoke(testTokenInstanceAddress, xHash3, {from: sender})
        } catch (e) {
            revokeError = e
        }

        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_inboundRevoke] should fail to do inbound revoke in case sender doesn\'t match', async () => {
        let revokeError

        try {
            await HTLCETHInstance.inboundRevoke(testTokenInstanceAddress, xHash1, {from: recipient})
        } catch (e) {
            revokeError = e
        }

        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_inboundRevoke] should throw an error if outboundRevoke is invoked in an inbound Tx', async () => {
        let revokeError

        try {
            await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash1, {from: sender})
        } catch (e) {
            revokeError = e
        }

        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_inboundRevoke] should revoke smoothly', async () => {
        await setHalt(true, owner)
        await setRevokeFeeRatio(HTLCRevokeFeeRatio, owner)
        await setHalt(false, owner)

        beforeBalance = (await testTokenInstance.balanceOf(sender)).toNumber()

        ret = await HTLCETHInstance.inboundRevoke(testTokenInstanceAddress, xHash1, {from: sender})
        assert.web3Event(ret, {
            event: 'InboundRevokeLogger',
            args: {
                user: sender,
                xHash: xHash1,
                tokenOrigAddr: testTokenInstanceAddress
            }
        })

        await setHalt(true, owner)
        await setRevokeFeeRatio(0, owner)
        await setHalt(false, owner)

        afterBalance = (await testTokenInstance.balanceOf(sender)).toNumber()
        revokeFee = web3.toWei(transferAmount) * HTLCRevokeFeeRatio / RATIO_PRECISE
        assert.equal(parseInt(afterBalance) + parseInt(revokeFee), parseInt(beforeBalance) + parseInt(web3.toWei(transferAmount)))
    })

    /**
     *
     * outboundLock tests
     *
     **/ 

    it('[HTLCETH_outboundLock] should throw an exception in case Tx value field not 0', async () => {
        let lockError 
        try {
            await HTLCETHInstance.outboundLock(testTokenInstanceAddress, xHash4, recipient, web3.toWei(transferAmount), {from: storemanGroupETH, value: web3.toWei(0.1)})
        } catch (e) {
            lockError = e
        }
        assert.notEqual(lockError, undefined)
    })

    it('[HTLCETH_outboundLock] should fail in case contract is halted', async () => {
        let lockError
        await setHalt(true, owner)
        try {
            await HTLCETHInstance.outboundLock(testTokenInstanceAddress, xHash4, recipient,web3.toWei(transferAmount),  {from: storemanGroupETH})
        } catch (e) {
            lockError = e
        }
        await setHalt(false, owner)
        assert.notEqual(lockError, undefined)
    })

    it('[HTLCETH_outboundLock] should outboundLock smoothly', async () => {
        beforeBalance = await getBalance(storemanGroupETH)
        beforeSCBalance = await getBalance(HTLCETHInstanceAddress)

        await approve(testTokenInstance, storemanGroupETH, HTLCETHInstanceAddress, parseFloat(transferAmount/2))
        ret = await HTLCETHInstance.outboundLock(testTokenInstanceAddress, xHash4, recipient, web3.toWei(transferAmount/2), {from: storemanGroupETH})
        assert.web3Event(ret, {
            event: 'OutboundLockLogger', 
            args: {
                storemanGroup: storemanGroupETH,
                user: recipient,
                xHash: xHash4,
                value: parseInt(web3.toWei(transferAmount/2)),
                tokenOrigAddr: testTokenInstanceAddress
            }
        })

        afterBalance = await getBalance(storemanGroupETH)
        afterSCBalance = await getBalance(HTLCETHInstanceAddress)

        assert.equal(parseFloat(beforeBalance - afterBalance), parseFloat(transferAmount/2))
        assert.equal(parseFloat(afterSCBalance - beforeSCBalance), parseFloat(transferAmount/2))        
    })

    it('[HTLCETH_outboundLock] should fail to lock in case xHash already used', async () => {
        let lockError
        try {
            await HTLCETHInstance.outboundLock(testTokenInstanceAddress, xHash4, recipient, web3.toWei(transferAmount), {from: storemanGroupETH})
        } catch (e) {
            lockError = e
        }
        assert.notEqual(lockError, undefined)
    })

    it('[HTLCETH_outboundLock] should throw an error if inboundRefund is invoked in an outbound Tx', async () => {
        let refundError
        try {
            await HTLCETHInstance.inboundRevoke(testTokenInstanceAddress, xHash4, {from: storemanGroupETH})
        } catch (e) {
            refundError = e
        }
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_outboundLock] should fail to revoke before timeline', async () => {
        let revokeError
        try {
            await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash4, {from: storemanGroupETH})
        } catch (e) {
            revokeError = e
        }
        assert.notEqual(revokeError, undefined)
    })

    /**
     *
     * outboundRedeem tests
     *
     **/

    it('[HTLCETH_outboundRedeem] should throw an exception in case Tx value field not 0', async () => {
        let refundError
        try {
            await HTLCETHInstance.outboundRedeem(testTokenInstanceAddress, x4, {from: recipient, value: web3.toWei(0.01)})
        } catch (e) {
            refundError = e
        }
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_outboundRedeem] should fail in case contract is halted', async () => {
        let refundError
        await setHalt(true, owner)
        try {
            await HTLCETHInstance.outboundRedeem(testTokenInstanceAddress, x4, {from: recipient})
        } catch (e) {
            refundError = e
        }
        await setHalt(false, owner)
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_outboundRedeem] should fail in case xHash doesn\'t exist', async () => {
        let refundError
        try {
            await HTLCETHInstance.outboundRedeem(testTokenInstanceAddress, x5, {from: recipient})
        } catch (e) {
            refundError = e
        }
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_outboundRedeem] should fail in case sender is not valid', async () => {
        let refundError
        try {
            await HTLCETHInstance.outboundRedeem(testTokenInstanceAddress, x4, {from: owner})
        } catch (e) {
            refundError = e
        }
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_outboundRedeem] should fail in case timeout', async () => {
        await sleep((HTLCLockedTime + 10)*1000)
        let refundError
        try {
            await HTLCETHInstance.outboundRedeem(testTokenInstanceAddress, x4, {from: recipient})
        } catch (e) {
            refundError = e
        }
        assert.notEqual(refundError, undefined)
    })

    it('[HTLCETH_outboundRedeem] should outbound refund correctly', async () => {
        await approve(testTokenInstance, storemanGroupETH, HTLCETHInstanceAddress, parseFloat(transferAmount/2))
        ret = await HTLCETHInstance.outboundLock(testTokenInstanceAddress, xHash5, recipient, web3.toWei(transferAmount/2), {from: storemanGroupETH})
        assert.web3Event(ret, {
            event: 'OutboundLockLogger', 
            args: {
                storemanGroup: storemanGroupETH,
                user: recipient,
                xHash: xHash5,
                value: parseInt(web3.toWei(transferAmount/2)),
                tokenOrigAddr: testTokenInstanceAddress
            }
        })

        ret = await HTLCETHInstance.outboundRedeem(testTokenInstanceAddress, x5, {from: recipient})
        assert.web3Event(ret, {
            event: 'OutboundRedeemLogger',
            args: {
                user: recipient,
                storemanGroup: storemanGroupETH,
                xHash: xHash5,
                x: x5,
                tokenOrigAddr: testTokenInstanceAddress
            }
        })
    })

    it('[HTLCETH_outboundRedeem] should fail in case of duplicated refund', async () => {
        let refundError
        try {
            await HTLCETHInstance.outboundRedeem(testTokenInstanceAddress, x5, {from: recipient})
        } catch (e) {
            refundError = e
        }
        assert.notEqual(refundError, undefined)
    })

    /**
     *
     * outboundRevoke tests
     *
     **/

    it('[HTLCETH_outboundRevoke] should throw an exception in case Tx value field not 0', async () => {
        let revokeError
        try {
            await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash4, {from: storemanGroupETH, value: web3.toWei(0.01)})
        } catch (e) {
            revokeError = e
        }
        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_outboundRevoke] should throw an exception in case contract is halted', async () => {
        let revokeError
        await setHalt(true, owner)
        try {
            await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash4, {from: storemanGroupETH})
        } catch (e) {
            revokeError = e
        }
        await setHalt(false, owner)
        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_outboundRevoke] should fail in case xHash doesn\'t exist', async () => {
        let revokeError
        try {
            await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash9, {from: storemanGroupETH})
        } catch (e) {
            revokeError = e
        }
        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_outboundRevoke] should fail in case invalid sender', async () => {
        let revokeError
        try {
            await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash4, {from: owner})
        } catch (e) {
            revokeError = e
        }
        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_outboundRevoke] should throw an error if inboundRevoke is invoked in an outbound Tx', async () => {
        let revokeError
        try {
            await HTLCETHInstance.inboundRevoke(testTokenInstanceAddress, xHash4, {from: storemanGroupETH})
        } catch (e) {
            revokeError = e
        }
        assert.notEqual(revokeError, undefined)
    })   

    it('[HTLCETH_outboundRevoke] should revoke successfully', async () => {
        beforeBalance = await getBalance(storemanGroupETH)
        beforeSCBalance = await getBalance(HTLCETHInstanceAddress)
        ret = await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash4, {from: storemanGroupETH})
        assert.web3Event(ret, {
            event: 'OutboundRevokeLogger',
            args: {
                storemanGroup: storemanGroupETH,
                xHash: xHash4,
                tokenOrigAddr: testTokenInstanceAddress
            }
        })
        afterBalance = await getBalance(storemanGroupETH)
        afterSCBalance = await getBalance(HTLCETHInstanceAddress)
    }) 

    it('[HTLCETH_outboundRevoke] should fail in case of duplicated revoke', async () => {
        let revokeError
        try {
            await HTLCETHInstance.outboundRevoke(testTokenInstanceAddress, xHash4, {from: storemanGroupETH})
        } catch (e) {
            revokeError = e
        }
        assert.notEqual(revokeError, undefined)
    })

    it('[HTLCETH_kill] should fail to kill the contract by no contract owner', async () => {
        let killError
        await setHalt(true, owner)
        try {
            await HTLCETHInstance.kill({from: sender})
        } catch (e) {
            killError = e
        }
        await setHalt(false, owner)
        assert.notEqual(killError, undefined)
    })

    it('[HTLCETH_kill] should kill the contract correctly', async () => {
        await setHalt(true, owner)

        ret = await HTLCETHInstance.kill({from: owner})
        assert.equal(ret.receipt.status, '0x1')

        ret = await web3.eth.getCode(HTLCETHInstanceAddress)
        assert.equal(ret, '0x')
    })
})

