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

contract StoremanGroup is Halt {

    using SafeMath for uint;
    enum SCStatus {Invalid,StakingPhase,StakerElection,Lottery,Initial,Registered,Unregistered,Withdrawed,WorkDone}

    ///the minumum deposit for each depositor which is reuqired by storeman group
    uint public constant    DEFAULT_PRECISE     = 10000;
    uint public constant    MIN_DEPOSIT         =    1000000000000000000000;
    uint public constant    MAX_COMMISION_BASE  =    5000000000000000000000;
    uint public constant    MAX_DEPOSIT_SUM     = 4000000000000000000000000; 

    ///the storeman group administration contract address
    address public      storemanGroupAdmin;
    address public      locatedMpcAddr;
    address public      locatedLotteryAddr;

    SCStatus public     scStatus = SCStatus.Invalid;

    ///the total lottery bonus
    uint public         totalLotteryBonus;

    ///the distributed lottery bonus
    uint public         distributedLotterBonus;

    ///the total total deposit of smg during staking phase
    uint public         totalStakingDeposit;

    ///the final deposit of all stakers of smg
    uint public         totalSmgDeposit;

    ///the total amount of the effective deposit that's used to divide bonus
    uint public         totalStakerQuota;

    ///the deposited quota recorded
    uint public         depositedQuota; 

    ///the number of supported token type 
    uint public         totalTokenTypeNum; 

    ///total bonus of smg from admin
    uint public         totalBonus;

    /// bonus commision per unit
    uint public         bonusPerUnit;

    ///total number of stakers
    uint public         stakerNum;
    
    ///the flag which show whether the total deposit of smg stakers reach MAX_DEPOSIT_SUM
    bool public         isReachedMaxDeposit = false;

    ///storemanGroup running time
    uint public         runningStartTime;
    uint public         runningEndTime;

    ///staking  time
    uint public         stakingStartTime;
    uint public         stakingEndTime;

    struct BidderInfo{
        uint    deposit;         //1 the deposit of this depositor          
        uint    stakerRank;      //2 the rank of staker sequence       
        uint    stakerQuota;     //3 the effective quota of deposit 
        uint    stakerBonus;     //4 the bonus for staker                    
        uint    lotterRank;      //5 lotter rank     
        uint    lotterBonus;     //6 lotter bonus            
        bool    hasRevoked;      //7 if depositor has been revoked            
        uint    bidTimeStamp;    //8 timestamp of the bidder's first deposit 
    }

    struct tokenDeposit{
        uint        deposit;      //1 the deposit of this depositor 
        SCStatus    statu;        //2 the statu of tokenDeposit      
        uint        revokeQuota;  //3 the quota revoked from token  
    }

    ///the depositor info
    mapping(address => BidderInfo) public   mapDepositorInfo;

    ///the token supported (mapping: tokenOrigAddr -> tokenDeposit) 
    mapping(address => tokenDeposit) public mapTokenSmgStatus;

    /**
    *
    * EVENTS
    *
    */
    /// @notice                           event for staking record
    /// @param _depositorAddr             depositor's address
    /// @param _depositValue              deposit 
    /// @param _stakerAccumDeposit        accumulative deposit of depositor by now
    /// @param _smgAccumDeposit           accumulative deposit of smg by now
    /// @param _depositTimeStamp          accumulative deposit of smg by now
    event StoremanGroupDepositLogger(address indexed _depositorAddr, uint256 _depositValue, uint256 _depositTimeStamp, uint256 _stakerAccumDeposit, uint256 _smgAccumDeposit);  
    
    /// @notice                           event for staker info
    /// @param _stakerAddr                the address of staker
    /// @param _depositValue              the deposit of staker
    /// @param _quota                     the effective quota of staker, must more than 1000 and no more than 5000
    /// @param _rank                      the rank of staker
    /// @param _accumStakerDeposit        the accumulative deposit of staker that has confirmed by now  
    event StoremanGroupStakerLogger(address indexed _stakerAddr, uint256 _depositValue, uint256 _quota, uint256 _rank, uint256 _accumStakerDeposit);  

    /// @notice                           event for foundation to inject lottery bonus
    /// @param _foundationAddr            the address of foundation
    /// @param _bonus                     the bonus value injected for lottery
    /// @param _totalLotterBonus          total bonus for lottery
    /// @param _lotterNum                 total number of lottery
    event StoremanGroupInjectLotteryBonusLogger(address indexed _foundationAddr, uint256 _bonus, uint256 _totalLotterBonus, uint256 _lotterNum); 

    /// @notice                           event for foundation to inject lottery bonus
    /// @param _foundationAddr            the address of foundation
    /// @param _bonus                     the bonus value injected for smg
    /// @param _totalBonus                total bonus for smg by now
    event StoremanGroupInjectSmgBonusLogger(address indexed _foundationAddr, uint256 _bonus, uint256 _totalBonus); 

    /// @notice                           event for lotter info
    /// @param _lotterAddr                the address of lotter
    /// @param _lotterDeposit             the deposit of lotter
    /// @param _lotterBonus               the bonus of lotter
    /// @param _lotterRank                lottery rank
    event StoremanGroupLotteryLogger(address indexed _lotterAddr, uint256 _lotterDeposit, uint256 _lotterBonus, uint256 _lotterRank);

    /// @notice                           event for smg to refeem  deposit from admin 
    /// @param _depositorAddr             the address of depositor 
    /// @param _deposit                   the deposit of depositor
    /// @param _bonus                     the lotter bonus of depsoit 
    event DepositorRefeemAssertLogger(address indexed _depositorAddr, uint256 _deposit, uint256 _bonus);

    /// @notice                           event for smg to refeem total bonus from admin
    /// @param _smgAmin                   the address of smg admin
    /// @param _tokenOrigAddr             token origin address
    /// @param _deposit                   total deposit that smg refeem from admin 
    event StoremanGroupApplyRegisterLogger(address indexed _smgAmin, address _tokenOrigAddr, address _originalChainAddr, uint256 _deposit, uint256 _txFeeRatio);

    /// @notice                           event for smg to refeem total bonus from admin
    /// @param _smgAmin                   the address of smg
    /// @param _tokenOrigAddr             token origin address
    event StoremanGroupApplyUnRegisterLogger(address indexed _smgAmin, address _tokenOrigAddr);

    /// @notice                           event for smg to refeem  deposit from admin 
    /// @param _smgAmin                   smg address
    /// @param _tokenOrigAddr             token origin address
    /// @param _depositRevoked            deposit that smg refeem from admin by one token type
    /// @param _restDeposit               total rest deposit that still deposited in admin 
    event StoremanGroupRefeemDepositLogger(address indexed _smgAmin, address _tokenOrigAddr, uint256 _depositRevoked, uint256 _restDeposit);

    /// @notice                           event for staker to refeem  assert from smg 
    /// @param _stakerAddr                the address of staker
    /// @param _deposit                   the deposit of staker
    /// @param _bonus                     staker's bonus deserved from smg  
    event StakerRefeemAssetLogger(address indexed _stakerAddr, uint256 _deposit, uint256 _bonus);    
    
    /// @notice                           event of exchange WERC20 token with ERC20 token request
    /// @param _objectSmgAddr             address of storemanGroup where debt will be transfered
    /// @param _tokenOrigAddr             address of ERC20 token
    /// @param _locatedMpcAddr            address of current smg locked Mpc node
    /// @param _debtValue                 debt value of which needed to transfer to _objectSmgAddr
    event StoremanGroupDebtTransferLogger(address indexed _objectSmgAddr, address indexed _tokenOrigAddr, address indexed _locatedMpcAddr, uint256 _debtValue);
    

    /**
     * MANIPULATIONS
     */
    /// @notice default transfer to contract
    function () public payable {

        if((now >= stakingStartTime) &&(now <= stakingEndTime)){
            handleSmgStaking(msg.sender, msg.value);
        }else if(msg.sender == storemanGroupAdmin){
            
        }else{
            revert("invalid assets inject!");
        }
    }

    /// @notice                         for setting smg admin
    /// @param _smgAdmin                smg admin address
    function setSmgAdmin(address _smgAdmin)
    public
    onlyOwner
    {
        require((now < runningStartTime) || (0 == runningStartTime), "SmgAddr must be set before running start");
        require(_smgAdmin != address(0), "this is not valid smg admin");

        storemanGroupAdmin = _smgAdmin;
    }  

    /// @notice                         for setting smg lottery
    /// @param _smgLottery              smg lottery sc address
    function setSmgLocatedLottery(address _smgLottery)
    public
    onlyOwner
    {
        require((now < runningStartTime) || (0 == runningStartTime), "SmgLottery must be set before running start");
        require(_smgLottery != address(0), "this is not valid smg lottery address");

        locatedLotteryAddr = _smgLottery;
    }  
  
    /// @notice                         for setting start and stop time for staking phase
    /// @param _stakingStartTime        staking start time
    /// @param _stakingEndTime          staking end time 
    function setSmgStakingTime(uint256 _stakingStartTime, uint256 _stakingEndTime) 
    public 
    onlyOwner
    {
        require((0 == stakingStartTime) || (now < stakingStartTime), "Cannot config staking time any more");
        require((_stakingStartTime > now) && (_stakingStartTime < _stakingEndTime), "Invalid staking time");

        stakingStartTime = _stakingStartTime;
        stakingEndTime = _stakingEndTime;
    }
 
    /// @notice                         for setting start and stop time for running phase
    /// @param _runningStartTime        smg running start time
    function setSmgRunningTime(uint256 _runningStartTime, uint256 _runningEndTime) 
    public      
    onlyOwner
    {
        require((0 == runningStartTime) || (now < runningStartTime), "Cannot config staking time any more");
        require((_runningStartTime > now) && (_runningStartTime > stakingEndTime), "Invalid running start time");
        require((_runningEndTime > now) && (_runningStartTime < _runningEndTime), "Invalid running end time");

        runningStartTime = _runningStartTime;
        runningEndTime = _runningEndTime;
    }

    /// @notice                         to record smg depositor info
    /// @param _account                 the depositor address
    /// @param _deposit                 the deposit value 
    function handleSmgStaking(address _account, uint256 _deposit)
    private
    notHalted
    {
        require(_account != address(0), "Invalid account");

        if(mapDepositorInfo[_account].deposit != 0){
            mapDepositorInfo[_account].deposit = mapDepositorInfo[_account].deposit.add(_deposit); 

            totalStakingDeposit = totalStakingDeposit.add(_deposit);
            // emit depositor info 
            emit StoremanGroupDepositLogger(_account, _deposit, now, mapDepositorInfo[_account].deposit, totalStakingDeposit); 
        }else{
            //construct mapDepositorInfo
            require(_deposit >= MIN_DEPOSIT, "Invalid deposit");

            mapDepositorInfo[_account].deposit = _deposit;
            mapDepositorInfo[_account].stakerQuota = 0;
            mapDepositorInfo[_account].stakerBonus = 0;
            mapDepositorInfo[_account].stakerRank = 0;
            mapDepositorInfo[_account].lotterRank = 0;
            mapDepositorInfo[_account].lotterBonus = 0;
            mapDepositorInfo[_account].hasRevoked = false;
            mapDepositorInfo[_account].bidTimeStamp = now;

            totalStakingDeposit = totalStakingDeposit.add(_deposit);
            // emit depositor info 
            emit StoremanGroupDepositLogger(_account, _deposit, now, _deposit, totalStakingDeposit); 
        }       
    }

    /// @notice                         to confirm final valid staker
    /// @param _accountArray            the address array of staker
    function setSmgStakerInfo(address[] memory _accountArray) 
    public
    onlyOwner
    notHalted
    {
        require((!isReachedMaxDeposit) && (now > stakingEndTime), "Invalid staker setting operation");

        if(SCStatus.StakerElection != scStatus){
            scStatus = SCStatus.StakerElection;
        }

        for(uint i = 0; i < _accountArray.length; i++){
            if(isReachedMaxDeposit){
                break;
            }

            address account = _accountArray[i];
            require((address(0) != account) && (MIN_DEPOSIT <= mapDepositorInfo[account].deposit), "Invalid staker info");  
            require((0 == mapDepositorInfo[account].stakerRank) && (0 == mapDepositorInfo[account].stakerQuota), "Invalid staker info"); 

            uint finalDeposit = mapDepositorInfo[account].deposit;

            uint valideQuota;
            if(finalDeposit > MAX_COMMISION_BASE){
                valideQuota = MAX_COMMISION_BASE;
            }else{
                valideQuota = finalDeposit;
            }

            stakerNum = stakerNum.add(1);
            mapDepositorInfo[account].stakerQuota = valideQuota;  
            mapDepositorInfo[account].stakerRank = stakerNum;

            totalStakerQuota = totalStakerQuota.add(valideQuota);
            totalSmgDeposit = totalSmgDeposit.add(finalDeposit);

            if(totalSmgDeposit >= MAX_DEPOSIT_SUM){
                isReachedMaxDeposit = true;
            }

            //emit final staker info
            emit StoremanGroupStakerLogger(account, finalDeposit, valideQuota, stakerNum, totalSmgDeposit);
        }
    }

    /// @notice                         to compute commision per unit
    /// @param _commision               commision value
    function getCommisionPerUnit(uint256 _commision)
    private
    onlyOwner
    returns(uint256)
    {
        require(totalStakerQuota > 0, "There is no quota for smg");
        // to confirm final bonus rule
        uint256 commisionPerUnit = _commision.mul(DEFAULT_PRECISE).div(totalStakerQuota);
        
        return commisionPerUnit;
    }

    /// @notice                         to inject lottery bonus 
    /// @param _lotterNum               the numbler of total lotter
    function injectLotteryBonus(uint256 _lotterNum)
    public
    payable
    notHalted
    {
        require(msg.value > 0, "Invalid lottery bonus");
        require(_lotterNum > 0, "Invalid lotter number");  
        require(address(0) != locatedLotteryAddr, "Invalid lottery instance");

        totalLotteryBonus = totalLotteryBonus.add(msg.value);

        bytes4 methodId = bytes4(keccak256("setSmgLotteryInfo(uint256,uint256)"));
        bool res = locatedLotteryAddr.call(methodId, totalLotteryBonus, _lotterNum);
        require(res, "setSmgLotteryInfo failed");

        emit StoremanGroupInjectLotteryBonusLogger(msg.sender, msg.value, totalLotteryBonus, _lotterNum);
    }

    /// @notice                         to inject smg bonus 
    function injectSmgBonus()
    public
    payable
    notHalted
    {
        require(msg.value > 0, "Invalid bonus");
        totalBonus = totalBonus.add(msg.value);
        bonusPerUnit = totalBonus.mul(DEFAULT_PRECISE).div(totalStakerQuota);

        emit StoremanGroupInjectSmgBonusLogger(msg.sender, msg.value, totalBonus);
    }

    /// @notice                         to set lotter bonus for depositor
    /// @param _accountArray            the array of lotter address
    /// @param _bonus                   the bonus from lottery 
    /// @param _rank                    the rank of bonus  
    function setSmgLotterInfo(address[] memory _accountArray, uint256 _bonus, uint256 _rank) 
    public
    onlyOwner
    notHalted
    {
        require((now > stakingEndTime) && (totalLotteryBonus > 0) && isReachedMaxDeposit, "Not allowed to lotter just now");
        require((totalLotteryBonus.sub(distributedLotterBonus)) >= (_bonus.mul(_accountArray.length)), "There is no enough bonus for lottery");
        require((0 != _rank) && (0 != _bonus), "Invalid lotter bonus");

        for(uint i = 0; i < _accountArray.length; i++){
            address account = _accountArray[i];

            require(address(0) != account, "Invalid account");
            require((0 != mapDepositorInfo[account].deposit) && (0 == mapDepositorInfo[account].stakerRank), "Invalid lotter info");
            require((0 == mapDepositorInfo[account].lotterBonus) && (0 == mapDepositorInfo[account].lotterRank), "Invalid lotter info");

            mapDepositorInfo[account].lotterBonus = _bonus;
            mapDepositorInfo[account].lotterRank = _rank;

            uint lotterAsset = mapDepositorInfo[account].deposit.add(mapDepositorInfo[account].lotterBonus);

            mapDepositorInfo[account].hasRevoked = true; 
            distributedLotterBonus = distributedLotterBonus.add(_bonus);

            //emit lottery info
            account.transfer(lotterAsset);
            emit StoremanGroupLotteryLogger(account, mapDepositorInfo[account].deposit, _bonus, _rank);
        }     

    }

    /// @notice                         to inject lottery bonus 
    function finishLottery()
    public
    onlyOwner
    notHalted
    {
        scStatus = SCStatus.Lottery;
    }

    /// @notice                         to withdraw depositor's assert that deposit and bonus
    /// @param _accountArray            the array of depositors address 
    function revokeDepositorsAsset(address[] memory _accountArray)
    public
    notHalted
    onlyOwner
    {
        require(scStatus == SCStatus.Lottery, "Cannot revoke non-staker's asset now");

        for(uint i = 0; i < _accountArray.length; i++){
            address account = _accountArray[i];

            require((address(0) != account) && (0 != mapDepositorInfo[account].deposit), "Invalid depositor info");        
            require((0 == mapDepositorInfo[account].stakerRank) && (false == mapDepositorInfo[account].hasRevoked), "Invalid depositor info");

            mapDepositorInfo[account].hasRevoked = true;

            account.transfer(mapDepositorInfo[account].deposit); 
            emit DepositorRefeemAssertLogger(account, mapDepositorInfo[account].deposit, mapDepositorInfo[account].lotterBonus);
        }

    }

    /// @notice                         to inject lottery bonus 
    function finishDepositorAssetRevoke()
    public
    onlyOwner
    notHalted
    {
        scStatus = SCStatus.Initial;
    }

    /// @notice                         to withdraw depositor's assert that deposit and bonus
    /// @param _stakerArray             the array of staker address
    function revokeStakersAsset(address[] memory _stakerArray)
    public
    notHalted
    onlyOwner
    {
        require(totalBonus > 0, "The Bonus from bund hasn't injected");
        require((now > runningEndTime) && (scStatus == SCStatus.Withdrawed), "Cannot revoke staker's asset now");

        for(uint i = 0; i < _stakerArray.length; i++){
            address account = _stakerArray[i];
            
            require((address(0) != account) && (0 != mapDepositorInfo[account].deposit), "Invalid acount address");        
            require((0 != mapDepositorInfo[account].stakerRank) && (false == mapDepositorInfo[account].hasRevoked), "Invalid staker info"); 

            // to count the commision of this staker
            mapDepositorInfo[account].stakerBonus = (mapDepositorInfo[account].stakerQuota).mul(bonusPerUnit).div(DEFAULT_PRECISE);        

            uint stakerAsset = mapDepositorInfo[account].deposit.add(mapDepositorInfo[account].stakerBonus);
            mapDepositorInfo[account].hasRevoked = true; 

            // to update the record of totalSmgDeposit, totalBonus 
            require(totalSmgDeposit >= (mapDepositorInfo[account].deposit), "There is not enough deposit left for deposit revoking");
            totalSmgDeposit = totalSmgDeposit.sub(mapDepositorInfo[account].deposit);

            require(totalBonus >= (mapDepositorInfo[account].stakerBonus), "There is not enough bonus left for bonus dispatch");
            totalBonus = totalBonus.sub(mapDepositorInfo[account].stakerBonus);
         
            account.transfer(stakerAsset); 
            emit StakerRefeemAssetLogger(account, mapDepositorInfo[account].deposit, mapDepositorInfo[account].stakerBonus);
        }
    }

    /// @notice                         to withdraw depositor's assert that deposit and bonus
    function finishStakersAssetRevoke()
    public
    onlyOwner
    notHalted
    {
        scStatus = SCStatus.WorkDone;
    }

    /// @notice                            function for storeman registration, this method should be invoked by the storemanGroup himself
    /// @param _tokenOrigAddr              token address of original chain
    /// @param _originalChainAddr          the storeman group info on original chain
    /// @param _txFeeRatio                 the transaction fee required by storeman group  
    function applyRegisterSmgToAdmin(address _tokenOrigAddr, address _originalChainAddr, uint256 _txFeeRatio, uint256 _deposit)
    public
    onlyOwner
    notHalted
    {
        require((_tokenOrigAddr != address(0)) && (_tokenOrigAddr != address(0)), "Invalid token address");
        require((now > stakingEndTime) && ((now < runningEndTime) || (0 == runningEndTime)), "cannot regist smg to admin now");
        require((SCStatus.Initial == scStatus) || (SCStatus.Registered == scStatus), "the smg statu cannot support regist now");
        require(this.balance >= _deposit, "Invalid smg balance");
        require(totalSmgDeposit >= depositedQuota.add(_deposit), "not enough depoist for register smg to admin");

        if(SCStatus.Withdrawed == mapTokenSmgStatus[_tokenOrigAddr].statu){
            require(mapTokenSmgStatus[_tokenOrigAddr].deposit == mapTokenSmgStatus[_tokenOrigAddr].revokeQuota, "this token has taken an inaccuracy deposit revoke before ");
        }else{
            require(SCStatus.Invalid == mapTokenSmgStatus[_tokenOrigAddr].statu, "this token type is listed by the smg by now");
        }

        bytes4 methodId = bytes4(keccak256("storemanGroupRegister(address,address,uint256)"));
        bool res = storemanGroupAdmin.call.value(_deposit)(methodId, _tokenOrigAddr, _originalChainAddr,_txFeeRatio);
        require(res, "storemanGroupRegister failed");

        depositedQuota = depositedQuota.add(_deposit);
        totalTokenTypeNum = totalTokenTypeNum.add(1);

        mapTokenSmgStatus[_tokenOrigAddr].deposit = _deposit;
        mapTokenSmgStatus[_tokenOrigAddr].statu = SCStatus.Registered;
        mapTokenSmgStatus[_tokenOrigAddr].revokeQuota = 0;

        scStatus = SCStatus.Registered;

        emit StoremanGroupApplyRegisterLogger(storemanGroupAdmin, _tokenOrigAddr, _originalChainAddr, _deposit, _txFeeRatio);        
    }
 
    /// @notice                            function for storemanGroup applying unregister (needed to confirm further)
    /// @param _objectSmgAddr              address of smg which used to accept debt
    /// @param _value                      debt value that needed to transfer  
    function applySmgDebtTransfer(address _objectSmgAddr, address _tokenOrigAddr, uint256 _value)
    public
    notHalted
    onlyOwner
    {
        require((now > runningEndTime) && (scStatus == SCStatus.Registered), "cannot unregister smg now");

        emit StoremanGroupDebtTransferLogger(_objectSmgAddr, _tokenOrigAddr, locatedMpcAddr, _value);     
    }

    /// @notice                            function for storemanGroup applying unregister
    /// @param _tokenOrigAddr              token address of original chain 
    function applyUnregisterSmgFromAdmin(address _tokenOrigAddr)
    public
    notHalted
    onlyOwner
    {
        require((now > runningEndTime) && (SCStatus.Registered == mapTokenSmgStatus[_tokenOrigAddr].statu), "cannot unregister smg now");

        bytes4 methodId = bytes4(keccak256("storemanGroupApplyUnregister(address)"));
        bool res = storemanGroupAdmin.call(methodId, _tokenOrigAddr);
        require(res, "storemanGroupApplyUnregister failed");

        mapTokenSmgStatus[_tokenOrigAddr].statu = SCStatus.Unregistered;

        emit StoremanGroupApplyUnRegisterLogger(storemanGroupAdmin, _tokenOrigAddr);     
    }


    /// @notice                           to withdraw storeman group's deposit
    /// @param _tokenOrigAddr             token address of original chain
    function withDrawSmgFromAdmin(address _tokenOrigAddr)
    public
    notHalted
    onlyOwner
    {
        require((now > runningEndTime) && (SCStatus.Unregistered == mapTokenSmgStatus[_tokenOrigAddr].statu), "cannot withdraw smg now");
        uint preBalance = this.balance;

        bytes4 methodId = bytes4(keccak256("storemanGroupWithdrawDeposit(address)"));
        bool res = storemanGroupAdmin.call(methodId, _tokenOrigAddr);
        require(res, "storemanGroupWithdrawDeposit failed");  

        uint aftBalance = this.balance;
        uint revokedDeposit = aftBalance.sub(preBalance);

        depositedQuota = depositedQuota.sub(revokedDeposit);
        totalTokenTypeNum = totalTokenTypeNum.sub(1);

        mapTokenSmgStatus[_tokenOrigAddr].statu = SCStatus.Withdrawed;
        mapTokenSmgStatus[_tokenOrigAddr].revokeQuota = revokedDeposit;

        if(0 == totalTokenTypeNum){ 
            scStatus = SCStatus.Withdrawed;
        }

        emit StoremanGroupRefeemDepositLogger(storemanGroupAdmin, _tokenOrigAddr, revokedDeposit, depositedQuota);
    }

    /// @notice function for destroy contract
    function kill() 
    public
    isHalted
    onlyOwner
    {   
        require(scStatus == SCStatus.WorkDone, "cannot destruct smg now");
        selfdestruct(owner);
    } 

}

