import { useEffect } from "react";
import { Workspace } from "../components/diagnose/Workspace";

export function AgentPage() {
  useEffect(() => {
    document.getElementById("symptoms")?.focus({ preventScroll: true });
  }, []);
  return (
    <main id="main">
      <Workspace />
    </main>
  );
}
