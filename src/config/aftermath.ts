/**
 * aftermath.ts
 * Simplified configuration for the Aftermath SDK on MAINNET (no custom RPC).
 */

import { Aftermath } from "aftermath-ts-sdk";

let afSdk: Aftermath | null = null;

/**
 * Initialize Aftermath for MAINNET.
 * Loads default mainnet addresses and connects to Sui's default RPC.
 */
export async function aftermathInit() {
  if (!afSdk) {
    afSdk = new Aftermath("MAINNET");
    // Must call init() to load contract addresses & finalize setup
    await afSdk.init();
  }
}

/**
 * Access the Router module (for swaps).
 */
export function getRouter() {
  if (!afSdk) throw new Error("Aftermath not initialized.");
  return afSdk.Router();
}

/**
 * Access the Pools module (for liquidity).
 */
export function getPools() {
  if (!afSdk) throw new Error("Aftermath not initialized.");
  return afSdk.Pools();
}

/**
 * Access the Farms module (for yield farming).
 */
export function getFarms() {
  if (!afSdk) throw new Error("Aftermath not initialized.");
  return afSdk.Farms();
}

/**
 * Access the Prices module (for real-time token prices).
 */
export function getPrices() {
  if (!afSdk) throw new Error("Aftermath not initialized.");
  return afSdk.Prices();
}
