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

pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./Halt.sol";

contract StoremanNodesAdmin is Halt {

    using SafeMath for uint;
    uint public constant    MAX_MPC_NODES = 21;
    uint public constant    DEFAULT_PRECISE = 10000;
    uint public constant    INVALID_VALUE = uint(0xffffffffffffffff);
    bytes32 public constant EMPTY_BYTE32 = 0x0000000000000000000000000000000000000000000000000000000000000000;

    ///native coin cross identifier
    uint public coinId = INVALID_VALUE;

    ///token cross identifier which is contract address on original chain
    address public tokenOrigAddr;

    ///the storeman group administration contract address
    address public      smgAdminAddr;

    ///the mpc signer address
    address public      mpcSigner;

    ///the address on original chain for storeman
    address              originalChainAddr;

    ///the transaction fee ratio required by this storeman group
    uint public         txFeeRatio;

    ///the minumum deposit for each storeman which is reuqired by storeman group
    uint public         minDeposit;

    uint public         unregisterApplyTime;

    ///the delay time for storeman get back deposit
    uint public         withdrawDelayTime = 72*3600;

    ///the max storeman nodes which is in this storeman ggroup
    uint public         maxNodes = 21;

    ///the counter for regestering store man
    uint public         smCount;

    ///the open storeman node for partiner
    uint public         openNodes = 6;

    ///the open storeman node counter
    uint public         smOpenCount;

    ///the total ammount of the recieved deposit
    uint public         totalDeposit;       //record deposit recieved in contract

    ///the flag which show wether this contract have got back deposit from storeman admin contract
    bool public isDepositGotBackFromAdmin = false;

    ///the flag which show wether whitelist is enabled
    bool public isEnabledWhiteList = false;

    ///mpc leader contract address
    address public mpcLeader;

    ///bous claim cycle period
    uint    public bounusClaimPeriod;
    uint    public mpcSmgStartTime;
    uint    public mpcSmgEndTime;

    struct StoremanNode {
        bytes32     nodesId1;             //1 the account for storeman group on original chain
        bytes32     nodesId2;             //1 the account for storeman group on original chain
        uint        deposit;             //2 the node's depost
        uint        bonus;               //3 the bonus which is not claimed back
        uint        lastBonusBlk;        //4 the bonus that is got already
        uint        index;               //5 index in the address array
        address     initiator;           //6 the initiator
        uint        unregisterApplyTime; //7 the time for storeman group applied exit
        bool        isFoundation;        //8 the node is foundation or partiner,true foundation
    }

    ///the storeman nodes contract address array
    address[] smNodesScAddr = new address[](MAX_MPC_NODES);

    ///the Storeman Node info
    mapping(address => StoremanNode)         public smNodes;

    ///the whitelist for registering storeman
    mapping(address => bool)                 public smWhiteList;    		//the white list


    /// @notice event for storeman group claiming system bonus
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param bonus the bonus for storeman claim
    event SmgClaimSystemBonus(address indexed smgAddress,uint indexed coin,uint indexed bonus);

    /**
    *
    * MODIFIERS
    *
    */
    modifier onlyMpcSinger() {
        require(msg.sender == mpcSigner);
        _;
    }

    modifier mpcReady() {
        require(mpcIsReady());
        _;
    }

    /**
     * MANIPULATIONS
     */
    /// @notice default tranfer to contract
    function () public payable {
         // only smg adminstrator can send ether
        if(msg.sender != smgAdminAddr) {
            revert();
        }
    }


    function initialize(uint pcoinId,address ptokenOrigAddr,address psmgAdminAddr,address pMpcSignerAddr,address poriginalChainAddr,uint ptxFeeRatio,uint pminDeposit)
    onlyOwner
    isHalted
    public
    {
        require(smgAdminAddr == address(0x0));

        require(psmgAdminAddr != address(0x0));
        require(pMpcSignerAddr != address(0x0));
        require(ptxFeeRatio <= DEFAULT_PRECISE );
        require(pminDeposit > 0);

        if(ptokenOrigAddr != address(0)){
            coinId = INVALID_VALUE;
            tokenOrigAddr = ptokenOrigAddr;
        } else {
            require(pcoinId != INVALID_VALUE);
            coinId = pcoinId;
            tokenOrigAddr = address(0x0);
        }

        smgAdminAddr = psmgAdminAddr;
        mpcSigner = pMpcSignerAddr;
        txFeeRatio = ptxFeeRatio;
        minDeposit = pminDeposit;
        originalChainAddr = poriginalChainAddr;
        unregisterApplyTime = 0;
    }


    function setTokenOrigAddr(address addr)
    public
    onlyOwner
    isHalted
    {
        require(addr != address(0x0));
        require(tokenOrigAddr != address(0x0));
        tokenOrigAddr = addr;
    }


    function setMpcSigner(address addr)
    public
    onlyOwner
    isHalted
    {
        require(addr != address(0x0));
        mpcSigner = addr;
    }

    function setMpcLeader(address addr)
    public
    onlyOwner
    isHalted
    {
        require(addr != address(0x0));
        require(smNodes[addr].nodesId1.length != 0);
        mpcLeader = addr;
    }

    function setStoremanGroupAdmin(address addr)
    public
    onlyOwner
    isHalted
    {
        require(addr != address(0));
        smgAdminAddr = addr;
    }

    function setSmgNodesAllocation(uint pmaxNodes,uint popenNodes)
    public
    onlyOwner
    isHalted
    {
        require(pmaxNodes >= popenNodes );
        maxNodes = pmaxNodes;
        openNodes = popenNodes;
    }


    function enableSmWhiteList(bool penable)
    public
    onlyOwner
    isHalted
    {
        isEnabledWhiteList = penable;
    }

    function setSmWhiteList(address smAddr)
    public
    onlyOwner
    {
        require(isEnabledWhiteList);
        require(!smWhiteList[smAddr]);
        require(smAddr != address(0));

        smWhiteList[smAddr] = true;
    }

    function setWithdrawDepositDelayTime(uint delayTime)
    public
    onlyOwner
    isHalted
    {
        require(delayTime > 0);
        withdrawDelayTime = delayTime;
    }


    function setMpcSmgRunningTime(  uint   pSmgStartTime,
                                    uint   pSmgEndTime,
                                    uint   pbounusClaimPeriod
                                 )
    public
    onlyOwner
    isHalted
    {
        mpcSmgStartTime = pSmgStartTime;
        mpcSmgEndTime = pSmgEndTime;
        bounusClaimPeriod = pbounusClaimPeriod;
    }

    function mpcIsReady()
    public
    returns (bool)
    {
        require(smgAdminAddr != address(0));

        require(withdrawDelayTime > 0);

        require(mpcSmgStartTime > 0);
        require(bounusClaimPeriod > 0);
        require(now > mpcSmgStartTime && now < mpcSmgEndTime);

        require(mpcLeader != address(0));

        require(smOpenCount == openNodes);
        require(smCount == maxNodes);

        require(txFeeRatio != 0);

        return true;
    }

    /*********************node constract calling interface*************************************************************/
    function registerNode(address smAddress,bytes32 nodekey1,bytes32 nodekey2)
    payable
    public
    {
        //require it is contract
        require(tx.origin != msg.sender);

        registerSmNode(smAddress,nodekey1,nodekey2,false);
    }

    function registerFoundationNode(address smAddress,bytes32 nodekey1)
    public
    payable
    onlyOwner
    {
        registerSmNode(smAddress,nodekey1,nodekey1,true);
    }

    function applyUnregisterSmNode(address smAddr)
    public
    {
        //only apply unregister after mpc smg end time
        require(now > mpcSmgEndTime);

        require(smNodes[smAddr].initiator == msg.sender);
        smNodes[smAddr].unregisterApplyTime = now;
        //if there are bonus,then return bonus to sm node
        if(smNodes[smAddr].bonus > 0) {
            msg.sender.transfer(smNodes[smAddr].bonus);
        }
    }

    function withdrawSmNodeDeposit(address smAddr)
    public
    {
        //only withdraw deposit after mpc smg end time
        require(now > mpcSmgEndTime);

        require(smNodes[smAddr].initiator == msg.sender);
        require(now > smNodes[smAddr].unregisterApplyTime + withdrawDelayTime);
        require(isDepositGotBackFromAdmin);

        uint balance = smNodes[smAddr].deposit;
        delete smNodesScAddr[smNodes[smAddr].index];
        delete smNodes[smAddr];

        totalDeposit = totalDeposit.sub(balance);

        msg.sender.transfer(balance);
    }


    function claimSmNodeBonus(address smAddr)
    public
    {
        //claim bonus only during the mpc smg running time,the bonus which is not claimed after end time will be give when node apply unregister
        require(now > mpcSmgStartTime && now < mpcSmgEndTime);
        //the intiator has permission to clainm bonus
        require(smNodes[smAddr].initiator == msg.sender);
        require(smNodes[smAddr].unregisterApplyTime == 0);
        require(smNodes[smAddr].bonus > 0);

        uint bonus = smNodes[smAddr].bonus;
        smNodes[smAddr].bonus = 0;

        msg.sender.transfer(bonus);
    }

    /**********************************mpc signer interface for smg contract*******************************************/
    function mpcSetTxFee(uint ptxFeeRatio)
    public
    onlyMpcSinger
    {
        //only can be set before mpc start time
        require(now < mpcSmgStartTime);
        txFeeRatio = ptxFeeRatio;
    }

    function mpcRegisterToSmgAdminSc()
    public
    mpcReady
    notHalted
    onlyMpcSinger
    payable
    {

        bool res;
        bytes4 methodId;

        if(tokenOrigAddr == address(0x0)) {
            //storemanGroupRegisterByDelegate(address tokenOrigAddr, address storemanGroup, address originalChainAddr,uint txFeeRatio)
            methodId = bytes4(keccak256("storemanGroupRegisterByDelegate(uint256,address,address,uint256)"));
            res = smgAdminAddr.call.value(this.balance)(methodId,coinId,msg.sender,originalChainAddr,txFeeRatio);
        } else {
            methodId = bytes4(keccak256("storemanGroupRegisterByDelegate(address,address,address,uint256)"));
            res = smgAdminAddr.call.value(this.balance)(methodId,tokenOrigAddr,msg.sender,originalChainAddr,txFeeRatio);
       }

        assert(res);

    }

    function mpcStoremanGroupApplyUnregister()
    public
    mpcReady
    notHalted
    onlyMpcSinger
    {
        bool res;
        bytes4 methodId;

        //record the unregister time
        unregisterApplyTime = now;

        if(tokenOrigAddr == address(0)) {
            methodId = bytes4(keccak256("smgApplyUnregisterByDelegate(uint,address)"));
            res = smgAdminAddr.call(methodId,coinId,msg.sender);
        } else {
            methodId = bytes4(keccak256("smgApplyUnregisterByDelegate(address,address)"));
            res = smgAdminAddr.call(methodId,tokenOrigAddr,msg.sender);
        }

        assert(res);
    }

    function mpcStoremanGroupWithdrawDeposit()
    public
    mpcReady
    notHalted
    onlyMpcSinger
    {
        bool res;
        bytes4 methodId;

        uint preBalance = this.balance;

        if(tokenOrigAddr == address(0)) {
            methodId = bytes4(keccak256("smgWithdrawDepositByDelegate(uint,address)"));
            res = smgAdminAddr.call(methodId,coinId,msg.sender);
        } else {
            methodId = bytes4(keccak256("smgWithdrawDepositByDelegate(address,address)"));
            res = smgAdminAddr.call(methodId,tokenOrigAddr,msg.sender);
        }
        assert(res);

        uint despositBack = this.balance.sub(preBalance);

        assert(despositBack==totalDeposit);

        isDepositGotBackFromAdmin = true;
    }


    function mpcStoremanGroupClaimSystemBonus()
    public
    mpcReady
    notHalted
    onlyMpcSinger
    {
        bool res;
        bytes4 methodId;

        uint preBalance = this.balance;

        if(tokenOrigAddr == address(0x0)) {
            methodId = bytes4(keccak256("smgClaimSystemBonusByDelegate(uint256,address)"));
            res = smgAdminAddr.call(methodId,coinId,msg.sender);
        } else {
            methodId = bytes4(keccak256("smgClaimSystemBonusByDelegate(address,address)"));
            res = smgAdminAddr.call(methodId,tokenOrigAddr,msg.sender);
        }

        assert(res);

        uint bonus =  this.balance.sub(preBalance);

        allocateBonus(bonus);

        emit SmgClaimSystemBonus(smgAdminAddr,0,bonus);
    }


    ////////////////private function///////////////////////////////////////////////
    function registerSmNode(address smAddr,bytes32 nodekey1,bytes32 nodekey2,bool isFoundation)
    private
    {

        require(smNodes[smAddr].deposit == 0);
        if(isEnabledWhiteList) {
            require(smWhiteList[smAddr]);
        }
        require( nodekey1 != EMPTY_BYTE32);
        require( nodekey2 != EMPTY_BYTE32);

        require(smAddr!=address(0));
        require(msg.value > minDeposit);

        require(smCount <  maxNodes);
        require(smOpenCount < openNodes);

        //register sm node only early than start time for store man group
        require(now < mpcSmgStartTime);

        smNodesScAddr[smCount] = smAddr;
        smNodes[smAddr] = StoremanNode(nodekey1,nodekey2,msg.value,0,0,smCount,msg.sender,0,isFoundation);

        if(!isFoundation){
            smOpenCount++;
        }

        totalDeposit = totalDeposit.add(msg.value);

        smCount++;

    }

    function allocateBonus(uint bonus)
    private
    {
        uint bonusPerNode = bonus.div(openNodes);
        uint8 i = 0;
        for(;i<maxNodes;i++){
            smNodes[smNodesScAddr[i]].bonus = smNodes[smNodesScAddr[i]].bonus.add(bonusPerNode);
        }

    }

}

