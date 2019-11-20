const config = require("../migrations/config");
if (!config.testSchnorrVerify) {
  return ;
}

const lib = require("./lib");
/* global describe it artifacts */
const CryptoInstance = artifacts.require('CryptoInstance.sol')

function getInfo() {
  /**
   * @@@@@@@@@@@@@@Jacob verifyRS@@@@@@@@@@@@@@
   * originalM = wanchain
   * M=0x77616e636861696e
   * hash(M)=0xf76ae2f74b52984faa585c27e55e72cb0b318d71621b448c52012923ad117230
   * m=0xb530b6ae76939f5fb4e07a38084cb28652b74cf6115596107741048c5f8cc9fd
   * R=0x044ba1ba8e5e297c3267069407d54e7dd0405cbeb9511b9d2802e407253a360eb3d61ab9c56c3e3ddbbea97e9b194340c36259e6314d72290d53598b81cb75c5bb
   * rpk+m*gpk=0x04dc3ebf7ba2293bef391c6aac40421ba3a0b71276327633c1efc2d0ba81046aff06ffa4035d7dc068b3723d428d5412cf05c83d0935df53e20d73009e30c956a8
   * sG=0x04dc3ebf7ba2293bef391c6aac40421ba3a0b71276327633c1efc2d0ba81046aff06ffa4035d7dc068b3723d428d5412cf05c83d0935df53e20d73009e30c956a8
   * s=0xc0e7fc619cb10827948c0965b5f07fb7c66cbecba6ecbc67291fac09ec0f1e7a
   * gpk=0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9
   * Verification Succeeded
   * */
  return {
    /* 0xf76ae2f74b52984faa585c27e55e72cb0b318d71621b448c52012923ad117230 */
    hashMsg: "0x" + lib.sha256("wanchain"),
    R: "0x044ba1ba8e5e297c3267069407d54e7dd0405cbeb9511b9d2802e407253a360eb3d61ab9c56c3e3ddbbea97e9b194340c36259e6314d72290d53598b81cb75c5bb",
    s: "0xc0e7fc619cb10827948c0965b5f07fb7c66cbecba6ecbc67291fac09ec0f1e7a",
    PK: "0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9"
  };
}

function getInvalidInfo() {
  return {
    hashMsg: "0x" + lib.keccak("wanchain"),
    R: "0x044ba1ba8e5e297c3267069407d54e7dd0405cbeb9511b9d2802e407253a360eb3d61ab9c56c3e3ddbbea97e9b194340c36259e6314d72290d53598b81cb75c5bb",
    s: "0xc0e7fc619cb10827948c0965b5f07fb7c66cbecba6ecbc67291fac09ec0f1e7a",
    PK: "0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9"
  };
}

contract('TokenManager', async (accounts) => {

  it ('init deployment', async() => {
    let instance = await CryptoInstance.deployed();
  });

  it('verify valid message with the right PK and R and s, it should success', async () => {
    let instance = await CryptoInstance.deployed();

    let info = getInfo();
    // console.log(info.hashMsg);
    try {
      await instance.verifySignature(info.hashMsg, info.PK, info.R, info.s);
    } catch (err) {
      lib.assertFail(err);
    }
  });

  it('verify invalid message with PK and R and s, it should throw error', async () => {
    let instance = await CryptoInstance.deployed();

    let info = getInvalidInfo();
    try {
      // console.log(info.hashMsg);
      await instance.verifySignature(info.hashMsg, info.PK, info.R, info.s);
      lib.assertFail("verify invalid message with PK and R and s, it should throw error");
    } catch (err) {
      // console.log(JSON.stringify(err), typeof(err));
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertInclude(err.message, "Signature verification failed", err);
    }
  });
});