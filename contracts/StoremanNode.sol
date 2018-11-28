/*

  Copyright 2018 Wanchain Foundation.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

//                            _           _           _
//  __      ____ _ _ __   ___| |__   __ _(_)_ __   __| | _____   __
//  \ \ /\ / / _` | '_ \ / __| '_ \ / _` | | '_ \@/ _` |/ _ \ \ / /
//   \ V  V / (_| | | | | (__| | | | (_| | | | | | (_| |  __/\ V /
//    \_/\_/ \__,_|_| |_|\___|_| |_|\__,_|_|_| |_|\__,_|\___| \_/
//
//  Code style according to: https://github.com/wanchain/wanchain-token/blob/master/style-guide.rst

pragma solidity ^0.4.11;

import "./SafeMath.sol";
import "./Halt.sol";

contract StoremanNode is Halt {
    using SafeMath for uint;

    enum SCStatus {Financing,Registered,ApplyUnregistered,Withdrawed}

    uint public constant DEFAULT_PRECISE = 10000;
    uint public constant NODE_ID_LEN = 64;
    bytes32 public constant EMPTY_BYTE32 = 0x0000000000000000000000000000000000000000000000000000000000000000;

    address public      storemanNodesAdmin; //the storemanNodesAdmin contract address
    bytes32  public     nodesId1;            //this mpc storeman nodesId which is delegated by this contract
    bytes32  public     nodesId2;            //this mpc storeman nodesId which is delegated by this contract

    uint    public      bonusDivideRatio = 5000; //the how much bonus will be allocate to users

    uint    public      feeRatio;           //the fee ratio required by node partner
    uint    public      bonusLeft;          //the current bonus value in contract

    uint    public      userTotalStake;         //the ether is got until to now
    uint    public      memberIdx;          //the sequence that member register
    uint    public      memberCount;        //the total member count
    uint    public      scGotBonusLastBlk;  //the contract bonus got from storeman admin contract

    SCStatus    public      scStatus = SCStatus.Financing;

    uint    public     maxUserStake;
    uint    public     minUserStake;
    uint    public     maxPartnerStake;
    uint    public     minPartnerStake;
    uint    public     stakingPhase1StartTime;
    uint    public     stakingPhase1EndTime;
    uint    public     stakingPhase2StartTime;
    uint    public     stakingPhase2EndTime;
    uint    public     partnerAddress;

    uint    public     userLockTime;
    uint    public     partnerLockTime;


    struct  member{
        uint        principal;           //1 the participant's principal
        uint        bonus;               //2 the bonus which is not claimed back
        uint        index;               //3 index in the address array
        uint        unregisterApplyTime; //4 the time for storeman group applied exit
        uint        lastBonusBlk;         //5 the last bonus block number for
    }

    ///the storeman nodes contract address array
    address[] allMemberAddress;

    ///the Storeman Node info
    mapping(address => member)   public allMembers;
    member public partnerInfo;

    /// @notice modifier for checking if contract is initialized
    /// @param coin   coin name
    modifier initialized() {
        require(partnerAddress!=address(0x0));
        _;
    }

    /// @notice event for storeman group claiming system bonus
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param bonus the bonus for storeman claim
    event SmgClaimSystemBonus(address indexed smgAddress,uint indexed coin,uint indexed bonus);

    /**
     * MANIPULATIONS
     */
    /// @notice default tranfer to contract
    function () public
    notHalted
    payable
    {
        //need the tx sender is contract
        if(tx.origin != msg.sender) {
            //the bonus and depost is send to nodesc by nodescAdmin through mpc signer
            if(msg.sender != storemanNodesAdmin) {
                //do not accept other cocontract tranfer
                revert();
            }

        } else if(msg.sender == partnerAddress) {

            partnerInfo = member(msg.value,0,0,0,0);

        }  else {

            require(partnerInfo.principal > 0);//need owner to input principal in advance

            if(now > stakingPhase1StartTime && now < stakingPhase1EndTime){
                phase1Staking();
            } else if(now > stakingPhase2StartTime && now < stakingPhase2EndTime){
                phase2Staking();
            } else {
                revert();
            }

        }// if(msg.sender == owner) {owner

    }


    function initialize(
                            address psmAdminAddr,
                            bytes32 pnodesId1,
                            bytes32 pnodesId2,
                            address ppartnerAddress,
                            uint    puserLockTime,
                            uint    ppartnerLockTime
                        )
    public
    isHalted
    onlyOwner
    {
        require(psmAdminAddr != address(0));
        require(pnodesId1 != EMPTY_BYTE32);
        require(pnodesId2 != EMPTY_BYTE32);
        require(ppartnerAddress != address(0));
        require(puserLockTime > 0);
        require(ppartnerLockTime > 0);

        storemanNodesAdmin = psmAdminAddr;

        nodesId1 = pnodesId1;
        nodesId2 = pnodesId2;

        partnerAddress = ppartnerAddress;
        userLockTime = puserLockTime;
        partnerLockTime = ppartnerLockTime;

    }

    function setBonusDivideRatio(uint ratio)
    public
    onlyOwner
    {
        require(ratio > 0);
        bonusDivideRatio = ratio;
    }


    function setStakingParameters(
                                    uint    public     pminUserStake,
                                    uint    public     pmaxUserStake,
                                    uint    public     pminPartnerStake,
                                    uint    public     pmaxPartnerStake,
                                    uint    public     pstakingPhase1StartTime,
                                    uint    public     pstakingPhase1EndTime,
                                    uint    public     pstakingPhase2StartTime,
                                    uint    public     pstakingPhase2EndTime,
                                  )
    public
    onlyOwner
    {
        require(pminUserStake > 0);
        require(pmaxUserStake > pminUserStake);

        require(pminPartnerStake > 0);
        require(pmaxPartnerStake > pminPartnerStake);

        require(pstakingPhase1StartTime > 0);
        require(pstakingPhase1EndTime > pstakingPhase1StartTime);

        require(pstakingPhase2StartTime >= pstakingPhase1EndTime);
        require(pstakingPhase1EndTime > pstakingPhase2StartTime);

        maxUserStake = pmaxUserStake;
        minUserStake = pminUserStake;
        maxPartnerStake = pmaxPartnerStake;
        minPartnerStake = pminPartnerStake;

        stakingPhase1StartTime = pstakingPhase1StartTime;
        stakingPhase1EndTime = pstakingPhase1EndTime;
        stakingPhase2StartTime = pstakingPhase2StartTime;
        stakingPhase2EndTime = pstakingPhase2EndTime;
    }


    function buyShares()
    public
    notHalted
    payable
    {

    }

    function claimBonus()
    public
    {
        require(tx.origin == msg.sender);

        //require(now > financingEndTime && now < closeTime);

        require(scStatus == SCStatus.Registered);
        uint bonus = 0;

        if(msg.sender == owner) {
            require(partnerInfo.principal > 0);
            bonus = partnerInfo.bonus;
            partnerInfo.bonus = 0;
        } else {
            require(allMembers[msg.sender].principal > 0);
            require(allMembers[msg.sender].unregisterApplyTime == 0);

            bonus = allMembers[msg.sender].bonus;
            allMembers[msg.sender].bonus = 0;
        }

        require(bonusLeft >= bonus);
        bonusLeft = bonusLeft.sub(bonus);

        require(this.balance >= bonus);
        require(bonus > 0);

        msg.sender.transfer(bonus);

        emit SmgClaimSystemBonus(msg.sender,0, bonus);

    }

    function userWithDrawPrincipal()
    public
    {
        //require(now > closeTime);
        require(scStatus == SCStatus.Withdrawed);

        uint principal = 0;

        if(msg.sender == owner) {
            require(partnerInfo.principal != 0);
            principal = partnerInfo.principal.add(partnerInfo.bonus);
        } else {

            require(allMembers[msg.sender].principal != 0);

            principal = allMembers[msg.sender].principal;
            uint idx = allMembers[msg.sender].index;
            userTotalStake = userTotalStake.sub(principal);

            if(allMembers[msg.sender].bonus > 0) {
                principal = principal.add(allMembers[msg.sender].bonus);
                bonusLeft = bonusLeft.sub(allMembers[msg.sender].bonus);
            }

            delete allMembers[msg.sender];
            delete allMemberAddress[idx];


        }

        msg.sender.transfer(principal);

    }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function registerSmToNodesAdmin()
    public
    {
        // require(now > financingEndTime);
        require(scStatus == SCStatus.Financing);

        bytes4 methodId = bytes4(keccak256("registerNode(address,bytes32,bytes32)"));
        bool res = storemanNodesAdmin.call.value(this.balance)(methodId,this,nodesId1,nodesId2);
        require(res);

        scStatus = SCStatus.Registered;
    }

    function applyUnregisterSmToNodesAdmin()
    public
    {
       // require(now > closeTime); //for test
        require((scStatus == SCStatus.Registered));

        bytes4 methodId = bytes4(keccak256("applyUnregisterSmNode(address)"));
        bool res = storemanNodesAdmin.call(methodId,this);

        require(res);



        scStatus = SCStatus.ApplyUnregistered;
    }

    //any one can call it after contract closed
    function withDrawSmFromNodesAdmin()
    public
    {
       // require(now > closeTime); //for test
        require(scStatus == SCStatus.ApplyUnregistered);

        uint preBalance = this.balance;
        bytes4 methodId = bytes4(keccak256("withdrawSmNodeDeposit(address)"));
        bool res = storemanNodesAdmin.call(methodId,this);
        require(res);

        //emit SmgClaimSystemBonus(storemanNodesAdmin,this.balance.sub(preBalance), userTotalStake);
        require(this.balance.sub(preBalance) == userTotalStake.add(partnerInfo.principle));

        scStatus = SCStatus.Withdrawed;
    }

    function claimBonusFromNodesAdmin()
    public
    {
        require(allMembers[msg.sender].principal > 0);
        require(scStatus == SCStatus.Registered);

        uint preBalance = this.balance;

        bytes4 methodId = bytes4(keccak256("claimSmNodeBonus(address)"));
        bool res = storemanNodesAdmin.call(methodId,this);
        require(res);

        uint afterBalance = this.balance;

        uint bonusGot = afterBalance.sub(preBalance);

        allocateBonus(bonusGot);

        bonusLeft = bonusLeft.add(bonusGot);
    }

///////////////////////////////////////////////////////////////////////////////////////
    function allocateBonus(uint bonus)
    private
    {
        uint i = 0;
        uint bonusForUser = 0;
        uint left = bonus;
        for(;i<allMemberAddress.length;i++) {

            if(allMemberAddress[i] == address(0)) {
                continue;
            }

            bonusForUser = bonus.mul(DEFAULT_PRECISE).mul(DEFAULT_PRECISE.sub(feeRatio)).mul(bonusDivideRatio).mul(allMembers[allMemberAddress[i]].principal);

            bonusForUser = bonusForUser.div(userTotalStake).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE);

            allMembers[allMemberAddress[i]].bonus = allMembers[allMemberAddress[i]].bonus.add(bonusForUser);

            allMembers[allMemberAddress[i]].lastBonusBlk = block.number;

            left = left.sub(bonusForUser);
        }

        partnerInfo.bonus = partnerInfo.bonus.add(left);
    }

    function phase1Staking()
    private
    {
        //input is a permitted value
        require(msg.value > 0 && msg.value < maxUserStake);
        //the user's principal need to be lower than max user stake
        require(allMembers[msg.sender].principal < maxUserStake);

        if(allMembers[msg.sender].principal == 0) {
            allMembers[msg.sender] = member(0,0,memberIdx,0,0);
            allMemberAddress.push(msg.sender);
            memberIdx++;
        }

        uint allLeftQuota = maxOpenSupply.sub(userTotalStake);
        uint userReturn = 0;

        if(allLeftQuota <= msg.value) {

            userReturn = msg.value.sub(allLeftQuota);
            //allow principal of the lastest user can be over the stake limit for each user, to be a lucky one
            allMembers[msg.sender].principal = allMembers[msg.sender].principal.add(allLeftQuota);;

            //updated userTotalStake value
            userTotalStake = userTotalStake.add(allLeftQuota);

            msg.sender.transfer(userReturn);

        } else {

            uint userLeftQuota = limitOfEachUser.sub(allMembers[msg.sender].principal);
            if (userLeftQuota < msg.value ) {

                userReturn = msg.value.sub(userLeftQuota);
                allMembers[msg.sender].principal = allMembers[msg.sender].principal.add(userLeftQuota);
                //updated userTotalStake value
                userTotalStake = userTotalStake.add(userLeftQuota);

                msg.sender.transfer(userReturn);

            } else {
                allMembers[msg.sender].principal = allMembers[msg.sender].principal.add(msg.value);
                //updated userTotalStake value
                userTotalStake = userTotalStake.add(msg.value);
            }

        }

    }//phase1Staking

    function phase2Staking()
    private
    {
        uint allLeftQuota = maxOpenSupply.sub(userTotalStake);
        uint userReturn = 0;
        if(allLeftQuota < msg.value){

        }
    }


}