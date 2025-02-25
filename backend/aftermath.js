/**
 * aftermath.js
 * Simplified configuration for Aftermath on MAINNET in Node/Express,
 * plus a getPools() helper to retrieve the Pools module.
 */

const { Aftermath } = require("aftermath-ts-sdk");

let afSdk = null;

/**
 * Initialize Aftermath for MAINNET.
 * Uses default Sui RPC and addresses.
 */
async function aftermathInit() {
  if (!afSdk) {
    afSdk = new Aftermath("MAINNET");
    await afSdk.init();
  }
}

function getRouter() {
  if (!afSdk) {
    throw new Error("Aftermath not initialized. Call aftermathInit() first.");
  }
  return afSdk.Router();
}

/** Provide the Pools module to fetch pool data. */
function getPools() {
  if (!afSdk) {
    throw new Error("Aftermath not initialized. Call aftermathInit() first.");
  }
  return afSdk.Pools();
}

module.exports = { aftermathInit, getRouter, getPools };
