# Repair Histories: Model 3 Battery Work Orders (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA.** All work orders, vehicles, workshops, dates and outcomes are invented to test the FixSkrew pipeline. They do not describe any real vehicle or repair.

Document ID: SYN-M3-RH-001 · Language: English

Each entry gives the complaint, the diagnosis, the repair, the verification and the outcome. Outcomes are recorded so the assistant can tell which repairs resolved a fault and which did not.

---

## RO-1001: Weak cell group, module replaced

**Vehicle:** Model 3 Standard Range Plus, 2020, 96,400 km · **Opened:** 2025-02-05
**Complaint:** Range loss and charging stopping early.
**Codes:** P0B3C active, P0A7F stored.

**Diagnosis.** Cell spread 0.140 V at rest. A balancing charge did not recover it. Group 63 of module 3 dropped 0.188 V more than its neighbours under 150 A. The module 3 sense connector was reseated and inspected: no corrosion, readings unchanged.

**Repair.** Module 3 replaced. BMS capacity learning routine run (full discharge, full charge at a low rate).

**Verification.** Cell spread at rest 0.012 V. Under 150 A load the spread was 0.071 V. Full charge reached 100 % without early stop. P0B3C did not return after 3 wake cycles and a 200 km drive.

**Outcome.** Resolved. Range recovered by about 14 % compared with before the repair.

**Lesson.** The module was replaced only after the weak group was confirmed by measurement under load and after the connector was excluded.

---

## RO-1002: False cell imbalance from a corroded sense connector

**Vehicle:** Model 3 Long Range, 2019, 142,500 km · **Opened:** 2025-02-18
**Complaint:** Reduced range and a warning about the battery.
**Codes:** P0B3C active.

**Diagnosis.** Group 29 of module 2 read 3.120 V while its neighbours were at 3.830 V, a spread of 0.710 V. A reading this low in a pack with normal behaviour was suspect. Inspection found green corrosion on the sense connector pin of module 2.

**Repair.** Connector cleaned, pin re-crimped and sealed with dielectric grease. No module replaced.

**Verification.** Group 29 now read 3.826 V. Spread 0.016 V. The code did not return.

**Outcome.** Resolved without parts. A module replacement would have been wrong.

**Lesson.** A very large single-group deviation can be a sense wiring fault, not a cell fault.

---

## RO-1003: Imbalance cured by balancing charge

**Vehicle:** Model 3 Standard Range Plus, 2021, 30,200 km · **Opened:** 2025-03-04
**Complaint:** "Range is lower than before, and charging slows near full."
**Codes:** P0B3C stored.

**Diagnosis.** Spread 0.062 V at rest. The owner always kept the car between 30 % and 70 %, as described in SYN-TSB-24-010. Pack temperature and insulation were normal.

**Repair.** Balancing charge: 100 % on AC, 4 hours held, 2 hours rest.

**Verification.** Spread dropped to 0.011 V. The code was cleared and did not return.

**Outcome.** Resolved. Advice given to charge to 100 % once a month.

---

## RO-1004: Coolant leak into the pack, cooling plate replaced

**Vehicle:** Model 3 Long Range, 2021, 61,000 km · **Opened:** 2025-03-25
**Complaint:** HV warning after heavy rain.
**Codes:** P0AA6 stored (3 times).

**Diagnosis.** Pack insulation 410 Ω/V with all loads disconnected. Coolant level low with no external leak. Pressure test showed a leak at a cooling plate port. Campaign SYN-RC-24-002 had not been performed on this vehicle.

**Repair.** Pack removed. Enclosure dried, port seal and cooling plate replaced, pack vent replaced, coolant refilled and bled.

**Verification.** Insulation 1,780 Ω/V after reinstall and 1,750 Ω/V after a drive and a fast charge. Coolant level stable over two weeks. No codes.

**Outcome.** Resolved. Campaign recorded as completed.

---

## RO-1005: Isolation fault from a worn charge-port harness, not the pack

**Vehicle:** Model 3 Standard Range Plus, 2020, 88,000 km · **Opened:** 2025-04-02
**Complaint:** Isolation warning that appears after washing the car.
**Codes:** P0AA6 stored.

**Diagnosis.** With the pack alone, insulation was healthy (1,500 Ω/V). Reconnecting branches one by one showed a drop to 280 Ω/V when the charging inlet branch was connected. Water traces were found at the inlet HV connector.

**Repair.** Charging inlet HV harness section and seal replaced.

**Verification.** Insulation 1,480 Ω/V with every branch connected. Car washed twice, no recurrence.

**Outcome.** Resolved. No pack work needed.

**Lesson.** An isolation fault does not always sit in the pack. Test branch by branch.

---

## RO-1006: Interlock fault, connector latch replaced

**Vehicle:** Model 3 Long Range, 2019, 118,000 km · **Opened:** 2025-04-09
**Complaint:** Lost drive power on a rough road.
**Codes:** P0A0D stored (4 occurrences).

**Diagnosis.** Pack healthy. Junction box connector latch loose, campaign sticker absent. Matches SYN-RC-24-001.

**Repair.** Campaign SYN-RC-24-001 carried out: retention clip replaced, pins inspected, locking tab fitted.

**Verification.** Test drive over rough road, no recurrence in 300 km. Code cleared.

**Outcome.** Resolved.

---

## RO-1007: End-of-life pack, modules replaced

**Vehicle:** Model 3 Standard Range Plus, 2019, 187,000 km · **Opened:** 2025-05-08
**Complaint:** Shrinking range, only 220 km.
**Codes:** P0A7F active.

**Diagnosis.** Uniform ageing: state of health 68 % after software update and relearn, measured capacity 36.8 kWh, small cell spread. Not a single weak group.

**Repair.** Owner chose full pack replacement with a refurbished unit. New pack coded to the vehicle.

**Verification.** State of health 97 %. Capacity test passed. Fast charge and range test normal.

**Outcome.** Resolved. Old pack returned to the recycler.

**Lesson.** Replacing one module would not have restored the range, because all modules were aged.

---

## RO-1008: Pre-charge resistor open, junction box replaced

**Vehicle:** Model 3 Long Range, 2019, 134,000 km · **Opened:** 2025-06-18
**Complaint:** Slow start and loud clunk.
**Codes:** P0AE2 active.

**Diagnosis.** 12 V battery healthy at 12.6 V. Pre-charge resistor open circuit, pre-charge time 3.8 s.

**Repair.** HV junction box assembly replaced.

**Verification.** Pre-charge time 1.1 s. No codes in 20 wake cycles.

**Outcome.** Resolved.

---

## RO-1009: False contactor fault from a weak 12 V battery

**Vehicle:** Model 3 Standard Range Plus, 2020, 70,500 km · **Opened:** 2025-06-30
**Complaint:** Intermittent HV warning and contactor codes after the car sat for a week.
**Codes:** P0ADD stored, P0AE2 stored.

**Diagnosis.** 12 V battery at 10.4 V after sitting. The contactors and pre-charge resistor measured within specification.

**Repair.** 12 V battery replaced. No HV parts replaced.

**Verification.** Codes cleared. No recurrence after two weeks of mixed use.

**Outcome.** Resolved.

**Lesson.** Check the 12 V supply first when contactor codes are intermittent. Replacing the junction box would have been unnecessary.

---

## RO-1010: Charge port sensor wiring, harness replaced

**Vehicle:** Model 3 Long Range, 2020, 72,000 km · **Opened:** 2025-07-03
**Complaint:** Charging stops after minutes with a charge port message.
**Codes:** P1A00 stored.

**Diagnosis.** Reported port temperature 88 °C while the surface was 26 °C. Sensor circuit open intermittently near the connector. Matches SYN-RC-23-007.

**Repair.** Sensor harness and connector replaced. The charge port itself was kept.

**Verification.** Reported temperature tracked the surface temperature during a 2-hour AC charge and a DC session.

**Outcome.** Resolved.

---

## RO-1011: Pump failure causing thermal limits

**Vehicle:** Model 3 Standard Range Plus, 2021, 49,000 km · **Opened:** 2025-08-20
**Complaint:** Reduced power, warning, slow charging.
**Codes:** P0A81 active, P0A9C active, P0B3C stored.

**Diagnosis.** Pump commanded to 100 % but not turning. Pump fuse intact. Pump connector corroded. Module 4 temperature of 58 °C was checked with a contact thermometer: 33 °C, so the sensor reading was false. Cell spread was re-measured after the cooling repair.

**Repair.** Coolant pump and connector replaced. Module 4 temperature sensor connector reseated. Coolant bled.

**Verification.** Pump speed matched the command. All module temperatures agreed within 1.5 °C. Cell spread 0.013 V after the cooling repair. No codes.

**Outcome.** Resolved. The stored P0B3C was a consequence of the thermal fault, not a bad cell.

**Lesson.** Fix the thermal fault first, then re-measure cell spread before judging a module.

---

## RO-1012: Unnecessary module replacement (negative outcome)

**Vehicle:** Model 3 Standard Range Plus, 2020, 54,000 km · **Opened:** 2025-09-02
**Complaint:** Range loss.
**Codes:** P0A7F stored.

**Diagnosis (original).** A single reading showed state of health 79 %. A module was replaced on the strength of that value alone.

**Outcome.** Not resolved. State of health stayed at 79 % after the replacement. A later check showed that the BMS firmware was out of date and the estimate was incorrect. After the software campaign SYN-TSB-24-018 and a relearn cycle the state of health was 93 %.

**Lesson.** A single state-of-health reading must not be used to condemn a module. Update software and verify capacity by a test first.

---

## RO-1013: Cold-weather charge complaint closed as normal

**Vehicle:** Model 3 Standard Range Plus, 2022, 24,900 km · **Opened:** 2025-01-30
**Complaint:** Slow DC charging in winter.
**Codes:** none.

**Diagnosis.** Charge power rose from 22 kW to over 100 kW as the pack warmed. Heater and pump normal.

**Repair.** None. Owner advised to precondition before arrival at the charger (SYN-TSB-24-014).

**Outcome.** Closed with no fault found. Owner confirmed shorter sessions after preconditioning.

---

## RO-1014: Recurrence after an incomplete repair

**Vehicle:** Model 3 Long Range, 2021, 66,500 km · **Opened:** 2025-10-01
**Complaint:** Isolation warning returned 6 weeks after a previous repair.
**Codes:** P0AA6 stored.

**Diagnosis.** The earlier repair replaced the coolant pump and refilled the coolant, but did not pressure-test the cooling plate. Pressure test now showed a leak at the cooling plate port. Campaign SYN-RC-24-002 was still open.

**Repair.** Cooling plate and port seal replaced and pack dried, vent replaced.

**Verification.** Insulation 1,700 Ω/V, stable after fast charging and rain exposure.

**Outcome.** Resolved at the second attempt.

**Lesson.** When coolant is lost together with an isolation fault, pressure-test the plate before replacing smaller parts.

---

## Summary of outcomes

| Order | Fault | Repair | Outcome |
|---|---|---|---|
| RO-1001 | Weak group, module 3 | Module replaced | Resolved |
| RO-1002 | Corroded sense connector | Connector repaired | Resolved |
| RO-1003 | Imbalance from partial charging | Balancing charge | Resolved |
| RO-1004 | Coolant leak into pack | Cooling plate replaced | Resolved |
| RO-1005 | Water at the charge inlet harness | Inlet harness replaced | Resolved |
| RO-1006 | Interlock connector latch | Campaign applied | Resolved |
| RO-1007 | End-of-life pack | Pack replaced | Resolved |
| RO-1008 | Open pre-charge resistor | Junction box replaced | Resolved |
| RO-1009 | Weak 12 V battery | 12 V battery replaced | Resolved |
| RO-1010 | Charge port sensor wiring | Harness replaced | Resolved |
| RO-1011 | Pump failure | Pump replaced | Resolved |
| RO-1012 | Module replaced on one reading | none useful | Not resolved |
| RO-1013 | Cold-weather charging | none | No fault |
| RO-1014 | Incomplete earlier repair | Cooling plate replaced | Resolved |
