import React, { useState, useEffect, useMemo } from "react";
import { useWallet } from "@suiet/wallet-kit";

export default function Swap() {
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();

  // Store the full coin list + adjacency map from the backend
  const [coinList, setCoinList] = useState<any[]>([]);
  const [adjacencyMap, setAdjacencyMap] = useState<Record<string, string[]>>(
    {}
  );

  // Selections
  const [fromCoinType, setFromCoinType] = useState("0x2::sui::SUI");
  const [toCoinType, setToCoinType] = useState("");
  const [amount, setAmount] = useState("0");
  const [estimatedOut, setEstimatedOut] = useState("0");
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Fetch tradeable coins once
  useEffect(() => {
    fetch("http://localhost:3001/api/tradeable-coins")
      .then((res) => res.json())
      .then((data) => {
        setCoinList(data.coins || []);
        setAdjacencyMap(data.adjacencyMap || {});
      })
      .catch((err) => console.error("Failed to load tradeable coins:", err));
  }, []);

  // Whenever from/to/amount changes, update the estimation
  useEffect(() => {
    if (connected && parseFloat(amount) > 0 && fromCoinType && toCoinType) {
      updateEstimation();
    } else {
      setEstimatedOut("0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCoinType, toCoinType, amount, connected]);

  // Filter 'To' coins based on adjacency
  const validToCoins = useMemo(() => {
    if (!fromCoinType || !adjacencyMap[fromCoinType]) return [];
    const neighbors = adjacencyMap[fromCoinType];
    // neighbors is an array of coin types that share a pool
    return neighbors
      .map((type) => coinList.find((c) => c.type === type))
      .filter(Boolean);
  }, [fromCoinType, adjacencyMap, coinList]);

  async function updateEstimation() {
    if (!connected) return;
    try {
      setLoadingRoute(true);
      const coinInAmount = BigInt(
        Math.floor(parseFloat(amount) * 1e9)
      ).toString();
      const payload = {
        coinInType: fromCoinType,
        coinOutType: toCoinType,
        coinInAmount,
      };

      const resp = await fetch("http://localhost:3001/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        console.error("Estimation response not OK:", resp.status);
        setEstimatedOut("0");
        return;
      }

      const route = await resp.json();
      if (!route || !route.coinOutAmount) {
        setEstimatedOut("0");
      } else {
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
      const coinInAmount = BigInt(
        Math.floor(parseFloat(amount) * 1e9)
      ).toString();
      const routePayload = {
        coinInType: fromCoinType,
        coinOutType: toCoinType,
        coinInAmount,
      };

      const routeResp = await fetch("http://localhost:3001/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routePayload),
      });

      if (!routeResp.ok) {
        alert("Failed to get trade route.");
        return;
      }
      const route = await routeResp.json();
      if (!route) {
        return alert("No route found for this pair.");
      }

      const txPayload = {
        walletAddress: account.address,
        completeRoute: route,
        slippage: 0.005,
      };

      const txResp = await fetch("http://localhost:3001/api/swap/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txPayload),
      });

      if (!txResp.ok) {
        alert("Failed to get transaction block.");
        return;
      }
      const txBlock = await txResp.json();

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

      {/* FROM Coin */}
      <div style={{ marginBottom: "0.5rem" }}>
        <label>From Coin Type: </label>
        <select
          value={fromCoinType}
          onChange={(e) => {
            setFromCoinType(e.target.value);
            setToCoinType(""); // reset if from changed
          }}
          style={{ width: "30rem" }}
        >
          <option value="">-- Select a coin --</option>
          {coinList.map((coin) => (
            <option key={coin.type} value={coin.type}>
              {coin.name} ({coin.type})
            </option>
          ))}
        </select>
      </div>

      {/* TO Coin */}
      <div style={{ marginBottom: "0.5rem" }}>
        <label>To Coin Type: </label>
        <select
          value={toCoinType}
          onChange={(e) => setToCoinType(e.target.value)}
          style={{ width: "30rem" }}
        >
          <option value="">-- Select a coin --</option>
          {validToCoins.map((coin: any) => (
            <option key={coin.type} value={coin.type}>
              {coin.name} ({coin.type})
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
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

      {/* Estimate Out */}
      <div style={{ marginBottom: "0.5rem" }}>
        <button
          onClick={updateEstimation}
          disabled={loadingRoute || !fromCoinType || !toCoinType}
        >
          {loadingRoute ? "Fetching Route..." : "Estimate Out"}
        </button>
        {"   "}
        Estimated Out: {estimatedOut}
      </div>

      {/* Execute Swap */}
      <button
        onClick={handleSwap}
        disabled={!connected || !fromCoinType || !toCoinType}
      >
        Execute Swap
      </button>
    </div>
  );
}
