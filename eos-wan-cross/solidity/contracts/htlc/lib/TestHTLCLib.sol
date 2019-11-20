pragma solidity ^0.4.24;

import "../../lib/SafeMath.sol";
import "./HTLCLib.sol";
contract TestHTLCLib {
    using SafeMath for uint;
    using HTLCLib  for HTLCLib.Data;

    HTLCLib.Data htlcData;
    uint         _lockedTime;

    constructor() public {
        _lockedTime = 60; // 60s
    }
    // ======= invoke the lib execution ============

    function addUserTx(bytes32 xHash, uint value, bytes shadow, bytes storemanPK)  public {
        return htlcData.addUserTx(xHash,value,shadow,storemanPK);
    }

    function addSmgTx(bytes32 xHash, uint value, address userAddr, bytes storemanPK) public{
        return htlcData.addSmgTx(xHash,value,userAddr,storemanPK);
    }

    function addDebtTx(bytes32 xHash, uint value, bytes srcStoremanPK, bytes storemanPK) public{
        return htlcData.addDebtTx(xHash,value,srcStoremanPK,storemanPK);
    }

    function redeemUserTx(bytes32 x) public returns(bytes32 xHash){
        return htlcData.redeemUserTx(x);
    }

    function redeemSmgTx(bytes32 x) public returns(bytes32 xHash){
        return htlcData.redeemSmgTx(x);
    }

    function redeemDebtTx(bytes32 x) public returns(bytes32 xHash){
        return htlcData.redeemDebtTx(x);
    }

    function revokeUserTx(bytes32 xHash) public{
        return htlcData.revokeUserTx(xHash);
    }

    function revokeSmgTx(bytes32 xHash) public{
        return htlcData.revokeSmgTx(xHash);
    }

    function revokeDebtTx(bytes32 xHash) public{
        return htlcData.revokeDebtTx(xHash);
    }

    // ======= get the result of lib execution. ============
    // used by invoke lib execution and by result getting
    function getUserTx(bytes32 xHash) public view returns (address, bytes, uint, bytes){
        return htlcData.getUserTx(xHash);
    }
    function getSmgTx(bytes32 xHash) public view returns (address, uint, bytes){
        return htlcData.getSmgTx(xHash);
    }

    function getDebtTx(bytes32 xHash) public view returns (bytes, uint, bytes){
        return htlcData.getDebtTx(xHash);
    }


    function getUserTxStatus(bytes32 xHash) public view returns (HTLCLib.TxStatus){
        return htlcData.mapHashXUserTxs[xHash].baseTx.status;
    }

    function getSmgTxStatus(bytes32 xHash) public view returns (HTLCLib.TxStatus){
        return htlcData.mapHashXSmgTxs[xHash].baseTx.status;
    }
    function getDebtTxStatus(bytes32 xHash) public view returns (HTLCLib.TxStatus){
        return htlcData.mapHashXDebtTxs[xHash].baseTx.status;
    }
}