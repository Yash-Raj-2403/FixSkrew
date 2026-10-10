# Symptom, Code and Component Cross-Reference: Model 3 HV Battery (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA.** This quick-reference was written to test the FixSkrew pipeline. It restates and combines limits from the synthetic Model 3 service manual (SYN-M3-SM-001) and is not Tesla documentation. Do not use it on a real vehicle.

Document ID: SYN-M3-XR-001 · Applies to: Model 3 test set, model years 2019–2023 · Language: English

## 1. How to use this cross-reference

Start from what the technician observed (symptom, code or measurement), find the components that can produce it, then follow the procedure in the service manual section named in the last column. A symptom lists several components on purpose: confirm with a measurement before replacing anything.

## 2. Symptom to component map

| Symptom | Components to check, most likely first | Manual section |
|---|---|---|
| Range loss only in cold weather, no codes | Pack temperature and preconditioning, tyre pressure, cabin heating use | 6.9 |
| Range loss with codes P0B3C or P0A7F | Modules and cells (weak group, sense connector), BMS balancing | 6.3 |
| Charge power drops near full | Modules and cells (cell spread), BMS limits | 6.3 |
| Slow DC charging only when the pack is cold | Thermal system (heater, coolant temperature), preconditioning | 6.7, 6.8 |
| Slow DC charging when warm, modules hot | Thermal system (pump, air lock in the cooling plate) | 6.7 |
| Red HV warning, no drive, worse after rain or washing | Pack enclosure and vent, charge-port harness, drive-unit branches (isolation, P0AA6) | 6.4 |
| Intermittent loss of drive with P0A0D | HV harness connectors and interlock loop, junction box cover latch | 6.6 |
| Clicking at wake-up, pre-charge timeout | HV junction box (pre-charge resistor, contactors), then the 12 V battery | 6.5 |
| Contactor codes after the car sat unused | 12 V battery below 11 V first, then HV junction box | 6.5 |
| Hot charge port, P1A00 | Charging inlet (pins, latch), charge-port sensor wiring | 6.8 |
| Steady non-zero pack current while asleep, P0AC0 | HV junction box current sensor | 6.6.1 |
| State of health reads low after a software update | BMS relearn cycle, then a measured capacity test | 5, 9 |

## 3. Trouble code to component map

| Code | First component to inspect | Also consider | Typical confirmation measurement |
|---|---|---|---|
| P0B3C | Modules and cells | BMS, sense connector | Cell spread at rest above 0.080 V, then a balancing charge |
| P0A7F | Modules and cells | BMS | State of health below 80 % confirmed by a capacity test |
| P0A80 | Modules and cells | none | Module or pack beyond service limits, confirmed by measurement |
| P0A0D | HV harness | HV junction box | Interlock loop resistance at the BMS connector |
| P0AA6 | Pack enclosure and HV harness | Drive units, charge port | Insulation below 100 Ω/V on one branch |
| P0AE2 | HV junction box | 12 V battery | Pre-charge time above 3 s, resistor open |
| P0ADD | HV junction box | 12 V battery | Contactor coil resistance against the parts list |
| P0ADE | HV junction box | none | Contactor stuck closed: do not re-energise |
| P0AC0 | HV junction box | BMS | Idle current offset against a clamp meter |
| P0A81 | Thermal system | HV junction box (12 V supply) | Pump command against actual speed |
| P0A9C | Modules (temperature sensor) | Thermal system | Module temperatures after a night's rest agree within 2 °C |
| P0A1F | BMS | 12 V supply | Fault persists after a power cycle and 12 V check |
| P1A00 | Charging inlet | Charge-port sensor wiring | Charge-port temperature during an AC test charge |
| P0AFA | Battery pack | Modules and cells, contactors | Pack voltage against the sum of group voltages |
| P0AFB | Battery pack | BMS sensing | Pack voltage against the sum of group voltages |

## 4. Companion codes that change the diagnosis

- **P0B3C together with P0A81 or P0A9C:** check the thermal system first. A pack with a temperature spread above 6 °C can show a voltage spread that is partly thermal. Re-measure after the pack has rested to a uniform temperature.
- **P0AA6 together with P1A00:** inspect the charging inlet and its harness before blaming the pack. A worn charge-port harness has caused an isolation fault in the repair histories.
- **P0AE2 together with a weak 12 V battery:** replace or charge the 12 V battery and clear the code before condemning the junction box.
- **P0A0D appearing only after service:** an unseated connector is the first suspect. Check that the junction box cover and every HV connector are fully latched.
- **P0A7F alone with state of health above 90 %:** do not replace modules. Compare the estimate with a measured capacity test first.

## 5. When not to replace a part

1. Never replace a module on one trouble code. Confirm the weak group with a load measurement: a drop of more than 0.150 V against its neighbours.
2. Never replace the junction box for a contactor code before checking that the 12 V supply is above 11 V.
3. Never close out a cold-weather charging complaint as a fault without a preconditioning test.
4. Never re-energise a pack with a contactor code P0ADE until the contactor has been replaced.
