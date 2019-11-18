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

library HTLCLib {
    using SafeMath for uint;

    /**
     *
     * ENUMS
     *
     */

    /// @notice tx info status
    /// @notice uninitialized,locked,refunded,revoked
    enum TxStatus {None, Locked, Refunded, Revoked}

    /**
     *
     * STRUCTURES
     *
     */

    /// @notice HTLC(Hashed TimeLock Contract) tx info
    struct BaseTx {
        // TxDirection direction;  // HTLC transfer direction
        uint value;             // HTLC transfer value of token
        bytes storemanPK;       // HTLC transaction storeman PK
        TxStatus status;        // HTLC transaction status
        uint lockedTime;        // HTLC transaction locked time
        uint beginLockedTime;   // HTLC transaction begin locked time
    }

    struct UserTx {
        BaseTx baseTx;
        address sender;        // HTLC transaction sender address for the security check while user's revoke
        bytes shadow;           // Shadow address or account on mirror chain
    }

    struct SmgTx {
        BaseTx baseTx;
        address  userAddr;   // HTLC transaction userAddr address for the security check while user's redeem
    }

    struct DebtTx {
        BaseTx baseTx;
        bytes srcStoremanPK;            // HTLC transaction sender PK
    }

    struct Data {
        /// @notice mapping of hash(x) to UserTx -- token->xHash->htlcData
        mapping(bytes32 => UserTx) mapHashXUserTxs;

        /// @notice mapping of hash(x) to UserTx -- token->xHash->htlcData
        mapping(bytes32 => SmgTx) mapHashXSmgTxs;

        /// @notice mapping of hash(x) to UserTx -- token->xHash->htlcData
        mapping(bytes32 => DebtTx) mapHashXDebtTxs;

        /// @notice atomic tx needed locked time(in seconds)
        uint lockedTime;

        /// @notice the fee ratio of revoking operation
        uint revokeFeeRatio;

        /// @notice revoking fee ratio precise
        /// @notice for example: revokeFeeRatio is 3, meaning that the revoking fee ratio is 3/10000
        uint ratioPrecise;
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    function init(Data storage self) external {
        self.lockedTime = uint(3600*36);
        self.ratioPrecise = 10000;
    }

    function getGlobalInfo(Data storage self) external view returns(uint, uint) {
        return (self.revokeFeeRatio, self.ratioPrecise);
    }

    /// @notice                  function for get user info
    /// @param xHash             xHash
    function getUserTx(Data storage self, bytes32 xHash)
        external
        view
        returns (address, bytes, uint, bytes)
    {
        UserTx storage t = self.mapHashXUserTxs[xHash];
        return (t.sender, t.shadow, t.baseTx.value, t.baseTx.storemanPK);
    }

    /// @notice                  function for get smg info
    /// @param xHash             xHash
    function getSmgTx(Data storage self, bytes32 xHash)
        external
        view
        returns (address, uint, bytes)
    {
        SmgTx storage t = self.mapHashXSmgTxs[xHash];
        return (t.userAddr, t.baseTx.value, t.baseTx.storemanPK);
    }

    /// @notice                  function for get debt info
    /// @param xHash             xHash
    function getDebtTx(Data storage self, bytes32 xHash)
        external
        view
        returns (bytes, uint, bytes)
    {
        DebtTx storage t = self.mapHashXDebtTxs[xHash];
        return (t.srcStoremanPK, t.baseTx.value, t.baseTx.storemanPK);
    }

    /// @notice     set revoke fee ratio
    function setRevokeFeeRatio(Data storage self, uint ratio)
        external
    {
        require(ratio <= self.ratioPrecise, "Ratio is invalid");
        self.revokeFeeRatio = ratio;
    }

    /// @notice                 add user transaction info
    /// @param  xHash           hash of HTLC random number
    /// @param  value           HTLC transfer value of token
    /// @param  shadow          shadow address. used for receipt coins on opposite block chain
    function addUserTx(Data storage self, bytes32 xHash, uint value, bytes shadow, bytes storemanPK)
        external
    {
        UserTx storage userTx = self.mapHashXUserTxs[xHash];
        require(value != 0, "Value is invalid");
        require(userTx.baseTx.status == TxStatus.None, "User tx is exist");

        userTx.baseTx.value = value;
        userTx.baseTx.status = TxStatus.Locked;
        userTx.baseTx.lockedTime = self.lockedTime.mul(2);
        userTx.baseTx.beginLockedTime = now;
        userTx.baseTx.storemanPK = storemanPK;
        userTx.sender = msg.sender;
        userTx.shadow = shadow;
    }

    function addSmgTx(Data storage self, bytes32 xHash, uint value, address userAddr, bytes storemanPK)
        external
    {
        SmgTx storage smgTx = self.mapHashXSmgTxs[xHash];
        require(value != 0, "Value is invalid");
        require(smgTx.baseTx.status == TxStatus.None, "Smg tx is exist");

        smgTx.baseTx.value = value;
        smgTx.baseTx.storemanPK = storemanPK;
        smgTx.baseTx.status = TxStatus.Locked;
        smgTx.baseTx.lockedTime = self.lockedTime;
        smgTx.baseTx.beginLockedTime = now;
        smgTx.userAddr = userAddr;
    }

    function addDebtTx(Data storage self, bytes32 xHash, uint value, bytes srcStoremanPK, bytes storemanPK)
        external
    {
        DebtTx storage debtTx = self.mapHashXDebtTxs[xHash];
        require(value != 0, "Value is invalid");
        require(debtTx.baseTx.status == TxStatus.None, "Debt tx is exist");

        debtTx.baseTx.value = value;
        debtTx.baseTx.storemanPK = storemanPK;
        debtTx.baseTx.status = TxStatus.Locked;
        debtTx.baseTx.lockedTime = self.lockedTime;
        debtTx.baseTx.beginLockedTime = now;
        debtTx.srcStoremanPK = srcStoremanPK;
    }

    /// @notice                 refund coins from HTLC transaction
    /// @param  x               random number of HTLC
    /// @return xHash           return hash of HTLC random number
    function redeemUserTx(Data storage self, bytes32 x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(abi.encodePacked(x));

        UserTx storage info = self.mapHashXUserTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");

        info.baseTx.status = TxStatus.Refunded;
        return (xHash);
    }

    /// @notice                 refund coins from HTLC transaction
    /// @param  x               random number of HTLC
    /// @return xHash           return hash of HTLC random number
    function redeemSmgTx(Data storage self, bytes32 x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(abi.encodePacked(x));

        SmgTx storage info = self.mapHashXSmgTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");
        require(info.userAddr == msg.sender, "Msg sender is incorrect");

        info.baseTx.status = TxStatus.Refunded;
        return (xHash);
    }

    /// @notice                 refund coins from HTLC transaction
    /// @param  x               random number of HTLC
    /// @return xHash           return hash of HTLC random number
    function redeemDebtTx(Data storage self, bytes32 x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(abi.encodePacked(x));

        DebtTx storage info = self.mapHashXDebtTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");

        info.baseTx.status = TxStatus.Refunded;
        return (xHash);
    }

    /// @notice                 revoke user transaction
    /// @param  xHash           hash of HTLC random number
    function revokeUserTx(Data storage self, bytes32 xHash)
        external
    {
        UserTx storage info = self.mapHashXUserTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");
        // require(info.sender == msg.sender, "Msg sender is incorrect");

        info.baseTx.status = TxStatus.Revoked;
    }

    /// @notice                 revoke user transaction
    /// @param  xHash           hash of HTLC random number
    function revokeSmgTx(Data storage self, bytes32 xHash)
        external
    {
        SmgTx storage info = self.mapHashXSmgTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");

        info.baseTx.status = TxStatus.Revoked;
    }

    /// @notice                 revoke user transaction
    /// @param  xHash           hash of HTLC random number
    function revokeDebtTx(Data storage self, bytes32 xHash)
        external
    {
        DebtTx storage info = self.mapHashXDebtTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");

        info.baseTx.status = TxStatus.Revoked;
    }
}
