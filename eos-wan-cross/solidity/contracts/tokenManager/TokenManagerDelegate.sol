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
import "./TokenManagerStorage.sol";
import "./WanToken.sol";
import "./IWanToken.sol";

contract TokenManagerDelegate is TokenManagerStorage, Owned {
    /************************************************************
     **
     ** EVENTS
     **
     ************************************************************/

    /// @notice                      event for token registration
    /// @dev                         event for token registration
    /// @param tokenOrigAccount      token address of original chain
    /// @param ratio                 coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precision is 10000,the ratio is 880,0000
    /// @param minDeposit            the default min deposit
    /// @param withdrawDelayTime     the delay time for withdrawing deposit after storeman group applied un-registration
    /// @param tokenWanAddr          a wanchain address of supported ERC20 token
    /// @param name                  WRC20 token name on wanchain mainnet
    /// @param symbol                WRC20 token symbol on wanchain mainnet
    /// @param decimal               WRC20 token decimals on wanchain mainnet
    event TokenAddedLogger(bytes tokenOrigAccount,  uint ratio, uint minDeposit, uint withdrawDelayTime,
                           bytes name, bytes symbol, uint8 decimal, address tokenWanAddr);

    /// @notice                      event for token registration update
    /// @dev                         event for token registration update
    /// @param tokenOrigAccount      token address of original chain
    /// @param ratio                 coin Exchange ratio,such as ethereum 1 eth:880 WANs,the precision is 10000,the ratio is 880,0000
    /// @param minDeposit            the default min deposit
    /// @param withdrawDelayTime     the delay time for withdrawing deposit after storeman group applied un-registration
    /// @param name                  WRC20 token name on wanchain mainnet
    /// @param symbol                WRC20 token symbol on wanchain mainnet
    /// @param decimal               WRC20 token decimals on wanchain mainnet
    /// @param tokenWanAddr          a wanchain address of supported ERC20 token
    event TokenUpdatedLogger(bytes tokenOrigAccount,  uint ratio, uint minDeposit, uint withdrawDelayTime,
                             bytes name, bytes symbol, uint8 decimal, address tokenWanAddr);

    event TokenRemovedLogger(bytes tokenOrigAccount);

    modifier onlyValidAccount(bytes account) {
        require(account.length != 0, "Account is null");
        _;
    }

    modifier onlyHTLC {
        require(msg.sender == htlcAddr, "Sender is not allowed");
        _;
    }

    modifier onlyMeaningfulValue(uint value) {
        require(value > 0, "Value is null");
        _;
    }

    /// @notice If WAN coin is sent to this address, send it back.
    /// @dev If WAN coin is sent to this address, send it back.
    function() external payable {
        revert("Not support");
    }

    /// @notice                      check if a tokenOrigAccount has been supported
    /// @dev                         check if a tokenOrigAccount has been supported
    /// @param tokenOrigAccount      tokenOrigAccount to be added
    function isTokenRegistered(bytes tokenOrigAccount)
        external
        view
        returns(bool)
    {
        TokenInfo storage tokenInfo = mapTokenInfo[tokenOrigAccount];

        return tokenInfo.tokenWanAddr != address(0) && tokenInfo.token2WanRatio != 0;
    }

    /// @notice                      add a supported token
    /// @dev                         add a supported token
    /// @param tokenOrigAccount      token account of original chain
    /// @param token2WanRatio        1 ERC20 token valuated in wan coins, the excharge rate is token2WanRatio / DEFAULT_PRECISE
    /// @param minDeposit            the minimum deposit for a valid storeman group
    /// @param withdrawDelayTime     the delay time for withdrawing deposit after storeman group applied un-registration
    /// @param name                  WRC20 token name on wanchain mainnet
    /// @param symbol                WRC20 token symbol on wanchain mainnet
    /// @param decimals              WRC20 token decimals on wanchain mainnet
    function addToken(
        bytes tokenOrigAccount,
        uint  token2WanRatio,
        uint  minDeposit,
        uint  withdrawDelayTime,
        bytes name,
        bytes symbol,
        uint8 decimals
    )
        external
        onlyOwner
        onlyValidAccount(tokenOrigAccount)
    {
        require(token2WanRatio > 0, "Ratio is null");
        require(minDeposit >= MIN_DEPOSIT, "Deposit amount is not enough");
        require(withdrawDelayTime >= MIN_WITHDRAW_WINDOW, "Delay time for withdraw is too short");
        require(name.length != 0, "Name is null");
        require(symbol.length != 0, "Symbol is null");
        require(mapTokenInfo[tokenOrigAccount].tokenWanAddr == address(0), "Token is exist");

        // generate a w-token contract instance
        address tokenInst = new WanToken(string(name), string(symbol), decimals);

        // create a new record
        mapTokenInfo[tokenOrigAccount] = TokenInfo(name, symbol, decimals,
                                                   tokenInst, token2WanRatio, minDeposit, withdrawDelayTime);

        // fire event
        emit TokenAddedLogger(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, name, symbol, decimals, tokenInst);
    }

    /// @notice                      remove a supported token
    /// @dev                         remove a supported token
    /// @param tokenOrigAccount      token account of original chain
    function removeToken(bytes tokenOrigAccount)
        external
        onlyOwner
        onlyValidAccount(tokenOrigAccount)
    {
        delete mapTokenInfo[tokenOrigAccount];
        emit TokenRemovedLogger(tokenOrigAccount);
    }

    /// @notice                      update a supported token
    /// @dev                         update a supported token
    /// @param tokenOrigAccount      token account of original chain
    /// @param token2WanRatio        1 ERC20 token valuated in wan coins, the excharge rate is token2WanRatio / DEFAULT_PRECISE
    /// @param minDeposit            the minimum deposit for a valid storeman group
    /// @param withdrawDelayTime     the delay time for withdrawing deposit after storeman group applied un-registration
    /// @param name                  WRC20 token name on wanchain mainnet
    /// @param symbol                WRC20 token symbol on wanchain mainnet
    /// @param decimals              WRC20 token decimals on wanchain mainnet
    /// @param tokenWanAddr          a wanchain address of supported ERC20 token
    function updateToken(
        bytes tokenOrigAccount,
        uint  token2WanRatio,
        uint  minDeposit,
        uint  withdrawDelayTime,
        bytes name,
        bytes symbol,
        uint8 decimals,
        address tokenWanAddr
    )
        external
        onlyOwner
        onlyValidAccount(tokenOrigAccount)
    {
        require(token2WanRatio > 0, "Ratio is null");
        require(minDeposit >= MIN_DEPOSIT, "Deposit amount is not enough");
        require(withdrawDelayTime >= MIN_WITHDRAW_WINDOW, "Delay time for withdraw is too short");
        require(name.length != 0, "Name is null");
        require(symbol.length != 0, "Symbol is null");
        require(tokenWanAddr != address(0), "Token address on Wanchain is null");

        // create a new record
        mapTokenInfo[tokenOrigAccount] = TokenInfo(name, symbol, decimals,
                                                   tokenWanAddr, token2WanRatio, minDeposit, withdrawDelayTime);

        // fire event
        emit TokenUpdatedLogger(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, name, symbol, decimals, tokenWanAddr);
    }

    /// @notice                      get a supported token info
    /// @dev                         get a supported token info
    /// @param tokenOrigAccount      token account of original chain
    function getTokenInfo(bytes tokenOrigAccount)
        external
        view
        onlyValidAccount(tokenOrigAccount)
        returns(bytes, bytes, uint8, address, uint, uint, uint, uint)
    {
        TokenInfo storage token = mapTokenInfo[tokenOrigAccount];
        return (token.name, token.symbol, token.decimals, token.tokenWanAddr,
                token.token2WanRatio, token.minDeposit, token.withdrawDelayTime, DEFAULT_PRECISE);
    }

    /// @notice                      mint WRC20 token for a supported ERC20 token
    /// @dev                         mint WRC20 token for a supported ERC20 token
    /// @param tokenOrigAccount      token account of original chain
    /// @param recipient             account minted WRC20 for
    /// @param value                 minted WRC20 amount
    function mintToken(bytes tokenOrigAccount, address recipient, uint value)
        external
        onlyHTLC
        onlyValidAccount(tokenOrigAccount)
        onlyMeaningfulValue(value)
    {
        address instance = mapTokenInfo[tokenOrigAccount].tokenWanAddr;

        // needs to pass recipient address
        IWanToken(instance).mint(recipient, value);
    }

    /// @notice                      burn WRC20 token in HTLC for a supported ERC20 token
    /// @dev                         burn WRC20 token in HTLC for a supported ERC20 token
    /// @param tokenOrigAccount      token account of original chain
    /// @param value                 burned WRC20 amount
    function burnToken(bytes tokenOrigAccount, uint value)
        external
        onlyHTLC
        onlyValidAccount(tokenOrigAccount)
        onlyMeaningfulValue(value)
    {
        address instance = mapTokenInfo[tokenOrigAccount].tokenWanAddr;
        IWanToken(instance).burn(htlcAddr, value);
    }

    /// @notice                      set HTLC address
    /// @dev                         set HTLC address
    /// @param addr                  HTLC address
    function setHtlcAddr(address addr)
        external
        onlyOwner
    {
        require(addr != address(0), "HTLC address is null");
        htlcAddr = addr;
    }
}