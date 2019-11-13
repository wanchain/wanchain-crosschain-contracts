// pragma solidity ^0.4.24;
pragma solidity ^0.5.0;

library BasicLib {

  struct UintData {
    mapping(bytes => mapping(bytes => uint))       _storage;
  }

  struct BoolData {
    mapping(bytes => mapping(bytes => bool))       _storage;
  }

  struct AddressData {
    mapping(bytes => mapping(bytes => address))    _storage;
  }

  struct BytesData {
    mapping(bytes => mapping(bytes => bytes))      _storage;
  }

  struct StringData {
    mapping(bytes => mapping(bytes => string))     _storage;
  }

  /* uintStorage */

  function setStorage(UintData storage self, bytes memory key, bytes memory innerkey, uint value) public {
    self._storage[key][innerkey] = value;
  }

  function getStorage(UintData storage self, bytes memory key, bytes memory innerkey) public view returns (uint) {
    return self._storage[key][innerkey];
  }

  function delStorage(UintData storage self, bytes memory key, bytes memory innerkey) public {
    delete self._storage[key][innerkey];
  }

  /* boolStorage */

  function setStorage(BoolData storage self, bytes memory key, bytes memory innerkey, bool value) public {
    self._storage[key][innerkey] = value;
  }

  function getStorage(BoolData storage self, bytes memory key, bytes memory innerkey) public view returns (bool) {
    return self._storage[key][innerkey];
  }

  function delStorage(BoolData storage self, bytes memory key, bytes memory innerkey) public {
    delete self._storage[key][innerkey];
  }

  /* addressStorage */

  function setStorage(AddressData storage self, bytes memory key, bytes memory innerkey, address value) public {
    self._storage[key][innerkey] = value;
  }

  function getStorage(AddressData storage self, bytes memory key, bytes memory innerkey) public view returns (address) {
    return self._storage[key][innerkey];
  }

  function delStorage(AddressData storage self, bytes memory key, bytes memory innerkey) public {
    delete self._storage[key][innerkey];
  }

  /* bytesStorage */

  function setStorage(BytesData storage self, bytes memory key, bytes memory innerkey, bytes memory value) public {
    self._storage[key][innerkey] = value;
  }

  function getStorage(BytesData storage self, bytes memory key, bytes memory innerkey) public view returns (bytes memory) {
    return self._storage[key][innerkey];
  }

  function delStorage(BytesData storage self, bytes memory key, bytes memory innerkey) public {
    delete self._storage[key][innerkey];
  }

  /* stringStorage */

  function setStorage(StringData storage self, bytes memory key, bytes memory innerkey, string memory value) public {
    self._storage[key][innerkey] = value;
  }

  function getStorage(StringData storage self, bytes memory key, bytes memory innerkey) public view returns (string memory) {
    return self._storage[key][innerkey];
  }

  function delStorage(StringData storage self, bytes memory key, bytes memory innerkey) public {
    delete self._storage[key][innerkey];
  }

}