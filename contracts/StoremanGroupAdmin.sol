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
import "./AdminInterface.sol";


contract StoremanGroupAdmin is Halt {
    using SafeMath for uint;
    uint public constant wanExponent = 1000000000000000000;//1e18
    address public coinAminAddr;

    struct StoremanGroup {
        uint        deposit;			//the storeman group deposit
        address     originalChainAddr;  //the account for storeman group on original chain
        uint        unregisterApplyTime;//the time for storeman group applied exit
        uint        txFeeRatio;         //the fee ratio required by storeman group
        uint        bonusBlockNumber;   //the start block number for bonus calculation for storeman group
        address     initiator;			//the account for registering a storeman group which provide storeman group deposit
        uint        punishPercent;      //punish percent of deposit
    }

    mapping (uint=>mapping(address => StoremanGroup)) public mapCoinSmgInfo; 	//the storeman group info
    mapping (uint=>mapping(address => bool)) public mapSmgWhiteList;    		//the white list
    mapping (uint=>uint) public bonusTotal;

    /// @notice event for storeman register
    /// @param smgAddress   storeman address
    /// @param smgOriginalChainAddress storeman group  original chain address
    /// @param coin       coin name
    /// @param wancoin      deposit wancoin number
    /// @param tokenQuota   corresponding token quota
    /// @param txFeeratio storeman fee ratio
    event SmgRegister(address indexed smgAddress,address smgOriginalChainAddress,uint indexed coin,uint wancoin, uint tokenQuota,uint txFeeratio);

    /// @notice event for storeman register
    /// @param sender sender for bonus
    /// @param coin coin name
    /// @param wancoin deposit wancoin number
    //event SmgDepositBonus(address indexed sender,uint indexed coin,uint wancoin);

    /// @notice event for storeman register
    /// @param smgAddress   storeman address
    /// @param coin       coin name
    //event SmgWhiteList(address indexed smgAddress,uint indexed coin);

    /// @notice event for the htlc address on original chain event
    /// @param smgAddress   storeman address
    /// @param coin       coin name
    /// @param orgSCAddr    the htlc address on original chain
    event SmgSetOrigSC(address indexed smgAddress,uint indexed coin,bytes indexed orgSCAddr);

    /// @notice event for the htlc address on wan chain
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param proxySCAddr  the htlc address on wan chain
    event SmgSetProxySC(address indexed smgAddress,uint indexed coin,address indexed proxySCAddr);

    /// @notice event for applying storeman group unregister
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param applyTime    the time for storeman applying unregister
    event SmgApplyUnRegister(address indexed smgAddress,uint indexed coin,uint indexed applyTime);

    /// @notice event for storeman group withdraw deposit
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param deposit smg deposit
    /// @param actualReturn acutal return wan
    event SmgWithdraw(address indexed smgAddress,uint indexed coin,uint indexed actualReturn,uint deposit);


    /// @notice event for storeman group claiming system bonus
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param bonus the bonus for storeman claim
    event SmgClaimSystemBonus(address indexed smgAddress,uint indexed coin,uint indexed bonus);

    /// @notice event for storeman group be punished
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param punishPercent punish percent of deposit
    event SmgPunished(address indexed smgAddress,uint indexed coin,uint indexed punishPercent);

    /// @notice event for transfer deposit to specified address
    /// @param smgAddress   storeman address
    /// @param coin         coin name
    /// @param destAddress the destination address of deposit
    event SmgTranferDeposit(address indexed smgAddress,uint indexed coin,address destAddress,uint deposit);

    /**
    *
    * MODIFIERS
    *
    */
    /// @notice modifier for checking if contract is initialized
    /// @param coin   coin name
    modifier initialized(uint coin) {
        require(coinAminAddr!=address(0x0));
        require(CoinAdminInterface(coinAminAddr).isInitialized(coin));
        _;
    }

    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice default tranfer to contract
    function () public payable {
       revert();
    }

    /// @notice         set storeman group admin SC address(only owner have the right)
    /// @param  addr    storeman group admin SC address
    function setCoinAdmin(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        coinAminAddr = addr;
        return true;
    }


    /// @notice function for storeman register
    /// @param coin  coin name
    /// @param originalChainAddr  the htlc info on original chain
    /// @param txFeeRatio	the transaction fee required by storeman group
    function storemanGroupRegister(uint coin,address originalChainAddr,uint txFeeRatio)
        public
        payable
        notHalted
    {
        storemanGroupRegisterByDelegate(coin,msg.sender,originalChainAddr,txFeeRatio);
    }

    /// @notice function for storeman register by sender
    /// @param coin  coin name
    /// @param smgWanAddr  the storeman group register address
    /// @param originalChainAddr  the htlc info on original chain
    /// @param txFeeRatio	the transaction fee required by storeman group
  function storemanGroupRegisterByDelegate(uint coin,address smgWanAddr,address originalChainAddr,uint txFeeRatio)
        public
        payable
        initialized(coin)
        notHalted
    {

       var (coin2WanRatio,defaultMinDeposit, , , ,wanchainTokenManager,,useWhiteList, , , , ) = CoinAdminInterface(coinAminAddr).mapCoinInfo(coin);

       require(msg.value >= defaultMinDeposit);
       require(originalChainAddr != address(0x0));
       require(txFeeRatio > 0);
       require(smgWanAddr != address(0));

        //require smg is not registered
        require(mapCoinSmgInfo[coin][smgWanAddr].bonusBlockNumber == 0);

        if (useWhiteList) {
            assert(mapSmgWhiteList[coin][smgWanAddr]);
            mapSmgWhiteList[coin][smgWanAddr] = false;
        }

        if (smgWanAddr == msg.sender){//if sender same with smgWanAddr,there are no initiator
            mapCoinSmgInfo[coin][smgWanAddr] = StoremanGroup(msg.value,originalChainAddr,0,txFeeRatio,block.number,address(0),0);
        } else {
            mapCoinSmgInfo[coin][smgWanAddr] = StoremanGroup(msg.value,originalChainAddr,0,txFeeRatio,block.number,msg.sender,0);
        }

        uint tokens = getTokens(coin,coin2WanRatio,CoinAdminInterface(coinAminAddr).DEFAULT_PRECISE());
        assert(deposit(smgWanAddr,tokens,wanchainTokenManager));

        //send event
        emit SmgRegister(smgWanAddr,originalChainAddr,coin,msg.value,tokens,txFeeRatio);
    }

    /// @notice function for nonus
    /// @param coin  coin name
    function depositSmgBonus(uint coin)
        public
        payable
        initialized(coin)
        onlyOwner
    {
        require(msg.value > 0);

        var (, , , , , , , ,startBonusBlk, , , ) = CoinAdminInterface(coinAminAddr).mapCoinInfo(coin);

        require(startBonusBlk > 0);
        bonusTotal[coin] = bonusTotal[coin].add(msg.value);

        //send event
       // emit SmgDepositBonus(msg.sender,coin,msg.value);
    }

    /// @notice function for setting smg white list by owner
    /// @param coin  coin name
	/// @param smgAddr  storeman group address for whitelist
    function setSmgWhiteList(uint coin,address smgAddr)
        public
        onlyOwner
        initialized(coin)
    {
        require(smgAddr!=address(0));

        require(mapCoinSmgInfo[coin][smgAddr].bonusBlockNumber == 0);
        require(!mapSmgWhiteList[coin][smgAddr]);

        mapSmgWhiteList[coin][smgAddr] = true;

        //send event
       // emit SmgWhiteList(smgAddr,coin);

    }

    /// @notice function for getting store man tx fee
    /// @param coin      coin name
    /// @param storemanAddr htlc contract address on wanchain chain
    function getStoremanTxFeeRatio(uint coin,address storemanAddr)
        public
        view
        returns (uint)
    {
        return mapCoinSmgInfo[coin][storemanAddr].txFeeRatio;
    }

    /// @notice function for storeman applying unregister
    /// @param coin   coin name
    function storemanGroupApplyUnregister(uint coin)
        public
        notHalted
    {
        smgApplyUnregister(coin,msg.sender);
    }

    /// @notice function for storeman applying unregister which is done by delegator
    /// @param coin   coin name
    /// @param smgAddr the storeman wan address
    function smgApplyUnregisterByDelegate(uint coin,address smgAddr)
        public
        notHalted
    {
        assert(mapCoinSmgInfo[coin][smgAddr].initiator == msg.sender);

        smgApplyUnregister(coin,smgAddr);
    }

    /// @notice function for storeman applying unregister
    /// @param coin   coin name
    /// @param smgAddr smg address
    function smgApplyUnregister(uint coin,address smgAddr)
        private
        notHalted
        initialized(coin)
    {
        //require smg exist
        assert(mapCoinSmgInfo[coin][smgAddr].bonusBlockNumber > 0);
        assert(mapCoinSmgInfo[coin][smgAddr].unregisterApplyTime == 0);

        mapCoinSmgInfo[coin][smgAddr].unregisterApplyTime = now;

        var (, , , , ,tokenManagerAddr, , ,startBonusBlk, , ,) = CoinAdminInterface(coinAminAddr).mapCoinInfo(coin);

        if ( startBonusBlk > 0 &&  mapCoinSmgInfo[coin][smgAddr].punishPercent==0) {
            claimSystemBonus(coin,smgAddr);
        }

        assert(applyUnregister(tokenManagerAddr,smgAddr));
        //send event
        emit SmgApplyUnRegister(smgAddr,coin,now);//event
    }

    /// @notice function for storeman withdraw deposit
    /// @param coin   coin name
    function storemanGroupWithdrawDeposit(uint coin)
        public
    {
        withdrawDeposit(coin,msg.sender);
    }

    /// @notice function for storeman withdraw deposit
    /// @param coin   coin name
    /// @param smgAddr storeman wan address
    function smgWithdrawDepositByDelegate(uint coin,address smgAddr)
        public
    {
        assert( mapCoinSmgInfo[coin][smgAddr].initiator == msg.sender);

        withdrawDeposit(coin,smgAddr);
    }

    /// @notice function for storeman withdraw deposit
    /// @param coin   coin name
    /// @param smgAddr storeman wan address
    function withdrawDeposit(uint coin,address smgAddr)
        private
        notHalted
        initialized(coin)
    {

        StoremanGroup storage smgInfo = mapCoinSmgInfo[coin][smgAddr];

        var (, , , , ,wanchainTokenManager,withdrawDelayTime, , , , , ) = CoinAdminInterface(coinAminAddr).mapCoinInfo(coin);

        assert(now > smgInfo.unregisterApplyTime.add(withdrawDelayTime));
        //check smg existing
        assert(smgInfo.deposit > 0);

       assert(smgWithdrawAble(wanchainTokenManager,smgAddr,true));
       uint deposit = smgInfo.deposit;
       uint restBalance = smgInfo.deposit;
       if (smgInfo.punishPercent > 0) {
           restBalance = restBalance.sub(restBalance.mul(smgInfo.punishPercent).div(100));
       }

       smgInfo.deposit = 0;
       smgInfo.unregisterApplyTime = 0;
       smgInfo.originalChainAddr = address(0);
       smgInfo.bonusBlockNumber = 0;
       smgInfo.punishPercent = 0;

       if (smgInfo.initiator != address(0)) {
            smgInfo.initiator.transfer(restBalance);
       } else {
            msg.sender.transfer(restBalance);
       }

       //transfer punished deposit to reciever
       if(restBalance < deposit) {
          address punishReciever = CoinAdminInterface(coinAminAddr).mapCoinPunishReceiver(coin);
          punishReciever.transfer(deposit.sub(restBalance));
       }

       smgInfo.initiator = address(0);

       //send event
       emit SmgWithdraw(smgAddr,coin,restBalance,deposit);

    }

    /// @notice function for storeman claiming system bonus
    /// @param coin   coin name
    function storemanGroupClaimSystemBonus(uint coin)
        public
        notHalted
    {
        assert(mapCoinSmgInfo[coin][msg.sender].bonusBlockNumber != 0);
        assert(mapCoinSmgInfo[coin][msg.sender].unregisterApplyTime == 0);//can not claim after unregister applying

        claimSystemBonus(coin,msg.sender);
    }

    /// @notice function for storeman claiming system bonus
    /// @param coin   coin name
    /// @param smgAddr storeman wan address
    function smgClaimSystemBonusByDelegate(uint coin,address smgAddr)
        public
        notHalted
    {
        //it need initiator to claim bonus
        assert(msg.sender ==  mapCoinSmgInfo[coin][smgAddr].initiator);
        assert(mapCoinSmgInfo[coin][smgAddr].bonusBlockNumber != 0);
        assert(mapCoinSmgInfo[coin][smgAddr].unregisterApplyTime == 0);//can not claim after unregister applying

        claimSystemBonus(coin,smgAddr);
    }


    /// @notice function for storeman applying unregister
    /// @param coin   coin name
    /// @param punishPercent punished percent of deposit bonus
    function punishStoremanGroup(uint coin,address smgAddr,uint punishPercent)
        public
        onlyOwner
    {
        require(punishPercent<=100);
        require(mapCoinSmgInfo[coin][smgAddr].deposit != 0);

        mapCoinSmgInfo[coin][smgAddr].punishPercent = punishPercent;
        //send event
        SmgPunished(smgAddr,coin,punishPercent);//event

    }

    /// @notice function for destroy contract
    function kill()
        public
        isHalted
        onlyOwner
    {
        selfdestruct(owner);
    }

    /// @notice function tranfer out the specified smg deposit in case of smg lost keystore which can not recovered anymore
    /// @param coin   coin name
    /// @param smgAddr storeman address
    /// @param destAddress the target address which revieve deposit
    /// @param isTransferAll check if all deposit of contract or smg deposit is transfered
    function transferSmgDeposit(uint coin,address smgAddr,address destAddress,bool isTransferAll)
        public
        onlyOwner
    {
       if (isTransferAll&&halted) {
           owner.transfer(this.balance);
       } else {
           require(mapCoinSmgInfo[coin][smgAddr].deposit > 0);
           uint deposit = mapCoinSmgInfo[coin][smgAddr].deposit;
           var (, , , , ,wanchainTokenManager, , , , , , ) = CoinAdminInterface(coinAminAddr).mapCoinInfo(coin);
           assert(smgWithdrawAble(wanchainTokenManager,smgAddr,false));

           //set deposit to 0
           mapCoinSmgInfo[coin][smgAddr].deposit = 0;
           destAddress.transfer(deposit);
       }

       SmgTranferDeposit(smgAddr,coin,destAddress,deposit);
    }

////////////////private function///////////////////////////////////////////////
  function deposit(address smgAddr,uint tokenNumber,address tokenManagerAddr)
        private
        returns (bool)
    {
        bytes4 methodId = bytes4(keccak256("registerStoremanGroup(address,uint256)"));
        return tokenManagerAddr.call(methodId,smgAddr,tokenNumber);
    }


    function applyUnregister(address tokenManagerAddr,address smgAddr)
        private
        returns (bool)
    {
        bytes4 methodId = bytes4(keccak256("applyUnregistration(address)"));
        return tokenManagerAddr.call(methodId,smgAddr);
    }

    function smgWithdrawAble(address tokenManagerAddr,address smgAddr,bool isNormal)
        private
        returns (bool)
    {
        bytes4 methodId = bytes4(keccak256("unregisterStoremanGroup(address,bool)"));
        return tokenManagerAddr.call(methodId,smgAddr,isNormal);
    }

    function getTokens(uint coin, uint coin2WanRatio,uint defaultPrecise)
        private
        view
        returns(uint)
    {
        uint calValue = msg.value;
        uint tokenExp = CoinAdminInterface(coinAminAddr).mapCoinExponent(coin);

        return (calValue.div(coin2WanRatio).mul(defaultPrecise)).mul(tokenExp).div(wanExponent);

    }

    function claimSystemBonus(uint coin,address smgAddr)
        private
        initialized(coin)
        notHalted
    {
        var (, , , , , , , ,startBonusBlk, , bonusPeriodBlks, bonusRatio) = CoinAdminInterface(coinAminAddr).mapCoinInfo(coin);

        StoremanGroup storage smgInfo = mapCoinSmgInfo[coin][smgAddr];
        if(smgInfo.punishPercent != 0 || startBonusBlk == 0){
          return;
        }

        if (smgInfo.bonusBlockNumber<startBonusBlk){
            smgInfo.bonusBlockNumber = startBonusBlk;
        }

      // uint blks = block.number.sub(smgInfo.bonusBlockNumber);
        if( block.number.sub(smgInfo.bonusBlockNumber) >= bonusPeriodBlks && smgInfo.deposit > 0) {

            uint cycles =  block.number.sub(smgInfo.bonusBlockNumber).div(bonusPeriodBlks);

            smgInfo.bonusBlockNumber = smgInfo.bonusBlockNumber.add(cycles.mul(bonusPeriodBlks));

            uint  bonus = smgInfo.deposit.mul(bonusRatio).div(CoinAdminInterface(coinAminAddr).DEFAULT_PRECISE());
            bonus = bonus.mul(cycles);

            if(bonusTotal[coin] >= bonus && bonus > 0){
                  bonusTotal[coin] = bonusTotal[coin].sub(bonus);
                  //if there are initiator,transfer bonus to initiator
                  if(smgInfo.initiator != address(0)){
                      smgInfo.initiator.transfer(bonus);
                      SmgClaimSystemBonus(smgInfo.initiator, coin, bonus);
                  } else {
                      msg.sender.transfer(bonus);
                      SmgClaimSystemBonus(msg.sender, coin, bonus);
                  }
            } else {
                  SmgClaimSystemBonus(msg.sender, coin, 0);
            }
      }

    }
}

