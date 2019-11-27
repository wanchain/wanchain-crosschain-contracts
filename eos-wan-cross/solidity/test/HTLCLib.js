const fsPromises = require('fs').promises;
/* global describe it artifacts */
const TestHTLCLib = artifacts.require('TestHTLCLib');

console.log(assert);

let revokeFeeRatio  = 100;
let ratioPrecise    = 10000;
let lockedTime      = 6*1000; //unit: ms

const x1            = '0x0000000000000000000000000000000000000000000000000000000000000001';
const xHash1        = '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5';

const x2            = '0x0000000000000000000000000000000000000000000000000000000000000002';
const xHash2        = '0x9267d3dbed802941483f1afa2a6bc68de5f653128aca9bf1461c5d0a3ad36ed2';

const x3            = '0x0000000000000000000000000000000000000000000000000000000000000003';
const xHash3        = '0xd9147961436944f43cd99d28b2bbddbf452ef872b30c8279e255e7daafc7f946';


const x4            = '0x0000000000000000000000000000000000000000000000000000000000000004';
const xHash4        = '0xe38990d0c7fc009880a9c07c23842e886c6bbdc964ce6bdd5817ad357335ee6f';

const x5            = '0x0000000000000000000000000000000000000000000000000000000000000005';
const xHash5        = '0x96de8fc8c256fa1e1556d41af431cace7dca68707c78dd88c3acab8b17164c47';

const x6            = '0x0000000000000000000000000000000000000000000000000000000000000006';
const xHash6        = '0xd1ec675902ef1633427ca360b290b0b3045a0d9058ddb5e648b4c3c3224c5c68';

const v1            = 10;
const v2            = 20;

const shdw          = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9';
const storemanPK1   = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9';
const storemanPK2   = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebba';

var STATUS = {
  None :      0,
  Locked :    1,
  Refunded :  2,
  Revoked :   3
};
let testHtlcLib;

async function sleep(time){
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  });
}

contract('Test HTLCLib', async (accounts) => {

  it('addUserTx and getUserTx test', async() => {
    let xHash, value, shadow, storemanPK;
    testHtlcLib         = await TestHTLCLib.deployed();

    xHash = xHash1;
    value = v1;
    shadow = shdw;
    storemanPK = storemanPK1;
    //await debug(testHtlcLib.addUserTx(xHash, value, shadow, storemanPK));
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

  it('addSmgTx and getSmgTx test', async() => {
    let xHash, value, storemanPK;
    testHtlcLib         = await TestHTLCLib.deployed();

    xHash               = xHash2;
    value               = v2;
    storemanPK          = storemanPK2;
    await testHtlcLib.addSmgTx(xHash, value, accounts[1], storemanPK);
    //await debug(testHtlcLib.addSmgTx(xHash, value, accounts[1], storemanPK));

    let userAddrGot, valueGot, storemanPKGot;
    let ret       = await  testHtlcLib.getSmgTx(xHash);
    userAddrGot   = ret[0];
    valueGot      = ret[1];
    storemanPKGot = ret[2];

    assert.equal(accounts[1], userAddrGot, "The sender do not equal the test props.");
    assert.equal(value, valueGot, "The value do not equal the test props.");
    assert.equal(storemanPK, storemanPKGot, "The storemanPK do not equal the test props.");

  });

  it('addDebtTx and getDebtTx test', async() => {
    let xHash, value, storemanPK, srcStoremanPK;
    testHtlcLib         = await TestHTLCLib.deployed();

    xHash               = xHash5;
    value               = v2;
    storemanPK          = storemanPK2;
    srcStoremanPK       = storemanPK1;
    await testHtlcLib.addDebtTx(xHash, value, srcStoremanPK, storemanPK);

    let storemanPKGot, srcStoremanPKGot, valueGot;
    let ret             = await  testHtlcLib.getDebtTx(xHash);
    srcStoremanPKGot    = ret[0];
    valueGot            = ret[1];
    storemanPKGot       = ret[2];

    assert.equal(srcStoremanPKGot, srcStoremanPK, "The srcStoremanPK do not equal the test props.");
    assert.equal(value, valueGot, "The value do not equal the test props.");
    assert.equal(storemanPKGot, storemanPK, "The storemanPK do not equal the test props.");

    let statusNew;
    statusNew = await testHtlcLib.getDebtTxStatus(xHash);
    assert.equal(statusNew.toNumber(), STATUS.Locked, "The status do not equal the test props.");
  });

  it('redeemUserTx test', async() => {
    let xHash,x;
    xHash         = xHash1;
    x             = x1;
    testHtlcLib   = await TestHTLCLib.deployed();
    let statusOld = await(testHtlcLib.getUserTxStatus(xHash));
    await testHtlcLib.redeemUserTx(x);
    assert.equal(statusOld.toNumber(), STATUS.Locked, "The status do not equal the test props.");
    let statusNew = await(testHtlcLib.getUserTxStatus(xHash));
    assert.equal(statusNew.toNumber(), STATUS.Refunded, "The status do not equal the test props.");
  });

  it('redeemSmgTx test', async() => {
    let xHash,x;
    xHash         = xHash2;
    x             = x2;
    testHtlcLib   = await TestHTLCLib.deployed();
    let statusOld = await(testHtlcLib.getSmgTxStatus(xHash, {from: accounts[1]}));
    await testHtlcLib.redeemSmgTx(x,{from: accounts[1]});
    assert.equal(statusOld.toNumber(), STATUS.Locked, "The status do not equal the test props.");

    let statusNew = await(testHtlcLib.getSmgTxStatus(xHash, {from: accounts[1]}));
    assert.equal(statusNew.toNumber(), STATUS.Refunded, "The status do not equal the test props.");
  });

  it('redeemDebtTx test', async() => {
    let xHash,x;
    xHash         = xHash5;
    x             = x5;
    testHtlcLib   = await TestHTLCLib.deployed();
    let statusOld = await(testHtlcLib.getDebtTxStatus(xHash));
    await testHtlcLib.redeemDebtTx(x);
    assert.equal(statusOld.toNumber(), STATUS.Locked, "The status do not equal the test props.");

    let statusNew = await(testHtlcLib.getDebtTxStatus(xHash));
    assert.equal(statusNew.toNumber(), STATUS.Refunded, "The status do not equal the test props.");
  });

  it('revokeUserTx test', async() => {
    let xHash, value, shadow, storemanPK;
    testHtlcLib         = await TestHTLCLib.deployed();

    xHash = xHash3;
    value = v1;
    shadow = shdw;
    storemanPK = storemanPK1;
    //await debug(testHtlcLib.addUserTx(xHash, value, shadow, storemanPK));
    await testHtlcLib.addUserTx(xHash, value, shadow, storemanPK);
    console.log("Waiting for invoke......");
    await sleep( 2*lockedTime );
    await testHtlcLib.revokeUserTx(xHash);
    let statusNew = await testHtlcLib.getUserTxStatus(xHash);
    //console.log(statusNew.toNumber());
    assert.equal(statusNew.toNumber(), STATUS.Revoked, "The status do not equal the test props.");
  });

  it('revokeSmgTx test', async() => {
    let xHash, value, storemanPK;
    testHtlcLib         = await TestHTLCLib.deployed();

    xHash               = xHash4;
    value               = v2;
    storemanPK          = storemanPK2;
    await testHtlcLib.addSmgTx(xHash, value, accounts[1], storemanPK);
    console.log("Waiting for invoke......");
    await sleep(lockedTime );
    await testHtlcLib.revokeSmgTx(xHash);
    let statusNew = await testHtlcLib.getSmgTxStatus(xHash);
    assert.equal(statusNew.toNumber(), STATUS.Revoked, "The status do not equal the test props.");
  });

  it('revokeDebtTx test', async() => {
    let xHash, value, storemanPK, srcStoremanPK;
    testHtlcLib         = await TestHTLCLib.deployed();

    xHash               = xHash6;
    value               = v2;
    storemanPK          = storemanPK2;
    srcStoremanPK       = storemanPK1;
    await testHtlcLib.addDebtTx(xHash, value, srcStoremanPK, storemanPK);

    console.log("Waiting for invoke......");
    await sleep(lockedTime);
    await testHtlcLib.revokeDebtTx(xHash);
    let statusNew = await testHtlcLib.getDebtTxStatus(xHash);
    assert.equal(statusNew.toNumber(), STATUS.Revoked, "The status do not equal the test props.");
  });

});