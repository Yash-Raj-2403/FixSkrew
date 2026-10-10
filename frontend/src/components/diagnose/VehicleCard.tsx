import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Vehicle } from "../../lib/api";
import type { CaseState } from "../../lib/useCase";

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

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

interface Candidate {
  make?: string;
  model?: string;
  year?: number;
  docs: string[];
}

const label = (v: { make?: string; model?: string; year?: number }) => [v.make, v.model, v.year].filter(Boolean).join(" ");
const same = (a: string | undefined, b: string | undefined) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/** Vehicles mentioned across the uploaded documents, most-cited first. */
function useCandidates(state: CaseState): Candidate[] {
  const docs = state.data?.documents;
  return useMemo(() => {
    const map = new Map<string, Candidate>();
    for (const d of docs ?? []) {
      const v = d.extraction?.vehicle;
      if (d.status !== "ready" || !v || (!v.make && !v.model)) continue;
      const key = [v.make, v.model, v.year].map((x) => String(x ?? "").toLowerCase()).join("|");
      const c = map.get(key) ?? { make: v.make, model: v.model, year: v.year, docs: [] };
      c.docs.push(d.name);
      map.set(key, c);
    }
    return [...map.values()].sort((a, b) => b.docs.length - a.docs.length);
  }, [docs]);
}

function Radar() {
  return (
    <span className="relative grid size-9 shrink-0 place-items-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-volt-400/20 motion-reduce:animate-none" />
      <span className="absolute inset-1 rounded-full border border-volt-400/40" />
      <span className="size-2 rounded-full bg-volt-400" />
    </span>
  );
}

export function VehicleCard({ state, suggestions }: { state: CaseState; suggestions: { make?: string; model?: string }[] }) {
  const saved = state.data?.vehicle;
  const hasSaved = Boolean(saved?.make || saved?.model);
  const candidates = useCandidates(state);
  const open = candidates.filter((c) => !(same(c.make, saved?.make) && same(c.model, saved?.model)));
  const hasDocs = (state.data?.documents.length ?? 0) > 0;
  const analysing = state.uploads.some((u) => u.stage !== "failed");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<VehicleForm>(() => toForm(saved));
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const caseId = state.data?.id;
  useEffect(() => {
    setForm(toForm(state.data?.vehicle));
    setEditing(false);
  }, [caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const makes = [...new Set(suggestions.map((s) => s.make).filter(Boolean) as string[])];
  const models = [
    ...new Set(suggestions.filter((s) => !form.make.trim() || same(s.make, form.make)).map((s) => s.model).filter(Boolean) as string[]),
  ];

  const commit = async (v: Vehicle) => {
    setBusy(true);
    setMessage("");
    try {
      await state.saveVehicle(v);
      setEditing(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  // One tap: adopt what the documents say, keeping any details already entered.
  const confirm = (c: Candidate) =>
    commit({ ...saved, ...(c.make && { make: c.make }), ...(c.model && { model: c.model }), ...(c.year && { year: c.year }) });

  const saveForm = async () => {
    const e: typeof errors = {};
    if (form.year && (!/^\d{4}$/.test(form.year) || +form.year < 1990 || +form.year > new Date().getFullYear() + 2)) e.year = "Four-digit model year.";
    if (form.vin && !VIN_RE.test(form.vin.trim().toUpperCase())) e.vin = "17 characters, no I, O or Q.";
    if (form.odometerKm && !(Number(form.odometerKm) >= 0)) e.odometerKm = "Kilometres.";
    setErrors(e);
    if (Object.keys(e).length) return;
    await commit({
      ...(form.make.trim() && { make: form.make.trim() }),
      ...(form.model.trim() && { model: form.model.trim() }),
      ...(form.year && { year: Number(form.year) }),
      ...(form.trim.trim() && { trim: form.trim.trim() }),
      ...(form.batteryVariant.trim() && { batteryVariant: form.batteryVariant.trim() }),
      ...(form.odometerKm && { odometerKm: Number(form.odometerKm) }),
      ...(form.vin.trim() && { vin: form.vin.trim().toUpperCase() }),
    });
  };

  const set = (k: keyof VehicleForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const field = (k: keyof VehicleForm, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] text-fog-400">{text}</span>
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
        {hasSaved && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-[11px] text-fog-500 hover:text-fog-100">
            Edit
          </button>
        )}
      </div>

      {/* Confirmed vehicle */}
      {hasSaved && !editing && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fog-100">{label(saved!)}</p>
            <p className="truncate text-[11px] text-fog-500">
              {[saved?.trim, saved?.batteryVariant, saved?.odometerKm != null && `${saved.odometerKm.toLocaleString()} km`, saved?.vin].filter(Boolean).join(" · ") ||
                "Confirmed · searches favour this vehicle"}
            </p>
          </div>
        </div>
      )}

      {/* Waiting for something to read */}
      {!hasSaved && !editing && open.length === 0 && (
        <div className="flex items-start gap-3">
          <Radar />
          <div>
            <p className="text-[13px] text-fog-100">{analysing ? "Reading your documents…" : hasDocs ? "No vehicle named in the documents" : "Vehicle will be detected automatically"}</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-fog-500">
              {hasDocs && !analysing
                ? "Nothing in the uploads identifies the car. Tell me which one it is."
                : "Upload a manual or scan report and I'll find the make, model and year, then ask you to confirm."}
            </p>
          </div>
        </div>
      )}

      {/* Detected in documents: ask the user to confirm */}
      {open.length > 0 && !editing && (
        <div className={hasSaved ? "mt-3" : ""}>
          <p className="mb-2 text-[11.5px] text-fog-400">{hasSaved ? "Documents also mention:" : "Found in your documents. Is this your vehicle?"}</p>
          <ul className="space-y-2">
            {open.slice(0, 3).map((c) => (
              <motion.li
                key={`${c.make}|${c.model}|${c.year}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-xl border border-volt-400/30 bg-volt-400/[0.05] p-3"
              >
                <Radar />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fog-100">{label(c)}</p>
                  <p className="truncate text-[11px] text-fog-500" title={c.docs.join(", ")}>
                    in {c.docs.length === 1 ? c.docs[0] : `${c.docs.length} documents`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => confirm(c)}
                  className="shrink-0 rounded-full bg-volt-400 px-3.5 py-1.5 text-xs font-medium text-ink-900 transition-colors hover:bg-volt-300 disabled:opacity-60"
                >
                  Yes, it is
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {message && <p className="mt-2 text-[11px] text-red-300">{message}</p>}

      {!editing && !hasSaved && (
        <button type="button" onClick={() => setEditing(true)} className="mt-3 text-[11.5px] text-fog-500 underline-offset-4 hover:text-fog-100 hover:underline">
          {open.length ? "None of these, enter it myself" : "Enter it myself"}
        </button>
      )}

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 gap-2.5 pt-1">
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
            <div className="mt-3.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm(toForm(saved));
                  setErrors({});
                }}
                className="px-3 py-1.5 text-xs text-fog-500 hover:text-fog-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveForm}
                disabled={busy}
                className="rounded-full border border-volt-400/50 px-4 py-1.5 text-xs text-fog-100 transition-colors enabled:hover:bg-volt-400/10 disabled:text-fog-500"
              >
                {busy ? "Saving…" : "Confirm vehicle"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
