pragma solidity^0.4.24;

import "../htlc/lib/commonLib.sol";

contract CryptoInstance {

  function verifySignature(bytes32 message, bytes PK, bytes r, bytes32 s) external pure {
    commonLib.verifySignature(message, PK, r, s);
  }
}