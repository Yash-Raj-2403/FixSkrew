import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  // No StrictMode: its dev-only double mount tears down drei <Html> roots mid-render.
  <App />,
);
