/* global describe it artifacts */
const TestHTLCLib = artifacts.require('TestHTLCLib')

contract('Test HTLCLib', async (accounts) => {
  let testHtlcLib;

  it('initalize test', async() => {
    testHtlcLib = await TestHTLCLib.deployed();
    await testHtlcLib.init();

    let lockedTime = await testHtlcLib.lockedTime();
    let ratioPrecise= await testHtlcLib.ratioPrecise();
    assert.equal(lockedTime.toNumber(), 3600*36, "The lockedTime do not equal the test props.");
    assert.equal(ratioPrecise.toNumber(), 10000, "The ratioPrecise do not equal the test props.");
  });

  /*
  it('addUserTx test', async () => {
    // Initalize the proxy with the first delegate version 1.
    await proxy.upgradeTo(delegateV1.address)
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxy = await DelegateV1.at(proxy.address);

    await proxy.setNumberOfOwners(10);
    let numOwnerV1 = await proxy.getNumberOfOwners();
    console.log(numOwnerV1.toNumber())

    // Upgrade to the latest delegate version 2
    proxy = await ProxyContract.deployed()
    await proxy.upgradeTo(delegateV2.address);
    proxy = await DelegateV2.at(proxy.address);

    let previousOwnersState = await proxy.getNumberOfOwners();
    console.log(previousOwnersState.toNumber());

    // Because version two has onlyOwner modifier added, this call will
    //  only work if we are sending it from the owner address
    await proxy.setNumberOfOwners(20, {from:accounts[0]});
    let numOfownersV2 = await proxy.getNumberOfOwners();
    console.log(numOfownersV2.toNumber());
  });
  */
});