# Diagnostic Logs II: Model 3 Battery Cases J to R (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA.** These logs were invented to test the FixSkrew pipeline. They are not from any real vehicle. Every vehicle, VIN, reading and date is fictional. Limits quoted come from the synthetic Model 3 service manual (SYN-M3-SM-001) for the invented test pack.

Document ID: SYN-M3-LOG-002 · Language: English

Reading guide: voltages in volts (V), temperatures in degrees Celsius (°C), current in amperes (A), insulation in ohms per volt (Ω/V), state of charge (SOC) and state of health (SOH) in percent (%). "Group" means one series group of parallel cells; this test pack has 96 groups in 4 modules (groups 1 to 24 in module 1, 25 to 48 in module 2, 49 to 72 in module 3, 73 to 96 in module 4).

---

## Log J: Low pack voltage after long storage

**Vehicle:** Model 3 Long Range (synthetic), 2021, 21,800 km, VIN 5YJ3E1EA4MF000010 (fictional)
**Date:** 2025-03-10 · **Complaint:** "Car sat in a garage for five months. Now it will not drive and shows a battery warning."

### J.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0AFA | Active | Battery system voltage low |

### J.2 Pack readings at rest (vehicle asleep for 4 hours, 12 V battery charged)

| Measurement | Value | Unit |
|---|---|---|
| State of charge (BMS estimate) | 3 | % |
| Pack voltage | 276.0 | V |
| Highest cell group voltage | 2.884 (group 12, module 1) | V |
| Lowest cell group voltage | 2.822 (group 70, module 3) | V |
| Cell voltage spread | 0.062 | V |
| Pack temperature (average) | 18.0 | °C |
| Insulation resistance | 1,720 | Ω/V |
| Idle current | 0.3 | A |

### J.3 Findings
- Pack voltage 276.0 V equals the sum of the 96 group voltages within measurement error, so the sensing is consistent and the low voltage is real.
- Every group is above the 2.70 V lower limit of the cell voltage window. No group has been over-discharged below the window.
- The spread of 0.062 V is in the investigate band (0.030 V to 0.080 V), not above the action limit. A very low pack widens the spread because the voltage curve is steep at low charge.
- Insulation, temperature and idle current are normal. The long storage at a low charge is the cause. The idle current of 0.3 A over five months explains the discharge.

### J.4 Recommended
Because no group is below 2.70 V, a slow AC recovery charge is allowed. Charge at a low rate, then run a balancing charge to 100 % held for 4 hours, rest for 2 hours and re-measure the spread. Run a capacity test before judging state of health. If any group had been below 2.70 V, the pack must not be charged normally and goes to a trained specialist. Advise the owner to store the car at 30 % to 60 % charge.

---

## Log K: Current sensor drift, not a real drain

**Vehicle:** Model 3 Standard Range Plus (synthetic), 2020, 64,300 km, VIN 5YJ3E1EB5LF000011 (fictional)
**Date:** 2025-03-24 · **Complaint:** "Battery drains overnight and a warning appears sometimes."

### K.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0AC0 | Active | Battery current sensor circuit fault |

### K.2 Readings at rest (vehicle asleep for 3 hours)

| Measurement | Value | Unit |
|---|---|---|
| Pack current reported by the BMS | 2.6 | A |
| Pack current measured with a clamp meter on the HV cable | 0.1 | A |
| State of charge loss over 12 hours (logged) | 0.4 | % |
| Highest cell group voltage | 3.801 (group 33, module 2) | V |
| Lowest cell group voltage | 3.790 (group 8, module 1) | V |
| Cell voltage spread | 0.011 | V |
| Insulation resistance | 1,900 | Ω/V |

### K.3 Findings
- The BMS reports 2.6 A at rest, above the 2 A action limit, but the independent clamp meter reads 0.1 A and the charge actually lost in 12 hours is only 0.4 %. A real 2.6 A drain would remove far more.
- The 2.5 A difference is a steady offset in the pack current sensor. This is the sensor drift described for P0AC0, not a parasitic load.
- Cells, temperature and insulation are healthy.

### K.4 Recommended
Replace the HV junction box assembly, which includes the pack current sensor. Verify that the idle current reads near zero afterwards and that P0AC0 does not return.

---

## Log L: One module temperature sensor reading far off

**Vehicle:** Model 3 Long Range (synthetic), 2022, 31,900 km, VIN 5YJ3E1EA2NF000012 (fictional)
**Date:** 2025-04-08 · **Complaint:** "Battery warning on cold mornings and charging seems limited."

### L.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0A9C | Active | Battery temperature sensor range or performance fault |

### L.2 Module temperatures after a night's rest

| Module | Temperature (°C) |
|---|---|
| Module 1 | 14.1 |
| Module 2 | −12.0 |
| Module 3 | 14.4 |
| Module 4 | 14.0 |

Module temperature spread: 26.4 °C. Cell voltage spread at rest: 0.014 V. Insulation resistance: 1,780 Ω/V.

### L.3 Findings
- Three modules agree within 0.4 °C. Module 2 reads 26.4 °C lower than the rest. After a night's rest the modules should agree within 2 °C, and one sensor far from the others points to a sensor fault, not a cold module.
- A pack cannot be 14 °C in three modules and −12 °C in the fourth after resting in the same garage.
- The module 2 value makes the BMS limit charging as if the pack were very cold, which explains the limited charging.
- Cell voltages are balanced, so the cells are not the cause.

### L.4 Recommended
Inspect the module 2 temperature sensor connector and wiring for corrosion and pushed-back pins. Repair or replace the sensor wiring, clear the code and confirm that all four modules read within 2 °C after a rest.

---

## Log M: Hot modules during fast charging after a coolant service

**Vehicle:** Model 3 Performance (synthetic), 2021, 52,700 km, VIN 5YJ3E1EC3MF000013 (fictional)
**Date:** 2025-04-22 · **Complaint:** "Fast charging is slow since the coolant was changed at another workshop, and a battery warning appeared."

### M.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0B3C | Stored | Cell voltage imbalance above limit |

No thermal code is stored.

### M.2 Readings

| Measurement | Value | Unit |
|---|---|---|
| Cell voltage spread at rest (pack at 21 °C) | 0.021 | V |
| Cell voltage spread under load (hot, end of fast charge) | 0.171 | V |
| Pack temperature at the end of a DC fast charge | 53.4 | °C |
| Module temperature spread at the end of the fast charge | 7.1 | °C |
| Pump speed commanded / actual | 80 / 81 | % |
| Coolant level | 0.4 L below the mark | L |

### M.3 Findings
- Pump command and actual speed agree, so the pump works.
- The pack reached 53.4 °C, above the 52 °C action limit, and the module spread of 7.1 °C is above the 6 °C action limit. The coolant is low after the service, which points to an air lock in the cooling plate.
- The cell spread at rest is only 0.021 V (healthy). The larger spread under load occurs when the pack is hot, so the P0B3C is partly thermal and not a cell fault.
- When P0B3C appears with thermal findings, check the thermal system first and re-measure after the pack has cooled to a uniform temperature.

### M.4 Recommended
Top up the coolant and perform the coolant bleed procedure. Repeat a fast charge while logging temperatures and cell spread. Clear P0B3C and confirm it does not return. Do not replace a module.

---

## Log N: BMS fault that survives a power cycle

**Vehicle:** Model 3 Standard Range Plus (synthetic), 2019, 118,900 km, VIN 5YJ3E1EB8KF000014 (fictional)
**Date:** 2025-05-06 · **Complaint:** "Warning on the dash, the car sometimes refuses to start, then works again."

### N.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0A1F | Active | Battery energy control module (BMS) fault |

### N.2 Checks

| Check | Result |
|---|---|
| 12 V battery at wake-up | 12.6 V |
| Power cycle (12 V disconnected 10 minutes) | Code returned within 1 wake cycle |
| BMS resets logged in 24 hours | 11 |
| Cell voltage spread at rest | 0.016 V |
| Insulation resistance | 1,560 Ω/V |
| Contactor coil resistance | Within the parts-list range |

### N.3 Findings
- The 12 V supply is healthy at 12.6 V, which rules out a low-voltage reset.
- The code survived a power cycle and the BMS reset 11 times in 24 hours.
- Cells, insulation and contactors measure normal, so the fault lies in the BMS board itself.

### N.4 Recommended
Replace the BMS board (SYN-BMS-100). The new board requires coding. After coding run the capacity learning routine (full discharge, then a full charge at a low rate) and confirm that the code does not return.

---

## Log O: Reduced power on a very cold morning, no fault

**Vehicle:** Model 3 Long Range (synthetic), 2022, 27,400 km, VIN 5YJ3E1EA6NF000015 (fictional)
**Date:** 2025-01-27 · **Complaint:** "A message says power is reduced and charging is limited when I leave in the morning."

### O.1 Trouble codes
No active or stored codes.

### O.2 Readings (ambient −15 °C, vehicle parked outside overnight)

| Measurement | Value | Unit |
|---|---|---|
| Pack temperature (average) | −8.0 | °C |
| Module temperature spread | 1.4 | °C |
| State of health | 95 | % |
| Cell voltage spread at rest | 0.012 | V |
| Insulation resistance | 1,860 | Ω/V |
| Pack temperature after 20 minutes of driving | 12.0 | °C |

### O.3 Findings
- The pack is below 0 °C, where charging is limited, and power is reduced to protect the cells. The BMS behaves as designed.
- Temperature spread, cell spread, state of health and insulation are healthy and there are no codes.
- Full power returned when the pack reached 12 °C after 20 minutes of driving. No battery fault is indicated.

### O.4 Recommended
Explain cold-pack behaviour, advise preconditioning before departure and before fast charging. Note that charging must not be attempted below −20 °C pack temperature.

---

## Log P: Idle current from an aftermarket device

**Vehicle:** Model 3 Standard Range Plus (synthetic), 2020, 79,600 km, VIN 5YJ3E1EB9LF000016 (fictional)
**Date:** 2025-05-20 · **Complaint:** "I lose about 3 % charge every night while parked."

### P.1 Trouble codes
No active or stored codes.

### P.2 Readings at rest (vehicle asleep for 3 hours)

| Measurement | Value | Unit |
|---|---|---|
| Pack current reported by the BMS | 1.1 | A |
| Pack current measured with a clamp meter on the HV cable | 1.1 | A |
| Pack current after unplugging the aftermarket OBD tracker | 0.2 | A |
| Cell voltage spread at rest | 0.009 | V |
| State of health | 96 | % |

### P.3 Findings
- BMS and clamp meter agree at 1.1 A, so the sensor is correct and the drain is real. This is in the investigate band (0.5 A to 2 A).
- Unplugging an aftermarket OBD tracker from the diagnostic port brought the idle current to 0.2 A, below the 0.5 A healthy limit.
- The device draws from the 12 V system, and the DC converter supplies that from the pack, so the pack current rises.
- There is no battery or sensor fault.

### P.4 Recommended
Leave the tracker unplugged or replace it with a device that sleeps. Re-measure the idle current after a full sleep cycle.

---

## Log Q: Intermittent isolation fault after car washes

**Vehicle:** Model 3 Long Range (synthetic), 2021, 44,100 km, VIN 5YJ3E1EA1MF000017 (fictional)
**Date:** 2025-06-03 · **Complaint:** "A red high-voltage warning appears after I wash the car, and it goes away after a day."

### Q.1 Trouble codes

| Code | Status | Description |
|---|---|---|
| P0AA6 | Stored | High-voltage isolation fault |

### Q.2 Readings (two days after the last wash)

| Measurement | Value | Unit |
|---|---|---|
| Insulation resistance, whole pack | 320 | Ω/V |
| Drive units, charger, compressor, heater (each tested alone) | all above 1,500 | Ω/V |
| Charging inlet and harness | 1,800 | Ω/V |
| Pack vent membrane | Wet and clogged | |

### Q.3 Findings
- 320 Ω/V is in the investigate band (100 to 500 Ω/V), above the 100 Ω/V action limit.
- Every external branch tests above 1,500 Ω/V, so the low value belongs to the pack side, not to a drive unit or the charging inlet.
- The vent membrane is wet and clogged. A blocked vent lets moisture stay in the enclosure after washing.
- Water on the HV busbars inside the pack would have to be excluded by inspection.

### Q.4 Recommended
Inspect the service access for moisture without opening the pack. Replace the pack vent (SYN-VNT-020) and re-measure insulation after 48 hours. If water is found inside the enclosure, the pack must be removed and inspected by a trained specialist. Advise the owner against high-pressure washing of the underbody.

---

## Log R: DC fast charging will not start, AC works

**Vehicle:** Model 3 Performance (synthetic), 2022, 36,800 km, VIN 5YJ3E1EC7NF000018 (fictional)
**Date:** 2025-06-17 · **Complaint:** "Fast chargers start and stop within seconds. Home charging works fine."

### R.1 Trouble codes
No active or stored codes.

### R.2 Checks

| Check | Result |
|---|---|
| AC charge at 11 kW | Normal, full charge |
| DC session at three different fast chargers | Aborted within 10 seconds each |
| Charge port pins and latch | Clean, latch works |
| Charge port temperature | Normal |
| DC fuse resistance in the HV junction box | Open circuit |
| Pre-charge time | 0.9 s |
| Cell voltage spread at rest | 0.010 V |

### R.3 Findings
- AC works and DC does not, which points to the DC path: the DC contactors and the DC fuse.
- The DC fuse in the HV junction box measures open circuit while the pre-charge time is normal, so the contactors are fine.
- Charge port and cells are healthy.

### R.4 Recommended
Replace the DC fuse (SYN-FUS-210) after de-energising the pack. Inspect the DC cables and the charge port for the cause of the overcurrent, then repeat a DC session and confirm that it completes.
