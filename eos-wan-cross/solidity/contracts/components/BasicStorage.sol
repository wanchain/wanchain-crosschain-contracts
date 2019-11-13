// pragma solidity ^0.4.24;
pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract BasicStorage {

  mapping(bytes => mapping(bytes => uint))       uintStorage;

  mapping(bytes => mapping(bytes => bool))       boolStorage;

  mapping(bytes => mapping(bytes => address))    addressStorage;

  mapping(bytes => mapping(bytes => bytes))      bytesStorage;

  mapping(bytes => mapping(bytes => string))     stringStorage;

  /* uintStorage */

  function setUintStorage(bytes memory key, bytes memory innerkey, uint value) public {
    uintStorage[key][innerkey] = value;
  }

  function getUintStorage(bytes memory key, bytes memory innerkey) public view returns (uint) {
    return uintStorage[key][innerkey];
  }

  function delUintStorage(bytes memory key, bytes memory innerkey) public {
    delete uintStorage[key][innerkey];
  }

  /* boolStorage */

  function setBoolStorage(bytes memory key, bytes memory innerkey, bool value) public {
    boolStorage[key][innerkey] = value;
  }

  function getBoolStorage(bytes memory key, bytes memory innerkey) public view returns (bool) {
    return boolStorage[key][innerkey];
  }

  function delBoolStorage(bytes memory key, bytes memory innerkey) public {
    delete boolStorage[key][innerkey];
  }

  /* addressStorage */

  function setAddressStorage(bytes memory key, bytes memory innerkey, address value) public {
    addressStorage[key][innerkey] = value;
  }

  function getAddressStorage(bytes memory key, bytes memory innerkey) public view returns (address) {
    return addressStorage[key][innerkey];
  }

  function delAddressStorage(bytes memory key, bytes memory innerkey) public {
    delete addressStorage[key][innerkey];
  }

  /* bytesStorage */

  function setBytesStorage(bytes memory key, bytes memory innerkey, bytes memory value) public {
    bytesStorage[key][innerkey] = value;
  }

  function getBytesStorage(bytes memory key, bytes memory innerkey) public view returns (bytes memory) {
    return bytesStorage[key][innerkey];
  }

  function delBytesStorage(bytes memory key, bytes memory innerkey) public {
    delete bytesStorage[key][innerkey];
  }

  /* stringStorage */

  function setStringStorage(bytes memory key, bytes memory innerkey, string memory value) public {
    stringStorage[key][innerkey] = value;
  }

  function getStringStorage(bytes memory key, bytes memory innerkey) public view returns (string memory) {
    return stringStorage[key][innerkey];
  }

  function delStringStorage(bytes memory key, bytes memory innerkey) public {
    delete stringStorage[key][innerkey];
  }

}