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


    function inSmgLock(HTLCLib.Data storage htlcData, QuotaLib.Data storage quotaData, HTLCSmgLockParams memory params)
        public
    {
        bytes32 mHash = sha256(abi.encode(params.tokenOrigAccount, params.xHash, params.wanAddr, params.value, params.storemanGroupPK));
        commonLib.verifySignature(mHash, params.storemanGroupPK, params.r, params.s);

        htlcData.addSmgTx(params.xHash, params.value, params.wanAddr, params.storemanGroupPK);
        quotaData.inLock(params.tokenOrigAccount, params.storemanGroupPK, params.value);

        emit InboundLockLogger(params.wanAddr, params.xHash, params.value, params.tokenOrigAccount, params.storemanGroupPK);
    }

    function outSmgRedeem(HTLCLib.Data storage htlcData, QuotaLib.Data storage quotaData, HTLCSmgRedeemParams memory params)
        public
        returns(bytes32, bytes)
    {
        bytes32 xHash = htlcData.redeemUserTx(params.x);

        uint value;
        bytes memory storemanGroupPK;
        (, , value, storemanGroupPK) = htlcData.getUserTx(xHash);

        commonLib.verifySignature(sha256(abi.encode(params.tokenOrigAccount, params.x)), storemanGroupPK, params.r, params.s);
        quotaData.outRedeem(params.tokenOrigAccount, storemanGroupPK, value);

        params.tokenManager.burnToken(params.tokenOrigAccount, value);

        emit OutboundRedeemLogger(xHash, params.x, params.tokenOrigAccount);
        return (xHash, storemanGroupPK);
    }

    function inSmgRevoke(HTLCLib.Data storage htlcData, QuotaLib.Data storage quotaData, bytes tokenOrigAccount, bytes32 xHash)
        public
    {
        htlcData.revokeSmgTx(xHash);

        uint value;
        bytes memory storemanGroupPK;
        (, value, storemanGroupPK) = htlcData.getSmgTx(xHash);

        // Anyone could do revoke for the owner
        // bytes32 mHash = sha256(abi.encode(tokenOrigAccount, xHash));
        // commonLib.verifySignature(mHash, storemanGroupPK, r, s);

        quotaData.inRevoke(tokenOrigAccount, storemanGroupPK, value);

        emit InboundRevokeLogger(xHash, tokenOrigAccount, storemanGroupPK);
    }

}
