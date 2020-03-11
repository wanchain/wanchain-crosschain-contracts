
const lib = require("./lib");
const {
  // sleepTimeDict,
  permissionDict,
  eosERROR
} = require("./config");

async function sleepMs(time) {
  return new Promise(function (resolve, reject) {
      setTimeout(function () {
          resolve();
      }, time);
  });
};

function getEosLime(eosConfig) {
  var eoslime = require("eoslime");

  return eoslime.init(eosConfig);
}

async function getContractInstanceFromAbiFile(eoslime, contractName, contractExecutorAccountConfig,
  abiPath, authorityName = permissionDict.active) {
  /* call contract => load */
  let contractAccount = await loadAccount(eoslime, contractExecutorAccountConfig.name, contractExecutorAccountConfig.privateKey, authorityName);
  return await contractAtFromAbiFile(eoslime, abiPath, contractName, contractAccount);

}

async function getContractInstance(eoslime, contractName, contractExecutorAccountConfig, authorityName = permissionDict.active) {
  /* call contract => load */
  let contractAccount = await loadAccount(eoslime, contractExecutorAccountConfig.name, contractExecutorAccountConfig.privateKey, authorityName);
  return await contractAt(eoslime, contractName, contractAccount);
}

function ignoreError(ignoreCode, err) {
  let parseError = (err) => {
    if (typeof(err) === "string") {
      try {
        return JSON.parse(err);
      } catch (innerErr) {}
    }
    return err;
  };
  err = parseError(err);
  if (err.hasOwnProperty("error") && err.error.hasOwnProperty("code")) {
    return ignoreCode === err["error"]["code"];
  }
  return false;
}

// var deployContract = async (log, eoslime, wasm, abi, account, options, retry) => {
//   let contract;
//   try {
//     contract = await newContract(wasm, abi, account, options);
//   } catch (err) {
//     let parseError = (err) => {
//       if (typeof(err) === "string") {
//         try {
//           return JSON.parse(err);
//         } catch (innerErr) {
//         }
//       }
//       return err;
//     };
//     let isIgnoreError = (errCode) => {
//       let ignore = false;
//       switch (errCode) {
//         case 3160008: {
//         // case eosERROR["3160008"]: {
//           ignore = true;
//         }
//       }
//       return ignore;
//     }

//     err = parseError(err);
//     log.debug("\n\n err => ", typeof(err));
//     if (err.hasOwnProperty("error") && isIgnoreError(err["error"]["code"])) {
//       log.debug("the contract ", account, "already deployment");
//       return contract; /* undefined */
//     }
//     if (typeof(retry) === "undefined") {
//       log.error("deployContract => AccountDeployer error, ", err);
//       log.error("retry");
//       await sleepMs(sleepTimeDict[1000]);
//       return await deployContract(eoslime, wasm, abi, account, options, retry);
//     }
//     if (--retry > 0) {
//       log.error("deployContract => AccountDeployer error, ", err);
//       log.error("retry", retry);
//       await sleepMs(sleepTimeDict[1000]);
//       return await deployContract(eoslime, wasm, abi, account, options, retry);
//     } else {
//       log.error("deployContract => AccountDeployer error, ", err);
//     }
//   }
//   return contract; 
// }

function sha256(message) {
  const crypto = require('crypto');
  return crypto.createHash('SHA256').update(message, "utf8").digest('hex');
}

function keccak(message) {
  const keccak = require('keccak');
  return keccak('keccak256').update(message).digest('hex');
}

async function newContract(eoslime, wasmPath, abiPath, contractAccount, options = {inline: false}) {
  return await eoslime.Contract.deployOnAccount(wasmPath, abiPath, contractAccount, options);
}

async function contractAtFromAbiFile(eoslime, abiPath, contractName, contractExecutorAccount) {
  return await eoslime.Contract.fromFile(abiPath, contractName, contractExecutorAccount);
}

async function contractAt(eoslime, contractName, contractExecutorAccount) {
  return await eoslime.Contract.at(contractName, contractExecutorAccount);
}

async function loadAccount(eoslime, name, privateKey, authorityName) {
  return await eoslime.Account.load(name, privateKey, authorityName);
}

async function getContractTable(contractInstance, tableName, scopeName) {
  return await contractInstance.provider.select(tableName).from(contractInstance.name).scope(scopeName);
}

async function createActiveSubAuthority(account, permission) {
  return await account.createSubAuthority(permission);
}

async function setActionPermission(authorityAccount, actName, contractName) {
    return await authorityAccount.setAuthorityAbilities([{
    action: actName,
    contract: contractName
  }]);
}

async function setMultiActionsPermission(authorityAccount, behaviour) {
  if (!Array.isArray(behaviour)) {
    throw "invalid parameter, need array here";
  }
  let invalid = behaviour.some(be => {
    return !be.action || !be.contract
  })
  if (invalid) {
    throw "invalid parameter, missing key 'action' or 'array'";
  }

  return await authorityAccount.setAuthorityAbilities(behaviour);
}

// const charmap = '.12345abcdefghijklmnopqrstuvwxyz'
// const charidx = ch => {
//   const idx = charmap.indexOf(ch)
//   if(idx === -1)
//     throw new TypeError(`Invalid character: '${ch}'`)

//   return idx
// }

const charidx = (ch) => {
  if (ch === ".") {
    return 0;
  }
  if (ch >= "1" && ch <= "5") {
    return (ch - '1') + 1;
  }
  if (ch >= "a" && ch <= "z") {
    return ch - "a" + 6;
  }
  throw new TypeError(`Invalid character: '${ch}'`);
}

function getUint64AsNumber(name, littleEndian = false) {
  if(typeof name !== 'string')
    throw new TypeError('name parameter is a required string');

  if(name.length > 12)
    throw new TypeError('A name can be up to 12 characters long');

  let bitstr = ''
  for(let i = 0; i <= 12; i++) { // process all 64 bits (even if name is short)
    const c = i < name.length ? charidx(name[i]) : 0
    const bitlen = i < 12 ? 5 : 4
    let bits = Number(c).toString(2)
    if(bits.length > bitlen) {
      throw new TypeError('Invalid name ' + name)
    }
    bits = '0'.repeat(bitlen - bits.length) + bits
    bitstr += bits
  }

  const {Long} = require('bytebuffer')

  const value = Long.fromString(bitstr, true, 2)

  // convert to LITTLE_ENDIAN
  let leHex = ''
  const bytes = littleEndian ? value.toBytesLE() : value.toBytesBE()
  for(const b of bytes) {
    const n = Number(b).toString(16)
    leHex += (n.length === 1 ? '0' : '') + n
  }

  const ulName = Long.fromString(leHex, true, 16).toString()

  return ulName.toString()
}

function fromAsset(balance, account) {
  if (typeof(account) !== "string") {
    throw new TypeError('Invalid token account ' + account);
  }
  if (typeof(balance) !== "string") {
    throw new TypeError('Invalid balance ' + balance);
  }
  let assetEles = balance.split(" ");
  return {
    account: account,
    amount: Number(assetEles[0]),
    symbol: assetEles[1]
  }
}

function toAsset(asset) {
  if (typeof(asset) !== "object" || !asset.hasOwnProperty("amount") || !asset.hasOwnProperty("symbol")) {
    throw new TypeError('toAsset: Invalid asset ' + asset);
  }
  return {
    account: asset.account,
    balance: asset.amount.toFixed(4) + " " + asset.symbol
  };
}

function subAsset(asset1, asset2) {
  let a1 = fromAsset(asset1.balance, asset1.account);
  let a2 = fromAsset(asset2.balance, asset2.account);

  if ((!a1.account && !a2.account) || (a1.account !== a2.account)) {
    throw new TypeError('Invalid subtraction token account between ' + asset1.account + " and " + asset2.account);
  }

  if (!a1.symbol && !a2.symbol) {
    throw new TypeError('Invalid subtraction symbol between ' + asset1.symbol + " and " + asset2.symbol);
  }

  if (a1.symbol && a2.symbol && a1.symbol !== a2.symbol) {
    throw new TypeError('Invalid subtraction symbol between ' + asset1.symbol + " and " + asset2.symbol);
  }

  return toAsset({
    account: a1.account,
    amount: a1.amount - a2.amount,
    symbol: a1.symbol ? a1.symbol : a2.symbol
  });
}

function addAsset(asset1, asset2) {
  let a1 = fromAsset(asset1.balance, asset1.account);
  let a2 = fromAsset(asset2.balance, asset2.account);

  if ((!a1.account && !a2.account) || (a1.account !== a2.account)) {
    throw new TypeError('Invalid subtraction token account between ' + asset1.account + " and " + asset2.account);
  }

  if (!a1.symbol && !a2.symbol) {
    throw new TypeError('Invalid subtraction symbol between ' + asset1.symbol + " and " + asset2.symbol);
  }

  if (a1.symbol && a2.symbol && a1.symbol !== a2.symbol) {
    throw new TypeError('Invalid subtraction symbol between ' + asset1.symbol + " and " + asset2.symbol);
  }

  return toAsset({
    account: a1.account,
    amount: a1.amount + a2.amount,
    symbol: a1.symbol ? a1.symbol : a2.symbol
  });
}

function setAsset(tokenAccount, value, symbol) {
  return toAsset({
    account: tokenAccount,
    amount: value,
    symbol: symbol
  });
}

module.exports = {
  sleepMs: sleepMs,
  sha256: sha256,
  keccak: keccak,
  ignoreError: ignoreError,
  newContract: newContract,
  contractAtFromAbiFile: contractAtFromAbiFile,
  contractAt: contractAt,
  // deployContract: deployContract,
  getEosLime: getEosLime,
  getContractInstance: getContractInstance,
  getContractInstanceFromAbiFile: getContractInstanceFromAbiFile,
  loadAccount: loadAccount,
  getContractTable: getContractTable,
  createActiveSubAuthority: createActiveSubAuthority,
  setActionPermission: setActionPermission,
  setMultiActionsPermission: setMultiActionsPermission,
  getUint64AsNumber: getUint64AsNumber,
  subAsset: subAsset,
  addAsset: addAsset,
  setAsset: setAsset
};