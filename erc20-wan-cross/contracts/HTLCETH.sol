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

pragma solidity ^0.4.24;

import "./HTLCBase.sol";

interface ERC20Token {
    function balanceOf(address _owner) public returns (uint balance);
}

contract HTLCETH is HTLCBase {

    /**
    *
    * EVENTS
    * 
    **/

    /// @notice                 a record of a request to exchange WERC20 token  
    /// @param user             address of user initiated the Tx
    /// @param storemanGroup    storemanGroup address
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param wanAddr          wanchain address to receive WERC20 token
    /// @param tokenOrigAddr    address of ERC20 token 
    event InboundLockLogger(address indexed user, address indexed storemanGroup, bytes32 indexed xHash, uint value, address wanAddr, address tokenOrigAddr);
    /// @notice                 event to record refund ERC20 token 
    /// @param storemanGroup    address of storemanGroup
    /// @param user             address of user
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token 
    event InboundRedeemLogger(address indexed storemanGroup, address indexed user, bytes32 indexed xHash, bytes32 x, address tokenOrigAddr);
    /// @notice                 event of revoke ERC20 token 
    /// @param user             address of user
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token 
    event InboundRevokeLogger(address indexed user, bytes32 indexed xHash, address indexed tokenOrigAddr);
    /// @notice                 event recording revoke ERC20 token 
    /// @param storemanGroup    address of storemanGroup
    /// @param user             address of user
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param tokenOrigAddr    address of ERC20 token 
    event OutboundLockLogger(address indexed storemanGroup, address indexed user, bytes32 indexed xHash, uint value, address tokenOrigAddr);
    /// @notice                 event of refund ERC20 token from exchange ERC20 token with WERC20 token HTLC transaction
    /// @param user             address of user, used to receive ERC20 token
    /// @param storemanGroup    address of storemanGroup where the ERC20 token come from
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token 
    event OutboundRedeemLogger(address indexed user, address indexed storemanGroup, bytes32 indexed xHash, bytes32 x, address tokenOrigAddr);
    /// @notice                 event of revoke exchange ERC20 token with WERC20 token HTLC transaction
    /// @param storemanGroup    address of storemanGroup
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAddr    address of ERC20 token 
    event OutboundRevokeLogger(address indexed storemanGroup, bytes32 indexed xHash, address indexed tokenOrigAddr);

    /**
    *
    * PRIVATE METHODS 
    * 
    */

    function transfer(address tokenOrigAddr, address destination, uint value) 
        private 
        notHalted
        returns(bool)
    {
        uint beforeBalance;
        uint afterBalance;
        beforeBalance = ERC20Token(tokenOrigAddr).balanceOf(destination);
        tokenOrigAddr.call(bytes4(keccak256("transfer(address,uint256)")), destination, value);
        afterBalance = ERC20Token(tokenOrigAddr).balanceOf(destination);
        return afterBalance == beforeBalance.add(value);
    }

    function transferFrom(address tokenOrigAddr, address from, address to, uint value)
        private
        notHalted
        returns(bool)
    {
        uint beforeBalance;
        uint afterBalance;
        beforeBalance = ERC20Token(tokenOrigAddr).balanceOf(to);
        tokenOrigAddr.call(bytes4(keccak256("transferFrom(address,address,uint256)")), from, to, value);
        afterBalance = ERC20Token(tokenOrigAddr).balanceOf(to);
        return afterBalance == beforeBalance.add(value);
    }

    /**
    *
    * MANIPULATIONS 
    * 
    */
    
    /// @notice                 request exchange WERC20 token with ERC20 token (to prevent collision, x must be a 256bit random bigint) 
    /// @param tokenOrigAddr    address of ERC20 token 
    /// @param xHash            hash of HTLC random number
    /// @param storemanGroup    address of storemanGroup
    /// @param wanAddr          address of wanchain used to receive WERC token
    /// @param value            amount of token to be transfered
    function inboundLock(address tokenOrigAddr, bytes32 xHash, address storemanGroup, address wanAddr, uint value) 
        public 
        notHalted
        returns(bool) 
    {
        require(transferFrom(tokenOrigAddr, msg.sender, this, value));

        addHTLCTx(tokenOrigAddr, TxDirection.Inbound, msg.sender, storemanGroup, xHash, value, true, wanAddr);
        emit InboundLockLogger(msg.sender, storemanGroup, xHash, value, wanAddr, tokenOrigAddr);
        return true;
    }

    /// @notice                 refund ERC20 token from the HTLC transaction of exchange WERC20 token with ERC20 token(must be called before HTLC timeout)
    /// @param tokenOrigAddr    address of ERC20 token 
    /// @param x                HTLC random number
    function inboundRedeem(address tokenOrigAddr, bytes32 x) 
        public 
        notHalted
        returns(bool) 
    {
        bytes32 xHash = redeemHTLCTx(tokenOrigAddr, x, TxDirection.Inbound);

        // transfer ERC20 token
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(transfer(tokenOrigAddr, info.destination, info.value));

        emit InboundRedeemLogger(info.destination, info.source, xHash, x, tokenOrigAddr);
        return true;
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with ERC20 token (must be called after HTLC timeout)
    /// @param tokenOrigAddr    address of ERC20 token  
    /// @notice                 the revoking fee will be sent to storeman
    /// @param xHash            hash of HTLC random number
    function inboundRevoke(address tokenOrigAddr, bytes32 xHash) 
        public 
        notHalted
        returns(bool) 
    {
        revokeHTLCTx(tokenOrigAddr, xHash, TxDirection.Inbound, false);

        // transfer ERC20 token
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        
        uint fee = info.value.mul(revokeFeeRatio).div(RATIO_PRECISE);
        uint left = info.value.sub(fee);
        
        if (left > 0) {
            require(transfer(tokenOrigAddr, info.source, left));
        }

        if (fee > 0) {
            require(transfer(tokenOrigAddr, info.destination, fee));
        }

        emit InboundRevokeLogger(info.source, xHash, tokenOrigAddr);
        return true;
    }

    /// @notice                 request exchange ERC20 token with WERC20 token (to prevent collision, x must be a 256bit random bigint) 
    /// @param tokenOrigAddr    address of ERC20 token  
    /// @param value            amount of token to be transfered
    /// @param xHash            hash of HTLC random number
    /// @param user             address of user, used to receive ETH
    function outboundLock(address tokenOrigAddr, bytes32 xHash, address user, uint value) 
        public 
        notHalted
        returns(bool) 
    {
        require(transferFrom(tokenOrigAddr, msg.sender, this, value));

        addHTLCTx(tokenOrigAddr, TxDirection.Outbound, msg.sender, user, xHash, value, false, address(0x00));
        emit OutboundLockLogger(msg.sender, user, xHash, value, tokenOrigAddr);
        return true;
    }
    
    /// @notice                 refund ERC20 token from the HTLC transaction of exchange ERC20 token with WERC20 token(must be called before HTLC timeout)
    /// @param tokenOrigAddr    address of ERC20 token  
    /// @param x                HTLC random number
    function outboundRedeem(address tokenOrigAddr, bytes32 x) 
        public 
        notHalted
        returns(bool) 
    {
        bytes32 xHash = redeemHTLCTx(tokenOrigAddr, x, TxDirection.Outbound);
        
        // transfer ERC20 token
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(transfer(tokenOrigAddr, info.destination, info.value));

        emit OutboundRedeemLogger(info.destination, info.source, xHash, x, tokenOrigAddr);
        return true;
    }

    /// @notice                 revoke HTLC transaction of exchange ERC20 token with WERC20 token(must be called after timeout)
    /// @param tokenOrigAddr    address of ERC20 token  
    /// @param xHash            hash of HTLC random number
    function outboundRevoke(address tokenOrigAddr, bytes32 xHash) 
        public 
        notHalted
        returns(bool) 
    {
        revokeHTLCTx(tokenOrigAddr, xHash, TxDirection.Outbound, false);

        // transfer ERC20 token
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(transfer(tokenOrigAddr, info.source, info.value));

        emit OutboundRevokeLogger(info.source, xHash, tokenOrigAddr);
        return true;
    }
}