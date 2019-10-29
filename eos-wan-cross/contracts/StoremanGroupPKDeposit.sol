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

interface TokenInterface {
    function mapKey(bytes) external view returns(bytes32);
    function mapTokenInfo(bytes32) public view returns(bytes, address, uint, uint, uint, bool, uint, uint, uint, uint, uint, bytes);
    function mapPenaltyReceiver(bytes) external view returns(address);
    function updateTotalBonus(bytes, uint, bool) external returns(bool);
    function DEFAULT_PRECISE() public returns (uint);
}

interface QuotaInterface {
    function applyUnregistration(bytes, bytes) external returns (bool);
    function setStoremanGroupQuota(bytes, bytes, uint) external returns (bool);
    function unregisterStoremanGroup(bytes, bytes, bool) external returns (bool);
    function updateStoremanGroupPK(bytes, bytes, bytes) external returns (bool);
}

interface WERCProtocol {
    function decimals() public returns(uint8);
}

interface StoremanGroupStorageInterface {
    function newStoremanGroup(bytes, bytes, uint, uint, uint, address) external returns (bool);
    function mapStoremanGroup(bytes, bytes) external view returns (uint, uint, uint, uint, address, uint);
    function isActiveStoremanGroup(bytes, bytes) external view returns (bool);
    function isInWriteList(bytes, bytes) external view returns (bool);
    function setSmgWriteList(bytes, bytes, bool) external returns (bool);
    function updateStoremanGroupBounceBlock(bytes, bytes, uint) external returns (bool);
    function updateStoremanGroupPunishPercent(bytes, bytes, uint) external returns (bool);
    function setStoremanGroupUnregisterTime(bytes, bytes) external returns (bool);
    function resetStoremanGroup(bytes, bytes) external returns (bool);
    function transferToAddr(address, uint) external;
}

contract StoremanGroupPKDeposit is Halt{
    using SafeMath for uint;
    
    /// token manager instance address
    address public tokenManager;
    /// quotaLedger instance address
    address public quotaLedger;
    /// storeman storage instance address
    address public storemanStorage;
    /// storeman adm instance address
    address public storemanAdm;

    /**
     *
     * Modifiers
     *
     */   
    modifier onlyStoremanGroupAdm {
        require(msg.sender == storemanAdm);
        _;
    }

    modifier initialized() {
        require(tokenManager != address(0));
        require(quotaLedger != address(0));
        require(storemanStorage != address(0));
        require(storemanAdm != address(0));
        _;
    }

    /**
     *
     * EVENTS
     *
     */   
        
    /// @notice                           event for storeman group claiming system bonus
    /// @param tokenOrigAccount           token account of original chain
    /// @param bonusRecipient             storemanGroup address
    /// @param bonus                      the bonus for storeman claim       
    event StoremanGroupClaimSystemBonusLogger(bytes tokenOrigAccount, address indexed bonusRecipient, uint indexed bonus);
    
    /// @notice                           event for storeman group be punished
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgWanAddr                 storeman address
    /// @param punishPercent              punish percent of deposit
    event StoremanGroupPunishedLogger(bytes tokenOrigAccount, address indexed smgWanAddr, uint indexed punishPercent);   

    /**
     *
     * private methods
     *
     */

    /// @notice
    /// @param tokenOrigAccount  token account of original chain
    function calculateSmgBonus(bytes tokenOrigAccount, bytes storemanGroupPK, uint smgBonusBlkNo, uint smgDeposit)
        private
        returns (uint, uint)
    {
        var (,,,,,,startBonusBlk,bonusTotal,bonusPeriodBlks,bonusRatio,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        if (startBonusBlk==0) {
            return (0, 0);
        }

        if (smgBonusBlkNo<startBonusBlk) {
            smgBonusBlkNo = startBonusBlk;
        }

        uint bonus = 0;
        //uint newBonusBlkNo = smgBonusBlkNo;
        if (block.number.sub(smgBonusBlkNo) >= bonusPeriodBlks && smgDeposit > 0) {
            uint cycles = (block.number.sub(smgBonusBlkNo)).div(bonusPeriodBlks);

            smgBonusBlkNo=smgBonusBlkNo.add(cycles.mul(bonusPeriodBlks));

            bonus = smgDeposit.mul(bonusRatio).div(TokenInterface(tokenManager).DEFAULT_PRECISE());
            bonus = bonus.mul(cycles);
        }

        return (bonus, smgBonusBlkNo);

    }

    /// @notice                           function for bonus claim
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            storeman group pk 
    function doClaimSystemBonus(bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        returns (bool, address, uint)
    {
        var (deposit,,blkNo,,initiator,punishPercent) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);

        var (,,,,,,,bonusTotal,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        if(punishPercent != 0){
          return (false, address(0), 0);
        }

        var (bonus, newBlkNo) = calculateSmgBonus(tokenOrigAccount, storemanGroupPK, blkNo, deposit);
        if (newBlkNo>0 && blkNo<newBlkNo) {
            StoremanGroupStorageInterface(storemanStorage).updateStoremanGroupBounceBlock(tokenOrigAccount, storemanGroupPK, newBlkNo);
        }

        if (bonusTotal >= bonus && bonus > 0) {
            require(TokenInterface(tokenManager).updateTotalBonus(tokenOrigAccount, bonus, false));
                if (initiator != address(0)) {
                    //initiator.transfer(bonus);
                    StoremanGroupStorageInterface(storemanStorage).transferToAddr(initiator, bonus);

                    return (true, initiator, bonus);
                } else {
                    //msg.sender.transfer(bonus);
                    StoremanGroupStorageInterface(storemanStorage).transferToAddr(msg.sender, bonus);

                    return (true, msg.sender, bonus);
                }
        } else {
            return (true, msg.sender, 0);
        }
        return (false, address(0), 0);
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                           set tokenManager instance address and quotaLedger instance address
    /// @param tm                         token manager instance address
    /// @param ql                         quota ledger instance address
    function injectDependencies(address tm, address ql)
        public
        onlyOwner
        isHalted
    {
        require(tm != address(0) && ql != address(0));
        tokenManager = tm;
        quotaLedger = ql;
    }

    /// @notice              Set storeman group storage instance address
    /// @param admAddr       Storeman group administrator instance address
    /// @param admAddr       Storeman group storage instance address
    function setStoremanGroupAddr(address admAddr, address storageAddr)
        public
        onlyOwner
        isHalted
    {
        require(admAddr != address(0) && storageAddr != address(0));

        storemanAdm = admAddr;
        storemanStorage = storageAddr;
    }

    /// @notice                           function for storeman claiming system bonus
    /// @dev                              function for storeman claiming system bonus
    /// @param tokenOrigAccount           token account of original chain
    function storemanGroupClaimSystemBonus(bytes tokenOrigAccount, bytes storemanPK)
        external 
        notHalted
        onlyStoremanGroupAdm
        initialized
        returns (bool, address, uint)
    {
        var (,unregApplyTm,blkNo,,,) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanPK);
        require(blkNo != 0 && unregApplyTm == 0);
       
       // TODO: pass smg PK, do we need this???
        return doClaimSystemBonus(tokenOrigAccount, storemanPK);
    }

    /// @notice                           function for storeman claiming system bonus through a proxy  
    /// @dev                              function for storeman claiming system bonus through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            storemanGroup PK 
    function smgClaimSystemBonusByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK)
        external 
        notHalted
        onlyStoremanGroupAdm
        initialized
        returns (bool, address, uint)
    {
        // make sure the address who registered this smg initiated this transaction
        var (,unregApplyTm,blkNo,,initiator,) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);

        require(initiator == msg.sender); 
        
        require(blkNo != 0 && unregApplyTm == 0); 
        
        return doClaimSystemBonus(tokenOrigAccount, storemanGroupPK);
    }

    /// @notice                           function for bonus deposit
    /// @dev                              function for bonus deposit
    /// @param tokenOrigAccount           token account of original chain
    function depositSmgBonus(bytes tokenOrigAccount, uint value)
        external
        payable
        onlyStoremanGroupAdm
        initialized
        //onlyOwner
    {
        require(value > 0);
        
        var (,,,,,,startBonusBlk,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
        require(startBonusBlk > 0);
        
        require(TokenInterface(tokenManager).updateTotalBonus(tokenOrigAccount, value, true));
    }

    function feeReceiver(bytes tokenOrigAccount, bytes storemanGroupPK)
        external 
        notHalted
        onlyStoremanGroupAdm
        initialized
        returns (address)
    {
        var (,,,,initiator,) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);
        //if (initiator != address(0)) {
        //    initiator.transfer(fee);
        //}
        return initiator;
        //smg.rcvFee = smg.rcvFee.add(fee);
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

