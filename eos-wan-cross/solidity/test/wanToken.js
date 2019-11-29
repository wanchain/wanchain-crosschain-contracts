const lib = require("./lib");
const utils = require("./utils");

/* global describe it artifacts */
const TestWanToken = artifacts.require('TestWanToken.sol')

function getTokenInfo() {
  return {
    name: "TSTKN",
    symbol: "TSTKN",
    decimal: 3
  };
}

function getAddress_0() {
  return "0x0000000000000000000000000000000000000000";
}

function getOverSizePayload() {
  let repeat = (str , n) => {
    return new Array(n + 1).join(str);
  }

  return "0x" + repeat("ffffffffffffffff", 1000);
}

function getWanTokenAbi() {
  return [
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_spender",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_from",
          "type": "address"
        },
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "name": "",
          "type": "uint8"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "acceptOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "changeOwner",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "newOwner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        },
        {
          "name": "_spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "name": "remaining",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "tokenName",
          "type": "string"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        },
        {
          "name": "tokenDecimal",
          "type": "uint8"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "value",
          "type": "uint256"
        },
        {
          "indexed": true,
          "name": "totalSupply",
          "type": "uint256"
        }
      ],
      "name": "TokenMintedLogger",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "value",
          "type": "uint256"
        },
        {
          "indexed": true,
          "name": "totalSupply",
          "type": "uint256"
        }
      ],
      "name": "TokenBurntLogger",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_from",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "_owner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_spender",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "account",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "mint",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "account",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "burn",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
}

async function deploy(sol, address) {
  let contract;
  if (!await sol.isDeployed()) {
    contract = await utils.deployContract(sol, { from: address });
  } else {
    contract = await utils.contractAt(sol, sol.address);
  }
  lib.assertExists(contract);
  return contract;
}

async function initContracts(ownerAddr) {
  lib.assertExists(TestWanToken);

  let testWanToken = await deploy(TestWanToken, ownerAddr);
  lib.assertExists(testWanToken);

  return testWanToken;
}

contract('WanToken', async (accounts) => {
  let ownerAddr = accounts[0];
  let testWanToken;

  before("init contracts", async() => {
    testWanToken = await initContracts(ownerAddr);
  });

  it ('create one token, mint, transfer, get balance, burn token with owner, it should success', async() => {
    let tokenInfo = getTokenInfo();
    let user1Addr = accounts[1];
    let user2Addr = accounts[2];
    let approveAddr = accounts[3];
    try {
      let createTx = await testWanToken.createToken(tokenInfo.name, tokenInfo.symbol, tokenInfo.decimal);
      let wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);

      const abi = getWanTokenAbi();
      let value = 100;
      let approveValue = value / 2;
      let contract = new web3.eth.Contract(abi, wTokenAddr);

      /* change owner request */
      let changeOwnerTx = await testWanToken.changeOwner(tokenInfo.name, tokenInfo.symbol);

      /* accept change owner request */
      await contract.methods.acceptOwnership().send({from:ownerAddr});

      let decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), tokenInfo.decimal);

      let init1Balance = await contract.methods.balanceOf(user1Addr).call();

      let mintTx = await contract.methods.mint(user1Addr, value.toString()).send({from: ownerAddr});

      let user1Balance = await contract.methods.balanceOf(user1Addr).call();

      lib.assertCommonEqual(Number(user1Balance) - value, Number(init1Balance));

      let init2Balance = await contract.methods.balanceOf(user2Addr).call();

      let isTransfered = await contract.methods.transfer(user2Addr, value.toString()).send({from: user1Addr});

      let user2Balance = await contract.methods.balanceOf(user2Addr).call();
      lib.assertCommonEqual(Number(user2Balance), Number(user1Balance));

      let isApproved = await contract.methods.approve(approveAddr, approveValue.toString()).send({from: user2Addr});

      let allowance = await contract.methods.allowance(user2Addr, approveAddr).call();
      lib.assertCommonEqual(Number(allowance), approveValue);

      isTransfered = await contract.methods.transferFrom(user2Addr, user1Addr, approveValue.toString()).send({from: approveAddr});

      user1Balance = await contract.methods.balanceOf(user1Addr).call();
      user2Balance = await contract.methods.balanceOf(user2Addr).call();
      lib.assertCommonEqual(Number(user2Balance) + Number(user1Balance), value);

      let burn1Tx = await contract.methods.burn(user1Addr, user1Balance.toString()).send({from: ownerAddr});
      let burn2Tx = await contract.methods.burn(user2Addr, user2Balance.toString()).send({from: ownerAddr});

      user1Balance = await contract.methods.balanceOf(user1Addr).call();
      user2Balance = await contract.methods.balanceOf(user2Addr).call();

      lib.assertCommonEqual(user1Balance, init1Balance);
      lib.assertCommonEqual(user2Balance, init2Balance);

      let destroyTx = await testWanToken.destroyToken(tokenInfo.name, tokenInfo.symbol);

      wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(wTokenAddr, getAddress_0());

      decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), 0);

    } catch (err) {
      lib.assertFail(err);
    }
  });

  it('transfer wan coin to wan token contract, it should be throw error', async () => {
    let userAddr = accounts[1];
    let tokenInfo = getTokenInfo();
    try {
      let createTx = await testWanToken.createToken(tokenInfo.name, tokenInfo.symbol, tokenInfo.decimal);
      let wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);

      try {
        await web3.eth.sendTransaction({from: userAddr, to: wTokenAddr, value: web3.utils.toWei("0.5")})
        lib.assertFail("transfer wan coin to wan token contract, it should be throw error");
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertInclude(err.message, "Not support", err);
      }

      let destroyTx = await testWanToken.destroyToken(tokenInfo.name, tokenInfo.symbol);

      wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(wTokenAddr, getAddress_0());

      decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), 0);

    } catch (err) {
      lib.assertFail(err);
    }
  });

  it('transfer wan coin with invalid value, it should be throw error', async () => {
    let tokenInfo = getTokenInfo();
    let user1Addr = accounts[1];
    let user2Addr = accounts[2];
    let approveAddr = accounts[3];
    try {
      let createTx = await testWanToken.createToken(tokenInfo.name, tokenInfo.symbol, tokenInfo.decimal);
      let wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);

      const abi = getWanTokenAbi();
      let value = 100;
      let invalidValue = value * 2;
      let approveValue = value / 2;
      let contract = new web3.eth.Contract(abi, wTokenAddr);

      /* change owner request */
      let changeOwnerTx = await testWanToken.changeOwner(tokenInfo.name, tokenInfo.symbol);

      /* accept change owner request */
      await contract.methods.acceptOwnership().send({from:ownerAddr});

      let decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), tokenInfo.decimal);

      let init1Balance = await contract.methods.balanceOf(user1Addr).call();

      let mintTx = await contract.methods.mint(user1Addr, value.toString()).send({from: ownerAddr});

      try {
        await contract.methods.transfer(user2Addr, invalidValue.toString()).send({from: user1Addr});
        lib.assertFail("transfer wan coin with invalid value, it should be throw error");
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
      }

      try {
        await contract.methods.approve(approveAddr, invalidValue.toString()).send({from: user1Addr});
        lib.assertFail("approve wan coin with invalid value, it should be throw error");
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
        try {
          await contract.methods.approve(approveAddr, approveValue.toString()).send({from: user1Addr});
          lib.assertFail("approve wan coin with invalid value, need approve 0 wan coin, or it should be throw error");
        } catch (err) {
          lib.assertExists(err);
          lib.expectToBeAnInstanceOf(err, Error);
          lib.assertInclude(err.message, "Not permitted", err);
        }
      }

      let isApproved = await contract.methods.approve(approveAddr, "0").send({from: user1Addr});
      isApproved = await contract.methods.approve(approveAddr, approveValue.toString()).send({from: user1Addr});

      let allowance = await contract.methods.allowance(user1Addr, approveAddr).call();
      lib.assertCommonEqual(Number(allowance), approveValue);

      try {
        await contract.methods.transferFrom(user1Addr, user2Addr, invalidValue.toString()).send({from: approveAddr});
        lib.assertFail("transferFrom wan coin with invalid value, it should be throw error");
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
      }

      let burn1Tx = await contract.methods.burn(user1Addr, value.toString()).send({from: ownerAddr});

      let destroyTx = await testWanToken.destroyToken(tokenInfo.name, tokenInfo.symbol);

      wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(wTokenAddr, getAddress_0());

      decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), 0);

    } catch (err) {
      lib.assertFail(err);
    }
  });

  it ('create one token, mint, burn token with non-owner, it should be throw error', async() => {
    let tokenInfo = getTokenInfo();
    let user1Addr = accounts[1];
    try {
      let createTx = await testWanToken.createToken(tokenInfo.name, tokenInfo.symbol, tokenInfo.decimal);
      let wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);

      const abi = getWanTokenAbi();
      let value = 100;
      let contract = new web3.eth.Contract(abi, wTokenAddr);

      try {
        await contract.methods.mint(user1Addr, value.toString()).send({from: user1Addr});
        lib.assertFail('mint token with non-owner, it should be throw error');
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertInclude(err.message, "Not owner", err);
      }

      /* change owner request */
      let changeOwnerTx = await testWanToken.changeOwner(tokenInfo.name, tokenInfo.symbol);

      /* accept change owner request */
      await contract.methods.acceptOwnership().send({from:ownerAddr});

      let decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), tokenInfo.decimal);

      let mintTx = await contract.methods.mint(user1Addr, value.toString()).send({from: ownerAddr});

      try {
        await contract.methods.burn(user1Addr, value.toString()).send({from: user1Addr});
        lib.assertFail('burn token with non-owner, it should be throw error');
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
        lib.assertInclude(err.message, "Not owner", err);
      }

      let burn1Tx = await contract.methods.burn(user1Addr, value.toString()).send({from: ownerAddr});
      let destroyTx = await testWanToken.destroyToken(tokenInfo.name, tokenInfo.symbol);

      wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(wTokenAddr, getAddress_0());

      decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), 0);

    } catch (err) {
      lib.assertFail(err);
    }
  });

  it ('create one token, mint, burn token with address address(0), it should be throw error', async() => {
    let tokenInfo = getTokenInfo();
    let address0 = getAddress_0();
    let user1Addr = accounts[1];
    try {
      let createTx = await testWanToken.createToken(tokenInfo.name, tokenInfo.symbol, tokenInfo.decimal);
      let wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);

      const abi = getWanTokenAbi();
      let value = 100;
      let contract = new web3.eth.Contract(abi, wTokenAddr);

      /* change owner request */
      let changeOwnerTx = await testWanToken.changeOwner(tokenInfo.name, tokenInfo.symbol);

      /* accept change owner request */
      await contract.methods.acceptOwnership().send({from:ownerAddr});

      let decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), tokenInfo.decimal);

      try {
        await contract.methods.mint(address0, value.toString()).send({from: ownerAddr});
        lib.assertFail('mint token with address address(0), it should be throw error');
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
      }

      let mintTx = await contract.methods.mint(user1Addr, value.toString()).send({from: ownerAddr});

      try {
        await contract.methods.burn(address0, value.toString()).send({from: ownerAddr});
        lib.assertFail('burn token with address address(0), it should be throw error');
      } catch (err) {
        lib.assertExists(err);
        lib.expectToBeAnInstanceOf(err, Error);
      }

      let burn1Tx = await contract.methods.burn(user1Addr, value.toString()).send({from: ownerAddr});
      let destroyTx = await testWanToken.destroyToken(tokenInfo.name, tokenInfo.symbol);

      wTokenAddr = await testWanToken.getTokenAddr.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(wTokenAddr, getAddress_0());

      decimal = await testWanToken.getTokenDecimal.call(tokenInfo.name, tokenInfo.symbol);
      lib.assertCommonEqual(Number(decimal), 0);

    } catch (err) {
      lib.assertFail(err);
    }
  });

});