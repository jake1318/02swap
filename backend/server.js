/**
 * server.js
 * Express server that calls the Aftermath SDK for swaps on Sui mainnet.
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { aftermathInit, getRouter } = require("./aftermath");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// Initialize the Aftermath SDK once at startup:
(async () => {
  try {
    await aftermathInit();
    console.log("Aftermath SDK initialized!");
  } catch (err) {
    console.error("Failed to init Aftermath SDK:", err);
  }
})();

/**
 * 1) Fetch Swap Quote (Route)
 * Expects:
 *   {
 *     "coinInType":  "<Sui coin type>",
 *     "coinOutType": "<Sui coin type>",
 *     "coinInAmount": "1000000000"    // as string, BigInt-compatible
 *   }
 * Returns a JSON route object from Aftermath.
 */
app.post("/api/swap/quote", async (req, res) => {
  try {
    const { coinInType, coinOutType, coinInAmount } = req.body;
    const router = getRouter();

    // Convert input amount to BigInt
    const bigAmount = BigInt(coinInAmount);

    // Fetch best route for the given input coin amount
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

/**
 * 2) Build Transaction for the Fetched Route
 * Expects:
 *   {
 *     "walletAddress": "<sui address>",
 *     "completeRoute": {...},  // the route object from the /swap/quote call
 *     "slippage": 0.005
 *   }
 * Returns a transaction block (JSON) to be signed by the user's wallet.
 */
app.post("/api/swap/transaction", async (req, res) => {
  try {
    const { walletAddress, completeRoute, slippage } = req.body;
    const router = getRouter();

    // Build transaction block for the entire route
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

// Start listening
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
