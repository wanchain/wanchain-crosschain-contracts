//const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "18.236.235.133",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4710000,
      gasPrice: 180e9,
      from: "0xb755dc08ee919f9d80ecac014ad0a7e1d0b3b231",
    },
	
    rinkeby: {
      host: "192.168.1.58",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4710000,
      gasPrice: 18e9,
      from: "0x9da26fc2e1d6ad9fdd46138906b0104ae68a65d8",
    },

    devinternal: {
      host: "192.168.1.58",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4710000,
      gasPrice: 180e9,
      from: "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e",
    },
    
    mainnet: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4710000,
      gasPrice: 180e9,
      from: "0xbb9003ca8226f411811dd16a3f1a2c1b3f71825d"
    },	
  }
};


