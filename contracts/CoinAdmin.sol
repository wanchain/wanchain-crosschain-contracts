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

contract CoinAdmin is Halt {

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
        uint    defaultMinDeposit;  //2 the minimum deposit for storeman group
        uint    htlcType;			//3 the htlc type,possible value USE_CONTRACT,USE_SCRIPT
        bytes   originalChainHtlc;  //4 the original chain htlc address if use contract
        address wanchainHtlc;       //5 the htlc address on wanchain
        address wanchainTokenManager; //6 the token administrator contract address
        uint    withdrawDelayTime;  //7 the delay time for withdrawing deposit after storeman group apply exit
        bool    useWhiteList;       //8 the flag for checking if the storeman group address is in white list if the storeman register is controlled
        uint    startBonusBlk;      //9 the begin blk for bonus
        uint    bonusTotal;			//10 the total bonus provided by system
        uint    bonusPeriodBlks;    //11 the bonus period
        uint    bonusRatio;         //12 the bonus ratio
    }

    mapping (uint=>CoinInfo) public mapCoinInfo;								//the information for storing different cross chain coin
    mapping (uint=>address)  public mapCoinPunishReceiver;						//the information for storing different cross chain coin

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
    /// @param sender sender for bonus
    /// @param coin coin name
    /// @param wancoin deposit wancoin number
    event SmgDepositBonus(address indexed sender,uint indexed coin,uint wancoin);
    /**
    *
    * MODIFIERS
    *
    */
    /// @notice modifier for checking if contract is initialized
    /// @param coin   coin name
    modifier initialized(uint coin) {
        require(isInitialized(coin));

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

    /// @notice set     reciever address for the punish deposit to storeman group
    /// @param  addr    the reciever address
    function setCoinPunishReciever(uint coin,address addr)
        public
        onlyOwner
        isHalted
    {
        require(addr != address(0));
        mapCoinPunishReceiver[coin] = addr;
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


    /// @notice modifier for checking if contract is initialized
    /// @param coin   coin name
    function isInitialized(uint coin)
        public
        view
        returns (bool)

    {
        CoinInfo storage info = mapCoinInfo[coin];

        require(info.coin2WanRatio != 0);
        require(info.wanchainTokenManager != address(0));
        require(info.wanchainHtlc != address(0));
        require(mapCoinPunishReceiver[coin] != address(0));

        if(info.htlcType == USE_CONTRACT) {
            require(info.originalChainHtlc.length != 0x0);
        }

       return true;
    }


}