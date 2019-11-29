
pragma solidity ^0.4.24;

interface TestIOwned {
    function changeOwner(address _newOwner) public;
    function acceptOwnership() public;
}
