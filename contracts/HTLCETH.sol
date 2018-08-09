/*

  Copyright 2018 Wanchain Foundation.

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
//  Code style according to: https://github.com/wanchain/wanchain-token/blob/master/style-guide.rst

pragma solidity ^0.4.11;

import "./HTLCBase.sol";


contract HTLCETH is HTLCBase {

    /**
    *
    * EVENTS
    *
    **/

    /// @notice            event of exchange WETH with ETH request
    /// @param user        address of user
    /// @param storeman    storeman address
    /// @param xHash       hash of HTLC random number
    /// @param value       exchange value
    /// @param wanAddr     wanchain address to receive WETH
    event ETH2WETHLock(address indexed user, address indexed storeman, bytes32 indexed xHash, uint value, address wanAddr);
    /// @notice            event of refund ETH from exchange WETH with ETH HTLC transaction
    /// @param storeman    address of storeman
    /// @param user        address of user
    /// @param xHash       hash of HTLC random number
    /// @param x           HTLC random number
    event ETH2WETHRefund(address indexed storeman, address indexed user, bytes32 indexed xHash, bytes32 x);
    /// @notice            event of revoke exchange WETH with ETH HTLC transaction
    /// @param user        address of user
    /// @param xHash       hash of HTLC random number
    event ETH2WETHRevoke(address indexed user, bytes32 indexed xHash);
    /// @notice            event of exchange ETH with WETH request
    /// @param storeman    address of storeman
    /// @param user        address of user
    /// @param xHash       hash of HTLC random number
    /// @param value       exchange value
    event WETH2ETHLock(address indexed storeman, address indexed user, bytes32 indexed xHash, uint value);
    /// @notice            event of refund ETH from exchange ETH with WETH HTLC transaction
    /// @param user        address of user, used to receive ETH
    /// @param storeman    address of storeman where the ETH come from
    /// @param xHash       hash of HTLC random number
    /// @param x           HTLC random number
    event WETH2ETHRefund(address indexed user, address indexed storeman, bytes32 indexed xHash, bytes32 x);
    /// @notice            event of revoke exchange ETH with WETH HTLC transaction
    /// @param storeman    address of storeman
    /// @param xHash       hash of HTLC random number
    event WETH2ETHRevoke(address indexed storeman, bytes32 indexed xHash);

    /**
    *
    * MANIPULATIONS
    *
    */
    
    /// @notice         request exchange WETH with ETH (to prevent collision, x must be a 256bit random bigint) 
    /// @param xHash    hash of HTLC random number
    /// @param storeman address of storeman
    /// @param wanAddr  address of wanchain used to receive WETH
    function eth2wethLock(bytes32 xHash, address storeman, address wanAddr) 
        public 
        notHalted
        payable
        returns(bool) 
    {
        addHTLCTx(TxDirection.Coin2Wtoken, msg.sender, storeman, xHash, msg.value, true, wanAddr);
        emit ETH2WETHLock(msg.sender, storeman, xHash, msg.value, wanAddr);
        return true;
    }

    /// @notice  refund ETH from the HTLC transaction of exchange WETH with ETH(must be called before HTLC timeout)
    /// @param x HTLC random number
    function eth2wethRefund(bytes32 x) 
        public 
        notHalted
        returns(bool) 
    {
        bytes32 xHash = refundHTLCTx(x, TxDirection.Coin2Wtoken);

        // transfer eth
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        info.destination.transfer(info.value);

        emit ETH2WETHRefund(info.destination, info.source, xHash, x);
        return true;
    }

    /// @notice      revoke HTLC transaction of exchange WETH with ETH(must be called after HTLC timeout)
    /// @notice      the revoking fee will be sent to storeman
    /// @param xHash hash of HTLC random number
    function eth2wethRevoke(bytes32 xHash) 
        public 
        notHalted
        returns(bool) 
    {
        revokeHTLCTx(xHash, TxDirection.Coin2Wtoken, false);

        // transfer eth
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        
        uint fee = info.value.mul(revokeFeeRatio).div(RATIO_PRECISE);
        uint left = info.value.sub(fee);
        
        if (left > 0) {
            info.source.transfer(left);
        }

        if (fee > 0) {
            info.destination.transfer(fee);
        }

        emit ETH2WETHRevoke(info.source, xHash);
        return true;
    }

    /// @notice         request exchange ETH with WETH (to prevent collision, x must be a 256bit random bigint) 
    /// @param xHash    hash of HTLC random number
    /// @param user     address of user, used to receive ETH
    function weth2ethLock(bytes32 xHash, address user) 
        public 
        notHalted
        payable 
        returns(bool) 
    {
        addHTLCTx(TxDirection.Wtoken2Coin, msg.sender, user, xHash, msg.value, false, address(0x00));
        emit WETH2ETHLock(msg.sender, user, xHash, msg.value);
        return true;
    }
    
    /// @notice  refund ETH from the HTLC transaction of exchange ETH with WETH(must be called before HTLC timeout)
    /// @param x HTLC random number
    function weth2ethRefund(bytes32 x) 
        public 
        notHalted
        returns(bool) 
    {
        bytes32 xHash = refundHTLCTx(x, TxDirection.Wtoken2Coin);
        
        // transfer eth
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        info.destination.transfer(info.value);

        emit WETH2ETHRefund(info.destination, info.source, xHash, x);
        return true;
    }

    /// @notice      revoke HTLC transaction of exchange ETH with WETH(must be called after timeout)
    /// @param xHash hash of HTLC random number
    function weth2ethRevoke(bytes32 xHash) 
        public 
        notHalted
        returns(bool) 
    {
        revokeHTLCTx(xHash, TxDirection.Wtoken2Coin, false);

        // transfer eth
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        info.source.transfer(info.value);

        emit WETH2ETHRevoke(info.source, xHash);
        return true;
    }

}