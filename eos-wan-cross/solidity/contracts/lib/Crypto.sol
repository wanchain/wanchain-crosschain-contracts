pragma solidity ^0.4.24;

interface SignatureVerifier {
    function verify(bytes32, bytes32, bytes32, bytes32, bytes32, bytes32) external returns(bool);
}

/**
 * Crypto functions
 */
library Crypto {
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
    /// @param  message     message to be verified
    /// @param  R           Sigature info R
    /// @param  s           Sigature info s
    /// @return             true/false
    function verifySignature(address verifier, bytes32 message, bytes PK, bytes R, bytes32 s)
        private
        returns (bool)
    {
        bytes32 PKx = bytesToBytes32(PK, 1);
        bytes32 PKy = bytesToBytes32(PK, 33);
        bytes32 Rx = bytesToBytes32(R, 1);
        bytes32 Ry = bytesToBytes32(R, 33);
        require(SignatureVerifier(verifier).verify(s, PKx, PKy, Rx, Ry, message), "Failed to verifySignature");
        return true;
    }
}
