const TokenManagerProxy = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate');
const Secp256k1 = artifacts.require('Secp256k1');
const SchnorrVerifier = artifacts.require('SchnorrVerifier');
const QuotaLib = artifacts.require('QuotaLib');
const HTLCLib = artifacts.require('HTLCLib');
const HTLCDebtLib = artifacts.require('HTLCDebtLib');
const HTLCSmgLib = artifacts.require('HTLCSmgLib');
const HTLCUserLib = artifacts.require('HTLCUserLib');
const HTLCProxy = artifacts.require('HTLCProxy');
const HTLCDelegate = artifacts.require('HTLCDelegate');
const StoremanGroupProxy = artifacts.require('StoremanGroupProxy');
const StoremanGroupDelegate = artifacts.require('StoremanGroupDelegate');

let smgInstProxy, htlcInstProxy,tmInstProxy;
let smgInst, htlcInst,tmInst;

let revokeFeeRatio  = 100;
let ratioPrecise    = 10000;
let lockedTime      = 60*1000; //unit: ms

// x and xhash
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

const storemanPK1   = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9';
const quota1         = '100';
const txFeeRatio1         = '20';

const storemanPK2   = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebba';
const quota2        = '100';
const txFeeRatio2   = '20';

const R             = '0x042c73b8cbc70bb635922a60f5eb9e6dcae637bbb05869fa5a4134f0c5ec859c0462696cd577c419666045ec6310a85f6638532d8d23cdbc2006a60dc3fbbada7e';
const s             = '0x0c595b48605562a1a6492540b875da4ff203946a9dd0e451cd33d06ef568626b';


// token info.
let tokenInfo = {
  tokenOrigAccount      : web3.utils.hexToBytes(web3.utils.asciiToHex('Eos contract address')),
  token2WanRatio        : 10,
  minDeposit            : "10000000000000000000",
  withdrawDelayTime     : 60 * 60 * 72,
  name                  : web3.utils.hexToBytes(web3.utils.asciiToHex('Eos')),
  symbol                : web3.utils.hexToBytes(web3.utils.asciiToHex('EOS')),
  decimals              : 18
};

let htlcSmgLockParams = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  xHash           : xHash1,
  wanAddr         : '',
  value           : v1,
  storemanGroupPK : storemanPK1,
  r               : R,
  s               : s,
};

let htlcSmgRedeemParams = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  tokenManager    : '',
  r               : R,
  s               : s,
  x               : x1,
};

let addSmgParams = {
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  storemanGroupPK: storemanPK1,
  quota:        quota1,
  txFeeRatio:   txFeeRatio1
};

let STATUS = {
  None      :       0,
  Locked    :       1,
  Refunded  :       2,
  Revoked   :       3
};
contract('Test HTLC', async (accounts) => {
  before("init...", async() => {
    try{
      // get the instance
      let deploy;
      deploy    = await StoremanGroupProxy.deployed();
      smgInstProxy   = await StoremanGroupDelegate.at(deploy.address);

      deploy    = await HTLCProxy.deployed();
      htlcInstProxy  = await HTLCDelegate.at(deploy.address);

      deploy    = await TokenManagerProxy.deployed();
      tmInstProxy    = await TokenManagerDelegate.at(deploy.address);

      smgInst    = await StoremanGroupDelegate.deployed();

      tmInst   = await TokenManagerDelegate.deployed();

      htlcInst   = await HTLCDelegate.deployed();

      // register a token
      await tmInstProxy.addToken(tokenInfo.tokenOrigAccount,
        tokenInfo.token2WanRatio,
        tokenInfo.minDeposit,
        tokenInfo.withdrawDelayTime,
        tokenInfo.name,
        tokenInfo.symbol,
        tokenInfo.decimals);
    }catch (err){
      assert.fail(err);
    }

    // register storeman and active.
    // await htlcInstProxy.addStoremanGroup(addSmgParams.tokenOrigAccount,
    //   addSmgParams.storemanGroupPK,
    //   addSmgParams.quota,
    //   addSmgParams.txFeeRatio,{from:smgInstProxy.address});

  });

  it('EOS->WAN inSmgLock', async() => {
    try{
      // htlcSmgLockParams.wanAddr = accounts[1];
      // await htlcInstProxy.inSmgLock(htlcSmgLockParams.tokenOrigAccount,
      //   htlcSmgLockParams.xHash,
      //   htlcSmgLockParams.wanAddr,
      //   htlcSmgLockParams.value,
      //   htlcSmgLockParams.storemanGroupPK,
      //   htlcSmgLockParams.r,
      //   htlcSmgLockParams.s);
    }catch(err){
      assert.fail(err);
    }

    // EOS->WAN
  });

  it('EOS->WAN inUserRedeem', async() => {

  });

  it('EOS->WAN inSmgRevoke', async() => {

  });

  it('WAN->EOS outUserLock', async() => {

  });

  it('WAN->EOS outSmgRedeem', async() => {

  });

  it('WAN->EOS outUserRevoke', async() => {

  });

});

async function sleep(time){
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  });
}

/*
let htlcUserLockParams {
  bytes32 xHash;
  uint value;
  bytes tokenOrigAccount;
  bytes userOrigAccount;
  bytes storemanGroupPK;
  ITokenManager tokenManager;
}
let htlcUserRedeemParams {
  bytes tokenOrigAccount;
  ITokenManager tokenManager;
  bytes32 x;
}

let htlcUserRevokeParams {
  bytes tokenOrigAccount;
  ITokenManager tokenManager;
  bytes32 xHash;
}


let smgLckPrms = {

};
*/

