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
        TxStatus status;        // HTLC transaction status
        uint lockedTime;        // HTLC transaction locked time
        uint beginLockedTime;   // HTLC transaction begin locked time
    }

    struct UserTx {
        BaseTx baseTx;
        address sender;        // HTLC transaction sender address for the security check while user's revoke
        bytes storemanPK;       // HTLC transaction storeman PK
        bytes shadow;           // Shadow address or account on mirror chain
    }

    struct SmgTx {
        BaseTx baseTx;
        address  userAddr;   // HTLC transaction userAddr address for the security check while user's redeem
    }

    struct DebtTx {
        BaseTx baseTx;
        bytes srcPK;            // HTLC transaction sender PK
    }

    struct Data {
        /// @notice mapping of hash(x) to UserTx -- token->xHash->htlcData
        mapping(bytes => mapping(bytes32 => UserTx)) xHashUserTxsMap;

        /// @notice mapping of hash(x) to UserTx -- token->xHash->htlcData
        mapping(bytes => mapping(bytes32 => SmgTx)) xHashSmgTxsMap;

        /// @notice mapping of hash(x) to UserTx -- token->xHash->htlcData
        mapping(bytes => mapping(bytes32 => DebtTx)) xHashDebtTxsMap;

        /// @notice atomic tx needed locked time(in seconds)
        uint lockedTime;

        /// @notice default max UTC time
        uint defaultMaxTime;

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

    function init(Data storage self) external returns(bool) {
        self.lockedTime = uint(3600*36);
        self.defaultMaxTime = uint(0xffffffffffffffff);
        self.ratioPrecise = 10000;
        return true;
    }

    /// @notice                  function for get user info
    /// @param tokenOrigAccount  token account of original chain
    /// @param xHash             xHash
    function getUserTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        external
        view
        returns (address, bytes, bytes, uint)
    {
        UserTx storage t = self.xHashUserTxsMap[tokenOrigAccount][xHash];
        return (t.sender, t.storemanPK, t.shadow, t.baseTx.value);
    }

    /// @notice                  function for get user info
    /// @param tokenOrigAccount  token account of original chain
    /// @param xHash             xHash
    function getSmgTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        external
        view
        returns (address, uint)
    {
        SmgTx storage t = self.xHashSmgTxsMap[tokenOrigAccount][xHash];
        return (t.userAddr, t.baseTx.value);
    }

    // /// @notice                  function for get HTLC info
    // /// @param tokenOrigAccount  token account of original chain
    // /// @param xHash             xHash
    // function getDebtTransferSrcPK(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
    //     external
    //     view
    //     returns (bytes)
    // {
    //     HTLCTx storage t = self.xHashHTLCTxsMap[tokenOrigAccount][xHash];
    //     return (t.srcPK);
    // }

    /// @notice     set revoke fee ratio
    function setRevokeFeeRatio(Data storage self, uint ratio)
        external
        returns (bool)
    {
        require(ratio <= self.ratioPrecise, "Ratio is invalid");
        self.revokeFeeRatio = ratio;
        return true;
    }

    /// @notice                 add user transaction info
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    /// @param  value           HTLC transfer value of token
    /// @param  shadow          shadow address. used for receipt coins on opposite block chain
    function addUserTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash, uint value, bytes shadow, bytes storemanPK)
        external
    {
        UserTx storage userTx = self.xHashUserTxsMap[tokenOrigAccount][xHash];
        require(value != 0, "Value is invalid");
        require(userTx.baseTx.status == TxStatus.None, "User tx is exist");

        userTx.baseTx.value = value;
        userTx.baseTx.status = TxStatus.Locked;
        userTx.baseTx.lockedTime = self.lockedTime.mul(2);
        userTx.baseTx.beginLockedTime = now;
        userTx.sender = msg.sender;
        userTx.storemanPK = storemanPK;
        userTx.shadow = shadow;
    }

    function addSmgTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash, uint value, address userAddr)
        external
    {
        SmgTx storage smgTx = self.xHashSmgTxsMap[tokenOrigAccount][xHash];
        require(value != 0, "Value is invalid");
        require(smgTx.baseTx.status == TxStatus.None, "Smg tx is exist");

        smgTx.baseTx.value = value;
        smgTx.baseTx.status = TxStatus.Locked;
        smgTx.baseTx.lockedTime = self.lockedTime;
        smgTx.baseTx.beginLockedTime = now;
        smgTx.userAddr = userAddr;
    }

    /// @notice                 refund coins from HTLC transaction
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               random number of HTLC
    /// @return xHash           return hash of HTLC random number
    function redeemUserTx(Data storage self, bytes tokenOrigAccount, bytes x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(x);

        UserTx storage info = self.xHashUserTxsMap[tokenOrigAccount][xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");

        info.baseTx.status = TxStatus.Refunded;
        return (xHash);
    }

    /// @notice                 refund coins from HTLC transaction
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               random number of HTLC
    /// @return xHash           return hash of HTLC random number
    function redeemSmgTx(Data storage self, bytes tokenOrigAccount, bytes x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(x);

        SmgTx storage info = self.xHashSmgTxsMap[tokenOrigAccount][xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");
        require(info.userAddr == msg.sender, "Msg sender is incorrect");

        info.baseTx.status = TxStatus.Refunded;
        return (xHash);
    }

    /// @notice                 revoke user transaction
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    function revokeUserTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        external
    {
        UserTx storage info = self.xHashUserTxsMap[tokenOrigAccount][xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");
        require(info.sender == msg.sender, "Msg sender is incorrect");

        info.baseTx.status = TxStatus.Revoked;
    }

    /// @notice                 revoke user transaction
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    function revokeSmgTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        external
    {
        SmgTx storage info = self.xHashSmgTxsMap[tokenOrigAccount][xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");

        info.baseTx.status = TxStatus.Revoked;
    }
}
