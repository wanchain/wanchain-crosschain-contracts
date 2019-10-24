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
    function verify(bytes32, bytes32, bytes32, bytes32, bytes32, bytes32) public returns(bool);
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
}

contract StoremanGroupPKRegistrar is Halt{
    using SafeMath for uint;
    
    /// token manager instance address
    address public tokenManager;
    /// quotaLedger instance address
    address public quotaLedger;
    /// signature verifier instance address
    address public signVerifier;
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
        require(signVerifier != address(0));
        require(storemanStorage != address(0));
        require(storemanAdm != address(0));
        _;
    }

    /**
     * Private functions
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
                    initiator.transfer(bonus);

                    return (true, initiator, bonus);
                } else {
                    msg.sender.transfer(bonus);

                    return (true, msg.sender, bonus);
                }
        } else {
            return (true, msg.sender, 0);
        }
        return (false, address(0), 0);
    }

    /// @notice       convert bytes to bytes32
    /// @param b      bytes array
    /// @param offset offset of array to begin convert
    function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
        bytes32 out;
      
        for (uint i = 0; i < 32; i++) {
          out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    /// @notice             verify signature    
    /// @param  mesg        message to be verified 
    /// @param  R           Sigature info R
    /// @param  s           Sigature info s
    /// @return             true/false
    function verifySignature(bytes32 mesg, bytes PK, bytes R, bytes32 s) 
        private
        returns (bool)
    {
        bytes32 PKx=bytesToBytes32(PK, 1);
        bytes32 PKy=bytesToBytes32(PK, 33);

        bytes32 Rx=bytesToBytes32(R, 1);
        bytes32 Ry=bytesToBytes32(R, 33);

        require(SignatureVerifier(signVerifier).verify(s, PKx, PKy, Rx, Ry, mesg));
        return true;
    }

    /// @notice                  check if able to unregister storeman group
    /// @param tokenOrigAccount  token account of original chain
    /// @param storemanGroupPK   the storeman group info on original chain
    /// @return                  true/false 
    function isAbleToUnregister(bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        returns (bool)
    {

        // TODO: always check initiator as msg.sender, that who register can deregister it.
        //if (msg.sender != storemanGroup) {
        //    require(storemanGroupMap[tokenOrigAccount][storemanGroupPK].initiator == msg.sender);
        //}
        var (,unregApplyTm,,blkNo,initiator,) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);

        // 
        require(initiator==msg.sender);
        // make sure this storemanGroup has registered
        require(blkNo > 0);
        // make sure this storemanGroup has not applied
        require(unregApplyTm == 0);

        return true;
    }

    /// @notice                       Update storeman group PK
    /// @param tokenOrigAccount       token account of original chain
    /// @param oldStoremanGroupPK     the old storeman group PK to be updated
    /// @param newStoremanGroupPK     the new storeman group PK 
    function changeStoremanGroupPK(bytes tokenOrigAccount, bytes oldStoremanGroupPK, bytes newStoremanGroupPK)
        private 
        returns (bool) 
    {
        var (oDeposit,unregApplyTm,oTxFeeR,oBlkNo,oInit,oPunish) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, oldStoremanGroupPK);
        require(unregApplyTm == 0);

        // regsiter this storeman group with calculated quota
        require(QuotaInterface(quotaLedger).updateStoremanGroupPK(tokenOrigAccount, oldStoremanGroupPK, newStoremanGroupPK));

        // TODO: should we claim bounce for old PK??
        StoremanGroupStorageInterface(storemanStorage).newStoremanGroup(tokenOrigAccount, newStoremanGroupPK, oDeposit, oTxFeeR, oBlkNo, oInit);
        StoremanGroupStorageInterface(storemanStorage).updateStoremanGroupPunishPercent(tokenOrigAccount, newStoremanGroupPK, oPunish);
           
        require(QuotaInterface(quotaLedger).applyUnregistration(tokenOrigAccount, oldStoremanGroupPK));

        // withdraw oldPK
        StoremanGroupStorageInterface(storemanStorage).resetStoremanGroup(tokenOrigAccount, newStoremanGroupPK);

        return true;
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
    /// @param admAddr       Storeman group admin instance address
    /// @param storageAddr   Storeman group storage instance address
    function setStoremanGroupAddr(address admAddr, address storageAddr)
        public
        onlyOwner
        isHalted
    {
        require(admAddr != address(0) && storageAddr != address(0));

        storemanAdm = admAddr;
        storemanStorage = storageAddr;
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

    /// @notice                           function for get storemanGroup info
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            the storeman group info on original chain
    function mapStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        initialized
        returns (uint, uint, uint, uint, address, uint)
    {
        return StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);
    }

    /// @notice                  function for setting smg white list by owner
    /// @param tokenOrigAccount  token account of original chain
    /// @param storemanGroupPK   storemanGroup PK for whitelist    
    function setSmgWhiteList(bytes tokenOrigAccount, bytes storemanGroupPK)
        external 
        onlyStoremanGroupAdm 
        initialized
    {
        require(storemanGroupPK.length!=0);

        // make sure white list mechanism is enabled
        var (,,,,,useWhiteList,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
        require(useWhiteList);        

        var (,,,blkNo,,) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);
        require(blkNo == 0);

        require(!StoremanGroupStorageInterface(storemanStorage).isInWriteList(tokenOrigAccount, storemanGroupPK));

        require(StoremanGroupStorageInterface(storemanStorage).setSmgWriteList(tokenOrigAccount, storemanGroupPK, true));
    }    
                
    /// @notice                  function for storeman register by sender this method should be
    ///                          invoked by a storemanGroup registration proxy or wanchain foundation
    /// @param tokenOrigAccount  token account of original chain
    /// @param storemanGroupPK   the storeman group PK address  
    /// @param txFeeRatio        the transaction fee required by storeman group  
    function storemanGroupRegisterByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK, uint txFeeRatio)
        external 
        payable
        notHalted
        onlyStoremanGroupAdm
        initialized
        returns (uint)
    {
        require(storemanGroupPK.length != 0 && txFeeRatio > 0);
        require(!StoremanGroupStorageInterface(storemanStorage).isActiveStoremanGroup(tokenOrigAccount, storemanGroupPK));
        
        var (,tokenWanAddr,token2WanRatio,minDeposit,,useWhiteList,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        var (,,,blkNo,,) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);
       
        require(msg.value >= minDeposit && blkNo == 0);

        // white list filter
        if (useWhiteList) {
            require(StoremanGroupStorageInterface(storemanStorage).isInWriteList(tokenOrigAccount, storemanGroupPK));
            StoremanGroupStorageInterface(storemanStorage).setSmgWriteList(tokenOrigAccount, storemanGroupPK, false);
        }

        uint quota = (msg.value).mul(TokenInterface(tokenManager).DEFAULT_PRECISE()).div(token2WanRatio).mul(10**uint(WERCProtocol(tokenWanAddr).decimals())).div(1 ether);

        // regsiter this storeman group with calculated quota
        require(QuotaInterface(quotaLedger).setStoremanGroupQuota(tokenOrigAccount, storemanGroupPK, quota));

        // TODO:  1. how to set initiator address??
        //           As current flow, only support delegator to register, so set msg.sender as initiator
        StoremanGroupStorageInterface(storemanStorage).newStoremanGroup(tokenOrigAccount, storemanGroupPK, msg.value, txFeeRatio, block.number, msg.sender);
           
        return quota;
    }  

    /// @notice                           apply unregistration through a proxy
    /// @dev                              apply unregistration through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            PK of storemanGroup 
    function smgApplyUnregisterByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK)
        external 
        notHalted
        onlyStoremanGroupAdm
        initialized
        returns (bool, address, uint)
    {
        require(isAbleToUnregister(tokenOrigAccount, storemanGroupPK));

        var (,,,,,punishPercent) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);

        StoremanGroupStorageInterface(storemanStorage).setStoremanGroupUnregisterTime(tokenOrigAccount, storemanGroupPK);

        var (,,,,,,startBonusBlk,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        bool isClaimBonus = false;
        address rcvr = address(0);
        uint val = 0;
        if (startBonusBlk > 0 && punishPercent==0) {
            // TODO: claim bonus function is at deposit contract
            (isClaimBonus, rcvr, val) = doClaimSystemBonus(tokenOrigAccount, storemanGroupPK);
        }

        require(QuotaInterface(quotaLedger).applyUnregistration(tokenOrigAccount, storemanGroupPK));

        return (isClaimBonus, rcvr, val);
    }

    /// @notice                       Update storeman group PK
    /// @param tokenOrigAccount       token account of original chain
    /// @param oldStoremanGroupPK     the old storeman group PK to be updated
    /// @param newStoremanGroupPK     the new storeman group PK 
    function storemanGroupUpdatePK(bytes tokenOrigAccount, bytes oldStoremanGroupPK, bytes newStoremanGroupPK, bytes R, bytes32 s)
        external 
        notHalted
        onlyStoremanGroupAdm
        initialized
    {
        bytes32 mhash = sha256(abi.encode(tokenOrigAccount, oldStoremanGroupPK, newStoremanGroupPK));
        require(verifySignature(mhash, oldStoremanGroupPK, R, s));

        require(oldStoremanGroupPK.length > 0 && newStoremanGroupPK.length > 0);

        require(StoremanGroupStorageInterface(storemanStorage).isActiveStoremanGroup(tokenOrigAccount, oldStoremanGroupPK));
        require(!StoremanGroupStorageInterface(storemanStorage).isActiveStoremanGroup(tokenOrigAccount, newStoremanGroupPK));
     
        require(changeStoremanGroupPK(tokenOrigAccount, oldStoremanGroupPK, newStoremanGroupPK));

        /**
        var (oDeposit,unregApplyTm,oTxFeeR,oBlkNo,oInit,oPunish) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, oldStoremanGroupPK);
        require(unregApplyTm == 0);

        // regsiter this storeman group with calculated quota
        require(QuotaInterface(quotaLedger).updateStoremanGroupPK(tokenOrigAccount, oldStoremanGroupPK, newStoremanGroupPK));

        // TODO: should we claim bounce for old PK??
        StoremanGroupStorageInterface(storemanStorage).newStoremanGroup(tokenOrigAccount, newStoremanGroupPK, oDeposit, oTxFeeR, oBlkNo, oInit);
        StoremanGroupStorageInterface(storemanStorage).updateStoremanGroupPunishPercent(tokenOrigAccount, newStoremanGroupPK, oPunish);
           
        require(QuotaInterface(quotaLedger).applyUnregistration(tokenOrigAccount, oldStoremanGroupPK));

        // withdraw oldPK
        StoremanGroupStorageInterface(storemanStorage).resetStoremanGroup(tokenOrigAccount, newStoremanGroupPK);
        */
    }

    /// @notice                           withdraw deposit through a proxy
    /// @dev                              withdraw deposit through a proxy
    /// @param tokenOrigAccount           token account of original chain
    /// @param storemanGroupPK            storemanGroup PK 
    function smgWithdrawDepositByDelegate(bytes tokenOrigAccount, bytes storemanGroupPK)
        external 
        notHalted
        onlyStoremanGroupAdm
        initialized
    {
        // TODO: 3 need check initiator ??? who register storeman can deregister it???
        //if (msg.sender != storemanGroup) {
        //    require(storemanGroupMap[tokenOrigAccount][storemanGroupPK].initiator == msg.sender);     
        //}
        var (deposit,unregApplyTm,,,initiator,punishPercent) = StoremanGroupStorageInterface(storemanStorage).mapStoremanGroup(tokenOrigAccount, storemanGroupPK);
        require(initiator == msg.sender);
          
        var (,,,,withdrawDelayTime,,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));

        require(now > unregApplyTm.add(withdrawDelayTime) && deposit > 0);

        require(QuotaInterface(quotaLedger).unregisterStoremanGroup(tokenOrigAccount, storemanGroupPK, true));
        
        uint restBalance = deposit;

        if (punishPercent > 0) {
            // transfer penalty to the penaltyReceiver of corresponding ERC20 token
            restBalance = restBalance.sub(restBalance.mul(punishPercent).div(100));
            address penaltyReceiver = TokenInterface(tokenManager).mapPenaltyReceiver(tokenOrigAccount);
            require(penaltyReceiver != address(0));
            penaltyReceiver.transfer(deposit.sub(restBalance));
        }
        
        StoremanGroupStorageInterface(storemanStorage).resetStoremanGroup(tokenOrigAccount, storemanGroupPK);
        // TODO: always transfer it to initiator???
        if (initiator != address(0)) {
            initiator.transfer(restBalance);
        } else {
            msg.sender.transfer(restBalance);   
        }
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

