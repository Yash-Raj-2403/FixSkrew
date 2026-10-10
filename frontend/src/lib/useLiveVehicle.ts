import { useCallback, useEffect, useRef, useState } from "react";
import type { BatteryDataset, Dtc, Reading } from "./battery";
import { Elm, PIDS, openBluetooth, openSerial, readDtcs, readPid, readVin, supportedPids, type Transport } from "./obd";

export type LiveStatus = "idle" | "connecting" | "live" | "error";
export type LiveKind = "serial" | "bluetooth";

const MAX_READINGS = 6000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Connects to an ELM327 adapter and polls the vehicle until disconnected. */
export function useLiveVehicle() {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [message, setMessage] = useState("");
  const [dataset, setDataset] = useState<BatteryDataset | null>(null);
  const run = useRef(0);
  const transport = useRef<Transport | null>(null);

  const stop = useCallback(async () => {
    run.current++;
    const t = transport.current;
    transport.current = null;
    await t?.close().catch(() => {});
  }, []);

  useEffect(() => () => void stop(), [stop]);

  const disconnect = useCallback(async () => {
    await stop();
    setStatus("idle");
    setMessage("");
  }, [stop]);

  /** Resolves false when the person closed the device chooser without picking one. */
  const connect = useCallback(
    async (kind: LiveKind): Promise<boolean> => {
      await stop();
      const id = run.current;
      const alive = () => run.current === id;
      setStatus("connecting");
      setMessage("Choose your OBD-II adapter…");
      setDataset(null);
      let t: Transport;
      try {
        t = kind === "serial" ? await openSerial() : await openBluetooth();
      } catch (e) {
        const err = e as Error;
        if (err.name === "NotFoundError" || /no device selected|cancel/i.test(err.message)) {
          setStatus("idle");
          return false;
        }
        setStatus("error");
        setMessage(err.message || "Could not connect to the adapter.");
        return true;
      }
      if (!alive()) return (await t.close(), true);
      transport.current = t;
      t.onLost = () => alive() && (setStatus("error"), setMessage("The adapter disconnected."));

      try {
        const elm = new Elm(t);
        setMessage("Starting the adapter…");
        await elm.init();
        setMessage("Contacting the vehicle (ignition on, or the car awake)…");
        const first = await elm.send("0100", 15000);
        if (first.some((l) => /UNABLE|ERROR|BUS|NO DATA/i.test(l)) && !Elm.frames(first).length) {
          throw new Error("The vehicle did not answer. Turn the ignition on (or wake the car) and try again.");
        }
        const can = await elm.protocolIsCan();
        const supported = [...(await supportedPids(elm))].filter((p) => PIDS[p]);
        const vin = await readVin(elm);
        let dtcs: Dtc[] = await readDtcs(elm, can);
        let readings: Reading[] = [];
        let lastDtc = Date.now();
        setStatus("live");
        setMessage("");

        while (alive()) {
          const stamp = new Date().toISOString();
          for (const pid of supported) {
            if (!alive()) return true;
            const v = await readPid(elm, pid);
            if (v === null) continue;
            const d = PIDS[pid];
            readings.push({ key: d.key ?? "other", label: d.label, value: Math.round(v * 1000) / 1000, unit: d.unit, timestamp: stamp, groupId: stamp, sourceName: "Live OBD-II" });
          }
          if (Date.now() - lastDtc > 30_000) {
            dtcs = await readDtcs(elm, can);
            lastDtc = Date.now();
          }
          if (readings.length > MAX_READINGS) readings = readings.slice(-MAX_READINGS);
          setDataset({
            source: "live",
            sourceLabel: "Live from vehicle",
            sourceDetail: `Read over OBD-II from the connected vehicle (${supported.length} standard readings supported). Pack voltage, cell voltages and state of health on most EVs use manufacturer-specific requests that are not read here, so they show as not reported.`,
            vehicle: { label: vin ? `Connected vehicle · VIN ${vin}` : "Connected vehicle", known: Boolean(vin) },
            readings: [...readings],
            dtcs,
            fetchedAt: stamp,
          });
          await sleep(500);
        }
      } catch (e) {
        if (alive()) {
          setStatus("error");
          setMessage((e as Error).message || "Reading the vehicle failed.");
          await stop();
        }
      }
      return true;
    },
    [stop],
  );

  return { status, message, dataset, connect, disconnect };
}
