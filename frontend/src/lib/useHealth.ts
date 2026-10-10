import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Health } from "./api";

export type HealthState =
  | { kind: "loading" }
  | { kind: "offline"; message: string }
  | { kind: "online"; health: Health };

/** Polls the diagnostic service health endpoint (every 30 s, and on demand). */
export function useHealth() {
  const [state, setState] = useState<HealthState>({ kind: "loading" });

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const health = await api.health(signal);
      setState({ kind: "online", health });
    } catch (err) {
      if (signal?.aborted) return;
      setState({ kind: "offline", message: err instanceof ApiError ? err.message : "Unavailable" });
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void refresh(ctrl.signal);
    const id = window.setInterval(() => void refresh(), 30_000);
    return () => {
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [refresh]);

  return { state, refresh: () => refresh() };
}
