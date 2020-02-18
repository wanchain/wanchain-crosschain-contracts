const schnorr = require('./tools');
const skSmg = new Buffer("097e961933fa62e3fef5cedef9a728a6a927a4b29f06a15c6e6c52c031a6cb2b", 'hex');

function test() {

    //===================Create sig=====================
    console.log("===================Create sig=====================");
    let typesArray;
    let parameters;
    typesArray = ['uint256', 'string'];
    parameters = ['2345675643', 'Hello!%'];

    console.log("=====pk===hex");
    let pk = schnorr.getPKBySk(skSmg);

    console.log(pk);

    console.log("=====s by encodeParameters ===hex");
    let s = schnorr.getS(skSmg, typesArray, parameters);
    console.log(s);

    console.log("=====s by raw message===hex");
    let rawMsg = "0x1234";
    let sByRaw = schnorr.getSByRawMsg(skSmg, rawMsg);
    console.log(sByRaw);

    console.log("=====R===hex");
    console.log(schnorr.getR());

    //===================Verify sig=====================
    // success
    console.log("===================Verify sig 1=====================");
    try {
        let ret = schnorr.verifySig(schnorr.getR(), sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // 'H'
    console.log("===================Verify sig 2=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c39H",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // odd
    console.log("===================Verify sig 3=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig(schnorr.getR(),
            "0xa1472c7ba8c91fa906f3491591b30a72a7c353cedf48eca35c28d4b1fe45a1b", rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // empty
    console.log("===================Verify sig 4=====================");
    try {
        let rawMsg = "0x";
        let ret = schnorr.verifySig(schnorr.getR(),
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
    // len < 2
    console.log("===================Verify sig 5=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig(schnorr.getR(),
            sByRaw, rawMsg, "0x1");
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
    // len< 130
    console.log("===================Verify sig 6=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c3",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // len > 130
    console.log("===================Verify sig 7=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c39eee",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // point not on curve
    console.log("===================Verify sig 8=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c39f",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
    // raw msg not match the signature
    console.log("===================Verify sig 9=====================");
    try {
        let rawMsg = "0x123456";
        let ret = schnorr.verifySig(schnorr.getR(),
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
}

test();