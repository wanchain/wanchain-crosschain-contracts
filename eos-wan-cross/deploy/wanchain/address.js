const addressMap = new Map();

const addContractAddress = (name, address) => {
  addressMap.set(name, address);
}

const getContractAddress = (name) => {
  if (name) { 
    return addressMap.get(name);
  } else {
    return addressMap;
  }
}

module.exports = {
  addContractAddress,
  getContractAddress
}