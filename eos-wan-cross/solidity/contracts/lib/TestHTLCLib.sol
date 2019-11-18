pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./HTLCLib.sol";
contract TestHTLCLib {
    using SafeMath for uint;
    using HTLCLib  for HTLCLib.Data;

    HTLCLib.Data public htlcData;
    uint         public uTest;

    constructor() public {
    }
    // execute the function of the lib.
    function init() public{
        htlcData.init();
    }

    // get the result of lib execution.
    function lockedTime() public view returns (uint){
        return htlcData.lockedTime;
    }

    function ratioPrecise() public view returns (uint){
        return htlcData.ratioPrecise;
    }

}