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

    /// @notice tx direction
    enum TxDirection {Inbound, Outbound, DebtTransfer}

    /**
     *
     * STRUCTURES
     *
     */

    /// @notice HTLC(Hashed TimeLock Contract) tx info
    struct HTLCTx {
        TxDirection direction;  // HTLC transfer direction
        address  source;        // HTLC transaction source address
        address  destination;   // HTLC transaction destination address
        bytes storemanPK;       // HTLC transaction storeman PK
        uint value;             // HTLC transfer value of token
        TxStatus status;        // HTLC transaction status
        uint lockedTime;        // HTLC transaction locked time
        uint beginLockedTime;   // HTLC transaction begin locked time
        bytes srcPK;            // HTLC transaction source PK
    }

    struct Data {
        /// @notice mapping of hash(x) to HTLCTx -- token->xHash->htlcData
        mapping(bytes => mapping(bytes32 => HTLCTx)) xHashHTLCTxsMap;

        /// @notice mapping of hash(x) to shadow address
        mapping(bytes => mapping(bytes32 => bytes)) mapXHashShadow;

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

    /// @notice                  function for get HTLC info
    /// @param tokenOrigAccount  token account of original chain
    /// @param xHash             xHash
    function getHTLCTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        external
        view
        returns (address, address, bytes, uint)
    {
        HTLCTx storage t = self.xHashHTLCTxsMap[tokenOrigAccount][xHash];
        return (t.source, t.destination, t.storemanPK, t.value);
    }

    /// @notice                  function for get HTLC info
    /// @param tokenOrigAccount  token account of original chain
    /// @param xHash             xHash
    function getDebtTransferSrcPK(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        external
        view
        returns (bytes)
    {
        HTLCTx storage t = self.xHashHTLCTxsMap[tokenOrigAccount][xHash];
        require(t.direction != TxDirection.DebtTransfer, "Direction is incorrect");
        return (t.srcPK);
    }

    /// @notice                 get left locked time of the HTLC transaction
    /// @param  tokenOrigAccount  account of original chain toke
    /// @param  xHash           hash of HTLC random number
    /// @return time            return left locked time, in seconds. return uint(0xffffffffffffffff) if xHash does not exist
    function getHTLCLeftLockedTime(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        external
        view
        returns(uint time)
    {
        HTLCTx storage info = self.xHashHTLCTxsMap[tokenOrigAccount][xHash];
        if (info.status == TxStatus.None) {
            return self.defaultMaxTime;
        }

        if (now >= info.beginLockedTime.add(info.lockedTime)) {
            return 0;
        } else {
            return  info.beginLockedTime.add(info.lockedTime).sub(now);
        }
    }

    /// @notice     set revoke fee ratio
    function setRevokeFeeRatio(Data storage self, uint ratio)
        external
        returns (bool)
    {
        require(ratio <= self.ratioPrecise, "Ratio is invalid");
        self.revokeFeeRatio = ratio;
        return true;
    }

    /// @notice                 check HTLC transaction exist or not
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    /// @return exist           return true if exist
    function xHashExist(Data storage self, bytes tokenOrigAccount, bytes32 xHash)
        public
        view
        returns(bool exist)
    {
        return self.xHashHTLCTxsMap[tokenOrigAccount][xHash].status != TxStatus.None;
    }

    /// @notice                 add HTLC transaction info
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  direction       HTLC transaction direction
    /// @param  src             HTLC transaction source address
    /// @param  des             HTLC transaction destination address
    /// @param  xHash           hash of HTLC random number
    /// @param  value           HTLC transfer value of token
    /// @param  isFirstHand     is HTLC first hand trade?
    /// @param  shadow          shadow address. used for receipt coins on opposite block chain
    function addHTLCTx(Data storage self, bytes tokenOrigAccount, TxDirection direction, address src,
                       address des, bytes32 xHash, uint value, bool isFirstHand, bytes shadow, bytes storemanPK, bytes srcPK)
        external
    {
        require(value != 0, "Value is invalid");
        require(!xHashExist(self, tokenOrigAccount, xHash), "HTLC tx is exist");

        self.xHashHTLCTxsMap[tokenOrigAccount][xHash] = HTLCTx(direction, src, des, storemanPK, value,
                                                               TxStatus.Locked, isFirstHand ? self.lockedTime.mul(2) : self.lockedTime, now, srcPK);
        if (isFirstHand) self.mapXHashShadow[tokenOrigAccount][xHash] = shadow;
    }

    /// @notice                 refund coins from HTLC transaction
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               random number of HTLC
    /// @param  hashAlgorithms  hash algorithms to calculate xHash
    /// @param  direction       HTLC transaction direction
    /// @return xHash           return hash of HTLC random number
    function redeemHTLCTx(Data storage self, bytes tokenOrigAccount, bytes32 x, uint hashAlgorithms, TxDirection direction)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(x);

        HTLCTx storage info = self.xHashHTLCTxsMap[tokenOrigAccount][xHash];
        require(info.status == TxStatus.Locked, "Status is not locked");
        require(info.direction == direction, "Direction is incorrect");
        if (info.direction != TxDirection.DebtTransfer) {
            require(info.destination == msg.sender, "Destination is not equal to sender");
        }
        require(now < info.beginLockedTime.add(info.lockedTime), "Redeem timeout");

        info.status = TxStatus.Refunded;
        return (xHash);
    }

    /// @notice                 revoke HTLC transaction
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    /// @param  direction       HTLC transaction direction
    /// @param  loose           whether give counter party revoking right
    function revokeHTLCTx(Data storage self, bytes tokenOrigAccount, bytes32 xHash, TxDirection direction, bool loose)
        external
    {
        HTLCTx storage info = self.xHashHTLCTxsMap[tokenOrigAccount][xHash];
        require(info.status == TxStatus.Locked, "Status is not locked");
        require(info.direction == direction, "Direction is incorrect");
        require(now >= info.beginLockedTime.add(info.lockedTime), "Revoke is not permitted");
        if (loose) {
            require((info.source == msg.sender) || (info.destination == msg.sender), "Msg sender is incorrect");
        } else {
            require(info.source == msg.sender, "Msg sender is incorrect");
        }

        info.status = TxStatus.Revoked;
    }

}
