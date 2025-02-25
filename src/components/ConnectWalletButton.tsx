import React from "react";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";

export default function ConnectWalletButton() {
  const { connected, account } = useWallet();

  return (
    <div style={{ float: "right" }}>
      <ConnectButton />
      {connected && account?.address && (
        <span style={{ marginLeft: "1rem" }}>
          Connected: {account.address.slice(0, 6)}...
          {account.address.slice(-4)}
        </span>
      )}
    </div>
  );
}
