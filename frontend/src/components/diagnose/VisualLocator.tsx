import { useEffect, useRef, useState, type DragEvent } from "react";
import { api, type RankedPart, type VisualMarker, type VisualResult } from "../../lib/api";
import type { CaseState } from "../../lib/useCase";
import { SketchfabView, SKETCHFAB_MODEL, type SketchfabHandle } from "./SketchfabView";
import { COMPONENT_BY_ID, type ComponentId } from "../../data/components";

const MAX_SIDE = 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/** Draw an image or video frame to a downscaled JPEG. */
function toJpeg(el: HTMLImageElement | HTMLVideoElement): Promise<Blob> {
  const w = el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
  const h = el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  canvas.getContext("2d")!.drawImage(el, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read the image."))), "image/jpeg", 0.88));
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This image could not be opened."));
    img.src = src;
  });

const STYLE = {
  inspect_first: { text: "Inspect first", ring: "#7bb83a", fill: "rgba(123,184,58,0.28)", dash: "none", pill: "bg-[#7bb83a] text-[#0d1a05]" },
  check_second: { text: "Check second", ring: "#a5c96a", fill: "rgba(165,201,106,0.16)", dash: "7 5", pill: "border border-dashed border-[#a5c96a] bg-ink-900/85 text-[#c6e08f]" },
  context: { text: "", ring: "rgba(255,255,255,0.6)", fill: "transparent", dash: "none", pill: "bg-ink-900/80 text-fog-100" },
} as const;

function Marker({ m, i, active, onSelect, rank }: { m: VisualMarker; i: number; active: boolean; onSelect: () => void; rank?: number }) {
  const st = STYLE[m.priority];
  const { xmin, ymin, xmax, ymax } = m.box;
  const labelAbove = ymin > 90 && i % 2 === 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${m.label}${st.text ? `, ${st.text}` : ""}`}
      className="group absolute"
      style={{ left: `${xmin / 10}%`, top: `${ymin / 10}%`, width: `${(xmax - xmin) / 10}%`, height: `${(ymax - ymin) / 10}%` }}
    >
      <span
        className="absolute inset-0 rounded-md transition-all"
        style={{
          border: `${m.priority === "context" ? 1.5 : 3}px ${st.dash === "none" ? "solid" : "dashed"} ${st.ring}`,
          background: st.fill,
          boxShadow: active ? `0 0 0 3px ${st.ring}55, 0 0 24px ${st.ring}88` : undefined,
        }}
      />
      <span
        className={`absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap sm:text-[13px] ${st.pill} ${
          labelAbove ? "-top-1 -translate-y-full" : "top-1"
        }`}
      >
        {rank ? `#${rank} ${m.label}` : st.text ? `${i + 1}. ${m.label} · ${st.text}` : `${i + 1}. ${m.label}`}
      </span>
    </button>
  );
}

export interface LocateRequest {
  components: ComponentId[];
  /** Parts ranked by the evidence behind the latest answer (strongest first). */
  parts: RankedPart[];
  /** Changes whenever the chat finds a new fault; a loaded photo is re-analysed on change. */
  key: string;
}

export function VisualLocator({ state, language, locate }: { state: CaseState; language: string; locate: LocateRequest | null }) {
  const [media, setMedia] = useState<{ kind: "image" | "video"; url: string; name: string } | null>(null);
  const [frame, setFrame] = useState<{ blob: Blob; url: string } | null>(null);
  const [result, setResult] = useState<VisualResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const ctrl = useRef<AbortController | null>(null);
  const viewer = useRef<SketchfabHandle>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [moving, setMoving] = useState(false);
  // Markers are drawn in image coordinates, so they are wrong as soon as the camera has moved.
  const [stale, setStale] = useState(false);
  const analysedOnce = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fitted = useRef(false);

  useEffect(
    () => () => {
      ctrl.current?.abort();
    },
    [],
  );
  // Free object URLs when they are replaced.
  useEffect(() => () => void (media && URL.revokeObjectURL(media.url)), [media]);
  useEffect(() => () => void (frame && URL.revokeObjectURL(frame.url)), [frame]);

  const reset = () => {
    setResult(null);
    setError("");
    setActive(null);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    reset();
    setFrame(null);
    if (file.type.startsWith("video/")) {
      if (file.size > MAX_VIDEO_BYTES) return setError("Video is over 200 MB. Trim it or pick a frame as an image.");
      setMedia({ kind: "video", url: URL.createObjectURL(file), name: file.name });
    } else if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setMedia({ kind: "image", url, name: file.name });
      try {
        setFrame({ blob: await toJpeg(await loadImage(url)), url });
      } catch (e) {
        setError(e instanceof Error ? e.message : "This image could not be opened.");
      }
    } else setError("Choose an image (JPEG, PNG, WebP) or a video.");
  };

  const grabFrame = async () => {
    const v = video.current;
    if (!v || !v.videoWidth) return setError("The video is not ready yet.");
    reset();
    try {
      const blob = await toJpeg(v);
      setFrame({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not capture the frame.");
    }
  };

  /** Analyse the live 3D view in place, so markers stay on the model the user is rotating. */
  const analyseModel = async () => {
    const blob = await viewer.current?.capture();
    if (!blob) return setError("Could not capture the 3D view yet. Try again in a moment.");
    await analyse(blob);
  };

  // Rotating hides the markers; once the camera settles a view that was already analysed is analysed again.
  const onMoving = (m: boolean) => {
    setMoving(m);
    clearTimeout(settle.current);
    if (m) {
      if (analysedOnce.current) setStale(true);
      ctrl.current?.abort();
      setBusy(false);
      // Safety net: if the viewer never reports that the camera stopped, treat the view as settled.
      settle.current = setTimeout(() => onMoving(false), 3500);
    } else if (analysedOnce.current) {
      // Longer settle delay and only after a first manual or chat-driven analysis, to limit paid image calls.
      settle.current = setTimeout(() => void analyseRef.current(), 2000);
    }
  };
  useEffect(() => () => clearTimeout(settle.current), []);

  // Once the model is ready, frame the whole vehicle and run a first analysis.
  useEffect(() => {
    if (!viewerReady || fitted.current) return;
    fitted.current = true;
    void viewer.current?.fit().then(() => (locate?.components.length ? analyseRef.current() : undefined));
  }, [viewerReady]);

  const analyse = async (override?: Blob) => {
    const image = override ?? frame?.blob;
    if (!image) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setBusy(true);
    setStale(false);
    reset();
    analysedOnce.current = true;
    try {
      const id = await state.ensureCase();
      setResult(await api.analyseVisual(id, image, language, locate?.components ?? [], (locate?.parts ?? []).map((p) => ({ id: p.id, rank: p.rank })), c.signal));
    } catch (e) {
      if (!c.signal.aborted) setError(e instanceof Error ? e.message : "The image could not be analysed.");
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  };

  // Follow the chat: re-analyse the loaded photo when a new answer flags components.
  const seenKey = useRef(locate?.key);
  const analyseRef = useRef(async () => {});
  analyseRef.current = async () => (frame ? analyse() : analyseModel());
  useEffect(() => {
    if (!locate || locate.key === seenKey.current) return;
    seenKey.current = locate.key;
    if (!busy && (frame || (!media && viewerReady))) void analyseRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locate?.key]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void pick(e.dataTransfer.files[0]);
  };

  const hasEvidence = state.messages.length > 0 || state.data?.documents.some((d) => d.status === "ready");
  const markers = result?.markers ?? [];
  const rankById = new Map((locate?.parts ?? []).map((p) => [p.id, p.rank]));
  // A marked container takes the best rank of the hidden parts inside it.
  for (const [partId, container] of Object.entries(result?.inside_parts ?? {})) {
    const r = rankById.get(partId);
    if (r) rankById.set(container, Math.min(rankById.get(container) ?? r, r));
  }
  const showVideo = media?.kind === "video" && !frame;

  return (
    <div className="space-y-5 p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-[13px] leading-relaxed text-fog-400">
          Use the built-in 3D model, or add a photo, render or video frame of the vehicle. FixSkrew marks what to <span className="text-[#9fd05a]">inspect first</span> and{" "}
          <span className="text-[#c6e08f]">check second</span>, based on your case evidence.
        </p>
        {media && (
          <button type="button" onClick={() => (setMedia(null), setFrame(null), reset())} className="shrink-0 text-xs text-fog-500 hover:text-fog-100">
            Choose another
          </button>
        )}
      </div>

      {locate && locate.parts.length > 0 && (
        <section aria-label="Ranked parts" className="rounded-xl border border-volt-400/25 bg-volt-400/[0.04] p-4">
          <h3 className="eyebrow mb-3 text-[10px]!">Most likely parts, ranked by evidence</h3>
          <ol className="space-y-3">
            {locate.parts.map((p) => {
              const missing = result?.missing_parts?.includes(p.id);
              const shown = result?.markers.some((m) => m.part_id === p.id);
              return (
                <li key={p.id} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-volt-400/15 font-mono text-[11px] text-volt-300">{p.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-fog-100">
                      {p.name}
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full bg-volt-400" style={{ width: `${Math.round(p.score * 100)}%` }} />
                      </span>
                      <span className="font-mono text-[11px] text-fog-500">{Math.round(p.score * 100)}%</span>
                      {shown && <span className="text-[11px] text-[#9fd05a]">marked in view</span>}
                      {result?.inside_parts?.[p.id] && <span className="text-[11px] text-[#9fd05a]">sealed inside the pack, so the pack is marked</span>}
                      {missing && <span className="text-[11px] text-amber-hv">not visible in this view, rotate the model</span>}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-fog-400">{p.description}</p>
                    <ul className="mt-1 space-y-0.5">
                      {p.reasons.map((r) => (
                        <li key={r} className="text-[11.5px] text-fog-500">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {locate && locate.components.length > 0 && locate.parts.length === 0 && (
        <p className="rounded-lg border border-volt-400/25 bg-volt-400/[0.06] px-3 py-2 text-[12.5px] text-fog-300">
          From the chat: <span className="text-volt-300">{locate.components.map((id) => COMPONENT_BY_ID[id]?.name ?? id).join(", ")}</span>
          {frame ? "" : ". Add a photo of the vehicle and these parts will be prioritised."}
        </p>
      )}

      {!media && (
        <div className="space-y-3">
          <div className="relative">
            <SketchfabView handle={viewer} onReady={setViewerReady} onMoving={onMoving} />
            {viewerReady && !moving && !stale && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl [&_button]:pointer-events-none">
                {[...markers.entries()]
                  .sort(([, a], [, b]) => (b.priority === "context" ? 1 : 0) - (a.priority === "context" ? 1 : 0))
                  .map(([i, m]) => (
                    <Marker key={i} m={m} i={i} rank={rankById.get(m.part_id ?? "")} active={active === i} onSelect={() => undefined} />
                  ))}
              </div>
            )}
            {viewerReady && (busy || moving || stale) && (
              <span className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-full bg-ink-900/80 px-3 py-1 text-[11px] text-fog-100">
                {busy && <span className="size-3 animate-spin rounded-full border-t-2 border-volt-400 motion-reduce:animate-none" />}
                {moving ? "Rotate freely · markers return when you stop" : busy ? "Locating parts…" : "View changed · re-locating…"}
              </span>
            )}
          </div>
          {error && <p className="rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2 text-[13px] text-red-200">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-fog-500">
              Drag to rotate 360°, scroll to zoom. Reference model: {SKETCHFAB_MODEL.title} by {SKETCHFAB_MODEL.author}.
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" onClick={() => void viewer.current?.fit()} disabled={!viewerReady} className="text-xs text-fog-400 hover:text-fog-100 disabled:opacity-40">
                Fit whole vehicle
              </button>
              <button
                type="button"
                onClick={() => void analyseModel()}
                disabled={!viewerReady || busy}
                className="rounded-full bg-volt-400 px-5 py-2 text-sm font-medium text-ink-900 transition-colors enabled:hover:bg-volt-300 disabled:bg-white/10 disabled:text-fog-500"
              >
                {busy ? "Analysing…" : "Analyse this view"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!media && (
        <div
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`rounded-2xl border border-dashed px-6 py-16 text-center transition-colors ${drag ? "border-volt-400 bg-volt-400/[0.06]" : "border-white/15 hover:border-white/30"}`}
        >
          <svg viewBox="0 0 24 24" className="mx-auto size-9 text-volt-400" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="m21 16-5-5-8 8" />
          </svg>
          <p className="mt-3 text-sm text-fog-100">
            Drop an image or video here or{" "}
            <button type="button" onClick={() => input.current?.click()} className="text-volt-400 underline-offset-4 hover:underline">
              browse
            </button>
          </p>
          <p className="mt-1 text-[11.5px] text-fog-500">JPEG, PNG, WebP · MP4, MOV, WebM · exploded or underbody views work best</p>
          <input ref={input} type="file" accept="image/*,video/*" className="sr-only" tabIndex={-1} onChange={(e) => (void pick(e.target.files?.[0]), (e.target.value = ""))} />
        </div>
      )}

      {showVideo && media && (
        <div className="space-y-3">
          <video ref={video} src={media.url} controls playsInline className="max-h-[520px] w-full rounded-xl border border-white/[0.07] bg-black" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-fog-500">Pause on the frame that shows the area, then use it.</p>
            <button type="button" onClick={grabFrame} className="rounded-full bg-volt-400 px-5 py-2 text-sm font-medium text-ink-900 hover:bg-volt-300">
              Use this frame
            </button>
          </div>
        </div>
      )}

      {frame && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/95">
            <img src={frame.url} alt="Vehicle to localise" className="block w-full" />
            {[...markers.entries()]
              .sort(([, a], [, b]) => (b.priority === "context" ? 1 : 0) - (a.priority === "context" ? 1 : 0))
              .map(([i, m]) => (
                <Marker key={i} m={m} i={i} rank={rankById.get(m.part_id ?? "")} active={active === i} onSelect={() => setActive(i === active ? null : i)} />
              ))}
            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-ink-900/70 backdrop-blur-[2px]" role="status">
                <div className="flex items-center gap-3 text-sm text-fog-100">
                  <span className="size-5 animate-spin rounded-full border-t-2 border-volt-400 motion-reduce:animate-none" />
                  Locating parts…
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void analyse()}
              disabled={busy}
              className="rounded-full bg-volt-400 px-5 py-2 text-sm font-medium text-ink-900 transition-colors enabled:hover:bg-volt-300 disabled:bg-white/10 disabled:text-fog-500"
            >
              {busy ? "Analysing…" : result ? "Analyse again" : "Locate parts"}
            </button>
            {media?.kind === "video" && (
              <button type="button" onClick={() => (setFrame(null), reset())} className="text-xs text-fog-400 hover:text-fog-100">
                Pick another frame
              </button>
            )}
            {!hasEvidence && <span className="text-[12px] text-amber-hv">No case evidence yet: only parts will be labelled, nothing prioritised. Upload a document or chat first for priorities.</span>}
          </div>
        </div>
      )}

      {error && media && <p className="rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2 text-[13px] text-red-200">{error}</p>}

      {result && (
        <div className="space-y-3">
          <p className="text-[13px] text-fog-300">
            {result.view}
            {result.vehicle_seen ? ` · ${result.vehicle_seen}` : ""}
          </p>
          {result.note && <p className="rounded-lg bg-amber-hv/[0.08] px-3 py-2 text-[12.5px] text-amber-hv">{result.note}</p>}
          {markers.length > 0 && (
            <ul className="grid gap-2 md:grid-cols-2">
              {[...markers.entries()]
                .sort(([, a], [, b]) => ["inspect_first", "check_second", "context"].indexOf(a.priority) - ["inspect_first", "check_second", "context"].indexOf(b.priority))
                .map(([i, m]) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setActive(i === active ? null : i)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${active === i ? "border-volt-400/50 bg-volt-400/[0.06]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: STYLE[m.priority].ring }} />
                        <span className="text-[13px] font-medium text-fog-100">{m.label}</span>
                        {STYLE[m.priority].text && <span className="ml-auto text-[10.5px] text-fog-500">{STYLE[m.priority].text}</span>}
                      </span>
                      <span className="mt-1 block text-[12px] leading-relaxed text-fog-400">{m.reason}</span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
          <p className="text-[11px] text-fog-500">Positions are estimated from the image by an AI model. Confirm against service documentation before work on high-voltage parts.</p>
        </div>
      )}
    </div>
  );
}
