const assert = require('assert');
const eoslime = require('eoslime').init('local');

const CONTRACT_WASM_PATH = './build/schnorr.verification.wasm';
const CONTRACT_ABI_PATH = './build/schnorr.verification.abi';

describe('schnorrverifier', function() {
    this.timeout(15000);

    const randomPoint = "044ba1ba8e5e297c3267069407d54e7dd0405cbeb9511b9d2802e407253a360eb3d61ab9c56c3e3ddbbea97e9b194340c36259e6314d72290d53598b81cb75c5bb";
    const signature = "c0e7fc619cb10827948c0965b5f07fb7c66cbecba6ecbc67291fac09ec0f1e7a";
    const groupKey = "047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9";
    const raw_msg = "wanchain";
    const memo = "hello eos";

    let contractAccount;
    let myAccount;
    let testAccount;

    it('should create contract owner account', async () => {
        myAccount = await eoslime.Account.createRandom();
    })
    it('should deploy the contract', async () => {
        contractAccount = await eoslime.Contract.deploy(CONTRACT_WASM_PATH, CONTRACT_ABI_PATH, myAccount);
    })

    it('should fail with invalid random point - shorter data', async () => {
        let retError;

        try {
            await contractAccount.verify('test', "04a1ba8e5e297c3267069407d54e7dd0405cbeb9511b9d2802e407253a360eb3d61ab9c56c3e3ddbbea97e9b194340c36259e6314d72290d53598b81cb75c5bb", signature, groupKey, raw_msg, memo, { from: testAccount});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined)
    })

    it('should fail with invalid random point - longer data', async () => {
        let retError;

        try {
            await contractAccount.verify('test', "044b4ba1ba8e5e297c3267069407d54e7dd0405cbeb9511b9d2802e407253a360eb3d61ab9c56c3e3ddbbea97e9b194340c36259e6314d72290d53598b81cb75c5bb", signature, groupKey, raw_msg, memo, { from: testAccount});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined)
    })

    it('should fail with invalid signature - shorter data', async () => {
        let retError;

        try {
            await contractAccount.verify('test', randomPoint, 'e7fc619cb10827948c0965b5f07fb7c66cbecba6ecbc67291fac09ec0f1e7a', "045380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9", raw_msg, memo, { from: testAccount});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined)
    })

    it('should fail with invalid signature - longer data', async () => {
        let retError;

        try {
            await contractAccount.verify('test', randomPoint, 'c0c0e7fc619cb10827948c0965b5f07fb7c66cbecba6ecbc67291fac09ec0f1e7a', "047a7a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9", raw_msg, memo, { from: testAccount});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined)
    })

    it('should fail with invalid groupKey - shorter data', async () => {
        let retError;

        try {
            await contractAccount.verify('test', randomPoint, signature, groupKey, raw_msg, memo, { from: testAccount});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined)
    })

    it('should fail with invalid groupKey - longer data', async () => {
        let retError;

        try {
            await contractAccount.verify('test', randomPoint, signature, groupKey, raw_msg, memo, { from: testAccount});
        } catch (e) {
            retError = e;
        }

        assert.notEqual(retError, undefined)
    })

    it('should verify the signature', async () => {
        testAccount = await eoslime.Account.load('test', '5JVAU49StEp8F2ve32Ha22ejSX62XZknqRKkZPwK6senJ3M5rrM')

        await contractAccount.verify('test', randomPoint, signature, groupKey, raw_msg, memo, { from: testAccount})
    })
})
