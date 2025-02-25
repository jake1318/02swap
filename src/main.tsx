import React from "react";
import ReactDOM from "react-dom/client";
import { WalletProvider } from "@suiet/wallet-kit";
import App from "./App";

// Styles can be imported if you have global CSS, e.g. import './styles.css';

// Render our main App, wrapped with WalletProvider for Sui wallet connectivity.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
