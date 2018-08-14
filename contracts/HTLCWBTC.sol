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
import "./StoremanGroupAdminInterface.sol";
import "./WTokenManagerInterface.sol";



contract HTLCWBTC is HTLCBase {

    /**
    *
    * STRUCTURES
    *
    */

    struct BtcLockedNotice {
        address storeman;
        address userAddr;
        bytes32 txHash;
        uint lockedTimestamp;
    }


    /**
    *
    * VARIABLES
    *
    */

    /// @notice wbtc manager address
    address public wbtcManager;

    /// @notice storeman group admin address
    address public storemanGroupAdmin;

    /// @notice transaction fee
    mapping(bytes32 => uint) public mapXHashFee;

    /// @notice notices of having locked on bitcoin blockchain
    mapping(bytes32 => BtcLockedNotice) public mapXHash2BtcLockedNotice;

    /// @notice token index of WBTC
    uint public constant BTC_INDEX = 1;

    /**
    *
    * EVENTS
    *
    **/

    /// @notice            event of wallet submit that has locked on bitcoin blockchain
    /// @param storeman    address of storeman
    /// @param userWanAddr user address of wanchain, used to receive WBTC
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param lockedTimestamp locked timestamp in the bitcoin blockchain
    event BTC2WBTCLockNotice(address indexed storeman, address indexed userWanAddr, bytes32 indexed xHash, bytes32 txHash,  uint lockedTimestamp);
    /// @notice            event of exchange WBTC with BTC request
    /// @param storeman    address of storeman
    /// @param wanAddr     address of wanchain, used to receive WBTC
    /// @param xHash       hash of HTLC random number
    /// @param value       HTLC value
    event BTC2WBTCLock(address indexed storeman, address indexed wanAddr, bytes32 indexed xHash, uint value);
    /// @notice            event of refund WBTC from exchange WBTC with BTC HTLC transaction
    /// @param wanAddr     address of user on wanchain, used to receive WBTC
    /// @param storeman    address of storeman, the WBTC minter
    /// @param xHash       hash of HTLC random number
    /// @param x           HTLC random number
    event BTC2WBTCRefund(address indexed wanAddr, address indexed storeman, bytes32 indexed xHash, bytes32 x);
    /// @notice            event of revoke exchange WBTC with BTC HTLC transaction
    /// @param storeman    address of storeman
    /// @param xHash       hash of HTLC random number
    event BTC2WBTCRevoke(address indexed storeman, bytes32 indexed xHash);
    /// @notice            event of exchange BTC with WBTC request
    /// @param wanAddr     address of user, where the WBTC come from
    /// @param storeman    address of storeman, where the BTC come from
    /// @param xHash       hash of HTLC random number
    /// @param value       exchange value
    /// @param btcAddr     address of btc, used to receive BTC
    /// @param fee         exchange fee
    event WBTC2BTCLock(address indexed wanAddr, address indexed storeman, bytes32 indexed xHash, uint value, address btcAddr, uint fee);
    /// @notice            event of storeman submit that has locked on bitcoin blockchain
    /// @param storeman    address of storeman
    /// @param userBtcAddr user address of wanchain, used to receive BTC
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param lockedTimestamp locked timestamp in the bitcoin blockchain
    event WBTC2BTCLockNotice(address indexed storeman, address indexed userBtcAddr, bytes32 indexed xHash, bytes32 txHash,  uint lockedTimestamp);
    /// @notice            event of refund WBTC from exchange BTC with WBTC HTLC transaction
    /// @param storeman    address of storeman, used to receive WBTC
    /// @param wanAddr     address of user, where the WBTC come from
    /// @param xHash       hash of HTLC random number
    /// @param x           HTLC random number
    event WBTC2BTCRefund(address indexed storeman, address indexed wanAddr, bytes32 indexed xHash, bytes32 x);
    /// @notice            event of revoke exchange BTC with WBTC HTLC transaction
    /// @param wanAddr     address of user
    /// @param xHash       hash of HTLC random number
    event WBTC2BTCRevoke(address indexed wanAddr, bytes32 indexed xHash);

    /**
    *
    * MODIFIERS
    *
    */

    /// @dev Check WBTCManager address must be initialized before call its method
    modifier initialized() {
        require(wbtcManager != address(0));
        require(storemanGroupAdmin != address(0));
        _;
    }

    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice         set WBTCManager SC address(only owner have the right)
    /// @param  addr    WBTCManager SC address
    function setWBTCManager(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        wbtcManager = addr;
        return true;
    }

    /// @notice         set storeman group admin SC address(only owner have the right)
    /// @param  addr    storeman group admin SC address
    function setStoremanGroupAdmin(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        storemanGroupAdmin = addr;
        return true;
    }

    /// @notice            wallet submit that has locked on bitcoin blockchain
    /// @param storeman    address of storeman
    /// @param userWanAddr address of wanchain, used to receive WBTC
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param lockedTimestamp locked timestamp in the bitcoin blockchain
    function btc2wbtcLockNotice(address storeman, address userWanAddr, bytes32 xHash, bytes32 txHash, uint lockedTimestamp)
        public
        initialized
        notHalted
        returns(bool)
    {
        require(mapXHash2BtcLockedNotice[xHash].lockedTimestamp == 0);
        require(storeman != address(0x00));
        require(userWanAddr != address(0x00));
        require(xHash != 0);
        require(txHash != 0);
        require(lockedTimestamp != 0);

        mapXHash2BtcLockedNotice[xHash] = BtcLockedNotice(storeman, userWanAddr, txHash, lockedTimestamp);
        emit BTC2WBTCLockNotice(storeman, userWanAddr, xHash, txHash, lockedTimestamp);
        return true;
    }

    /// @notice         request exchange WBTC with BTC(to prevent collision, x must be a 256bit random bigint)
    /// @param xHash    hash of HTLC random number
    /// @param wanAddr  address of user, used to receive WBTC
    /// @param value    exchange value
    function btc2wbtcLock(bytes32 xHash, address wanAddr, uint value)
        public
        initialized
        notHalted
        returns(bool)
    {
        addHTLCTx(TxDirection.Coin2Wtoken, msg.sender, wanAddr, xHash, value, false, address(0x00));
        if (!WTokenManagerInterface(wbtcManager).lockQuota(msg.sender, wanAddr, value)) {
            revert();
        }

        emit BTC2WBTCLock(msg.sender, wanAddr, xHash, value);
        return true;
    }

    /// @notice  refund WBTC from the HTLC transaction of exchange WBTC with BTC(must be called before HTLC timeout)
    /// @param x HTLC random number
    function btc2wbtcRefund(bytes32 x)
        public
        initialized
        notHalted
        returns(bool)
    {
        bytes32 xHash= refundHTLCTx(x, TxDirection.Coin2Wtoken);
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        if (!WTokenManagerInterface(wbtcManager).mintToken(info.source, info.destination, info.value)) {
            revert();
        }

        emit BTC2WBTCRefund(info.destination, info.source, xHash, x);
        return true;
    }

    /// @notice revoke HTLC transaction of exchange WBTC with BTC(must be called after HTLC timeout)
    /// @param  xHash  hash of HTLC random number
    function btc2wbtcRevoke(bytes32 xHash)
        public
        initialized
        notHalted
        returns(bool)
    {
        revokeHTLCTx(xHash, TxDirection.Coin2Wtoken, false);
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        if (!WTokenManagerInterface(wbtcManager).unlockQuota(info.source, info.value)) {
            revert();
        }

        emit BTC2WBTCRevoke(info.source, xHash);
        return true;
    }

    /// @notice         request exchange BTC with WBTC(to prevent collision, x must be a 256bit random bigint)
    /// @param xHash    hash of HTLC random number
    /// @param storeman address of storeman, where the BTC come from
    /// @param btcAddr  address of BTC, used to receive BTC
    /// @param value    exchange value
    function wbtc2btcLock(bytes32 xHash, address storeman, address btcAddr, uint value)
        public
        initialized
        notHalted
        payable
        returns(bool)
    {
        require(!isContract(msg.sender));

        // check withdraw fee
        uint fee = getWbtc2BtcFee(storeman, value);
        require(msg.value >= fee);

        addHTLCTx(TxDirection.Wtoken2Coin, msg.sender, storeman, xHash, value, true, btcAddr);
        if (!WTokenManagerInterface(wbtcManager).lockToken(storeman, msg.sender, value)) {
            revert();
        }

        mapXHashFee[xHash] = fee;

        // restore the extra cost
        uint left = msg.value.sub(fee);
        if (left != 0) {
            msg.sender.transfer(left);
        }

        emit WBTC2BTCLock(msg.sender, storeman, xHash, value, btcAddr, fee);
        return true;
    }

    /// @notice            storeman submit that has locked on bitcoin blockchain
    /// @param storeman    address of storeman
    /// @param userBtcAddr address of wanchain, used to receive WBTC
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param lockedTimestamp locked timestamp in the bitcoin blockchain
    function wbtc2btcLockNotice(address storeman, address userBtcAddr, bytes32 xHash, bytes32 txHash, uint lockedTimestamp)
        public
        initialized
        notHalted
        returns(bool)
    {
        require(mapXHash2BtcLockedNotice[xHash].lockedTimestamp == 0);
        require(storeman != address(0x00));
        require(userBtcAddr != address(0x00));
        require(xHash != 0);
        require(txHash != 0);
        require(lockedTimestamp != 0);

        mapXHash2BtcLockedNotice[xHash] = BtcLockedNotice(storeman, userBtcAddr, txHash, lockedTimestamp);
        emit WBTC2BTCLockNotice(storeman, userBtcAddr, xHash, txHash, lockedTimestamp);
        return true;
    }

    /// @notice  refund WBTC from the HTLC transaction of exchange BTC with WBTC(must be called before HTLC timeout)
    /// @param x HTLC random number
    function wbtc2btcRefund(bytes32 x)
        public
        initialized
        notHalted
        returns(bool)
    {
        bytes32 xHash = refundHTLCTx(x, TxDirection.Wtoken2Coin);
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        if (!WTokenManagerInterface(wbtcManager).burnToken(info.destination, info.value)) {
            revert();
        }

        info.destination.transfer(mapXHashFee[xHash]);
        emit WBTC2BTCRefund(info.destination, info.source, xHash, x);
        return true;
    }

    /// @notice        revoke HTLC transaction of exchange BTC with WBTC(must be called after HTLC timeout)
    /// @notice        the revoking fee will be sent to storeman
    /// @param  xHash  hash of HTLC random number
    function wbtc2btcRevoke(bytes32 xHash)
        public
        initialized
        notHalted
        returns(bool)
    {
        revokeHTLCTx(xHash, TxDirection.Wtoken2Coin, true);
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        if (!WTokenManagerInterface(wbtcManager).unlockToken(info.destination, info.source, info.value)) {
            revert();
        }

        uint revokeFee = mapXHashFee[xHash].mul(revokeFeeRatio).div(RATIO_PRECISE);
        uint left = mapXHashFee[xHash].sub(revokeFee);

        if (revokeFee > 0) {
            info.destination.transfer(revokeFee);
        }

        if (left > 0) {
            info.source.transfer(left);
        }

        emit WBTC2BTCRevoke(info.source, xHash);
        return true;
    }

    /// @notice          getting wbtc 2 btc fee
    /// @param  storeman address of storeman
    /// @param  value    HTLC tx value
    /// @return          needful fee
    function getWbtc2BtcFee(address storeman, uint value)
        public
        view
        returns(uint)
    {
        StoremanGroupAdminInterface smga = StoremanGroupAdminInterface(storemanGroupAdmin);
        uint defaultPrecise = smga.DEFAULT_PRECISE();
        var (coin2WanRatio,,,,,,,,,,,) = smga.mapCoinInfo(BTC_INDEX);
        var (,,,txFeeratio,,,) = smga.mapCoinSmgInfo(BTC_INDEX, storeman);
        return value.mul(coin2WanRatio).mul(txFeeratio).div(defaultPrecise).div(defaultPrecise);
    }

    /// @notice      internal function to determine if an address is a contract
    /// @param  addr the address being queried
    /// @return      true if `addr` is a contract
    function isContract(address addr)
        internal
        view
        returns(bool)
    {
        uint size;
        if (addr == 0) return false;
        assembly {
            size := extcodesize(addr)
        }

        return size > 0;
    }

}