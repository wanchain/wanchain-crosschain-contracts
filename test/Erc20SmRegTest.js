var solc = require('solc');
var fs = require('fs');
var path = require('path');

const BigNumber = require('bignumber.js')
const ETH_EXP = new BigNumber('1000000000000000000') ;

const web3 = global.web3

const smgAdmin = artifacts.require('./ERC20StoremanGroupAdmin.sol');
const smNodesAdmin = artifacts.require('./StoremanNodesAdmin.sol')
const smNode = artifacts.require('./StoremanNode.sol');

const smgAdminAddr = '0xce8247f380aeaf91084a836569213605ff6332a2';
const smgAdminInst=smgAdmin.at(smgAdminAddr);

function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};

function sleepUntil(unixTimeStamp) {
    while (new Date().getTime() < unixTimeStamp*1000);
};



contract('deploy donctracts',  ()=> {

  //const owner = "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8"

  const owner = "0x824ce1ef03338cb0fbb7cbb52f9c4087490d6994"
  const partner = owner;

  let smNodesAdminInst;

  let smNodeInst1;
  let smNodeInst2;
  let smNodeInst3;
  let smNodeInst4;
  let smNodeInst5;
  let smNodeInst6;

  let ETHEREUM_ID = 0
                      //0xd87b59aadf86976a2877e3947b364a4f5ac93bd3
  let ptokenOrigAddr = '0xd87b59aadf86976a2877e3947b364a4f5ac93bd3';
  let psmgAdminAddr = smgAdminAddr;

  //let pMpcSignerAddr = '0xcd5a7fcc744481d75ab3251545befb282e785882';//dev net accounts[2]
  //let pMpcSignerAddr = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e";
  //let pMpcSignerAddr = "0xfac95c16da814d24cc64b3186348afecf527324f";
  //let pMpcSignerAddr = "0xf0c5303cac409131397822e4acd7a79540ac7a51";
   //let pMpcSignerAddr = "0x7d055985cee158d8eb48fc18cabf78e3e398525e";
   //let pMpcSignerAddr = "0xbebfa902bf04d9e50c50f688706b54c5680cfab9";

   // let pMpcSignerAddr = "0x1c8a5e26abf1bd54c562519beb402fefea1549f9";
   //let pMpcSignerAddr = "0x130407476fff4616d01f6eadd90845dc8a65e23a";

  //  let pMpcSignerAddr = "0x83c7ac93318aaa9e09ec22fc1042b1ed38e82433";
  //  let pMpcSignerAddr = "0xde2061d0293b5dde427fd186405964d8ab0ecc0f";


  //  let pMpcSignerAddr = "0x724fe5bdac2164c907095f4a23a0e365e53cb665";
   // let pMpcSignerAddr = "0x3755f6db48410916d9592da110c8ed69328d0410";
   // let pMpcSignerAddr = "0x79b374c03c47f489e1678e9535ab60172864b3bf";
   // let pMpcSignerAddr = "0xc326af68d4e35535042aeaed2f36f795bae3093e";
   // let pMpcSignerAddr = "0xaf8859308871cd4e8581a6d4fc7bab333862c185";
   // let pMpcSignerAddr = "0xa5d46f17e4c97cba72013aa93b33d516f1ed6d1b";
   // let pMpcSignerAddr = "0xc6ab7562dbd6b0c59508b196c4b45a0e3f40f4f6";
   // let pMpcSignerAddr = "0x22e1f57847531eb345bf883c7da01004ed68eb38";
   // let pMpcSignerAddr = "0xa1ab5e7c57c9c2dc88ed20040d543c4d739c58b9";
   // let pMpcSignerAddr = "0x651fa3c30941b8a7d3dd0a00f9f079dc11b44247";
   // let pMpcSignerAddr = "0xeb6b6a77e58787ac94e49c374aa0f8c379bb434d";
    let pMpcSignerAddr = "0xb4000974daaf60346e9d65ee8b68136870be1179";
    //let pMpcSignerAddr = "0xdff88cc46ea006ec94a1924ff5a515f340738729";
    //let pMpcSignerAddr = "0xeaca9a1f6f068318fef6e98e5806b67ba5606bd1";
    //let pMpcSignerAddr = "0xe1a3ad7ff8e7b1f4ba9aa6bdff849c5aa15b350c";
    //let pMpcSignerAddr = "0x90c219290f372cfdbf7fb9e7c16cfdfbf122c24e";
    //let pMpcSignerAddr = "0x39c6e206fb857d55f3a1a6c969a6cb7f6c3ac57e";
    //let pMpcSignerAddr = "0x157390481e77f64e5477453792f0b2b3d2ba5e98";


  let poriginalChainAddr = '0xcd5a7fcc744481d75ab3251545befb282e785883';

  let ptxFeeRatio = 10;
  let pminDeposit = web3.toWei(10);

  let psmAdminAddr;

  let pminUserStake =  web3.toWei(20);
  let pmaxUserStake =  web3.toWei(200);
  let pminPartnerStake = web3.toWei(20);
  let pmaxPartnerStake = web3.toWei(1000);

  let pmaxOpenStake = web3.toWei(1000);


  let pstartime = Math.round(new Date().getTime()/1000);
  console.log("time=" + pstartime);

  let phaseInteraval = 20;
  let pstakingPhase1StartTime;
  let pstakingPhase1EndTime ;
  let pstakingPhase2StartTime;
  let pstakingPhase2EndTime;

  let puserLockTime = 1;
  let ppartnerLockTime = 2;


  let pnodesId1 = '0xd984b976c0496495674d94de2960c072bb877f6169c01b25acbfc3d7f37cf2ef8577f3c65858fe64d15aa411e74d7680552b5641d93bcb3c0f34ee4d9d593d21';
//  let pnodesId1 = '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5';
  let pnodesId2 = '0xd984b976c0496495674d94de2960c072bb877f6169c01b25acbfc3d7f37cf2ef8577f3c65858fe64d15aa411e74d7680552b5641d93bcb3c0f34ee4d9d593d22';
  let pnodesId3 = '0xd984b976c0496495674d94de2960c072bb877f6169c01b25acbfc3d7f37cf2ef8577f3c65858fe64d15aa411e74d7680552b5641d93bcb3c0f34ee4d9d593d23';
  let pnodesId4 = '0xd984b976c0496495674d94de2960c072bb877f6169c01b25acbfc3d7f37cf2ef8577f3c65858fe64d15aa411e74d7680552b5641d93bcb3c0f34ee4d9d593d24';
  let pnodesId5 = '0xd984b976c0496495674d94de2960c072bb877f6169c01b25acbfc3d7f37cf2ef8577f3c65858fe64d15aa411e74d7680552b5641d93bcb3c0f34ee4d9d593d25';
  let pnodesId6 = '0xd984b976c0496495674d94de2960c072bb877f6169c01b25acbfc3d7f37cf2ef8577f3c65858fe64d15aa411e74d7680552b5641d93bcb3c0f34ee4d9d593d26';



  let user1 = '0x82086038157846da6a38e2e25a6e79e69d913bb9';
  let user2 = '0xde2061d0293b5dde427fd186405964d8ab0ecc0f';
  let user3 = '0x83c7ac93318aaa9e09ec22fc1042b1ed38e82433';
  let user4 = '0x130407476fff4616d01f6eadd90845dc8a65e23a';
  let user5 = '0x1c8a5e26abf1bd54c562519beb402fefea1549f9';
  let user6 = '0xbebfa902bf04d9e50c50f688706b54c5680cfab9';

  let divideRatio = 5000;

  before('set up contract before test', async () => {
    console.log("set up contract before test")

    await web3.personal.unlockAccount(owner, 'wanglu', 99999);

    smNodesAdminInst =  await smNodesAdmin.new({from:owner})

    console.log("\n")
    console.log("\nvar smNodesAdminAbi=web3.eth.contract(" + JSON.stringify(smNodesAdminInst.abi)  + ");");
    console.log("var smNodesAdminInst=smNodesAdminAbi.at(\'" + smNodesAdminInst.address + "\');");
    console.log("smNodesAdminInst.setHalt(true,{from:\'"+ owner +"\'})");

    let smNodeInst = await smNode.new({from:owner});
    console.log("\n")
    console.log("\nvar smNodeAbi=web3.eth.contract(" + JSON.stringify(smNodeInst.abi)  + ");");
    console.log("var smNodeInst=smgAdminAbi.at(\'" + smNodeInst.address + "\');");
    console.log("smNodeInst.setHalt(true,{from:\'"+ owner +"\'})");

    console.log("address info:\n")
    console.log("smNodesAdmin   address:" + smNodesAdminInst.address );
    console.log("smNode         address:" + smNodeInst.address );

    psmAdminAddr =  smNodesAdminInst.address;

    smNodeInst1 = smNodeInst;
    smNodeInst2 = await smNode.new({from:owner});
    smNodeInst3 = await smNode.new({from:owner});
    smNodeInst4 = await smNode.new({from:owner});
    smNodeInst5 = await smNode.new({from:owner});
    smNodeInst6 = await smNode.new({from:owner});

  })

  it('initialize storeman nodes admin initialize', async () => {
       let ret = await smNodesAdminInst.initialize(ETHEREUM_ID,
                                          ptokenOrigAddr,
                                          psmgAdminAddr,
                                          pMpcSignerAddr,
                                          poriginalChainAddr,
                                          ptxFeeRatio,
                                          pminDeposit,{from:owner,gas:4700000});
       console.log(ret);

      let gotMpcSignerAddr = await  smNodesAdminInst.mpcSigner();
      assert.equal(gotMpcSignerAddr,pMpcSignerAddr,'pMpcSignerAddr not passed');

      let gotsmgAdminAddr = await  smNodesAdminInst.smgAdminAddr();
      assert.equal(gotsmgAdminAddr,psmgAdminAddr,'psmgAdminAddr not passed');


      let gottokenOrigAddr = await  smNodesAdminInst.tokenOrigAddr();
      assert.equal(gottokenOrigAddr,ptokenOrigAddr,'ptokenOrigAddr not passed');

      console.log('setWithdrawDepositDelayTime');
      await smNodesAdminInst.setWithdrawDepositDelayTime(1,{from:owner});

      //this test just for 1 one node test
      console.log('setSmgNodesAllocation');
      await smNodesAdminInst.setSmgNodesAllocation(1,1,{from:owner});

      console.log('enableSmWhiteList');
      await smNodesAdminInst.enableSmWhiteList(true,{from:owner});

      console.log('setSmWhiteList');
      await smNodesAdminInst.setSmWhiteList(smNodeInst1.address,{from:owner});

  })


  it('initialize storeman node 1 initialize', async () => {

        await smNodeInst1.initialize(psmAdminAddr,
                              '0x' + pnodesId1.slice(2,66),
                              '0x' + pnodesId1.slice(66,130),
                               partner,
                               puserLockTime,
                               ppartnerLockTime,{from:owner});

        let gotSmAdminAddr = await smNodeInst1.storemanNodesAdmin();
        assert.equal(gotSmAdminAddr,psmAdminAddr,'passed')

      let partnerAddr = await smNodeInst1.partnerAddress();
       console.log('partner addresss=' + partnerAddr);
      assert.equal(partnerAddr,owner,'passed')

        let gotNodeId = await smNodeInst1.nodesId1();
        console.log('nodeId='+gotNodeId)
        assert.equal(gotNodeId,pnodesId1.slice(0,66),'error nodeid!!!')

      pstakingPhase1StartTime = await smNodeInst1.getScTime();
      console.log("sc now time=" + pstakingPhase1StartTime);

      pstakingPhase1EndTime = Number(pstakingPhase1StartTime) + phaseInteraval;
      pstakingPhase2StartTime = Number(pstakingPhase1EndTime);
      pstakingPhase2EndTime = Number(pstakingPhase2StartTime) + phaseInteraval;

      console.log('set pstakingPhase2EndTime = ' + pstakingPhase2EndTime);

      let res = await smNodeInst1.setStakingParameters(   pminUserStake,
                                                          pmaxUserStake,
                                                          pminPartnerStake,
                                                          pmaxPartnerStake,
                                                          pmaxOpenStake,
                                                          pstakingPhase1StartTime,
                                                          pstakingPhase1EndTime,
                                                          pstakingPhase2StartTime,
                                                          pstakingPhase2EndTime,{from:owner}
                                                        );
        console.log(res);
        //assert.ok(res.receipt.status=='0x1','failed to set staking parameter!!!!');

        res = await smNodeInst1.setBonusDivideRatio(divideRatio,{from:owner});
       //ssert.ok(res.reciept.status=='0x1','failed to setBonusDivideRatio!!!!');

        res = await smNodeInst1.setHalt(false,{from:owner});
       // assert.ok(res.reciept.status=='0x1','failed to set setHalt!!!!');

        let gotHalted = await smNodeInst1.halted();
        assert.equal(gotHalted,false);


        let inputPrincipal = 200;
        console.log('partner send transaction');

        await web3.personal.unlockAccount(owner, 'wanglu', 99999);
        res = await web3.eth.sendTransaction({from:owner,to:smNodeInst1.address,value:web3.toWei(inputPrincipal),gas:4700000});
       // assert.ok(res.reciept.status=='0x1','failed to stake from owner!!!!');
        console.log(res);

        sleep(10000);

        let partnerInfo = await smNodeInst1.partnerInfo();
        console.log(partnerInfo);

        
        let principal = new BigNumber(partnerInfo[0].toString(10));
        assert.equal(principal.div(ETH_EXP).toString(10),inputPrincipal);

        let inputPrincipal1 = 200;
        await web3.personal.unlockAccount(user1, 'wanglu', 999999);
        res = await web3.eth.sendTransaction({from:user1,to:smNodeInst1.address,value:web3.toWei(inputPrincipal1),gas:4700000});
        console.log('user send transaction txhash = ' + res);

        sleep(10000);
        let regInfo = await smNodeInst1.allMembers(user1);
        console.log(regInfo);
        principal = new BigNumber(regInfo[0].toString(10));
        assert.equal(principal.div(ETH_EXP).toString(10),inputPrincipal1);

        //ensure the it is passed phase2endtime
//////////////////////////////////////////////set nodesAdmin time paramet/////////////////////////////////////////////////////////
      let pSmgStartTime = pstakingPhase2EndTime + 2*phaseInteraval;
      let pSmgEndTime = pSmgStartTime + 10*phaseInteraval;
      let pbounusClaimPeriod = phaseInteraval;
      let txFeeRatio = 1;

      console.log('set mpcsmg running time....')
      res = await smNodesAdminInst.setMpcSmgRunningTime(pSmgStartTime,pSmgEndTime,pbounusClaimPeriod,{from:owner});
      console.log(res);

      console.log('set mpc leader....')
      res = await smNodesAdminInst.setMpcLeader(smNodeInst1.address,{from:owner});
      console.log(res);

      console.log('set mpcsmg txFee....');
      await web3.personal.unlockAccount(pMpcSignerAddr, 'wanglu', 999999);
      res = await smNodesAdminInst.mpcSetTxFee(txFeeRatio,{from:pMpcSignerAddr});
      console.log(res);


      await  smNodesAdminInst.setHalt(false,{from:owner});

      gotHalted = await smNodesAdminInst.halted();
      assert.equal(gotHalted,false,'error set halted');
      let gotPhase2EndTIme = await smNodeInst1.stakingPhase2EndTime();
      console.log('got phase2endtime =' + gotPhase2EndTIme);

      //wait staking outtime
      while(true){
          let sctime = await smNodeInst1.getScTime();
          if (sctime > pstakingPhase2EndTime + 10){
              console.log('break time = ' + sctime)
              break;

          }
      }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      let preBalance = web3.fromWei(web3.eth.getBalance(smNodesAdminInst.address));
      console.log('register sm node to node admin');
        await smNodeInst1.registerSmToNodesAdmin({from:owner});
        sleep(10000);

        let gotStatus = await smNodeInst1.scStatus();
        console.log("got status =" + gotStatus);

        let afterBalance =  web3.fromWei(web3.eth.getBalance(smNodesAdminInst.address));
        assert.equal(afterBalance-preBalance,inputPrincipal + inputPrincipal1)

        let resmNodeAfterBalance = web3.fromWei(web3.eth.getBalance(smNodeInst1.address));
        console.log('node1 after balance=' + resmNodeAfterBalance);

        let regNodeInfo = await smNodesAdminInst.smNodes(smNodeInst1.address);
        console.log("regnodeInfo");
        console.log(regNodeInfo);

      //wait mpc start running
      while(true){
          let sctime = await smNodeInst1.getScTime();
          if (sctime > pSmgStartTime + 10){
              break;
          }
      }

  })


    // it('initialize storeman node 2 initialize', async () => {
    //
    //     await smNodeInst2.initialize(psmAdminAddr,
    //         '0x' + pnodesId2.slice(2,66),
    //         '0x' + pnodesId2.slice(66,130),
    //         pmaxOpenSupply,
    //         pownerSupply,
    //         pfeeRatio,
    //         plimitOfEachUser,
    //         pstartime,
    //         pendTime,
    //         pRunningPeriod,{from:owner});
    //
    //     let gotSmAdminAddr = await smNodeInst2.storemanNodesAdmin();
    //     assert.equal(gotSmAdminAddr,psmAdminAddr,'passed')
    //
    //     let gotNodeId = await smNodeInst2.nodesId1();
    //     console.log('nodeId='+gotNodeId)
    //     assert.equal(gotNodeId,pnodesId2.slice(0,66),'error nodeid!!!')
    //
    //     await smNodeInst2.setHalt(false,{from:owner});
    //     let gotHalted = await smNodeInst2.halted();
    //     assert.equal(gotHalted,false);
    //
    //     await smNodeInst2.setBonusDivideRatio(divideRatio,{from:owner});
    //
    //     let inputPrincipal = 200;
    //
    //     await web3.personal.unlockAccount(owner, 'wanglu', 99999);
    //     await web3.eth.sendTransaction({from:owner,to:smNodeInst2.address,value:web3.toWei(inputPrincipal),gas:4700000});
    //
    //     sleep(20000);
    //
    //     let ownerInfo = await smNodeInst2.ownerInfo();
    //     console.log(ownerInfo);
    //     let principal = new BigNumber(ownerInfo[0].toString(10));
    //     assert.equal(principal.div(ETH_EXP).toString(10),inputPrincipal);
    //
    //     let inputPrincipal1 = 100;
    //     await web3.personal.unlockAccount(user1, 'wanglu', 99999);
    //     await web3.eth.sendTransaction({from:user1,to:smNodeInst2.address,value:web3.toWei(inputPrincipal1),gas:4700000});
    //
    //     sleep(20000);
    //     let regInfo = await smNodeInst2.allMembers(user1);
    //     console.log(regInfo);
    //     principal = new BigNumber(regInfo[0].toString(10));
    //     assert.equal(principal.div(ETH_EXP).toString(10),inputPrincipal1);
    //
    //     sleep(financingPeriod);
    //
    //     let preBalance = web3.fromWei(web3.eth.getBalance(smNodesAdminInst.address));
    //     await smNodeInst2.registerSmToSmg({from:owner});
    //     sleep(20000);
    //
    //     let gotStatus = await smNodeInst2.scStatus();
    //     console.log("got status =" + gotStatus);
    //
    //     let afterBalance =  web3.fromWei(web3.eth.getBalance(smNodesAdminInst.address));
    //     assert.equal(afterBalance-preBalance,inputPrincipal + inputPrincipal1)
    //
    //     let regNodeInfo = await smNodesAdminInst.smNodes(smNodeInst2.address);
    //     console.log("regnodeInfo");
    //     console.log(regNodeInfo);
    //
    // })


    it('register this storeman group to smgAdmin contract', async () => {



        let preBalance = await web3.fromWei(web3.eth.getBalance(smgAdminAddr));
        console.log('smg admin pre balance=' + preBalance)
        let inputBalance =await web3.fromWei(web3.eth.getBalance(smNodesAdminInst.address));
        console.log('smg input balance=' + inputBalance);
        await web3.personal.unlockAccount(pMpcSignerAddr, 'wanglu', 99999);

        res = await smNodesAdminInst.mpcRegisterToSmgAdminSc({from:pMpcSignerAddr,gas:4700000});
        console.log(res);

        sleep(40000);
        let afterBalance = await web3.fromWei(web3.eth.getBalance(smgAdminAddr));
        let diff = afterBalance - preBalance;

        assert.equal(Math.round(diff),Math.round(inputBalance),'wrong balance!!!!');

        let smgInfo = await smgAdminInst.mapStoremanGroup(ptokenOrigAddr,pMpcSignerAddr);
        console.log(smgInfo);

    })


    it('get bonus for storeman group from smgAdmin contract', async () => {

        let gotMpcSignerAddr = await  smNodesAdminInst.mpcSigner();
        console.log('mpcSinger=' + gotMpcSignerAddr)
        assert.equal(gotMpcSignerAddr,pMpcSignerAddr,'pMpcSignerAddr not passed');

        let presmgAdminBalance = web3.eth.getBalance(smgAdminAddr);
        console.log('smg admin pre balance=' + presmgAdminBalance)
        let presmNodeBalance = web3.eth.getBalance(smNodesAdminInst.address);
        console.log('smg node balance=' + presmNodeBalance);
        await web3.personal.unlockAccount(pMpcSignerAddr, 'wanglu', 99999);

        let res = await smNodesAdminInst.mpcStoremanGroupClaimSystemBonus({from:pMpcSignerAddr,gas:4700000});
        console.log(res);

        sleep(40000);
        let afterBalance = await  web3.eth.getBalance(smgAdminAddr);
        let diffSmgAdmin = presmgAdminBalance - afterBalance;
        console.log('smg admin after balance=' + afterBalance);
        console.log('smg admin diff=' + diffSmgAdmin)

        let afterNodeBalance = await web3.eth.getBalance(smNodesAdminInst.address);
        let diffNode = afterNodeBalance - presmNodeBalance
        console.log('smg node after balance=' + afterNodeBalance)
        console.log('smg node diff=' + diffNode)

        assert.equal(Math.round(diffSmgAdmin),Math.round(diffNode),'wrong balance!!!!');

        let node1BeforeBalance = await web3.eth.getBalance(smNodeInst1.address);
        console.log("node1 before balance=" + node1BeforeBalance);
        res = await  smNodeInst1.claimBonusNodeFromNodesAdmin({from:user1});
        console.log('smNodeInst1 claimBonusFromNodesAdmin');
        console.log(res);

        sleep(40000);
        let node1AfterBalance = await web3.eth.getBalance(smNodeInst1.address);

        console.log("node1 after balance=" + node1AfterBalance);

        let smnodeDiff = node1AfterBalance - node1BeforeBalance;

        assert.equal(diffNode,smnodeDiff,'the sm node bonus is wrong!');


        console.log('user get himself bonus');
        let userPreBalance =  await web3.eth.getBalance(user1);
        console.log('userPreBalance=' + userPreBalance);
        res = await smNodeInst1.claimBonusByUser({from:user1});
        console.log(res);

        sleep(10000);
        let userAfterBalance =  await web3.eth.getBalance(user1);
        console.log('userAfterBalance=' + userAfterBalance)
        let userDiff = userAfterBalance - userPreBalance;
        console.log('user bonus=' + userDiff);

        assert.notEqual(userDiff,0,'user get wrong bonus!!');


        console.log('owner get himself bonus');
        let ownerPreBalance =  await web3.eth.getBalance(owner);
        console.log('ownerPreBalance=' + ownerPreBalance);

        res = await smNodeInst1.claimBonusByUser({from:owner});
        console.log(res);
        sleep(10000);
        let ownerAfterBalance =  await web3.eth.getBalance(owner);
        console.log('ownerAfterBalance=' + ownerAfterBalance);

        let ownerDiff = ownerAfterBalance - ownerPreBalance;
        console.log('owner bonus=' + ownerDiff);

        assert.notEqual(ownerDiff,0,'user get wrong bonus!!')

    })

    /*
        it('apply smg unregister', async () => {

            let gotMpcSignerAddr = await  smNodesAdminInst.mpcSigner();
            console.log('mpcSinger=' + gotMpcSignerAddr)
            assert.equal(gotMpcSignerAddr,pMpcSignerAddr,'pMpcSignerAddr not passed');


            await web3.personal.unlockAccount(pMpcSignerAddr, 'wanglu', 99999);

            let res = await smNodesAdminInst.mpcStoremanGroupApplyUnregister({from:pMpcSignerAddr,gas:4700000});
            console.log(res);

            sleep(40000);

            let applyUnregTime = await  smNodesAdminInst.unregisterApplyTime();

            assert.notEqual(applyUnregTime,0,'apply unregister failed')

        })


        it('withdraw smg deposit', async () => {

            let gotMpcSignerAddr = await  smNodesAdminInst.mpcSigner();
            console.log('mpcSinger=' + gotMpcSignerAddr)
            assert.equal(gotMpcSignerAddr,pMpcSignerAddr,'pMpcSignerAddr not passed');

            let presmgAdminBalance = web3.eth.getBalance(smgAdminAddr);
            console.log('smg admin pre balance=' + presmgAdminBalance)
            let presmNodeAdminBalance = web3.eth.getBalance(smNodesAdminInst.address);
            console.log('smg node admin pre balance=' + presmNodeAdminBalance);

            await web3.personal.unlockAccount(pMpcSignerAddr, 'wanglu', 99999);

            let res = await smNodesAdminInst.mpcStoremanGroupWithdrawDeposit({from:pMpcSignerAddr,gas:4700000});
            console.log(res);

            sleep(40000);

            let afterBalance = await  web3.eth.getBalance(smgAdminAddr);
            let diffSmgAdmin = presmgAdminBalance - afterBalance;
            console.log('smg admin after balance=' + afterBalance);
            console.log('smg admin diff=' + diffSmgAdmin)

            let afterNodeAminBalance = await web3.eth.getBalance(smNodesAdminInst.address);
            let diffNodeAdmin = afterNodeAminBalance - presmNodeAdminBalance
            console.log('smg node admin after balance=' + afterNodeAminBalance);
            console.log('smg node admin diff=' + diffNodeAdmin);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            assert.equal(Math.round(diffSmgAdmin),Math.round(diffNodeAdmin),'wrong balance!!!!');

            console.log('apply unregister to node admin');
            res = await smNodeInst1.applyUnregisterSmToNodesAdmin({from:owner});
            console.log(res);
            sleep(10000);

            let totalStake = await smNodeInst1.totalStake();
            console.log("total stake = " + totalStake);

            let prenodeBalance = await web3.eth.getBalance(smNodeInst1.address);
            console.log('user withdraw deposit from node admin,before balance =' + prenodeBalance);
            res = await smNodeInst1.withDrawSmFromNodesAdmin({from:owner});
            console.log(res);
            sleep(20000);
            let afterNodeBalance = await web3.eth.getBalance(smNodeInst1.address);
            console.log('withdraw deposit from node admin,after balance =' + afterNodeBalance);

            let nodeDiff = afterNodeBalance - prenodeBalance;

            assert.equal(nodeDiff,diffNodeAdmin,'wrong value from node admin');
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            sleep(10000);

            let preUserBalance = await web3.eth.getBalance(user1);
            console.log('user withdraw deposit from node,user balance before=' + preUserBalance);
            res = await smNodeInst1.userWithDrawPrincipal({from:user1});
            console.log(res);
            sleep(20000);
            let afterUserBalance = await web3.eth.getBalance(user1);
            console.log('user withdraw deposit from node ,after balance =' + afterUserBalance);

            let userDiff = afterUserBalance - preUserBalance;

            console.log('user withdrawed princinpal =' + userDiff);
            assert.notEqual(userDiff,0,'wrong value from node admin');

            let preOwnerBalance = await web3.eth.getBalance(owner);
            console.log('owner withdraw deposit from node,owner balance before=' + preOwnerBalance);
            res = await smNodeInst1.userWithDrawPrincipal({from:owner});
            console.log(res);
            sleep(20000);
            let afterOwnerBalance = await web3.eth.getBalance(owner);
            console.log('owner withdraw deposit from node ,after balance =' + afterOwnerBalance);

            let ownerDiff = afterOwnerBalance - preOwnerBalance;
            console.log('owner withdrawed princinpal =' + ownerDiff);
            assert.notEqual(ownerDiff,0,'wrong value from node admin');
        });
    */

})