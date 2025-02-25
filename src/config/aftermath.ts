/**
 * aftermath.ts
 * Centralized configuration for the Aftermath SDK on Sui Mainnet, using a custom Sui RPC.
 */

import {
  AftermathApi,
  getDefaultAddressesFor,
  IndexerCaller,
} from "aftermath-ts-sdk";
import { SuiClient, SuiHTTPTransport } from "@mysten/sui/client";

// We'll store our single instance of AftermathApi here
let afApi: AftermathApi | null = null;

/**
 * Initialize Aftermath for MAINNET with a custom Sui RPC endpoint.
 */
export async function aftermathInit() {
  if (!afApi) {
    // Addresses for Aftermath's mainnet contracts
    const addresses = getDefaultAddressesFor("MAINNET");

    // Create a SuiClient pointing to the public node
    const customClient = new SuiClient({
      transport: new SuiHTTPTransport({
        url: "https://sui-rpc.publicnode.com",
      }),
    });

    // Create the indexer for Aftermath (mainnet)
    const indexer = new IndexerCaller("MAINNET");

    // Build the AftermathApi with our custom SuiClient
    afApi = new AftermathApi(customClient, addresses, indexer);
  }
}

/**
 * Access the Router module (for swaps).
 */
export function getRouter() {
  if (!afApi) throw new Error("Aftermath not initialized.");
  return afApi.Router();
}

/**
 * Access the Pools module (for liquidity).
 */
export function getPools() {
  if (!afApi) throw new Error("Aftermath not initialized.");
  return afApi.Pools();
}

/**
 * Access the Farms module (for yield farming).
 */
export function getFarms() {
  if (!afApi) throw new Error("Aftermath not initialized.");
  return afApi.Farms();
}

/**
 * Access the Prices module (for real-time token prices).
 */
export function getPrices() {
  if (!afApi) throw new Error("Aftermath not initialized.");
  return afApi.Prices();
}
