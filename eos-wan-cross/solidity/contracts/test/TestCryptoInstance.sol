pragma solidity^0.4.24;

import "../htlc/lib/commonLib.sol";

contract TestCryptoInstance {

  function verifySignature(bytes32 message, bytes PK, bytes R, bytes32 s) external pure {
    commonLib.verifySignature(message, PK, R, s);
  }

  function inSmgLock(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanGroupPK, bytes R, bytes32 s)
      public
      returns (bytes32, bytes)
  {
      bytes memory encoded = abi.encode(tokenOrigAccount, xHash, wanAddr, value, storemanGroupPK);
      bytes32 mHash = sha256(encoded);
      commonLib.verifySignature(mHash, storemanGroupPK, R, s);
      return (mHash, encoded);
  }

  function cutBytes(bytes b, uint offset) private pure returns (bytes) {
    bytes memory out = new bytes(b.length - offset);

    for (uint i = 0; i < b.length - offset; i++) {
      out[i] = b[offset + i];
    }
    return out;
  }

  function inSmgLockData(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanGroupPK)
      public
      returns (bytes32, bytes, bytes)
  {
    bytes memory encoded = abi.encode(tokenOrigAccount, xHash, wanAddr, value, storemanGroupPK);
    bytes memory cuted = cutBytes(encoded, 2);
    return (sha256(encoded), encoded, cuted);
  }

  function verifySha256(bytes message) external pure returns (bytes32) {
    return sha256(message);
  }

  function verifySha256Encode(bytes message) external pure returns (bytes32) {
    return sha256(abi.encode(message));
  }

  function verifySha256Packed(bytes message) external pure returns (bytes32) {
    return sha256(abi.encodePacked(message));
  }
}