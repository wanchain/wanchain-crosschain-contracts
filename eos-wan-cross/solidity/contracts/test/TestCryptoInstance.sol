pragma solidity^0.4.24;

import "../htlc/lib/commonLib.sol";

contract TestCryptoInstance {

    function verifySignature(bytes32 message, bytes PK, bytes R, bytes32 s) external pure {
      commonLib.verifySignature(message, PK, R, s);
    }

    function inSmgLock(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanGroupPK, bytes R, bytes32 s)
        public
        pure
        returns (bytes32, bytes)
    {
        bytes memory encoded = abi.encode(tokenOrigAccount, xHash, wanAddr, value, storemanGroupPK);
        bytes32 mHash = sha256(encoded);
        commonLib.verifySignature(mHash, storemanGroupPK, R, s);
        return (mHash, encoded);
    }
}