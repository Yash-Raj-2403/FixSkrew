# Diagnostic Logs: Model 3 Battery Cases (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA.** These logs were invented to test the FixSkrew pipeline. They are not from any real vehicle. Every vehicle, VIN, reading and date is fictional.

Document ID: SYN-M3-LOG-001 · Language: English

Reading guide: voltages in volts (V), temperatures in degrees Celsius (°C), current in amperes (A), insulation in ohms per volt (Ω/V), state of charge (SOC) and state of health (SOH) in percent (%). "Group" means one series group of parallel cells; this test pack has 96 groups in 4 modules.

---

## Log A: Reduced range, balanced pack, no fault

**Vehicle:** Model 3 Long Range (synthetic), 2021, 38,200 km, VIN 5YJ3E1EA7MF000001 (fictional)
**Date:** 2025-01-14 · **Complaint:** "Range dropped by about 15 % this winter."

### A.1 Trouble codes
No active or stored codes.

### A.2 Pack readings at rest (vehicle asleep for 3 hours)

| Measurement | Value | Unit |
|---|---|---|
| State of charge | 62 | % |
| State of health | 94 | % |
| Pack voltage | 369.8 | V |
| Highest cell group voltage | 3.852 (group 41, module 2) | V |
| Lowest cell group voltage | 3.838 (group 17, module 1) | V |
| Cell voltage spread | 0.014 | V |
| Pack temperature (average) | 4.5 | °C |
| Module temperature spread | 1.2 | °C |
| Insulation resistance | 1,850 | Ω/V |
| Idle current | 0.2 | A |

### A.3 Findings
Cell spread is far below the investigation threshold, state of health is above 90 %, insulation is healthy and there are no codes. The pack temperature of 4.5 °C explains most of the reduced range: cold cells deliver less usable energy and cabin heating draws power. No battery fault is indicated by this log.

### A.4 Recommended
Explain winter range loss, advise preconditioning on the charger, check tyre pressure.

---

## Log B: Cell voltage imbalance (weak group in module 3)

**Vehicle:** Model 3 Standard Range Plus (synthetic), 2020, 96,400 km, VIN 5YJ3E1EB1LF000002 (fictional)
**Date:** 2025-02-03 · **Complaint:** "Range is down, and charging seems to stop early at the same point."

### B.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0B3C | Active | Cell voltage imbalance above limit |
| P0A7F | Stored | Battery pack deterioration |

### B.2 Pack readings at rest (after 3 hours of rest, SOC 71 %)

| Measurement | Value | Unit |
|---|---|---|
| State of health | 83 | % |
| Pack voltage | 375.2 | V |
| Highest cell group voltage | 3.911 (group 62, module 3) | V |
| Lowest cell group voltage | 3.771 (group 63, module 3) | V |
| Cell voltage spread | 0.140 | V |
| Pack temperature (average) | 21.0 | °C |
| Module temperature spread | 2.0 | °C |
| Insulation resistance | 1,640 | Ω/V |

### B.3 Balancing charge result
After a balancing charge to 100 % held for 4 hours and 2 hours of rest, the spread was re-measured at 0.126 V. Group 63 of module 3 was again the lowest.

### B.4 Load test (drive, 150 A discharge)

| Measurement | Value | Unit |
|---|---|---|
| Lowest cell group voltage under load | 3.402 (group 63) | V |
| Neighbouring groups (typical) | 3.590 | V |
| Drop of group 63 compared with neighbours | 0.188 | V |
| Cell voltage spread under load | 0.206 | V |

### B.5 Findings
- Spread at rest is 0.140 V, above the 0.080 V action limit, and did not recover after balancing. This rules out simple imbalance from partial charging.
- The same group (63, module 3) is lowest at rest and under load, and drops by 0.188 V more than its neighbours under 150 A. This points to high internal resistance in that group.
- Pack temperature is normal and insulation is healthy, so neither thermal nor isolation problems explain it.
- Sense connector check was not recorded in this log.

### B.6 Recommended
Reseat and inspect the module 3 sense connector to exclude a false reading, then re-test. If group 63 remains weak, replace module 3. Verify with a balancing charge and a load test.

---

## Log C: Isolation fault after wet weather

**Vehicle:** Model 3 Long Range (synthetic), 2021, 61,000 km, VIN 5YJ3E1EA3MF000003 (fictional)
**Date:** 2025-03-22 · **Complaint:** "Red HV warning after driving through heavy rain. Car would not drive. It worked again next day."

### C.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0AA6 | Stored (3 occurrences) | High-voltage isolation fault |

### C.2 Readings

| Measurement | Value | Unit |
|---|---|---|
| Insulation resistance, pack to chassis | 410 | Ω/V |
| Insulation resistance after 2 hours in a heated bay | 520 | Ω/V |
| Coolant level | low, 0.4 l below the maximum mark | |
| Pack temperature (average) | 19.0 | °C |
| Cell voltage spread | 0.011 | V |
| State of health | 95 | % |

### C.3 Branch test (each load disconnected in turn)

| Branch disconnected | Insulation after disconnection |
|---|---|
| Front drive unit | 415 Ω/V (no change) |
| Rear drive unit | 418 Ω/V (no change) |
| Cabin heater | 420 Ω/V (no change) |
| Air-conditioning compressor | 422 Ω/V (no change) |
| Pack alone | 425 Ω/V (still low) |

### C.4 Findings
- The loads are not the cause. The low insulation remains with the pack isolated, so the fault is inside the pack or at its connections.
- The coolant level is low without an external leak, and the fault appears after rain. This pattern matches coolant or water inside the enclosure, and also matches the symptoms of campaign SYN-RC-24-002 (cooling plate coolant leak) for a 2021 long-range vehicle.
- Cell voltage spread and state of health are normal, so the cells themselves look healthy.

### C.5 Recommended
Check whether campaign SYN-RC-24-002 has been completed. Pressure-test the cooling loop. If a leak into the enclosure is confirmed, the pack must be removed, dried and inspected by a trained specialist. Do not return the vehicle to service with insulation below 100 Ω/V. Re-measure after repair.

---

## Log D: Slow DC charging in cold weather

**Vehicle:** Model 3 Standard Range Plus (synthetic), 2022, 24,900 km, VIN 5YJ3E1EB5NF000004 (fictional)
**Date:** 2025-01-29 · **Complaint:** "Fast charging takes twice as long in winter."

### D.1 Trouble codes
None.

### D.2 Charge session log (DC fast charger, ambient −6 °C)

| Time into session (min) | Pack temp (°C) | SOC (%) | Charge power (kW) |
|---|---|---|---|
| 0 | −2.0 | 18 | 22 |
| 5 | 1.5 | 22 | 38 |
| 10 | 6.0 | 29 | 62 |
| 15 | 11.0 | 38 | 88 |
| 20 | 16.5 | 48 | 104 |
| 30 | 24.0 | 66 | 98 |

### D.3 Preconditioning test
After 10 minutes of preconditioning the pack warmed from −2.0 °C to 7.5 °C. Pump and heater commands and feedback matched.

### D.4 Findings
The charge rate recovers as the pack warms, the heater works, and there are no codes. This is normal cold-weather behaviour covered by SYN-TSB-24-014. No fault.

### D.5 Recommended
Advise navigating to the charger with preconditioning enabled.

---

## Log E: Interlock open, intermittent loss of drive

**Vehicle:** Model 3 Long Range (synthetic), 2019, 118,000 km, VIN 5YJ3E1EA9KF000005 (fictional)
**Date:** 2025-04-08 · **Complaint:** "Lost drive power twice while driving over rough road. Restarted and it was fine."

### E.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0A0D | Stored (4 occurrences) | HV system interlock circuit open |

### E.2 Freeze frame (last occurrence)

| Item | Value | Unit |
|---|---|---|
| Vehicle speed | 52 | km/h |
| Pack current at the time | 85 | A |
| Pack voltage | 351.0 | V |
| Pack temperature | 24.0 | °C |
| Cell voltage spread | 0.019 | V |
| Interlock loop resistance (when closed) | normal | |

### E.3 Findings
- The pack is healthy: normal spread and voltage, and the fault happens only over rough road.
- An intermittent open interlock under vibration is the typical effect of a poorly seated HV connector.
- The vehicle is a 2019 model, inside the population of campaign SYN-RC-24-001 (connector latch). The campaign sticker was not found on the junction box cover.

### E.4 Recommended
Apply campaign SYN-RC-24-001. Inspect junction box connector pins and latches. Clear the code and test over rough road. No battery replacement is indicated.

---

## Log F: Pack deterioration with state-of-health report

**Vehicle:** Model 3 Standard Range Plus (synthetic), 2019, 187,000 km, VIN 5YJ3E1EB0KF000006 (fictional)
**Date:** 2025-05-06 · **Complaint:** "Range keeps shrinking. Now only 220 km on a full charge."

### F.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0A7F | Active | Battery pack deterioration |

### F.2 Readings (after software update SYN-TSB-24-018 and a relearn cycle)

| Measurement | Value | Unit |
|---|---|---|
| State of health (after update) | 68 | % |
| Measured usable capacity (capacity test) | 36.8 | kWh |
| Cell voltage spread at rest | 0.021 | V |
| Cell voltage spread under load | 0.088 | V |
| Pack temperature (average) | 22.0 | °C |
| Module temperature spread | 1.4 | °C |
| Insulation resistance | 1,520 | Ω/V |

### F.3 Findings
- Spread is small at rest and under load, so the loss is not caused by a single weak group.
- State of health stayed low after the software update and relearn, and the measured capacity agrees with the reported state of health. The value is no longer attributable to an estimation error.
- The mileage and age are consistent with uniform ageing of all cells.

### F.4 Recommended
Explain that this is normal end-of-life capacity loss, not a defect. Discuss options: continue use with reduced range, or replace the pack or its modules. Document the capacity test.

---

## Log G: Pre-charge timeout and contactor fault

**Vehicle:** Model 3 Long Range (synthetic), 2019, 134,000 km, VIN 5YJ3E1EA4KF000007 (fictional)
**Date:** 2025-06-17 · **Complaint:** "Sometimes the car takes a long time to become ready, and then a loud clunk."

### G.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0AE2 | Active | Pre-charge contactor circuit fault |

### G.2 Readings

| Measurement | Value | Unit |
|---|---|---|
| 12 V battery voltage | 12.6 | V |
| Pre-charge time to 95 % bus voltage | 3.8 | s |
| Pre-charge resistor | open circuit | |
| Cell voltage spread | 0.010 | V |
| State of health | 91 | % |

### G.3 Findings
12 V supply is healthy, which rules out a false contactor fault from a weak 12 V battery. The pre-charge resistor measures open circuit and the pre-charge time of 3.8 s is above the 3 s limit. The cells and pack are healthy.

### G.4 Recommended
Replace the HV junction box assembly (includes the pre-charge resistor and contactors). Verify pre-charge time below 1.5 s after repair.

---

## Log H: Charge port overheating complaint

**Vehicle:** Model 3 Long Range (synthetic), 2020, 72,000 km, VIN 5YJ3E1EA6LF000008 (fictional)
**Date:** 2025-07-02 · **Complaint:** "Charging stops after a few minutes with a charge port message."

### H.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P1A00 | Stored | Charge port temperature too high |

### H.2 Readings during a test charge (AC, 11 kW)

| Time (min) | Charge port temp reported (°C) | Surface temp measured with IR (°C) |
|---|---|---|
| 0 | 24 | 24 |
| 3 | 88 | 26 |
| 6 | 88 | 27 |

### H.3 Findings
The reported charge port temperature jumps to 88 °C within 3 minutes while the surface temperature of the port is only 26 °C. The reported value is not credible, which points to the temperature sensor circuit or wiring. This is the condition described in recall SYN-RC-23-007 (charge port temperature sensor wiring).

### H.4 Recommended
Check campaign SYN-RC-23-007. Replace the sensor harness and connector. Do not replace the charge port before testing the sensor circuit.

---

## Log I: Several faults together (do not conclude from a single reading)

**Vehicle:** Model 3 Standard Range Plus (synthetic), 2021, 49,000 km, VIN 5YJ3E1EB8MF000009 (fictional)
**Date:** 2025-08-19 · **Complaint:** "Car limited power, then a warning, now charging is slow."

### I.1 Trouble codes

| Code | Status |
|---|---|
| P0A81 | Active |
| P0A9C | Active |
| P0B3C | Stored |

### I.2 Readings

| Measurement | Value | Unit |
|---|---|---|
| Module 1 temperature | 31.0 | °C |
| Module 2 temperature | 30.5 | °C |
| Module 3 temperature | 30.8 | °C |
| Module 4 temperature | 58.0 | °C |
| Pump command | 100 | % |
| Pump actual speed | 0 | % |
| Cell voltage spread at rest | 0.071 | V |
| State of health | 92 | % |

### I.3 Findings
- Three of the four modules agree at about 31 °C. Module 4 reports 58 °C. A reading this far from three neighbours may be a sensor fault (P0A9C) or a real hot spot. A single reading cannot decide. Measure with a contact thermometer.
- The pump is commanded to 100 % but does not turn: a pump or its circuit fault (P0A81), which would reduce cooling and explain the power limits and slow charging.
- The cell spread of 0.071 V is in the investigation band and may be a consequence of the temperature difference rather than a weak cell. Re-measure after cooling.

### I.4 Recommended
Prioritise the pump fault. Check pump fuse, connector and 12 V supply. Verify module 4 with an independent thermometer. Re-measure the cell spread after the thermal issue is repaired before concluding that a module is bad.
