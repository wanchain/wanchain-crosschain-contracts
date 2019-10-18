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
}

interface WERCProtocol {
    function mint(address, uint) public returns(bool);
    function burn(address, uint) public returns(bool);
}

contract QuotaLedger is Halt {
    using SafeMath for uint;

    /// @notice HTLCWAN instance address
    address public HTLCWAN;
    /// @notice storeman group instance address
    address public storemanGroupAdmin;
    /// @notice token manager instance address
    address public tokenManager;
    /// @notice a map from storemanGroup PK to its quota information
    mapping(bytes => mapping(bytes => StoremanGroupQuota)) private quotaMap;
    /// @notice a map from storemanGroup PK its unregistration intention
    mapping(bytes => mapping(bytes => bool)) private unregistrationMap;

    struct StoremanGroupQuota {
        /// storemanGroup's total quota 
        uint _quota;             
        /// amout of original token to be received, equals to amount of WAN token to be minted
        uint _receivable;       
        /// amount of WAN token to be burnt
        uint _payable;           
        /// amount of original token received, equals to amount of WAN token been minted
        uint _debt;
    }

    /// @notice                 test if a value provided is meaningless
    /// @dev                    test if a value provided is meaningless
    /// @param value            given value to be handled
    modifier onlyMeaningfulValue(uint value) {
        require(value > 0);
        _;
    }

    modifier onlyStoremanGroupAdmin {
        require(msg.sender == storemanGroupAdmin);
        _;
    }

    modifier onlyHTLCWAN {
        require(msg.sender == HTLCWAN);
        _;
    }

    /// @notice                 function for get quota
    /// @param tokenOrigAccount token account of original chain
    /// @param storemanGroupPK  storemanGroup PK 
    function mapQuota(bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns (uint, uint, uint, uint)
    {
        StoremanGroupQuota storage quota = quotaMap[tokenOrigAccount][storemanGroupPK];
        return (quota._quota, quota._receivable, quota._payable, quota._debt);
    }

    /// @notice                 function for get unregistration status
    /// @param tokenOrigAccount token account of original chain
    /// @param storemanGroupPK  storemanGroup pk 
    function mapUnregistration(bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns (bool)
    {
        return unregistrationMap[tokenOrigAccount][storemanGroupPK];
    }    

    /// @notice                 set htlc instance address
    /// @dev                    set htlc instance address
    /// @param htlc             htlc instance address of wanchain
    function setHTLCWAN(address htlc)
        public 
        isHalted
        onlyOwner
        returns (bool)
    {
        require(htlc != address(0));
        HTLCWAN = htlc;

        return true;
    }

    /// @notice                 set storemanGroup instance address
    /// @dev                    set storemanGroup instance address
    /// @param admin            storemanGroup instance address
    function setStoremanGroupAdmin(address admin)
        public 
        isHalted
        onlyOwner
        returns (bool) 
    {
        require(admin != address(0));
        storemanGroupAdmin = admin;

        return true;
    }

    /// @notice                 set token manager instance address
    /// @dev                    set token manager instance address
    /// @param tm               token manager instance address
    function setTokenManager(address tm)
        public
        isHalted
        onlyOwner
        returns (bool)
    {
        require(tm != address(0));
        tokenManager = tm;

        return true;
    }

    /// @notice                 set storeman group's quota
    /// @param tokenOrigAccount token account of original chain
    /// @param storemanGroupPK  storemanGroup PK
    /// @param quota            a storemanGroup's quota    
    function setStoremanGroupQuota(bytes tokenOrigAccount, bytes storemanGroupPK, uint quota) 
        external
        onlyStoremanGroupAdmin
        onlyMeaningfulValue(quota)
        returns (bool)
    {
        require(tokenOrigAccount.length != 0 && storemanGroupPK.length != 0);
        require(!isStoremanGroup(tokenOrigAccount, storemanGroupPK));
        quotaMap[tokenOrigAccount][storemanGroupPK] = StoremanGroupQuota(quota, 0, 0, 0);

        return true;
    }

    function applyUnregistration(bytes tokenOrigAccount, bytes storemanGroupPK)
        external 
        notHalted
        onlyStoremanGroupAdmin
        returns (bool)
    {
        require(isActiveStoremanGroup(tokenOrigAccount, storemanGroupPK));

        unregistrationMap[tokenOrigAccount][storemanGroupPK] = true;

        return true;
    }

    function unregisterStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK, bool isNormal)
        external
        notHalted
        onlyStoremanGroupAdmin
        returns (bool)
    {
        if (isNormal) {
            require(unregistrationMap[tokenOrigAccount][storemanGroupPK]);
            require(isDebtPaidOff(tokenOrigAccount, storemanGroupPK));    
        }
        
        StoremanGroupQuota storage smgInfo = quotaMap[tokenOrigAccount][storemanGroupPK];

        unregistrationMap[tokenOrigAccount][storemanGroupPK] = false;

        smgInfo._quota = uint(0);

        return true;
    }

    /// @notice                 frozen WERC token quota
    /// @dev                    frozen WERC token quota
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  handler PK
    /// @param value            amout of WERC20 quota to be frozen
    /// @return                 true if successful
    function lockQuota(bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        notHalted 
        onlyHTLCWAN 
        onlyMeaningfulValue(value)
        returns (bool)
    {
        /// Make sure an active storemanGroup is provided to handle transactions
        require(isActiveStoremanGroup(tokenOrigAccount, storemanGroupPK));
        /// Make sure a valid recipient provided
        ///require(!isActiveStoremanGroup(tokenOrigAccount, recipientPK));

        /// Make sure enough inbound quota available
        StoremanGroupQuota storage quotaInfo = quotaMap[tokenOrigAccount][storemanGroupPK];
        require(quotaInfo._quota.sub(quotaInfo._receivable.add(quotaInfo._debt)) >= value);

        /// Only can be called by an unregistration applied storemanGroup who has reset its receivable and payable
        /// if (unregistrationMap[tokenOrigAccount][recipientPK]) {
        ///     StoremanGroupQuota storage _r = quotaMap[tokenOrigAccount][recipientPK];
        ///     require(_r._receivable == 0 && _r._payable == 0 && _r._debt != 0);
        /// }
        
        /// Increase receivable
        quotaInfo._receivable = quotaInfo._receivable.add(value);

        return true;
    }

    /// @notice                 defrozen WERC20 quota
    /// @dev                    defrozen WERC20 quota
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  handler PK
    /// @param value            amount of WERC20 quota to be locked
    /// @return                 true if successful
    function unlockQuota(bytes tokenOrigAccount, bytes storemanGroupPK, uint value) 
        external
        notHalted
        onlyHTLCWAN
        onlyMeaningfulValue(value)
        returns (bool)
    {
        /// Make sure a valid storeman provided
        require(isStoremanGroup(tokenOrigAccount, storemanGroupPK));

        StoremanGroupQuota storage quota = quotaMap[tokenOrigAccount][storemanGroupPK];

        /// Make sure this specified storemanGroup has enough inbound receivable to be unlocked
        require(quota._receivable >= value);

        /// Credit receivable, double-check receivable is no less than value to be unlocked
        quota._receivable = quota._receivable.sub(value);

        return true;
    }

    /// @notice                 mint WERC token or payoff storemanGroup debt
    /// @dev                    mint WERC20 token or payoff storemanGroup debt
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  handler PK
    /// @param recipient        address that will receive WERC20 token
    /// @param value            amount of WERC20 token to be minted
    /// @return                 success of token mint
    function mintToken(bytes tokenOrigAccount, bytes storemanGroupPK, address recipient, uint value)
        external
        notHalted
        onlyHTLCWAN
        onlyMeaningfulValue(value)
        returns (bool)
    {
        /// Make sure a legit storemanGroup provided
        require(isStoremanGroup(tokenOrigAccount, storemanGroupPK));
        /// Make sure a legit recipient provided
        ///require(!isActiveStoremanGroup(tokenOrigAccount, recipientPK));

        StoremanGroupQuota storage _q = quotaMap[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        _q._receivable = _q._receivable.sub(value);
        _q._debt = _q._debt.add(value);

        // ********************************************************* 
        // Change to use storeman group PK, can't get destination PK
        // ********************************************************* 
        /// Branch - mint token to an ordinary account
        // if (!isStoremanGroup(tokenOrigAccount, recipientPK)) {
            /// Mint token to the recipient
          
            bytes32 key;
            key = TokenInterface(tokenManager).mapKey(tokenOrigAccount);
            address instance;
            (,instance,,,,,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(key);

            // TODO: needs to pass recipient address !!!
            require(WERCProtocol(instance).mint(recipient, value));

            return true;

        // ********************************************************* 
        // Change to use storeman group PK, can't get destination PK
        // ********************************************************* 

        // } else if (unregistrationMap[tokenOrigAccount][recipientPK]) {
        //   /// Branch - storemanGroup unregistration
        //   StoremanGroupQuota storage _r = quotaMap[tokenOrigAccount][recipientPK];
        //   /// Adjust the unregistering smg debt
        //   if (value >= _r._debt) {
        //     _r._debt = 0;
        //   } else {
        //     _r._debt = _r._debt.sub(value);
        //   }

        //   return true;
        // }

        // return false;
    }

    /// @notice                 lock WERC20 token and initiate an outbound transaction
    /// @dev                    lock WERC20 token and initiate an outbound transaction
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  qutbound storemanGroup handler PK
    /// @param value            amount of WERC20 token to be locked
    /// @return                 success of token locking
    function lockToken(bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        notHalted
        onlyHTLCWAN 
        onlyMeaningfulValue(value)
        returns (bool)
    { 
        /// Make sure a valid storemanGroup and a legit initiator provided
        require(isActiveStoremanGroup(tokenOrigAccount, storemanGroupPK));
        //require(!isStoremanGroup(tokenOrigAccount, initiatorPK));

        StoremanGroupQuota storage quota = quotaMap[tokenOrigAccount][storemanGroupPK];
        /// Make sure it has enough outboundQuota 
        require(quota._debt.sub(quota._payable) >= value);

        /// Adjust quota record
        quota._payable = quota._payable.add(value);

        return true;
    }

    /// @notice                 unlock WERC20 token
    /// @dev                    unlock WERC20 token
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  storemanGroup handler PK
    /// @param value            amount of token to be unlocked
    /// @return                 success of token unlocking
    function unlockToken(bytes tokenOrigAccount, bytes storemanGroupPK, uint value) 
        external
        notHalted
        onlyHTLCWAN
        onlyMeaningfulValue(value)
        returns (bool)
    {
        require(isStoremanGroup(tokenOrigAccount, storemanGroupPK));
        /// Make sure it has enough quota for a token unlocking
        StoremanGroupQuota storage quotaInfo = quotaMap[tokenOrigAccount][storemanGroupPK];
        require(quotaInfo._payable >= value);

        /// Adjust quota record
        quotaInfo._payable = quotaInfo._payable.sub(value);

        return true;
    }

    /// @notice                 burn WERC20 token
    /// @dev                    burn WERC20 token
    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  crosschain transaction handler PK
    /// @param value            amount of WERC20 token to be burnt
    /// @return                 success of burn token
    function burnToken(bytes tokenOrigAccount, bytes storemanGroupPK, uint value) 
        external
        notHalted
        onlyHTLCWAN
        onlyMeaningfulValue(value)
        returns (bool)
    { 
        require(isStoremanGroup(tokenOrigAccount, storemanGroupPK));
        StoremanGroupQuota storage quotaInfo = quotaMap[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        quotaInfo._debt = quotaInfo._debt.sub(value);
        quotaInfo._payable = quotaInfo._payable.sub(value);

        /// Process the transaction
        bytes32 key;
        key = TokenInterface(tokenManager).mapKey(tokenOrigAccount);
        address instance;
        (,instance,,,,,,,,,,) = TokenInterface(tokenManager).mapTokenInfo(key);
        require(WERCProtocol(instance).burn(HTLCWAN, value));
        return true;
    }

    /// @notice                 transfer debt from src to dst
    /// @dev                    frozen WERC token quota
    /// @param tokenOrigAccount account of token supported
    /// @param srcStoremanGroupPK  src handler PK
    /// @param dstStoremanGroupPK  dst handler PK
    /// @param value            amout of debt to be frozen
    /// @return                 true if successful
    function lockDebt(bytes tokenOrigAccount, bytes dstStoremanGroupPK, bytes srcStoremanGroupPK, uint value)
        external
        notHalted 
        onlyHTLCWAN 
        onlyMeaningfulValue(value)
        returns (bool)
    {
        /// Make sure an active storemanGroup is provided to handle transactions
        require(isActiveStoremanGroup(tokenOrigAccount, dstStoremanGroupPK));
        /// TODO: what to check srcStoreman group???
        require(!isActiveStoremanGroup(tokenOrigAccount, srcStoremanGroupPK));

        /// src: there's no processing tx, and have enough debt!
        StoremanGroupQuota storage src = quotaMap[tokenOrigAccount][srcStoremanGroupPK];
        require(src._receivable == uint(0) && src._payable == uint(0) && src._debt >= value);

        /// dst: has enough quota 
        StoremanGroupQuota storage dst = quotaMap[tokenOrigAccount][dstStoremanGroupPK];
        require(dst._quota.sub(dst._receivable.add(dst._debt)) >= value);

        dst._receivable = dst._receivable.add(value);
        src._payable = src._payable.add(value);
        return true;
    }

    /// @notice                 defrozen WERC20 quota
    /// @dev                    defrozen WERC20 quota
    /// @param tokenOrigAccount account of token supported
    /// @param dstStoremanPK    dst PK
    /// @param srcStoremanPK    src PK
    /// @param value            amount of WERC20 quota to be locked
    /// @return                 true if successful
    function unlockDebt(bytes tokenOrigAccount, bytes dstStoremanPK, bytes srcStoremanPK, uint value) 
        external
        notHalted
        onlyHTLCWAN
        onlyMeaningfulValue(value)
        returns (bool)
    {
        /// Make sure a valid storeman provided
        require(isStoremanGroup(tokenOrigAccount, dstStoremanPK));
        /// TODO: what to check srcStoreman group???
        require(!isActiveStoremanGroup(tokenOrigAccount, srcStoremanPK));

        StoremanGroupQuota storage dst = quotaMap[tokenOrigAccount][dstStoremanPK];
        /// Make sure this specified storemanGroup has enough inbound receivable to be unlocked
        require(dst._receivable >= value);

        StoremanGroupQuota storage src = quotaMap[tokenOrigAccount][srcStoremanPK];
        require(src._payable >= value);

        /// Credit receivable, double-check receivable is no less than value to be unlocked
        dst._receivable = dst._receivable.sub(value);
        src._payable = src._payable.sub(value);
    }

    /// @notice                 mint WERC token or payoff storemanGroup debt
    /// @dev                    mint WERC20 token or payoff storemanGroup debt
    /// @param tokenOrigAccount account of token supported
    /// @param dstStoremanPK    dst PK
    /// @param srcStoremanPK    src PK
    /// @param value            amount of WERC20 token to be minted
    /// @return                 success of token mint
    function redeemDebt(bytes tokenOrigAccount, bytes dstStoremanPK, bytes srcStoremanPK, uint value)
        external
        notHalted
        onlyHTLCWAN
        onlyMeaningfulValue(value)
        returns (bool)
    {
        /// Make sure a legit storemanGroup provided
        require(isStoremanGroup(tokenOrigAccount, dstStoremanPK));
        /// TODO: what to check srcStoreman group???
        require(!isActiveStoremanGroup(tokenOrigAccount, srcStoremanPK));

        StoremanGroupQuota storage dst = quotaMap[tokenOrigAccount][dstStoremanPK];
        StoremanGroupQuota storage src = quotaMap[tokenOrigAccount][srcStoremanPK];

        /// Adjust quota record
        dst._receivable = dst._receivable.sub(value);
        dst._debt = dst._debt.add(value);

        src._payable = src._payable.sub(value);
        src._debt = src._debt.sub(value);

        return true;
    }

    /// @notice                 update storeman group PK
    /// @dev                    frozen WERC token quota
    /// @param tokenOrigAccount account of token supported
    /// @param oldStoremanGroupPK  src handler PK
    /// @param newStoremanGroupPK  dst handler PK
    /// @return                 true if successful
    function updateStoremanGroupPK(bytes tokenOrigAccount, bytes oldStoremanGroupPK, bytes newStoremanGroupPK)
        external
        notHalted 
        onlyStoremanGroupAdmin
        returns (bool)
    {
        /// Make sure an active storemanGroup is provided to handle transactions
        require(!isStoremanGroup(tokenOrigAccount, newStoremanGroupPK));
        require(!isActiveStoremanGroup(tokenOrigAccount, oldStoremanGroupPK));

        /// src: there's no processing tx, and have enough debt!
        StoremanGroupQuota storage q = quotaMap[tokenOrigAccount][oldStoremanGroupPK];
        require(q._receivable == uint(0) && q._payable == uint(0) && q._quota > uint(0));

        quotaMap[tokenOrigAccount][newStoremanGroupPK] = StoremanGroupQuota(q._quota, 0, 0, q._debt);
        q._quota = uint(0);
        q._debt = uint(0);

        return true;
    }

    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  crosschain transaction handler PK 
    function isStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK)
        public
        view
        returns (bool)
    {
        return quotaMap[tokenOrigAccount][storemanGroupPK]._quota != uint(0);
    }

    /// @param tokenOrigAccount account of token supported
    /// @param storemanGroupPK  crosschain transaction handler PK 
    function isActiveStoremanGroup(bytes tokenOrigAccount, bytes storemanGroupPK) 
        public
        view 
        returns (bool)
    {
        return isStoremanGroup(tokenOrigAccount, storemanGroupPK) && !unregistrationMap[tokenOrigAccount][storemanGroupPK];
    }

    /// @notice                 query storemanGroup quota detail
    /// @dev                    query storemanGroup detail
    /// @param  tokenOrigAccount  account of token supported
    /// @param  storemanGroupPK Pk of storemanGroup to be queried
    /// @return quota           total quota of this storemanGroup in ETH/WERC20
    /// @return inboundQuota    inbound crosschain transaction quota of this storemanGroup in ETH/WERC20
    /// @return outboundQuota   qutbound crosschain transaction quota of this storemanGroup in ETH/WERC20
    /// @return receivable      amount of WERC20 to be minted through this storemanGroup
    /// @return payable         amount of WERC20 to be burnt through this storemanGroup
    /// @return debt            amount of WERC20 been minted through this storemanGroup
    function queryStoremanGroupQuota(bytes tokenOrigAccount, bytes storemanGroupPK)
        public 
        view
        returns (uint, uint, uint, uint, uint, uint)
    {
        if (!isStoremanGroup(tokenOrigAccount, storemanGroupPK)) {
            return (0, 0, 0, 0, 0, 0);
        }

        StoremanGroupQuota storage quotaInfo = quotaMap[tokenOrigAccount][storemanGroupPK];

        uint inboundQuota = quotaInfo._quota.sub(quotaInfo._receivable.add(quotaInfo._debt));
        uint outboundQuota = quotaInfo._debt.sub(quotaInfo._payable);

        return (quotaInfo._quota, inboundQuota, outboundQuota, quotaInfo._receivable, quotaInfo._payable, quotaInfo._debt);
    }

    /// @notice                 check if a specified storemanGroup has paid off its debt
    /// @dev                    check if a specified storemanGroup has paid off its debt
    /// @param  tokenOrigAccount  account of token supported
    /// @param  storemanGroupPK   the PK of storemanGroup to be checked 
    /// @return                 result of debt status check
    function isDebtPaidOff(bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns (bool)
    {
        StoremanGroupQuota storage quotaInfo = quotaMap[tokenOrigAccount][storemanGroupPK];
        return quotaInfo._receivable == uint(0) && quotaInfo._payable == uint(0) && quotaInfo._debt == uint(0);
    }

    /// @notice function for destroy contract
    function kill() 
        public
        isHalted
        onlyOwner
    {
        selfdestruct(owner);
    } 

}
