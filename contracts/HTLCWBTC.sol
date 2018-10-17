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
import "./AdminInterface.sol";
import "./WTokenManagerInterface.sol";



contract HTLCWBTC is HTLCBase {

    /**
    *
    * STRUCTURES
    *
    */
    struct BtcLockedNotice {
        address stmWanAddr;
        address userWanAddr;
        address userBtcAddr;
        bytes32 txHash;
        uint    lockedTimestamp;
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

    /// @notice storeman group admin address
    address public coinAdmin;

    /// @notice transaction fee
    mapping(bytes32 => uint) public mapXHashFee;

    /// @notice notices of having locked on bitcoin blockchain
    mapping(bytes32 => BtcLockedNotice) public mapXHash2BtcLockedNotice;

    /// @notice token index of WBTC
    uint public constant BTC_INDEX = 1;

    /// @notice empty bytes32
    bytes32 public constant EMPTY_BYTE32 = 0x0000000000000000000000000000000000000000000000000000000000000000;

    /**
    *
    * EVENTS
    *
    **/

    /// @notice            event of wallet submit that has locked on bitcoin blockchain
    /// @param stmWanAddr  wanchain address of storeman
    /// @param userWanAddr user wanchain address, used to receive WBTC
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param userBtcAddr user bitcoin address(hash160), witch sent btc to storeman bitcoin address
    /// @param lockedTimestamp locked timestamp in the bitcoin utxo
    event BTC2WBTCLockNotice(address indexed stmWanAddr, address indexed userWanAddr, bytes32 indexed xHash, bytes32 txHash, address userBtcAddr, uint lockedTimestamp);
    /// @notice            event of exchange WBTC with BTC request
    /// @param storeman    address of storeman
    /// @param wanAddr     address of wanchain, used to receive WBTC
    /// @param xHash       hash of HTLC random number
    /// @param value       HTLC value
    event BTC2WBTCLock(address indexed storeman, address indexed wanAddr, bytes32 indexed xHash, uint value);
    /// @notice            event of redeemWBTC from exchange WBTC with BTC HTLC transaction
    /// @param wanAddr     wanchain address of user, used to receive WBTC
    /// @param storeman    wanchain address of storeman, the WBTC minter
    /// @param xHash       hash of HTLC random number
    /// @param x           HTLC random number
    event BTC2WBTCRedeem(address indexed wanAddr, address indexed storeman, bytes32 indexed xHash, bytes32 x);
    /// @notice            event of revoke exchange WBTC with BTC HTLC transaction
    /// @param storeman    address of storeman
    /// @param xHash       hash of HTLC random number
    event BTC2WBTCRevoke(address indexed storeman, bytes32 indexed xHash);
    /// @notice            event of exchange BTC with WBTC request
    /// @param wanAddr     address of user, where the WBTC come from
    /// @param storeman    address of storeman, where the BTC come from
    /// @param xHash       hash of HTLC random number
    /// @param value       exchange value
    /// @param userBtcAddr user bitcoin address, used to receive BTC
    /// @param fee         exchange fee
    event WBTC2BTCLock(address indexed wanAddr, address indexed storeman, bytes32 indexed xHash, uint value, address userBtcAddr, uint fee);
    /// @notice            event of storeman submit that has locked on bitcoin blockchain
    /// @param stmBtcAddr  bitcoin address of storeman, who sent bitcoin to user
    /// @param userBtcAddr bitcoin address of user, used to receive BTC
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param lockedTimestamp locked timestamp in the bitcoin blockchain
    event WBTC2BTCLockNotice(address indexed stmBtcAddr, address indexed userBtcAddr, bytes32 indexed xHash, bytes32 txHash,  uint lockedTimestamp);
    /// @notice            event of redeem WBTC from exchange BTC with WBTC HTLC transaction
    /// @param storeman    address of storeman, used to receive WBTC
    /// @param wanAddr     address of user, where the WBTC come from
    /// @param xHash       hash of HTLC random number
    /// @param x           HTLC random number
    event WBTC2BTCRedeem(address indexed storeman, address indexed wanAddr, bytes32 indexed xHash, bytes32 x);
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
        require(coinAdmin !=  address(0));
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
    /// @param  smgAdminAddr    storeman group admin SC address
    function setAdmin(address smgAdminAddr,address coinAdminAddr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(smgAdminAddr != address(0));
        require(coinAdminAddr != address(0));

        storemanGroupAdmin = smgAdminAddr;
        coinAdmin = coinAdminAddr;

        return true;
    }

    /// @notice            wallet submit that has locked on bitcoin blockchain
    /// @param stmWanAddr  wanchain address of storeman
    /// @param userBtcAddr address of bitcoin, who sent the bitcoin p2sh tx
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param lockedTimestamp locked timestamp in the bitcoin blockchain
    function btc2wbtcLockNotice(address stmWanAddr, address userBtcAddr, bytes32 xHash, bytes32 txHash, uint lockedTimestamp)
        public
        initialized
        notHalted
        returns(bool)
    {
        require(mapXHash2BtcLockedNotice[xHash].lockedTimestamp == 0);
        require(stmWanAddr != address(0x00));
        require(userBtcAddr != address(0x00));
        require(xHash != EMPTY_BYTE32);
        require(txHash != EMPTY_BYTE32);
        require(lockedTimestamp != 0);

        mapXHash2BtcLockedNotice[xHash] = BtcLockedNotice(stmWanAddr, msg.sender, userBtcAddr, txHash, lockedTimestamp);
        emit BTC2WBTCLockNotice(stmWanAddr, msg.sender, xHash, txHash, userBtcAddr, lockedTimestamp);
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

    /// @notice  redeem WBTC from the HTLC transaction of exchange WBTC with BTC(must be called before HTLC timeout)
    /// @param x HTLC random number
    function btc2wbtcRedeem(bytes32 x)
        public
        initialized
        notHalted
        returns(bool)
    {
        bytes32 xHash = sha256(x);
        redeemHTLCTx(xHash, TxDirection.Coin2Wtoken);

        HTLCTx storage info = mapXHashHTLCTxs[xHash];

       if (!WTokenManagerInterface(wbtcManager).mintToken(info.source, info.destination, info.value)) {
            revert();
       }

        emit BTC2WBTCRedeem(info.destination, info.source, xHash, x);
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
    /// @param stmBtcAddr  storeman bitcoin address
    /// @param userWanAddr user wanchain address
    /// @param userBtcAddr user btc ripemd160 address, used to receive BTC
    /// @param xHash       hash of HTLC random number
    /// @param txHash      transaction hash on bitcoin blockchain
    /// @param lockedTimestamp locked timestamp in the bitcoin blockchain
    function wbtc2btcLockNotice(address stmBtcAddr, address userWanAddr, address userBtcAddr, bytes32 xHash, bytes32 txHash, uint lockedTimestamp)
        public
        initialized
        notHalted
        returns(bool)
    {
        require(mapXHash2BtcLockedNotice[xHash].lockedTimestamp == 0);
        require(stmBtcAddr != address(0x00));
        require(userBtcAddr != address(0x00));
        require(xHash != EMPTY_BYTE32);
        require(txHash != EMPTY_BYTE32);
        require(lockedTimestamp != 0);
       // address stmWanAddr;
       // address userWanAddr;
       // address userBtcAddr;
        mapXHash2BtcLockedNotice[xHash] = BtcLockedNotice(stmBtcAddr,userWanAddr,userBtcAddr,txHash, lockedTimestamp);

        emit WBTC2BTCLockNotice(stmBtcAddr, userBtcAddr, xHash, txHash, lockedTimestamp);
        return true;
    }

    /// @notice  redeem WBTC from the HTLC transaction of exchange BTC with WBTC(must be called before HTLC timeout)
    /// @param x HTLC random number
    function wbtc2btcRedeem(bytes32 x)
        public
        initialized
        notHalted
        returns(bool)
    {
        bytes32 xHash = sha256(x);
        redeemHTLCTx(xHash, TxDirection.Wtoken2Coin);
        HTLCTx storage info = mapXHashHTLCTxs[xHash];
        if (!WTokenManagerInterface(wbtcManager).burnToken(info.destination, info.value)) {
            revert();
        }

        info.destination.transfer(mapXHashFee[xHash]);
        emit WBTC2BTCRedeem(info.destination, info.source, xHash, x);
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
        CoinAdminInterface cadmin = CoinAdminInterface(coinAdmin);
        uint defaultPrecise = cadmin.DEFAULT_PRECISE();
        var (coin2WanRatio,,,,,,,,,,,) = cadmin.mapCoinInfo(BTC_INDEX);

        SmgAdminInterface smga = SmgAdminInterface(storemanGroupAdmin);
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