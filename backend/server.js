/**
 * server.js
 * Express server that calls the Aftermath SDK for swaps on Sui mainnet.
 * Adds a new /api/tradeable-coins endpoint for dynamic coin selection.
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { aftermathInit, getRouter, getPools } = require("./aftermath");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

/**
 * Caches:
 * - tradeableCoinsCache: array of valid coins
 * - adjacencyMapCache: adjacency info for coin pairs
 */
let tradeableCoinsCache = [];
let adjacencyMapCache = {};

/**
 * refreshTradeableCoins:
 * 1. Fetch all pools from Aftermath
 * 2. Filter out low-liquidity pools
 * 3. Gather all coin types & build adjacency sets
 * 4. Save them in memory for quick retrieval
 */
async function refreshTradeableCoins() {
  try {
    console.log("[TradeableCoins] Refreshing coin list from pools...");
    const pools = getPools();
    const allPools = await pools.getAllPools();

    // Filter out low or zero liquidity pools (simple example).
    const filteredPools = allPools.filter((p) => {
      // Each pool has a record p.coins: { [coinType]: { balance, decimals, ... } }
      const coinEntries = Object.entries(p.coins);
      // Keep if it has >=2 coins with positive balance
      const positive = coinEntries.filter(
        ([type, coinData]) => coinData.balance > 0
      );
      return positive.length >= 2;
    });

    // Build a set of all coin types across these filtered pools.
    const coinSet = new Set();
    // adjacencyMap: coin => Set of coins in the same pool
    const adjacencyMap = {};

    for (const pool of filteredPools) {
      const coinTypes = Object.keys(pool.coins);
      for (const c of coinTypes) {
        coinSet.add(c);
        if (!adjacencyMap[c]) adjacencyMap[c] = new Set();
      }
      // Build adjacency among coins in the same pool
      for (let i = 0; i < coinTypes.length; i++) {
        for (let j = i + 1; j < coinTypes.length; j++) {
          adjacencyMap[coinTypes[i]].add(coinTypes[j]);
          adjacencyMap[coinTypes[j]].add(coinTypes[i]);
        }
      }
    }

    // Convert coinSet to an array and optionally attach a placeholder name
    const tradeableCoins = Array.from(coinSet).map((type) => ({
      type,
      name: type.slice(0, 12) + "...", // simple placeholder name
    }));

    // Sort them alphabetically
    tradeableCoins.sort((a, b) => (a.type > b.type ? 1 : -1));

    // Convert adjacency sets to arrays
    const adjacencyMapObj = {};
    for (const c of Object.keys(adjacencyMap)) {
      adjacencyMapObj[c] = Array.from(adjacencyMap[c]);
    }

    // Update caches
    tradeableCoinsCache = tradeableCoins;
    adjacencyMapCache = adjacencyMapObj;

    console.log(
      `[TradeableCoins] Found ${filteredPools.length} pools -> ${tradeableCoins.length} unique coin types.`
    );
  } catch (err) {
    console.error("Failed to refresh tradeable coins:", err);
  }
}

// Provide an endpoint to retrieve the coin list + adjacency
app.get("/api/tradeable-coins", (req, res) => {
  res.json({
    coins: tradeableCoinsCache,
    adjacencyMap: adjacencyMapCache,
  });
});

// Initialize the Aftermath SDK and refresh coins at startup
(async () => {
  try {
    await aftermathInit();
    console.log("Aftermath SDK initialized!");

    // Immediately fetch the tradeable coins
    await refreshTradeableCoins();
    // Refresh every 5 minutes
    setInterval(refreshTradeableCoins, 5 * 60 * 1000);
  } catch (err) {
    console.error("Failed to init Aftermath SDK:", err);
  }
})();

/**
 * Existing swap routes:
 * 1) Fetch Swap Quote
 * 2) Build Transaction
 */
app.post("/api/swap/quote", async (req, res) => {
  try {
    const { coinInType, coinOutType, coinInAmount } = req.body;
    const router = getRouter();
    const bigAmount = BigInt(coinInAmount);

    const route = await router.getCompleteTradeRouteGivenAmountIn({
      coinInType,
      coinOutType,
      coinInAmount: bigAmount,
      referrer: null,
    });

    return res.json(route);
  } catch (err) {
    console.error("Error fetching swap quote:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

app.post("/api/swap/transaction", async (req, res) => {
  try {
    const { walletAddress, completeRoute, slippage } = req.body;
    const router = getRouter();

    const txBlock = await router.getTransactionForCompleteTradeRoute({
      walletAddress,
      completeRoute,
      slippage,
    });

    return res.json(txBlock);
  } catch (err) {
    console.error("Error building swap transaction:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
