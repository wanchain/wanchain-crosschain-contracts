const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

const owner = '0x938cE70246CB3e62fa4BA12D70D9bb84FF6C9274';
const noncePath = tool.getOutputPath('nonce');

async function getNonce() {
  let ownerNonce = await scTool.getNonce(owner);
  tool.write2file(noncePath, JSON.stringify({owner: ownerNonce}));
}

getNonce(owner);