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
    function applyUnregistration(bytes, address) external returns (bool);
    function setStoremanGroupQuota(bytes, address, uint) external returns (bool);
    function unregisterStoremanGroup(bytes, address, bool) external returns (bool);
}

interface WERCProtocol {
    function decimals() public returns(uint8);
}

contract StoremanGroupAdmin is Halt{
    using SafeMath for uint;
    
    /// token manager instance address
    address public tokenManager;
    /// quotaLedger instance address
    address public quotaLedger;
            
    /// a map from addresses to storeman group information
    mapping(bytes=>mapping(address => StoremanGroup)) private storemanGroupMap;     
    /// a map from addresses to storeman group white list information
    mapping(bytes=>mapping(address => bool)) private mapSmgWhiteList;                

    struct StoremanGroup {
        uint    deposit;                  /// the storeman group deposit in wan coins
        bytes   smgOrigAccount;           /// the account for storeman group on original chain
        uint    unregisterApplyTime;      /// the time point for storeman group applied unregistration
        uint    txFeeRatio;               /// the fee ratio required by storeman group
        uint    bonusBlockNumber;         /// the start block number for bonus calculation for storeman group
        address initiator;                /// the account for registering a storeman group which provides storeman group deposit
        uint    punishPercent;            /// punish rate of deposit, which is an integer from 0 to 100
    }

    /**
    *
    * EVENTS
    *
    */   
        
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgWanAddr                 smgWanAddr address
    /// @param smgOrigAccount             storeman group original chain address
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    /// @param txFeeRatio                 storeman fee ratio
    event StoremanGroupRegistrationLogger(bytes tokenOrigAccount, address indexed smgWanAddr, bytes smgOrigAccount, uint wanDeposit, uint quota, uint txFeeRatio);
    
    /// @notice                           event for bonus deposit
    /// @dev                              event for bonus deposit 
    /// @param tokenOrigAccount           token account of original chain
    /// @param sender                     sender for bonus
    /// @param wancoin                    deposit wancoin number
    event StoremanGroupDepositBonusLogger(bytes tokenOrigAccount, address indexed sender, uint indexed wancoin);
    
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param smgWanAddr                 storeman address
    /// @param tokenOrigAccount           token account of original chain
    event SmgEnableWhiteListLogger(address indexed smgWanAddr, bytes tokenOrigAccount);   
        
    /// @notice                           event for applying storeman group unregister 
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgWanAddr                 storemanGroup address
    /// @param applyTime                  the time for storeman applying unregister    
    event StoremanGroupApplyUnRegistrationLogger(bytes tokenOrigAccount, address indexed smgWanAddr, uint indexed applyTime);
    
    /// @notice                           event for storeman group withdraw deposit
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgWanAddr                 storemanGroup address
    /// @param actualReturn               the time for storeman applying unregister       
    /// @param deposit                    deposit in the first place
    event StoremanGroupWithdrawLogger(bytes tokenOrigAccount, address indexed smgWanAddr, uint indexed actualReturn, uint deposit);
    
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

    /// @notice event for transfer deposit to specified address
    /// @param smgAddress   storeman address
    /// @param tokenOrigAccount  token account of original chain
    /// @param destAddress the destination address of deposit
    event SmgTranferDepositLogger(bytes tokenOrigAccount, address indexed smgAddress,address destAddress,uint deposit);
    
    /**
     *
     * private methods
     *
     */

    /// @notice                           function for bonus claim
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group address
    function doClaimSystemBonus(bytes tokenOrigAccount, address storemanGroup)
        private
    {
        StoremanGroup storage smgInfo = storemanGroupMap[tokenOrigAccount][storemanGroup];
        
        var (,,,,,,startBonusBlk,bonusTotal,bonusPeriodBlks,bonusRatio,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        if(smgInfo.punishPercent != 0 || startBonusBlk == 0){
          return;
        }

        smgInfo.bonusBlockNumber = smgInfo.bonusBlockNumber < startBonusBlk ? startBonusBlk : smgInfo.bonusBlockNumber;
       
        if (block.number.sub(smgInfo.bonusBlockNumber) >= bonusPeriodBlks && smgInfo.deposit > 0) {
            uint cycles = (block.number.sub(smgInfo.bonusBlockNumber)).div(bonusPeriodBlks);

            smgInfo.bonusBlockNumber = smgInfo.bonusBlockNumber.add(cycles.mul(bonusPeriodBlks));

            uint bonus = smgInfo.deposit.mul(bonusRatio).div(TokenInterface(tokenManager).DEFAULT_PRECISE());
            bonus = bonus.mul(cycles);

            if (bonusTotal >= bonus && bonus > 0) {
                require(TokenInterface(tokenManager).updateTotalBonus(tokenOrigAccount, bonus, false));
                    if (smgInfo.initiator != address(0)) {
                        smgInfo.initiator.transfer(bonus);
                        emit StoremanGroupClaimSystemBonusLogger(tokenOrigAccount, smgInfo.initiator, bonus);      
                    } else {
                        msg.sender.transfer(bonus);
                        emit StoremanGroupClaimSystemBonusLogger(tokenOrigAccount, msg.sender, bonus);     
                    }
            } else {
                  emit StoremanGroupClaimSystemBonusLogger(tokenOrigAccount, msg.sender, 0);
            }
        }
    }

    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice                           function for get storemanGroup info
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              the storeman group info on original chain
    function mapStoremanGroup(bytes tokenOrigAccount, address storemanGroup)
        external
        view
        returns (uint, bytes, uint, uint, uint, address, uint)
    {
        StoremanGroup memory sg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        return (sg.deposit, sg.smgOrigAccount, sg.unregisterApplyTime, sg.txFeeRatio, sg.bonusBlockNumber, sg.initiator, sg.punishPercent);
    }

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

    /// @notice                           function for setting smg white list by owner
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup address for whitelist    
    function setSmgWhiteList(bytes tokenOrigAccount, address storemanGroup)
        public
        onlyOwner
    {
        require(storemanGroup!=address(0));

        // make sure white list mechanism is enabled
        var (,,,,,useWhiteList,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
        require(useWhiteList);        

        require(storemanGroupMap[tokenOrigAccount][storemanGroup].bonusBlockNumber == 0);
        require(!mapSmgWhiteList[tokenOrigAccount][storemanGroup]);

        mapSmgWhiteList[tokenOrigAccount][storemanGroup] = true;
            
        emit SmgEnableWhiteListLogger(storemanGroup, tokenOrigAccount);
    }    
                
    /// @notice                           function for storeman registration, this method should be invoked by the storemanGroup himself
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgOrigAccount             the storeman group info on original chain
    /// @param txFeeRatio                 the transaction fee required by storeman group  
    function storemanGroupRegister(bytes tokenOrigAccount, bytes smgOrigAccount, uint txFeeRatio)
        public
        payable
        notHalted
    {
        storemanGroupRegisterByDelegate(tokenOrigAccount, msg.sender, smgOrigAccount, txFeeRatio);
    }

    /// @notice                           function for storeman register by sender this method should be
    ///                                   invoked by a storemanGroup registration proxy or wanchain foundation
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              the storeman group register address  
    /// @param smgOrigAccount             the storeman group info on original chain
    /// @param txFeeRatio                 the transaction fee required by storeman group  
    function storemanGroupRegisterByDelegate(bytes tokenOrigAccount, address storemanGroup, bytes smgOrigAccount, uint txFeeRatio)
        public
        payable
        notHalted
    {
        require(storemanGroup != address(0) && smgOrigAccount.length != 0 && txFeeRatio > 0);
        require(storemanGroupMap[tokenOrigAccount][storemanGroup].deposit == uint(0));
        
        var (,tokenWanAddr,token2WanRatio,minDeposit,,useWhiteList,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        require(msg.value >= minDeposit && storemanGroupMap[tokenOrigAccount][storemanGroup].bonusBlockNumber == 0);

        // white list filter
        if (useWhiteList) {
            require(mapSmgWhiteList[tokenOrigAccount][storemanGroup]);
            mapSmgWhiteList[tokenOrigAccount][storemanGroup] = false;
        }

        uint quota = (msg.value).mul(TokenInterface(tokenManager).DEFAULT_PRECISE()).div(token2WanRatio).mul(10**uint(WERCProtocol(tokenWanAddr).decimals())).div(1 ether);

        // regsiter this storeman group with calculated quota
        require(QuotaInterface(quotaLedger).setStoremanGroupQuota(tokenOrigAccount, storemanGroup, quota));

        storemanGroupMap[tokenOrigAccount][storemanGroup] = StoremanGroup(msg.value, smgOrigAccount, 0, txFeeRatio, block.number, storemanGroup == msg.sender ? address(0) : msg.sender, 0);
           
        /// fire event
        emit StoremanGroupRegistrationLogger(tokenOrigAccount, storemanGroup, smgOrigAccount, msg.value, quota,txFeeRatio);
    }  

    /// @notice                           function for storemanGroup applying unregister
    /// @dev                              function for storemanGroup applying unregister
    /// @param tokenOrigAccount           token account of original chain
    function storemanGroupApplyUnregister(bytes tokenOrigAccount)
        public
        notHalted
    {
        smgApplyUnregisterByDelegate(tokenOrigAccount, msg.sender);
    } 

    /// @notice                           apply unregistration through a proxy
    /// @dev                              apply unregistration through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup address 
    function smgApplyUnregisterByDelegate(bytes tokenOrigAccount, address storemanGroup)
        public
        notHalted
    {
        if (msg.sender != storemanGroup) {
            require(storemanGroupMap[tokenOrigAccount][storemanGroup].initiator == msg.sender);
        }

        // make sure this storemanGroup has registered
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(smg.bonusBlockNumber > 0);
        // make sure this storemanGroup has not applied
        require(smg.unregisterApplyTime == 0);

        smg.unregisterApplyTime = now;

        var (,,,,,,startBonusBlk,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        if (startBonusBlk > 0 && smg.punishPercent==0) {
            doClaimSystemBonus(tokenOrigAccount, storemanGroup);
        }

        require(QuotaInterface(quotaLedger).applyUnregistration(tokenOrigAccount, storemanGroup));

        // fire event
        emit StoremanGroupApplyUnRegistrationLogger(tokenOrigAccount, storemanGroup, now);
    }

    /// @notice                           function for storeman group withdraw deposit
    /// @dev                              function for storeman group withdraw deposit
    /// @param tokenOrigAccount           token account of original chain
    function storemanGroupWithdrawDeposit(bytes tokenOrigAccount)
        public
        notHalted
    {
        smgWithdrawDepositByDelegate(tokenOrigAccount, msg.sender);
    }

    /// @notice                           withdraw deposit through a proxy
    /// @dev                              withdraw deposit through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup address 
    function smgWithdrawDepositByDelegate(bytes tokenOrigAccount, address storemanGroup)
        public
        notHalted
    {
        if (msg.sender != storemanGroup) {
            require(storemanGroupMap[tokenOrigAccount][storemanGroup].initiator == msg.sender);     
        }
          
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        var (,,,,withdrawDelayTime,,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        require(now > smg.unregisterApplyTime.add(withdrawDelayTime) && smg.deposit > 0);

        require(QuotaInterface(quotaLedger).unregisterStoremanGroup(tokenOrigAccount, storemanGroup, true));
        
        uint deposit = smg.deposit;
        uint restBalance = smg.deposit;

        if (smg.punishPercent > 0) {
            // transfer penalty to the penaltyReceiver of corresponding ERC20 token
            restBalance = restBalance.sub(restBalance.mul(smg.punishPercent).div(100));
            address penaltyReceiver = TokenInterface(tokenManager).mapPenaltyReceiver(tokenOrigAccount);
            require(penaltyReceiver != address(0));
            penaltyReceiver.transfer(deposit.sub(restBalance));
        }
        
        smg.deposit = 0;   
        smg.smgOrigAccount = new bytes(0);
        smg.unregisterApplyTime = 0;
        smg.txFeeRatio = 0;           
        smg.bonusBlockNumber = 0;  
        smg.punishPercent = 0;
        
        if (smg.initiator != address(0)) {
            smg.initiator.transfer(restBalance);
        } else {
            msg.sender.transfer(restBalance);   
        }
        smg.initiator = address(0);

        emit StoremanGroupWithdrawLogger(tokenOrigAccount, storemanGroup, restBalance, deposit);
    }

    /// @notice                           function for storeman claiming system bonus
    /// @dev                              function for storeman claiming system bonus
    /// @param tokenOrigAccount           token account of original chain
    function storemanGroupClaimSystemBonus(bytes tokenOrigAccount)
        public
        notHalted
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][msg.sender];
        require(smg.bonusBlockNumber != 0 && smg.unregisterApplyTime == 0);
        
        doClaimSystemBonus(tokenOrigAccount, msg.sender);
    }

    /// @notice                           function for storeman claiming system bonus through a proxy  
    /// @dev                              function for storeman claiming system bonus through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup address 
    function smgClaimSystemBonusByDelegate(bytes tokenOrigAccount, address storemanGroup)
        public
        notHalted
    {
        // make sure the address who registered this smg initiated this transaction
        require(storemanGroupMap[tokenOrigAccount][storemanGroup].initiator == msg.sender); 
        
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(smg.bonusBlockNumber != 0 && smg.unregisterApplyTime == 0); 
        
        doClaimSystemBonus(tokenOrigAccount, storemanGroup);
    }

    /// @notice                           function for bonus deposit
    /// @dev                              function for bonus deposit
    /// @param tokenOrigAccount           token account of original chain
    function depositSmgBonus(bytes tokenOrigAccount)
        public
        payable
        onlyOwner
    {
        require(msg.value > 0);
        
        var (,,,,,,startBonusBlk,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
        require(startBonusBlk > 0);
        
        require(TokenInterface(tokenManager).updateTotalBonus(tokenOrigAccount, msg.value, true));

        emit StoremanGroupDepositBonusLogger(tokenOrigAccount, msg.sender, msg.value);
    }
                    
    /// @notice                           function for storeman applying unregister
    /// @dev                              function for storeman applying unregister
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storemanGroup address 
    /// @param punishPercent              punished percent of deposit bonus
    function punishStoremanGroup(bytes tokenOrigAccount, address storemanGroup, uint punishPercent)
        public
        onlyOwner
    {
        require(punishPercent > 0 && punishPercent<=100);
        StoremanGroup storage info = storemanGroupMap[tokenOrigAccount][storemanGroup];
        require(info.deposit != 0);
        
        info.punishPercent = punishPercent;

        emit StoremanGroupPunishedLogger(tokenOrigAccount, storemanGroup, punishPercent);
    }    
    
    /// @notice                           function tranfer out the specified smg deposit 
    ///                                   in case of smg lost keystore which can not recovered anymore
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroup              storeman group address
    /// @param destAddress                coin recipient address
    /// @param isTransferAll              indicate if make a full transfer
    function transferSmgDeposit(bytes tokenOrigAccount, address storemanGroup, address destAddress, bool isTransferAll)
        public
        onlyOwner
    {
        if (isTransferAll && halted) {
            owner.transfer(address(this).balance);
        } else {
            require(storemanGroupMap[tokenOrigAccount][storemanGroup].deposit > 0);
            
            uint deposit = storemanGroupMap[tokenOrigAccount][storemanGroup].deposit;

            require(QuotaInterface(quotaLedger).unregisterStoremanGroup(tokenOrigAccount, storemanGroup, false));

            // set deposit to 0
            storemanGroupMap[tokenOrigAccount][storemanGroup].deposit = 0;

            destAddress.transfer(deposit);
        }

        emit SmgTranferDepositLogger(tokenOrigAccount, storemanGroup, destAddress, deposit);
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

