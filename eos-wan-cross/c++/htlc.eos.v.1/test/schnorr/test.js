const schnorr = require('./tools');
const skSmg = Buffer.from("097e961933fa62e3fef5cedef9a728a6a927a4b29f06a15c6e6c52c031a6cb2b", 'hex');

function test() {
    let parameters;
    parameters = ['1580921440', '3edcwertdfgh'];
    let pk = schnorr.getPKBySk(skSmg);

    console.log("=====pk===hex");
    console.log(pk);

    let s = schnorr.getS(skSmg, parameters);
    console.log("=====s===hex");
    console.log(s);

    console.log("=====R===hex");
    console.log(schnorr.getR());
}
test();