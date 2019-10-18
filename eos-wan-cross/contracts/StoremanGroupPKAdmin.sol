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

interface SignatureVerifier {
    function verify(bytes32, bytes, bytes) public returns(bool);
}

contract StoremanGroupPKAdmin is Halt{
    using SafeMath for uint;
    
    /// token manager instance address
    address public tokenManager;
    /// quotaLedger instance address
    address public quotaLedger;
    /// signature verifier instance address
    address public signVerifier;

    /// a map from addresses to storeman group information (tokenOrigAddr->storemanGroupPK->StoremanGroup)
    mapping(bytes=>mapping(bytes => StoremanGroup)) private storemanGroupMap;     
    /// a map from addresses to storeman group white list information
    mapping(bytes=>mapping(bytes => bool)) private mapSmgWhiteList;                

    struct StoremanGroup {
        uint    deposit;                  /// the storeman group deposit in wan coins
        uint    unregisterApplyTime;      /// the time point for storeman group applied unregistration
        uint    txFeeRatio;               /// the fee ratio required by storeman group
        uint    bonusBlockNumber;         /// the start block number for bonus calculation for storeman group
        address initiator;                /// the account for registering a storeman group which provides storeman group deposit
        uint    punishPercent;            /// punish rate of deposit, which is an integer from 0 to 100
        uint    rcvFee;                   /// received fees
    }

    /**
     *
     * EVENTS
     *
     */   
        
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgWanPK                   smgWanPK 
    /// @param wanDeposit                 deposit wancoin number
    /// @param quota                      corresponding token quota
    /// @param txFeeRatio                 storeman fee ratio
    event StoremanGroupRegistrationLogger(bytes tokenOrigAccount, bytes indexed smgWanPK, uint wanDeposit, uint quota, uint txFeeRatio);
    
    /// @notice                           event for bonus deposit
    /// @dev                              event for bonus deposit 
    /// @param tokenOrigAccount           token account of original chain
    /// @param sender                     sender for bonus
    /// @param wancoin                    deposit wancoin number
    event StoremanGroupDepositBonusLogger(bytes tokenOrigAccount, address indexed sender, uint indexed wancoin);
    
    /// @notice                           event for storeman register  
    /// @dev                              event for storeman register  
    /// @param smgWanPK                 storeman PK
    /// @param tokenOrigAccount           token account of original chain
    event SmgEnableWhiteListLogger(bytes indexed smgWanPK, bytes tokenOrigAccount);   
        
    /// @notice                           event for applying storeman group unregister 
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgWanPK                 storemanGroup address
    /// @param applyTime                  the time for storeman applying unregister    
    event StoremanGroupApplyUnRegistrationLogger(bytes tokenOrigAccount, bytes indexed smgWanPK, uint indexed applyTime);
    
    /// @notice                           event for storeman group withdraw deposit
    /// @param tokenOrigAccount           token account of original chain
    /// @param smgWanPK                   storemanGroup PK 
    /// @param actualReturn               the time for storeman applying unregister       
    /// @param deposit                    deposit in the first place
    event StoremanGroupWithdrawLogger(bytes tokenOrigAccount, bytes indexed smgWanPK, uint indexed actualReturn, uint deposit);
    
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
    /// @param storemanGroupPK            storeman group pk 
    function doClaimSystemBonus(bytes tokenOrigAccount, bytes storemanGroupPK)
        private
    {
        StoremanGroup storage smgInfo = storemanGroupMap[tokenOrigAccount][storemanGroupPK];
        
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
    /// @param storemanGroupPK            the storeman group info on original chain
    function mapStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns (uint, uint, uint, uint, address, uint)
    {
        StoremanGroup memory sg = storemanGroupMap[tokenOrigAccount][storemanGroupPK];
        return (sg.deposit, sg.unregisterApplyTime, sg.txFeeRatio, sg.bonusBlockNumber, sg.initiator, sg.punishPercent);
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
    /// @param storemanGroupPK            storemanGroup PK for whitelist    
    function setSmgWhiteList(bytes tokenOrigAccount, bytes storemanGroupPK)
        public
        onlyOwner
    {
        require(storemanGroupPK.length!=0);

        // make sure white list mechanism is enabled
        var (,,,,,useWhiteList,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
        require(useWhiteList);        

        require(storemanGroupMap[tokenOrigAccount][storemanGroupPK].bonusBlockNumber == 0);
        require(!mapSmgWhiteList[tokenOrigAccount][storemanGroupPK]);

        mapSmgWhiteList[tokenOrigAccount][storemanGroupPK] = true;
            
        emit SmgEnableWhiteListLogger(storemanGroupPK, tokenOrigAccount);
    }    
                
    /// @notice                           function for storeman register by sender this method should be
    ///                                   invoked by a storemanGroup registration proxy or wanchain foundation
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            the storeman group PK address  
    /// @param txFeeRatio                 the transaction fee required by storeman group  
    function storemanGroupRegisterByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK, uint txFeeRatio)
        public
        payable
        notHalted
    {
        require(storemanGroupPK.length != 0 && txFeeRatio > 0);
        require(storemanGroupMap[tokenOrigAccount][storemanGroupPK].deposit == uint(0));
        
        var (,tokenWanAddr,token2WanRatio,minDeposit,,useWhiteList,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        require(msg.value >= minDeposit && storemanGroupMap[tokenOrigAccount][storemanGroupPK].bonusBlockNumber == 0);

        // white list filter
        if (useWhiteList) {
            require(mapSmgWhiteList[tokenOrigAccount][storemanGroupPK]);
            mapSmgWhiteList[tokenOrigAccount][storemanGroupPK] = false;
        }

        uint quota = (msg.value).mul(TokenInterface(tokenManager).DEFAULT_PRECISE()).div(token2WanRatio).mul(10**uint(WERCProtocol(tokenWanAddr).decimals())).div(1 ether);

        // regsiter this storeman group with calculated quota
        require(QuotaInterface(quotaLedger).setStoremanGroupQuota(tokenOrigAccount, storemanGroupPK, quota));

        // TODO:  1. how to set initiator address??
        //           As current flow, only support delegator to register, so set msg.sender as initiator
        storemanGroupMap[tokenOrigAccount][storemanGroupPK] = StoremanGroup(msg.value, 0, txFeeRatio, block.number, msg.sender, 0, 0);
           
        /// fire event
        emit StoremanGroupRegistrationLogger(tokenOrigAccount, storemanGroupPK, msg.value, quota,txFeeRatio);
    }  

    /// @notice                           apply unregistration through a proxy
    /// @dev                              apply unregistration through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            PK of storemanGroup 
    function smgApplyUnregisterByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK)
        public
        notHalted
    {
        // TODO: always check initiator as msg.sender, that who register can deregister it.
        //if (msg.sender != storemanGroup) {
            require(storemanGroupMap[tokenOrigAccount][storemanGroupPK].initiator == msg.sender);
        //}

        // make sure this storemanGroup has registered
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroupPK];
        require(smg.bonusBlockNumber > 0);
        // make sure this storemanGroup has not applied
        require(smg.unregisterApplyTime == 0);

        smg.unregisterApplyTime = now;

        var (,,,,,,startBonusBlk,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        if (startBonusBlk > 0 && smg.punishPercent==0) {
            doClaimSystemBonus(tokenOrigAccount, storemanGroupPK);
        }

        require(QuotaInterface(quotaLedger).applyUnregistration(tokenOrigAccount, storemanGroupPK));

        // fire event
        emit StoremanGroupApplyUnRegistrationLogger(tokenOrigAccount, storemanGroupPK, now);
    }

                
    /// @notice                       Update storeman group PK
    /// @param tokenOrigAccount       token account of original chain
    /// @param oldStoremanGroupPK     the old storeman group PK to be updated
    /// @param newStoremanGroupPK     the new storeman group PK 
    function storemanGroupUpdatePK(bytes tokenOrigAccount, bytes oldStoremanGroupPK, bytes newStoremanGroupPK, bytes R, bytes s)
        public
        notHalted
    {
        bytes32 mhash = keccak256(abi.encode(tokenOrigAccount, oldStoremanGroupPK, newStoremanGroupPK));
        require(verifySignature(mhash, R, s));

        require(oldStoremanGroupPK.length > 0 && newStoremanGroupPK.length > 0);

        require(storemanGroupMap[tokenOrigAccount][oldStoremanGroupPK].deposit > uint(0));
        require(storemanGroupMap[tokenOrigAccount][newStoremanGroupPK].deposit == uint(0));
       
        StoremanGroup storage oldsmg = storemanGroupMap[tokenOrigAccount][oldStoremanGroupPK];
        require(oldsmg.unregisterApplyTime == 0);

        // regsiter this storeman group with calculated quota
        require(QuotaInterface(quotaLedger).updateStoremanGroupPK(tokenOrigAccount, oldStoremanGroupPK, newStoremanGroupPK));

        // TODO: should we claim bounce for old PK??
        storemanGroupMap[tokenOrigAccount][newStoremanGroupPK] = StoremanGroup(oldsmg.deposit, oldsmg.unregisterApplyTime, oldsmg.txFeeRatio, oldsmg.bonusBlockNumber, oldsmg.initiator, oldsmg.punishPercent, oldsmg.rcvFee);
           
        require(QuotaInterface(quotaLedger).applyUnregistration(tokenOrigAccount, oldStoremanGroupPK));

        // withdraw oldPK
        oldsmg.deposit = 0;   
        oldsmg.unregisterApplyTime = 0;
        oldsmg.txFeeRatio = 0;           
        oldsmg.bonusBlockNumber = 0;  
        oldsmg.punishPercent = 0;
        oldsmg.initiator = address(0);

        /// fire event
        // emit StoremanGroupRegistrationLogger(tokenOrigAccount, storemanGroupPK, msg.value, quota,txFeeRatio);
    }  
    /// @notice                           withdraw deposit through a proxy
    /// @dev                              withdraw deposit through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            storemanGroup PK 
    function smgWithdrawDepositByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK)
        public
        notHalted
    {
        // TODO: 3 need check initiator ??? who register storeman can deregister it???
        //if (msg.sender != storemanGroup) {
            require(storemanGroupMap[tokenOrigAccount][storemanGroupPK].initiator == msg.sender);     
        //}
          
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroupPK];
        var (,,,,withdrawDelayTime,,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        require(now > smg.unregisterApplyTime.add(withdrawDelayTime) && smg.deposit > 0);

        require(QuotaInterface(quotaLedger).unregisterStoremanGroup(tokenOrigAccount, storemanGroupPK, true));
        
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
        //smg.smgOrigAccount = new bytes(0);
        smg.unregisterApplyTime = 0;
        smg.txFeeRatio = 0;           
        smg.bonusBlockNumber = 0;  
        smg.punishPercent = 0;
       
        // TODO: always transfer it to initiator???
        if (smg.initiator != address(0)) {
            smg.initiator.transfer(restBalance);
        } else {
            msg.sender.transfer(restBalance);   
        }
        smg.initiator = address(0);

        emit StoremanGroupWithdrawLogger(tokenOrigAccount, storemanGroupPK, restBalance, deposit);
    }

    /// @notice                           function for storeman claiming system bonus
    /// @dev                              function for storeman claiming system bonus
    /// @param tokenOrigAccount           token account of original chain
    function storemanGroupClaimSystemBonus(bytes tokenOrigAccount, bytes storemanPK)
        public
        notHalted
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanPK];
        require(smg.bonusBlockNumber != 0 && smg.unregisterApplyTime == 0);
       
       // TODO: pass smg PK, do we need this???
        doClaimSystemBonus(tokenOrigAccount, storemanPK);
    }

    /// @notice                           function for storeman claiming system bonus through a proxy  
    /// @dev                              function for storeman claiming system bonus through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            storemanGroup PK 
    function smgClaimSystemBonusByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK)
        public
        notHalted
    {
        // make sure the address who registered this smg initiated this transaction
        require(storemanGroupMap[tokenOrigAccount][storemanGroupPK].initiator == msg.sender); 
        
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroupPK];
        require(smg.bonusBlockNumber != 0 && smg.unregisterApplyTime == 0); 
        
        doClaimSystemBonus(tokenOrigAccount, storemanGroupPK);
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

    function receiveFee(bytes tokenOrigAccount, bytes storemanGroupPK, uint fee)
        external 
        notHalted
    {
        StoremanGroup storage smg = storemanGroupMap[tokenOrigAccount][storemanGroupPK];
        if (smg.initiator != address(0)) {
            smg.initiator.transfer(fee);
        }
        //smg.rcvFee = smg.rcvFee.add(fee);
    }

    /// @notice             verify signature    
    /// @param  mesg        message to be verified 
    /// @param  R           Sigature info R
    /// @param  s           Sigature info s
    /// @return             true/false
    function verifySignature(bytes32 mesg, bytes R, bytes s) 
        private
        returns (bool)
    {
        require(SignatureVerifier(signVerifier).verify(mesg, R, s));
        return true;
    }

    /// @notice                 set token manager SC instance address
    /// @param  addr            token manager SC instance address    
    function setSignVerifier(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        signVerifier = addr;

        return true;
    }
}  

