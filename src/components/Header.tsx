import React from "react";
import ConnectWalletButton from "./ConnectWalletButton";

export default function Header() {
  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <h2>Cerebra Network</h2>
      <ConnectWalletButton />
    </header>
  );
}
