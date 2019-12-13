const TokenManagerProxy     = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate  = artifacts.require('TokenManagerDelegate');
const Secp256k1             = artifacts.require('Secp256k1');
const SchnorrVerifier       = artifacts.require('SchnorrVerifier');
const QuotaLib              = artifacts.require('QuotaLib');
const HTLCLib               = artifacts.require('HTLCLib');
const HTLCDebtLib           = artifacts.require('HTLCDebtLib');
const HTLCSmgLib            = artifacts.require('HTLCSmgLib');
const HTLCUserLib           = artifacts.require('HTLCUserLib');
const Proxy                 = artifacts.require('Proxy');
const HTLCProxy             = artifacts.require('HTLCProxy');
const HTLCDelegate          = artifacts.require('HTLCDelegate');
const StoremanGroupProxy    = artifacts.require('StoremanGroupProxy');
const StoremanGroupDelegate = artifacts.require('StoremanGroupDelegate');
const WanToken              = artifacts.require("WanToken");

const schnorr               = require('../utils/schnorr/tools');
const BN                    = web3.utils.BN;

let smgInstProxy, htlcInstProxy,tmInstProxy;
let smgInst, htlcInst,tmInst;
let htlcInstNotInit;

let revokeFeeRatio          = 100;
let ratioPrecise            = 10000;
let ratioPreciseInvld       = 10001;
let lockedTime              = 40*1000; //unit: ms
let DEFAULT_PRECISE         = 10000;

// x and xhash
const x1                    = '0x0000000000000000000000000000000000000000000000000000000000000001';
const xHash1                = '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5';

const x2                    = '0x0000000000000000000000000000000000000000000000000000000000000002';
const xHash2                = '0x9267d3dbed802941483f1afa2a6bc68de5f653128aca9bf1461c5d0a3ad36ed2';

const x3                    = '0x0000000000000000000000000000000000000000000000000000000000000003';
const xHash3                = '0xd9147961436944f43cd99d28b2bbddbf452ef872b30c8279e255e7daafc7f946';


const x4                    = '0x0000000000000000000000000000000000000000000000000000000000000004';
const xHash4                = '0xe38990d0c7fc009880a9c07c23842e886c6bbdc964ce6bdd5817ad357335ee6f';

const x5                    = '0x0000000000000000000000000000000000000000000000000000000000000005';
const xHash5                = '0x96de8fc8c256fa1e1556d41af431cace7dca68707c78dd88c3acab8b17164c47';

const x6                    = '0x0000000000000000000000000000000000000000000000000000000000000006';
const xHash6                = '0xd1ec675902ef1633427ca360b290b0b3045a0d9058ddb5e648b4c3c3224c5c68';

const x7                    = '0x0000000000000000000000000000000000000000000000000000000000000007';
const xHash7                = '0x48428bdb7ddd829410d6bbb924fdeb3a3d7e88c2577bffae073b990c6f061d08';

const x8                    = '0x0000000000000000000000000000000000000000000000000000000000000008';
const xHash8                = '0x38df1c1f64a24a77b23393bca50dff872e31edc4f3b5aa3b90ad0b82f4f089b6';

const x9                    = '0x0000000000000000000000000000000000000000000000000000000000000009';
const xHash9                = '0x887bf140ce0b6a497ed8db5c7498a45454f0b2bd644b0313f7a82acc084d0027';

const x10                   = '0x000000000000000000000000000000000000000000000000000000000000000a';
const xHash10               = '0x81b04ae4944e1704a65bc3a57b6fc3b06a6b923e3c558d611f6a854b5539ec13';

const x11                   = '0x000000000000000000000000000000000000000000000000000000000000000b';
const xHash11               = '0xc09322c415a5ac9ffb1a6cde7e927f480cc1d8afaf22b39a47797966c08e9c4b';

const x12                   = '0x000000000000000000000000000000000000000000000000000000000000000c';
const xHash12               = '0xa82872b96246dac512ddf0515f5da862a92ecebebcb92537b6e3e73199694c45';

const x13                   = '0x000000000000000000000000000000000000000000000000000000000000000d';
const xHash13               = '0x2a3f128306951f1ded174b8803ee1f0df0c6404bbe92682be21fd84accf5d540';

const x14                   = '0x000000000000000000000000000000000000000000000000000000000000000e';
const xHash14               = '0xe14f5be83831f7fefa669d5a84daaa56ec01477dafc6701a83f243bc2228bb11';

const x15                   = '0x000000000000000000000000000000000000000000000000000000000000000f';
const xHash15               = '0x3ba2581d53fbf070be34b6d6a2382faf1b8e76a3ade45b31c0c7c90ea289874e';


let tokenInfo       = {
  decimals              : 18,
  tokenOrigAccount      : web3.utils.asciiToHex('Eos contract address'),
  token2WanRatio        : 10000,                  // 1:1
  //minDeposit            : new BN(20).mul(new BN(10).pow(new BN(18))),
  minDeposit            : new BN(40).mul(new BN(10).pow(new BN(18))),
  withdrawDelayTime     : 60 * 60 * 72,
  name                  : web3.utils.asciiToHex('Eos'),
  symbol                : web3.utils.asciiToHex('EOS')
};

let tokenInfoNotReg = {
  decimals              : 18,
  tokenOrigAccount      : web3.utils.asciiToHex('Eos contract address1'),
  token2WanRatio        : 10000,                  // 1:1
  minDeposit            : new BN(20).mul(new BN(10).pow(new BN(18))),
  withdrawDelayTime     : 60 * 60 * 72,
  name                  : web3.utils.asciiToHex('Eos1'),
  symbol                : web3.utils.asciiToHex('EOS1')
};

const v1            = new BN(20).mul(new BN(10).pow(new BN(tokenInfo.decimals)));
const v2            = new BN(10).mul(new BN(10).pow(new BN(tokenInfo.decimals)));
const v3            = new BN(5).mul(new BN(10).pow(new BN(tokenInfo.decimals)));
const v4            = new BN(2).mul(new BN(10).pow(new BN(tokenInfo.decimals)));
const v5            = new BN(1).mul(new BN(10).pow(new BN(tokenInfo.decimals)));
const v100          = new BN(100).mul(new BN(10).pow(new BN(tokenInfo.decimals)));


const appproveValue     = new BN(20).mul(new BN(10).pow(new BN(tokenInfo.decimals)));
const valueZero         = 0;

const skSmg1            = new Buffer("097e961933fa62e3fef5cedef9a728a6a927a4b29f06a15c6e6c52c031a6cb2b", 'hex');
const skSmg2            = new Buffer("e6a00fb13723260102a6937fc86b0552eac9abbe67240d7147f31fdef151e18a", 'hex');
const skSrcSmg          = new Buffer("0de99c2552e85e51fd7491a14ad340f92a02db92983178929b100776197bc4f6", 'hex');
const skSrcSmg1         = new Buffer("55aa70e9a9d984c91bd75d4793db2cd2d998dc8fcaebcb864202fb17a9a6d5b9", 'hex');
const skDstSmg          = new Buffer("b3ba835eae481e6af0219a9cda3769622eea512aacfb7ea4eb0e9426ff800dc5", 'hex');

const srcDebtStoremanPK     = schnorr.getPKBySk(skSrcSmg);
const dstDebtStoremanPK     = schnorr.getPKBySk(skDstSmg);
const srcDebtStoremanPK1    = schnorr.getPKBySk(skSrcSmg1);


const storemanPK1           = schnorr.getPKBySk(skSmg1);
const txFeeRatio1           = '20';

const storemanPK2           = schnorr.getPKBySk(skSmg2);
const quota2                = '200';
const txFeeRatio2           = '20';

const R                     = schnorr.getR();
const s                     = '0x0c595b48605562a1a6492540b875da4ff203946a9dd0e451cd33d06ef568626b';

const ADDRESS_0                   = '0x0000000000000000000000000000000000000000';
const ADDRESS_TM                  = '0x0000000000000000000000000000000000000001';
const ADDRESS_SMGADMIN            = '0x0000000000000000000000000000000000000002';
const ADDRESS_HTLC_PROXY_IMPL     = '0x0000000000000000000000000000000000000003';


let htlcSmgLockParams       = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  xHash: xHash1,
  wanAddr: '',
  value: v1,
  storemanGroupPK: storemanPK1,
  r: R,
  s: s,
  skSmg: skSmg1
};

let htlcUserRedeemParams    = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  x: x1
};

let htlcUserLockParams      = {
  xHash: xHash2,
  value: v2,
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  storemanGroupPK: storemanPK1,
};

let htlcSmgRedeemParams     = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  tokenManager: '',
  r: R,
  s: s,
  x: x1,
  skSmg: skSmg1
};

let addSmgParams            = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  storemanGroupPK: storemanPK1,
  quota: tokenInfo.minDeposit,
  txFeeRatio: txFeeRatio1
};

let htlcDebtLockParams      = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  xHash: xHash6,
  value: v1,
  srcStoremanPK: srcDebtStoremanPK,
  dstStoremanPK: dstDebtStoremanPK,
  r: R,
  s: s,
  skSrcSmg: skSrcSmg,
  skDstSmg: skDstSmg,
};

let htlcDebtRedeemParams    = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  r: R,
  s: s,
  x: x6,
  skSmg: skSrcSmg,
};

let PrmTypeList             = {
    //tokenOrigAccount    xHash   wanAddr   value   storemanGroupPK
    inSmgLock: ['bytes', 'bytes32', 'address', 'uint', 'bytes'],
    // receiver
    smgWithdrawFee: ['address'],
    // tokenOrigAccount   x
    outSmgRedeem: ['bytes', 'bytes32'],
    //tokenOrigAccount    x
    inDebtRedeem: ['bytes', 'bytes32'],
    //tokenOrigAccount    xHash   srcStoremanPK   dstStoremanPK
    inDebtLock: ['bytes', 'bytes32', 'bytes', 'bytes', 'uint']
};

let tmAddress, smgAddress, precise;

contract('Test HTLC', async (accounts) => {
    before("init...   -> success", async () => {
        try {
            // get the instance
            let deploy;
            deploy = await StoremanGroupProxy.deployed();
            smgInstProxy = await StoremanGroupDelegate.at(deploy.address);

            deploy = await HTLCProxy.deployed();
            htlcInstProxy = await HTLCDelegate.at(deploy.address);

            deploy = await TokenManagerProxy.deployed();
            tmInstProxy = await TokenManagerDelegate.at(deploy.address);

            smgInst = await StoremanGroupDelegate.deployed();
            tmInst = await TokenManagerDelegate.deployed();
            htlcInst = await HTLCDelegate.deployed();

            let deployNotInit = await HTLCDelegate.new();
            htlcInstNotInit = await HTLCDelegate.at(deployNotInit.address);

            // register a token
            await tmInstProxy.addToken(tokenInfo.tokenOrigAccount,
                tokenInfo.token2WanRatio,
                tokenInfo.minDeposit,
                tokenInfo.withdrawDelayTime,
                tokenInfo.name,
                tokenInfo.symbol,
                tokenInfo.decimals);

            // register storeman. the storeman delegate account is accounts[2]
            await smgInstProxy.storemanGroupRegister(addSmgParams.tokenOrigAccount,
                addSmgParams.storemanGroupPK,
                addSmgParams.txFeeRatio, {from: accounts[2], value: tokenInfo.minDeposit});

            await smgInstProxy.storemanGroupAppendDeposit(addSmgParams.tokenOrigAccount,
                addSmgParams.storemanGroupPK,
                {from: accounts[2], value: tokenInfo.minDeposit});

        } catch (err) {
            assert.fail(err);
        }
    });

    it('init...   -> getStoremanFee success', async () => {
        try {
            let stmFee = await htlcInstProxy.getStoremanFee(addSmgParams.storemanGroupPK);
            assert.equal(new BN(stmFee).eq(new BN(0)), true);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('init...   -> queryStoremanGroupQuota success', async () => {
        try {
            let ret = await htlcInstProxy.queryStoremanGroupQuota(tokenInfo.tokenOrigAccount,
                addSmgParams.storemanGroupPK);

            let bnToken2WanRation = new BN(tokenInfo.token2WanRatio);
            let bnUnitToken = (new BN(10)).pow(new BN(tokenInfo.decimals));
            let bnUnitEth = (new BN(10)).pow(new BN(18));
            let bnDefultPrecise = new BN(DEFAULT_PRECISE);
            let value = new BN(addSmgParams.quota);
            let quato = value.mul(bnDefultPrecise).mul(bnUnitToken).div(bnToken2WanRation).div(bnUnitEth).mul(new BN(2));
            assert.equal(new BN(ret[0]).eq(new BN(quato)), true);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('init...   -> queryStoremanGroupQuota store man not exist', async () => {
        try {
            let ret = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount,
                srcDebtStoremanPK);
            assert.equal(ret.quota, '0');
            assert.equal(ret.inboundQuota, '0');
            assert.equal(ret.outboundQuota, '0');
            assert.equal(ret.receivable, '0');
            assert.equal(ret.payable, '0');
            assert.equal(ret.debt, '0');
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('init...   -> should call from smg sc address', async () => {
        try {
            await htlcInstProxy.addStoremanGroup(addSmgParams.tokenOrigAccount,
                addSmgParams.storemanGroupPK,
                addSmgParams.quota,
                addSmgParams.txFeeRatio);
        } catch (err) {
            assert.include(err.toString(), "Only storeman group");
        }
    });

    it('init...   -> Duplicate register', async () => {
        try {
            // value must > minDesposit
            await smgInstProxy.storemanGroupRegister(addSmgParams.tokenOrigAccount,
                addSmgParams.storemanGroupPK,
                addSmgParams.txFeeRatio);
        } catch (err) {
            assert.include(err.toString(), "Duplicate register");
        }
    });

    it('init...   -> At lease minDeposit', async () => {
        try {
            // value must > minDesposit
            let addSmgParamsTemp = Object.assign({}, addSmgParams);
            addSmgParamsTemp.storemanGroupPK = storemanPK2;
            await smgInstProxy.storemanGroupRegister(addSmgParamsTemp.tokenOrigAccount,
                addSmgParamsTemp.storemanGroupPK,
                addSmgParamsTemp.txFeeRatio);
        } catch (err) {
            assert.include(err.toString(), "At lease minDeposit");
        }
    });

    it('Others getEconomics  ==>The default value', async () => {
        try {
            let ret = await htlcInstProxy.getEconomics();
            tmAddress = ret[0];
            smgAddress = ret[1];
            precise = ret[2];
            assert.notEqual(ret[0], ADDRESS_0);
            assert.notEqual(ret[1], ADDRESS_0);
            assert.equal(ret[2].toNumber(), 0);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Others setEconomics  ==>Parameter is invalid', async () => {
        try {
            await htlcInstProxy.setEconomics(ADDRESS_0, ADDRESS_SMGADMIN, ratioPrecise);
        } catch (err) {
            assert.include(err.toString(), "Parameter is invalid");
        }
    });

    it('init...   -> queryStoremanGroupQuota success', async () => {
        try {
            let ret = await htlcInstProxy.queryStoremanGroupQuota(tokenInfo.tokenOrigAccount,
                addSmgParams.storemanGroupPK);

            let bnToken2WanRation = new BN(tokenInfo.token2WanRatio);
            let bnUnitToken = (new BN(10)).pow(new BN(tokenInfo.decimals));
            let bnUnitEth = (new BN(10)).pow(new BN(18));
            let bnDefultPrecise = new BN(DEFAULT_PRECISE);
            let value = new BN(addSmgParams.quota);
            let quato = value.mul(bnDefultPrecise).mul(bnUnitToken).div(bnToken2WanRation).div(bnUnitEth).mul(new BN(2));
            assert.equal(new BN(ret[0]).eq(new BN(quato)), true);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('init...   -> should call from smg sc address', async () => {
        try {
            await htlcInstProxy.addStoremanGroup(addSmgParams.tokenOrigAccount,
                addSmgParams.storemanGroupPK,
                addSmgParams.quota,
                addSmgParams.txFeeRatio);
        } catch (err) {
            assert.include(err.toString(), "Only storeman group");
        }
    });

    it('init...   -> Duplicate register', async () => {
        try {
            // value must > minDesposit
            await smgInstProxy.storemanGroupRegister(addSmgParams.tokenOrigAccount,
                addSmgParams.storemanGroupPK,
                addSmgParams.txFeeRatio);
        } catch (err) {
            assert.include(err.toString(), "Duplicate register");
        }
    });

    it('init...   -> At lease minDeposit', async () => {
        try {
            // value must > minDesposit
            let addSmgParamsTemp = Object.assign({}, addSmgParams);
            addSmgParamsTemp.storemanGroupPK = storemanPK2;
            await smgInstProxy.storemanGroupRegister(addSmgParamsTemp.tokenOrigAccount,
                addSmgParamsTemp.storemanGroupPK,
                addSmgParamsTemp.txFeeRatio);
        } catch (err) {
            assert.include(err.toString(), "At lease minDeposit");
        }
    });

    it('Others getEconomics  ==>The default value', async () => {
        try {
            let ret = await htlcInstProxy.getEconomics();
            tmAddress = ret[0];
            smgAddress = ret[1];
            precise = ret[2];
            assert.notEqual(ret[0], ADDRESS_0);
            assert.notEqual(ret[1], ADDRESS_0);
            assert.equal(ret[2].toNumber(), 0);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Others setEconomics  ==>Parameter is invalid', async () => {
        try {
            await htlcInstProxy.setEconomics(ADDRESS_0, ADDRESS_SMGADMIN, ratioPrecise);
        } catch (err) {
            assert.include(err.toString(), "Parameter is invalid");
        }
    });

    it('Others setEconomics  ==>Parameter is invalid', async () => {
        try {
            await htlcInstProxy.setEconomics(ADDRESS_TM, ADDRESS_0, ratioPrecise);
        } catch (err) {
            assert.include(err.toString(), "Parameter is invalid");
        }
    });

    it('Others setEconomics  ==>Parameter is invalid', async () => {
        try {
            await htlcInstProxy.setEconomics(ADDRESS_0, ADDRESS_0, ratioPrecise);
        } catch (err) {
            assert.include(err.toString(), "Parameter is invalid");
        }
    });

    it('Others setEconomics  ==>Ratio is invalid', async () => {
        try {
            await htlcInstProxy.setEconomics(ADDRESS_TM, ADDRESS_SMGADMIN, ratioPreciseInvld);
        } catch (err) {
            assert.include(err.toString(), "Ratio is invalid");
        }
    });

    it('Others setEconomics  ==>set new value', async () => {
        try {
            await htlcInstProxy.setEconomics(ADDRESS_TM, ADDRESS_SMGADMIN, ratioPrecise);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Others getEconomics  ==>check new value', async () => {
        try {
            let ret = await htlcInstProxy.getEconomics();
            assert.equal(ret[0], ADDRESS_TM);
            assert.equal(ret[1], ADDRESS_SMGADMIN);
            assert.equal(ret[2].toNumber(), ratioPrecise);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Others setEconomics  ==>restore the saved address', async () => {
        try {
            await htlcInstProxy.setEconomics(tmAddress, smgAddress, revokeFeeRatio);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Proxy   -> get the implementation address', async () => {
        let address;
        try {
            let htlcProxy = await HTLCProxy.deployed();
            address = await htlcProxy.implementation();
        } catch (err) {
            assert.fail(err.toString());
        }
        assert.equal(address, htlcInst.address);
    });

    it('Proxy   -> upgradeTo', async () => {
        let address;
        try {
            let htlcProxy = await HTLCProxy.deployed();
            await htlcProxy.upgradeTo(ADDRESS_HTLC_PROXY_IMPL);
            address = await htlcProxy.implementation();
            assert.equal(address, ADDRESS_HTLC_PROXY_IMPL);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Proxy   -> upgradeTo with the same implementation address', async () => {
        let address;
        try {
            let htlcProxy = await HTLCProxy.deployed();
            await htlcProxy.upgradeTo(ADDRESS_HTLC_PROXY_IMPL);
            address = await htlcProxy.implementation();
            assert.equal(address, ADDRESS_HTLC_PROXY_IMPL);
        } catch (err) {
            assert.include(err.toString(), "Cannot upgrade to the same implementation");
        }
    });

    it('Proxy   -> upgradeTo with 0x address', async () => {
        let address;
        try {
            let htlcProxy = await HTLCProxy.deployed();
            await htlcProxy.upgradeTo(ADDRESS_0);
            address = await htlcProxy.implementation();
            assert.equal(address, ADDRESS_0);
        } catch (err) {
            assert.include(err.toString(), "Cannot upgrade to invalid address");
        }
    });

    it('Proxy   -> restore', async () => {
        let address;
        try {
            let htlcProxy = await HTLCProxy.deployed();
            await htlcProxy.upgradeTo(htlcInst.address);
            address = await htlcProxy.implementation();
            assert.equal(address, htlcInst.address);
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('EOS->WAN inSmgLock  ==>Token manager is null', async () => {
        try {

            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            await htlcInstNotInit.inSmgLock(tokenInfoNotReg.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

        } catch (err) {
            //assert.fail(err);
            assert.include(err.toString(), "Token manager is null");
        }

    });

    it('EOS->WAN inSmgLock  ==>Halted', async () => {
        try {
            await htlcInstProxy.setHalt(true);
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            await htlcInstProxy.inSmgLock(tokenInfoNotReg.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

        } catch (err) {
            //assert.fail(err);
            assert.include(err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('EOS->WAN inSmgLock  ==>Token is not registered', async () => {
        try {
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            await htlcInstProxy.inSmgLock(tokenInfoNotReg.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

        } catch (err) {
            //assert.fail(err);
            assert.include(err.toString(), "Token is not registered");
        }
    });

    it('EOS->WAN inSmgLock  ==>success', async () => {
        try {
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(htlcSmgLockParamsTemp.skSmg, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

        } catch (err) {
            assert.fail(err);
        }
    });

    it('EOS->WAN inUserRedeem ==> Smart contract is halted', async () => {
        await htlcInstProxy.setHalt(true);
        try {
            // accounts[1] is the wan address of the user.
            //Msg sender is incorrect
            await htlcInstProxy.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
                htlcUserRedeemParams.x);

        } catch (err) {
            assert.include(err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('EOS->WAN inUserRedeem ==> redeem from not the receiver', async () => {
        try {
            // accounts[1] is the wan address of the user.
            //Msg sender is incorrect
            await htlcInstProxy.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
                htlcUserRedeemParams.x);

        } catch (err) {
            assert.include(err.toString(), "Msg sender is incorrect");
        }
    });

    it('EOS->WAN inUserRedeem ==> Token manager is null', async () => {
        try {
            await htlcInstNotInit.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
                htlcUserRedeemParams.x);

        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }
    });

    it('EOS->WAN inUserRedeem ==> success', async () => {
        try {
            await htlcInstProxy.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
                htlcUserRedeemParams.x, {from: accounts[1]});
            let balance = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            assert.equal(balance, htlcSmgLockParams.value, "Redeemed token is not equal the locked value");
        } catch (err) {
            assert.fail(err);
        }
    });

    it('EOS->WAN inUserRedeem ==> Redeem twice', async () => {
        try {
            await htlcInstProxy.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
                htlcUserRedeemParams.x, {from: accounts[1]});
        } catch (err) {
            assert.include(err.toString(), "Status is not locked");
        }
    });

    it('EOS->WAN inSmgLock  ==>lock value is 0, Value is invalid', async () => {
        try {
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.value = valueZero;

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(htlcSmgLockParamsTemp.skSmg, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Value is invalid");
        }
    });

    it('EOS->WAN inSmgLock  ==>Smg tx is exist', async () => {
        try {
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(htlcSmgLockParamsTemp.skSmg, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Smg tx is exist");
        }
    });

    it('EOS->WAN inSmgLock  ==>Quota is not enough', async () => {
        try {
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.value = v100;
            htlcSmgLockParamsTemp.xHash = xHash3;

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(htlcSmgLockParamsTemp.skSmg, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Quota is not enough");
        }
    });

    it('EOS->WAN inUserRedeem ==> Token manager is null', async () => {
        try {
            await htlcInstNotInit.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
                htlcUserRedeemParams.x, {from: accounts[1]});
        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }
    });

    it('EOS->WAN inUserRedeem ==> Redeem timeout', async () => {
        try {
            // smg lock
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.xHash = xHash12;
            htlcSmgLockParamsTemp.x = x12;
            htlcSmgLockParamsTemp.value = v2;

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(htlcSmgLockParamsTemp.skSmg, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

            // wait timeout
            await sleep(lockedTime + 1);
            // check user redeem
            await htlcInstProxy.inUserRedeem(tokenInfo.tokenOrigAccount,
                htlcSmgLockParamsTemp.x, {from: accounts[1]});
        } catch (err) {
            assert.include(err.toString(), "Redeem timeout");
        }
    });

    it('EOS->WAN inSmgRevoke  ==>Smart contract is halted', async () => {
        await htlcInstProxy.setHalt(true);
        try {
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.value = v2;
            htlcSmgLockParamsTemp.xHash = xHash5;

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);
        } catch (err) {
            assert.include(err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('EOS->WAN inSmgRevoke  ==>should wait for locked time', async () => {
        try {
            // accounts[1] is the wan address of the user.
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.value = v2;
            htlcSmgLockParamsTemp.xHash = xHash5;

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(htlcSmgLockParamsTemp.skSmg, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);


            await htlcInstProxy.inSmgRevoke(tokenInfo.tokenOrigAccount, xHash5);
        } catch (err) {
            assert.include(err.toString(), "Revoke is not permitted");
        }
    });

    it('EOS->WAN inSmgRevoke  ==>success', async () => {
        try {
            await sleep(lockedTime);
            await htlcInstProxy.inSmgRevoke(tokenInfo.tokenOrigAccount, xHash5);
        } catch (err) {
            assert.fail(err);
        }
    });

    it('EOS->WAN inSmgRevoke  ==>Status is not locked', async () => {
        try {
            await htlcInstProxy.inSmgRevoke(tokenInfo.tokenOrigAccount, xHash5);
        } catch (err) {
            assert.include(err.toString(), "Status is not locked");
        }
    });

    it('EOS->WAN inSmgRevoke  ==>Token manager is null', async () => {
        try {
            await htlcInstNotInit.inSmgRevoke(tokenInfo.tokenOrigAccount, xHash5);
        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }
    });

    it('WAN->EOS outUserLock  ==> Token manager is null', async () => {

        let error = null;
        try {
            // account[0] has no WEOS
            htlcUserLockParams.userOrigAccount = accounts[3];
            await htlcInstNotInit.outUserLock(htlcUserLockParams.xHash,
                htlcUserLockParams.value,
                tokenInfoNotReg.tokenOrigAccount,
                htlcUserLockParams.userOrigAccount,
                htlcSmgLockParams.storemanGroupPK);

        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
            error = err;
        }
        if (!error) {
            assert.fail("should catch a error!")
        }

    });

    it('WAN->EOS outUserLock  ==> Smart contract is halted', async () => {
        await htlcInstProxy.setHalt(true);
        let error = null;
        try {
            // account[0] has no WEOS
            htlcUserLockParams.userOrigAccount = accounts[3];
            await htlcInstProxy.outUserLock(htlcUserLockParams.xHash,
                htlcUserLockParams.value,
                tokenInfoNotReg.tokenOrigAccount,
                htlcUserLockParams.userOrigAccount,
                htlcSmgLockParams.storemanGroupPK);

        } catch (err) {
            assert.include(err.toString(), "Smart contract is halted");
            error = err;
        }
        if (!error) {
            assert.fail("should catch a error!")
        }
        await htlcInstProxy.setHalt(false);
    });

    it('WAN->EOS outUserLock  ==> Token is not registered', async () => {
        let error = null;
        try {
            // account[0] has no WEOS
            htlcUserLockParams.userOrigAccount = accounts[3];
            await htlcInstProxy.outUserLock(htlcUserLockParams.xHash,
                htlcUserLockParams.value,
                tokenInfoNotReg.tokenOrigAccount,
                htlcUserLockParams.userOrigAccount,
                htlcSmgLockParams.storemanGroupPK);

        } catch (err) {
            assert.include(err.toString(), "Token is not registered");
            error = err;
        }
        if (!error) {
            assert.fail("should catch a error!")
        }
    });

    it('WAN->EOS outUserLock  ==> Account has no WEOS', async () => {
        let error = null;
        try {
            // account[0] has no WEOS
            htlcUserLockParams.userOrigAccount = accounts[3];
            await htlcInstProxy.outUserLock(htlcUserLockParams.xHash,
                htlcUserLockParams.value,
                htlcUserLockParams.tokenOrigAccount,
                htlcUserLockParams.userOrigAccount,
                htlcSmgLockParams.storemanGroupPK);

        } catch (err) {
            error = err;
        }
        if (!error) {
            assert.fail("should catch a error!")
        }
    });

    it('WAN->EOS outUserLock  ==> Before lock, No approve', async () => {
        let error = null;
        try {

            htlcUserLockParams.userOrigAccount = accounts[3];
            await htlcInstProxy.outUserLock(htlcUserLockParams.xHash,
                htlcUserLockParams.value,
                htlcUserLockParams.tokenOrigAccount,
                htlcUserLockParams.userOrigAccount,
                htlcSmgLockParams.storemanGroupPK, {from: accounts[1], value: htlcUserLockParams.value});

        } catch (err) {
            error = err;
        }
        if (!error) {
            assert.fail("should catch a error!")
        }
    });

    it('WAN->EOS outUserLock  ==> Transferred fee is not enough', async () => {

        let result = null;
        try {
            let balanceBeforeLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
            //check use has get the WEOS redeemed.
            let wanTokenSCAddr = ret[3];
            let wanTokenScInst = await WanToken.at(wanTokenSCAddr);
            await wanTokenScInst.approve(htlcInstProxy.address, 0, {from: accounts[1]});
            await wanTokenScInst.approve(htlcInstProxy.address, appproveValue, {from: accounts[1]});
            let balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);

            assert.equal(balanceBeforeLock, balanceAfterLock, "Approve should not withdraw the token!");

            let txFee = (new BN(htlcUserLockParams.value))
                .div(new BN(10).pow(new BN(tokenInfo.decimals)))
                .mul(new BN(10).pow(new BN(18)))
                .mul(new BN(tokenInfo.token2WanRatio))
                .mul(new BN(addSmgParams.txFeeRatio))
                .div(new BN(DEFAULT_PRECISE))
                .div(new BN(DEFAULT_PRECISE));
            let txFeeNotEnough = txFee.sub(new BN(1));


            let htlcUserLockParamsTemp = Object.assign({}, htlcUserLockParams);
            htlcUserLockParamsTemp.xHash = xHash10;
            htlcUserLockParamsTemp.userOrigAccount = accounts[3];

            await htlcInstProxy.outUserLock(htlcUserLockParamsTemp.xHash,
                htlcUserLockParamsTemp.value,
                htlcUserLockParamsTemp.tokenOrigAccount,
                htlcUserLockParamsTemp.userOrigAccount,
                htlcUserLockParamsTemp.storemanGroupPK, {from: accounts[1], value: txFeeNotEnough});

        } catch (err) {
            result = err;
            //assert.include(err.toString(),"Transferred fee is not enough");
        }
        if (!result) {
            assert.fail("should Transferred fee is not enough")
        }
    });

    it('WAN->EOS outUserLock  ==> success', async () => {
        try {
            //  lock before approve
            let balanceBeforeLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
            //check use has get the WEOS redeemed.
            let wanTokenSCAddr = ret[3];
            let wanTokenScInst = await WanToken.at(wanTokenSCAddr);

            await wanTokenScInst.approve(htlcInstProxy.address, 0, {from: accounts[1]});
            await wanTokenScInst.approve(htlcInstProxy.address, appproveValue, {from: accounts[1]});
            let balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            assert.equal(balanceBeforeLock, balanceAfterLock, "Approve should not withdraw the token!");

            let txFee = (new BN(htlcUserLockParams.value))
                .div(new BN(10).pow(new BN(tokenInfo.decimals)))
                .mul(new BN(10).pow(new BN(18)))
                .mul(new BN(tokenInfo.token2WanRatio))
                .mul(new BN(addSmgParams.txFeeRatio))
                .div(new BN(DEFAULT_PRECISE))
                .div(new BN(DEFAULT_PRECISE));

            //console.log("txFee:"+txFee.toString());
            let htlcUserLockParamsTemp = Object.assign({}, htlcUserLockParams);
            htlcUserLockParamsTemp.userOrigAccount = accounts[3];

            let beforeCoin = await web3.eth.getBalance(accounts[1]);
            //console.log("beforeCoin:"+beforeCoin);

            let txLockRpt = await htlcInstProxy.outUserLock(htlcUserLockParamsTemp.xHash,
                htlcUserLockParamsTemp.value,
                htlcUserLockParamsTemp.tokenOrigAccount,
                htlcUserLockParamsTemp.userOrigAccount,
                htlcUserLockParamsTemp.storemanGroupPK, {from: accounts[1], value: htlcUserLockParams.value});

            //console.log(txLockRpt);
            let txLock = await web3.eth.getTransaction(txLockRpt.tx);
            //console.log(txLock);

            //console.log("gasUsed:"+txLockRpt.receipt.gasUsed);
            //console.log("gasPrice:"+txLock.gasPrice);
            let AfterCoin = await web3.eth.getBalance(accounts[1]);
            //console.log("AfterCoin:"+AfterCoin);

            // beforeCoin-AfterCoin = txFee + gasUsed*gasPrice
            // check coin
            let bnGasCoin = new BN(txLockRpt.receipt.gasUsed).mul(new BN(txLock.gasPrice));
            let bnCoinUsed = bnGasCoin.add(txFee);

            balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);

            assert.equal((new BN(beforeCoin).sub(new BN(AfterCoin))).toString(),
                bnCoinUsed.toString(),
                "After lock, the balance of coin is not right!");
            // check token
            assert.equal(balanceAfterLock,
                (new BN(balanceBeforeLock).sub(new BN(htlcUserLockParams.value))).toString(),
                "After lock, the balance of token is not right!")
        } catch (err) {
            assert.fail(err);
        }
    });

    it('WAN->EOS outUserLock  User tx is exist==> ', async () => {
        try {
            //  lock before approve
            let balanceBeforeLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
            //check use has get the WEOS redeemed.
            let wanTokenSCAddr = ret[3];
            let wanTokenScInst = await WanToken.at(wanTokenSCAddr);

            await wanTokenScInst.approve(htlcInstProxy.address, 0, {from: accounts[1]});
            await wanTokenScInst.approve(htlcInstProxy.address, appproveValue, {from: accounts[1]});
            let balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            assert.equal(balanceBeforeLock, balanceAfterLock, "Approve should not withdraw the token!");

            let txFee = (new BN(htlcUserLockParams.value))
                .div(new BN(10).pow(new BN(tokenInfo.decimals)))
                .mul(new BN(10).pow(new BN(18)))
                .mul(new BN(tokenInfo.token2WanRatio))
                .mul(new BN(addSmgParams.txFeeRatio))
                .div(new BN(DEFAULT_PRECISE))
                .div(new BN(DEFAULT_PRECISE));

            let htlcUserLockParamsTemp = Object.assign({}, htlcUserLockParams);
            htlcUserLockParamsTemp.userOrigAccount = accounts[3];
            await htlcInstProxy.outUserLock(htlcUserLockParamsTemp.xHash,
                htlcUserLockParamsTemp.value,
                htlcUserLockParamsTemp.tokenOrigAccount,
                htlcUserLockParamsTemp.userOrigAccount,
                htlcUserLockParamsTemp.storemanGroupPK, {from: accounts[1], value: htlcUserLockParams.value});
        } catch (err) {
            assert.include(err.toString(), "User tx is exist");
        }
    });

    it('WAN->EOS outUserLock lock value 0, Value is invalid', async () => {
        try {
            let htlcUserLockParamsTemp = Object.assign({}, htlcUserLockParams);
            //  lock before approve
            let balanceBeforeLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
            //check use has get the WEOS redeemed.
            let wanTokenSCAddr = ret[3];
            let wanTokenScInst = await WanToken.at(wanTokenSCAddr);

            await wanTokenScInst.approve(htlcInstProxy.address, 0, {from: accounts[1]});
            await wanTokenScInst.approve(htlcInstProxy.address, appproveValue, {from: accounts[1]});
            let balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            assert.equal(balanceBeforeLock, balanceAfterLock, "Approve should not withdraw the token!");

            htlcUserLockParamsTemp.value = valueZero;
            let txFee = (new BN(htlcUserLockParamsTemp.value))
                .div(new BN(10).pow(new BN(tokenInfo.decimals)))
                .mul(new BN(10).pow(new BN(18)))
                .mul(new BN(tokenInfo.token2WanRatio))
                .mul(new BN(addSmgParams.txFeeRatio))
                .div(new BN(DEFAULT_PRECISE))
                .div(new BN(DEFAULT_PRECISE));

            htlcUserLockParamsTemp.userOrigAccount = accounts[3];
            await htlcInstProxy.outUserLock(htlcUserLockParamsTemp.xHash,
                htlcUserLockParamsTemp.value,
                htlcUserLockParamsTemp.tokenOrigAccount,
                htlcUserLockParamsTemp.userOrigAccount,
                htlcUserLockParamsTemp.storemanGroupPK, {from: accounts[1], value: htlcUserLockParamsTemp.value});
        } catch (err) {
            assert.include(err.toString(), "Value is invalid");
        }
    });

    it('WAN->EOS outSmgRedeem ==> Smart contract is halted', async () => {
        await htlcInstProxy.setHalt(true);
        try {
            htlcSmgRedeemParams.x = x1;
            await htlcInstProxy.outSmgRedeem(htlcSmgRedeemParams.tokenOrigAccount,
                htlcSmgRedeemParams.x,
                htlcSmgRedeemParams.r,
                htlcSmgRedeemParams.s);
        } catch (err) {
            assert.include(err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('WAN->EOS outSmgRedeem ==> Token manager is null', async () => {

        try {
            htlcSmgRedeemParams.x = x1;
            await htlcInstNotInit.outSmgRedeem(htlcSmgRedeemParams.tokenOrigAccount,
                htlcSmgRedeemParams.x,
                htlcSmgRedeemParams.r,
                htlcSmgRedeemParams.s);
        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }

    });

    it('WAN->EOS outSmgRedeem ==> use wrong x', async () => {
        try {
            htlcSmgRedeemParams.x = x1;
            await htlcInstProxy.outSmgRedeem(htlcSmgRedeemParams.tokenOrigAccount,
                htlcSmgRedeemParams.x,
                htlcSmgRedeemParams.r,
                htlcSmgRedeemParams.s);
        } catch (err) {
            assert.include(err.toString(), "not locked");
        }
    });

    it('WAN->EOS outSmgRedeem ==> Success', async () => {
        try {
            let htlcSmgRedeemParamsTemp = Object.assign({}, htlcSmgRedeemParams);
            htlcSmgRedeemParamsTemp.x = x2;

            let typeList = PrmTypeList.outSmgRedeem;
            let ValueList = buildParametersArray(htlcSmgRedeemParamsTemp.tokenOrigAccount,
                htlcSmgRedeemParamsTemp.x);
            htlcSmgRedeemParamsTemp.s = schnorr.getS(skSmg1, typeList, ValueList);

            await htlcInstProxy.outSmgRedeem(htlcSmgRedeemParamsTemp.tokenOrigAccount,
                htlcSmgRedeemParamsTemp.x,
                htlcSmgRedeemParamsTemp.r,
                htlcSmgRedeemParamsTemp.s);

        } catch (err) {
            assert.fail(err);
        }
    });

    it('WAN->EOS outSmgRedeem ==> Redeem timeout', async () => {
        try {
            //  lock before approve
            let balanceBeforeLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
            //check use has get the WEOS redeemed.
            let wanTokenSCAddr = ret[3];
            let wanTokenScInst = await WanToken.at(wanTokenSCAddr);

            // approve
            await wanTokenScInst.approve(htlcInstProxy.address, 0, {from: accounts[1]});
            await wanTokenScInst.approve(htlcInstProxy.address, appproveValue, {from: accounts[1]});
            let balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            assert.equal(balanceBeforeLock, balanceAfterLock, "Approve should not withdraw the token!");

            let txFee = (new BN(htlcUserLockParams.value))
                .div(new BN(10).pow(new BN(tokenInfo.decimals)))
                .mul(new BN(10).pow(new BN(18)))
                .mul(new BN(tokenInfo.token2WanRatio))
                .mul(new BN(addSmgParams.txFeeRatio))
                .div(new BN(DEFAULT_PRECISE))
                .div(new BN(DEFAULT_PRECISE));

            let htlcUserLockParamsTemp = Object.assign({}, htlcUserLockParams);
            htlcUserLockParamsTemp.userOrigAccount = accounts[3];
            htlcUserLockParamsTemp.value = v5;
            htlcUserLockParamsTemp.xHash = xHash13;
            htlcUserLockParamsTemp.x = x13;

            await htlcInstProxy.outUserLock(htlcUserLockParamsTemp.xHash,
                htlcUserLockParamsTemp.value,
                htlcUserLockParamsTemp.tokenOrigAccount,
                htlcUserLockParamsTemp.userOrigAccount,
                htlcUserLockParamsTemp.storemanGroupPK, {from: accounts[1], value: htlcUserLockParamsTemp.value});

            await sleep(2 * lockedTime + 1);

            let htlcSmgRedeemParamsTemp = Object.assign({}, htlcSmgRedeemParams);
            htlcSmgRedeemParamsTemp.x = x13;

            await htlcInstProxy.outSmgRedeem(htlcSmgRedeemParamsTemp.tokenOrigAccount,
                htlcSmgRedeemParamsTemp.x,
                htlcSmgRedeemParamsTemp.r,
                htlcSmgRedeemParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Redeem timeout");
        }
    });

    it('WAN->EOS outSmgRedeem ==> redeem twice, Status is not locked', async () => {
        try {

            let htlcSmgRedeemParamsTemp = Object.assign({}, htlcSmgRedeemParams);
            htlcSmgRedeemParamsTemp.x = x2;

            await htlcInstProxy.outSmgRedeem(htlcSmgRedeemParamsTemp.tokenOrigAccount,
                htlcSmgRedeemParamsTemp.x,
                htlcSmgRedeemParamsTemp.r,
                htlcSmgRedeemParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Status is not locked");
        }
    });

    it('WAN->EOS outUserRevoke  ==>should wait 2*lockedTime,not wait', async () => {
        let htlcUserLockParamsTemp;
        try {
            //  lock before approve
            let balanceBeforeLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
            //check use has get the WEOS redeemed.
            let wanTokenSCAddr = ret[3];
            let wanTokenScInst = await WanToken.at(wanTokenSCAddr);

            await wanTokenScInst.approve(htlcInstProxy.address, 0, {from: accounts[1]});
            await wanTokenScInst.approve(htlcInstProxy.address, appproveValue, {from: accounts[1]});
            let balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);

            assert.equal(balanceBeforeLock, balanceAfterLock, "Approve should not withdraw the token!");
            // lock
            htlcUserLockParams.userOrigAccount = accounts[3];

            htlcUserLockParamsTemp = Object.assign({}, htlcUserLockParams);
            htlcUserLockParamsTemp.xHash = xHash4;
            htlcUserLockParamsTemp.value = v3;
            await htlcInstProxy.outUserLock(htlcUserLockParamsTemp.xHash,
                htlcUserLockParamsTemp.value,
                htlcUserLockParamsTemp.tokenOrigAccount,
                htlcUserLockParamsTemp.userOrigAccount,
                htlcUserLockParamsTemp.storemanGroupPK, {from: accounts[1], value: htlcUserLockParams.value});

            balanceAfterLock = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            assert.equal(balanceAfterLock, balanceBeforeLock - htlcUserLockParamsTemp.value, "After lock, the balance is not right!");

        } catch (err) {
            assert.fail(err.toString());
        }

        // revoke
        try {
            await htlcInstProxy.outUserRevoke(tokenInfo.tokenOrigAccount, htlcUserLockParamsTemp.xHash);
        } catch (err) {
            assert.include(err.toString(), "Revoke is not permitted");
        }
    });

    it('WAN->EOS outUserRevoke  ==>Smart contract is halted', async () => {
        // revoke
        await htlcInstProxy.setHalt(true);
        try {
            await htlcInstProxy.outUserRevoke(tokenInfo.tokenOrigAccount, xHash4);
        } catch (err) {
            assert.include(err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('WAN->EOS outUserRevoke  ==>should wait 2*lockedTime,now only wait lockedTime', async () => {
        // revoke
        try {
            await sleep(lockedTime);
            await htlcInstProxy.outUserRevoke(tokenInfo.tokenOrigAccount, xHash4);
        } catch (err) {
            assert.include(err.toString(), "Revoke is not permitted");
        }
    });

    it('WAN->EOS outUserRevoke  ==>Token manager is null', async () => {
        // revoke
        try {
            await htlcInstNotInit.outUserRevoke(tokenInfo.tokenOrigAccount, xHash4);
        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }
    });

    it('Others outUserRevoke  ==>success', async () => {
        // revoke
        try {
            let ret = await htlcInstProxy.getEconomics();
            //console.log("revokeRatio[org]:"+ret[2].toString());
            await htlcInstProxy.setEconomics(ret[0],ret[1],revokeFeeRatio);
            //console.log("revokeRatio[new]:"+revokeFeeRatio.toString());

            await sleep(2 * lockedTime);
            let balanceBeforeRevoke = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let beforeCoin = await web3.eth.getBalance(accounts[1]);
            //console.log("beforeCoin:"+beforeCoin.toString());

            //let txRevokeRpt = await htlcInstProxy.outUserRevoke(tokenInfo.tokenOrigAccount, xHash4);
            let txRevokeRpt = await htlcInstProxy.outUserRevoke(tokenInfo.tokenOrigAccount, xHash4, {from:accounts[1]});
            let txRevoke = await web3.eth.getTransaction(txRevokeRpt.tx);

            let balanceAfterRevoke = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            let afterCoin = await web3.eth.getBalance(accounts[1]);
            //console.log("afterCoin:"+afterCoin.toString());

            //check token
            assert.equal(balanceAfterRevoke, (new BN(balanceBeforeRevoke)).add(v3), "The balance of revoked is not right!");


            let txLockFee = (new BN(v3))
                .div(new BN(10).pow(new BN(tokenInfo.decimals)))
                .mul(new BN(10).pow(new BN(18)))
                .mul(new BN(tokenInfo.token2WanRatio))
                .mul(new BN(addSmgParams.txFeeRatio))
                .div(new BN(DEFAULT_PRECISE))
                .div(new BN(DEFAULT_PRECISE));

            let txRevokeFee = txLockFee.mul(new BN(revokeFeeRatio)).div(new BN(DEFAULT_PRECISE));
            let returnCoin = txLockFee.sub(txRevokeFee);

            //console.log("txRevokeFee:"+txRevokeFee.toString());
            //console.log("returnCoin:"+returnCoin.toString());

            //console.log("gasUsed:"+txRevokeRpt.receipt.gasUsed);
            //console.log("gasPrice:"+txRevoke.gasPrice);
            // check coin
            let bnGasCoin = new BN(txRevokeRpt.receipt.gasUsed).mul(new BN(txRevoke.gasPrice));

            //console.log("bnCoinUsed:"+bnGasCoin.toString());
            let afterCoinExpect = new BN(beforeCoin).add(returnCoin).sub(bnGasCoin);

            assert.equal(afterCoin.toString(),
                afterCoinExpect.toString(),
                "After lock, the balance of coin is not right!");
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Others outUserRevoke  ==>Status is not locked', async () => {
        // revoke
        try {
            let balanceBeforeRevoke = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            await htlcInstProxy.outUserRevoke(tokenInfo.tokenOrigAccount, xHash4);
            let balanceAfterRevoke = await getValueFromContract(tokenInfo.tokenOrigAccount, accounts[1]);
            assert.equal(balanceAfterRevoke, (new BN(balanceBeforeRevoke)).add(v3), "The balance of revoked is not right!");
        } catch (err) {
            assert.include(err.toString(), "Status is not locked");
        }
    });

    it('Other addStoremanGroup  ==>Only storeman group admin sc can call it', async () => {
        try {
            await htlcInstProxy.addStoremanGroup(tokenInfo.tokenOrigAccount, storemanPK1, quota2, txFeeRatio1);
        } catch (err) {
            assert.include(err.toString(), "Only storeman group admin sc can call it");
        }
    });

    it('Other deactivateStoremanGroup  ==>Only storeman group admin sc can call it', async () => {
        try {
            await htlcInstProxy.deactivateStoremanGroup(tokenInfo.tokenOrigAccount, storemanPK1);
        } catch (err) {
            assert.include(err.toString(), "Only storeman group admin sc can call it");
        }
    });

    it('Other delStoremanGroup  ==>Only storeman group admin sc can call it', async () => {
        try {
            await htlcInstProxy.delStoremanGroup(tokenInfo.tokenOrigAccount, storemanPK1);
        } catch (err) {
            assert.include(err.toString(), "Only storeman group admin sc can call it");
        }
    });

    it('Other smgAppendQuota  ==>Only storeman group admin sc can call it', async () => {
        try {
            await htlcInstProxy.updateStoremanGroup(tokenInfo.tokenOrigAccount, storemanPK1, quota2);
        } catch (err) {
            assert.include(err.toString(), "Only storeman group admin sc can call it");
        }
    });

    it('Other deactivateStoremanGroup  ==>Sender must be delegate', async () => {
        try {
            await smgInst.storemanGroupUnregister(tokenInfo.tokenOrigAccount, storemanPK1);
        } catch (err) {
            assert.include(err.toString(), "Sender must be delegate");
        }
    });

    it('Other delStoremanGroup  ==>Sender must be delegate', async () => {
        try {
            await smgInst.storemanGroupWithdrawDeposit(tokenInfo.tokenOrigAccount, storemanPK1);
        } catch (err) {
            assert.include(err.toString(), "Sender must be delegate");
        }
    });

    it('Other deactivateStoremanGroup  ==>success', async () => {
        try {
            await smgInstProxy.storemanGroupUnregister(tokenInfo.tokenOrigAccount, storemanPK1);
        } catch (err) {
            assert.include(err.toString(), "Sender must be delegate");
        }
    });

    it('Other storemanGroupWithdrawDeposit  ==>success', async () => {
        try {
            await smgInstProxy.storemanGroupWithdrawDeposit(tokenInfo.tokenOrigAccount, storemanPK1);
        } catch (err) {
            assert.include(err.toString(), "Sender must be delegate");
        }
    });

    it('Other storemanGroupUnregister  ==> storemanGroupUnregister success', async () => {
        try {
            await smgInstProxy.storemanGroupUnregister(tokenInfo.tokenOrigAccount, storemanPK1, {from: accounts[2]});
        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Other storemanGroupWithdrawDeposit  ==>storemanGroupWithdrawDeposit should wait time.', async () => {
        try {
            await smgInstProxy.storemanGroupWithdrawDeposit(tokenInfo.tokenOrigAccount, storemanPK1, {from: accounts[2]});
        } catch (err) {
            assert.include(err.toString(), "Must wait until delay time");
        }
    });

    it('Debt  ==>register two storeman group for debt', async () => {
        try {
            let addSmgParamsTemp = Object.assign({}, addSmgParams);
            addSmgParamsTemp.storemanGroupPK = srcDebtStoremanPK;
            // source storman
            await smgInstProxy.storemanGroupRegister(addSmgParamsTemp.tokenOrigAccount,
                addSmgParamsTemp.storemanGroupPK,
                addSmgParamsTemp.txFeeRatio, {from: accounts[4], value: tokenInfo.minDeposit});

            // destination storman
            addSmgParamsTemp.storemanGroupPK = dstDebtStoremanPK;
            await smgInstProxy.storemanGroupRegister(addSmgParamsTemp.tokenOrigAccount,
                addSmgParamsTemp.storemanGroupPK,
                addSmgParamsTemp.txFeeRatio, {from: accounts[6], value: tokenInfo.minDeposit});

        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Debt  ==>inDebtLock Smart contract is halted', async () => {
        await htlcInstProxy.setHalt(true);
        let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
        try {
            await htlcInstProxy.inDebtLock(tokenInfoNotReg.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('Debt  ==>inDebtLock Token is not registered', async () => {
        let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
        try {

            await htlcInstProxy.inDebtLock(tokenInfoNotReg.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Token is not registered");
        }

    });

    it('Debt  ==>inDebtLock Token manager is null', async () => {
        let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
        try {

            await htlcInstNotInit.inDebtLock(tokenInfoNotReg.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }

    });

    it('Debt  ==>inDebtLock PK is active should deactive', async () => {
        let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
        try {

            let typeList = PrmTypeList.inDebtLock;
            let ValueList = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                '0x' + htlcDebtLockParamsTemp.value.toString(16));
            htlcDebtLockParamsTemp.s = schnorr.getS(htlcDebtLockParamsTemp.skDstSmg, typeList, ValueList);

            await htlcInstProxy.inDebtLock(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "PK is active");
        }

    });

    it('Debt  ==>inDebtLock success', async () => {
        let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
        try {

            // accounts[1] is the wan address of the user.
            // lock
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.xHash = xHash7;
            htlcSmgLockParamsTemp.storemanGroupPK = srcDebtStoremanPK;
            htlcSmgLockParamsTemp.value = v3;

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(skSrcSmg, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

            // redeem
            let htlcUserRedeemParamsTemp = Object.assign({}, htlcUserRedeemParams);
            htlcUserRedeemParamsTemp.x = x7;
            await htlcInstProxy.inUserRedeem(tokenInfo.tokenOrigAccount,
                htlcUserRedeemParamsTemp.x, {from: accounts[1]});

            let srcQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.srcStoremanPK);
            let dstQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.dstStoremanPK);

            // deactive
            await smgInstProxy.storemanGroupUnregister(tokenInfo.tokenOrigAccount, srcDebtStoremanPK, {from: accounts[4]});

            // debtLock
            htlcDebtLockParamsTemp.value = v4;

            let typeList1 = PrmTypeList.inDebtLock;
            let ValueList1 = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                '0x' + htlcDebtLockParamsTemp.value.toString(16));
            htlcDebtLockParamsTemp.s = schnorr.getS(htlcDebtLockParamsTemp.skDstSmg, typeList1, ValueList1);

            await htlcInstProxy.inDebtLock(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

            srcQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.srcStoremanPK);
            dstQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.dstStoremanPK);

        } catch (err) {
            assert.fail(err.toString());
        }

    });

    it('Debt  ==>inDebtRedeem success', async () => {

        let htlcDebtRedeemParamsTemp = Object.assign({}, htlcDebtRedeemParams);
        try {

            let typeList = PrmTypeList.inDebtRedeem;
            let ValueList = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtRedeemParamsTemp.x);
            htlcDebtRedeemParamsTemp.s = schnorr.getS(htlcDebtRedeemParamsTemp.skSmg, typeList, ValueList);

            await htlcInstProxy.inDebtRedeem(tokenInfo.tokenOrigAccount,
                htlcDebtRedeemParamsTemp.x,
                htlcDebtRedeemParamsTemp.r,
                htlcDebtRedeemParamsTemp.s);

        } catch (err) {
            assert.fail(err.toString());
        }
    });

    it('Debt  ==>inDebtRedeem redeem twice Status is not locked', async () => {

        let htlcDebtRedeemParamsTemp = Object.assign({}, htlcDebtRedeemParams);
        try {
            await htlcInstProxy.inDebtRedeem(tokenInfo.tokenOrigAccount,
                htlcDebtRedeemParamsTemp.x,
                htlcDebtRedeemParamsTemp.r,
                htlcDebtRedeemParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Status is not locked");
        }
    });

    it('Debt  ==>inDebtLock Debt tx is exist', async () => {
        let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
        try {
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.xHash = xHash7;
            // debtLock
            htlcDebtLockParamsTemp.value = v4;

            let typeList = PrmTypeList.inDebtLock;
            let ValueList = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                '0x' + htlcDebtLockParamsTemp.value.toString(16));
            htlcDebtLockParamsTemp.s = schnorr.getS(htlcDebtLockParamsTemp.skDstSmg, typeList, ValueList);

            await htlcInstProxy.inDebtLock(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Debt tx is exist");
        }

    });

    it('Debt  ==>inDebtLock lock value 0, Value is invalid', async () => {
        let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
        try {
            // debtLock
            //htlcDebtLockParamsTemp.value = v4;
            htlcDebtLockParamsTemp.value = valueZero;

            let typeList = PrmTypeList.inDebtLock;
            let ValueList = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                '0x' + htlcDebtLockParamsTemp.value.toString(16));
            htlcDebtLockParamsTemp.s = schnorr.getS(htlcDebtLockParamsTemp.skDstSmg, typeList, ValueList);

            await htlcInstProxy.inDebtLock(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Value is invalid");
        }

    });

    it('Debt  ==>inDebtRedeem Smart contract is halted', async () => {
        await htlcInstProxy.setHalt(true);
        let htlcDebtRedeemParamsTemp = Object.assign({}, htlcDebtRedeemParams);
        try {
            await htlcInstProxy.inDebtRedeem(tokenInfo.tokenOrigAccount,
                htlcDebtRedeemParamsTemp.x,
                htlcDebtRedeemParamsTemp.r,
                htlcDebtRedeemParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('Debt  ==>inDebtRedeem Redeem timeout', async () => {
        try {

            let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);

            let srcQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.srcStoremanPK);
            let dstQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.dstStoremanPK);

            // for redeem timeout
            htlcDebtLockParamsTemp.value = v5;
            htlcDebtLockParamsTemp.xHash = xHash14;

            let typeList = PrmTypeList.inDebtLock;
            let ValueList = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                '0x' + htlcDebtLockParamsTemp.value.toString(16));
            htlcDebtLockParamsTemp.s = schnorr.getS(htlcDebtLockParamsTemp.skDstSmg, typeList, ValueList);

            await htlcInstProxy.inDebtLock(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

            srcQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.srcStoremanPK);
            dstQuata = await queryStoremanGroupQuota(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.dstStoremanPK);

            let htlcDebtRedeemParamsTemp = Object.assign({}, htlcDebtRedeemParams);
            htlcDebtRedeemParamsTemp.x = x14;

            await sleep(lockedTime + 1);

            let typeList1 = PrmTypeList.inDebtRedeem;
            let ValueList1 = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtRedeemParamsTemp.x);

            htlcDebtRedeemParamsTemp.s = schnorr.getS(htlcDebtRedeemParamsTemp.skSmg, typeList1, ValueList1);
            await htlcInstProxy.inDebtRedeem(tokenInfo.tokenOrigAccount,
                htlcDebtRedeemParamsTemp.x,
                htlcDebtRedeemParamsTemp.r,
                htlcDebtRedeemParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Redeem timeout");
        }
    });

    it('Debt  ==>inDebtRedeem Token manager is null', async () => {

        let htlcDebtRedeemParamsTemp = Object.assign({}, htlcDebtRedeemParams);
        try {
            await htlcInstNotInit.inDebtRedeem(tokenInfo.tokenOrigAccount,
                htlcDebtRedeemParamsTemp.x,
                htlcDebtRedeemParamsTemp.r,
                htlcDebtRedeemParamsTemp.s);

        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }
    });

    it('Debt  ==>inDebtRevoke Token manager is null', async () => {

        try {

            let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
            htlcDebtLockParamsTemp.xHash = xHash8;
            await htlcInstNotInit.inDebtRevoke(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.xHash);

        } catch (err) {
            assert.include(err.toString(), "Token manager is null");
        }

    });

    it('Debt  ==>inDebtRevoke Smart contract is halted', async () => {
        await htlcInstProxy.setHalt(true);
        try {

            let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
            htlcDebtLockParamsTemp.xHash = xHash8;

            await htlcInstProxy.inDebtLock(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

            await htlcInstProxy.inDebtRevoke(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.xHash);

        } catch (err) {
            assert.include(err.toString(), "Smart contract is halted");
        }
        await htlcInstProxy.setHalt(false);
    });

    it('Debt  ==>inDebtRevoke Duplicate unregister', async () => {
        try {

            let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
            htlcDebtLockParamsTemp.xHash = xHash8;
            await smgInstProxy.storemanGroupUnregister(tokenInfo.tokenOrigAccount, srcDebtStoremanPK, {from: accounts[4]});

        } catch (err) {
            assert.include(err.toString(), "Duplicate unregister");
        }
    });

    it('Debt  ==>inDebtRevoke Revoke is not permitted', async () => {
        try {
            // register storeman
            let addSmgParamsTemp = Object.assign({}, addSmgParams);
            addSmgParamsTemp.storemanGroupPK = srcDebtStoremanPK1;
            // source storman
            await smgInstProxy.storemanGroupRegister(addSmgParamsTemp.tokenOrigAccount,
                addSmgParamsTemp.storemanGroupPK,
                addSmgParamsTemp.txFeeRatio, {from: accounts[4], value: tokenInfo.minDeposit});

            // accounts[1] is the wan address of the user.
            // lock
            let htlcSmgLockParamsTemp = Object.assign({}, htlcSmgLockParams);
            htlcSmgLockParamsTemp.wanAddr = accounts[1];
            htlcSmgLockParamsTemp.xHash = xHash9;
            htlcSmgLockParamsTemp.storemanGroupPK = srcDebtStoremanPK1;
            htlcSmgLockParamsTemp.value = v4;

            let typeList = PrmTypeList.inSmgLock;
            let ValueList = buildParametersArray(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                '0x' + htlcSmgLockParamsTemp.value.toString(16),
                htlcSmgLockParamsTemp.storemanGroupPK);
            htlcSmgLockParamsTemp.s = schnorr.getS(skSrcSmg1, typeList, ValueList);

            await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
                htlcSmgLockParamsTemp.xHash,
                htlcSmgLockParamsTemp.wanAddr,
                htlcSmgLockParamsTemp.value,
                htlcSmgLockParamsTemp.storemanGroupPK,
                htlcSmgLockParamsTemp.r,
                htlcSmgLockParamsTemp.s);

            // redeem
            let htlcUserRedeemParamsTemp = Object.assign({}, htlcUserRedeemParams);
            htlcUserRedeemParamsTemp.x = x9;
            await htlcInstProxy.inUserRedeem(tokenInfo.tokenOrigAccount,
                htlcUserRedeemParamsTemp.x, {from: accounts[1]});

            // deactive
            await smgInstProxy.storemanGroupUnregister(tokenInfo.tokenOrigAccount, srcDebtStoremanPK1, {from: accounts[4]});

            // debtLock
            let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
            htlcDebtLockParamsTemp.srcStoremanPK = srcDebtStoremanPK1;
            htlcDebtLockParamsTemp.xHash = xHash11;
            htlcDebtLockParamsTemp.value = v4;

            typeList = PrmTypeList.inDebtLock;
            ValueList = buildParametersArray(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                '0x' + htlcDebtLockParamsTemp.value.toString(16));
            htlcDebtLockParamsTemp.s = schnorr.getS(htlcDebtLockParamsTemp.skDstSmg, typeList, ValueList);

            await htlcInstProxy.inDebtLock(tokenInfo.tokenOrigAccount,
                htlcDebtLockParamsTemp.xHash,
                htlcDebtLockParamsTemp.value,
                htlcDebtLockParamsTemp.srcStoremanPK,
                htlcDebtLockParamsTemp.dstStoremanPK,
                htlcDebtLockParamsTemp.r,
                htlcDebtLockParamsTemp.s);

            await htlcInstProxy.inDebtRevoke(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.xHash);

        } catch (err) {
            assert.include(err.toString(), "Revoke is not permitted");
        }

    });

    it('Debt  ==>inDebtRevoke success', async () => {
        try {
            let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
            htlcDebtLockParamsTemp.xHash = xHash11;
            await sleep(2 * lockedTime);
            await htlcInstProxy.inDebtRevoke(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.xHash);

        } catch (err) {
            assert.fail(err.toString());
        }

    });

    it('Debt  ==>inDebtRevoke Status is not locked', async () => {
        try {
            let htlcDebtLockParamsTemp = Object.assign({}, htlcDebtLockParams);
            htlcDebtLockParamsTemp.xHash = xHash11;
            await htlcInstProxy.inDebtRevoke(tokenInfo.tokenOrigAccount, htlcDebtLockParamsTemp.xHash);

        } catch (err) {
            assert.include(err.toString(), "Status is not locked");
        }
    });

    it('Debt  ==>smgWithdrawFee', async () => {
        try {

            let typeList = PrmTypeList.smgWithdrawFee;
            let ValueList = buildParametersArray(accounts[6]);
            let tempS = schnorr.getS(skDstSmg, typeList, ValueList);

            await  htlcInstProxy.smgWithdrawFee(dstDebtStoremanPK, accounts[6], R, tempS);
        } catch (err) {
            assert.fail(err.toString());
        }
    });
});

async function sleep(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, time);
    });
};

async function getValueFromContract(tokenOrigAccount, userAccountAddress) {
    let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
    //check use has get the WEOS redeemed.
    let wanTokenSCAddr = ret[3];
    let wanTokenScInst = await WanToken.at(wanTokenSCAddr);
    let balance = await wanTokenScInst.balanceOf(userAccountAddress);
    return balance.toString();
};

async function queryStoremanGroupQuota(tokenOrigAccount, storemanGroupPK) {
    let ret = await htlcInstProxy.queryStoremanGroupQuota(tokenOrigAccount,
        storemanGroupPK);
    let result;
    result = {
        quota: ret[0].toString(),
        inboundQuota: ret[1].toString(),
        outboundQuota: ret[2].toString(),
        receivable: ret[3].toString(),
        payable: ret[4].toString(),
        debt: ret[5].toString(),
    };
    return result;
};

function buildParametersArray(...args) {
    let ret = [];
    for (let arg of args) {
        ret.push(arg);
    }
    return ret;
}