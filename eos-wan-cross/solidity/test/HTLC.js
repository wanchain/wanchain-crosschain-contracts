const TokenManagerProxy     = artifacts.require('TokenManagerProxy');
const TokenManagerDelegate  = artifacts.require('TokenManagerDelegate');
const Secp256k1             = artifacts.require('Secp256k1');
const SchnorrVerifier       = artifacts.require('SchnorrVerifier');
const QuotaLib              = artifacts.require('QuotaLib');
const HTLCLib               = artifacts.require('HTLCLib');
const HTLCDebtLib           = artifacts.require('HTLCDebtLib');
const HTLCSmgLib            = artifacts.require('HTLCSmgLib');
const HTLCUserLib           = artifacts.require('HTLCUserLib');
const HTLCProxy             = artifacts.require('HTLCProxy');
const HTLCDelegate          = artifacts.require('HTLCDelegate');
const StoremanGroupProxy    = artifacts.require('StoremanGroupProxy');
const StoremanGroupDelegate = artifacts.require('StoremanGroupDelegate');
const WanToken              = artifacts.require("WanToken");

let smgInstProxy, htlcInstProxy,tmInstProxy;
let smgInst, htlcInst,tmInst;

let revokeFeeRatio  = 100;
let ratioPrecise    = 10000;
let lockedTime      = 6*1000; //unit: ms

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

const v1            = 20;
const v2            = 10;
const appproveValue = 10;

const storemanPK1   = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebb9';
const quota1         = '100';
const txFeeRatio1    = '20';

const storemanPK2   = '0x047a5380730dde59cc2bffb432293d22364beb250912e0e73b11b655bf51fd7a8adabdffea4047d7ff2a9ec877815e12116a47236276d54b5679b13792719eebba';
const quota2        = '200';
const txFeeRatio2   = '20';

const R             = '0x042c73b8cbc70bb635922a60f5eb9e6dcae637bbb05869fa5a4134f0c5ec859c0462696cd577c419666045ec6310a85f6638532d8d23cdbc2006a60dc3fbbada7e';
const s             = '0x0c595b48605562a1a6492540b875da4ff203946a9dd0e451cd33d06ef568626b';

// token info.
let tokenInfo = {
  tokenOrigAccount      : web3.utils.hexToBytes(web3.utils.asciiToHex('Eos contract address')),
  token2WanRatio        : 10000,                  // 1:1
  minDeposit            : "10000000000000000000", // 10*10^18
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

let htlcUserRedeemParams={
  tokenOrigAccount: tokenInfo.tokenOrigAccount,
  x:x1
};

let htlcUserLockParams={
  xHash:xHash2,
  value:v2,
  tokenOrigAccount:tokenInfo.tokenOrigAccount,
  storemanGroupPK:storemanPK1,
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
  before("init...--> success", async() => {
    try{
      // get the instance
      let deploy;
      deploy          = await StoremanGroupProxy.deployed();
      smgInstProxy    = await StoremanGroupDelegate.at(deploy.address);

      deploy          = await HTLCProxy.deployed();
      htlcInstProxy   = await HTLCDelegate.at(deploy.address);

      deploy          = await TokenManagerProxy.deployed();
      tmInstProxy     = await TokenManagerDelegate.at(deploy.address);

      smgInst         = await StoremanGroupDelegate.deployed();
      tmInst          = await TokenManagerDelegate.deployed();
      htlcInst        = await HTLCDelegate.deployed();

      // register a token
      await tmInstProxy.addToken(tokenInfo.tokenOrigAccount,
        tokenInfo.token2WanRatio,
        tokenInfo.minDeposit,
        tokenInfo.withdrawDelayTime,
        tokenInfo.name,
        tokenInfo.symbol,
        tokenInfo.decimals);

      let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);

      // register storeman. the storeman delegate account is accounts[2]
      await smgInstProxy.storemanGroupRegisterByDelegate(addSmgParams.tokenOrigAccount,
        addSmgParams.storemanGroupPK,
        addSmgParams.txFeeRatio, {from: accounts[2], value:tokenInfo.minDeposit});

    }catch (err){
      assert.fail(err);
    }

  });

  /*
  ==========================================================================================
  init...
  ==========================================================================================
   */
  it('init... --> should call from smg sc address', async() => {
    try{
      await htlcInstProxy.addStoremanGroup(addSmgParams.tokenOrigAccount,
        addSmgParams.storemanGroupPK,
        addSmgParams.quota,
        addSmgParams.txFeeRatio);
    }catch(err){
      assert.include(err.toString(),"Only storeman group");
    }
  });

  it('init... --> Duplicate register', async() => {
    try{
      // value must > minDesposit
      await smgInstProxy.storemanGroupRegisterByDelegate(addSmgParams.tokenOrigAccount,
        addSmgParams.storemanGroupPK,
        addSmgParams.txFeeRatio);
    }catch(err){
      assert.include(err.toString(),"Duplicate register");
    }
  });

  it('init... --> Value must be greater than minDeposit', async() => {
    try{
      // value must > minDesposit
      let addSmgParamsTemp = Object.assign(addSmgParams);
      addSmgParamsTemp.storemanGroupPK = storemanPK2;
      await smgInstProxy.storemanGroupRegisterByDelegate(addSmgParamsTemp.tokenOrigAccount,
        addSmgParamsTemp.storemanGroupPK,
        addSmgParamsTemp.txFeeRatio);
    }catch(err){
      assert.include(err.toString(),"Value must be greater than minDeposit");
    }
  });
  /*
 ==========================================================================================
 EOS->WAN
 ==========================================================================================
  */
  it('EOS->WAN inSmgLock->success', async() => {
    try{
      // accounts[1] is the wan address of the user.
      let htlcSmgLockParamsTemp = Object.assign(htlcSmgLockParams);
      htlcSmgLockParamsTemp.wanAddr = accounts[1];
      await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
        htlcSmgLockParamsTemp.xHash,
        htlcSmgLockParamsTemp.wanAddr,
        htlcSmgLockParamsTemp.value,
        htlcSmgLockParamsTemp.storemanGroupPK,
        htlcSmgLockParamsTemp.r,
        htlcSmgLockParamsTemp.s);

    }catch(err){
      assert.fail(err);
    }
  });
  it('EOS->WAN inSmgLock->Quota is not enough', async() => {
    try{
      // accounts[1] is the wan address of the user.
      let htlcSmgLockParamsTemp = Object.assign(htlcSmgLockParams);
      htlcSmgLockParamsTemp.wanAddr = accounts[1];
      htlcSmgLockParamsTemp.value  = "1000000000000000000000"; // 100*10^18
      htlcSmgLockParamsTemp.xHash  = xHash3;
      await htlcInstProxy.inSmgLock(htlcSmgLockParamsTemp.tokenOrigAccount,
        htlcSmgLockParamsTemp.xHash,
        htlcSmgLockParamsTemp.wanAddr,
        htlcSmgLockParamsTemp.value,
        htlcSmgLockParamsTemp.storemanGroupPK,
        htlcSmgLockParamsTemp.r,
        htlcSmgLockParamsTemp.s);

    }catch(err){
      assert.include(err.toString(),"Quota is not enough");
    }
  });
  it('EOS->WAN inUserRedeem --> redeem from not the receiver', async() => {
    try{
      // accounts[1] is the wan address of the user.
      //Msg sender is incorrect
      await htlcInstProxy.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
         htlcUserRedeemParams.x);

    }catch(err){
      assert.include(err.toString(),"Msg sender is incorrect");
    }
  });

  it('EOS->WAN inUserRedeem --> success', async() => {
    try{
      await htlcInstProxy.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
        htlcUserRedeemParams.x, {from:accounts[1]});

      let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
      //check use has get the WEOS redeemed.
      let wanTokenSCAddr = ret[3];
      let wanTokenScInst = await WanToken.at(wanTokenSCAddr);
      //console.log("======wanTokenScInst=======");
      //console.log(wanTokenScInst);
      //console.log("======wanTokenScInst=======");
      let balance = await wanTokenScInst.balanceOf(accounts[1]);
      //console.log("address:",accounts[1]);
      //console.log("=====balance :", balance.toNumber());

    }catch(err){
      assert.fail(err);
    }
  });

  it('EOS->WAN inUserRedeem --> Redeem twice', async() => {
    try{
      await htlcInstProxy.inUserRedeem(htlcUserRedeemParams.tokenOrigAccount,
        htlcUserRedeemParams.x, {from:accounts[1]});
    }catch(err){
      assert.include(err.toString(),"Status is not locked");
    }
  });

  it('EOS->WAN inSmgRevoke', async() => {

  });

  /*
  ==========================================================================================
  WAN->EOS
  ==========================================================================================
 */

  it('WAN->EOS outUserLock--> Account has no WEOS', async() => {
    let error = null;
    try{
      // account[0] has no WEOS
      htlcUserLockParams.userOrigAccount = accounts[3];
      await htlcInstProxy.outUserLock(htlcUserLockParams.xHash,
        htlcUserLockParams.value,
        htlcUserLockParams.tokenOrigAccount,
        htlcUserLockParams.userOrigAccount,
        htlcSmgLockParams.storemanGroupPK);

    }catch(err){
      //assert.include(err.toString(),"Lock token failed");
      error = err;
    }
    if(!error){
      assert.fail("should catch a error!")
    }
  });

  it('WAN->EOS outUserLock--> Before lock, No approve', async() => {
    let error = null;
    try{

      htlcUserLockParams.userOrigAccount = accounts[3];
      await htlcInstProxy.outUserLock(htlcUserLockParams.xHash,
        htlcUserLockParams.value,
        htlcUserLockParams.tokenOrigAccount,
        htlcUserLockParams.userOrigAccount,
        htlcSmgLockParams.storemanGroupPK, {from:accounts[1]});

    }catch(err){
      //assert.include(err.toString(),"Lock token failed");
      error = err;
    }
    if(!error){
      assert.fail("should catch a error!")
    }
  });

  it('WAN->EOS outUserLock--> success', async() => {
    try{
      //  lock before approve
      let ret = await tmInstProxy.getTokenInfo(tokenInfo.tokenOrigAccount);
      //check use has get the WEOS redeemed.
      let wanTokenSCAddr = ret[3];
      let wanTokenScInst = await WanToken.at(wanTokenSCAddr);

      await wanTokenScInst.approve(htlcInstProxy.address,appproveValue,{from:accounts[1]});

      htlcUserLockParams.userOrigAccount = accounts[3];
      await htlcInstProxy.outUserLock(htlcUserLockParams.xHash,
        htlcUserLockParams.value,
        htlcUserLockParams.tokenOrigAccount,
        htlcUserLockParams.userOrigAccount,
        htlcSmgLockParams.storemanGroupPK, {from:accounts[1]});

    }catch(err){
      assert.fail(err);
    }
  });

  it('WAN->EOS outSmgRedeem--> use wrong x', async() => {
    try{
      htlcSmgRedeemParams.x = x1;
      await htlcInstProxy.outSmgRedeem(htlcSmgRedeemParams.tokenOrigAccount,
        htlcSmgRedeemParams.x,
        htlcSmgRedeemParams.r,
        htlcSmgRedeemParams.s);
    }catch(err){
      assert.include(err.toString(),"not locked");
    }
  });

  it('WAN->EOS outSmgRedeem--> Success', async() => {
    try{

      htlcSmgRedeemParams.x = x2;
      await htlcInstProxy.outSmgRedeem(htlcSmgRedeemParams.tokenOrigAccount,
        htlcSmgRedeemParams.x,
        htlcSmgRedeemParams.r,
        htlcSmgRedeemParams.s);
    }catch(err){
      assert.fail(err);
    }
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