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

pragma solidity ^0.4.24;

import "../lib/SafeMath.sol";
import "../components/Halt.sol";
import "./StoremanGroupStorage.sol";

contract StoremanGroupDelegate is Halt, StoremanGroupStorage {
    using SafeMath for uint;

    /**
     *
     * EVENTS
     *
     */

    /// @notice                           event for storeman register
    /// @dev                              event for storeman register
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup PK
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    /// @param txFeeRatio                 storeman fee ratio
    event StoremanGroupRegistrationLogger(bytes tokenOrigAccount, bytes storemanGroup, uint wanDeposit, uint quota, uint txFeeRatio);

    /// @notice                           event for storeman register
    /// @dev                              event for storeman register
    /// @param storemanGroup              storemanGroup PK
    /// @param isEnable                   is enable or disable
    event SmgEnableWhiteListLogger(bytes storemanGroup, bool isEnable);

    /// @notice                           event for applying storeman group unregister
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup address
    /// @param applyTime                  the time for storeman applying unregister
    event StoremanGroupApplyUnRegistrationLogger(bytes tokenOrigAccount, bytes storemanGroup, uint applyTime);

    /// @notice                           event for storeman group withdraw deposit
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup PK
    /// @param actualReturn               the time for storeman applying unregister
    /// @param deposit                    deposit in the first place
    event StoremanGroupWithdrawLogger(bytes tokenOrigAccount, bytes storemanGroup, uint actualReturn, uint deposit);

    /// @notice                           event for storeman register
    /// @dev                              event for storeman register
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup PK
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    event StoremanGroupAppendDepositLogger(bytes tokenOrigAccount, bytes storemanGroup, uint wanDeposit, uint quota);

    modifier onlyValidAccount(bytes account) {
        require(account.length != 0, "Account is null");
        _;
    }

    modifier onlyValidPK(bytes pk) {
        require(pk.length != 0, "PK is null");
        _;
    }

    /// @notice              Set tokenManager, quotaLedger and signVerifier address
    /// @param tm            token manager instance address
    /// @param htlc          htlc(including quotaLedger) instance address
    function setDependence(address tm, address htlc)
        external
        onlyOwner
    {
        require(tm != address(0), "Invalide tokenManager address");
        require(htlc != address(0), "Invalide htlc address");
        tokenManager = ITokenManager(tm);
        quotaLedger = IHTLC(htlc);
    }

    /// @notice                  enable or disable storeman group white list by owner
    /// @param isEnable          is enable
    function enableSmgWhiteList(bool isEnable)
        external
        onlyOwner
    {
        isWhiteListEnabled = isEnable;
    }

    /// @notice                  function for setting smg white list by owner
    /// @param storemanGroup     storemanGroup PK for whitelist
    /// @param isEnable          is enable
    function setSmgWhiteList(bytes storemanGroup, bool isEnable)
        external
        onlyOwner
        onlyValidPK(storemanGroup)
    {
        require(isWhiteListEnabled, "White list is disabled");
        require(mapSmgWhiteList[storemanGroup] != isEnable, "Duplicate set");
        if (isEnable) {
            mapSmgWhiteList[storemanGroup] = true;
        } else {
            delete mapSmgWhiteList[storemanGroup];
        }

        emit SmgEnableWhiteListLogger(storemanGroup, isEnable);
    }

    /// @notice                  function for storeman register by sender this method should be
    ///                          invoked by a storemanGroup registration proxy or wanchain foundation
    /// @param tokenOrigAccount  token account of original chain
    /// @param storemanGroup     the storeman group PK address
    /// @param txFeeRatio        the transaction fee required by storeman group
    function storemanGroupRegisterByDelegate(bytes tokenOrigAccount, bytes storemanGroup, uint txFeeRatio)
        external
        payable
        notHalted
        onlyValidAccount(tokenOrigAccount)
        onlyValidPK(storemanGroup)
    {
        require(txFeeRatio > 0, "Invalid txFeeRatio");
        require(storemanGroupMap[tokenOrigAccount][storemanGroup].deposit == 0, "Duplicate register");

        uint8 decimals;
        uint token2WanRatio;
        uint minDeposit;
        uint defaultPricise;
        (,,decimals,,token2WanRatio,minDeposit,,defaultPricise) = tokenManager.getTokenInfo(tokenOrigAccount);
        require(minDeposit > 0, "Token not exist");
        require(msg.value >= minDeposit, "Value must be greater than minDeposit");
        if (isWhiteListEnabled) {
            require(mapSmgWhiteList[storemanGroup], "Not in white list");
        }

        uint quota = (msg.value).mul(defaultPricise).div(token2WanRatio).mul(10**uint(decimals)).div(1 ether);
        quotaLedger.addStoremanGroup(tokenOrigAccount, storemanGroup, quota, txFeeRatio);
        storemanGroupMap[tokenOrigAccount][storemanGroup] = StoremanGroup(msg.value, 0, txFeeRatio, block.number, msg.sender);

        emit StoremanGroupRegistrationLogger(tokenOrigAccount, storemanGroup, msg.value, quota, txFeeRatio);
    }

    /// @notice                           apply unregistration through a proxy
    /// @dev                              apply unregistration through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              PK of storemanGroup
    function smgApplyUnregisterByDelegate(bytes tokenOrigAccount, bytes storemanGroup)
        external
        notHalted
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(smg.initiator == msg.sender, "Sender must be initiator");
        require(smg.unregisterApplyTime == 0, "Duplicate unregister");
        smg.unregisterApplyTime = now;
        quotaLedger.deactivateStoremanGroup(tokenOrigAccount, storemanGroup);

        emit StoremanGroupApplyUnRegistrationLogger(tokenOrigAccount, storemanGroup, now);
    }

    /// @notice                           withdraw deposit through a proxy
    /// @dev                              withdraw deposit through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup PK
    function smgWithdrawDepositByDelegate(bytes tokenOrigAccount, bytes storemanGroup)
        external
        notHalted
    {
        StoremanGroup memory smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(smg.initiator == msg.sender, "Sender must be initiator");
        uint withdrawDelayTime;
        (,,,,,,withdrawDelayTime,) = tokenManager.getTokenInfo(tokenOrigAccount);
        require(now > smg.unregisterApplyTime.add(withdrawDelayTime), "Must wait until delay time");
        quotaLedger.delStoremanGroup(tokenOrigAccount, storemanGroup);
        smg.initiator.transfer(smg.deposit);

        emit StoremanGroupWithdrawLogger(tokenOrigAccount, storemanGroup, smg.deposit, smg.deposit);

        delete storemanGroupMap[tokenOrigAccount][storemanGroup];
    }

    /// @notice                           append deposit through a proxy
    /// @dev                              append deposit through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup PK
    function smgAppendDepositByDelegate(bytes tokenOrigAccount, bytes storemanGroup)
        external
        payable
        notHalted
        onlyValidAccount(tokenOrigAccount)
        onlyValidPK(storemanGroup)
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(smg.deposit > 0, "Not registered");
        require(smg.initiator == msg.sender, "Sender must be initiator");

        uint8 decimals;
        uint token2WanRatio;
        uint defaultPricise;
        (,,decimals,,token2WanRatio,,,defaultPricise) = tokenManager.getTokenInfo(tokenOrigAccount);
        uint quota = (msg.value).mul(defaultPricise).div(token2WanRatio).mul(10**uint(decimals)).div(1 ether);
        require(quota > 0, "Value too small");
        quotaLedger.smgAppendQuota(tokenOrigAccount, storemanGroup, quota);
        // TODO: notify bonus contract
        smg.deposit = smg.deposit.add(quota);
        emit StoremanGroupAppendDepositLogger(tokenOrigAccount, storemanGroup, msg.value, quota);
    }

    /// @notice fallback function
    function () public payable {
        revert("Not support");
    }
}