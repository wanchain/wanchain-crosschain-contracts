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
    function isTokenRegistered(bytes) public view returns(bool);
    function mapKey(bytes) external view returns(bytes32);
    function mapTokenInfo(bytes32) public view returns(bytes, address, uint, uint, uint, bool, uint, uint, uint, uint, uint, bytes);
    function DEFAULT_PRECISE() public returns (uint);
}

interface StoremanGroupInterface {
    function mapStoremanGroup(bytes, bytes) external returns(uint, uint, uint, uint, address, uint);
    function receiveFee(bytes, bytes, uint) external;
}

interface QuotaInterface {
    function lockQuota(bytes, bytes, uint) external returns (bool);
    function unlockQuota(bytes, bytes, uint) external returns (bool);
    function mintToken(bytes,  bytes, address, uint) external returns (bool);
    function lockToken(bytes, bytes, uint) external returns (bool);
    function unlockToken(bytes, bytes, uint) external returns (bool);
    function burnToken(bytes, bytes, uint) external returns (bool);
    function lockDebt(bytes, bytes, bytes, uint) external returns (bool);
    function unlockDebt(bytes, bytes, bytes, uint) external returns (bool);
    function redeemDebt(bytes,  bytes, bytes, uint) external returns (bool);
    function queryStoremanGroupQuota(bytes, bytes) public view returns (uint, uint, uint, uint, uint, uint);
}

interface WERCProtocol {
    function transfer(address, uint) public returns (bool);
    function transferFrom(address, address, uint) public returns (bool);
    function decimals() public returns(uint8);
}

interface SignatureVerifier {
    function verify(bytes32, bytes, bytes) public returns(bool);
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
    enum TxDirection {Inbound, Outbound, DebtTransfer}

    /// hash algorithms for xHash
    enum HashAlgorithms {keccak256, sha256, ripemd160} // sha3 is alias of keccak256

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
        bytes storemanPK;       // HTLC transaction storeman PK 
        uint value;             // HTLC transfer value of token
        TxStatus status;        // HTLC transaction status
        uint lockedTime;        // HTLC transaction locked time
        uint beginLockedTime;   // HTLC transaction begin locked time
        bytes srcPK;            // HTLC transaction source PK
    }

    /**
     *
     * VARIABLES
     *
     */

    /// @notice mapping of hash(x) to HTLCTx -- token->xhash->htlcdata
    mapping(bytes => mapping(bytes32 => HTLCTx)) private xHashHTLCTxsMap;

    /// @notice mapping of hash(x) to shadow address
    mapping(bytes => mapping(bytes32 => bytes)) private mapXHashShadow;

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

    /// @notice                  function for get HTLC info
    /// @param tokenOrigAccount  token account of original chain
    /// @param xHash             xHash
    function mapXHashHTLCTxs(bytes tokenOrigAccount, bytes32 xHash)
        public
        view
        returns (address, address, bytes, uint)
    {
        HTLCTx storage t = xHashHTLCTxsMap[tokenOrigAccount][xHash];
        return (t.source, t.destination, t.storemanPK, t.value);
    }

    /// @notice                  function for get HTLC info
    /// @param tokenOrigAccount  token account of original chain
    /// @param xHash             xHash
    function getDebtTransferSrcPK(bytes tokenOrigAccount, bytes32 xHash)
        public
        view
        returns (bytes)
    {
        HTLCTx storage t = xHashHTLCTxsMap[tokenOrigAccount][xHash];
        require(t.direction != TxDirection.DebtTransfer);
        return (t.srcPK);
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
    /// @param  tokenOrigAccount  account of original chain token 
    /// @param  xHash           hash of HTLC random number
    /// @return time            return left locked time, in seconds. return uint(0xffffffffffffffff) if xHash does not exist
    function getHTLCLeftLockedTime(bytes tokenOrigAccount, bytes32 xHash) 
        public 
        view 
        returns(uint time) 
    {
        HTLCTx storage info = xHashHTLCTxsMap[tokenOrigAccount][xHash];
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
        returns (bool)
    {
        require(ratio <= RATIO_PRECISE);
        revokeFeeRatio = ratio;
        return true;
    }

    /// @notice                 check HTLC transaction exist or not
    /// @param  tokenOrigAccount  account of original chain token
    /// @param  xHash           hash of HTLC random number
    /// @return exist           return true if exist
    function xHashExist(bytes tokenOrigAccount, bytes32 xHash) 
        public 
        view 
        returns(bool exist) 
    {
        return xHashHTLCTxsMap[tokenOrigAccount][xHash].status != TxStatus.None;
    }
    
    /// @notice                 add HTLC transaction info
    /// @param  tokenOrigAccount  account of original chain token 
    /// @param  direction       HTLC transaction direction
    /// @param  src             HTLC transaction source address
    /// @param  des             HTLC transaction destination address
    /// @param  xHash           hash of HTLC random number
    /// @param  value           HTLC transfer value of token
    /// @param  isFirstHand     is HTLC first hand trade?
    /// @param  shadow          shadow address. used for receipt coins on opposite block chain
    function addHTLCTx(bytes tokenOrigAccount, TxDirection direction, address src, address des, bytes32 xHash, uint value, bool isFirstHand, bytes shadow, bytes storemanPK, bytes srcPK)
        internal
    {
        require(value != 0);
        require(!xHashExist(tokenOrigAccount, xHash));
        
        xHashHTLCTxsMap[tokenOrigAccount][xHash] = HTLCTx(direction, src, des, storemanPK, value, TxStatus.Locked, isFirstHand ? lockedTime.mul(2) : lockedTime, now, srcPK);
        if (isFirstHand) mapXHashShadow[tokenOrigAccount][xHash] = shadow;
    }
    
    /// @notice                 refund coins from HTLC transaction
    /// @param  tokenOrigAccount  account of original chain token 
    /// @param  x               random number of HTLC
    /// @param  hashAlgorithms  hash algorithms to calculate xHash
    /// @param  direction       HTLC transaction direction
    /// @return xHash           return hash of HTLC random number
    function redeemHTLCTx(bytes tokenOrigAccount, bytes32 x, uint hashAlgorithms, TxDirection direction)
        internal
        returns(bytes32 xHash)
    {
        if (hashAlgorithms == uint(HashAlgorithms.sha256)) {
            xHash = sha256(x);
        } else if (hashAlgorithms == uint(HashAlgorithms.ripemd160)) {
            xHash = ripemd160(x);
        } else { // default
            xHash = keccak256(x);
        }
        
        HTLCTx storage info = xHashHTLCTxsMap[tokenOrigAccount][xHash];
        require(info.status == TxStatus.Locked);
        require(info.direction == direction);
        if (info.direction != TxDirection.DebtTransfer) {
            require(info.destination == msg.sender);
        }
        require(now < info.beginLockedTime.add(info.lockedTime));
        
        info.status = TxStatus.Refunded;
        return (xHash);
    }
    
    /// @notice                 revoke HTLC transaction
    /// @param  tokenOrigAccount  account of original chain token 
    /// @param  xHash           hash of HTLC random number
    /// @param  direction       HTLC transaction direction
    /// @param  loose           whether give counterparty revoking right
    function revokeHTLCTx(bytes tokenOrigAccount, bytes32 xHash, TxDirection direction, bool loose)
        internal
    {
        HTLCTx storage info = xHashHTLCTxsMap[tokenOrigAccount][xHash];
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

contract HTLCWAN is HTLCBase {

    /**
     *
     * VARIABLES
     *
     */

    /// token manager instance address
    address public tokenManager;
    /// quota ledger instance address
    address public quotaLedger;
    /// storemanGroup admin instance address
    address public storemanGroupAdmin;
    /// signature verifier instance address
    address public signVerifier;

    /// @notice transaction fee
    mapping(bytes => mapping(bytes32 => uint)) private mapXHashFee;

    /**
     *
     * EVENTS
     *
     **/

    /// @notice                 event of store debt lock
    /// @param srcStoremanPK    PK of src storeman
    /// @param dstStoremanPK    PK of dst storeman
    /// @param xHash            hash of HTLC random number
    /// @param value            exchange value
    /// @param tokenOrigAccount account of original chain token  
    event DebtLockLogger(bytes indexed srcStoremanPK, bytes indexed dstStoremanPK, bytes32 indexed xHash, uint value, bytes tokenOrigAccount);
    /// @notice                 event of refund storeman debt
    /// @param storemanGroup    address of storemanGroup, used to receive WERC20 token
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token  
    event DebtRedeemLogger(bytes indexed storemanGroup, bytes32 indexed xHash, bytes32 x, bytes tokenOrigAccount);
    /// @notice                 event of revoke storeman debt
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token  
    event DebtRevokeLogger(address indexed wanAddr, bytes storemanPK, bytes32 indexed xHash, bytes tokenOrigAccount);

    /**
     *
     * MODIFIERS
     *
     */

    /// @dev Check relevant contract addresses must be initialized before call its method
    modifier initialized() {
        require(tokenManager != address(0));
        require(quotaLedger != address(0));
        require(storemanGroupAdmin != address(0));
        require(signVerifier != address(0));
        _;
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                 lock storeman debt 
    /// @param  tokenOrigAccount  account of original chain token  
    /// @param  xHash           hash of HTLC random number
    /// @param  srcStoremanPK   PK of src storeman
    /// @param  dstStoremanPK   PK of dst storeman
    /// @param  R               signature
    /// @param  s               signature
     function lock(bytes tokenOrigAccount, bytes32 xHash, bytes srcStoremanPK, bytes dstStoremanPK, uint value, bytes R, bytes s) 
         public 
         initialized 
         notHalted
         returns(bool) 
     {
         require(TokenInterface(tokenManager).isTokenRegistered(tokenOrigAccount));
         //bytes32 mhash = keccak256(abi.encode(tokenOrigAccount, xHash, srcStoremanPK, dstStoremanPK));
         require(verifySignature(keccak256(abi.encode(tokenOrigAccount, xHash, srcStoremanPK, dstStoremanPK)), R, s));
       
         var (,,,,,debt) = QuotaInterface(quotaLedger).queryStoremanGroupQuota(tokenOrigAccount, srcStoremanPK);
         require(value<=debt);

         addHTLCTx(tokenOrigAccount, TxDirection.DebtTransfer, msg.sender, address(0), xHash, value, false, new bytes(0), dstStoremanPK, srcStoremanPK);
         require(QuotaInterface(quotaLedger).lockDebt(tokenOrigAccount, dstStoremanPK, srcStoremanPK, value));
         // emit logger...
         emit DebtLockLogger(srcStoremanPK, dstStoremanPK, xHash, value, tokenOrigAccount);
         return true;
     }

    /// @notice                 refund WERC20 token from recorded HTLC transaction, should be invoked before timeout
    /// @param  tokenOrigAccount  account of original chain token  
    /// @param  x               HTLC random number
    function redeem(bytes tokenOrigAccount, bytes32 x, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
         require(TokenInterface(tokenManager).isTokenRegistered(tokenOrigAccount));
         bytes32 mhash = keccak256(abi.encode(tokenOrigAccount, x));
         require(verifySignature(mhash, R, s));

        var (,,,,,,,,,,ha,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
        bytes32 xHash= redeemHTLCTx(tokenOrigAccount, x, ha, TxDirection.DebtTransfer);
        var (,,storemanPK,value) = mapXHashHTLCTxs(tokenOrigAccount, xHash);
        var srcPK = getDebtTransferSrcPK(tokenOrigAccount, xHash);
        require(QuotaInterface(quotaLedger).redeemDebt(tokenOrigAccount, storemanPK, srcPK, value));

        emit DebtRedeemLogger(storemanPK, xHash, x, tokenOrigAccount);
        return true;
    }

    /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    /// @param tokenOrigAccount account of original chain token  
    /// @param xHash            hash of HTLC random number
    /// @param  R               signature
    /// @param  s               signature
    function revoke(bytes tokenOrigAccount, bytes32 xHash, bytes R, bytes s) 
        public 
        initialized 
        notHalted
        returns(bool) 
    {
        /// bytes memory mesg=abi.encode(tokenOrigAccount, xHash);
        bytes32 mhash = keccak256(abi.encode(tokenOrigAccount, xHash));
        verifySignature(mhash, R, s);

        revokeHTLCTx(tokenOrigAccount, xHash, TxDirection.DebtTransfer, false);
        var (source,,storemanPK,value) = mapXHashHTLCTxs(tokenOrigAccount, xHash);
        var srcPK = getDebtTransferSrcPK(tokenOrigAccount, xHash);
        require(QuotaInterface(quotaLedger).unlockDebt(tokenOrigAccount, storemanPK, srcPK, value));

        emit DebtRevokeLogger(source, storemanPK, xHash, tokenOrigAccount);
        return true;
    }

    /// @notice                 getting outbound tx fee
    /// @param  tokenOrigAccount  account of original chain token  
    /// @param  storemanGroupPK   address of storemanGroup
    /// @param  value           HTLC tx value
    /// @return                 needful fee
    function getOutboundFee(bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        private
        returns(uint)
    {
        TokenInterface ti = TokenInterface(tokenManager);
        StoremanGroupInterface smgi = StoremanGroupInterface(storemanGroupAdmin);
        var (,tokenWanAddr,token2WanRatio,,,,,,,,,) = ti.mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
        var (,,txFeeratio,,,) = smgi.mapStoremanGroup(tokenOrigAccount, storemanGroupPK);
        uint temp = value.mul(token2WanRatio).mul(txFeeratio).mul(1 ether);
        return temp.div(ti.DEFAULT_PRECISE()).div(ti.DEFAULT_PRECISE()).div(10**uint(WERCProtocol(tokenWanAddr).decimals()));
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

    /// @notice                 set quota ledger SC address(only owner have the right)
    /// @param  addr            quota ledger SC instance address
    function setQuotaLedger(address addr)
        public 
        onlyOwner 
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        quotaLedger = addr;

        return true;
    }

    /// @notice                 set token manager SC instance address
    /// @param  addr            token manager SC instance address    
    function setTokenManager(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        tokenManager = addr;

        return true;
    }

    /// @notice                 set storeman group admin SC address(only owner have the right)
    /// @param  addr            storeman group admin SC address
    function setStoremanGroupAdmin(address addr)
        public
        onlyOwner
        isHalted
        returns (bool)
    {
        require(addr != address(0));
        storemanGroupAdmin = addr;

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
