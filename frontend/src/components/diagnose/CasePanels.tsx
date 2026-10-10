import { useEffect, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COMPONENT_BY_ID } from "../../data/components";
import type { CaseDocument, Vehicle } from "../../lib/api";
import type { CaseState, PendingUpload } from "../../lib/useCase";
import { showComponentInfo } from "../../lib/router";

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
export const ACCEPT = [".pdf", ".docx", ".md", ".txt", ".log", ".csv", ".json", ".jsonl"];
const MAX_BYTES = 25 * 1024 * 1024;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/* --------------------------------- vehicle --------------------------------- */

interface VehicleForm {
  make: string;
  model: string;
  year: string;
  trim: string;
  batteryVariant: string;
  odometerKm: string;
  vin: string;
}

const toForm = (v: Vehicle = {}): VehicleForm => ({
  make: v.make ?? "",
  model: v.model ?? "",
  year: v.year ? String(v.year) : "",
  trim: v.trim ?? "",
  batteryVariant: v.batteryVariant ?? "",
  odometerKm: v.odometerKm != null ? String(v.odometerKm) : "",
  vin: v.vin ?? "",
});

export function VehicleCard({ state, suggestions }: { state: CaseState; suggestions: { make?: string; model?: string }[] }) {
  const saved = state.data?.vehicle;
  const [form, setForm] = useState<VehicleForm>(() => toForm(saved));
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  // Sync when a case loads or is replaced.
  const caseId = state.data?.id;
  useEffect(() => setForm(toForm(state.data?.vehicle)), [caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(saved));
  const set = (k: keyof VehicleForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setStatus("idle");
  };

  const makes = [...new Set(suggestions.map((s) => s.make).filter(Boolean) as string[])];
  const models = [
    ...new Set(
      suggestions
        .filter((s) => !form.make.trim() || s.make?.toLowerCase() === form.make.trim().toLowerCase())
        .map((s) => s.model)
        .filter(Boolean) as string[],
    ),
  ];

  const save = async () => {
    const e: typeof errors = {};
    if (form.year && (!/^\d{4}$/.test(form.year) || +form.year < 1990 || +form.year > new Date().getFullYear() + 2))
      e.year = "Four-digit model year.";
    if (form.vin && !VIN_RE.test(form.vin.trim().toUpperCase())) e.vin = "17 characters, no I, O or Q.";
    if (form.odometerKm && !(Number(form.odometerKm) >= 0)) e.odometerKm = "Kilometres.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const v: Vehicle = {
      ...(form.make.trim() && { make: form.make.trim() }),
      ...(form.model.trim() && { model: form.model.trim() }),
      ...(form.year && { year: Number(form.year) }),
      ...(form.trim.trim() && { trim: form.trim.trim() }),
      ...(form.batteryVariant.trim() && { batteryVariant: form.batteryVariant.trim() }),
      ...(form.odometerKm && { odometerKm: Number(form.odometerKm) }),
      ...(form.vin.trim() && { vin: form.vin.trim().toUpperCase() }),
    };
    setStatus("saving");
    try {
      await state.saveVehicle(v);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save.");
    }
  };

  const field = (k: keyof VehicleForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] text-fog-400">{label}</span>
      <input className="field py-2!" value={form[k]} onChange={set(k)} aria-invalid={errors[k] ? true : undefined} {...props} />
      {errors[k] && <span className="mt-1 block text-[11px] text-red-300">{errors[k]}</span>}
    </label>
  );

  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="vehicle-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="vehicle-heading" className="eyebrow text-[10px]!">
          Vehicle
        </h2>
        <span className="text-[11px] text-fog-500">Any make or model</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {field("make", "Make", { list: "kb-makes", placeholder: "e.g. Tesla, Kia, BYD", autoComplete: "off" })}
        {field("model", "Model", { list: "kb-models", placeholder: "e.g. Model 3, EV6", autoComplete: "off" })}
        {field("year", "Model year", { inputMode: "numeric", placeholder: "e.g. 2022" })}
        {field("trim", "Trim / drive", { placeholder: "e.g. AWD" })}
        {field("batteryVariant", "Battery variant", { placeholder: "From the pack label" })}
        {field("odometerKm", "Odometer (km)", { inputMode: "numeric" })}
        <div className="col-span-2">{field("vin", "VIN (optional)", { maxLength: 17, className: "field py-2! font-mono uppercase" })}</div>
      </div>
      <datalist id="kb-makes">{makes.map((m) => <option key={m} value={m} />)}</datalist>
      <datalist id="kb-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-snug text-fog-500">
          {status === "saved" ? "Saved. Searches now favour documents for this vehicle." : status === "error" ? message : "Narrows the search to matching and general documents."}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || status === "saving"}
          className="shrink-0 rounded-full border border-volt-400/50 px-4 py-1.5 text-xs text-fog-100 transition-colors enabled:hover:bg-volt-400/10 disabled:border-white/10 disabled:text-fog-500"
        >
          {status === "saving" ? "Saving…" : "Save vehicle"}
        </button>
      </div>
    </section>
  );
}

/* -------------------------------- documents -------------------------------- */

function DocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toUpperCase().slice(0, 4) ?? "DOC";
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-800 font-mono text-[9px] font-medium text-volt-300">
      {ext}
    </span>
  );
}

function PendingItem({ u, onDismiss }: { u: PendingUpload; onDismiss: () => void }) {
  return (
    <li className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex items-center gap-3">
        <DocIcon name={u.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-fog-100">{u.name}</p>
          <p className="text-[11px] text-fog-500">
            {u.stage === "uploading" && `Uploading ${Math.round(u.progress * 100)}% · ${formatBytes(u.size)}`}
            {u.stage === "processing" && "Extracting text, indexing and reading for facts…"}
            {u.stage === "failed" && <span className="text-red-300">{u.error}</span>}
          </p>
        </div>
        {u.stage === "failed" && (
          <button type="button" onClick={onDismiss} className="text-xs text-fog-500 hover:text-fog-100" aria-label={`Dismiss ${u.name}`}>
            ×
          </button>
        )}
      </div>
      {u.stage !== "failed" && (
        <div className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
          {u.stage === "uploading" ? (
            <div className="h-full bg-volt-400 transition-[width]" style={{ width: `${u.progress * 100}%` }} />
          ) : (
            <div className="h-full w-1/3 animate-[loadbar_1.4s_ease-in-out_infinite] bg-volt-400" />
          )}
        </div>
      )}
    </li>
  );
}

function DocumentItem({ d, onRemove }: { d: CaseDocument; onRemove: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const x = d.extraction;
  const codes = x?.dtcs.length ? x.dtcs : d.detectedDtcs.map((code) => ({ code, description: undefined }));

  return (
    <li className={`rounded-xl border p-3 ${d.status === "failed" ? "border-red-400/25 bg-red-400/[0.04]" : "border-white/[0.07] bg-white/[0.02]"}`}>
      <div className="flex items-start gap-3">
        <DocIcon name={d.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-fog-100" title={d.name}>
            {d.name}
          </p>
          <p className="text-[11px] text-fog-500">
            {d.status === "failed" ? (
              <span className="text-red-300">{d.error}</span>
            ) : (
              [formatBytes(d.size), d.pages && `${d.pages} pages`, `${d.chunks} passages indexed`].filter(Boolean).join(" · ")
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={removing}
          onClick={async () => {
            if (!confirm) return setConfirm(true);
            setRemoving(true);
            await onRemove().catch(() => setRemoving(false));
          }}
          onBlur={() => setConfirm(false)}
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] transition-colors ${confirm ? "bg-red-400/15 text-red-300" : "text-fog-500 hover:text-fog-100"}`}
          aria-label={confirm ? `Confirm removing ${d.name}` : `Remove ${d.name}`}
        >
          {removing ? "Removing…" : confirm ? "Remove?" : "Remove"}
        </button>
      </div>

      {d.status === "ready" && (
        <div className="mt-2.5 pl-12">
          {x && (
            <p className="mb-1.5 inline-block rounded-full border border-volt-400/25 px-2 py-px text-[10.5px] text-volt-300">{x.documentKind}</p>
          )}
          {codes.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {codes.slice(0, open ? undefined : 6).map((c) => (
                <span key={c.code} title={c.description} className="rounded bg-amber-hv/10 px-1.5 py-px font-mono text-[10.5px] text-amber-hv">
                  {c.code}
                </span>
              ))}
              {!open && codes.length > 6 && <span className="text-[10.5px] text-fog-500">+{codes.length - 6}</span>}
            </div>
          )}
          {(x || d.extractionError) && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-[11px] text-volt-400 hover:text-volt-300" aria-expanded={open}>
              {open ? "Hide extracted facts" : "Show extracted facts"}
            </button>
          )}
          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-2.5 pt-2.5 text-[12px] leading-relaxed">
                  {d.extractionError && <p className="text-fog-500">{d.extractionError}</p>}
                  {x && <p className="text-fog-300">{x.summary}</p>}
                  {x && (x.vehicle.make || x.vehicle.model) && (
                    <p className="text-fog-400">
                      Vehicle mentioned: {[x.vehicle.make, x.vehicle.model, x.vehicle.year].filter(Boolean).join(" ")}
                    </p>
                  )}
                  {x && x.dtcs.some((c) => c.description) && (
                    <ul className="space-y-0.5">
                      {x.dtcs.filter((c) => c.description).map((c) => (
                        <li key={c.code} className="text-fog-400">
                          <span className="font-mono text-amber-hv">{c.code}</span> {c.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  {x && x.measurements.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10.5px] tracking-wider text-fog-500 uppercase">Measurements</p>
                      <ul className="space-y-0.5 font-mono text-[11px] text-fog-300">
                        {x.measurements.map((m, i) => (
                          <li key={i} title={m.context}>
                            {m.name}: {m.value}
                            {m.unit ? ` ${m.unit}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {x && x.components.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {x.components.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => showComponentInfo(id)}
                          className="rounded-full border border-white/10 px-2 py-px text-[10.5px] text-fog-400 hover:border-volt-400/50 hover:text-volt-300"
                        >
                          {COMPONENT_BY_ID[id]?.short ?? id} ↗
                        </button>
                      ))}
                    </div>
                  )}
                  {x?.coverageNote && <p className="text-fog-500">{x.coverageNote}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </li>
  );
}

export function DocumentsCard({ state, disabled, disabledReason }: { state: CaseState; disabled: boolean; disabledReason?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const docs = state.data?.documents ?? [];

  const accept = (list: FileList | File[]) => {
    const files = [...list];
    const bad: string[] = [];
    const good = files.filter((f) => {
      const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPT.includes(ext)) return bad.push(`${f.name}: unsupported type`), false;
      if (f.size > MAX_BYTES) return bad.push(`${f.name}: over 25 MB`), false;
      return true;
    });
    setRejected(bad);
    if (good.length) void state.upload(good);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (!disabled) accept(e.dataTransfer.files);
  };

  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="docs-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="docs-heading" className="eyebrow text-[10px]!">
          Case documents
        </h2>
        {docs.length > 0 && <span className="text-[11px] text-fog-500">{docs.length} / 20</span>}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
          disabled ? "border-white/10 opacity-60" : drag ? "border-volt-400 bg-volt-400/[0.06]" : "border-white/15 hover:border-white/30"
        }`}
      >
        <svg viewBox="0 0 24 24" className="mx-auto size-7 text-volt-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <p className="mt-2 text-[13px] text-fog-100">
          Drop files here or{" "}
          <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="text-volt-400 underline-offset-4 hover:underline disabled:no-underline">
            browse
          </button>
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-fog-500">
          {disabled && disabledReason ? disabledReason : "Scan reports, service manuals, logs, repair notes · PDF, DOCX, TXT, MD, CSV, JSON · up to 25 MB each"}
        </p>
        <input ref={input} type="file" multiple accept={ACCEPT.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => e.target.files && (accept(e.target.files), (e.target.value = ""))} />
      </div>

      {rejected.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-red-300">
          {rejected.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      {(state.uploads.length > 0 || docs.length > 0) && (
        <ul className="mt-3 space-y-2">
          {state.uploads.map((u) => (
            <PendingItem key={u.key} u={u} onDismiss={() => state.dismissUpload(u.key)} />
          ))}
          {[...docs].reverse().map((d) => (
            <DocumentItem key={d.docId} d={d} onRemove={() => state.removeDocument(d.docId)} />
          ))}
        </ul>
      )}
    </section>
  );
}
