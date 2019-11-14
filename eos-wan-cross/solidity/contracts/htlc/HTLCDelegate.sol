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

import "../components/Halt.sol";
import "../interfaces/IWRC20Protocol.sol";
import "./HTLCStorage.sol";

contract HTLCDelegate is HTLCStorage, Halt {
    using SafeMath for uint;

  modifier onlyStoremanGroupAdmin {
    require(msg.sender == storemanGroupAdmin, "Only storeman group admin sc can call it");
    _;
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

    /// @notice                 event of exchange WERC20 token with original chain token request
    /// @param storemanGroupPK  PK of storemanGroup
    /// @param wanAddr          address of wanchain, used to receive WERC20 token
    /// @param xHash            hash of HTLC random number
    /// @param value            HTLC value
    /// @param tokenOrigAccount account of original chain token
    event InboundLockLogger(address indexed wanAddr, bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes storemanGroupPK);
    /// @notice                 event of refund WERC20 token from exchange WERC20 token with original chain token HTLC transaction
    /// @param wanAddr          address of user on wanchain, used to receive WERC20 token
    /// @param storemanGroupPK  PK of storeman, the WERC20 token minter
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event InboundRedeemLogger(address indexed wanAddr, bytes storemanGroupPK, bytes32 indexed xHash, bytes32 indexed x, bytes tokenOrigAccount);
    /// @notice                 event of revoke exchange WERC20 token with original chain token HTLC transaction
    /// @param storemanGroupPK  PK of storemanGroup
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event InboundRevokeLogger(bytes32 indexed xHash, bytes tokenOrigAccount, bytes storemanGroupPK);

    /// @notice                 event of exchange original chain token with WERC20 token request
    /// @param storemanGroupPK  PK of storemanGroup, where the original chain token come from
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param userOrigAccount  account of original chain, used to receive token
    /// fee              exchange fee
    /// @param tokenOrigAccount account of original chain token
    event OutboundLockLogger(bytes32 indexed xHash, uint value, bytes userOrigAccount, bytes tokenOrigAccount, bytes storemanGroupPK);
    /// @notice                 event of refund WERC20 token from exchange original chain token with WERC20 token HTLC transaction
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event OutboundRedeemLogger(bytes32 indexed hashX, bytes32 indexed x, bytes tokenOrigAccount);
    /// @notice                 event of revoke exchange original chain token with WERC20 token HTLC transaction
    /// @param wanAddr          address of user
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event OutboundRevokeLogger(address indexed wanAddr, bytes32 indexed xHash, bytes tokenOrigAccount);

    /// @notice                 event of store debt lock
    /// @param srcStoremanPK    PK of src storeman
    /// @param dstStoremanPK    PK of dst storeman
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param tokenOrigAccount account of original chain token
    event DebtLockLogger(bytes dstStoremanPK, bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes srcStoremanPK);
    /// @notice                 event of refund storeman debt
    /// @param storemanGroupPK  PK of storemanGroup, used to receive WERC20 token
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event DebtRedeemLogger(bytes32 indexed xHash, bytes32 x, bytes tokenOrigAccount, bytes storemanGroupPK);
    /// @notice                 event of revoke storeman debt
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event DebtRevokeLogger(address indexed wanAddr, bytes storemanGroupPK, bytes32 indexed xHash, bytes tokenOrigAccount);

    /**
     *
     * MODIFIERS
     *
     */

    /// @dev Check relevant contract addresses must be initialized before call its method
    modifier initialized() {
        require(tokenManager != ITokenManager(address(0)), "Token manager is null");
        // require(storemanGroupAdmin != address(0));
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
        returns(bool)
    {
        require(tokenManager.isTokenRegistered(tokenOrigAccount), "Token is not registered");

        // bytes32 mHash = sha256(abi.encode(tokenOrigAccount, xHash, wanAddr, value, storemanGroupPK));
        // require(verifySignature(mHash, storemanGroupPK, r, s), "Signature is incorrect");

        htlcData.addSmgTx(xHash, value, wanAddr, storemanGroupPK);
        require(quotaData.inLock(tokenOrigAccount, storemanGroupPK, value), "Quota lock failed");

        return true;
    }

    /// @notice                 request exchange original chain token with WERC20 token(to prevent collision, x must be a 256bit random big int)
    /// @param tokenOrigAccount account of original chain token
    /// @param xHash            hash of HTLC random number
    /// @param storemanGroupPK  PK of storeman group
    /// @param userOrigAccount  account of original chain, used to receive token
    /// @param value            exchange value
    function outUserLock(bytes tokenOrigAccount, bytes32 xHash, bytes userOrigAccount, uint value, bytes storemanGroupPK)
        external
        initialized
        notHalted
        payable
    {
        require(tx.origin == msg.sender, "Contract sender is not allowed");
        require(tokenManager.isTokenRegistered(tokenOrigAccount), "Token is not registered");

        // check withdraw fee
        uint fee = getOutboundFee(tokenOrigAccount, storemanGroupPK, value);
        require(msg.value >= fee, "Transferred fee is not enough");

        uint left = (msg.value).sub(fee);
        if (left != 0) {
            (msg.sender).transfer(left);
        }

        htlcData.addUserTx(xHash, value, userOrigAccount, storemanGroupPK);

        require(quotaData.outLock(tokenOrigAccount, storemanGroupPK, value), "Outbound quota lock failed");

        address instance;
        (,,,instance,,,,) = tokenManager.getTokenInfo(tokenOrigAccount);
        require(IWRC20Protocol(instance).transferFrom(msg.sender, this, value), "Lock token failed");

        mapXHashFee[xHash] = fee; // in wan coin

        emit OutboundLockLogger(xHash, value, userOrigAccount, tokenOrigAccount, storemanGroupPK);
    }

    /// @notice                 refund WRC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               HTLC random number
    function inUserRedeem(bytes tokenOrigAccount, bytes32 x)
        external
        initialized
        notHalted
    {
        bytes32 xHash = htlcData.redeemSmgTx(x);

        address userAddr;
        uint value;
        bytes memory storemanGroupPK;
        (userAddr, value, storemanGroupPK) = htlcData.getSmgTx(xHash);

        quotaData.inRedeem(tokenOrigAccount, storemanGroupPK, value);

        tokenManager.mintToken(tokenOrigAccount, userAddr, value);

        emit InboundRedeemLogger(userAddr, storemanGroupPK, xHash, x, tokenOrigAccount);
    }

    /// @notice                 refund WRC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  x               HTLC random number
    function outSmgRedeem(bytes tokenOrigAccount, bytes32 x, bytes r, bytes s)
        external
        initialized
        notHalted
    {
        bytes32 xHash = htlcData.redeemUserTx(x);

        uint value;
        bytes memory storemanGroupPK;
        (, , value, storemanGroupPK) = htlcData.getUserTx(xHash);

        // verifySignature(sha256(abi.encode(tokenOrigAccount, x)), storemanGroupPK, r, s);
        quotaData.outRedeem(tokenOrigAccount, storemanGroupPK, value);

        tokenManager.burnToken(tokenOrigAccount, value);

        // Add fee to storeman group
        mapStoremanFee[storemanGroupPK].add(mapXHashFee[xHash]);

        emit OutboundRedeemLogger(xHash, x, tokenOrigAccount);
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAccount account of original chain token
    /// @param xHash            hash of HTLC random number
    /// @param  r               signature
    /// @param  s               signature
    function inSmgRevoke(bytes tokenOrigAccount, bytes32 xHash, bytes r, bytes s)
        external
        initialized
        notHalted
    {
        htlcData.revokeSmgTx(xHash);

        uint value;
        bytes memory storemanGroupPK;
        (, value, storemanGroupPK) = htlcData.getSmgTx(xHash);

        // bytes32 mHash = sha256(abi.encode(tokenOrigAccount, xHash));
        // verifySignature(mHash, storemanGroupPK, r, s);

        quotaData.inRevoke(tokenOrigAccount, storemanGroupPK, value);

        emit InboundRevokeLogger(xHash, tokenOrigAccount, storemanGroupPK);
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
        uint value;
        bytes memory storemanGroupPK;
        address instance;
        uint revokeFeeRatio;
        uint ratioPrecise;

        htlcData.revokeUserTx(xHash);

        (source, , value, storemanGroupPK) = htlcData.getUserTx(xHash);

        quotaData.outRevoke(tokenOrigAccount, storemanGroupPK, value);

        (,,,instance,,,,) = tokenManager.getTokenInfo(tokenOrigAccount);
        require(IWRC20Protocol(instance).transfer(source, value), "Transfer token failed");

        (revokeFeeRatio, ratioPrecise) = htlcData.getGlobalInfo();
        uint revokeFee = mapXHashFee[xHash].mul(revokeFeeRatio).div(ratioPrecise);
        uint left = mapXHashFee[xHash].sub(revokeFee);

        if (revokeFee > 0) {
            mapStoremanFee[storemanGroupPK].add(revokeFee);
        }

        if (left > 0) {
            source.transfer(left);
        }

        emit OutboundRevokeLogger(source, xHash, tokenOrigAccount);
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

}
