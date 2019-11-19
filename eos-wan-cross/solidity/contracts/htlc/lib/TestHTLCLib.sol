pragma solidity ^0.4.24;

import "../../lib/SafeMath.sol";
import "./HTLCLib.sol";
contract TestHTLCLib {
    using SafeMath for uint;
    using HTLCLib  for HTLCLib.Data;

    HTLCLib.Data public htlcData;
    uint         public uTest;

    constructor() public {
    }
    // ======= invoke the lib execution ============
    function setRevokeFeeRatio(uint ratio) public{
        htlcData.setRevokeFeeRatio(ratio);
    }

    function getGlobalInfo() public view returns (uint,uint){
        return htlcData.getGlobalInfo();
    }

    function addUserTx(bytes32 xHash, uint value, bytes shadow, bytes storemanPK)  public {
        return htlcData.addUserTx(xHash,value,shadow,storemanPK);
    }

    function addSmgTx(bytes32 xHash, uint value, address userAddr, bytes storemanPK) public{
        return htlcData.addSmgTx(xHash,value,userAddr,storemanPK);
    }

    function redeemUserTx(bytes32 x) public returns(bytes32 xHash){
        return htlcData.redeemUserTx(x);
    }

    function redeemSmgTx(bytes32 x) public returns(bytes32 xHash){
        return htlcData.redeemSmgTx(x);
    }

    function revokeUserTx(bytes32 xHash) public{
        return htlcData.revokeUserTx(xHash);
    }

    function revokeSmgTx(bytes32 xHash) public{
        return htlcData.revokeSmgTx(xHash);
    }

    // ======= get the result of lib execution. ============
    function revokeFeeRatio() public view returns (uint){
        return htlcData.revokeFeeRatio;
    }
    // used by invoke lib execution and by result getting
    function getUserTx(bytes32 xHash) public view returns (address, bytes, uint, bytes){
        return htlcData.getUserTx(xHash);
    }
    function getSmgTx(bytes32 xHash) public view returns (address, uint, bytes){
        return htlcData.getSmgTx(xHash);
    }

    function getUserTxStatus(bytes32 xHash) public view returns (HTLCLib.TxStatus){
        return htlcData.mapHashXUserTxs[xHash].baseTx.status;
    }

    function getSmgStatus(bytes32 xHash) public view returns (HTLCLib.TxStatus){
        return htlcData.mapHashXSmgTxs[xHash].baseTx.status;
    }
}