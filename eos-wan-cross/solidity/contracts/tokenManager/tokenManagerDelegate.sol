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

/**
 * Math operations with safety checks
 */

import "../components/Owned.sol";
import "./StorageState.sol";
import "../lib/SafeMath.sol";

contract tokenManagerDelegate is Owned, StorageState {
    using SafeMath for uint;

    /************************************************************
     **
     ** EVENTS
     **
     ************************************************************/

    /// @notice                      event for token registration
    /// @dev                         event for token registration
    /// @param tokenOrigAccount      token address of original chain
    /// @param tokenWanAddr          a wanchain address of supported ERC20 token
    /// @param ratio                 coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precision is 10000,the ratio is 880,0000
    /// @param minDeposit            the default min deposit
    /// @param origHtlc              htlc contract instance account of original blockchain chain
    /// @param wanHtlc               htlc contract instance address of wanchain
    /// @param withdrawDelayTime     storeman un-register delay time
    /// @param hashAlgorithms        hash algorithms to calculate xHash
    /// @param tokenHash             keccak256 hash of token's name, symbol and decimals
    event TokenAddedLogger(bytes tokenOrigAccount, address indexed tokenWanAddr, uint indexed ratio, uint minDeposit,
                           bytes origHtlc, address wanHtlc, uint withdrawDelayTime, uint hashAlgorithms, bytes32 tokenHash);


    /// @notice                      event for update a specific token's status in tokenRegWhiteList
    /// @dev                         event for update a specific token's status in tokenRegWhiteList
    /// @param tokenOrigAccount      token address of original chain
    /// @param ratio                 coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precision is 10000,the ratio is 880,0000
    /// @param minDeposit            the default minimum deposit
    /// @param name                  tokenOrigAccount name to be used in wanchain
    /// @param symbol                tokenOrigAccount symbol to reused in wanchain
    /// @param decimals              tokenOrigAccount decimals
    /// @param hashAlgorithms        hash algorithms to calculate xHash
    event CandidateAddedLogger(bytes tokenOrigAccount, uint indexed ratio, uint indexed minDeposit, uint withdrawDelayTime,
                               bytes name, bytes symbol, uint8 decimals, uint hashAlgorithms);

    /// @notice                      check if a tokenOrigAccount has been supported
    /// @dev                         check if a tokenOrigAccount has been supported
    /// @param tokenOrigAccount      tokenOrigAccount to be added
    function isTokenRegistered(bytes tokenOrigAccount)
        public
        view
        returns (bool)
    {
        TokenInfo storage tokenInfo = mapTokenInfo[tokenInfoKeyMap[tokenOrigAccount]];

        return tokenInfo.tokenWanAddr != address(0) && tokenInfo.token2WanRatio != 0;
    }


    /// @notice                      add a supported token
    /// @dev                         add a supported token
    /// @param tokenOrigAccount      token account of original chain
    /// @param htlcOrigAccount       htlc account of original chain
    function addToken(bytes tokenOrigAccount, uint ratio, uint minDeposit, uint withdrawDelayTime, bytes name, bytes symbol, uint8 decimals)
        public
    {
        // Security check
        require(!isControlled || msg.sender == owner, "Not owner");    //Not controlled or the sender is owner

        require(tokenOrigAccount.length != 0, "Original token account is null");
        require(ratio > 0, "Ratio is null");
        require(minDeposit >= MIN_DEPOSIT, "Deposit amount is not enough");
        require(withdrawDelayTime >= MIN_WITHDRAW_WINDOW, "Delay time for withdraw is too short");
        require(name.length != 0, "Name is null");
        require(symbol.length != 0, "Symbol is null");
        require(decimals != uint(0), "Decimal is null");

        // second round validation
        bytes32 key = keccak256(tokenOrigAccount, candidateInfo.name, candidateInfo.symbol, candidateInfo.decimals);

        // generate a wtoken contract instance
        address tokenInst = new WanToken(quotaLedger, string(candidateInfo.name), string(candidateInfo.symbol), candidateInfo.decimals);

        // create a new record
        mapTokenInfo[tokenOrigAccount] = TokenInfo(tokenOrigAccount, tokenInst, candidateInfo.token2WanRatio, candidateInfo.minDeposit, candidateInfo.withdrawDelayTime, true, 0, 0, DEFAULT_BONUS_PERIOD_BLOCKS, DEFAULT_BONUS_RATIO_FOR_DEPOSIT, candidateInfo.hashAlgorithms, htlcOrigAccount);
        // update token hash key
        tokenInfoKeyMap[tokenOrigAccount] = key;
        
        // fire event
        emit TokenAddedLogger(tokenOrigAccount, tokenInst, candidateInfo.token2WanRatio, candidateInfo.minDeposit, htlcOrigAccount, wanHtlc, candidateInfo.withdrawDelayTime, candidateInfo.hashAlgorithms, key);
    }

}