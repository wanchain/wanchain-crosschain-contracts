'use strict'

const crypto = require('crypto');
const keccak = require('keccak');

const algorithmsMap = new Map([
  ["keccak256", keccak],
  ["sha256", crypto.createHash]
]);

// input
const paras = process.argv;
// algorithms
var algorithms = paras[2];
var hashFn = algorithmsMap.get(algorithms);
if (!hashFn) {
  showUsage();
  process.exit(1);
}

// pairs
var num = parseInt(paras[3]);
if (!num) {
  num = 10;
}
// startX
var random = true;
var startX = parseInt(paras[4]);
if (!isNaN(startX)) {
  random = false;
}

for (let i = 0, x, hash; i < num; i++) {
  // x
  if (random) {
    x = crypto.randomBytes(32);
  } else {
    x = Buffer.from((Array(63).fill('0').join("") + startX.toString(16)).slice(-64), "hex");
    startX += 1;
  }
  hash = hashFn(algorithms).update(x);  
  // sn
  console.log("No.%s", i + 1);
  console.log("x     = 0x%s", x.toString("hex"));
  console.log("xHash = 0x%s\r\n", hash.digest("hex"));
}

function showUsage() {
  console.log("Usage: node xHash <algorithms> [ <number> ] [ <startX> ]");
  console.log("       algorithms - keccak256 or sha256");
  console.log("       number     - pairs to generate, 10 by default");
  console.log("       startX     - the start x value(decimal), random by default");
}