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

contract StoremanGroupPKStorage is Halt{
    using SafeMath for uint;
   
    /// admin instance address
    address public storemanGroupAdmin;
    /// storeman registrar instance address
    address public storemanRegistrar;
    /// storeman deposit instance address
    address public storemanDeposit;

    /// a map from addresses to storeman group information (tokenOrigAddr->storemanGroup->StoremanGroup)
    mapping(bytes=>mapping(bytes => StoremanGroup)) private storemanGroupMap;     
    /// a map from addresses to storeman group white list information
    mapping(bytes=>mapping(bytes => bool)) private mapSmgWhiteList;                

    // DEBUG
    event DebugLogger(string name, uint deposit, uint feeRatio, uint blkNo, address snd);


    struct StoremanGroup {
        uint    deposit;                  /// the storeman group deposit in wan coins
        uint    unregisterApplyTime;      /// the time point for storeman group applied unregistration
        uint    txFeeRatio;               /// the fee ratio required by storeman group
        uint    bonusBlockNumber;         /// the start block number for bonus calculation for storeman group
        address initiator;                /// the account for registering a storeman group which provides storeman group deposit
        uint    punishPercent;            /// punish rate of deposit, which is an integer from 0 to 100
        uint    rcvFee;                   /// received fees
    }

    modifier onlyStoremanGroupSC {
        require(msg.sender==storemanGroupAdmin || msg.sender==storemanRegistrar || msg.sender==storemanDeposit);
        _;
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice               Set storeman group sc address
    /// @param admAddr        Address of storeman group admin
    /// @param depositAddr    Address of storeman group deposit 
    /// @param registrarAddr  Address of storeman group registrar
    function setStoremanGroupSCAddr(address admAddr, address depositAddr, address registrarAddr) 
        public
        isHalted
        onlyOwner
    {
        require(admAddr!=address(0)&&depositAddr!=address(0)&&registrarAddr!=address(0));
        storemanGroupAdmin = admAddr;
        storemanDeposit = depositAddr;
        storemanRegistrar = registrarAddr;
    }

    /// @notice               new storeman group 
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup  PK of storemanGroup
    /// @param dep            deposit
    /// @param feeRatio       fee ratio
    /// @param blkNo          block number
    /// @param initor         initior address
    function newStoremanGroup(bytes tokenOrigAddr, bytes storemanGroup, uint dep, uint feeRatio, uint blkNo, address initor)
        external
        onlyStoremanGroupSC
        notHalted
        returns (bool)
    {
        require(dep>0 && feeRatio>0);
        require(storemanGroupMap[tokenOrigAddr][storemanGroup].deposit == uint(0));
        require(storemanGroupMap[tokenOrigAddr][storemanGroup].bonusBlockNumber == uint(0));

        storemanGroupMap[tokenOrigAddr][storemanGroup] = StoremanGroup(dep, 0, feeRatio, blkNo, initor, 0, 0);

        return true;
    }

    /**********************************
     *
     * BEGIN DEBUG PURPOSE
     *
     **********************************/

    /// @notice               new storeman group 
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup  PK of storemanGroup
    /// @param dep            deposit
    /// @param feeRatio       fee ratio
    /// @param blkNo          block number
    /// @param initor         initior address
    function newTestStoremanGroup(bytes tokenOrigAddr, bytes storemanGroup, uint dep, uint feeRatio, uint blkNo, address initor)
        external
        onlyStoremanGroupSC
        notHalted
        returns (bool)
    {
        emit DebugLogger("Entry Test return", dep, feeRatio, blkNo, initor);
        if (dep == 1) {
            emit DebugLogger("1. Early exit Test return", dep, feeRatio, blkNo, initor);
            return true;
        }
        StoremanGroup memory sg = StoremanGroup(dep, 0, feeRatio, blkNo, initor, 0, 0);
        if (dep == 2) {
            emit DebugLogger("2. Early exit Test return", dep, feeRatio, blkNo, initor);
            return true;
        }

        if (dep == 3) {
        storemanGroupMap[tokenOrigAddr][storemanGroup] = sg;
        } else {
        storemanGroupMap[tokenOrigAddr][storemanGroup] = StoremanGroup(dep, 0, feeRatio, blkNo, initor, 0, 0);
        }
        emit DebugLogger("Exit Test return", dep, feeRatio, blkNo, initor);

        return true;
    }

    /// @notice               new storeman group 
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup  PK of storemanGroup
    /// @param dep            deposit
    /// @param feeRatio       fee ratio
    /// @param blkNo          block number
    /// @param initor         initior address
    function newTestStoremanGroup2(bytes tokenOrigAddr, bytes storemanGroup, uint dep, uint feeRatio, uint blkNo, address initor)
        external
        onlyStoremanGroupSC
    {
        emit DebugLogger("Entry Test NO HALT return", dep, feeRatio, blkNo, initor);

        if (dep == 10) {
            emit DebugLogger("1. Early exit Test NO return", dep, feeRatio, blkNo, initor);
            return;
        }
        StoremanGroup memory sg = StoremanGroup(dep, 0, feeRatio, blkNo, initor, 0, 0);

        if (dep == 20) {
            emit DebugLogger("2. Early exit Test NO return", dep, feeRatio, blkNo, initor);
            return;
        }
        storemanGroupMap[tokenOrigAddr][storemanGroup] = StoremanGroup(dep, 0, feeRatio, blkNo, initor, 0, 0);
        emit DebugLogger("Exit Test NO HALT return", dep, feeRatio, blkNo, initor);

    }

    /**********************************
     *
     * END DEBUG PURPOSE
     *
     **********************************/

    /// @notice               reset storeman group 
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup  PK of storemanGroup
    function resetStoremanGroup(bytes tokenOrigAddr, bytes storemanGroup)
        external
        onlyStoremanGroupSC
        notHalted
        returns (bool)
    {
        StoremanGroup storage smgInfo = storemanGroupMap[tokenOrigAddr][storemanGroup];
        smgInfo.deposit = 0;   
        smgInfo.unregisterApplyTime = 0;
        smgInfo.txFeeRatio = 0;           
        smgInfo.bonusBlockNumber = 0;  
        smgInfo.punishPercent = 0;
        smgInfo.initiator = address(0);

        return true;
    }

    /// @notice               update storeman group block
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup  PK of storemanGroup
    /// @param blkNo          block number
    function updateStoremanGroupBounceBlock(bytes tokenOrigAddr, bytes storemanGroup, uint blkNo)
        external
        onlyStoremanGroupSC
        notHalted
        returns (bool)
    {
        StoremanGroup storage smgInfo = storemanGroupMap[tokenOrigAddr][storemanGroup];
        require (blkNo>smgInfo.bonusBlockNumber);
        smgInfo.bonusBlockNumber = blkNo;

        return true;
    }

    /// @notice               update storeman group percent 
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup  PK of storemanGroup
    /// @param percent        percent value
    function updateStoremanGroupPunishPercent(bytes tokenOrigAddr, bytes storemanGroup, uint percent)
        external
        onlyStoremanGroupSC
        notHalted
        returns (bool)
    {
        StoremanGroup storage smgInfo = storemanGroupMap[tokenOrigAddr][storemanGroup];
        smgInfo.punishPercent = percent;

        return true;
    }

    /// @notice               set storeman group time 
    /// @param tokenOrigAddr  token account of original chain
    /// @param storemanGroup  PK of storemanGroup
    function setStoremanGroupUnregisterTime(bytes tokenOrigAddr, bytes storemanGroup)
        external
        onlyStoremanGroupSC
        notHalted
        returns (bool)
    {
        StoremanGroup storage smgInfo = storemanGroupMap[tokenOrigAddr][storemanGroup];
        smgInfo.unregisterApplyTime = now;

        return true;
    }

    /// @notice                    function for get storemanGroup info
    /// @param tokenOrigAddr    token account of original chain
    /// @param storemanGroup     the storeman group info on original chain
    function mapStoremanGroup(bytes tokenOrigAddr, bytes storemanGroup)
        external
        view
        onlyStoremanGroupSC
        returns (uint, uint, uint, uint, address, uint)
    {
        StoremanGroup memory sg = storemanGroupMap[tokenOrigAddr][storemanGroup];
        return (sg.deposit, sg.unregisterApplyTime, sg.txFeeRatio, sg.bonusBlockNumber, sg.initiator, sg.punishPercent);
    }

    /// @notice                 check if storeman group is active
    /// @param tokenOrigAddr token account of original chain
    /// @param storemanGroup  PK of storeman group
    function isActiveStoremanGroup(bytes tokenOrigAddr, bytes storemanGroup)
        external
        view
        onlyStoremanGroupSC
        returns (bool)
    {
        return storemanGroupMap[tokenOrigAddr][storemanGroup].deposit > uint(0);
    }


    /// @notice                 check to see if storeman (tokenOrigAddr,storemanGroup) is in white list 
    /// @param tokenOrigAddr token account of original chain 
    /// @param storemanGroup  PK of storeman group
    function isInWriteList(bytes tokenOrigAddr, bytes storemanGroup)
        external
        view
        onlyStoremanGroupSC
        returns (bool)
    {
        return mapSmgWhiteList[tokenOrigAddr][storemanGroup];
    }

    /// @notice                 set (tokenOrigAddr,storemanGroup) white list 
    /// @param tokenOrigAddr token account of original chain 
    /// @param storemanGroup  PK of storeman group
    function setSmgWriteList(bytes tokenOrigAddr, bytes storemanGroup, bool isWriteListed)
        external
        onlyStoremanGroupSC
        returns (bool)
    {
        mapSmgWhiteList[tokenOrigAddr][storemanGroup] = isWriteListed;
    }

    /// @notice       transfer WAN to address 
    /// @param dest   destination
    /// @param amount value to transfer
    function transferToAddr(address dest, uint amount)
        external
        onlyStoremanGroupSC
        notHalted
        payable
    {
        dest.transfer(amount);
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

