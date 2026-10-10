import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";
import type { BatteryDataset } from "./battery";
import { fetchImportedDataset, storedCaseId } from "./batteryApi";
import { demoDataset } from "../data/demoBattery";
import { useLiveVehicle, type LiveKind } from "./useLiveVehicle";

export type BatteryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  /** No case yet, or the case has no readings or codes. */
  | { status: "empty"; reason: "no_case" | "no_readings" }
  | { status: "ready"; dataset: BatteryDataset };

/**
 * Loads battery data for the current diagnosis case. Simulated demo data is only shown
 * when the user asks for it, never as a fallback for missing or failed real data.
 */
export function useBattery() {
  const [mode, setMode] = useState<"imported" | "demo" | "live">("imported");
  const live = useLiveVehicle();
  const previous = useRef<"imported" | "demo">("imported");
  const [state, setState] = useState<BatteryState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  const load = useCallback(async (quiet = false) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    if (quiet) setRefreshing(true);
    else setState({ status: "loading" });
    try {
      const caseId = storedCaseId();
      const dataset = caseId ? await fetchImportedDataset(caseId, c.signal) : null;
      if (c.signal.aborted) return;
      if (!dataset) setState({ status: "empty", reason: "no_case" });
      else if (dataset.readings.length === 0 && dataset.dtcs.length === 0) setState({ status: "empty", reason: "no_readings" });
      else setState({ status: "ready", dataset });
    } catch (err) {
      if (c.signal.aborted) return;
      setState({ status: "error", message: err instanceof ApiError ? err.message : "The battery data could not be loaded." });
    } finally {
      if (!c.signal.aborted) setRefreshing(false);
    }
  }, []);

  // Live vehicle data replaces the case data while an adapter is connected.
  useEffect(() => {
    if (mode !== "live") return;
    if (live.dataset) setState({ status: "ready", dataset: live.dataset });
    else if (live.status === "error") setState({ status: "error", message: live.message });
    else setState({ status: "loading" });
  }, [mode, live.dataset, live.status, live.message]);

  useEffect(() => {
    if (mode === "live") return;
    if (mode === "imported") void load();
    else {
      ctrl.current?.abort();
      setState({ status: "ready", dataset: demoDataset() });
    }
    return () => ctrl.current?.abort();
  }, [mode, load]);

  return {
    state,
    mode,
    refreshing,
    showDemo: () => setMode("demo"),
    showImported: () => {
      void live.disconnect();
      setMode("imported");
    },
    live: { status: live.status, message: live.message },
    /** Connect an OBD-II adapter and show the vehicle's own readings. */
    connectVehicle: async (kind: LiveKind) => {
      if (mode !== "live") previous.current = mode;
      setMode("live");
      const picked = await live.connect(kind);
      if (!picked) setMode(previous.current);
    },
    disconnectVehicle: async () => {
      await live.disconnect();
      setMode(previous.current);
    },
    /** Re-requests the case's readings from the server. Only available for imported data. */
    refresh: mode === "imported" ? () => void load(true) : undefined,
    retry: () => void load(),
  };
}
