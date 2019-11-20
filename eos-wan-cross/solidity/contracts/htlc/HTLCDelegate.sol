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

import "./lib/HTLCDebtLib.sol";
import "./lib/HTLCSmgLib.sol";
import "./lib/HTLCUserLib.sol";
import "../components/Halt.sol";
import "./HTLCStorage.sol";

contract HTLCDelegate is HTLCStorage, Halt {
    using SafeMath for uint;

    /**
     *
     * MODIFIERS
     *
     */

    modifier onlyStoremanGroupAdmin {
        require(msg.sender == storemanGroupAdmin, "Only storeman group admin sc can call it");
        _;
    }

    /// @dev Check relevant contract addresses must be initialized before call its method
    modifier initialized {
        require(tokenManager != ITokenManager(address(0)), "Token manager is null");
        // require(storemanGroupAdmin != address(0));
        _;
    }

    modifier onlyTokenRegistered(bytes tokenOrigAccount) {
        require(tokenManager.isTokenRegistered(tokenOrigAccount), "Token is not registered");
        _;
    }

    /**
     *
     * MANIPULATIONS
     *
     */
    function setEconomics(address tokenManagerAddr, address storemanGroupAdminAddr) external {
        require(tokenManagerAddr != address(0) && storemanGroupAdminAddr != address(0), "Parameter is invalid");

        tokenManager = ITokenManager(tokenManagerAddr);
        storemanGroupAdmin = storemanGroupAdminAddr;
    }

    /// @notice                 request exchange WRC20 token with original chain token(to prevent collision, x must be a 256bit random bigint)
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    /// @param  wanAddr         address of user, used to receive WRC20 token
    /// @param  value           exchange value
    /// @param  storemanGroupPK      PK of storeman
    /// @param  r               signature
    /// @param  s               signature
    function inSmgLock(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanGroupPK, bytes r, bytes32 s)
        external
        initialized
        notHalted
        onlyTokenRegistered(tokenOrigAccount)
    {
        HTLCSmgLib.HTLCSmgLockParams memory params = HTLCSmgLib.HTLCSmgLockParams({
            tokenOrigAccount: tokenOrigAccount,
            xHash: xHash,
            wanAddr: wanAddr,
            value: value,
            storemanGroupPK: storemanGroupPK,
            r: r,
            s: s
        });
        HTLCSmgLib.inSmgLock(htlcData, quotaData, params);
    }

    /// @notice                 request exchange original chain token with WERC20 token(to prevent collision, x must be a 256bit random big int)
    /// @param tokenOrigAccount account of original chain token
    /// @param xHash            hash of HTLC random number
    /// @param storemanGroupPK  PK of storeman group
    /// @param userOrigAccount  account of original chain, used to receive token
    /// @param value            token value
    function outUserLock(bytes32 xHash, uint value, bytes tokenOrigAccount, bytes userOrigAccount, bytes storemanGroupPK)
        external
        initialized
        notHalted
        onlyTokenRegistered(tokenOrigAccount)
        payable
    {
        require(tx.origin == msg.sender, "Contract sender is not allowed");

        // check withdraw fee
        uint fee = getOutboundFee(tokenOrigAccount, storemanGroupPK, value);
        require(msg.value >= fee, "Transferred fee is not enough");

        uint left = (msg.value).sub(fee);
        if (left != 0) {
            (msg.sender).transfer(left);
        }

        HTLCUserLib.HTLCUserLockParams memory params = HTLCUserLib.HTLCUserLockParams({
            tokenOrigAccount: tokenOrigAccount,
            xHash: xHash,
            value: value,
            storemanGroupPK: storemanGroupPK,
            userOrigAccount: userOrigAccount,
            tokenManager: tokenManager
        });
        HTLCUserLib.outUserLock(htlcData, quotaData, params);

        mapXHashFee[xHash] = fee; // in wan coin
    }

    /// @notice                 refund WRC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               HTLC random number
    function inUserRedeem(bytes tokenOrigAccount, bytes32 x)
        external
        initialized
        notHalted
    {
        HTLCUserLib.HTLCUserRedeemParams memory params = HTLCUserLib.HTLCUserRedeemParams({
            tokenOrigAccount: tokenOrigAccount,
            tokenManager: tokenManager,
            x: x
        });
        HTLCUserLib.inUserRedeem(htlcData, quotaData, params);
    }

    /// @notice                 refund WRC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               HTLC random number
    function outSmgRedeem(bytes tokenOrigAccount, bytes32 x, bytes r, bytes32 s)
        external
        initialized
        notHalted
    {
        HTLCSmgLib.HTLCSmgRedeemParams memory params = HTLCSmgLib.HTLCSmgRedeemParams({
            tokenOrigAccount: tokenOrigAccount,
            tokenManager: tokenManager,
            r: r,
            s: s,
            x: x
        });
        bytes32 xHash;
        bytes memory storemanGroupPK;
        (xHash, storemanGroupPK) = HTLCSmgLib.outSmgRedeem(htlcData, quotaData, params);

        // Add fee to storeman group
        mapStoremanFee[storemanGroupPK].add(mapXHashFee[xHash]);
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAccount account of original chain token
    /// @param xHash            hash of HTLC random number
    function inSmgRevoke(bytes tokenOrigAccount, bytes32 xHash)
        external
        initialized
        notHalted
    {
        HTLCSmgLib.inSmgRevoke(htlcData, quotaData, tokenOrigAccount, xHash);
    }

    /// @notice                 revoke HTLC transaction of exchange original chain token with WERC20 token(must be called after HTLC timeout)
    /// @param  tokenOrigAccount  account of original chain token
    /// @notice                 the revoking fee will be sent to storeman
    /// @param  xHash           hash of HTLC random number
    function outUserRevoke(bytes tokenOrigAccount, bytes32 xHash)
        external
        initialized
        notHalted
    {
        address source;
        bytes memory storemanGroupPK;
        uint revokeFeeRatio;
        uint ratioPrecise;

        HTLCUserLib.HTLCUserRevokeParams memory params = HTLCUserLib.HTLCUserRevokeParams({
            tokenOrigAccount: tokenOrigAccount,
            tokenManager: tokenManager,
            xHash: xHash
        });
        HTLCUserLib.outUserRevoke(htlcData, quotaData, params);

        (source, , , storemanGroupPK) = htlcData.getUserTx(xHash);

        (revokeFeeRatio, ratioPrecise) = htlcData.getGlobalInfo();
        uint revokeFee = mapXHashFee[xHash].mul(revokeFeeRatio).div(ratioPrecise);
        uint left = mapXHashFee[xHash].sub(revokeFee);

        if (revokeFee > 0) {
            mapStoremanFee[storemanGroupPK].add(revokeFee);
        }

        if (left > 0) {
            source.transfer(left);
        }
    }

    /// @notice                 lock storeman deb
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    /// @param  srcStoremanPK   PK of src storeman
    /// @param  dstStoremanPK   PK of dst storeman
    /// @param  r               signature
    /// @param  s               signature
    function inDebtLock(bytes tokenOrigAccount, bytes32 xHash, uint value, bytes srcStoremanPK, bytes dstStoremanPK, bytes r, bytes32 s)
        external
        initialized
        notHalted
        onlyTokenRegistered(tokenOrigAccount)
    {
        HTLCDebtLib.HTLCDebtLockParams memory params = HTLCDebtLib.HTLCDebtLockParams({
            tokenOrigAccount: tokenOrigAccount,
            xHash: xHash,
            value: value,
            srcStoremanPK: srcStoremanPK,
            dstStoremanPK: dstStoremanPK,
            r: r,
            s: s
        });
        HTLCDebtLib.inDebtLock(htlcData, quotaData, params);
    }

    /// @notice                 refund WRC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               HTLC random number
    function inDebtRedeem(bytes tokenOrigAccount, bytes32 x, bytes r, bytes32 s)
        external
        initialized
        notHalted
    {
        HTLCDebtLib.HTLCDebtRedeemParams memory params = HTLCDebtLib.HTLCDebtRedeemParams({
            tokenOrigAccount: tokenOrigAccount,
            r: r,
            s: s,
            x: x
        });
        HTLCDebtLib.inDebtRedeem(htlcData, quotaData, params);
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAccount account of original chain token
    /// @param xHash            hash of HTLC random number
    function inDebtRevoke(bytes tokenOrigAccount, bytes32 xHash)
        external
        initialized
        notHalted
    {
        HTLCDebtLib.inDebtRevoke(htlcData, quotaData, tokenOrigAccount, xHash);
    }

    function getOutboundFee(bytes tokenOrigAccount, bytes storemanGroupPK, uint value) private returns(uint) {
        uint8 decimals;
        uint token2WanRatio;
        uint defaultPrecise;
        uint txFeeRatio;
        (,, decimals,,token2WanRatio,,, defaultPrecise) = tokenManager.getTokenInfo(tokenOrigAccount);
        (, txFeeRatio,,,,) = quotaData.getQuota(tokenOrigAccount, storemanGroupPK);

        uint temp = value.mul(1 ether).div(10**uint(decimals));
        return temp.mul(token2WanRatio).mul(txFeeRatio).div(defaultPrecise).div(defaultPrecise);
    }

	function addStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK, uint quota, uint txFeeRatio)
		external
		onlyStoremanGroupAdmin
	{
        quotaData.addStoremanGroup(tokenOrigAccount, storemanGroupPK, quota, txFeeRatio);
	}

	function deactivateStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK)
		external
		onlyStoremanGroupAdmin
	{
		quotaData.deactivateStoremanGroup(tokenOrigAccount, storemanGroupPK);
	}

	function delStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK)
		external
		onlyStoremanGroupAdmin
	{
        quotaData.delStoremanGroup(tokenOrigAccount, storemanGroupPK);
	}

    function smgWithdrawFee(bytes storemanGroupPK, address receiver, bytes r, bytes32 s) external {
        HTLCSmgLib.smgWithdrawFee(storemanGroupPK, receiver, r, s);
        receiver.transfer(mapStoremanFee[storemanGroupPK]);
    }
}
