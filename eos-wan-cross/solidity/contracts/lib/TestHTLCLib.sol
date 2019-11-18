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
    // ======= invoke the lib execution ============
    function init() public{
        htlcData.init();
    }

    function setRevokeFeeRatio(uint ratio) public{
        htlcData.setRevokeFeeRatio(ratio);
    }

    function getGlobalInfo() public view returns (uint,uint){
        return htlcData.getGlobalInfo();
    }

    // ======= get the result of lib execution. ============
    function lockedTime() public view returns (uint){
        return htlcData.lockedTime;
    }

    function ratioPrecise() public view returns (uint){
        return htlcData.ratioPrecise;
    }

    function revokeFeeRatio() public view returns (uint){
        return htlcData.revokeFeeRatio;
    }
}