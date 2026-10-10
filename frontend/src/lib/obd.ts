/**
 * OBD-II over an ELM327 adapter, straight from the browser.
 * USB/serial adapters use Web Serial, Bluetooth LE adapters use Web Bluetooth (Chrome or Edge).
 *
 * Only standard SAE J1979 requests are made. Pack voltage, cell voltages and state of health
 * on most EVs sit behind manufacturer-specific requests that differ per vehicle, so they are
 * not read here and are never guessed.
 */
import type { Dtc, MeasurementKey } from "./battery";

export type Transport = {
  write: (s: string) => Promise<void>;
  close: () => Promise<void>;
  onData: (s: string) => void;
  /** Called when the link drops without close() being asked for. */
  onLost?: () => void;
};

/* --------------------------------- transports --------------------------------- */

export const serialSupported = () => typeof navigator !== "undefined" && "serial" in navigator;
export const bluetoothSupported = () => typeof navigator !== "undefined" && "bluetooth" in navigator;

export async function openSerial(): Promise<Transport> {
  const nav = navigator as any;
  const port = await nav.serial.requestPort();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const t: Transport = { onData: () => {}, write: async () => {}, close: async () => {} };
  let baud = 0;
  for (const rate of [38400, 115200, 9600]) {
    try {
      await port.open({ baudRate: rate });
    } catch (e) {
      throw new Error("The serial port could not be opened. Is another program using it?");
    }
    const writer = port.writable.getWriter();
    const reader = port.readable.getReader();
    let alive = true;
    let probe = "";
    t.write = (s) => writer.write(enc.encode(s));
    t.close = async () => {
      alive = false;
      await reader.cancel().catch(() => {});
      reader.releaseLock();
      writer.releaseLock();
      await port.close().catch(() => {});
    };
    void (async () => {
      try {
        while (alive) {
          const { value, done } = await reader.read();
          if (done) break;
          const s = dec.decode(value);
          probe += s;
          t.onData(s);
        }
      } catch {
        /* cancelled or unplugged */
      }
      if (alive) t.onLost?.();
    })();
    await t.write("ATZ\r");
    await new Promise((r) => setTimeout(r, 1800));
    if (/ELM|>|OK/i.test(probe)) {
      baud = rate;
      break;
    }
    await t.close();
  }
  if (!baud) throw new Error("No ELM327 adapter answered on this port.");
  return t;
}

export async function openBluetooth(): Promise<Transport> {
  const nav = navigator as any;
  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [0xfff0, 0xffe0, 0x18f0, "e7810a71-73ae-499d-8c15-faa9aef0c3f2", "0000fff0-0000-1000-8000-00805f9b34fb"],
  });
  const server = await device.gatt.connect();
  let notify: any, write: any;
  for (const svc of await server.getPrimaryServices()) {
    for (const ch of await svc.getCharacteristics()) {
      if (!notify && ch.properties.notify) notify = ch;
      if (!write && (ch.properties.write || ch.properties.writeWithoutResponse)) write = ch;
    }
  }
  if (!notify || !write) throw new Error("This Bluetooth device does not look like an ELM327 adapter.");
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let closing = false;
  const t: Transport = {
    onData: () => {},
    write: async (s) => {
      const bytes = enc.encode(s);
      for (let i = 0; i < bytes.length; i += 20) {
        const part = bytes.slice(i, i + 20);
        if (write.properties.writeWithoutResponse) await write.writeValueWithoutResponse(part);
        else await write.writeValue(part);
      }
    },
    close: async () => {
      closing = true;
      device.gatt.disconnect();
    },
  };
  await notify.startNotifications();
  notify.addEventListener("characteristicvaluechanged", (e: any) => t.onData(dec.decode(e.target.value)));
  device.addEventListener("gattserverdisconnected", () => !closing && t.onLost?.());
  return t;
}

/* ----------------------------------- ELM327 ----------------------------------- */

export class Elm {
  private buf = "";
  private wake: (() => void) | null = null;
  constructor(private t: Transport) {
    t.onData = (s) => {
      this.buf += s;
      if (this.buf.includes(">")) this.wake?.();
    };
  }

  /** Send one command and return its answer as non-empty lines (echo and prompt removed). */
  async send(cmd: string, timeout = 6000): Promise<string[]> {
    this.buf = "";
    await this.t.write(cmd + "\r");
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => ((this.wake = null), reject(new Error("The adapter stopped answering."))), timeout);
      this.wake = () => (clearTimeout(timer), (this.wake = null), resolve());
      if (this.buf.includes(">")) this.wake();
    });
    return this.buf
      .replace(/>/g, "")
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter((l) => l && l.toUpperCase() !== cmd.toUpperCase());
  }

  async init(): Promise<void> {
    for (const c of ["ATZ", "ATE0", "ATL0", "ATS1", "ATH0", "ATSP0"]) await this.send(c, 8000);
  }

  /** Data bytes of every answer line (hex only, multi-frame counters removed). */
  static frames(lines: string[]): number[][] {
    const out: number[][] = [];
    for (const raw of lines) {
      const l = raw.replace(/^\d+:\s*/, "").trim();
      if (!/^[0-9A-F]{2}( [0-9A-F]{2})*$/i.test(l)) continue;
      out.push(l.split(" ").map((h) => parseInt(h, 16)));
    }
    return out;
  }

  async protocolIsCan(): Promise<boolean> {
    const l = (await this.send("ATDPN")).join("").replace(/^A/i, "");
    return /^[6-9A-C]/i.test(l);
  }
}

/* ------------------------------- standard requests ------------------------------- */

export interface PidDef {
  label: string;
  unit: string;
  key?: MeasurementKey;
  decode: (b: number[]) => number;
}

/** Mode 01 PIDs decoded here. Formulas are from SAE J1979. */
export const PIDS: Record<number, PidDef> = {
  0x04: { label: "Calculated engine load", unit: "%", decode: (b) => (b[0] * 100) / 255 },
  0x05: { label: "Coolant temperature", unit: "°C", decode: (b) => b[0] - 40 },
  0x0b: { label: "Intake manifold pressure", unit: "kPa", decode: (b) => b[0] },
  0x0c: { label: "Engine speed", unit: "rpm", decode: (b) => (b[0] * 256 + b[1]) / 4 },
  0x0d: { label: "Vehicle speed", unit: "km/h", decode: (b) => b[0] },
  0x0f: { label: "Intake air temperature", unit: "°C", decode: (b) => b[0] - 40 },
  0x11: { label: "Throttle position", unit: "%", decode: (b) => (b[0] * 100) / 255 },
  0x1f: { label: "Run time since engine start", unit: "s", decode: (b) => b[0] * 256 + b[1] },
  0x21: { label: "Distance with fault lamp on", unit: "km", decode: (b) => b[0] * 256 + b[1] },
  0x31: { label: "Distance since codes cleared", unit: "km", decode: (b) => b[0] * 256 + b[1] },
  0x42: { label: "Control module voltage (12 V system)", unit: "V", decode: (b) => (b[0] * 256 + b[1]) / 1000 },
  0x46: { label: "Ambient air temperature", unit: "°C", decode: (b) => b[0] - 40 },
  0x5b: { label: "State of charge (hybrid/EV battery pack)", unit: "%", key: "soc", decode: (b) => (b[0] * 100) / 255 },
  0x5c: { label: "Engine oil temperature", unit: "°C", decode: (b) => b[0] - 40 },
};

/** PIDs the vehicle says it supports, from the 00/20/40... bitmask requests. */
export async function supportedPids(elm: Elm): Promise<Set<number>> {
  const found = new Set<number>();
  for (let base = 0x00; base <= 0xc0; base += 0x20) {
    const frames = Elm.frames(await elm.send(`01${base.toString(16).padStart(2, "0").toUpperCase()}`));
    const f = frames.find((x) => x[0] === 0x41 && x[1] === base && x.length >= 6);
    if (!f) break;
    let more = false;
    for (let i = 0; i < 32; i++) {
      const byte = f[2 + (i >> 3)];
      if (byte & (0x80 >> (i & 7))) {
        const pid = base + i + 1;
        if (pid === base + 0x20) more = true;
        else found.add(pid);
      }
    }
    if (!more) break;
  }
  return found;
}

export async function readPid(elm: Elm, pid: number): Promise<number | null> {
  const hex = pid.toString(16).padStart(2, "0").toUpperCase();
  const f = Elm.frames(await elm.send(`01${hex}`)).find((x) => x[0] === 0x41 && x[1] === pid);
  const def = PIDS[pid];
  return f && def ? def.decode(f.slice(2)) : null;
}

const DTC_PREFIX = ["P0", "P1", "P2", "P3", "C0", "C1", "C2", "C3", "B0", "B1", "B2", "B3", "U0", "U1", "U2", "U3"];

/** Stored (03), pending (07) and permanent (0A) trouble codes. */
export async function readDtcs(elm: Elm, can: boolean): Promise<Dtc[]> {
  const kinds: [string, number, string][] = [["03", 0x43, "Stored"], ["07", 0x47, "Pending"], ["0A", 0x4a, "Permanent"]];
  const out = new Map<string, Dtc>();
  for (const [mode, resp, label] of kinds) {
    let lines: string[];
    try {
      lines = await elm.send(mode);
    } catch {
      continue;
    }
    for (const f of Elm.frames(lines)) {
      if (f[0] !== resp) continue;
      const data = f.slice(can ? 2 : 1);
      for (let i = 0; i + 1 < data.length; i += 2) {
        const [a, b] = [data[i], data[i + 1]];
        if (!a && !b) continue;
        const code = DTC_PREFIX[a >> 4] + (a & 0x0f).toString(16).toUpperCase() + b.toString(16).padStart(2, "0").toUpperCase();
        if (!out.has(code)) out.set(code, { code, description: `${label} code read from the vehicle. Look it up in the service documentation.`, sourceName: "Live OBD-II" });
      }
    }
  }
  return [...out.values()];
}

export async function readVin(elm: Elm): Promise<string | null> {
  try {
    const bytes = Elm.frames(await elm.send("0902")).flatMap((f) => (f[0] === 0x49 && f[1] === 0x02 ? f.slice(3) : f[0] === 0x49 ? [] : f));
    const vin = bytes.filter((c) => c >= 0x30 && c <= 0x5a).map((c) => String.fromCharCode(c)).join("");
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.slice(-17)) ? vin.slice(-17) : null;
  } catch {
    return null;
  }
}
