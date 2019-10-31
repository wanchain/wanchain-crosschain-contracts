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

interface StoremanGroupRegistrarInterface {
    function mapStoremanGroup(bytes, bytes) external view returns(uint, uint, uint, uint, address, uint);
    function setSmgWhiteList(bytes, bytes) external;
    function storemanGroupRegisterByDelegate(bytes, bytes, uint, uint) external returns (uint);
    function smgApplyUnregisterByDelegate(bytes, bytes) external;
    function storemanGroupUpdatePK(bytes, bytes, bytes, bytes, bytes) external;
    function smgWithdrawDepositByDelegate(bytes, bytes) external returns (uint, uint);

    function testRegister(bytes, bytes, uint, uint) external;
}

interface StoremanGroupDepositInterface {
    function storemanGroupClaimSystemBonus(bytes, bytes) external returns (bool, address, uint);
    function smgClaimSystemBonusByDelegate(bytes, bytes) external returns (bool, address, uint);
    function depositSmgBonus(bytes, uint) external;
    function feeReceiver(bytes, bytes) external returns (address);
}

contract StoremanGroupPKAdmin is Halt{
    using SafeMath for uint;
    
    /// storeman registrar instance address
    address public storemanRegistrar;
    /// storeman deposit instance address
    address public storemanDeposit;
    /// storeman deposit receiver instance address
    address public storemanTokenReceiver;

    /**
     *
     * Modifiers
     *
     */
    modifier initialized() {
        require(storemanRegistrar != address(0));
        require(storemanDeposit != address(0));
        require(storemanTokenReceiver != address(0));
        _;
    }

    /**
     *
     * EVENTS
     *
     */   
        
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param tokenOrigAddr           token account of original chain
    /// @param smgWanPK                   smgWanPK 
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    /// @param txFeeRatio                 storeman fee ratio
    event StoremanGroupRegistrationLogger(bytes tokenOrigAddr, bytes indexed smgWanPK, uint wanDeposit, uint quota, uint txFeeRatio);
    
    /// @notice                           event for bonus deposit
    /// @dev                              event for bonus deposit 
    /// @param tokenOrigAddr           token account of original chain
    /// @param sender                     sender for bonus
    /// @param wancoin                    deposit wancoin number
    event StoremanGroupDepositBonusLogger(bytes tokenOrigAddr, address indexed sender, uint indexed wancoin);
    
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param smgWanPK                 storeman PK
    /// @param tokenOrigAddr           token account of original chain
    event SmgEnableWhiteListLogger(bytes indexed smgWanPK, bytes tokenOrigAddr);   
        
    /// @notice                           event for applying storeman group unregister 
    /// @param tokenOrigAddr           token account of original chain
    /// @param smgWanPK                 storemanGroup address
    /// @param applyTime                  the time for storeman applying unregister    
    event StoremanGroupApplyUnRegistrationLogger(bytes tokenOrigAddr, bytes indexed smgWanPK, uint indexed applyTime);
    
    /// @notice                           event for storeman group withdraw deposit
    /// @param tokenOrigAddr           token account of original chain
    /// @param smgWanPK                   storemanGroup PK 
    /// @param actualReturn               the time for storeman applying unregister       
    /// @param deposit                    deposit in the first place
    event StoremanGroupWithdrawLogger(bytes tokenOrigAddr, bytes indexed smgWanPK, uint indexed actualReturn, uint deposit);
    
    /// @notice                           event for storeman group claiming system bonus
    /// @param tokenOrigAddr           token account of original chain
    /// @param bonusRecipient             storemanGroup address
    /// @param bonus                      the bonus for storeman claim       
    event StoremanGroupClaimSystemBonusLogger(bytes tokenOrigAddr, address indexed bonusRecipient, uint indexed bonus);
    
    /// @notice                           event for storeman group be punished
    /// @param tokenOrigAddr           token account of original chain
    /// @param smgWanAddr                 storeman address
    /// @param punishPercent              punish percent of deposit
    event StoremanGroupPunishedLogger(bytes tokenOrigAddr, address indexed smgWanAddr, uint indexed punishPercent);   

    /// @notice event for transfer deposit to specified address
    /// @param smgAddress   storeman address
    /// @param tokenOrigAddr  token account of original chain
    /// @param destAddress the destination address of deposit
    event SmgTranferDepositLogger(bytes tokenOrigAddr, address indexed smgAddress,address destAddress,uint deposit);


    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                           function for get storemanGroup info
    /// @param tokenOrigAddr           token account of original chain
    /// @param storemanGroup            the storeman group info on original chain
    function mapStoremanGroup(bytes tokenOrigAddr, bytes storemanGroup)
        external
        view
        initialized
        returns (uint, uint, uint, uint, address, uint)
    {
        return StoremanGroupRegistrarInterface(storemanRegistrar).mapStoremanGroup(tokenOrigAddr, storemanGroup);
    }

    /// @notice              Set storeman group storage instance address
    /// @param regAddr       Storeman group registrar instance address
    /// @param depAddr       Storeman group deposit instance address
    /// @param rcvAddr       Storeman group deposit receiver instance address
    function setStoremanGroupInfo(address regAddr, address depAddr, address rcvAddr)
        public
        onlyOwner
        isHalted
    {
        require(regAddr != address(0)&& depAddr != address(0)&&rcvAddr != address(0));
        storemanRegistrar = regAddr;
        storemanDeposit = depAddr;
        storemanTokenReceiver = rcvAddr;
    }


    /// @notice                  function for setting smg white list by owner
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup   storemanGroup PK for whitelist    
    function setSmgWhiteList(bytes tokenOrigAddr, bytes storemanGroup)
        public
        onlyOwner
        initialized
    {
        StoremanGroupRegistrarInterface(storemanRegistrar).setSmgWhiteList(tokenOrigAddr, storemanGroup);
        emit SmgEnableWhiteListLogger(storemanGroup, tokenOrigAddr);
    }    
                
    /// @notice                  function for storeman register by sender this method should be
    ///                          invoked by a storemanGroup registration proxy or wanchain foundation
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup   the storeman group PK address  
    /// @param txFeeRatio        the transaction fee required by storeman group  
    function storemanGroupRegisterByDelegate(bytes tokenOrigAddr, bytes storemanGroup, uint txFeeRatio)
        public
        payable
        notHalted
        initialized
    {
        var quota = StoremanGroupRegistrarInterface(storemanRegistrar).storemanGroupRegisterByDelegate(tokenOrigAddr, storemanGroup, txFeeRatio, msg.value);
        storemanTokenReceiver.transfer(msg.value);

        /// fire event
        emit StoremanGroupRegistrationLogger(tokenOrigAddr, storemanGroup, msg.value, quota,txFeeRatio);
    }  

     /**********************************
      *
      * BEGIN DEBUG PURPOSE
      *
      **********************************/

     /// @notice                  function for storeman register by sender this method should be
     ///                          invoked by a storemanGroup registration proxy or wanchain foundation
     /// @param tokenOrigAddr  token account of original chain
     /// @param storemanGroup   the storeman group PK address
     /// @param txFeeRatio        the transaction fee required by storeman group
     function runTest(bytes tokenOrigAddr, bytes storemanGroup, uint txFeeRatio, uint func)
         public
         payable
         notHalted
         initialized
     {
         StoremanGroupRegistrarInterface(storemanRegistrar).testRegister(tokenOrigAddr, storemanGroup, txFeeRatio, msg.value);
     }

     /**********************************
      *
      * END DEBUG PURPOSE
      *
      **********************************/
    /// @notice                           apply unregistration through a proxy
    /// @dev                              apply unregistration through a proxy
    /// @param tokenOrigAddr           token account of original chain
    /// @param storemanGroup            PK of storemanGroup 
    function smgApplyUnregisterByDelegate(bytes tokenOrigAddr, bytes storemanGroup)
        public
        notHalted
        initialized
    {
        StoremanGroupRegistrarInterface(storemanRegistrar).smgApplyUnregisterByDelegate(tokenOrigAddr, storemanGroup);

        // fire event
        emit StoremanGroupApplyUnRegistrationLogger(tokenOrigAddr, storemanGroup, now);
    }

                
    /// @notice                       Update storeman group PK
    /// @param tokenOrigAddr       token account of original chain
    /// @param oldStoremanGroupPK     the old storeman group PK to be updated
    /// @param newStoremanGroupPK     the new storeman group PK 
    function storemanGroupUpdatePK(bytes tokenOrigAddr, bytes oldStoremanGroupPK, bytes newStoremanGroupPK, bytes R, bytes s)
        public
        notHalted
        initialized
    {
        StoremanGroupRegistrarInterface(storemanRegistrar).storemanGroupUpdatePK(tokenOrigAddr, oldStoremanGroupPK, newStoremanGroupPK, R, s);

        // TODO: emit event
    }

    /// @notice                           withdraw deposit through a proxy
    /// @dev                              withdraw deposit through a proxy
    /// @param tokenOrigAddr           token account of original chain
    /// @param storemanGroup            storemanGroup PK 
    function smgWithdrawDepositByDelegate(bytes tokenOrigAddr, bytes storemanGroup)
        public
        notHalted
        initialized
    {
        var (restBalance, deposit) = StoremanGroupRegistrarInterface(storemanRegistrar).smgWithdrawDepositByDelegate(tokenOrigAddr, storemanGroup);

        emit StoremanGroupWithdrawLogger(tokenOrigAddr, storemanGroup, restBalance, deposit);
    }

    /// @notice                           function for storeman claiming system bonus
    /// @dev                              function for storeman claiming system bonus
    /// @param tokenOrigAddr           token account of original chain
    /// @param storemanPK            storemanGroup PK 
    function storemanGroupClaimSystemBonus(bytes tokenOrigAddr, bytes storemanPK)
        public
        notHalted
        initialized
    {
        var (isClaim, rcvr, amount) = StoremanGroupDepositInterface(storemanDeposit).storemanGroupClaimSystemBonus(tokenOrigAddr, storemanPK);
        if (isClaim) {
            emit StoremanGroupClaimSystemBonusLogger(tokenOrigAddr, rcvr, amount);
        }
    }

    /// @notice                           function for storeman claiming system bonus through a proxy  
    /// @dev                              function for storeman claiming system bonus through a proxy
    /// @param tokenOrigAddr           token account of original chain
    /// @param storemanGroup            storemanGroup PK 
    function smgClaimSystemBonusByDelegate(bytes tokenOrigAddr, bytes storemanGroup)
        public
        notHalted
        initialized
    {
        var (isClaim, rcvr, amount) = StoremanGroupDepositInterface(storemanDeposit).smgClaimSystemBonusByDelegate(tokenOrigAddr, storemanGroup);
        if (isClaim) {
            emit StoremanGroupClaimSystemBonusLogger(tokenOrigAddr, rcvr, amount);
        }
    }

    /// @notice                           function for bonus deposit
    /// @dev                              function for bonus deposit
    /// @param tokenOrigAddr           token account of original chain
    function depositSmgBonus(bytes tokenOrigAddr)
        public
        payable
        onlyOwner
        initialized
    {
        StoremanGroupDepositInterface(storemanDeposit).depositSmgBonus(tokenOrigAddr, msg.value);

        emit StoremanGroupDepositBonusLogger(tokenOrigAddr, msg.sender, msg.value);
    }

    /// @notice                 receive fee for participant in outbound 
    /// @param tokenOrigAddr token account of original chain
    /// @param storemanGroup  PK of storeman group
    function feeReceiver(bytes tokenOrigAddr, bytes storemanGroup)
        external 
        notHalted
        initialized
        returns (address)
    {
        return StoremanGroupDepositInterface(storemanDeposit).feeReceiver(tokenOrigAddr, storemanGroup);
    }

    /// @notice function for destroy contract
    function kill() 
        public
        isHalted
        onlyOwner
    {
        selfdestruct(owner);
    } 

    /// @notice fallback function
    function () public payable {
       revert();
    }

}  

