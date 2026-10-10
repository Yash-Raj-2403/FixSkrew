import { getParts } from "./db.js";
import type { ComponentId } from "./catalog.js";
import type { SourceRef } from "./db.js";

/**
 * Parts catalogue for the Tesla Model 3 HV battery system. Each part is stored as its own
 * document in the `parts` collection so it can be looked up, ranked against retrieved
 * evidence and located in an image. Descriptions are general and come from the synthetic
 * Model 3 test documents in knowledge/; they carry no real specifications.
 */
export interface PartDoc {
  _id: string;
  name: string;
  component: ComponentId;
  description: string;
  /** What the part looks like, to help find it in a photo or 3D view. */
  look: string;
  /** Trouble codes whose documented first suspect or companion this part is. */
  dtcs: string[];
  /** Case-insensitive patterns that name this part in text. */
  patterns: string[];
  /** Part that physically contains this one; if this part is hidden, the container is marked instead. */
  insideOf?: string;
  vehicle: { make: string; model: string };
  dataSource: "synthetic-test-documents";
}

const V = { make: "Tesla", model: "Model 3" };
const part = (
  id: string,
  name: string,
  component: ComponentId,
  description: string,
  look: string,
  dtcs: string[],
  patterns: string[],
): PartDoc => ({ _id: id, name, component, description, look, dtcs, patterns, vehicle: V, dataSource: "synthetic-test-documents" });

export const PARTS: PartDoc[] = [
  part("battery-pack", "Battery pack enclosure", "battery-pack", "Sealed floor-mounted enclosure holding the modules, BMS and junction box. Seal failure or moisture causes isolation faults.", "Large flat grey panel under the whole floor between the axles.", ["P0AFA", "P0AFB", "P0AA6"], ["pack enclosure", "enclosure", "pack voltage", "moisture", "water (ingress|in the pack)"]),
  part("pack-vent", "Pack vent", "battery-pack", "Pressure-equalisation vent in the pack enclosure. A wet or clogged membrane holds moisture in the pack.", "Small round or oval membrane fitting on the edge of the pack enclosure.", ["P0AA6"], ["\\bvent\\b", "membrane", "car wash|washing"]),
  part("module-1", "Battery module 1", "battery-modules", "Module 1 holds series groups 1 to 24 with their voltage-sense wires and temperature sensors.", "One of four cell blocks inside the pack, visible only with the pack open.", [], ["module\\s*#?1\\b", "groups?\\s*(?:[1-9]|1\\d|2[0-4])\\b"]),
  part("module-2", "Battery module 2", "battery-modules", "Module 2 holds series groups 25 to 48 with their voltage-sense wires and temperature sensors.", "One of four cell blocks inside the pack, visible only with the pack open.", [], ["module\\s*#?2\\b", "groups?\\s*(?:2[5-9]|3\\d|4[0-8])\\b"]),
  part("module-3", "Battery module 3", "battery-modules", "Module 3 holds series groups 49 to 72 with their voltage-sense wires and temperature sensors.", "One of four cell blocks inside the pack, visible only with the pack open.", [], ["module\\s*#?3\\b", "groups?\\s*(?:49|5\\d|6\\d|7[0-2])\\b"]),
  part("module-4", "Battery module 4", "battery-modules", "Module 4 holds series groups 73 to 96 with their voltage-sense wires and temperature sensors.", "One of four cell blocks inside the pack, visible only with the pack open.", [], ["module\\s*#?4\\b", "groups?\\s*(?:7[3-9]|8\\d|9[0-6])\\b"]),
  part("cells", "Cell groups (modules and cells)", "battery-modules", "The series groups of parallel cells. A weak group with high internal resistance causes imbalance and range loss.", "The cell blocks inside the pack.", ["P0B3C", "P0A7F", "P0A80"], ["cell (group|voltage|spread)", "imbalance", "spread", "weak group", "balancing charge", "internal resistance"]),
  part("sense-connector", "Module voltage-sense connector", "battery-modules", "Connector carrying each group's voltage-sense wires to the BMS. Corrosion or looseness gives a false imbalance reading.", "Small multi-pin connector on top of a module with thin wires.", ["P0B3C"], ["sense (connector|wir|pin)", "voltage-sense", "corro"]),
  part("module-temp-sensor", "Module temperature sensor", "battery-modules", "Temperature sensors on each module. One sensor far from the others points to a sensor or wiring fault.", "Small sensor on each module with a thin cable.", ["P0A9C"], ["temperature sensor", "sensor (reads|reading)", "P0A9C"]),
  part("bms", "BMS board", "bms", "Battery management system board: measures every group, balances cells, limits power, controls the contactors and logs faults.", "Flat circuit board in the pack with several connectors.", ["P0A1F", "P0AFB", "P0A7F"], ["\\bBMS\\b", "battery management", "reset", "coding"]),
  part("junction-box", "HV junction box", "hv-junction-box", "Houses the main contactors, pre-charge contactor and resistor, the pack current sensor and fuses.", "Metal box with orange HV cables entering it, at the front of the pack.", ["P0AE2", "P0ADD", "P0ADE", "P0AC0"], ["junction box"]),
  part("contactors", "Main and pre-charge contactors", "hv-junction-box", "Relays that connect the pack to the car. A stuck-closed contactor is a safety condition.", "Relays inside the HV junction box.", ["P0AE2", "P0ADD", "P0ADE"], ["contactor", "pre-charge", "click"]),
  part("precharge-resistor", "Pre-charge resistor", "hv-junction-box", "Limits inrush current when the bus charges. An open resistor gives a pre-charge timeout.", "Resistor inside the HV junction box.", ["P0AE2"], ["pre-charge resistor", "pre-charge time", "timeout"]),
  part("current-sensor", "Pack current sensor", "hv-junction-box", "Measures pack current. A steady non-zero offset at rest is sensor drift.", "Sensor on the HV busbar inside the junction box.", ["P0AC0"], ["current sensor", "idle current", "clamp meter", "drift"]),
  part("dc-fuse", "DC fast-charge fuse", "hv-junction-box", "Fuse in the DC charging path inside the junction box. Open circuit stops DC charging while AC still works.", "Fuse inside the HV junction box.", [], ["DC fuse", "fuse", "DC (charge|charging|session)", "fast charg\\w*\\s+(abort|stop)"]),
  part("aux-battery", "12 V battery", "chassis", "Low-voltage supply. Below 11 V it can cause false contactor and BMS codes.", "Small 12 V battery in the frunk or under the rear seat.", [], ["12\\s?V (battery|supply)", "weak 12", "sat (for|unused)"]),
  part("coolant-pump", "Coolant pump", "cooling-plate", "Circulates coolant through the cooling plate. Compare commanded and actual speed.", "Pump unit with coolant hoses near the front of the pack.", ["P0A81"], ["\\bpump\\b"]),
  part("cooling-plate", "Cooling plate and coolant", "cooling-plate", "Serpentine plate under the modules. An air lock or leak causes hot modules and thermal limits.", "Flat plate with coolant hoses under the modules.", ["P0A81", "P0A9C"], ["cooling plate", "coolant", "air lock", "bleed", "leak"]),
  part("pack-heater", "Pack heater", "cooling-plate", "Heats the pack in cold weather. A heater that fails to switch on gives slow charging when cold.", "Heater unit in the coolant loop.", [], ["heater", "precondition", "cold (weather|pack)"]),
  part("hv-harness", "HV harness and connectors", "hv-harness", "Orange cables linking the pack, drive units, charger and charging inlet, including the HV interlock loop.", "Thick orange cables between the pack, motors and charge port.", ["P0A0D", "P0AA6"], ["harness", "HV connector", "unseated", "latch"]),
  part("interlock", "High-voltage interlock loop (HVIL)", "hv-harness", "Low-voltage loop through the HV connectors. Any unseated connector breaks it.", "Small signal wires running with the orange cables.", ["P0A0D"], ["interlock", "HVIL", "P0A0D"]),
  part("charge-inlet", "Charging inlet", "charging-port", "Accepts AC and DC charging, carries the charge-port temperature sensors and latch.", "Charge socket on the rear left of the body.", ["P1A00", "P0AA6"], ["charge port", "charging inlet", "\\binlet\\b", "pins?"]),
  part("inlet-wiring", "Charge-port temperature sensor wiring", "charging-port", "Sensor wiring in the charging inlet harness. Worn wiring causes false or real over-temperature codes.", "Thin wires at the back of the charge socket.", ["P1A00"], ["charge[- ]port (temperature|sensor|wiring)", "sensor wiring", "overheat"]),
  part("front-drive-unit", "Front drive unit", "front-motor", "Front electric drive unit. Tested as a branch when isolating an insulation fault.", "Motor and gearbox between the front wheels.", [], ["front (drive|motor)", "drive units?"]),
  part("rear-drive-unit", "Rear drive unit", "rear-motor", "Rear electric drive unit. Tested as a branch when isolating an insulation fault.", "Motor and gearbox between the rear wheels.", [], ["rear (drive|motor)", "drive units?"]),
];

/** Parts sealed inside the pack: a view of the closed vehicle can only show the pack that contains them. */
const INSIDE_PACK = ["cells", "module-1", "module-2", "module-3", "module-4", "sense-connector", "module-temp-sensor", "bms", "junction-box", "contactors", "precharge-resistor", "current-sensor", "dc-fuse", "cooling-plate"];
for (const p of PARTS) if (INSIDE_PACK.includes(p._id)) p.insideOf = "battery-pack";

let seeded: Promise<void> | null = null;

/** Store the catalogue in MongoDB (idempotent). Returns the stored parts. */
export async function ensureParts(): Promise<PartDoc[]> {
  const col = await getParts();
  seeded ??= (async () => {
    await col.bulkWrite(PARTS.map((p) => ({ replaceOne: { filter: { _id: p._id }, replacement: p, upsert: true } })));
    await col.deleteMany({ _id: { $nin: PARTS.map((p) => p._id) } });
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  await seeded;
  return col.find({}).toArray();
}

export interface RankedPart {
  id: string;
  name: string;
  component: ComponentId;
  description: string;
  rank: number;
  /** 0 to 1, relative to the strongest part. */
  score: number;
  reasons: string[];
  sourceIds: string[];
}

const re = (p: string) => new RegExp(p, "i");

/**
 * Rank parts by the evidence the answer was built from: retrieved passages (weighted by their
 * match score, with trouble-code matches counting most), then the technician's own words and
 * codes. A part with no evidence is never returned.
 */
export function rankParts(opts: {
  parts: PartDoc[];
  sources: SourceRef[];
  userText: string;
  /** The technician's own uploaded data: summaries and measurement names with values. */
  caseText?: string;
  /** The latest answer's text, which names what the evidence pointed at. */
  answerText?: string;
  caseDtcs: string[];
  limit: number;
}): RankedPart[] {
  const weight = (s: SourceRef) => (s.score == null ? 1 : Math.min(1, Math.max(0.25, (s.score - 0.84) / 0.1)));
  const raw = opts.parts.map((p) => {
    const patterns = p.patterns.map(re);
    let total = 0;
    const reasons: { w: number; text: string }[] = [];
    const sourceIds: string[] = [];

    for (const s of opts.sources) {
      const text = `${s.section ?? ""} ${s.excerpt}`;
      const dtcHit = p.dtcs.find((c) => s.dtcs.includes(c));
      const kw = patterns.filter((r) => r.test(text)).length;
      const strength = (dtcHit ? 0.7 : 0) + Math.min(kw, 2) * 0.35;
      if (strength <= 0) continue;
      const c = weight(s) * strength;
      total += c;
      sourceIds.push(s.id);
      reasons.push({ w: c, text: `${s.id}: ${s.sourceTitle.replace(/^SYNTHETIC TEST:\s*/i, "")}${s.section ? ` · ${s.section}` : ""}${dtcHit ? ` (code ${dtcHit})` : ""}` });
    }

    const userHits = patterns.filter((r) => r.test(opts.userText)).length;
    if (userHits) {
      total += Math.min(userHits, 2) * 1.0;
      reasons.push({ w: 2, text: "Named in your messages" });
    }
    const caseHits = opts.caseText ? patterns.filter((r) => r.test(opts.caseText!)).length : 0;
    if (caseHits) {
      total += Math.min(caseHits, 1) * 0.7;
      reasons.push({ w: 1.4, text: "Appears in your uploaded data" });
    }
    const answerHits = opts.answerText ? patterns.filter((r) => r.test(opts.answerText!)).length : 0;
    if (answerHits) {
      total += Math.min(answerHits, 1) * 0.8;
      reasons.push({ w: 1.6, text: "Addressed in the answer" });
    }
    const codeHits = p.dtcs.filter((c) => opts.caseDtcs.includes(c));
    if (codeHits.length) {
      total += Math.min(codeHits.length, 2) * 1.2;
      reasons.push({ w: 2, text: `Your case has code ${codeHits.join(", ")}` });
    }
    return { p, total, reasons: reasons.sort((a, b) => b.w - a.w).slice(0, 3).map((r) => r.text), sourceIds: [...new Set(sourceIds)] };
  });

  const ranked = raw.filter((r) => r.total > 0).sort((a, b) => b.total - a.total).slice(0, opts.limit);
  const max = ranked[0]?.total ?? 1;
  return ranked.map((r, i) => ({
    id: r.p._id,
    name: r.p.name,
    component: r.p.component,
    description: r.p.description,
    rank: i + 1,
    score: Math.round((r.total / max) * 100) / 100,
    reasons: r.reasons,
    sourceIds: r.sourceIds,
  }));
}
