const config = require("../migrations/config");
if (!config.testTMUpdate) {
  return ;
}

const lib = require("./lib");
/* global describe it artifacts */
const TokenManagerDelegateV2 = artifacts.require('TokenManagerDelegateV2.sol')
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate.sol')
const TokenManagerProxy = artifacts.require('TokenManagerProxy.sol')

function getTokenInfo() {
  let asciiTokenOrigAccount = "YCC-Account";
  let token2WanRatio = 10;
  let minDeposit = "10000000000000000000";
  let withdrawDelayTime = 60 * 60 * 72;
  let asciiTokenName = "ycc";
  let asciiTokenSymbol = "YCC";

  return {
    asciiTokenOrigAccount: asciiTokenOrigAccount,
    token2WanRatio: token2WanRatio,
    minDeposit: minDeposit,
    withdrawDelayTime: withdrawDelayTime,
    asciiTokenName: asciiTokenName,
    asciiTokenSymbol: asciiTokenSymbol,
    decimals: 10
  };
}

// async function compile(solPath) {
//   const fs = require("fs");
//   const solc = require("solc");
//   // const path = require("path");

//   const input = fs.readFileSync(solPath);
//   // const output = solc.compile(input.toString(), 1);
//   // return new Promise((resolve, reject) => {
//   //   solc.compile(input.toString(), 1, (err, result) => {

//   //   })
//   // })
//   return solc.compile(input.toString(), 1);
// }

// function getAbi(compiled) {
//   console.log(JSON.stringify(compiled.contracts));
//   // return [];
//   return JSON.parse(compiled.contracts['Token'].interface);
// }

contract('TokenManager', async (accounts) => {

  it ('init deployment', async() => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let delegateV2 = await TokenManagerDelegateV2.deployed();
  });

  it('v1 token manager delegate, add token info', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;
    let tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

    await proxyDelegateV1.removeToken(tokenOrigAccount);
    await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
    tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

    lib.assertExists(tokenInfoV1);
    lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
    lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
    lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
    // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
    lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
    lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
    lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
    // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);

    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('updated v2 token manager delegate, add token info, token info should be still existed', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let delegateV2 = await TokenManagerDelegateV2.deployed();
    let proxyDelegateV1, proxyDelegateV2;
    let tokenInfoV1, tokenInfoV2;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

    await proxyDelegateV1.removeToken(tokenOrigAccount);
    await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
    tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

    // Upgrade to the latest delegate version 2
    await proxy.upgradeTo(delegateV2.address)
    proxyDelegateV2 = await TokenManagerDelegateV2.at(proxy.address);
    tokenInfoV2 = await proxyDelegateV2.getTokenInfo(tokenOrigAccount);

    // token info should be same
    lib.assertFullMatch(tokenInfoV1, tokenInfoV2);
    await proxyDelegateV2.removeToken(tokenOrigAccount);
  });

  it('updated v2 token manager delegate, the features should be used', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let delegateV2 = await TokenManagerDelegateV2.deployed();
    let proxyDelegateV1, proxyDelegateV2;

    // Upgrade to the latest delegate version 1
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
    // v1 delegate must be not owned the new feature setTokenFlag and getTokenFlag
    lib.expectNotOwnProperty(proxyDelegateV1, "setTokenFlag");
    lib.expectNotOwnProperty(proxyDelegateV1, "getTokenFlag");

    // Upgrade to the latest delegate version 2
    await proxy.upgradeTo(delegateV2.address)
    proxyDelegateV2 = await TokenManagerDelegateV2.at(proxy.address);
    // delegateV2 add the new feature setTokenFlag and getTokenFlag
    let flag = "YCC-pk";
    await proxyDelegateV2.setTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")), flag);
    let tokenFlagV2 = await proxyDelegateV2.getTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")));
    lib.assertFullMatch(flag, tokenFlagV2);
    await proxyDelegateV2.delTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")));
    let tmpTokenFlagV2 = await proxyDelegateV2.getTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")));
    lib.assertNotDeepEqual(tokenFlagV2, tmpTokenFlagV2);
  });

  it('v1 delegate add token, v2 delegate removed the existed token info, updated v1 token manager delegate, token info should be removed, v2 features should be not exists', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let delegateV2 = await TokenManagerDelegateV2.deployed();
    let proxyDelegateV1, proxyDelegateV2;
    let tokenInfoV1, tokenInfoV2;

    // Upgrade to the latest delegate version 1
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

    await proxyDelegateV1.removeToken(tokenOrigAccount);
    await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
    tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

    lib.assertExists(tokenInfoV1);

    // Upgrade to the latest delegate version 2
    await proxy.upgradeTo(delegateV2.address)
    proxyDelegateV2 = await TokenManagerDelegateV2.at(proxy.address);

    tokenInfoV2 = await proxyDelegateV2.getTokenInfo(tokenOrigAccount);
    lib.assertFullMatch(tokenInfoV1, tokenInfoV2);

    await proxyDelegateV2.removeToken(tokenOrigAccount);
    tokenInfoV2 = await proxyDelegateV2.getTokenInfo(tokenOrigAccount);
    lib.assertNotDeepEqual(tokenInfoV1, tokenInfoV2);

    // Upgrade to the latest delegate version 1
    await proxy.upgradeTo(delegate.address)
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
    // tokenInfoV1 storage deleted in TokenManagerDelegateV2, and the info would be same as TokenManagerDelegateV2 in TokenManagerDelegate
    tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
    lib.assertFullMatch(tokenInfoV1, tokenInfoV2);

    // delegate must be not owned the new feature setTokenFlag and getTokenFlag
    lib.expectNotOwnProperty(proxyDelegateV1, "setTokenFlag");
    lib.expectNotOwnProperty(proxyDelegateV1, "getTokenFlag");
  });

  it('v1 delegate add token with 0 decimals, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;
    let tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    decimals = 0;
    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

    await proxyDelegateV1.removeToken(tokenOrigAccount);
    await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
    tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

    // console.log(JSON.stringify(tokenInfoV1));
    lib.assertExists(tokenInfoV1);
    lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
    lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
    lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
    // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
    lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
    lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
    lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
    // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);

    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with reduplicate, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;
    let tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    decimals = 0;
    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

    await proxyDelegateV1.removeToken(tokenOrigAccount);
    await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
    tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

    try {
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with reduplicate, it should be throw error");
    } catch (err) {
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      lib.assertCommonEqual(err.reason, "Token is exist");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with 0 token to wan ratio, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    token2WanRatio = 0;
    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with 0 token to wan ratio, it should be throw error");
    } catch (err) {
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      lib.assertCommonEqual(err.reason, "Ratio is null");
      // // console.log(typeof(err), JSON.stringify(err.reason));
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with low deposit, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    minDeposit = "1000";
    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with with low deposit, it should be throw error");
    } catch (err) {
      // console.log("add token with with low deposit, it should be throw error", Object.keys(err));
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      lib.assertCommonEqual(err.reason, "Deposit amount is not enough");
      // // console.log(typeof(err), JSON.stringify(err.reason));
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with low withdraw delay time, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    withdrawDelayTime = 10;
    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with with low withdraw delay time, it should be throw error");
    } catch (err) {
      // console.log("add token with with low withdraw delay time, it should be throw error", Object.keys(err));
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      lib.assertCommonEqual(err.reason, "Delay time for withdraw is too short");
      // // console.log(typeof(err), JSON.stringify(err.reason));
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with empty name, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    /* web3.utils.toHex("") is 0x0
     * web3.utils.hexToBytes(web3.utils.toHex("")) is [ 0 ], and its length is 1
    */
    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = [];
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with with empty name, it should be throw error");
    } catch (err) {
      // console.log("add token with with empty name, it should be throw error", Object.keys(err));
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      lib.assertCommonEqual(err.reason, "Name is null");
      // // console.log(typeof(err), JSON.stringify(err.reason));
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with empty symbol, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = [];
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with with empty symbol, it should be throw error");
    } catch (err) {
      // console.log("add token with with empty symbol, it should be throw error", Object.keys(err));
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      lib.assertCommonEqual(err.reason, "Symbol is null");
      // // console.log(typeof(err), JSON.stringify(err.reason));
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with empty token origin account, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = [];
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with with empty token origin account, it should be throw error");
    } catch (err) {
      // console.log("add token with with empty token origin account, it should be throw error", Object.keys(err));
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      // console.log(err.reason);
      lib.assertCommonEqual(err.reason, "Account is null");
      // console.log(typeof(err), JSON.stringify(err.reason));
    }
    // await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token with empty symbol, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = [];
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      lib.assertFail("add token with with empty symbol, it should be throw error");
    } catch (err) {
      // console.log("add token with with empty symbol, it should be throw error", Object.keys(err));
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertExists(err.reason);
      lib.assertCommonEqual(err.reason, "Symbol is null");
      // // console.log(typeof(err), JSON.stringify(err.reason));
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate update an not existed token, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, accounts[1]);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

      lib.assertExists(tokenInfoV1);
      lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
      lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
      lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
      // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
      lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
      lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
      lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
      // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update an not existed token, it should be success");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token and update it with 0 decimals, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];

      decimals = 0;
      await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

      lib.assertExists(tokenInfoV1);
      lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
      lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
      lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
      // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
      lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
      lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
      lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
      // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update it with 0 decimals, it should be success");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token and update it with 0 token to wan ratio, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];

      try {
        token2WanRatio = 0;
        await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
        lib.assertFail("add token and update it with 0 token to wan ratio, it should be throw error");
      } catch (err) {
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertExists(err.reason);
        lib.assertCommonEqual(err.reason, "Ratio is null");
        // // console.log(typeof(err), JSON.stringify(err.reason));
      }
        // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update it with 0 token to wan ratio, it should be success");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token and update it with low deposit, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];

      try {
        minDeposit = "1000";
        await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
        lib.assertFail("add token and update it with low deposit, it should be throw error");
      } catch (err) {
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertExists(err.reason);
        lib.assertCommonEqual(err.reason, "Deposit amount is not enough");
        // // console.log(typeof(err), JSON.stringify(err.reason));
      }
        // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update it with low deposit, it should be success");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token and update it with low withdraw delay time, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];

      try {
        withdrawDelayTime = 10;
        await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
        lib.assertFail("add token and update it with low withdraw delay time, it should be throw error");
      } catch (err) {
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertExists(err.reason);
        lib.assertCommonEqual(err.reason, "Delay time for withdraw is too short");
        // // console.log(typeof(err), JSON.stringify(err.reason));
      }
        // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update it with low withdraw delay time, it should be success");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token and update it with empty name, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];

      try {
        tokenName = [];
        await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
        lib.assertFail("add token and update it with empty name, it should be throw error");
      } catch (err) {
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertExists(err.reason);
        lib.assertCommonEqual(err.reason, "Name is null");
        // // console.log(typeof(err), JSON.stringify(err.reason));
      }
        // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update it with empty name, it should be success");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token and update it with empty symbol, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];

      try {
        tokenSymbol = [];
        await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
        lib.assertFail("add token and update it with empty symbol, it should be throw error");
      } catch (err) {
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertExists(err.reason);
        lib.assertCommonEqual(err.reason, "Symbol is null");
        // // console.log(typeof(err), JSON.stringify(err.reason));
      }
        // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update it with empty symbol, it should be success");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('v1 delegate add token and update it with empty token origin account, it should be throw error', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];

      try {
        let tokenOrigAccount = [];
        await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
        lib.assertFail("add token and update it with empty token origin account, it should be throw error");
      } catch (err) {
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertExists(err.reason);
        lib.assertCommonEqual(err.reason, "Account is null");
        // // console.log(typeof(err), JSON.stringify(err.reason));
      }
        // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
    } catch (err) {
      lib.assertFail("add token and update it with empty token origin account, it should be throw error");
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

  it('mint token with self-defined htlc address, it should be success', async () => {
    let proxy = await TokenManagerProxy.deployed();
    let delegate = await TokenManagerDelegate.deployed();
    let proxyDelegateV1, tokenInfoV1;
    let htlcAddr = accounts[0];
    let userAddr = accounts[1];

    // Initalize the proxy with the first delegate version 1.
    if (delegate.address !== await proxy.implementation()) {
      await proxy.upgradeTo(delegate.address)
    }
    // Setup the proxy receive function calls as if it were acting as
    //  the delegate.
    proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
    await proxyDelegateV1.setHtlcAddr(htlcAddr);

    let {
      asciiTokenOrigAccount,
      token2WanRatio,
      minDeposit,
      withdrawDelayTime,
      asciiTokenName,
      asciiTokenSymbol,
      decimals
    } = getTokenInfo();

    let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
    let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
    let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
    try {
      await proxyDelegateV1.removeToken(tokenOrigAccount);
      await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
      tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
      let wTokenAddr = tokenInfoV1["3"];
      // console.log("wTokenAddr ", wTokenAddr);

      const abi = [
        {
          "constant": true,
          "inputs": [],
          "name": "name",
          "outputs": [
            {
              "name": "",
              "type": "string"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "_spender",
              "type": "address"
            },
            {
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "approve",
          "outputs": [
            {
              "name": "success",
              "type": "bool"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "totalSupply",
          "outputs": [
            {
              "name": "",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "_from",
              "type": "address"
            },
            {
              "name": "_to",
              "type": "address"
            },
            {
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "transferFrom",
          "outputs": [
            {
              "name": "success",
              "type": "bool"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "decimals",
          "outputs": [
            {
              "name": "",
              "type": "uint8"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [
            {
              "name": "_owner",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "name": "balance",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [],
          "name": "acceptOwnership",
          "outputs": [],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "owner",
          "outputs": [
            {
              "name": "",
              "type": "address"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "symbol",
          "outputs": [
            {
              "name": "",
              "type": "string"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "_newOwner",
              "type": "address"
            }
          ],
          "name": "changeOwner",
          "outputs": [],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "_to",
              "type": "address"
            },
            {
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "transfer",
          "outputs": [
            {
              "name": "success",
              "type": "bool"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "newOwner",
          "outputs": [
            {
              "name": "",
              "type": "address"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [
            {
              "name": "_owner",
              "type": "address"
            },
            {
              "name": "_spender",
              "type": "address"
            }
          ],
          "name": "allowance",
          "outputs": [
            {
              "name": "remaining",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "name": "tokenName",
              "type": "string"
            },
            {
              "name": "tokenSymbol",
              "type": "string"
            },
            {
              "name": "tokenDecimal",
              "type": "uint8"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "payable": true,
          "stateMutability": "payable",
          "type": "fallback"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "account",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "value",
              "type": "uint256"
            },
            {
              "indexed": true,
              "name": "totalSupply",
              "type": "uint256"
            }
          ],
          "name": "TokenMintedLogger",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "account",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "value",
              "type": "uint256"
            },
            {
              "indexed": true,
              "name": "totalSupply",
              "type": "uint256"
            }
          ],
          "name": "TokenBurntLogger",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "_owner",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_spender",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "Approval",
          "type": "event"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "account",
              "type": "address"
            },
            {
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "mint",
          "outputs": [],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "account",
              "type": "address"
            },
            {
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "burn",
          "outputs": [],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

      let contract = new web3.eth.Contract(abi, wTokenAddr);

      // console.log("mint token for ", userAddr);
      let userBalance = await contract.methods.balanceOf(userAddr).call();
      // console.log("before mint token balance", userBalance, typeof(userBalance));

      // const abi = WanToken.abi;
      // let contract = new web3.eth.Contract(abi, wTokenAddr);

      // console.log("mint token for ", userAddr);
      // let userBalance = await contract.methods.balanceOf(userAddr).call();
      // console.log("before mint token balance", userBalance, typeof(userBalance));

      let value = 99;
      await proxyDelegateV1.mintToken(tokenOrigAccount, userAddr, value.toString());

      let userMintedBalance = await contract.methods.balanceOf(userAddr).call();
      // console.log("after mint token balance", userMintedBalance, typeof(userMintedBalance));

      lib.assertCommonEqual(Number(userMintedBalance) - value, Number(userBalance));
      // console.log("compare mint token balance success");

      let isTransfered = await contract.methods.transfer(htlcAddr, value.toString()).send({from: userAddr});
      // console.log("transfer mint token balance ", isTransfered);
      // lib.assertCommonEqual(isTransfered, true);
      // console.log("transfer mint token balance success");

      let htlcBalance = await contract.methods.balanceOf(htlcAddr).call();
      // console.log("before burn token balance", htlcBalance, typeof(htlcBalance));

      await proxyDelegateV1.burnToken(tokenOrigAccount, value.toString());
      let htlcBurnedBalance = await contract.methods.balanceOf(htlcAddr).call();
      // console.log("after burn token balance", htlcBurnedBalance, typeof(htlcBurnedBalance));

      lib.assertCommonEqual(Number(htlcBurnedBalance) + value, Number(htlcBalance));
      lib.assertCommonEqual(htlcBalance, userMintedBalance);

    } catch (err) {
      console.error(JSON.stringify(err));
      // lib.assertFail("mint token with self-defined htlc address, it should be success", err);
      lib.assertFail(JSON.stringify(err));
    }
    await proxyDelegateV1.removeToken(tokenOrigAccount);
  });

});