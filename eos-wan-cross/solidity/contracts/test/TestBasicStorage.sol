pragma solidity ^0.4.24;

import "../components/BasicStorage.sol";

contract TestBasicStorage is BasicStorage {
    /* uintData */
    function setUintData(bytes key, bytes innerKey, uint value)
        external
    {
        return uintData.setStorage(key, innerKey, value);
    }

    function getUintData(bytes key, bytes innerKey)
        external
        view
        returns (uint)
    {
        return uintData.getStorage(key, innerKey);
    }

    function delUintData(bytes key, bytes innerKey)
        external
    {
        return uintData.delStorage(key, innerKey);
    }

    /* boolData */
    function setBoolData(bytes key, bytes innerKey, bool value)
        external
    {
        boolData.setStorage(key, innerKey, value);
    }

    function getBoolData(bytes key, bytes innerKey)
        external
        view
        returns (bool)
    {
        return boolData.getStorage(key, innerKey);
    }

    function delBoolData(bytes key, bytes innerKey)
        external
    {
        return boolData.delStorage(key, innerKey);
    }

    /* addressData */
    function setAddressData(bytes key, bytes innerKey, address value)
        external
    {
        addressData.setStorage(key, innerKey, value);
    }

    function getAddressData(bytes key, bytes innerKey)
        external
        view
        returns (address)
    {
        return addressData.getStorage(key, innerKey);
    }

    function delAddressData(bytes key, bytes innerKey)
        external
    {
        return addressData.delStorage(key, innerKey);
    }

    /* bytesData */
    function setBytesData(bytes key, bytes innerKey, bytes value)
        external
    {
        bytesData.setStorage(key, innerKey, value);
    }

    function getBytesData(bytes key, bytes innerKey)
        external
        view
        returns (bytes)
    {
        return bytesData.getStorage(key, innerKey);
    }

    function delBytesData(bytes key, bytes innerKey)
        external
    {
        return bytesData.delStorage(key, innerKey);
    }

  /* stringData */
    function setStringData(bytes key, bytes innerKey, string value)
        external
    {
        stringData.setStorage(key, innerKey, value);
    }

    function getStringData(bytes key, bytes innerKey)
        external
        view
        returns (string)
    {
        return stringData.getStorage(key, innerKey);
    }

   function delStringData(bytes key, bytes innerKey)
        external
    {
        return stringData.delStorage(key, innerKey);
    }

}