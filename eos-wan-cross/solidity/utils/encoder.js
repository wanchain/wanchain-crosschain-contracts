'use strict'

function str2hex(str) {
    var hex = [];
    hex.push("0x"); 
    for (var i = 0; i < str.length; i++) {
      hex.push((str.charCodeAt(i)).toString(16));
    }
    return hex.join("");
}

module.exports = {
    str2hex
};