import React, { useEffect, useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { getPools } from "../config/aftermath";

/**
 * A minimal Pools page showing a list of pools and providing deposit/withdraw UI.
 */
export default function Pools() {
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();
  const [loading, setLoading] = useState(false);
  const [poolList, setPoolList] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [tokenA, setTokenA] = useState("");
  const [amountA, setAmountA] = useState("0");
  const [tokenB, setTokenB] = useState("");
  const [amountB, setAmountB] = useState("0");

  useEffect(() => {
    loadPools();
  }, []);

  async function loadPools() {
    try {
      setLoading(true);
      const pools = getPools();
      const allPools = await pools.getAllPools();
      setPoolList(allPools);
    } catch (err) {
      console.error("Failed to load pools:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDepositLiquidity() {
    if (!connected || !account) return alert("Connect wallet first.");
    if (!selectedPoolId) return alert("Select a pool first.");

    try {
      const pools = getPools();
      const poolObj = await pools.getPool({ objectId: selectedPoolId });

      const depositTx = await poolObj.getDepositTransaction({
        walletAddress: account.address,
        amountsIn: {
          [tokenA]: BigInt(Math.floor(parseFloat(amountA) * 1e9)),
          [tokenB]: BigInt(Math.floor(parseFloat(amountB) * 1e9)),
        },
        slippage: 0.01, // 1%
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: depositTx,
      });
      console.log("Deposit success:", result);
      alert("Liquidity deposited successfully!");
    } catch (err) {
      console.error("Deposit failed:", err);
      alert("Deposit failed. Check console.");
    }
  }

  // Similarly, we show a quick example for withdrawing a fixed LP amount
  const [lpAmountToWithdraw, setLpAmountToWithdraw] = useState("0");

  async function handleWithdraw() {
    if (!connected || !account) return alert("Connect wallet first.");
    if (!selectedPoolId) return alert("Select a pool first.");

    try {
      const pools = getPools();
      const poolObj = await pools.getPool({ objectId: selectedPoolId });

      const withdrawTx = await poolObj.getWithdrawTransaction({
        walletAddress: account.address,
        lpCoinAmount: BigInt(Math.floor(parseFloat(lpAmountToWithdraw) * 1e9)),
        slippage: 0.01,
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: withdrawTx,
      });
      console.log("Withdraw success:", result);
      alert("Liquidity withdrawn successfully!");
    } catch (err) {
      console.error("Withdraw failed:", err);
      alert("Withdraw failed. Check console.");
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Pools</h3>
      {loading ? (
        <p>Loading pools...</p>
      ) : (
        <div>
          <p>Total Pools Found: {poolList.length}</p>
          <select
            value={selectedPoolId}
            onChange={(e) => setSelectedPoolId(e.target.value)}
          >
            <option value="">-- Select a Pool --</option>
            {poolList.map((p) => (
              <option key={p.id} value={p.id}>
                Pool: {p.id} | Coins: {JSON.stringify(p.coinTypes)}
              </option>
            ))}
          </select>
        </div>
      )}

      <h4 style={{ marginTop: "1rem" }}>Deposit Liquidity</h4>
      <div>
        <label>Coin A Type: </label>
        <input
          type="text"
          value={tokenA}
          onChange={(e) => setTokenA(e.target.value)}
          style={{ width: "25rem", margin: "0.5rem" }}
        />
        <label>Amount A: </label>
        <input
          type="number"
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
          style={{ width: "10rem", margin: "0.5rem" }}
        />
      </div>
      <div>
        <label>Coin B Type: </label>
        <input
          type="text"
          value={tokenB}
          onChange={(e) => setTokenB(e.target.value)}
          style={{ width: "25rem", margin: "0.5rem" }}
        />
        <label>Amount B: </label>
        <input
          type="number"
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
          style={{ width: "10rem", margin: "0.5rem" }}
        />
      </div>
      <button onClick={handleDepositLiquidity} disabled={!selectedPoolId}>
        Deposit Liquidity
      </button>

      <h4 style={{ marginTop: "1.5rem" }}>Withdraw Liquidity</h4>
      <div>
        <label>LP Amount to Withdraw: </label>
        <input
          type="number"
          value={lpAmountToWithdraw}
          onChange={(e) => setLpAmountToWithdraw(e.target.value)}
          style={{ width: "10rem", margin: "0.5rem" }}
        />
      </div>
      <button onClick={handleWithdraw} disabled={!selectedPoolId}>
        Withdraw
      </button>
    </div>
  );
}
