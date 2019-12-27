const cfg = require('../config.json');
const tool = require('../utils/tool');
const scTool = require('../utils/scTool');

async function initNonce() {
  let nonce;

  // admin
  nonce = await scTool.getNonce('admin');
  tool.updateNonce('admin', nonce);

  // library onwer
  nonce = await scTool.getNonce('libOwner');
  tool.updateNonce('libOwner', nonce);

  // storemanGroup delegate
  nonce = await scTool.getNonce('smgDelegate');
  tool.updateNonce('smgDelegate', nonce);
}

initNonce();