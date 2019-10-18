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
    function redeem(bytes, bytes32) external returns (bool);
    function revoke(bytes,  bytes32, bytes, bytes) external returns (bool);
}

interface OutboundHTLCInterface {
    function lock(bytes, bytes32, address, bytes, uint, bytes) external returns (bool);
    function redeem(bytes, bytes32, bytes, bytes) external returns (bool);
    function revoke(bytes, bytes32) external returns (bool);
}

interface DebtTransferHTLCInterface {
    function lock(bytes, bytes32, bytes, bytes, bytes, bytes) external returns (bool);
    function redeem(bytes, bytes32, bytes, bytes) external returns (bool);
    function revoke(bytes, bytes32, bytes, bytes) external returns (bool);
}

contract HTLCWAN {

    /// Inbound HTLC instance address
    address public inboundHTLC;
    /// Outbound HTLC instance address
    address public outboundHTLC;
    /// Storeman debt instance address
    address public debtHTLC;

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

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                 request exchange WERC20 token with original chain token(to prevent collision, x must be a 256bit random bigint) 
    /// @param  tokenOrigAccount  account of original chain token  
    /// @param  xHash           hash of HTLC random number
    /// @param  wanAddr         address of user, used to receive WERC20 token
    /// @param  value           exchange value
    /// @param  storemanPK      PK of storeman
    /// @param  R               signature
    /// @param  s               signature
     function inboundLock(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanPK, bytes R, bytes s) 
         public 
         initialized 
         notHalted
         returns(bool) 
     {
         return InboundHTLCInterface(inboundHTLC).lock(tokenOrigAccount, xHash, wanAddr, vaule, storemanPK, R, s);
     }

    /// @notice                 refund WERC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token  
    /// @param  x               HTLC random number
    function inboundRedeem(bytes tokenOrigAccount, bytes32 x) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        return InboundHTLCInterface(inboundHTLC).redeem(tokenOrigAccount, x);
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAccount account of original chain token  
    /// @param xHash            hash of HTLC random number
    /// @param  R               signature
    /// @param  s               signature
    function inboundRevoke(bytes tokenOrigAccount, bytes32 xHash, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        return InboundHTLCInterface(inboundHTLC).revoke(tokenOrigAccount, xHash, R, s);
    }

    /// @notice                 request exchange original chain token with WERC20 token(to prevent collision, x must be a 256bit random bigint)
    /// @param tokenOrigAccount account of original chain token  
    /// @param xHash            hash of HTLC random number
    /// @param storemanGroupPK  PK of storeman group
    /// @param userOrigAccount  account of original chain, used to receive token
    /// @param value            exchange value
    function outboundLock(bytes tokenOrigAccount, bytes32 xHash, address storemanGroup, bytes userOrigAccount, uint value, bytes storemanGroupPK) 
        public 
        initialized
        notHalted
        payable
        returns(bool) 
    {
        return OutboundHTLCInterface(outboundHTLC).lock(tokenOrigAccount, xHash, storemanGroup, userOrigAccount, vaule, storemanGroupPK);
    }

    /// @notice                 refund WERC20 token from the HTLC transaction of exchange original chain token with WERC20 token(must be called before HTLC timeout)
    /// @param tokenOrigAccount account of original chain token  
    /// @param x                HTLC random number
    /// @param R                signature
    /// @param s                signature
    function outboundRedeem(bytes tokenOrigAccount, bytes32 x, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        return OutboundHTLCInterface(outboundHTLC).redeem(tokenOrigAccount, x, R, s);
    }

    /// @notice                 revoke HTLC transaction of exchange original chain token with WERC20 token(must be called after HTLC timeout)
    /// @param  tokenOrigAccount  account of original chain token  
    /// @notice                 the revoking fee will be sent to storeman
    /// @param  xHash           hash of HTLC random number
    function outboundRevoke(bytes tokenOrigAccount, bytes32 xHash) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        return OutboundHTLCInterface(outboundHTLC).revoke(tokenOrigAccount, xHash);
    }
    
    /// @notice                 lock storeman debt 
    /// @param  tokenOrigAccount  account of original chain token  
    /// @param  xHash           hash of HTLC random number
    /// @param  srcStoremanPK   PK of src storeman
    /// @param  dstStoremanPK   PK of dst storeman
    /// @param  R               signature
    /// @param  s               signature
     function lockStoremanDebt(bytes tokenOrigAccount, bytes32 xHash, bytes srcStoremanPK, bytes dstStoremanPK, bytes R, bytes s) 
         public 
         initialized 
         notHalted
         returns(bool) 
     {
         return DebtTransferHTLCInterface(debtHTLC).lock(tokenOrigAccount, xHash, srcStoremanPK, dstStoremanPK, R, s);
     }

    /// @notice                 refund WERC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token  
    /// @param  x               HTLC random number
    function redeemStoremanDebt(bytes tokenOrigAccount, bytes32 x, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        return DebtTransferHTLCInterface(debtHTLC).redeem(tokenOrigAccount, x, R, s);
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAccount account of original chain token  
    /// @param xHash            hash of HTLC random number
    /// @param  R               signature
    /// @param  s               signature
    function revokeStoremanDebt(bytes tokenOrigAccount, bytes32 xHash, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        return DebtTransferHTLCInterface(debtHTLC).revoke(tokenOrigAccount, xHash, R, s);
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
