import React, { useEffect, useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { getFarms } from "../config/aftermath";

export default function Farms() {
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();
  const [loading, setLoading] = useState(false);
  const [farmList, setFarmList] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState("0");

  // For demonstration, we fetch all staking pools
  useEffect(() => {
    loadFarms();
  }, []);

  async function loadFarms() {
    try {
      setLoading(true);
      const farms = getFarms();
      const allFarms = await farms.getAllStakingPools();
      setFarmList(allFarms);
    } catch (err) {
      console.error("Failed to load farms:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStake() {
    if (!connected || !account) return alert("Connect wallet first.");
    if (!selectedFarmId) return alert("Select a farm first.");

    try {
      const farms = getFarms();
      // each farm in the farmList might have a 'id' or unique 'stakingPoolObjectId'
      const chosenFarm = farmList.find((f) => f.id === selectedFarmId);
      if (!chosenFarm) return alert("Farm not found in list.");

      // We can use the farm object directly, or wrap it in an instance:
      // The Aftermath SDK might offer something like new FarmsStakingPool(chosenFarm)
      // But if getAllStakingPools() already returns the correct object, we can do:
      const stakeTx = await farms.getStakeTransaction({
        stakingPoolId: chosenFarm.id,
        walletAddress: account.address,
        stakeAmount: BigInt(Math.floor(parseFloat(stakeAmount) * 1e9)),
        lockDurationMs: 0, // or a chosen lock period for boosted rewards
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: stakeTx,
      });
      console.log("Stake success:", result);
      alert("Staked successfully!");
    } catch (err) {
      console.error("Stake failed:", err);
      alert("Stake failed. Check console.");
    }
  }

  const [unstakeAmount, setUnstakeAmount] = useState("0");

  async function handleUnstake() {
    if (!connected || !account) return alert("Connect wallet first.");
    if (!selectedFarmId) return alert("Select a farm first.");

    try {
      const farms = getFarms();
      const chosenFarm = farmList.find((f) => f.id === selectedFarmId);
      if (!chosenFarm) return alert("Farm not found.");

      // Typically we would find the user's staked position. For demonstration,
      // we'll assume we unstake 'unstakeAmount' from the same farm:
      const unstakeTx = await farms.getUnstakeTransaction({
        stakingPoolId: chosenFarm.id,
        walletAddress: account.address,
        unstakeAmount: BigInt(Math.floor(parseFloat(unstakeAmount) * 1e9)),
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: unstakeTx,
      });
      console.log("Unstake success:", result);
      alert("Unstaked successfully!");
    } catch (err) {
      console.error("Unstake failed:", err);
      alert("Unstake failed. Check console.");
    }
  }

  const [harvestMsg, setHarvestMsg] = useState("");

  async function handleHarvest() {
    if (!connected || !account) return alert("Connect wallet first.");
    if (!selectedFarmId) return alert("Select a farm first.");

    try {
      const farms = getFarms();
      const chosenFarm = farmList.find((f) => f.id === selectedFarmId);
      if (!chosenFarm) return alert("Farm not found.");

      // The Aftermath SDK may require a position reference or handle all user positions at once:
      const harvestTx = await farms.getHarvestRewardsTransaction({
        stakingPoolId: chosenFarm.id,
        walletAddress: account.address,
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: harvestTx,
      });
      console.log("Harvest success:", result);
      setHarvestMsg("Harvested rewards successfully!");
    } catch (err) {
      console.error("Harvest failed:", err);
      setHarvestMsg("Harvest failed. Check console.");
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Farms</h3>
      {loading ? (
        <p>Loading Farms...</p>
      ) : (
        <div>
          <p>Total Farms: {farmList.length}</p>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
          >
            <option value="">-- Select a Farm --</option>
            {farmList.map((farm) => (
              <option key={farm.id} value={farm.id}>
                Farm: {farm.id} | Stake: {farm.stakingCoin} | Rewards:{" "}
                {JSON.stringify(farm.rewardCoins)}
              </option>
            ))}
          </select>
        </div>
      )}

      <h4 style={{ marginTop: "1rem" }}>Stake</h4>
      <div>
        <label>Amount to Stake: </label>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          style={{ width: "10rem", margin: "0.5rem" }}
        />
        <button onClick={handleStake} disabled={!selectedFarmId}>
          Stake
        </button>
      </div>

      <h4 style={{ marginTop: "1.5rem" }}>Unstake</h4>
      <div>
        <label>Amount to Unstake: </label>
        <input
          type="number"
          value={unstakeAmount}
          onChange={(e) => setUnstakeAmount(e.target.value)}
          style={{ width: "10rem", margin: "0.5rem" }}
        />
        <button onClick={handleUnstake} disabled={!selectedFarmId}>
          Unstake
        </button>
      </div>

      <h4 style={{ marginTop: "1.5rem" }}>Harvest Rewards</h4>
      <div>
        <button onClick={handleHarvest} disabled={!selectedFarmId}>
          Harvest
        </button>
        <p>{harvestMsg}</p>
      </div>
    </div>
  );
}
