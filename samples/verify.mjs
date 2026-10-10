// Runs each sample case through the live API: upload, ask the technician's question, check citations, ranking and battery data.
//   node samples/verify.mjs [case-prefix]   (backend must be running, default http://localhost:8787)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.API ?? "http://localhost:8787";
const here = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv[2];

const EXPECT = {
  "01": { codes: ["P0B3C", "P0A7F"], parts: ["cells", "sense-connector", "module-3"], need: 2 },
  "02": { codes: ["P0AA6"], parts: ["pack-vent", "battery-pack", "hv-harness"], need: 1 },
  "03": { codes: ["P0ADD", "P0AE2"], parts: ["aux-battery", "contactors", "junction-box", "precharge-resistor"], need: 2 },
  "04": { codes: ["P0B3C"], parts: ["cooling-plate", "coolant-pump", "cells"], need: 2 },
  "05": { codes: [], parts: ["dc-fuse", "contactors", "junction-box", "charge-inlet"], need: 1 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = async (res) => ({ ok: res.ok, status: res.status, body: await res.json().catch(() => null) });

async function chat(id, message) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`${BASE}/api/cases/${id}/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, language: "auto" }) });
    const text = await res.text();
    const events = [...text.matchAll(/event: (\w+)\ndata: (.*)\n/g)].map((m) => [m[1], JSON.parse(m[2])]);
    const done = events.find(([e]) => e === "done");
    if (done) return { assistant: done[1].assistant, sources: events.find(([e]) => e === "sources")?.[1].sources ?? [] };
    const err = events.find(([e]) => e === "error")?.[1].message ?? `HTTP ${res.status}`;
    if (!/quota|rate/i.test(err) || attempt === 4) throw new Error(err);
    await sleep(25000);
  }
}

async function upload(id, dir, files) {
  const form = new FormData();
  for (const f of files) form.append("files", new Blob([await readFile(path.join(dir, f))]), f);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await json(await fetch(`${BASE}/api/cases/${id}/documents`, { method: "POST", body: form }));
    if (r.ok) return r.body;
    if (attempt === 3) throw new Error(`upload failed: ${r.body?.message ?? r.status}`);
    await sleep(25000);
  }
}

let failures = 0;
let blocked = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
};

const dirs = (await readdir(here, { withFileTypes: true })).filter((d) => d.isDirectory() && /^\d\d-/.test(d.name) && (!only || d.name.startsWith(only))).map((d) => d.name).sort();
for (const name of dirs) {
  const key = name.slice(0, 2);
  const exp = EXPECT[key];
  const dir = path.join(here, name);
  const files = (await readdir(dir)).sort();
  console.log(`\n== ${name}`);

  const created = await json(await fetch(`${BASE}/api/cases`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vehicle: { make: "Tesla", model: "Model 3" } }) }));
  const id = created.body.id;

  const up = await upload(id, dir, files);
  const okDocs = up.results.filter((r) => r.ok && r.document.status === "ready").length;
  check(okDocs === files.length, `uploaded and indexed ${files.length} files`, `${okDocs} ready`);

  const problem = (await readFile(path.join(dir, files.find((f) => /problem/.test(f))), "utf8")).split(/## My question\s*/)[1]?.trim() ?? "What is wrong and what do I check first?";
  let reply;
  try {
    reply = await chat(id, problem);
  } catch (e) {
    blocked++;
    console.log(`  BLOCKED  chat did not run: ${e.message}`);
    await fetch(`${BASE}/api/cases/${id}`, { method: "DELETE" });
    continue;
  }
  const { assistant, sources } = reply;
  const ids = [...assistant.content.matchAll(/\[(S\d+)\]/g)].map((m) => m[1]);
  const valid = new Set(sources.map((s) => s.id));
  check(ids.length > 0 && ids.every((i) => valid.has(i)), "answer cites retrieved sources", `${new Set(ids).size} distinct ids`);
  check(!/does not cite a source/.test(assistant.content), "no 'unverified' note");
  check(sources.some((s) => s.origin === "case"), "uses the uploaded files as evidence", `${sources.filter((s) => s.origin === "case").length} passages from uploads`);
  check(sources.some((s) => s.origin === "knowledge_base"), "uses the knowledge base too");

  const parts = (await json(await fetch(`${BASE}/api/cases/${id}/parts`))).body.parts;
  const top5 = parts.slice(0, 5).map((p) => p.id);
  const hit = exp.parts.filter((p) => top5.includes(p));
  check(hit.length >= exp.need, `ranked parts include ${exp.need}+ of [${exp.parts.join(", ")}]`, `top5: ${top5.join(", ")}`);

  const battery = (await json(await fetch(`${BASE}/api/cases/${id}/battery`))).body;
  const keys = new Set(battery.readings.map((r) => r.key));
  check(["soc", "soh", "pack_voltage"].every((k) => keys.has(k)), "battery dashboard has SOC, SOH and pack voltage", `${battery.readings.length} readings`);
  const codes = new Set(battery.dtcs.map((d) => d.code));
  check(exp.codes.every((c) => codes.has(c)), `trouble codes read from the files`, [...codes].join(", ") || "none");

  console.log(`  answer: ${assistant.content.replace(/\s+/g, " ").slice(0, 260)}…`);
  console.log(`  top parts: ${parts.slice(0, 3).map((p) => `#${p.rank} ${p.name} ${Math.round(p.score * 100)}%`).join(" | ")}`);
  await fetch(`${BASE}/api/cases/${id}`, { method: "DELETE" });
}
console.log(failures ? `\n${failures} check(s) failed` : blocked ? `\nNo failures, but ${blocked} case(s) were blocked by the language-model quota and not verified` : "\nAll checks passed");
process.exit(failures || blocked ? 1 : 0);
