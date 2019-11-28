const lib = require("./lib");
const utils = require("./utils");

/* global describe it artifacts */
const TestBasicStorage = artifacts.require('TestBasicStorage.sol')

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
  let sender = accounts[0];
  lib.assertExists(TestBasicStorage);

  let testBasicStorage = await deploy(TestBasicStorage, sender);
  lib.assertExists(testBasicStorage);

  return testBasicStorage;
}

contract('BasicStorage', async (accounts) => {
  let testBasicStorage;
  before("init contracts", async() => {
    testBasicStorage = await initContracts(accounts);
  });

  it ('set/get/delete uint data, it should success', async() => {
    let uintData = "99999999";
    try {
      let key = await web3.utils.hexToBytes(await web3.utils.toHex("testData"));
      let innerkey = await web3.utils.hexToBytes(await web3.utils.toHex("uintData"));

      await testBasicStorage.setUintData(key, innerkey, uintData);
      let data = await testBasicStorage.getUintData.call(key, innerkey);
      lib.assertCommonEqual(uintData, data.toString(10));

      await testBasicStorage.delUintData(key, innerkey);
      data = await testBasicStorage.getUintData.call(key, innerkey);
      lib.assertNotDeepEqual(uintData, data.toString(10));
    } catch (err) {
      lib.assertFail(err);
    }
  });

  it ('set out of range uint data, it should throw error', async() => {
    let uintData = "999999999999999999999999999999999999";
    try {
      let key = await web3.utils.hexToBytes(await web3.utils.toHex("testData"));
      let innerkey = await web3.utils.hexToBytes(await web3.utils.toHex("uintData"));

      await testBasicStorage.setUintData(key, innerkey, uintData);
    } catch (err) {
      lib.assertFail(err);
    }
  });

  it ('set/get/delete bool data, it should success', async() => {
    let boolData = true;
    try {
      let key = await web3.utils.hexToBytes(await web3.utils.toHex("testData"));
      let innerkey = await web3.utils.hexToBytes(await web3.utils.toHex("boolData"));

      await testBasicStorage.setBoolData(key, innerkey, boolData);
      let data = await testBasicStorage.getBoolData.call(key, innerkey);
      lib.assertCommonEqual(boolData, data);
      await testBasicStorage.delBoolData(key, innerkey);
      data = await testBasicStorage.getBoolData.call(key, innerkey);
      lib.assertNotDeepEqual(boolData, data);
    } catch (err) {
      lib.assertFail(err);
    }
  });

  it ('set/get/delete address data, it should success', async() => {
    let addressData = accounts[0];
    try {
      let key = await web3.utils.hexToBytes(await web3.utils.toHex("testData"));
      let innerkey = await web3.utils.hexToBytes(await web3.utils.toHex("addressData"));

      await testBasicStorage.setAddressData(key, innerkey, addressData);
      let data = await testBasicStorage.getAddressData.call(key, innerkey);
      lib.assertCommonEqual(addressData, data);
      await testBasicStorage.delAddressData(key, innerkey);
      data = await testBasicStorage.getAddressData.call(key, innerkey);
      lib.assertNotDeepEqual(addressData, data);
    } catch (err) {
      lib.assertFail(err);;
    }
  });

  it ('set/get/delete bytes data, it should success', async() => {
    let bytesData = accounts[0];
    try {
      let key = await web3.utils.hexToBytes(await web3.utils.toHex("testData"));
      let innerkey = await web3.utils.hexToBytes(await web3.utils.toHex("bytesData"));

      await testBasicStorage.setBytesData(key, innerkey, bytesData);
      let data = await testBasicStorage.getBytesData.call(key, innerkey);
      lib.assertCommonEqual(bytesData.toLowerCase(), data.toLowerCase());
      await testBasicStorage.delBytesData(key, innerkey);
      data = await testBasicStorage.getBytesData.call(key, innerkey);
      lib.assertNotExists(data);
    } catch (err) {
      lib.assertFail(err);
    }
  });

  it ('set/get/delete string data, it should success', async() => {
    let stringData = accounts[0];
    try {
      let key = await web3.utils.hexToBytes(await web3.utils.toHex("testData"));
      let innerkey = await web3.utils.hexToBytes(await web3.utils.toHex("stringData"));

      await testBasicStorage.setStringData(key, innerkey, stringData);
      let data = await testBasicStorage.getStringData.call(key, innerkey);
      lib.assertCommonEqual(stringData, data);
      await testBasicStorage.delStringData(key, innerkey);
      data = await testBasicStorage.getStringData.call(key, innerkey);
      lib.assertNotDeepEqual(stringData, data);
    } catch (err) {
      lib.assertFail(err);
    }
  });

});