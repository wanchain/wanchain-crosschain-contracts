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
pragma experimental ABIEncoderV2;


import "../../lib/QuotaLib.sol";
import "./HTLCLib.sol";
import "./commonLib.sol";
import "./HTLCTypes.sol";
import "../../interfaces/ITokenManager.sol";

library HTLCSmgLib {
    using SafeMath for uint;
    using QuotaLib for QuotaLib.Data;
    using HTLCLib for HTLCLib.Data;

    struct HTLCSmgLockParams {
        bytes tokenOrigAccount;
        bytes32 xHash;
        address wanAddr;
        uint value;
        bytes storemanGroupPK;
        bytes r;
        bytes32 s;
    }

    struct HTLCSmgRedeemParams {
        bytes tokenOrigAccount;
        ITokenManager tokenManager;
        bytes r;
        bytes32 s;
        bytes32 x;
    }

    /**
     *
     * EVENTS
     *
     **/

    /**
     *
     * EVENTS
     *
     **/

    /// @notice                 event of exchange WRC-20 token with original chain token request
    /// @param storemanGroupPK  PK of storemanGroup
    /// @param wanAddr          address of wanchain, used to receive WRC-20 token
    /// @param xHash            hash of HTLC random number
    /// @param value            HTLC value
    /// @param tokenOrigAccount account of original chain token
    event InboundLockLogger(address indexed wanAddr, bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes storemanGroupPK);

    /// @notice                 event of revoke exchange WRC-20 token with original chain token HTLC transaction
    /// @param storemanGroupPK  PK of storemanGroup
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event InboundRevokeLogger(bytes32 indexed xHash, bytes tokenOrigAccount, bytes storemanGroupPK);

    /// @notice                 event of refund WRC-20 token from exchange original chain token with WRC-20 token HTLC transaction
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event OutboundRedeemLogger(bytes32 indexed hashX, bytes32 indexed x, bytes tokenOrigAccount);


    function inSmgLock(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCSmgLockParams memory params)
        public
    {
        bytes32 mHash = sha256(abi.encode(params.tokenOrigAccount, params.xHash, params.wanAddr, params.value, params.storemanGroupPK));
        commonLib.verifySignature(mHash, params.storemanGroupPK, params.r, params.s);

        htlcStorageData.htlcData.addSmgTx(params.xHash, params.value, params.wanAddr, params.storemanGroupPK);
        htlcStorageData.quotaData.inLock(params.tokenOrigAccount, params.storemanGroupPK, params.value);

        emit InboundLockLogger(params.wanAddr, params.xHash, params.value, params.tokenOrigAccount, params.storemanGroupPK);
    }

    function outSmgRedeem(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCSmgRedeemParams memory params)
        public
    {
        bytes32 xHash = htlcStorageData.htlcData.redeemUserTx(params.x);

        uint value;
        bytes memory storemanGroupPK;
        (, , value, storemanGroupPK) = htlcStorageData.htlcData.getUserTx(xHash);

        commonLib.verifySignature(sha256(abi.encode(params.tokenOrigAccount, params.x)), storemanGroupPK, params.r, params.s);
        htlcStorageData.quotaData.outRedeem(params.tokenOrigAccount, storemanGroupPK, value);

        params.tokenManager.burnToken(params.tokenOrigAccount, value);

        // Add fee to storeman group
        htlcStorageData.mapStoremanFee[storemanGroupPK].add(htlcStorageData.mapXHashFee[xHash]);
        delete htlcStorageData.mapXHashFee[xHash];

        emit OutboundRedeemLogger(xHash, params.x, params.tokenOrigAccount);
    }

    function inSmgRevoke(HTLCTypes.HTLCStorageData storage htlcStorageData, bytes tokenOrigAccount, bytes32 xHash)
        public
    {
        htlcStorageData.htlcData.revokeSmgTx(xHash);

        uint value;
        bytes memory storemanGroupPK;
        (, value, storemanGroupPK) = htlcStorageData.htlcData.getSmgTx(xHash);

        // Anyone could do revoke for the owner
        // bytes32 mHash = sha256(abi.encode(tokenOrigAccount, xHash));
        // commonLib.verifySignature(mHash, storemanGroupPK, r, s);

        htlcStorageData.quotaData.inRevoke(tokenOrigAccount, storemanGroupPK, value);

        emit InboundRevokeLogger(xHash, tokenOrigAccount, storemanGroupPK);
    }

    function smgWithdrawFee(HTLCTypes.HTLCStorageData storage htlcStorageData, bytes storemanGroupPK, address receiver, bytes r, bytes32 s)
        public
    {
        commonLib.verifySignature(sha256(abi.encode(receiver)), storemanGroupPK, r, s);
        receiver.transfer(htlcStorageData.mapStoremanFee[storemanGroupPK]);
        delete htlcStorageData.mapStoremanFee[storemanGroupPK];
    }

}
