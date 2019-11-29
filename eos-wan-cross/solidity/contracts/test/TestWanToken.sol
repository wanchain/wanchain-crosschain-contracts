pragma solidity ^0.4.24;

import "../tokenManager/WanToken.sol";
import "../components/BasicStorage.sol";
import "./TestIOwned.sol";

contract TestWanToken is BasicStorage {

    function createToken(string tokenName, string tokenSymbol, uint8 tokenDecimal) external {
        address tokenInst = new WanToken(tokenName, tokenSymbol, tokenDecimal);
        addressData.setStorage(bytes(tokenName), bytes(tokenSymbol), tokenInst);
        uintData.setStorage(bytes(tokenName), bytes(tokenSymbol), tokenDecimal);
        // TestIOwned(tokenInst).changeOwner(msg.sender);
    }

    function changeOwner(string tokenName, string tokenSymbol) external {
        address tokenInst = addressData.getStorage(bytes(tokenName), bytes(tokenSymbol));
        TestIOwned(tokenInst).changeOwner(msg.sender);
    }

    function acceptOwnership(string tokenName, string tokenSymbol) external {
        address tokenInst = addressData.getStorage(bytes(tokenName), bytes(tokenSymbol));
        TestIOwned(tokenInst).acceptOwnership();
    }

    function getTokenAddr(string tokenName, string tokenSymbol) external returns (address) {
        return addressData.getStorage(bytes(tokenName), bytes(tokenSymbol));
    }

    function getTokenDecimal(string tokenName, string tokenSymbol) external returns (uint8) {
        return uint8(uintData.getStorage(bytes(tokenName), bytes(tokenSymbol)));
    }

    function destroyToken(string tokenName, string tokenSymbol) external {
        addressData.delStorage(bytes(tokenName), bytes(tokenSymbol));
        uintData.delStorage(bytes(tokenName), bytes(tokenSymbol));
    }
}