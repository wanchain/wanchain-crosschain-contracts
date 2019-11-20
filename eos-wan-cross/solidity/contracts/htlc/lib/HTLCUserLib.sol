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
import "../../interfaces/IWRC20Protocol.sol";

library HTLCUserLib {
    using SafeMath for uint;
    using QuotaLib for QuotaLib.Data;
    using HTLCLib for HTLCLib.Data;

    struct HTLCUserLockParams {
        bytes32 xHash;
        uint value;
        bytes tokenOrigAccount;
        bytes userOrigAccount;
        bytes storemanGroupPK;
        ITokenManager tokenManager;
    }

    struct HTLCUserRedeemParams {
        bytes tokenOrigAccount;
        ITokenManager tokenManager;
        bytes32 x;
    }

    struct HTLCUserRevokeParams {
        bytes tokenOrigAccount;
        ITokenManager tokenManager;
        bytes32 xHash;
    }

    /**
     *
     * EVENTS
     *
     **/
    /// @notice                 event of exchange original chain token with WRC-20 token request
    /// @param storemanGroupPK  PK of storemanGroup, where the original chain token come from
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param userOrigAccount  account of original chain, used to receive token
    /// fee              exchange fee
    /// @param tokenOrigAccount account of original chain token
    event OutboundLockLogger(bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes userOrigAccount, bytes storemanGroupPK);

    /// @notice                 event of refund WRC-20 token from exchange WRC-20 token with original chain token HTLC transaction
    /// @param wanAddr          address of user on wanchain, used to receive WRC-20 token
    /// @param storemanGroupPK  PK of storeman, the WRC-20 token minter
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event InboundRedeemLogger(address indexed wanAddr, bytes32 indexed xHash, bytes32 indexed x, bytes storemanGroupPK, bytes tokenOrigAccount);

    /// @notice                 event of revoke exchange original chain token with WRC-20 token HTLC transaction
    /// @param wanAddr          address of user
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event OutboundRevokeLogger(address indexed wanAddr, bytes32 indexed xHash, bytes tokenOrigAccount);

    function outUserLock(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCUserLockParams memory params)
        public
    {
        // check withdraw fee
        uint fee = getOutboundFee(htlcStorageData, params.tokenOrigAccount, params.storemanGroupPK, params.value);
        require(msg.value >= fee, "Transferred fee is not enough");

        uint left = (msg.value).sub(fee);
        if (left != 0) {
            (msg.sender).transfer(left);
        }

        htlcStorageData.htlcData.addUserTx(params.xHash, params.value, params.userOrigAccount, params.storemanGroupPK);

        htlcStorageData.quotaData.outLock(params.value, params.tokenOrigAccount, params.storemanGroupPK);

        address instance;
        (,,,instance,,,,) = params.tokenManager.getTokenInfo(params.tokenOrigAccount);
        require(IWRC20Protocol(instance).transferFrom(msg.sender, this, params.value), "Lock token failed");

        htlcStorageData.mapXHashFee[params.xHash] = fee; // in wan coin
        emit OutboundLockLogger(params.xHash, params.value, params.tokenOrigAccount, params.userOrigAccount, params.storemanGroupPK);
    }

    function inUserRedeem(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCUserRedeemParams memory params)
        public
    {
        bytes32 xHash = htlcStorageData.htlcData.redeemSmgTx(params.x);

        address userAddr;
        uint value;
        bytes memory storemanGroupPK;
        (userAddr, value, storemanGroupPK) = htlcStorageData.htlcData.getSmgTx(xHash);

        htlcStorageData.quotaData.inRedeem(params.tokenOrigAccount, storemanGroupPK, value);

        params.tokenManager.mintToken(params.tokenOrigAccount, userAddr, value);

        emit InboundRedeemLogger(userAddr, xHash, params.x, storemanGroupPK, params.tokenOrigAccount);
    }

    function outUserRevoke(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCUserRevokeParams memory params)
        public
    {
        address source;
        uint value;
        bytes memory storemanGroupPK;
        address instance;

        htlcStorageData.htlcData.revokeUserTx(params.xHash);

        (source, , value, storemanGroupPK) = htlcStorageData.htlcData.getUserTx(params.xHash);

        htlcStorageData.quotaData.outRevoke(params.tokenOrigAccount, storemanGroupPK, value);

        (,,,instance,,,,) = params.tokenManager.getTokenInfo(params.tokenOrigAccount);
        require(IWRC20Protocol(instance).transfer(source, value), "Transfer token failed");

        (source, , , storemanGroupPK) = htlcStorageData.htlcData.getUserTx(params.xHash);

        uint revokeFeeRatio = htlcStorageData.revokeFeeRatio;
        uint ratioPrecise = HTLCTypes.getRatioPrecise();
        uint revokeFee = htlcStorageData.mapXHashFee[params.xHash].mul(revokeFeeRatio).div(ratioPrecise);
        uint left = htlcStorageData.mapXHashFee[params.xHash].sub(revokeFee);

        if (revokeFee > 0) {
            htlcStorageData.mapStoremanFee[storemanGroupPK].add(revokeFee);
        }

        if (left > 0) {
            source.transfer(left);
        }

        emit OutboundRevokeLogger(source, params.xHash, params.tokenOrigAccount);
    }

    function getOutboundFee(HTLCTypes.HTLCStorageData storage htlcStorageData, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        private
        returns(uint)
    {
        uint8 decimals;
        uint token2WanRatio;
        uint defaultPrecise;
        uint txFeeRatio;
        (,, decimals,,token2WanRatio,,, defaultPrecise) = htlcStorageData.tokenManager.getTokenInfo(tokenOrigAccount);
        (, txFeeRatio,,,,) = htlcStorageData.quotaData.getQuota(tokenOrigAccount, storemanGroupPK);

        uint temp = value.mul(1 ether).div(10**uint(decimals));
        return temp.mul(token2WanRatio).mul(txFeeRatio).div(defaultPrecise).div(defaultPrecise);
    }

}
