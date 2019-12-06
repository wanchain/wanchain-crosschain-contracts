/*

  Copyright 2019 Wanchain Foundation.

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
//

pragma solidity ^0.4.24;

import "../components/BasicStorage.sol";

contract TokenManagerStorage is BasicStorage {
    /************************************************************
     **
     ** VARIABLES
     **
     ************************************************************/

    /// a period of block numbers in which bonus is calculated and rewarded to storeman groups
    uint public constant DEFAULT_BONUS_PERIOD_BLOCKS = 6 * 60 * 24;
    /// default bonus ratio, in percentage of deposit
    uint public constant DEFAULT_BONUS_RATIO_FOR_DEPOSIT = 20;
    /// default precision
    uint public constant DEFAULT_PRECISE = 10000;
    /// a time period after which a storeman group could confirm unregister
    uint public constant MIN_WITHDRAW_WINDOW = 60 * 60 * 72;
    /// default minimum deposit to register a storeman group
    uint public constant MIN_DEPOSIT = 10 ether;

    /// a map from origin chain token account to registered-token information
    mapping(bytes => TokenInfo) internal mapTokenInfo;

    /// only HTLC contract address can mint and burn token
    address public htlcAddr;

    struct TokenInfo {
        // bytes              tokenOrigAddr;       /// token account on original chain
        bytes              name;                /// WRC20 token name on wanchain mainnet
        bytes              symbol;              /// WRC20 token symbol on wanchain mainnet
        uint8              decimals;            /// WRC20 token decimals on wanchain mainnet
        address            tokenWanAddr;        /// a wanchain address of supported ERC20 token
        uint               token2WanRatio;      /// 1 ERC20 token valuated in wan coins
        uint               minDeposit;          /// the minimum deposit for a valid storeman group
        uint               withdrawDelayTime;   /// the delay time for withdrawing deposit after storeman group applied un-registration
    }

}