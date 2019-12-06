const crypto 			= require('crypto');
const BigInteger 	    = require('bigi');
const ecurve 			= require('ecurve');
const Web3EthAbi 	    = require('web3-eth-abi');
const  ecparams 	    = ecurve.getCurveByName('secp256k1');

// buffer
const r 			    = new Buffer("e7e59bebdcee876e84d03832544f5a517e96a9e3f60cd8f564bece6719d5af52", 'hex');
// buffer
let R					= baseScarMulti(r);

const skSmg1 			= new Buffer("097e961933fa62e3fef5cedef9a728a6a927a4b29f06a15c6e6c52c031a6cb2b", 'hex');
const skSmg2 			= new Buffer("e6a00fb13723260102a6937fc86b0552eac9abbe67240d7147f31fdef151e18a", 'hex');
const skSrcSmg 		    = new Buffer("0de99c2552e85e51fd7491a14ad340f92a02db92983178929b100776197bc4f6", 'hex');
const skDstSmg 		    = new Buffer("b3ba835eae481e6af0219a9cda3769622eea512aacfb7ea4eb0e9426ff800dc5", 'hex');

// sk*G
// return: buff
function baseScarMulti(sk){
  let curvePt = ecparams.G.multiply(BigInteger.fromBuffer(sk));
  return curvePt.getEncoded(false);
}

// hash
// return:buffer
function h(buff){
  let sha = crypto.createHash('sha256').update(buff).digest();
  return sha;
}

// get s
// s = r+sk*m
// return: buffer
function getSBuff(sk, m){
  let rBig 	= BigInteger.fromBuffer(r);
  let skBig = BigInteger.fromBuffer(sk);
  let mBig 	= BigInteger.fromBuffer(m);
  rBig.add(skBig.multiply(mBig).mod(ecparams.n)).mod(ecparams.n);
  return rBig.toBuffer(32);
}

// return: buffer
function computeM1(M){
  let M1 = h(M);
  return M1;
}
// compute m
// M1=hash(M)
// m=hash(M1||R)
// M: buffer
// R: buffer
// return: buffer
function computem(M,R){
  let list = [];
  // M1 = hash(M)
  let M1 = computeM1(M);
  list.push(M1);
  list.push(R);
  // hash(M1||R)
  let m = Buffer.concat(list);
  return h(m)
}
//typesArray:['uint256','string']
//parameters: ['2345675643', 'Hello!%']
//return : buff
function computeM(typesArray,parameters){
  let mStrHex = Web3EthAbi.encodeParameters(typesArray, parameters);
  return new Buffer(mStrHex.substring(2),'hex');
}

// return : hexString
function getR(){
  return "0x"+ R.toString('hex');
}

// return: hexString
function bufferToHexString(buff){
  return "0x"+buff.toString('hex');
}
// sk: buff
// return: hexString
function getPKBySk(sk){
  return bufferToHexString(baseScarMulti(sk));
}
//typesArray:['uint256','string']
//parameters: ['2345675643', 'Hello!%']
//return :hexString
function getS(sk,typesArray,parameters){
  let MBuff = computeM(typesArray,parameters);
  let mBuff = computem(MBuff,R);
  let sBuff = getSBuff(sk,mBuff);
  return bufferToHexString(sBuff);
}
module.exports = {
  getS: getS,
  getPKBySk: getPKBySk,
  getR: getR
};