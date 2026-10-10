# Repair Histories II: Model 3 Battery Work Orders RO-1015 to RO-1025 (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA.** All work orders, vehicles, workshops, dates and outcomes are invented to test the FixSkrew pipeline. They do not describe any real vehicle or repair.

Document ID: SYN-M3-RH-002 · Language: English

Each entry gives the complaint, the diagnosis, the repair, the verification and the outcome. Outcomes are recorded so the assistant can tell which repairs resolved a fault and which did not.

---

## RO-1015: Recovery after long storage

**Vehicle:** Model 3 Long Range, 2021, 21,800 km · **Opened:** 2025-03-11
**Complaint:** No drive and a battery warning after five months of storage.
**Codes:** P0AFA active.

**Diagnosis.** Pack voltage 276.0 V, all 96 groups above 2.70 V, spread 0.062 V. Insulation and idle current normal.

**Repair.** Slow AC recovery charge, then a balancing charge to 100 % held for 4 hours. Capacity test run.

**Verification.** Spread at rest 0.019 V. State of health 87 %. P0AFA did not return after 3 wake cycles.

**Outcome.** Resolved. No parts replaced.

**Lesson.** A low pack voltage after storage is not a failed pack when every group is above 2.70 V. Recover slowly and measure before replacing anything.

---

## RO-1016: Current sensor drift, junction box replaced

**Vehicle:** Model 3 Standard Range Plus, 2020, 64,300 km · **Opened:** 2025-03-25
**Complaint:** Overnight drain and an intermittent warning.
**Codes:** P0AC0 active.

**Diagnosis.** BMS reported 2.6 A at rest while a clamp meter read 0.1 A and only 0.4 % charge was lost in 12 hours.

**Repair.** HV junction box assembly replaced (includes the current sensor).

**Verification.** Idle current 0.1 A. P0AC0 did not return after two weeks.

**Outcome.** Resolved.

**Lesson.** Compare the sensor with a clamp meter before hunting for a parasitic load.

---

## RO-1017: Module 2 temperature sensor connector

**Vehicle:** Model 3 Long Range, 2022, 31,900 km · **Opened:** 2025-04-09
**Complaint:** Battery warning on cold mornings and limited charging.
**Codes:** P0A9C active.

**Diagnosis.** Modules 1, 3 and 4 read about 14 °C after a night's rest while module 2 read −12 °C. Cells were balanced.

**Repair.** Corroded pin in the module 2 temperature sensor connector repaired and sealed. No module replaced.

**Verification.** All four modules within 0.5 °C after a rest. P0A9C did not return.

**Outcome.** Resolved.

**Lesson.** One sensor far from the others is a sensor or wiring fault, not a cold module.

---

## RO-1018: Air lock after a coolant change

**Vehicle:** Model 3 Performance, 2021, 52,700 km · **Opened:** 2025-04-23
**Complaint:** Slow fast charging and a battery warning after a coolant service elsewhere.
**Codes:** P0B3C stored, no thermal code.

**Diagnosis.** Pack reached 53.4 °C at the end of a fast charge, module spread 7.1 °C, coolant 0.4 L low. Pump command and speed agreed. Cell spread at rest 0.021 V.

**Repair.** Coolant topped up and the bleed procedure performed. No module replaced.

**Verification.** Fast charge peak 41.8 °C, spread under load 0.096 V. P0B3C cleared and did not return.

**Outcome.** Resolved.

**Lesson.** A P0B3C that appears only when hot, with thermal findings, belongs to the thermal system first.

---

## RO-1019: BMS board replaced

**Vehicle:** Model 3 Standard Range Plus, 2019, 118,900 km · **Opened:** 2025-05-07
**Complaint:** Warning on the dash and intermittent no-start.
**Codes:** P0A1F active.

**Diagnosis.** 12 V battery healthy at 12.6 V. The code returned after a power cycle and the BMS reset 11 times in 24 hours. Cells, insulation and contactors were normal.

**Repair.** BMS board (SYN-BMS-100) replaced and coded. Capacity learning routine run.

**Verification.** No resets in 48 hours. P0A1F did not return after a 200 km drive.

**Outcome.** Resolved.

**Lesson.** Replace the BMS board only after the 12 V supply is excluded and the code survives a power cycle.

---

## RO-1020: BMS fault code caused by a low 12 V battery

**Vehicle:** Model 3 Long Range, 2020, 58,200 km · **Opened:** 2025-05-12
**Complaint:** Dash warning after the car sat for ten days.
**Codes:** P0A1F stored.

**Diagnosis.** 12 V battery at 10.7 V at wake-up. After charging the 12 V battery and a power cycle the code did not return.

**Repair.** 12 V battery replaced. BMS not touched.

**Verification.** No code after two weeks.

**Outcome.** Resolved.

**Lesson.** The same code as RO-1019, with the opposite cause. The 12 V supply decides which case it is.

---

## RO-1021: Reduced power in extreme cold, no fault

**Vehicle:** Model 3 Long Range, 2022, 27,400 km · **Opened:** 2025-01-27
**Complaint:** Reduced power and limited charging message in the morning.
**Codes:** none.

**Diagnosis.** Ambient −15 °C, pack −8.0 °C. All measurements healthy. Power returned after 20 minutes of driving.

**Repair.** None. Owner advised to precondition.

**Verification.** No complaint at the follow-up call.

**Outcome.** No fault.

**Lesson.** Do not open the pack for a cold-weather complaint when the numbers are healthy.

---

## RO-1022: Aftermarket tracker draining the pack

**Vehicle:** Model 3 Standard Range Plus, 2020, 79,600 km · **Opened:** 2025-05-20
**Complaint:** About 3 % charge lost every night.
**Codes:** none.

**Diagnosis.** BMS and clamp meter both read 1.1 A at rest. Unplugging an aftermarket OBD tracker brought the idle current to 0.2 A.

**Repair.** None on the vehicle. Tracker removed.

**Verification.** Overnight loss under 0.5 %.

**Outcome.** Resolved.

**Lesson.** When the BMS and a clamp meter agree on a high idle current, look for a real load before suspecting the pack.

---

## RO-1023: Wet vent after car washes, vent replaced

**Vehicle:** Model 3 Long Range, 2021, 44,100 km · **Opened:** 2025-06-04
**Complaint:** Red HV warning after washing the car.
**Codes:** P0AA6 stored.

**Diagnosis.** Whole-pack insulation 320 Ω/V two days after a wash. Every external branch above 1,500 Ω/V. Pack vent membrane wet and clogged. No water seen at the service access.

**Repair.** Pack vent (SYN-VNT-020) replaced.

**Verification.** Insulation 1,540 Ω/V after 48 hours.

**Outcome.** Resolved at the time, see RO-1024.

**Lesson.** A clogged vent can hold moisture in the pack. Exclude water inside before closing the order.

---

## RO-1024: Isolation fault returns, inlet seal torn

**Vehicle:** Model 3 Long Range, 2021, 44,900 km · **Opened:** 2025-06-27
**Complaint:** The HV warning returned three weeks after RO-1023.
**Codes:** P0AA6 stored.

**Diagnosis.** Insulation 410 Ω/V. The charging inlet seal was torn and the inlet branch tested 380 Ω/V alone.

**Repair.** Charge port assembly (SYN-CIN-400) replaced.

**Verification.** Insulation 1,820 Ω/V on the whole pack after a wash test.

**Outcome.** Resolved.

**Lesson.** The earlier repair treated one contributor. Test every branch again when an isolation fault returns.

---

## RO-1025: DC fuse open, fast charging aborts

**Vehicle:** Model 3 Performance, 2022, 36,800 km · **Opened:** 2025-06-18
**Complaint:** DC charging stops within seconds, AC charging normal.
**Codes:** none.

**Diagnosis.** DC fuse in the HV junction box measured open circuit. Pre-charge time 0.9 s, charge port normal.

**Repair.** DC fuse (SYN-FUS-210) replaced after de-energising. DC cables and charge port inspected, no damage.

**Verification.** Three DC sessions completed to 80 %.

**Outcome.** Resolved.

**Lesson.** AC works and DC does not: check the DC fuse and contactors before the pack.

---

## Summary of outcomes

| Order | Fault | Repair | Outcome |
|---|---|---|---|
| RO-1015 | Low voltage after storage | Slow recovery and balancing charge | Resolved |
| RO-1016 | Current sensor drift | Junction box replaced | Resolved |
| RO-1017 | Temperature sensor connector | Connector repaired | Resolved |
| RO-1018 | Air lock after coolant service | Coolant bleed | Resolved |
| RO-1019 | BMS board fault | BMS board replaced | Resolved |
| RO-1020 | Low 12 V battery | 12 V battery replaced | Resolved |
| RO-1021 | Extreme cold behaviour | none | No fault |
| RO-1022 | Aftermarket tracker drain | Tracker removed | Resolved |
| RO-1023 | Clogged vent | Vent replaced | Partly resolved |
| RO-1024 | Torn inlet seal | Charge port replaced | Resolved |
| RO-1025 | Open DC fuse | DC fuse replaced | Resolved |
