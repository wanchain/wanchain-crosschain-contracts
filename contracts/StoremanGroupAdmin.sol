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

contract StoremanGroupAdmin is Halt {
    using SafeMath for uint;
    
    ///smg storeman group 
    ///coin:smg address:balance
    uint public constant USE_CONTRACT = 0;
    uint public constant USE_SCRIPT = 1;
    uint public constant DEFAULT_PRECISE = 10000;
    
    ///one days blocks
    uint public constant DEFAULT_BONUS_PERIOD_BLOCKS = 6 * 60 * 24;
    uint public constant DEFAULT_BONUS_RATIO_FOR_DEPOSIT = 20;
    
    struct CoinInfo {
        uint    coin2WanRatio;      //1 coin to WANs,such as ethereum 880*DEFAULT_PRECISE
        uint    defaultMinDeposit;  //the minimum deposit for storeman group
        uint    htlcType;			//the htlc type,possible value USE_CONTRACT,USE_SCRIPT
        bytes   originalChainHtlc;  //the original chain htlc address if use contract
        address wanchainHtlc;       //the htlc address on wanchain
        address wanchainTokenManager; //the token administrator contract address
        uint    withdrawDelayTime;  //the delay time for withdrawing deposit after storeman group apply exit
        bool    useWhiteList;       //the flag for checking if the storeman group address is in white list if the storeman register is controlled
        uint    startBonusBlk;      //the begin blk for bonus   
        uint    bonusTotal;			//the total bonus provided by system
        uint    bonusPeriodBlks;    //the bonus period
        uint    bonusRatio;         //the bonus ratio
    }
    
    struct StoremanGroup {
        uint        deposit;			//the storeman group deposit
        bytes       originalChainAddr;  //the account for storeman group on original chain
        uint        unregisterApplyTime;//the time for storeman group applied exit
        uint        txFeeRatio;         //the fee ratio required by storeman group
        uint        bonusBlockNumber;   //the start block number for bonus calculation for storeman group
        address     initiator;			//the account for registering a storeman group which provide storeman group deposit
        uint        punishPercent;      //punish percent of deposit
    }
    
    mapping (uint=>CoinInfo) public mapCoinInfo;								//the information for storing different cross chain coin
    mapping (uint=>mapping(address => StoremanGroup)) public mapCoinSmgInfo; 	//the storeman group info
    mapping (uint=>mapping(address => bool)) public mapSmgWhiteList;    		//the white list 
    
    
    /// @notice event for initializing coin
    /// @param coin                 coin name id
    /// @param ratio                coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precise is 10000,the ratio is 880,0000
    /// @param defaultMinDeposit    the default min deposit
    /// @param htlcType             the coin support htlc trade type
    /// @param originalChainHtlc    the original chain address if the chain support contract address
    /// @param wanchainHtlcAddr     the htlc contract address on wanchain      
    /// @param wanchainTokenManagerAddr    the token manager address for coin on wanchain
    /// @param withdrawDelayTime    storeman unregister delay time
    event SmginitializeCoin(uint indexed coin,uint indexed ratio,uint indexed defaultMinDeposit, uint htlcType,bytes originalChainHtlc,address wanchainHtlcAddr,address wanchainTokenManagerAddr,uint withdrawDelayTime);
    
    /// @notice event for storeman register  
    /// @param smgAddress   storeman address
    /// @param smgOriginalChainAddress storeman group  original chain address
    /// @param coin       coin name
    /// @param wancoin      deposit wancoin number
    /// @param tokenQuota   corresponding token quota
    /// @param txFeeratio storeman fee ratio
    event SmgRegister(address indexed smgAddress,bytes smgOriginalChainAddress,uint indexed coin,uint wancoin, uint tokenQuota,uint txFeeratio);
    
    /// @notice event for storeman register 
    /// @param sender sender for bonus
    /// @param coin coin name
    /// @param wancoin deposit wancoin number
    event SmgDepositBonus(address indexed sender,uint indexed coin,uint wancoin);
    
    /// @notice event for storeman register  
    /// @param smgAddress   storeman address
    /// @param coin       coin name
    event SmgWhiteList(address indexed smgAddress,uint indexed coin);    
    
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
    /// @param withdrawTime the time for storeman applying unregister       
    event SmgWithdraw(address indexed smgAddress,uint indexed coin,uint indexed withdrawTime);
    
    
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
    
    /**
    *
    * MODIFIERS
    *
    */	    
    /// @notice modifier for checking if contract is initialized
    /// @param coin   coin name    
    modifier initialized(uint coin) {
        CoinInfo storage info = mapCoinInfo[coin];
        
        require(info.coin2WanRatio != 0);
        require(info.wanchainTokenManager != address(0));
        require(info.wanchainHtlc != address(0));
        
        if(info.htlcType == USE_CONTRACT) {
            require(info.originalChainHtlc.length != 0x0);
        } 
        
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
    
    
    /// @notice event for initializing coin
    /// @param coin                 coin name id
    /// @param ratio                coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precise is 10000,the ratio is 880,0000
    /// @param defaultMinDeposit    the default min deposit
    /// @param htlcType             the coin support htlc trade type
    /// @param originalChainHtlc    the original chain address if the chain support contract address
    /// @param wanchainHtlcAddr     the htlc contract address on wanchain      
    /// @param wanchainTokenManagerAddr    the token manager address for coin on wanchain
    /// @param withdrawDelayTime    storeman unregister delay time
    function initializeCoin(uint coin,
                            uint ratio,
                            uint defaultMinDeposit,
                            uint htlcType,
                            bytes originalChainHtlc,
                            address wanchainHtlcAddr,
                            address wanchainTokenManagerAddr,
                            uint withdrawDelayTime)
        public
        onlyOwner
        isHalted
    {
        require(mapCoinInfo[coin].coin2WanRatio == 0);
        require(ratio > 0);
        require(defaultMinDeposit >= 10 ether);
        require(htlcType==USE_CONTRACT || htlcType==USE_SCRIPT);
        require(wanchainHtlcAddr != address(0));
        require(wanchainTokenManagerAddr != address(0));
        require(withdrawDelayTime >= 3600*72);
        
        if(htlcType == USE_CONTRACT) {
            require(originalChainHtlc.length != 0);
        } 
        
        mapCoinInfo[coin] = CoinInfo(ratio,defaultMinDeposit,htlcType,originalChainHtlc,wanchainHtlcAddr,wanchainTokenManagerAddr,withdrawDelayTime,true,0,0,DEFAULT_BONUS_PERIOD_BLOCKS,DEFAULT_BONUS_RATIO_FOR_DEPOSIT);
        
        emit SmginitializeCoin(coin,ratio,defaultMinDeposit,htlcType,originalChainHtlc,wanchainHtlcAddr,wanchainTokenManagerAddr,withdrawDelayTime);	
    }  
     


    /// @notice function for setting the Exchange ration for mint token
    /// @param coin   coin name
    //  @param ratio  the Exchange ratio between ETH and WAN or between BTC ，such as ethereum 1 eth:880 WANs,the precise is 10000,the ratio is 880,0000
    function setWToken2WanRatio(uint coin,uint ratio)
        public
        onlyOwner
        isHalted
        initialized(coin)
    {
        require(ratio > 0);
        mapCoinInfo[coin].coin2WanRatio = ratio;
    }
    
    /// @notice function for setting bonus ratio
    /// @param coin   coin name
    /// @param ratio  the bonus ratio，the ratio need to muliple preicise,such as ratio is 2/1000,the value is 2/1000*10000
    function setSystemBonusRatio(uint coin,uint ratio)
        public
        onlyOwner
        isHalted
        initialized(coin)
    {
        require(ratio > 0);
        require(ratio <= DEFAULT_PRECISE);
        mapCoinInfo[coin].bonusRatio = ratio;
    }
        
    /// @notice function for setting the delay time from the time to 
    /// @param coin         coin id value
    //  @param delayTime    the delay time from time for applying unregister to 
    function setWithdrawDepositDelayTime(uint coin,uint delayTime)
        public
        onlyOwner
        isHalted
        initialized(coin)
    {
        require(delayTime > 0);
        mapCoinInfo[coin].withdrawDelayTime = delayTime;
    } 
    

    /// @notice function for setting current system BonusPeriod
    /// @param coin   coin name
    /// @param isSystemBonusPeriod  smg isSystemBonusPeriod,true controlled by foundation,false register freely
    /// @param systemBonusPeriod  Bonus Period in blocks
    function setSystemEnableBonus(uint coin, bool isSystemBonusPeriod,uint systemBonusPeriod)
        public
        onlyOwner
        isHalted
        initialized(coin)
    {
        CoinInfo storage coinInfo = mapCoinInfo[coin];
        if(isSystemBonusPeriod){
            coinInfo.startBonusBlk = block.number;
            coinInfo.bonusPeriodBlks = systemBonusPeriod>0?systemBonusPeriod:DEFAULT_BONUS_PERIOD_BLOCKS;
        } else {
            coinInfo.startBonusBlk = 0;
            coinInfo.bonusPeriodBlks = DEFAULT_BONUS_PERIOD_BLOCKS;
        }
    }
    
 
        
    /// @notice function for setting smg registering mode,control by foundation or registering freely
    /// @param coin   coin name
    //  @param enableUserWhiteList  smg register mode,true controlled by foundation with white list,false register freely
    function setSmgEnableUserWhiteList(uint coin,bool enableUserWhiteList)
        public
        onlyOwner
        isHalted
        initialized(coin)
    {
        mapCoinInfo[coin].useWhiteList = enableUserWhiteList;
    }
    

    /// @notice function for storeman register
    /// @param coin  coin name
    /// @param originalChainAddr  the htlc info on original chain
    /// @param txFeeRatio	the transaction fee required by storeman group	
    function storemanGroupRegister(uint coin,bytes originalChainAddr,uint txFeeRatio)
        public
        payable
        initialized(coin)
        notHalted
    {
        storemanGroupRegisterByDelegate(coin,msg.sender,originalChainAddr,txFeeRatio);
    }

    /// @notice function for storeman register by sender
    /// @param coin  coin name
    /// @param smgWanAddr  the storeman group register address	
    /// @param originalChainAddr  the htlc info on original chain
    /// @param txFeeRatio	the transaction fee required by storeman group	
  function storemanGroupRegisterByDelegate(uint coin,address smgWanAddr,bytes originalChainAddr,uint txFeeRatio)
        public
        payable
        initialized(coin)
        notHalted
    {
        
        require(msg.value >= mapCoinInfo[coin].defaultMinDeposit);
        require(originalChainAddr.length != 0);
	    require(txFeeRatio > 0);
	    require(smgWanAddr != address(0));
	    require(mapCoinSmgInfo[coin][smgWanAddr].bonusBlockNumber == 0);

        if (mapCoinInfo[coin].useWhiteList) {
		    assert(mapSmgWhiteList[coin][smgWanAddr]);
		    mapSmgWhiteList[coin][smgWanAddr] = false;
        }
        
        if (smgWanAddr == msg.sender){//if sender same with smgWanAddr,there are no initiator
            mapCoinSmgInfo[coin][smgWanAddr] = StoremanGroup(msg.value,originalChainAddr,0,txFeeRatio,block.number,address(0),0);
        } else {
		    mapCoinSmgInfo[coin][smgWanAddr] = StoremanGroup(msg.value,originalChainAddr,0,txFeeRatio,block.number,msg.sender,0);
        }
        
	    assert(deposit(coin,smgWanAddr));
          
        //send event
	    emit SmgRegister(smgWanAddr,originalChainAddr,coin,msg.value,getTokens(coin),txFeeRatio);
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
        require(mapCoinInfo[coin].startBonusBlk > 0);
        mapCoinInfo[coin].bonusTotal = mapCoinInfo[coin].bonusTotal.add(msg.value);

        //send event
        emit SmgDepositBonus(msg.sender,coin,msg.value);
    }       
    
    /// @notice function for setting smg white list by owner
    /// @param coin  coin name
	/// @param smgAddr  storeman group address for whitelist	
    function setSmgWhiteList(uint coin,address smgAddr)
        public
        initialized(coin)
        onlyOwner
    {
        require(smgAddr!=address(0));
        require(mapCoinInfo[coin].useWhiteList);        
        require(mapCoinSmgInfo[coin][smgAddr].bonusBlockNumber == 0);
        require(!mapSmgWhiteList[coin][smgAddr]);

        mapSmgWhiteList[coin][smgAddr] = true;
            
        //send event
        emit SmgWhiteList(smgAddr,coin);

    }    
    
    /// @notice function for getting store man eth address
    /// @param coin      coin name
    /// @param storemanAddr htlc contract address on wanchain chain    
    function getStoremanOriginalChainAddr(uint coin,address storemanAddr)
        public
        view
        returns (bytes)
    {
        return mapCoinSmgInfo[coin][storemanAddr].originalChainAddr;
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
        initialized(coin)
        notHalted
    {
        StoremanGroup storage info = mapCoinSmgInfo[coin][msg.sender];
        assert(info.bonusBlockNumber > 0);
        assert(info.unregisterApplyTime == 0);

        info.unregisterApplyTime = now;

        if ( mapCoinInfo[coin].startBonusBlk > 0 && info.punishPercent==0) {
		    claimSystemBonus(coin);
	    }

        assert(applyUnregister(coin));
        //send event
        emit SmgApplyUnRegister(msg.sender,coin,now);//event
    }
    
    
    /// @notice function for storeman withdraw deposit
    /// @param coin   coin name   
    function storemanGroupWithdrawDeposit(uint coin)
        public
        notHalted
        initialized(coin)
    {
        StoremanGroup storage smgInfo = mapCoinSmgInfo[coin][msg.sender];
        
        assert(now > smgInfo.unregisterApplyTime.add(mapCoinInfo[coin].withdrawDelayTime));
        assert(smgInfo.deposit > 0);
    
        assert(smgWithdrawAble(coin));
		
       uint restBalance = smgInfo.deposit;
       if (smgInfo.punishPercent > 0) {
             restBalance = restBalance.sub(restBalance.mul(smgInfo.punishPercent).div(100));
       }
		
       smgInfo.deposit = 0;   
       smgInfo.unregisterApplyTime = 0;
       smgInfo.originalChainAddr.length = 0;             
       smgInfo.bonusBlockNumber = 0;  
       smgInfo.punishPercent = 0;
        
       if (smgInfo.initiator != address(0)) {
            smgInfo.initiator.transfer(restBalance);
       } else {
            msg.sender.transfer(restBalance);	
       }
       
       smgInfo.initiator = address(0);
        
       //send event
       emit SmgWithdraw(msg.sender,coin,now);

    } 
    
    /// @notice function for storeman claiming system bonus
    /// @param coin   coin name   
    function storemanGroupClaimSystemBonus(uint coin)
        public
        notHalted
        initialized(coin)
    {
        StoremanGroup storage smgInfo = mapCoinSmgInfo[coin][msg.sender];
        assert(smgInfo.bonusBlockNumber != 0);
	    assert(smgInfo.unregisterApplyTime == 0);//can not claim after unregister applying
        claimSystemBonus(coin);
    }


    
    /// @notice function for storeman applying unregister
    /// @param coin   coin name
    /// @param punishPercent punished percent of deposit bonus
    function punishStoremanGroup(uint coin,address smgAddr,uint punishPercent)
        public
        initialized(coin)
        onlyOwner
    {
        require(punishPercent<=100);
        StoremanGroup storage info = mapCoinSmgInfo[coin][smgAddr];
        assert(info.deposit != 0);
        
        info.punishPercent = punishPercent;

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
    
    /// @notice function for setting smg register mode,control by foundation or register freely
    function transferDeposit()
        public
        onlyOwner
        isHalted
    {
        owner.transfer(this.balance);

    } 
    
////////////////private function///////////////////////////////////////////////
  function deposit(uint coin,address smgAddr)
        private
        returns (bool) 
    {
        address tokenManagerAddr = mapCoinInfo[coin].wanchainTokenManager;
        bytes4 methodId = bytes4(keccak256("registerStoremanGroup(address,uint256)"));
        
        uint tokenNumber = getTokens(coin);
        
	    return tokenManagerAddr.call(methodId,smgAddr,tokenNumber);
    }
    

    function applyUnregister(uint coin)
        private
        returns (bool) 
    {

        address tokenManagerAddr = mapCoinInfo[coin].wanchainTokenManager;
        bytes4 methodId = bytes4(keccak256("applyUnregistration(address)"));
        
        return tokenManagerAddr.call(methodId,msg.sender);
    }     
    
    function smgWithdrawAble(uint coin)
        private
        returns (bool) 
    {

        address tokenManagerAddr = mapCoinInfo[coin].wanchainTokenManager;
        bytes4 methodId = bytes4(keccak256("unregisterStoremanGroup(address)"));
        
        return tokenManagerAddr.call(methodId,msg.sender);
    } 
    
    function getTokens(uint coin)
        private
        view
        returns(uint)
    {
        uint calValue = msg.value;
        calValue = calValue.div(mapCoinInfo[coin].coin2WanRatio);
        return calValue.mul(DEFAULT_PRECISE);
    }

    function claimSystemBonus(uint coin)
        private
        notHalted
        initialized(coin)
    {
        StoremanGroup storage smgInfo = mapCoinSmgInfo[coin][msg.sender];
        CoinInfo storage coinInfo = mapCoinInfo[coin];
        if(smgInfo.punishPercent != 0 || coinInfo.startBonusBlk == 0){
          return;
        }

        uint blks = block.number.sub(smgInfo.bonusBlockNumber);
        if(blks >= coinInfo.bonusPeriodBlks && smgInfo.deposit > 0) {

            if (smgInfo.bonusBlockNumber<coinInfo.startBonusBlk){
                smgInfo.bonusBlockNumber = coinInfo.startBonusBlk;
            }


            uint cycles = blks.div(coinInfo.bonusPeriodBlks);

            smgInfo.bonusBlockNumber = smgInfo.bonusBlockNumber.add(cycles.mul(coinInfo.bonusPeriodBlks));

            uint  bonus = smgInfo.deposit.mul(coinInfo.bonusRatio).div(DEFAULT_PRECISE);
            bonus = bonus.mul(cycles);

            if(coinInfo.bonusTotal >= bonus && bonus > 0){
                  coinInfo.bonusTotal = coinInfo.bonusTotal.sub(bonus);
                  msg.sender.transfer(bonus);
                  SmgClaimSystemBonus(msg.sender, coin, bonus);
            } else {
                  SmgClaimSystemBonus(msg.sender, coin, 0);
            }

      }
    }
    
}  

