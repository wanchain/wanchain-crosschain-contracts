const lib = require("./lib");
const utils = require("./utils");
/* global describe it artifacts */
const TestTokenManagerDelegateV2 = artifacts.require('TestTokenManagerDelegateV2.sol')
const TokenManagerDelegate = artifacts.require('TokenManagerDelegate.sol')
const TokenManagerProxy = artifacts.require('TokenManagerProxy.sol')

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

async function initContracts(accounts) {
  lib.assertExists(TestTokenManagerDelegateV2);
  lib.assertExists(TokenManagerDelegate);
  lib.assertExists(TokenManagerProxy);

  let LibNameDict = {
    "TestTokenManagerDelegateV2": "TestTokenManagerDelegateV2",
    "TokenManagerDelegate": "TokenManagerDelegate",
    "TokenManagerProxy": "TokenManagerProxy",
  }

  let LibAddrDict = {}

  let sender = accounts[0];
  // console.log("sender=>", sender);

  let delegateV2 = await deploy(TestTokenManagerDelegateV2, sender);
  // console.log("TestTokenManagerDelegateV2 success =>", delegateV2.address);
  lib.assertExists(delegateV2);
  LibAddrDict[LibNameDict.TestTokenManagerDelegateV2] = delegateV2.address;

  let delegate = await deploy(TokenManagerDelegate, sender);
  // console.log("TokenManagerDelegate success =>", delegate.address);
  lib.assertExists(delegate);
  LibAddrDict[LibNameDict.TokenManagerDelegate] = delegate.address;

  let proxy = await deploy(TokenManagerProxy, sender);
  // console.log("TokenManagerProxy success =>", proxy.address);
  lib.assertExists(proxy);

  return [delegateV2, delegate, proxy];
}

function getTokenInfo() {
  let asciiTokenOrigAccount = "YCC-Account";
  let token2WanRatio = 10;
  let minDeposit = "10000000000000000000";
  let withdrawDelayTime = 60 * 60 * 72;
  let asciiTokenName = "ycc";
  let asciiTokenSymbol = "YCC";

  return {
    asciiTokenOrigAccount: asciiTokenOrigAccount,
    token2WanRatio: token2WanRatio,
    minDeposit: minDeposit,
    withdrawDelayTime: withdrawDelayTime,
    asciiTokenName: asciiTokenName,
    asciiTokenSymbol: asciiTokenSymbol,
    decimals: 10
  };
}

function getAddress_0() {
  return "0x0000000000000000000000000000000000000000";
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

function getProxyAbi() {
  return [
    {
      "constant": true,
      "inputs": [],
      "name": "MIN_WITHDRAW_WINDOW",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x36936380"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "DEFAULT_BONUS_PERIOD_BLOCKS",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x3e363fc5"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "_implementation",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x59679b0f"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "implementation",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x5c60da1b"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "acceptOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x79ba5097"
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
      "type": "function",
      "signature": "0x8da5cb5b"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "DEFAULT_BONUS_RATIO_FOR_DEPOSIT",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x9d3a77fa"
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
      "type": "function",
      "signature": "0xa6f9dae1"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "DEFAULT_PRECISE",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0xbd490167"
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
      "type": "function",
      "signature": "0xd4ee1d90"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "MIN_DEPOSIT",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0xe1e158a5"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "htlcAddr",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0xedd706b5"
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
          "name": "implementation",
          "type": "address"
        }
      ],
      "name": "Upgraded",
      "type": "event",
      "signature": "0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "impl",
          "type": "address"
        }
      ],
      "name": "upgradeTo",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x3659cfe6"
    }
  ]
}

function getTokenManagerAbi() {
  return  [
    {
      "constant": true,
      "inputs": [],
      "name": "MIN_WITHDRAW_WINDOW",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x36936380"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "DEFAULT_BONUS_PERIOD_BLOCKS",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x3e363fc5"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "acceptOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x79ba5097"
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
      "type": "function",
      "signature": "0x8da5cb5b"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "DEFAULT_BONUS_RATIO_FOR_DEPOSIT",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x9d3a77fa"
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
      "type": "function",
      "signature": "0xa6f9dae1"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "DEFAULT_PRECISE",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0xbd490167"
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
      "type": "function",
      "signature": "0xd4ee1d90"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "MIN_DEPOSIT",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0xe1e158a5"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "htlcAddr",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0xedd706b5"
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
          "indexed": false,
          "name": "tokenOrigAccount",
          "type": "bytes"
        },
        {
          "indexed": false,
          "name": "ratio",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "minDeposit",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "withdrawDelayTime",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "name",
          "type": "bytes"
        },
        {
          "indexed": false,
          "name": "symbol",
          "type": "bytes"
        },
        {
          "indexed": false,
          "name": "decimal",
          "type": "uint8"
        },
        {
          "indexed": false,
          "name": "tokenWanAddr",
          "type": "address"
        }
      ],
      "name": "TokenAddedLogger",
      "type": "event",
      "signature": "0xc91f139b471cebdaacd990b8a62d0a229a65eca21b4ea76c9d9e22a897c782b7"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "tokenOrigAccount",
          "type": "bytes"
        },
        {
          "indexed": false,
          "name": "ratio",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "minDeposit",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "withdrawDelayTime",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "name",
          "type": "bytes"
        },
        {
          "indexed": false,
          "name": "symbol",
          "type": "bytes"
        },
        {
          "indexed": false,
          "name": "decimal",
          "type": "uint8"
        },
        {
          "indexed": false,
          "name": "tokenWanAddr",
          "type": "address"
        }
      ],
      "name": "TokenUpdatedLogger",
      "type": "event",
      "signature": "0x66a7c6d274dbb58299541b9a96a834634be2505cf49fdc5eccfe8360a224a608"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "tokenOrigAccount",
          "type": "bytes"
        }
      ],
      "name": "TokenRemovedLogger",
      "type": "event",
      "signature": "0x88df797e2e09984c4349208743d7f542a279dc73d403ccc2a8d9c7dc7cf53f4c"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "tokenOrigAccount",
          "type": "bytes"
        }
      ],
      "name": "isTokenRegistered",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x5fcfbdd3"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "tokenOrigAccount",
          "type": "bytes"
        },
        {
          "name": "token2WanRatio",
          "type": "uint256"
        },
        {
          "name": "minDeposit",
          "type": "uint256"
        },
        {
          "name": "withdrawDelayTime",
          "type": "uint256"
        },
        {
          "name": "name",
          "type": "bytes"
        },
        {
          "name": "symbol",
          "type": "bytes"
        },
        {
          "name": "decimals",
          "type": "uint8"
        }
      ],
      "name": "addToken",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x054049e7"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "tokenOrigAccount",
          "type": "bytes"
        }
      ],
      "name": "removeToken",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x0bc1466b"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "tokenOrigAccount",
          "type": "bytes"
        },
        {
          "name": "token2WanRatio",
          "type": "uint256"
        },
        {
          "name": "minDeposit",
          "type": "uint256"
        },
        {
          "name": "withdrawDelayTime",
          "type": "uint256"
        },
        {
          "name": "name",
          "type": "bytes"
        },
        {
          "name": "symbol",
          "type": "bytes"
        },
        {
          "name": "decimals",
          "type": "uint8"
        },
        {
          "name": "tokenWanAddr",
          "type": "address"
        }
      ],
      "name": "updateToken",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x98df3f58"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "tokenOrigAccount",
          "type": "bytes"
        }
      ],
      "name": "getTokenInfo",
      "outputs": [
        {
          "name": "",
          "type": "bytes"
        },
        {
          "name": "",
          "type": "bytes"
        },
        {
          "name": "",
          "type": "uint8"
        },
        {
          "name": "",
          "type": "address"
        },
        {
          "name": "",
          "type": "uint256"
        },
        {
          "name": "",
          "type": "uint256"
        },
        {
          "name": "",
          "type": "uint256"
        },
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x99f8308e"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "tokenOrigAccount",
          "type": "bytes"
        },
        {
          "name": "recipient",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "mintToken",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x4b071c7e"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "tokenOrigAccount",
          "type": "bytes"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "burnToken",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x8fb3cdc8"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "setHtlcAddr",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x5dd0a755"
    }
  ];
}

contract('TokenManager', async (accounts) => {
  let proxy;
  let delegate;
  let delegateV2;

  before("init contracts", async() => {
    [delegateV2, delegate, proxy] = await initContracts(accounts);
  });

  // it('upgrade token manager delegate by others instead of owner, it should throw error', async () => {
  //   let sender = accounts[3];

  //   const abi = getProxyAbi();
  //   let contract = new web3.eth.Contract(abi, proxy.address);

  //   try {
  //     // Initalize the proxy with the first delegate version 1.
  //     if (delegate.address !== await proxy.implementation()) {
  //       await contract.methods.upgradeTo(delegate.address).send({from: sender});
  //     } else {
  //       await contract.methods.upgradeTo(delegateV2.address).send({from: sender});
  //     }
  //     lib.assertFail("upgrade token manager delegate by others instead of owner, it should throw error");
  //   } catch (err) {
  //     // console.log(JSON.stringify(err.message), typeof(err.message));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertInclude(err.message, "Not owner", err);
  //   }
  // });

  // it('remove and add and update token by others instead of owner, it should throw error', async () => {
  //   let proxyDelegateV1;
  //   let tokenInfoV1;
  //   let sender = accounts[3];

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
  //   // console.log("wTokenAddr ", wTokenAddr);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

  //   const abi = getTokenManagerAbi();
  //   let contract = new web3.eth.Contract(abi, delegate.address);

  //   try {
  //     await contract.methods.removeToken(tokenOrigAccount).send({from: sender});
  //     lib.assertFail("remove token by others instead of owner, it should throw error");
  //   } catch (err) {
  //     // console.log(JSON.stringify(err.message), typeof(err.message));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertInclude(err.message, "Not owner", err);
  //   }

  //   try {
  //     await contract.methods.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals).send({from: sender});
  //     lib.assertFail("add token by others instead of owner, it should throw error");
  //   } catch (err) {
  //     // console.log(JSON.stringify(err.message), typeof(err.message));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertInclude(err.message, "Not owner", err);
  //   }

  //   try {
  //     await contract.methods.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, accounts[1]).send({from: sender});
  //     lib.assertFail("update token by others instead of owner, it should throw error");
  //   } catch (err) {
  //     // console.log(JSON.stringify(err.message), typeof(err.message));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertInclude(err.message, "Not owner", err);
  //   }

  //   tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //   // console.log("===>", JSON.stringify(tokenInfoV1));

  //   lib.assertExists(tokenInfoV1);
  //   lib.assertNotExists(tokenInfoV1["0"]);
  //   lib.assertNotExists(tokenInfoV1["1"]);
  //   lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), 0);
  //   lib.assertCommonEqual(tokenInfoV1["3"], getAddress_0());
  //   lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), 0);
  //   lib.assertCommonEqual(tokenInfoV1["5"].toNumber(), 0);
  //   lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), 0);
  //   // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  // });

  // it('set htlc address by others instead of owner, it should throw error', async () => {
  //   let proxyDelegateV1;
  //   let htlcAddr = accounts[0];
  //   let sender = accounts[3];

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   const abi = getTokenManagerAbi();
  //   let contract = new web3.eth.Contract(abi, proxyDelegateV1.address);

  //   try {
  //     await contract.methods.setHtlcAddr(htlcAddr).send({from: sender});
  //     lib.assertFail("set htlc address by others instead of owner, it should throw error");
  //   } catch (err) {
  //     // console.log(JSON.stringify(err.message), typeof(err.message));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertInclude(err.message, "Not owner", err);
  //   }
  // });

  // it('v1 token manager delegate by owner, add token info, it should be success', async () => {
  //   let proxyDelegateV1;
  //   let tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  //   lib.assertCommonEqual(await proxyDelegateV1.isTokenRegistered(tokenOrigAccount), false);
  //   await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //   lib.assertCommonEqual(await proxyDelegateV1.isTokenRegistered(tokenOrigAccount), true);
  //   tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

  //   lib.assertExists(tokenInfoV1);
  //   lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
  //   lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
  //   lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
  //   // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
  //   lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
  //   lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
  //   lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
  //   // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);

  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('updated v2 token manager delegate, add token info, token info should be still existed', async () => {
  //   let proxyDelegateV1, proxyDelegateV2;
  //   let tokenInfoV1, tokenInfoV2;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  //   await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //   tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

  //   // Upgrade to the latest delegate version 2
  //   await proxy.upgradeTo(delegateV2.address)
  //   proxyDelegateV2 = await TestTokenManagerDelegateV2.at(proxy.address);
  //   tokenInfoV2 = await proxyDelegateV2.getTokenInfo(tokenOrigAccount);

  //   // token info should be same
  //   lib.assertFullMatch(tokenInfoV1, tokenInfoV2);
  //   await proxyDelegateV2.removeToken(tokenOrigAccount);
  // });

  // it('updated v2 token manager delegate, the features should be used', async () => {
  //   let proxyDelegateV1, proxyDelegateV2;

  //   // Upgrade to the latest delegate version 1
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
  //   // v1 delegate must be not owned the new feature setTokenFlag and getTokenFlag
  //   lib.expectNotOwnProperty(proxyDelegateV1, "setTokenFlag");
  //   lib.expectNotOwnProperty(proxyDelegateV1, "getTokenFlag");

  //   // Upgrade to the latest delegate version 2
  //   await proxy.upgradeTo(delegateV2.address)
  //   proxyDelegateV2 = await TestTokenManagerDelegateV2.at(proxy.address);
  //   // delegateV2 add the new feature setTokenFlag and getTokenFlag
  //   let flag = "YCC-pk";
  //   await proxyDelegateV2.setTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")), flag);
  //   let tokenFlagV2 = await proxyDelegateV2.getTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")));
  //   lib.assertFullMatch(flag, tokenFlagV2);
  //   await proxyDelegateV2.delTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")));
  //   let tmpTokenFlagV2 = await proxyDelegateV2.getTokenFlag(await web3.utils.hexToBytes(await web3.utils.toHex("pk")), await web3.utils.hexToBytes(await web3.utils.toHex("YCC")));
  //   lib.assertNotDeepEqual(tokenFlagV2, tmpTokenFlagV2);
  // });

  // it('v1 delegate add token, v2 delegate removed the existed token info, updated v1 token manager delegate, token info should be removed, v2 features should be not exists', async () => {
  //   let proxyDelegateV1, proxyDelegateV2;
  //   let tokenInfoV1, tokenInfoV2;

  //   // Upgrade to the latest delegate version 1
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  //   await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //   tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

  //   lib.assertExists(tokenInfoV1);

  //   // Upgrade to the latest delegate version 2
  //   await proxy.upgradeTo(delegateV2.address)
  //   proxyDelegateV2 = await TestTokenManagerDelegateV2.at(proxy.address);

  //   tokenInfoV2 = await proxyDelegateV2.getTokenInfo(tokenOrigAccount);
  //   lib.assertFullMatch(tokenInfoV1, tokenInfoV2);

  //   await proxyDelegateV2.removeToken(tokenOrigAccount);
  //   tokenInfoV2 = await proxyDelegateV2.getTokenInfo(tokenOrigAccount);
  //   lib.assertNotDeepEqual(tokenInfoV1, tokenInfoV2);

  //   // Upgrade to the latest delegate version 1
  //   await proxy.upgradeTo(delegate.address)
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
  //   // tokenInfoV1 storage deleted in TestTokenManagerDelegateV2, and the info would be same as TestTokenManagerDelegateV2 in TokenManagerDelegate
  //   tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //   lib.assertFullMatch(tokenInfoV1, tokenInfoV2);

  //   // delegate must be not owned the new feature setTokenFlag and getTokenFlag
  //   lib.expectNotOwnProperty(proxyDelegateV1, "setTokenFlag");
  //   lib.expectNotOwnProperty(proxyDelegateV1, "getTokenFlag");
  // });

  // it('v1 delegate add token with 0 decimals, it should be success', async () => {
  //   let proxyDelegateV1;
  //   let tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   decimals = 0;
  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  //   await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //   tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

  //   // console.log(JSON.stringify(tokenInfoV1));
  //   lib.assertExists(tokenInfoV1);
  //   lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
  //   lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
  //   lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
  //   // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
  //   lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
  //   lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
  //   lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
  //   // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);

  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with reduplicate, it should be throw error', async () => {
  //   let proxyDelegateV1;
  //   let tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   decimals = 0;
  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));

  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  //   await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //   tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

  //   try {
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with reduplicate, it should be throw error");
  //   } catch (err) {
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "Token is exist");
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with 0 token to wan ratio, it should be throw error', async () => {
  //   let proxyDelegateV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   token2WanRatio = 0;
  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with 0 token to wan ratio, it should be throw error");
  //   } catch (err) {
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "Ratio is null");
  //     // // console.log(typeof(err), JSON.stringify(err.reason));
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with low deposit, it should be throw error', async () => {
  //   let proxyDelegateV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   minDeposit = "1000";
  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with with low deposit, it should be throw error");
  //   } catch (err) {
  //     // console.log("add token with with low deposit, it should be throw error", Object.keys(err));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "Deposit amount is not enough");
  //     // // console.log(typeof(err), JSON.stringify(err.reason));
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with low withdraw delay time, it should be throw error', async () => {
  //   let proxyDelegateV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   withdrawDelayTime = 10;
  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with with low withdraw delay time, it should be throw error");
  //   } catch (err) {
  //     // console.log("add token with with low withdraw delay time, it should be throw error", Object.keys(err));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "Delay time for withdraw is too short");
  //     // // console.log(typeof(err), JSON.stringify(err.reason));
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with empty name, it should be throw error', async () => {
  //   let proxyDelegateV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   /* web3.utils.toHex("") is 0x0
  //    * web3.utils.hexToBytes(web3.utils.toHex("")) is [ 0 ], and its length is 1
  //   */
  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = [];
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with with empty name, it should be throw error");
  //   } catch (err) {
  //     // console.log("add token with with empty name, it should be throw error", Object.keys(err));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "Name is null");
  //     // // console.log(typeof(err), JSON.stringify(err.reason));
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with empty symbol, it should be throw error', async () => {
  //   let proxyDelegateV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = [];
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with with empty symbol, it should be throw error");
  //   } catch (err) {
  //     // console.log("add token with with empty symbol, it should be throw error", Object.keys(err));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "Symbol is null");
  //     // // console.log(typeof(err), JSON.stringify(err.reason));
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with empty token origin account, it should be throw error', async () => {
  //   let proxyDelegateV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = [];
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with with empty token origin account, it should be throw error");
  //   } catch (err) {
  //     // console.log("add token with with empty token origin account, it should be throw error", Object.keys(err));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     // console.log(err.reason);
  //     lib.assertCommonEqual(err.reason, "Account is null");
  //     // console.log(typeof(err), JSON.stringify(err.reason));
  //   }
  //   // await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token with empty symbol, it should be throw error', async () => {
  //   let proxyDelegateV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = [];
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     lib.assertFail("add token with with empty symbol, it should be throw error");
  //   } catch (err) {
  //     // console.log("add token with with empty symbol, it should be throw error", Object.keys(err));
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "Symbol is null");
  //     // // console.log(typeof(err), JSON.stringify(err.reason));
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate update an not existed token, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, accounts[1]);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

  //     lib.assertExists(tokenInfoV1);
  //     lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
  //     lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
  //     lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
  //     // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
  //     lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
  //     lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
  //     lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
  //     // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token and update it with 0 decimals, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];

  //     decimals = 0;
  //     await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);

  //     lib.assertExists(tokenInfoV1);
  //     lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["0"]), asciiTokenName);
  //     lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["1"]), asciiTokenSymbol);
  //     lib.assertCommonEqual(tokenInfoV1["2"].toNumber(), decimals);
  //     // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["3"]), wTokenAddr);
  //     lib.assertCommonEqual(tokenInfoV1["4"].toNumber(), token2WanRatio);
  //     lib.assertCommonEqual(tokenInfoV1["5"].toString(), minDeposit);
  //     lib.assertCommonEqual(tokenInfoV1["6"].toNumber(), withdrawDelayTime);
  //     // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token and update it with 0 token to wan ratio, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];

  //     try {
  //       token2WanRatio = 0;
  //       await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
  //       lib.assertFail("add token and update it with 0 token to wan ratio, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Ratio is null");
  //       // // console.log(typeof(err), JSON.stringify(err.reason));
  //     }
  //       // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token and update it with low deposit, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];

  //     try {
  //       minDeposit = "1000";
  //       await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
  //       lib.assertFail("add token and update it with low deposit, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Deposit amount is not enough");
  //       // // console.log(typeof(err), JSON.stringify(err.reason));
  //     }
  //       // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token and update it with low withdraw delay time, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];

  //     try {
  //       withdrawDelayTime = 10;
  //       await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
  //       lib.assertFail("add token and update it with low withdraw delay time, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Delay time for withdraw is too short");
  //       // // console.log(typeof(err), JSON.stringify(err.reason));
  //     }
  //       // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token and update it with empty name, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];

  //     try {
  //       tokenName = [];
  //       await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
  //       lib.assertFail("add token and update it with empty name, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Name is null");
  //       // // console.log(typeof(err), JSON.stringify(err.reason));
  //     }
  //       // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token and update it with empty symbol, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];

  //     try {
  //       tokenSymbol = [];
  //       await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
  //       lib.assertFail("add token and update it with empty symbol, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Symbol is null");
  //       // // console.log(typeof(err), JSON.stringify(err.reason));
  //     }
  //       // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('v1 delegate add token and update it with empty token origin account, it should be throw error', async () => {
  //   let proxyDelegateV1, tokenInfoV1;

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];

  //     try {
  //       let tokenOrigAccount = [];
  //       await proxyDelegateV1.updateToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals, wTokenAddr);
  //       lib.assertFail("add token and update it with empty token origin account, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Account is null");
  //       // // console.log(typeof(err), JSON.stringify(err.reason));
  //     }
  //       // lib.assertCommonEqual(await web3.utils.toAscii(tokenInfoV1["7"].toNumber()), DEFAULT_PRECISE);
  //   } catch (err) {
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('set htlc address address(0), it should be throw error', async () => {
  //   let proxyDelegateV1;
  //   let htlcAddr = getAddress_0();

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
  //   try {
  //     await proxyDelegateV1.setHtlcAddr(htlcAddr);
  //     lib.assertFail("set htlc address address(0), it should be throw error");
  //   } catch (err) {
  //     lib.expectToBeAnInstanceOf(err, Error);
  //     lib.assertExists(err.reason);
  //     lib.assertCommonEqual(err.reason, "HTLC address is null");
  //   }
  // });

  // it('mint and burn token with self-defined htlc address, it should be success', async () => {
  //   let proxyDelegateV1, tokenInfoV1;
  //   let htlcAddr = accounts[0];
  //   let userAddr = accounts[1];

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
  //   await proxyDelegateV1.setHtlcAddr(htlcAddr);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];
  //     // console.log("wTokenAddr ", wTokenAddr);

  //     const abi = getWanTokenAbi();

  //     let contract = new web3.eth.Contract(abi, wTokenAddr);

  //     // console.log("mint token for ", userAddr);
  //     let userBalance = await contract.methods.balanceOf(userAddr).call();
  //     // console.log("before mint token balance", userBalance, typeof(userBalance));

  //     let value = 99;
  //     await proxyDelegateV1.mintToken(tokenOrigAccount, userAddr, value.toString());

  //     let userMintedBalance = await contract.methods.balanceOf(userAddr).call();
  //     // console.log("after mint token balance", userMintedBalance, typeof(userMintedBalance));

  //     lib.assertCommonEqual(Number(userMintedBalance) - value, Number(userBalance));
  //     // console.log("compare mint token balance success");

  //     let isTransfered = await contract.methods.transfer(htlcAddr, value.toString()).send({from: userAddr});
  //     // console.log("transfer mint token balance ", isTransfered);
  //     // lib.assertCommonEqual(isTransfered, true);
  //     // console.log("transfer mint token balance success");

  //     let htlcBalance = await contract.methods.balanceOf(htlcAddr).call();
  //     // console.log("before burn token balance", htlcBalance, typeof(htlcBalance));

  //     await proxyDelegateV1.burnToken(tokenOrigAccount, value.toString());
  //     let htlcBurnedBalance = await contract.methods.balanceOf(htlcAddr).call();
  //     // console.log("after burn token balance", htlcBurnedBalance, typeof(htlcBurnedBalance));

  //     lib.assertCommonEqual(Number(htlcBurnedBalance) + value, Number(htlcBalance));
  //     lib.assertCommonEqual(htlcBalance, userMintedBalance);

  //   } catch (err) {
  //     // console.error(JSON.stringify(err));
  //     // lib.assertFail("mint token with self-defined htlc address, it should be success", err);
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  // it('mint and burn token with non-htlc address, it should be throw error', async () => {
  //   let proxyDelegateV1, tokenInfoV1;
  //   let htlcAddr = accounts[3];
  //   let userAddr = accounts[1];

  //   // Initalize the proxy with the first delegate version 1.
  //   if (delegate.address !== await proxy.implementation()) {
  //     await proxy.upgradeTo(delegate.address)
  //   }
  //   // Setup the proxy receive function calls as if it were acting as
  //   //  the delegate.
  //   proxyDelegateV1 = await TokenManagerDelegate.at(proxy.address);
  //   await proxyDelegateV1.setHtlcAddr(htlcAddr);

  //   let {
  //     asciiTokenOrigAccount,
  //     token2WanRatio,
  //     minDeposit,
  //     withdrawDelayTime,
  //     asciiTokenName,
  //     asciiTokenSymbol,
  //     decimals
  //   } = getTokenInfo();

  //   let tokenOrigAccount = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenOrigAccount));
  //   let tokenName = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenName));
  //   let tokenSymbol = await web3.utils.hexToBytes(await web3.utils.toHex(asciiTokenSymbol));
  //   try {
  //     await proxyDelegateV1.removeToken(tokenOrigAccount);
  //     await proxyDelegateV1.addToken(tokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, tokenName, tokenSymbol, decimals);
  //     tokenInfoV1 = await proxyDelegateV1.getTokenInfo(tokenOrigAccount);
  //     let wTokenAddr = tokenInfoV1["3"];
  //     // console.log("wTokenAddr ", wTokenAddr);

  //     const abi = getWanTokenAbi();

  //     let contract = new web3.eth.Contract(abi, wTokenAddr);

  //     // console.log("mint token for ", userAddr);
  //     let userBalance = await contract.methods.balanceOf(userAddr).call();
  //     // console.log("before mint token balance", userBalance, typeof(userBalance));

  //     let value = 99;
  //     try {
  //       await proxyDelegateV1.mintToken(tokenOrigAccount, userAddr, value.toString());
  //       lib.assertFail("mint token with non-htlc address, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Sender is not allowed");
  //     }

  //     let userMintedBalance = await contract.methods.balanceOf(userAddr).call();
  //     // console.log("after mint token balance", userMintedBalance, typeof(userMintedBalance));

  //     lib.assertCommonEqual(Number(userMintedBalance), Number(userBalance));
  //     // console.log("compare mint token balance success");

  //     let htlcBalance = await contract.methods.balanceOf(htlcAddr).call();
  //     // console.log("before burn token balance", htlcBalance, typeof(htlcBalance));

  //     try {
  //       await proxyDelegateV1.burnToken(tokenOrigAccount, value.toString());
  //       lib.assertFail("burn token with non-htlc address, it should be throw error");
  //     } catch (err) {
  //       lib.expectToBeAnInstanceOf(err, Error);
  //       lib.assertExists(err.reason);
  //       lib.assertCommonEqual(err.reason, "Sender is not allowed");
  //     }

  //     let htlcBurnedBalance = await contract.methods.balanceOf(htlcAddr).call();
  //     // console.log("after burn token balance", htlcBurnedBalance, typeof(htlcBurnedBalance));

  //     lib.assertCommonEqual(Number(htlcBurnedBalance), Number(htlcBalance));
  //     lib.assertCommonEqual(userBalance, htlcBurnedBalance);

  //   } catch (err) {
  //     // console.error(JSON.stringify(err));
  //     lib.assertFail(err);
  //   }
  //   await proxyDelegateV1.removeToken(tokenOrigAccount);
  // });

  it('transfer wan coin to token manager delegate contract, it should be throw error', async () => {
    let userAddr = accounts[1];

    try {
      await web3.eth.sendTransaction({from: userAddr, to: delegate.address, value: web3.utils.toWei("0.5")})
      lib.assertFail("transfer to tokenManagerDelegate contract, it should be throw error");
    } catch (err) {
      lib.expectToBeAnInstanceOf(err, Error);
      lib.assertInclude(err.message, "Not support", err);
    }
  });

});