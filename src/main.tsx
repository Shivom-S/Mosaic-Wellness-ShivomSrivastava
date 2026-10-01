import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces/soft.css";
import "@fontsource-variable/fraunces/soft-italic.css";
import "@fontsource-variable/figtree";
import "./index.css";
import App from "./App.tsx";
import { initTheme } from "./lib/theme";

initTheme(); // before first paint, so there's no flash of the wrong theme

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
