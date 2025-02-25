import { useEffect, useState } from "react";
import { getPrices } from "../config/aftermath";

/**
 * Example custom hook to fetch real-time prices for given token types.
 * Polls every 10 seconds by default. Adjust as needed.
 */
export function usePrices(coins: string[], pollIntervalMs = 10000) {
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchPrices() {
      if (!coins.length) return;
      try {
        const prices = getPrices();
        const data = await prices.getCoinsToPrice({ coins });
        if (isMounted && data) {
          setPriceMap(data);
        }
      } catch (err) {
        console.error("Failed to fetch prices:", err);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, pollIntervalMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [coins, pollIntervalMs]);

  return priceMap;
}
