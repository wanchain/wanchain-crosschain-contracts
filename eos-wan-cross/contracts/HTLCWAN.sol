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

/**
 * Math operations with safety checks
 */
library SafeMath {

    /**
    * @dev Multiplies two numbers, reverts on overflow.
    */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    /**
    * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
    */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0); // Solidity only automatically asserts when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
    * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    /**
    * @dev Adds two numbers, reverts on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }

    /**
    * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
    * reverts when dividing by zero.
    */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
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

interface InboundHTLCInterface {
    function lock(bytes, bytes32, address, uint, bytes, bytes, bytes) external returns (bool);
    function redeem(bytes, bytes32) external returns (bool, address, bytes, bytes32);
    function revoke(bytes,  bytes32, bytes, bytes) external returns (bool, bytes);
}

interface OutboundHTLCInterface {
    function lock(bytes, bytes32, bytes, uint, uint, bytes) external returns (uint);
    function redeem(bytes, bytes32, bytes, bytes) external returns (bool, bytes32);
    function revoke(bytes, bytes32) external returns (bool, address, bytes);
}

interface DebtTransferHTLCInterface {
    function lock(bytes, bytes32, bytes, bytes, bytes, bytes) external returns (bool);
    function redeem(bytes, bytes32, bytes, bytes) external returns (bool, bytes, bytes32);
    function revoke(bytes, bytes32, bytes, bytes) external returns (bool, address, bytes);
}

contract HTLCWAN is Halt {
    using SafeMath for uint;

    /// Inbound HTLC instance address
    address public inboundHTLC;
    /// Outbound HTLC instance address
    address public outboundHTLC;
    /// Storeman debt instance address
    address public debtHTLC;

    /**
     *
     * EVENTS
     *
     **/

    /// @notice                 event of exchange WERC20 token with original chain token request
    /// @param storemanGroup  PK of storemanGroup
    /// @param wanAddr          address of wanchain, used to receive WERC20 token
    /// @param xHash            hash of HTLC random number
    /// @param value            HTLC value
    /// @param tokenOrigAddr account of original chain token  
    event InboundLockLogger(bytes storemanGroup, address indexed wanAddr, bytes32 indexed xHash, uint value, bytes tokenOrigAddr);
    /// @notice                 event of refund WERC20 token from exchange WERC20 token with original chain token HTLC transaction
    /// @param wanAddr          address of user on wanchain, used to receive WERC20 token
    /// @param storemanGroup  PK of storeman, the WERC20 token minter
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAddr account of original chain token  
    event InboundRedeemLogger(address indexed wanAddr, bytes storemanGroup, bytes32 indexed xHash, bytes32 indexed x, bytes tokenOrigAddr);
    /// @notice                 event of revoke exchange WERC20 token with original chain token HTLC transaction
    /// @param storemanGroup  PK of storemanGroup
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAddr account of original chain token  
    event InboundRevokeLogger(bytes storemanGroup, bytes32 indexed xHash, bytes tokenOrigAddr);

    /// @notice                 event of exchange original chain token with WERC20 token request
    /// @param wanAddr          address of user, where the WERC20 token come from
    /// @param storemanGroup  PK of storemanGroup, where the original chain token come from
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param userOrigAccount  account of original chain, used to receive token
    /// fee              exchange fee
    /// @param tokenOrigAddr account of original chain token  
    event OutboundLockLogger(address indexed wanAddr, bytes storemanGroup, bytes32 indexed xHash, uint value, bytes userOrigAccount, bytes tokenOrigAddr);
    /// @notice                 event of refund WERC20 token from exchange original chain token with WERC20 token HTLC transaction
    /// @param x                HTLC random number
    /// @param tokenOrigAddr account of original chain token  
    event OutboundRedeemLogger(bytes32 indexed hashX, bytes32 indexed x, bytes tokenOrigAddr);
    /// @notice                 event of revoke exchange original chain token with WERC20 token HTLC transaction
    /// @param wanAddr          address of user
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAddr account of original chain token  
    event OutboundRevokeLogger(address indexed wanAddr, bytes32 indexed xHash, bytes tokenOrigAddr);

    /// @notice                 event of store debt lock
    /// @param srcStoremanPK    PK of src storeman
    /// @param dstStoremanPK    PK of dst storeman
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param tokenOrigAddr account of original chain token  
    event DebtLockLogger(bytes srcStoremanPK, bytes dstStoremanPK, bytes32 indexed xHash, uint value, bytes tokenOrigAddr);
    /// @notice                 event of refund storeman debt
    /// @param storemanGroup  PK of storemanGroup, used to receive WERC20 token
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAddr account of original chain token  
    event DebtRedeemLogger(bytes storemanGroup, bytes32 indexed xHash, bytes32 x, bytes tokenOrigAddr);
    /// @notice                 event of revoke storeman debt
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAddr account of original chain token  
    event DebtRevokeLogger(address indexed wanAddr, bytes storemanPK, bytes32 indexed xHash, bytes tokenOrigAddr);

    /**
     *
     * MODIFIERS
     *
     */

    /// @dev Check relevant contract addresses must be initialized before call its method
    modifier initialized() {
        require(inboundHTLC != address(0));
        require(outboundHTLC != address(0));
        require(debtHTLC != address(0));
        _;
    }

    modifier onlyHTLCSC() {
        require(msg.sender == inboundHTLC || msg.sender == outboundHTLC || msg.sender == debtHTLC);
        _;
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                 request exchange WERC20 token with original chain token(to prevent collision, x must be a 256bit random bigint) 
    /// @param  tokenOrigAddr  account of original chain token  
    /// @param  xHash           hash of HTLC random number
    /// @param  wanAddr         address of user, used to receive WERC20 token
    /// @param  value           exchange value
    /// @param  storemanPK      PK of storeman
    /// @param  R               signature
    /// @param  s               signature
     function inboundLock(bytes tokenOrigAddr, bytes32 xHash, address wanAddr, uint value, bytes storemanPK, bytes R, bytes s) 
         public 
         initialized 
         notHalted
         returns(bool) 
     {
         require(InboundHTLCInterface(inboundHTLC).lock(tokenOrigAddr, xHash, wanAddr, value, storemanPK, R, s));
         emit InboundLockLogger(storemanPK, wanAddr, xHash, value, tokenOrigAddr);
     }

    /// @notice                 refund WERC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAddr  account of original chain token  
    /// @param  x               HTLC random number
    function inboundRedeem(bytes tokenOrigAddr, bytes32 x) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        var (res,dest,storemanPK,xhash)=InboundHTLCInterface(inboundHTLC).redeem(tokenOrigAddr, x);
        require(res);
        emit InboundRedeemLogger(dest, storemanPK, xhash, x, tokenOrigAddr);
        return true;
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAddr account of original chain token  
    /// @param xHash            hash of HTLC random number
    /// @param  R               signature
    /// @param  s               signature
    function inboundRevoke(bytes tokenOrigAddr, bytes32 xHash, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        var (res,storemanPK)=InboundHTLCInterface(inboundHTLC).revoke(tokenOrigAddr, xHash, R, s);
        emit InboundRevokeLogger(storemanPK, xHash, tokenOrigAddr);

        return true;
    }

    /// @notice                 request exchange original chain token with WERC20 token(to prevent collision, x must be a 256bit random bigint)
    /// @param tokenOrigAddr account of original chain token  
    /// @param xHash            hash of HTLC random number
    /// @param storemanGroup  PK of storeman group
    /// @param userOrigAccount  account of original chain, used to receive token
    /// @param value            exchange value
    function outboundLock(bytes tokenOrigAddr, bytes32 xHash, bytes userOrigAccount, uint value, bytes storemanGroup) 
        public 
        initialized
        notHalted
        payable
        returns(bool) 
    {
        var fee = OutboundHTLCInterface(outboundHTLC).lock(tokenOrigAddr, xHash, userOrigAccount, value, msg.value, storemanGroup);
        uint left = (msg.value).sub(fee);
        if (left != 0) {
            (msg.sender).transfer(left);
        }
        emit OutboundLockLogger(msg.sender, storemanGroup, xHash, value, userOrigAccount, tokenOrigAddr);
        return true;
    }

    /// @notice                 refund WERC20 token from the HTLC transaction of exchange original chain token with WERC20 token(must be called before HTLC timeout)
    /// @param tokenOrigAddr account of original chain token  
    /// @param x                HTLC random number
    /// @param R                signature
    /// @param s                signature
    function outboundRedeem(bytes tokenOrigAddr, bytes32 x, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        var (res,xhash)=OutboundHTLCInterface(outboundHTLC).redeem(tokenOrigAddr, x, R, s);
        require(res);
        emit OutboundRedeemLogger(xhash, x, tokenOrigAddr);
        return res;
    }

    /// @notice                 revoke HTLC transaction of exchange original chain token with WERC20 token(must be called after HTLC timeout)
    /// @param  tokenOrigAddr  account of original chain token  
    /// @notice                 the revoking fee will be sent to storeman
    /// @param  xHash           hash of HTLC random number
    function outboundRevoke(bytes tokenOrigAddr, bytes32 xHash) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        var (res,src, storemanPK)=OutboundHTLCInterface(outboundHTLC).revoke(tokenOrigAddr, xHash);
        require(res);
        emit OutboundRevokeLogger(src, xHash, tokenOrigAddr);
        return res;
    }
    
    /// @notice                 lock storeman debt 
    /// @param  tokenOrigAddr  account of original chain token  
    /// @param  xHash           hash of HTLC random number
    /// @param  srcStoremanPK   PK of src storeman
    /// @param  dstStoremanPK   PK of dst storeman
    /// @param  R               signature
    /// @param  s               signature
     function lockStoremanDebt(bytes tokenOrigAddr, bytes32 xHash, bytes srcStoremanPK, bytes dstStoremanPK, uint value, bytes R, bytes s) 
         public 
         initialized 
         notHalted
         returns(bool) 
     {
         require(DebtTransferHTLCInterface(debtHTLC).lock(tokenOrigAddr, xHash, srcStoremanPK, dstStoremanPK, R, s));
         emit DebtLockLogger(srcStoremanPK, dstStoremanPK, xHash, value, tokenOrigAddr);

         return true;
     }

    /// @notice                 refund WERC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAddr  account of original chain token  
    /// @param  x               HTLC random number
    function redeemStoremanDebt(bytes tokenOrigAddr, bytes32 x, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        var (res,storemanPK,xHash)=DebtTransferHTLCInterface(debtHTLC).redeem(tokenOrigAddr, x, R, s);
        require(res);
        emit DebtRedeemLogger(storemanPK, xHash, x, tokenOrigAddr);
        return res;

    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAddr account of original chain token  
    /// @param xHash            hash of HTLC random number
    /// @param  R               signature
    /// @param  s               signature
    function revokeStoremanDebt(bytes tokenOrigAddr, bytes32 xHash, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        var (res,src,storemanPK)=DebtTransferHTLCInterface(debtHTLC).revoke(tokenOrigAddr, xHash, R, s);
        require(res);
        emit DebtRevokeLogger(src, storemanPK, xHash, tokenOrigAddr);
        return res;
    }

    /// @notice        transfer token to address
    /// @param dest    receiver
    /// @param amount  amount of value to transfer
    function transferTokenTo(address dest, uint amount) 
        public 
        initialized 
        notHalted
        onlyHTLCSC
        payable
    {
        dest.transfer(amount);
    }

    /// @notice       set inbound HTLC address
    /// @param  addr  inbound HTLC SC address
    function setInboundHTLC(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        inboundHTLC = addr;

        return true;
    }

    /// @notice       set outbound HTLC address
    /// @param  addr  outbound HTLC SC address
    function setOutboundHTLC(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        outboundHTLC = addr;

        return true;
    }

    /// @notice       set storeman debt transfer HTLC address
    /// @param  addr  inbound HTLC SC address
    function setDebtTransferHTLC(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        debtHTLC = addr;

        return true;
    }
}
