import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

export const SKETCHFAB_MODEL = { uid: "e9124f4f5af241ffb2ff8c276a799768", title: "2020 Tesla Roadster 3 Motor Chassis", author: "dragosburian" };
const API_SRC = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";

declare global {
  interface Window {
    Sketchfab?: new (iframe: HTMLIFrameElement) => { init: (uid: string, opts: Record<string, unknown>) => void };
  }
}

export interface SketchfabHandle {
  /** Current camera view as a JPEG, or null while the model is still loading. */
  capture: () => Promise<Blob | null>;
  /** Dolly the camera so the whole model fills most of the frame. */
  fit: () => Promise<void>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const shot = (a: any, w: number, h: number) =>
  new Promise<string | null>((resolve) => a.getScreenShot(w, h, "image/jpeg", (err: unknown, url: string) => resolve(err || !url ? null : url)));

/** Fraction of the frame the model spans, found by comparing pixels with the flat background. */
async function coverage(dataUrl: string): Promise<number> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const W = 320;
  const H = Math.round((W * img.height) / img.width);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H).data;
  const bg = [d[0], d[1], d[2]];
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  if (x1 < 0) return 1;
  return Math.max((x1 - x0) / W, (y1 - y0) / H);
}

let apiLoad: Promise<void> | null = null;
const loadApi = () =>
  (apiLoad ??= new Promise<void>((resolve, reject) => {
    if (window.Sketchfab) return resolve();
    const s = document.createElement("script");
    s.src = API_SRC;
    s.onload = () => resolve();
    s.onerror = () => ((apiLoad = null), reject(new Error("The 3D viewer could not be loaded.")));
    document.head.appendChild(s);
  }));

export function SketchfabView({ handle, onReady, onMoving }: { handle: Ref<SketchfabHandle>; onReady?: (ready: boolean) => void; onMoving?: (moving: boolean) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const api = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useImperativeHandle(handle, () => ({
    capture: () =>
      new Promise<Blob | null>((resolve) => {
        const a = api.current;
        if (!a) return resolve(null);
        shot(a, 1024, 640).then((url) => (url ? fetch(url).then((r) => r.blob()).then(resolve, () => resolve(null)) : resolve(null)));
      }),
    fit: async () => {
      const a = api.current;
      if (!a) return;
      for (let n = 0; n < 3; n++) {
        const url = await shot(a, 640, 400);
        if (!url) return;
        const f = await coverage(url);
        if (f >= 0.62) return;
        const cam = await new Promise<{ position: number[]; target: number[] } | null>((res) => a.getCameraLookAt((err: unknown, c: any) => res(err ? null : c)));
        if (!cam) return;
        const k = Math.max(f / 0.72, 0.12);
        const eye = cam.position.map((v, i) => cam.target[i] + (v - cam.target[i]) * k);
        a.setCameraLookAt(eye, cam.target, 0.5);
        await sleep(800);
      }
    },
  }));

  useEffect(() => {
    let dead = false;
    loadApi()
      .then(() => {
        if (dead || !frame.current || !window.Sketchfab) return;
        new window.Sketchfab(frame.current).init(SKETCHFAB_MODEL.uid, {
          autostart: 1,
          ui_infos: 0,
          ui_watermark: 0,
          ui_hint: 0,
          success: (a: any) => {
            a.start();
            a.addEventListener("viewerready", () => {
              if (dead) return;
              api.current = a;
              a.addEventListener("camerastart", () => onMoving?.(true));
              a.addEventListener("camerastop", () => onMoving?.(false));
              setStatus("ready");
              onReady?.(true);
            });
          },
          error: () => !dead && setStatus("error"),
        });
      })
      .catch(() => !dead && setStatus("error"));
    return () => {
      dead = true;
      api.current = null;
      onReady?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-black">
      <iframe ref={frame} title={SKETCHFAB_MODEL.title} allow="autoplay; fullscreen; xr-spatial-tracking" className="absolute inset-0 size-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-ink-900/80 text-sm text-fog-300" role="status">
          {status === "error" ? "The 3D model could not be loaded. Upload a photo instead." : "Loading 3D model…"}
        </div>
      )}
    </div>
  );
}
