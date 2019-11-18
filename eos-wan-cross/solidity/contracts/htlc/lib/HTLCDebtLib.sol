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

// import "../../lib/SchnorrVerifier.sol";
import "../../lib/QuotaLib.sol";
import "./HTLCLib.sol";
import "./commonLib.sol";
import "../../interfaces/ITokenManager.sol";

library HTLCDebtLib {
    using SafeMath for uint;
    using QuotaLib for QuotaLib.Data;
    using HTLCLib for HTLCLib.Data;

    struct HTLCDebtLockParams {
        bytes tokenOrigAccount;
        bytes32 xHash;
        uint value;
        bytes srcStoremanPK;
        bytes dstStoremanPK;
        bytes r;
        bytes32 s;
    }

    struct HTLCDebtRedeemParams {
        bytes tokenOrigAccount;
        bytes r;
        bytes32 s;
        bytes32 x;
    }

    /**
     *
     * EVENTS
     *
     **/

    /// @notice                 event of store debt lock
    /// @param srcStoremanPK    PK of src storeman
    /// @param dstStoremanPK    PK of dst storeman
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param tokenOrigAccount account of original chain token
    event DebtLockLogger(bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes srcStoremanPK, bytes dstStoremanPK);
    /// @notice                 event of refund storeman debt
    /// @param srcStoremanPK    PK of src storeman
    /// @param dstStoremanPK    PK of dst storeman
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event DebtRedeemLogger(bytes32 indexed xHash, bytes32 x, bytes tokenOrigAccount, bytes srcStoremanPK, bytes dstStoremanPK);
    /// @notice                 event of revoke storeman debt
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token
    /// @param srcStoremanPK    PK of src storeman
    /// @param dstStoremanPK    PK of dst storeman
    event DebtRevokeLogger(bytes32 indexed xHash, bytes tokenOrigAccount, bytes srcStoremanPK, bytes dstStoremanPK);


    function inDebtLock(HTLCLib.Data storage htlcData, QuotaLib.Data storage quotaData, HTLCDebtLockParams memory params)
        public
    {
        bytes32 mHash = sha256(abi.encode(params.tokenOrigAccount, params.xHash, params.srcStoremanPK, params.dstStoremanPK));
        commonLib.verifySignature(mHash, params.dstStoremanPK, params.r, params.s);

        htlcData.addDebtTx(params.xHash, params.value, params.srcStoremanPK, params.dstStoremanPK);
        quotaData.debtLock(params.tokenOrigAccount, params.value, params.srcStoremanPK, params.dstStoremanPK);
        // emit logger...
        emit DebtLockLogger(params.xHash, params.value, params.tokenOrigAccount, params.srcStoremanPK, params.dstStoremanPK);
    }

    function inDebtRedeem(HTLCLib.Data storage htlcData, QuotaLib.Data storage quotaData, HTLCDebtRedeemParams memory params)
        public
    {
        bytes32 xHash = htlcData.redeemDebtTx(params.x);

        uint value;
        bytes memory srcStoremanPK;
        bytes memory dstStoremanPK;
        (srcStoremanPK, value, dstStoremanPK) = htlcData.getDebtTx(xHash);

        commonLib.verifySignature(sha256(abi.encode(params.tokenOrigAccount, params.x)), srcStoremanPK, params.r, params.s);
        quotaData.debtRedeem(params.tokenOrigAccount, value, srcStoremanPK, dstStoremanPK);

        emit DebtRedeemLogger(xHash, params.x, params.tokenOrigAccount, srcStoremanPK, dstStoremanPK);
    }

    function inDebtRevoke(HTLCLib.Data storage htlcData, QuotaLib.Data storage quotaData, bytes tokenOrigAccount, bytes32 xHash)
        public
    {
        htlcData.revokeDebtTx(xHash);

        uint value;
        bytes memory srcStoremanPK;
        bytes memory dstStoremanPK;
        (srcStoremanPK, value, dstStoremanPK) = htlcData.getDebtTx(xHash);

        quotaData.debtRevoke(tokenOrigAccount, value, srcStoremanPK, dstStoremanPK);
        emit DebtRevokeLogger(xHash, tokenOrigAccount, srcStoremanPK, dstStoremanPK);
    }

    // /// @notice       convert bytes to bytes32
    // /// @param b      bytes array
    // /// @param offset offset of array to begin convert
    // function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
    //     bytes32 out;

    //     for (uint i = 0; i < 32; i++) {
    //       out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
    //     }
    //     return out;
    // }

    // /// @notice             verify signature
    // /// @param  message        message to be verified
    // /// @param  r           Signature info r
    // /// @param  s           Signature info s
    // /// @return             true/false
    // function verifySignature(bytes32 message, bytes PK, bytes r, bytes32 s)
    //     private
    //     pure
    // {
    //     bytes32 PKx = bytesToBytes32(PK, 1);
    //     bytes32 PKy = bytesToBytes32(PK, 33);

    //     bytes32 Rx = bytesToBytes32(r, 1);
    //     bytes32 Ry = bytesToBytes32(r, 33);

    //     require(SchnorrVerifier.verify(s, PKx, PKy, Rx, Ry, message), "Signature verification failed");
    // }
}
