# Measurement to Component Guide: Model 3 HV Battery (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA.** Written to test the FixSkrew pipeline. Limits repeat the synthetic Model 3 service manual (SYN-M3-SM-001) for the invented test pack. They are not Tesla specifications and must not be used on a real vehicle.

Document ID: SYN-M3-MG-001 · Applies to: Model 3 test set, model years 2019–2023 · Language: English

## 1. Purpose

This guide connects each reading shown on the battery health dashboard to the component that produces it, the healthy range for the test pack, and what an out-of-range value suggests. A single reading never confirms a fault.

## 2. Pack readings

| Reading | Produced by | Healthy | Investigate | Action limit |
|---|---|---|---|---|
| State of charge | BMS estimate from pack voltage and current | n/a | n/a | n/a |
| State of health | BMS estimate | above 90 % | 80 % to 90 % | below 70 % |
| Pack voltage | Battery pack, measured by the BMS | Sum of the 96 group voltages | A mismatch against that sum | Mismatch with P0AFA or P0AFB |
| Pack current at rest | HV junction box current sensor | below 0.5 A | 0.5 A to 2 A | above 2 A |
| Insulation resistance | BMS isolation monitor | above 500 Ω/V | 100 to 500 Ω/V | below 100 Ω/V |

A low state of health points to the **battery modules and cells** only after a measured capacity test confirms it. A steady non-zero current while the vehicle sleeps points to the **HV junction box** current sensor or to a parasitic load.

## 3. Cell readings

| Reading | Produced by | Healthy | Investigate | Action limit |
|---|---|---|---|---|
| Cell voltage spread at rest | Modules and cells | below 0.030 V | 0.030 V to 0.080 V | above 0.080 V |
| Cell voltage spread under load | Modules and cells | below 0.120 V | 0.120 V to 0.200 V | above 0.200 V |
| Lowest group drop under load against neighbours | One cell group | under 0.150 V | n/a | above 0.150 V means high internal resistance |

A spread above the action limit with code P0B3C points first to the **battery modules and cells**, then to the **BMS** balancing circuit and the module sense connector. Run a balancing charge before judging a module.

## 4. Thermal readings

| Reading | Produced by | Healthy | Investigate | Action limit |
|---|---|---|---|---|
| Module temperature spread | Module temperature sensors | below 3 °C | 3 °C to 6 °C | above 6 °C |
| Pack temperature during DC fast charge | Cooling plate and pump | 25 °C to 45 °C | 45 °C to 52 °C | above 52 °C |
| Cold pack charge limit | BMS | charging limited below 0 °C | n/a | do not charge below −20 °C |

A large module temperature spread points to the **cooling plate and thermal system** (pump, air lock) or to a single temperature sensor (code P0A9C). Slow charging that appears only when cold is normal behaviour and calls for preconditioning, not repair.

## 5. Contactor and charge readings

| Reading | Produced by | Healthy | Investigate | Action limit |
|---|---|---|---|---|
| Pre-charge time to 95 % bus voltage | HV junction box (pre-charge resistor, contactors) | below 1.5 s | 1.5 s to 3 s | above 3 s |
| 12 V supply during wake-up | 12 V battery | above 11 V | n/a | below 11 V can cause false contactor codes |
| Charge-port temperature in a test charge | Charging inlet | no code P1A00 | rising faster than ambient | P1A00 stored |

A long pre-charge time points to the **HV junction box** (open pre-charge resistor, contactor), but check the 12 V supply first.

## 6. Reading the dashboard against this guide

1. Find the reading on the dashboard and the row for it above.
2. Note which component produces it. The component links on the dashboard open that component's details.
3. Compare the value with the healthy range for the test pack. The dashboard itself shows no warning thresholds.
4. Look for a companion reading that agrees (for example a cell spread together with P0B3C) before drawing a conclusion.
