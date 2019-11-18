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

  it('setRevokeFeeRatio test', async() => {
    let revokeFeeRatio = 100;
    testHtlcLib = await TestHTLCLib.deployed();
    await testHtlcLib.setRevokeFeeRatio(revokeFeeRatio);
    let revokeFeeRatioGot = await testHtlcLib.revokeFeeRatio();
    assert.equal(revokeFeeRatioGot.toNumber(), revokeFeeRatio, "The revokeFeeRatio do not equal the test props.");

  });

  it('getGlobalInfo test', async() => {
    let revokeFeeRatio = 100;
    let ratioPrecise = 10000;
    testHtlcLib = await TestHTLCLib.deployed();

    let revokeFeeRatioGot, ratioPreciseGot;
    let ret = await testHtlcLib.getGlobalInfo();
    revokeFeeRatioGot = ret[0];
    ratioPreciseGot = ret[1];

    assert.equal(revokeFeeRatioGot.toNumber(), revokeFeeRatio, "The revokeFeeRatio do not equal the test props.");
    assert.equal(ratioPreciseGot.toNumber(), ratioPrecise, "The ratioPrecise do not equal the test props.");

  });

});