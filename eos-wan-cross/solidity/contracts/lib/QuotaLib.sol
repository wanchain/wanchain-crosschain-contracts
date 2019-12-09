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

import "./SafeMath.sol";

library QuotaLib {
    using SafeMath for uint;

    struct Quota {
        /// storemanGroup's total quota
        uint _quota;
        /// txFeeRatio
        uint _ratio;
        /// amount of original token to be received, equals to amount of WAN token to be minted
        uint _receivable;
        /// amount of WAN token to be burnt
        uint _payable;
        /// amount of original token received, equals to amount of WAN token been minted
        uint _debt;
        /// is active
        bool _active;
    }

    struct Data {
        /// @notice a map from storemanGroup PK to its quota information. token => storeman => quota
        mapping(bytes => mapping(bytes => Quota)) mapQuota;
    }

    /// @notice                 test if a value provided is meaningless
    /// @dev                    test if a value provided is meaningless
    /// @param value            given value to be handled
    modifier onlyMeaningfulValue(uint value) {
        require(value > 0, "Value is null");
        _;
    }

    /// @notice                 function for get quota
    /// @param tokenOrigAccount token account of original chain
    /// @param storemanGroupPK  storemanGroup PK
    function getQuota(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns (uint, uint, uint, uint, uint, bool)
    {
        Quota storage quota = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return (quota._quota, quota._ratio, quota._receivable, quota._payable, quota._debt, quota._active);
    }


    /// @notice                 set storeman group's quota
    /// @param tokenOrigAccount token account of original chain
    /// @param storemanGroupPK  storemanGroup PK
    /// @param quota            a storemanGroup's quota
    function addStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint quota, uint txFeeRatio)
        external
        onlyMeaningfulValue(quota)
    {
        require(tokenOrigAccount.length != 0 && storemanGroupPK.length != 0, "Parameter is invalid");
        require(!isExist(self, tokenOrigAccount, storemanGroupPK), "PK already exists");
        self.mapQuota[tokenOrigAccount][storemanGroupPK] = Quota(quota, txFeeRatio, 0, 0, 0, true);
    }

    function deactivateStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
    {
        require(tokenOrigAccount.length != 0 && storemanGroupPK.length != 0, "Parameter is invalid");
        require(isActive(self, tokenOrigAccount, storemanGroupPK), "Storeman group is active");
        self.mapQuota[tokenOrigAccount][storemanGroupPK]._active = false;
    }

    function delStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
    {
        require(notActive(self, tokenOrigAccount, storemanGroupPK), "storeman group is active");
        require(isDebtPaidOff(self, tokenOrigAccount, storemanGroupPK), "Storeman should pay off its debt");

        delete self.mapQuota[tokenOrigAccount][storemanGroupPK];
    }

    function updateStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint quota)
        external
        onlyMeaningfulValue(quota)
    {
        require(tokenOrigAccount.length != 0 && storemanGroupPK.length != 0, "Parameter is invalid");
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");
        self.mapQuota[tokenOrigAccount][storemanGroupPK]._quota = quota;
    }

    /// @notice                 frozen WRC token quota
    /// @dev                    frozen WRC token quota
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  handler PK
    /// @param value            amount of WRC20 quota to be frozen
    /// @return                 true if successful
    function inLock(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure an active storemanGroup is provided to handle transactions
        require(isActive(self, tokenOrigAccount, storemanGroupPK), "PK is not active");

        /// Make sure enough inbound quota available
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        require(quotaInfo._quota.sub(quotaInfo._receivable.add(quotaInfo._debt)) >= value, "Quota is not enough");

        /// Increase receivable
        quotaInfo._receivable = quotaInfo._receivable.add(value);
    }

    /// @notice                 revoke WRC20 quota
    /// @dev                    revoke WRC20 quota
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  handler PK
    /// @param value            amount of WRC20 quota to be locked
    /// @return                 true if successful
    function inRevoke(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a valid storeman provided
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");

        Quota storage quota = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Credit receivable, double-check receivable is no less than value to be unlocked
        quota._receivable = quota._receivable.sub(value);
    }

    /// @notice                 mint WRC token or payoff storemanGroup debt
    /// @dev                    mint WRC20 token or payoff storemanGroup debt
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  handler PK
    /// @param value            amount of WRC20 token to be minted
    /// @return                 success of token mint
    function inRedeem(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a legal storemanGroup provided
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");

        Quota storage _q = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        _q._receivable = _q._receivable.sub(value);
        _q._debt = _q._debt.add(value);
    }

    /// @notice                 lock WRC20 token and initiate an outbound transaction
    /// @dev                    lock WRC20 token and initiate an outbound transaction
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  outbound storemanGroup handler PK
    /// @param value            amount of WRC20 token to be locked
    /// @return                 success of token locking
    function outLock(Data storage self, uint value, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a valid storemanGroup and a legit initiator provided
        require(isActive(self, tokenOrigAccount, storemanGroupPK), "PK is not active");

        Quota storage quota = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Make sure it has enough outboundQuota
        require(quota._debt.sub(quota._payable) >= value, "Value is invalid");

        /// Adjust quota record
        quota._payable = quota._payable.add(value);
    }

    /// @notice                 unlock WRC20 token
    /// @dev                    unlock WRC20 token
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  storemanGroup handler PK
    /// @param value            amount of token to be unlocked
    /// @return                 success of token unlocking
    function outRevoke(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");

        /// Make sure it has enough quota for a token unlocking
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        quotaInfo._payable = quotaInfo._payable.sub(value);
    }

    /// @notice                 burn WRC20 token
    /// @dev                    burn WRC20 token
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  cross-chain transaction handler PK
    /// @param value            amount of WRC20 token to be burnt
    /// @return                 success of burn token
    function outRedeem(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        quotaInfo._debt = quotaInfo._debt.sub(value);
        quotaInfo._payable = quotaInfo._payable.sub(value);
    }

    /// @notice                 transfer debt from src to dst
    /// @dev                    frozen WRC-20 token quota
    /// @param tokenOrigAccount account of token supported
    /// @param srcStoremanGroupPK  src handler PK
    /// @param dstStoremanGroupPK  dst handler PK
    /// @param value            amount of debt to be frozen
    /// @return                 true if successful
    function debtLock(Data storage self, bytes tokenOrigAccount, uint value, bytes srcStoremanGroupPK, bytes dstStoremanGroupPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure an active storemanGroup is provided to handle transactions
        require(notActive(self, tokenOrigAccount, srcStoremanGroupPK), "PK is active");
        require(isActive(self, tokenOrigAccount, dstStoremanGroupPK), "PK is not active");

        /// src: there's no processing tx, and have enough debt!
        Quota storage src = self.mapQuota[tokenOrigAccount][srcStoremanGroupPK];
        require(src._receivable == uint(0) && src._payable == uint(0) && src._debt >= value, "PK is not allowed to repay debt");

        /// dst: has enough quota
        Quota storage dst = self.mapQuota[tokenOrigAccount][dstStoremanGroupPK];
        require(dst._quota.sub(dst._receivable.add(dst._debt)) >= value, "Quota is not enough");

        dst._receivable = dst._receivable.add(value);
        src._payable = src._payable.add(value);
    }

    /// @notice                 mint WRC-20 token or payoff storemanGroup debt
    /// @dev                    mint WRC-20 token or payoff storemanGroup debt
    /// @param tokenOrigAccount account of token supported
    /// @param dstStoremanPK    dst PK
    /// @param srcStoremanPK    src PK
    /// @param value            amount of WRC-20 token to be minted
    function debtRedeem(Data storage self, bytes tokenOrigAccount, uint value, bytes srcStoremanPK, bytes dstStoremanPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a legit storemanGroup provided
        require(isExist(self, tokenOrigAccount, dstStoremanPK), "PK doesn't exist");
        require(notActive(self, tokenOrigAccount, srcStoremanPK), "PK is active");

        Quota storage dst = self.mapQuota[tokenOrigAccount][dstStoremanPK];
        Quota storage src = self.mapQuota[tokenOrigAccount][srcStoremanPK];

        /// Adjust quota record
        dst._receivable = dst._receivable.sub(value);
        dst._debt = dst._debt.add(value);

        src._payable = src._payable.sub(value);
        src._debt = src._debt.sub(value);
    }

    /// @notice                 revoke WRC-20 quota
    /// @dev                    revoke WRC-20 quota
    /// @param tokenOrigAccount account of token supported
    /// @param dstStoremanPK    dst PK
    /// @param srcStoremanPK    src PK
    /// @param value            amount of WRC-20 quota to be locked
    function debtRevoke(Data storage self, bytes tokenOrigAccount, uint value, bytes srcStoremanPK, bytes dstStoremanPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a valid storeman provided
        require(isExist(self, tokenOrigAccount, dstStoremanPK), "PK doesn't exist");
        require(notActive(self, tokenOrigAccount, srcStoremanPK), "PK is active");

        Quota storage dst = self.mapQuota[tokenOrigAccount][dstStoremanPK];
        Quota storage src = self.mapQuota[tokenOrigAccount][srcStoremanPK];

        /// Credit receivable, double-check receivable is no less than value to be unlocked
        dst._receivable = dst._receivable.sub(value);
        src._payable = src._payable.sub(value);
    }

    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  cross-chain transaction handler PK
    function isExist(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns (bool)
    {
        return self.mapQuota[tokenOrigAccount][storemanGroupPK]._quota != uint(0);
    }

    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  cross-chain transaction handler PK
    function isActive(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns (bool)
    {
        Quota storage q = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return q._quota != uint(0) && q._active;
    }

    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  cross-chain transaction handler PK
    function notActive(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns (bool)
    {
        Quota storage q = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return q._quota != uint(0) && !q._active;
    }

    /// @notice                 query storemanGroup quota detail
    /// @dev                    query storemanGroup detail
    /// @param  tokenOrigAccount  account of token supported
    /// @param  storemanGroupPK Pk of storemanGroup to be queried
    /// @return quota           total quota of this storemanGroup in ETH/WRC20
    /// @return inboundQuota    inbound cross-chain transaction quota of this storemanGroup in ETH/WRC20
    /// @return outboundQuota   outbound cross-chain transaction quota of this storemanGroup in ETH/WRC20
    /// @return receivable      amount of WRC20 to be minted through this storemanGroup
    /// @return payable         amount of WRC20 to be burnt through this storemanGroup
    /// @return debt            amount of WRC20 been minted through this storemanGroup
    function queryQuotaInfo(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns (uint, uint, uint, uint, uint, uint)
    {
        if (!isExist(self, tokenOrigAccount, storemanGroupPK)) {
            return (0, 0, 0, 0, 0, 0);
        }

        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        uint inboundQuota = quotaInfo._quota.sub(quotaInfo._receivable.add(quotaInfo._debt));
        uint outboundQuota = quotaInfo._debt.sub(quotaInfo._payable);

        return (quotaInfo._quota, inboundQuota, outboundQuota, quotaInfo._receivable, quotaInfo._payable, quotaInfo._debt);
    }

    /// @notice                 check if a specified storemanGroup has paid off its debt
    /// @dev                    check if a specified storemanGroup has paid off its debt
    /// @param  tokenOrigAccount  account of token supported
    /// @param  storemanGroupPK   the PK of storemanGroup to be checked
    /// @return                 result of debt status check
    function isDebtPaidOff(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns(bool)
    {
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return quotaInfo._receivable == uint(0) && quotaInfo._payable == uint(0) && quotaInfo._debt == uint(0);
    }

}
