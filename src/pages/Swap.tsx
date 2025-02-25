import React, { useState, useEffect } from "react";
import { useWallet } from "@suiet/wallet-kit";

export default function Swap() {
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();
  const [fromCoinType, setFromCoinType] = useState("0x2::sui::SUI");
  const [toCoinType, setToCoinType] = useState("0x6::otherCoin::COIN");
  const [amount, setAmount] = useState("0");
  const [estimatedOut, setEstimatedOut] = useState("0");
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (connected && parseFloat(amount) > 0) {
      updateEstimation();
    } else {
      setEstimatedOut("0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCoinType, toCoinType, amount, connected]);

  async function updateEstimation() {
    if (!connected) return;
    try {
      setLoadingRoute(true);

      // Convert amount to the smallest unit (9 decimals as example)
      const coinInAmount = BigInt(
        Math.floor(parseFloat(amount) * 1e9)
      ).toString();
      const payload = {
        coinInType: fromCoinType,
        coinOutType: toCoinType,
        coinInAmount, // as string
      };

      // Call our backend for the trade route
      const response = await fetch("http://localhost:3001/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Estimation response not OK:", response.status);
        setEstimatedOut("0");
        return;
      }

      const route = await response.json();
      if (!route || !route.coinOutAmount) {
        setEstimatedOut("0");
      } else {
        // route.coinOutAmount is typically a BigInt string
        const estimatedOutNum = Number(route.coinOutAmount) / 1e9;
        setEstimatedOut(estimatedOutNum.toFixed(6));
      }
    } catch (err) {
      console.error("Error getting route:", err);
      setEstimatedOut("0");
    } finally {
      setLoadingRoute(false);
    }
  }

  async function handleSwap() {
    if (!connected || !account) {
      return alert("Wallet not connected.");
    }
    try {
      // 1) Fetch the route again (or you could reuse the route from state).
      const coinInAmount = BigInt(
        Math.floor(parseFloat(amount) * 1e9)
      ).toString();
      const routePayload = {
        coinInType: fromCoinType,
        coinOutType: toCoinType,
        coinInAmount,
      };
      const routeResponse = await fetch(
        "http://localhost:3001/api/swap/quote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(routePayload),
        }
      );

      if (!routeResponse.ok) {
        alert("Failed to get trade route. Check server logs.");
        return;
      }
      const route = await routeResponse.json();
      if (!route) {
        return alert("No route found for this pair.");
      }

      // 2) Build a transaction block on the server, specifying slippage and wallet address
      const txPayload = {
        walletAddress: account.address,
        completeRoute: route,
        slippage: 0.005, // 0.5% slippage
      };
      const txResponse = await fetch(
        "http://localhost:3001/api/swap/transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(txPayload),
        }
      );

      if (!txResponse.ok) {
        alert("Failed to get transaction block.");
        return;
      }
      const txBlock = await txResponse.json();

      // 3) Use the connected wallet to sign and execute
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: txBlock,
      });
      console.log("Swap success:", result);
      alert("Swap executed successfully!");
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed. Check console for details.");
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Swap</h3>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>From Coin Type: </label>
        <input
          type="text"
          value={fromCoinType}
          onChange={(e) => setFromCoinType(e.target.value)}
          style={{ width: "30rem" }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>To Coin Type: </label>
        <input
          type="text"
          value={toCoinType}
          onChange={(e) => setToCoinType(e.target.value)}
          style={{ width: "30rem" }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <label>Amount In: </label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "10rem" }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <button onClick={updateEstimation} disabled={loadingRoute}>
          {loadingRoute ? "Fetching Route..." : "Estimate Out"}
        </button>
        {"   "}
        Estimated Out: {estimatedOut}
      </div>

      <button onClick={handleSwap} disabled={!connected}>
        Execute Swap
      </button>
    </div>
  );
}
