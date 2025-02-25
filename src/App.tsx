import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Header from "./components/Header";
import Swap from "./pages/Swap";
import Pools from "./pages/Pools";
import Farms from "./pages/Farms";
import { aftermathInit } from "./config/aftermath";

function App() {
  const [sdkReady, setSdkReady] = useState(false);

  // Initialize the Aftermath SDK once on app load
  useEffect(() => {
    aftermathInit()
      .then(() => {
        setSdkReady(true);
      })
      .catch((err) => {
        console.error("Failed to init Aftermath SDK:", err);
      });
  }, []);

  if (!sdkReady) {
    return <div>Initializing Cerebra Network...</div>;
  }

  return (
    <BrowserRouter>
      <Header />
      <nav style={{ margin: "1rem" }}>
        <NavLink to="/swap" style={{ marginRight: "1rem" }}>
          Swap
        </NavLink>
        <NavLink to="/pools" style={{ marginRight: "1rem" }}>
          Pools
        </NavLink>
        <NavLink to="/farms" style={{ marginRight: "1rem" }}>
          Farms
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Swap />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/pools" element={<Pools />} />
        <Route path="/farms" element={<Farms />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
