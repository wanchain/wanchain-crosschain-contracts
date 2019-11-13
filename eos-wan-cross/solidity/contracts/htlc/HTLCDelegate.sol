/*

  Copyright 2019 Wanchain Foundation.

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
//

pragma solidity ^0.4.24;

import "../lib/QuotaLib.sol";
import "../components/Halt.sol";
import "../interfaces/ITokenManager.sol";

contract HTLCDelegate is Halt {
    using QuotaLib for QuotaLib.Data;
    /**
     *
     * VARIABLES
     *
     */

    /// token manager instance interface
    ITokenManager public tokenManager;

    /// quota ledger
    QuotaLib.Data quotaLedger;
    /// storemanGroup admin instance address
    // address public storemanGroupAdmin;
    /// signature verifier instance address
    // address public signVerifier;

    /// @notice transaction fee
    mapping(bytes => mapping(bytes32 => uint)) private mapXHashFee;

    /**
     *
     * EVENTS
     *
     **/

    /// @notice                 event of exchange WERC20 token with original chain token request
    /// @param storemanGroupPK  PK of storemanGroup
    /// @param wanAddr          address of wanchain, used to receive WERC20 token
    /// @param xHash            hash of HTLC random number
    /// @param value            HTLC value
    /// @param tokenOrigAccount account of original chain token
    event InboundLockLogger(bytes storemanGroupPK, address indexed wanAddr, bytes32 indexed xHash, uint value, bytes tokenOrigAccount);
    /// @notice                 event of refund WERC20 token from exchange WERC20 token with original chain token HTLC transaction
    /// @param wanAddr          address of user on wanchain, used to receive WERC20 token
    /// @param storemanGroupPK  PK of storeman, the WERC20 token minter
    /// @param xHash            hash of HTLC random number
    /// @param x                HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event InboundRedeemLogger(address indexed wanAddr, bytes storemanGroupPK, bytes32 indexed xHash, bytes32 indexed x, bytes tokenOrigAccount);
    /// @notice                 event of revoke exchange WERC20 token with original chain token HTLC transaction
    /// @param storemanGroupPK  PK of storemanGroup
    /// @param xHash            hash of HTLC random number
    /// @param tokenOrigAccount account of original chain token
    event InboundRevokeLogger(bytes indexed storemanGroupPK, bytes32 indexed xHash, bytes tokenOrigAccount);

    /**
     *
     * MODIFIERS
     *
     */

    /// @dev Check relevant contract addresses must be initialized before call its method
    modifier initialized() {
        require(tokenManager != ITokenManager(address(0)), "Token manager is null");
        // require(storemanGroupAdmin != address(0));
        _;
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    // Test code
    function newQuota(bytes tokenOrigAccount, uint value, bytes storemanPK) external {
        quotaLedger.newQuota(tokenOrigAccount, storemanPK, value);
    }
    //////////////////////////////////////////////////////////////////////////////////////////

    function setEconomics(address tokenManagerAddr) external {
        require(tokenManagerAddr != address(0), "Parameter is invalid");
        tokenManager = ITokenManager(tokenManagerAddr);
    }

    // /// @notice                 request exchange WERC20 token with original chain token(to prevent collision, x must be a 256bit random bigint)
    // /// @param  tokenOrigAccount  account of original chain token
    // /// @param  xHash           hash of HTLC random number
    // /// @param  wanAddr         address of user, used to receive WERC20 token
    // /// @param  value           exchange value
    // /// @param  storemanPK      PK of storeman
    // /// @param  r               signature
    // /// @param  s               signature
    function lock(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanPK, bytes r, bytes32 s)
        public
        initialized
        notHalted
        returns(bool)
    {
         require(tokenManager.isTokenRegistered(tokenOrigAccount), "Token is not registered");

         bytes32 mHash = sha256(abi.encode(tokenOrigAccount, xHash, wanAddr, value, storemanPK));
         require(verifySignature(mHash, storemanPK, r, s));
        
        //  addHTLCTx(tokenOrigAccount, TxDirection.Inbound, msg.sender, wanAddr, xHash, value, false, new bytes(0), storemanPK, new bytes(0));
        require(quotaLedger.inLock(tokenOrigAccount, storemanPK, value), "Quota lock failed");

        return true;
    }

    // /// @notice                 refund WERC20 token from recorded HTLC transaction, should be invoked before timeout
    // /// @param  tokenOrigAccount  account of original chain token  
    // /// @param  x               HTLC random number
    // function redeem(bytes tokenOrigAccount, bytes32 x) 
    //     public 
    //     initialized 
    //     notHalted
    //     returns(bool, address, bytes, bytes32) 
    // {
    //     var (,,,,,,,,,,ha,) = TokenInterface(tokenManager).mapTokenInfo(TokenInterface(tokenManager).mapKey(tokenOrigAccount));
    //     bytes32 xHash= redeemHTLCTx(tokenOrigAccount, x, ha, TxDirection.Inbound);
    //     var (source,destination,storemanPK,value) = mapXHashHTLCTxs(tokenOrigAccount, xHash);
    //     require(QuotaInterface(quotaLedger).mintToken(tokenOrigAccount, storemanPK, destination, value));

    //     //emit InboundRedeemLogger(destination, storemanPK, xHash, x, tokenOrigAccount);
    //     return (true, destination, storemanPK, xHash);
    // }

    // /// @notice                 revoke HTLC transaction of exchange WERC20 token with original chain token
    // /// @param tokenOrigAccount account of original chain token  
    // /// @param xHash            hash of HTLC random number
    // /// @param  R               signature
    // /// @param  s               signature
    // function revoke(bytes tokenOrigAccount, bytes32 xHash, bytes R, bytes32 s) 
    //     public 
    //     initialized 
    //     notHalted
    //     returns(bool, bytes) 
    // {
    //     /// bytes memory mesg=abi.encode(tokenOrigAccount, xHash);
    //     bytes32 mhash = sha256(abi.encode(tokenOrigAccount, xHash));
    //     var (source,,storemanPK,value) = mapXHashHTLCTxs(tokenOrigAccount, xHash);
    //     verifySignature(mhash, storemanPK, R, s);

    //     revokeHTLCTx(tokenOrigAccount, xHash, TxDirection.Inbound, false);
    //     require(QuotaInterface(quotaLedger).unlockQuota(tokenOrigAccount, storemanPK, value));

    //     //emit InboundRevokeLogger(storemanPK, xHash, tokenOrigAccount);
    //     return (true, storemanPK);
    // }

    // /// @notice       convert bytes to bytes32
    // /// @param b      bytes array
    // /// @param offset offset of array to begin convert
    // function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
    //     bytes32 out;
      
    //     for (uint i = 0; i < 32; i++) {
    //       out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
    //     }
    //     return out;
    // }

    // /// @notice             verify signature    
    // /// @param  mesg        message to be verified 
    // /// @param  R           Sigature info R
    // /// @param  s           Sigature info s
    // /// @return             true/false
    // function verifySignature(bytes32 mesg, bytes PK, bytes R, bytes32 s) 
    //     private
    //     returns (bool)
    // {
    //     bytes32 PKx=bytesToBytes32(PK, 1);
    //     bytes32 PKy=bytesToBytes32(PK, 33);

    //     bytes32 Rx=bytesToBytes32(R, 1);
    //     bytes32 Ry=bytesToBytes32(R, 33);

    //     require(SignatureVerifier(signVerifier).verify(s, PKx, PKy, Rx, Ry, mesg));
    //     return true;
    // }
}
