import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true") {
  // lib/mock.ts is a local, gitignored dev-only scratch file (opt-in via
  // USE_MOCK=1 ./dev.sh) — not part of the shipped app. The indirection
  // keeps tsc/rollup from resolving this path when the file is absent.
  const mockModulePath = "./lib/mock";
  import(mockModulePath);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
