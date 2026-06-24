import React from "react";
import { createRoot } from "react-dom/client";
import ColdChainDashboard from "./ColdChainDashboard.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ColdChainDashboard />
  </React.StrictMode>
);
