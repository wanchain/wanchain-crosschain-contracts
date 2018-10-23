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

// import "./HTLCBase.sol";

/**
 * Math operations with safety checks
 */
library SafeMath {
  function mul(uint a, uint b) internal pure returns (uint) {
    uint c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function div(uint a, uint b) internal pure returns (uint) {
    assert(b > 0);
    uint c = a / b;
    assert(a == b * c + a % b);
    return c;
  }

  function sub(uint a, uint b) internal pure returns (uint) {
    assert(b <= a);
    return a - b;
  }

  function add(uint a, uint b) internal pure returns (uint) {
    uint c = a + b;
    assert(c >= a);
    return c;
  }

  function max64(uint64 a, uint64 b) internal pure returns (uint64) {
    return a >= b ? a : b;
  }

  function min64(uint64 a, uint64 b) internal pure returns (uint64) {
    return a < b ? a : b;
  }

  function max256(uint256 a, uint256 b) internal pure returns (uint256) {
    return a >= b ? a : b;
  }

  function min256(uint256 a, uint256 b) internal pure returns (uint256) {
    return a < b ? a : b;
  }  
}
contract Owned {

    /// @dev `owner` is the only address that can call a function with this
    /// modifier
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    address public owner;

    /// @notice The Constructor assigns the message sender to be `owner`
    function Owned() public {
        owner = msg.sender;
    }

    address public newOwner;

    /// @notice `owner` can step down and assign some other address to this role
    /// @param _newOwner The address of the new owner. 0x0 can be used to create
    ///  an unowned neutral vault, however that cannot be undone
    function changeOwner(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }


    function acceptOwnership() public {
        if (msg.sender == newOwner) {
            owner = newOwner;
        }
    }
}

contract Halt is Owned {
    
    bool public halted = true; 
    
    modifier notHalted() {
        require(!halted);
        _;
    }

    modifier isHalted() {
        require(halted);
        _;
    }
    
    function setHalt(bool halt) 
        public 
        onlyOwner
    {
        halted = halt;
    }
}
contract HTLCBase is Halt {
    using SafeMath for uint;

    /**
    *
    * ENUMS
    *
    */

    /// @notice tx info status
    /// @notice uninitialized,locked,refunded,revoked
    enum TxStatus {None, Locked, Refunded, Revoked}

    /// @notice tx direction
    enum TxDirection {Inbound, Outbound}

    /**
    *
    * STRUCTURES
    *
    */

    /// @notice HTLC(Hashed TimeLock Contract) tx info
    struct HTLCTx {
        TxDirection direction;  // HTLC transfer direction
        address  source;        // HTLC transaction source address
        address  destination;   // HTLC transaction destination address
        uint value;             // HTLC transfer value of token
        TxStatus status;        // HTLC transaction status
        uint lockedTime;        // HTLC transaction locked time
        uint beginLockedTime;   // HTLC transaction begin locked time
    }

    /**
    *
    * VARIABLES
    *
    */

    /// @notice mapping of hash(x) to HTLCTx
    mapping(address => mapping(bytes32 => HTLCTx)) public mapXHashHTLCTxs;

    /// @notice mapping of hash(x) to shadow address
    mapping(address => mapping(bytes32 => address)) public mapXHashShadow;

    /// @notice atomic tx needed locked time(in seconds)
    uint public lockedTime;
    
    /// @notice default locked time(in seconds)
    uint public constant DEF_LOCKED_TIME = uint(3600*36);
    
    /// @notice default max UTC time
    uint public constant DEF_MAX_TIME = uint(0xffffffffffffffff);

    /// @notice the fee ratio of revoking operation
    uint public revokeFeeRatio;

    /// @notice revoking fee ratio precise
    /// @notice for example: revokeFeeRatio is 3, meaning that the revoking fee ratio is 3/10000
    uint public constant RATIO_PRECISE = 10000;

    /**
    *
    * MANIPULATIONS
    *
    */
    
    /// Constructor
    function HTLCBase()
        public
    {
        lockedTime = DEF_LOCKED_TIME;
    }

    /// @notice default transfer to contract
    function () 
        public
        payable 
    {
        revert();
    }

    /// @notice destruct SC and transfer balance to owner
    function kill()
        public
        onlyOwner
        isHalted
    {
        selfdestruct(owner);
    }

    /// @notice set locked time(only owner has the right)
    /// @param  time the locked time，in seconds
    function setLockedTime(uint time)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        lockedTime = time;
        return true;
    }

    /// @notice                 get left locked time of the HTLC transaction
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  xHash           hash of HTLC random number
    /// @return time            return left locked time, in seconds. return uint(0xffffffffffffffff) if xHash does not exist
    function getHTLCLeftLockedTime(address tokenOrigAddr, bytes32 xHash) 
        public 
        view 
        returns(uint time) 
    {
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        if (info.status == TxStatus.None) {
            return DEF_MAX_TIME;
        }

        if (now >=  info.beginLockedTime.add(info.lockedTime)) return 0;
        return  info.beginLockedTime.add(info.lockedTime).sub(now);
    }
    
    /// @notice     set revoke fee ratio
    function setRevokeFeeRatio(uint ratio)
        public
        onlyOwner 
        isHalted
        returns (bool)
    {
        require(ratio <= RATIO_PRECISE);
        revokeFeeRatio = ratio;
        return true;
    }

    /// @notice                 check HTLC transaction exist or not
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  xHash           hash of HTLC random number
    /// @return exist           return true if exist
    function xHashExist(address tokenOrigAddr, bytes32 xHash) 
        public 
        view 
        returns(bool exist) 
    {
        return mapXHashHTLCTxs[tokenOrigAddr][xHash].status != TxStatus.None;
    }
    
    /// @notice                 add HTLC transaction info
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  direction       HTLC transaction direction
    /// @param  src             HTLC transaction source address
    /// @param  des             HTLC transaction destination address
    /// @param  xHash           hash of HTLC random number
    /// @param  value           HTLC transfer value of token
    /// @param  isFirstHand     is HTLC first hand trade?
    /// @param  shadow          shadow address. used for receipt coins on opposite block chain
    function addHTLCTx(address tokenOrigAddr, TxDirection direction, address src, address des, bytes32 xHash, uint value, bool isFirstHand, address shadow)
        internal
    {
        require(value != 0);
        require(!xHashExist(tokenOrigAddr, xHash));
        
        mapXHashHTLCTxs[tokenOrigAddr][xHash] = HTLCTx(direction, src, des, value, TxStatus.Locked, isFirstHand ? lockedTime.mul(2) : lockedTime, now);
        if (isFirstHand) mapXHashShadow[tokenOrigAddr][xHash] = shadow;
    }
    
    /// @notice                 refund coins from HTLC transaction
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  x               random number of HTLC
    /// @param  direction       HTLC transaction direction
    /// @return xHash           return hash of HTLC random number
    function redeemHTLCTx(address tokenOrigAddr, bytes32 x, TxDirection direction)
        internal
        returns(bytes32 xHash)
    {
        xHash = keccak256(x);
        
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(info.status == TxStatus.Locked);
        require(info.direction == direction);
        require(info.destination == msg.sender);
        require(now < info.beginLockedTime.add(info.lockedTime));
        
        info.status = TxStatus.Refunded;
        return (xHash);
    }
    
    /// @notice                 revoke HTLC transaction
    /// @param  tokenOrigAddr   address of ERC20 token 
    /// @param  xHash           hash of HTLC random number
    /// @param  direction       HTLC transaction direction
    /// @param  loose           whether give counterparty revoking right
    function revokeHTLCTx(address tokenOrigAddr, bytes32 xHash, TxDirection direction, bool loose)
        internal
    {
        HTLCTx storage info = mapXHashHTLCTxs[tokenOrigAddr][xHash];
        require(info.status == TxStatus.Locked);
        require(info.direction == direction);
        require(now >= info.beginLockedTime.add(info.lockedTime));
        if (loose) {
            require((info.source == msg.sender) || (info.destination == msg.sender));
        } else {
            require(info.source == msg.sender);
        }

        info.status = TxStatus.Revoked;
    }
    
}


interface ERC20Token {
    function approve(address _spender, uint _value) public returns (bool success);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);
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
        require(ERC20Token(tokenOrigAddr).transferFrom(msg.sender, this, value));

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
        require(ERC20Token(tokenOrigAddr).transfer(info.destination, info.value));

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
            require(ERC20Token(tokenOrigAddr).transfer(info.source, left));
        }

        if (fee > 0) {
            require(ERC20Token(tokenOrigAddr).transfer(info.destination, fee));
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
        require(ERC20Token(tokenOrigAddr).transferFrom(msg.sender, this, value));

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
        require(ERC20Token(tokenOrigAddr).transfer(info.destination, info.value));

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
        require(ERC20Token(tokenOrigAddr).transfer(info.source, info.value));

        emit OutboundRevokeLogger(info.source, xHash, tokenOrigAddr);
        return true;
    }

}