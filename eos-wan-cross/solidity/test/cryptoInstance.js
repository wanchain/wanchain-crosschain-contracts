const lib = require("./lib");
const utils = require("./utils");

/* global describe it artifacts */
const Secp256k1 = artifacts.require('Secp256k1.sol');
const SchnorrVerifier = artifacts.require('SchnorrVerifier.sol');
const commonLib = artifacts.require('commonLib.sol');
const TestCryptoInstance = artifacts.require('TestCryptoInstance.sol')

function getInfo() {
  return {
    /* 0x41b983b133eb591b0bdf6b21c2bb92ecfe034576cbae3c45bab24f07dc9e075d */
    hashMsg: "0x" + utils.sha256(Buffer.from("00000000000000000000000000000000000000000000000000000000000000a0cb326a3a8f5f082e7a73600f47fcd1b6f2db70803f732aa953939af3bb927831000000000000000000000000393e86756d8d4cf38493ce6881eb3a8f2966bb27000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000001401800000c2656f73696f2e746f6b656e3a454f530000000000000000000000000000000000000000000000000000000000000000000000000000000000000041042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c34161900000000000000000000000000000000000000000000000000000000000000", "hex")),
    R: "0x042c73b8cbc70bb635922a60f5eb9e6dcae637bbb05869fa5a4134f0c5ec859c0462696cd577c419666045ec6310a85f6638532d8d23cdbc2006a60dc3fbbada7e",
    s: "0x0c595b48605562a1a6492540b875da4ff203946a9dd0e451cd33d06ef568626b",
    PK: "0x042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c341619",
  };
}

function getInvalidInfo() {
  return {
    /* 0x41b983b133eb591b0bdf6b21c2bb92ecfe034576cbae3c45bab24f07dc9e075d */
    hashMsg: "0x" + utils.keccak(Buffer.from("00000000000000000000000000000000000000000000000000000000000000a0cb326a3a8f5f082e7a73600f47fcd1b6f2db70803f732aa953939af3bb927831000000000000000000000000393e86756d8d4cf38493ce6881eb3a8f2966bb27000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000001401800000c2656f73696f2e746f6b656e3a454f530000000000000000000000000000000000000000000000000000000000000000000000000000000000000041042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c34161900000000000000000000000000000000000000000000000000000000000000", "hex")),
    R: "0x042c73b8cbc70bb635922a60f5eb9e6dcae637bbb05869fa5a4134f0c5ec859c0462696cd577c419666045ec6310a85f6638532d8d23cdbc2006a60dc3fbbada7e",
    s: "0x0c595b48605562a1a6492540b875da4ff203946a9dd0e451cd33d06ef568626b",
    PK: "0x042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c341619",
  };
}

async function deploy(sol, address) {
  let contract;
  if (!await sol.isDeployed()) {
    contract = await utils.deployContract(sol, { from: address });
  } else {
    contract = await utils.contractAt(sol, sol.address);
  }
  lib.assertExists(contract);
  return contract;
}

async function initContracts(accounts) {
  lib.assertExists(Secp256k1);
  lib.assertExists(SchnorrVerifier);
  lib.assertExists(commonLib);
  lib.assertExists(TestCryptoInstance);

  let LibNameDict = {
    "Secp256k1": "Secp256k1",
    "SchnorrVerifier": "SchnorrVerifier",
    "commonLib": "commonLib",
  }

  let LibAddrDict = {}

  let sender = accounts[0];
  // console.log("sender=>", sender);

  let secp256k1 = await deploy(Secp256k1, sender);
  // console.log("Secp256k1 success =>", secp256k1.address);
  lib.assertExists(secp256k1);
  LibAddrDict[LibNameDict.Secp256k1] = secp256k1.address;

  // utils.linkLibrary(SchnorrVerifier, Secp256k1);
  utils.linkLibrary(SchnorrVerifier, LibNameDict.Secp256k1, LibAddrDict.Secp256k1);
  // console.log("SchnorrVerifier link Secp256k1 success");
  let schnorr = await deploy(SchnorrVerifier, sender);
// console.log("SchnorrVerifier success =>", schnorr.address);
  lib.assertExists(schnorr);
  LibAddrDict[LibNameDict.SchnorrVerifier] = schnorr.address;

  utils.linkLibrary(SchnorrVerifier, LibNameDict.SchnorrVerifier, LibAddrDict.SchnorrVerifier);
  // utils.linkLibrary(commonLib, SchnorrVerifier);
  // console.log("commonLib link SchnorrVerifier success");
  let common = await deploy(commonLib, sender);
// console.log("commonLib success =>", common.address);
  lib.assertExists(common);
  LibAddrDict[LibNameDict.commonLib] = common.address;

  utils.linkMultiLibrary(TestCryptoInstance, LibAddrDict);
  // console.log("TestCryptoInstance link libs success");
  let testCryptoInstance = await deploy(TestCryptoInstance, sender);
// console.log("TestCryptoInstance success =>", testCryptoInstance.address);
  lib.assertExists(testCryptoInstance);

  return testCryptoInstance;
}

contract('CryptoInstance', async (accounts) => {
  let testCryptoInstance;
  before("init contracts", async() => {
    testCryptoInstance = await initContracts(accounts);
  });

  it ('storeman lock, it should success', async() => {
    let info = {
      tokenOrigAccount: "0x01800000c2656f73696f2e746f6b656e3a454f53",
      // xHash: "0xcb326a3a8f5f082e7a73600f47fcd1b6f2db70803f732aa953939af3bb927830",
      xHash: "0xcb326a3a8f5f082e7a73600f47fcd1b6f2db70803f732aa953939af3bb927831",
      wanAddr:"0x393e86756d8d4cf38493ce6881eb3a8f2966bb27",
      value: 9,

      storemanGroupPK: "0x042c672cbf9858cd77e33f7a1660027e549873ce25caffd877f955b5158a50778f7c852bbab6bd76eb83cac51132ccdbb5e6747ef6732abbb2135ed0da1c341619",
      R: "0x042c73b8cbc70bb635922a60f5eb9e6dcae637bbb05869fa5a4134f0c5ec859c0462696cd577c419666045ec6310a85f6638532d8d23cdbc2006a60dc3fbbada7e",
      s: "0x0c595b48605562a1a6492540b875da4ff203946a9dd0e451cd33d06ef568626b",
    };

    try {
    console.log(await testCryptoInstance.inSmgLock.call(info.tokenOrigAccount, info.xHash, info.wanAddr, info.value,
        info.storemanGroupPK, info.R, info.s));
    } catch (err) {
      lib.assertFail(err);;
    }
  });

  it('verify valid message with the right PK and R and s, it should success', async () => {
    let info = getInfo();
    // console.log(info.hashMsg);
    try {
      await testCryptoInstance.verifySignature(info.hashMsg, info.PK, info.R, info.s, {from: accounts[1]});
    } catch (err) {
      lib.assertFail(err);;
    }
  });

  // it('verify invalid message with PK and R and s, it should throw error', async () => {
  //   let info = getInvalidInfo();
  //   try {
  //     // console.log(info.hashMsg);
  //     await testCryptoInstance.verifySignature(info.hashMsg, info.PK, info.R, info.s, {from: accounts[1]});
  //     lib.assertFail("verify invalid message with PK and R and s, it should throw error");
  //   } catch (err) {
  //     // console.log(JSON.stringify(err), typeof(err));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertInclude(err.message, "Signature verification failed", err);
  //   }
  // });
});