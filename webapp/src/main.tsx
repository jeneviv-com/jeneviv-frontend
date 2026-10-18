import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

/**
 * The dashboard can be mounted at the domain root (default) or under a
 * sub-path such as /app when it shares a domain with the marketing site.
 */
const basename = import.meta.env.VITE_BASE_PATH || "/";

const container = document.getElementById("root");
if (!container) throw new Error("Root container is missing from index.html");

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
