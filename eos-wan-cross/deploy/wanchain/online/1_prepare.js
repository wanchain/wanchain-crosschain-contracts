const tool = require('../utils/tool')
const scTool = require('../utils/scTool')

const owner = '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274';

async function prepare() {
  let ownerNonce = await scTool.getNonce(owner);
  tool.write2file("../nonce.json", JSON.stringify({owner: ownerNonce}));
}

prepare();