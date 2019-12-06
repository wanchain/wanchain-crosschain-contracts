const schnorr = require('./tools');

const skSmg1 			= new Buffer("097e961933fa62e3fef5cedef9a728a6a927a4b29f06a15c6e6c52c031a6cb2b", 'hex');
const skSmg2 			= new Buffer("e6a00fb13723260102a6937fc86b0552eac9abbe67240d7147f31fdef151e18a", 'hex');
const skSrcSmg 		    = new Buffer("0de99c2552e85e51fd7491a14ad340f92a02db92983178929b100776197bc4f6", 'hex');
const skDstSmg 		    = new Buffer("b3ba835eae481e6af0219a9cda3769622eea512aacfb7ea4eb0e9426ff800dc5", 'hex');

function test(){
  let typesArray;
  let parameters;
  typesArray= ['uint256','string'];
  parameters= ['2345675643', 'Hello!%'];

  // let M = computeM(typesArray,parameters);
  // console.log("=====M===hex");
  // console.log(M.toString('hex'));
  //
  // let M1 = computeM1(M);
  // console.log("=====M1===hex");
  // console.log(M1.toString('hex'));
  //
  // let m = computem(M,R)
  // console.log("=====m===hex");
  // console.log(m.toString('hex'));
  let pk = schnorr.getPKBySk(skSmg1);
  console.log("=====pk===hex");
  console.log(pk);
  let s = schnorr.getS(skSmg1,typesArray,parameters);
  console.log("=====s===hex");
  console.log(s);


  console.log("=====R===hex");
  console.log(schnorr.getR());
}
test();