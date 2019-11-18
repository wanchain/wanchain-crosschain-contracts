/* global describe it artifacts */
const TestHTLCLib = artifacts.require('TestHTLCLib');

let revokeFeeRatio  = 100;
let ratioPrecise    = 10000;
let lockedTime      = 3600*36;

const x1            = '0x0000000000000000000000000000000000000000000000000000000000000001';
const xHash1        = '0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6';

const x2            = '0x0000000000000000000000000000000000000000000000000000000000000002';
const xHash2        = '0x405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace';

const v1            = 10;
const v2            = 20;

const shdw          = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9';
const storemanPK1    = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9';
const storemanPK2    = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9';

contract('Test HTLCLib', async (accounts) => {
  let testHtlcLib;

  it('initalize test', async() => {
    testHtlcLib = await TestHTLCLib.deployed();
    await testHtlcLib.init();

    let lockedTimeGot    = await testHtlcLib.lockedTime();
    let ratioPreciseGot  = await testHtlcLib.ratioPrecise();
    assert.equal(lockedTimeGot.toNumber(), lockedTime, "The lockedTime do not equal the test props.");
    assert.equal(ratioPreciseGot.toNumber(), ratioPrecise, "The ratioPrecise do not equal the test props.");
  });

  it('setRevokeFeeRatio test', async() => {

    testHtlcLib = await TestHTLCLib.deployed();
    await testHtlcLib.setRevokeFeeRatio(revokeFeeRatio);
    let revokeFeeRatioGot = await testHtlcLib.revokeFeeRatio();
    assert.equal(revokeFeeRatioGot.toNumber(), revokeFeeRatio, "The revokeFeeRatio do not equal the test props.");

  });

  it('getGlobalInfo test', async() => {

    testHtlcLib         = await TestHTLCLib.deployed();

    let revokeFeeRatioGot, ratioPreciseGot;
    let ret             = await testHtlcLib.getGlobalInfo();
    revokeFeeRatioGot   = ret[0];
    ratioPreciseGot     = ret[1];

    assert.equal(revokeFeeRatioGot.toNumber(), revokeFeeRatio, "The revokeFeeRatio do not equal the test props.");
    assert.equal(ratioPreciseGot.toNumber(), ratioPrecise, "The ratioPrecise do not equal the test props.");

  });

  it('addUserTx and getUserTx test', async() => {
    let xHash, value, shadow, storemanPK;
    testHtlcLib         = await TestHTLCLib.deployed();

    xHash = xHash1;
    value = v1;
    shadow = shdw;
    storemanPK = storemanPK1;
    await testHtlcLib.addUserTx(xHash, value, shadow, storemanPK);

    let senderGot, shadowGot, valueGot, storemanPKGot;
    let ret       = await  testHtlcLib.getUserTx(xHash);
    senderGot     = ret[0];
    shadowGot     = ret[1];
    valueGot      = ret[2];
    storemanPKGot = ret[3];

    assert.equal(accounts[0], senderGot, "The sender do not equal the test props.");
    assert.equal(shadow, shadowGot, "The shadow do not equal the test props.");
    assert.equal(value, valueGot, "The value do not equal the test props.");
    assert.equal(storemanPK, storemanPKGot, "The storemanPK do not equal the test props.");

  });

});