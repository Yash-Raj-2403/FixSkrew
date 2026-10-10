# High-Voltage Battery System Service Manual: Model 3 (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA. NOT AN OFFICIAL TESLA DOCUMENT.** This manual was written to test the FixSkrew retrieval and diagnosis pipeline. It is not published by, endorsed by or derived from Tesla, Inc. Values, part names, procedures and thresholds are illustrative and must never be used to service a real vehicle. Use the manufacturer's current service documentation for real work.

Document ID: SYN-M3-HVB-SM-001 · Revision: A · Applies to: Model 3 (test set, model years 2019–2023) · Language: English

## 1. Scope and safety

This manual describes the diagnosis and service of the high-voltage (HV) traction battery system of the test vehicle: the pack enclosure, battery modules and cells, the battery management system (BMS), the thermal management loop, the HV junction box with contactors, the HV harness and the charging inlet.

Work on the HV system may only be carried out by technicians trained in high-voltage safety. A pack that appears switched off can still hold lethal voltage internally.

### 1.1 Mandatory safety practice

- Wear insulated Class 0 gloves rated for 1000 V with leather protectors, a face shield and no metal jewellery.
- Remove the service key or disconnect the 12 V supply, then follow the HV de-energisation procedure in section 3 before touching any orange HV cable or the pack.
- Verify absence of voltage with a CAT III 1000 V meter at the test points. Test the meter on a known source before and after.
- Never work alone on an opened pack. A second trained person must stay within sight and know the emergency isolation procedure.
- Keep a Class D or lithium-rated extinguisher and a thermal blanket available when a damaged pack is handled.
- A pack that is hot to the touch, venting, smoking or smelling of electrolyte is an emergency. Move people away, do not charge it, and follow section 11.

### 1.2 Warning symbols used

- **WARNING** risk of death or serious injury (HV, fire, chemical).
- **CAUTION** risk of equipment damage or loss of data.
- **NOTE** information that avoids misdiagnosis.

## 2. System description

### 2.1 Pack layout (test vehicle)

The traction battery is a floor-mounted, sealed pack under the cabin between the axles. In this test set the pack is described as follows. Real vehicles differ by market, year and variant, so confirm the configuration on the pack label.

| Item | Value in this test set |
|---|---|
| Modules | 4 modules |
| Cell arrangement | 96 series groups of parallel cells (96S) |
| Nominal pack voltage | about 355 V |
| Operating voltage window | about 260 V (empty) to 403 V (full) |
| Nominal cell voltage | 3.7 V |
| Cell voltage window | 2.70 V to 4.20 V |
| Cooling | liquid, serpentine cooling plate under the modules |
| Coolant | 50/50 glycol-water mix, Class G-48 equivalent |
| Contactors | main positive, main negative, pre-charge with resistor |
| Isolation monitoring | continuous, performed by the BMS |

### 2.2 Components and their roles

- **Pack enclosure (BP-01).** Seals the pack against water and dust, provides crash protection and carries the pressure-equalisation vent. Damage, seal failure or moisture ingress can cause isolation faults.
- **Modules and cells (M-01 to M-04).** Each module contains series groups of parallel cells. Each group has a voltage-sense wire and each module carries temperature sensors.
- **Battery management system (BMS-01).** Measures every series-group voltage, module temperatures, pack current and isolation resistance. It balances cells, limits charge and discharge power, controls the contactors and logs faults.
- **Thermal system (CP-01).** A cooling plate under the modules, coolant pump, valves and a heater. It keeps the pack inside its temperature window during driving, fast charging and cold starts.
- **HV junction box (HVJ-01).** Houses the main contactors, pre-charge contactor and resistor, the pack current sensor and fuses.
- **HV harness (HVH-01).** Orange cables linking the pack, drive units, onboard charger and charging inlet. Includes the high-voltage interlock loop (HVIL).
- **Charging inlet (CI-01).** Accepts AC and DC charging and carries the charge-port temperature sensors and latch.

### 2.3 Normal operating sequence

1. **Wake-up.** The BMS wakes, runs self-checks (sensor plausibility, isolation test) and reports ready.
2. **Pre-charge.** The negative and pre-charge contactors close. Bus voltage must reach at least 95 % of pack voltage within the allowed time.
3. **Drive.** The main positive contactor closes and the pre-charge contactor opens. The BMS sets power limits from temperature, state of charge and cell spread.
4. **Charge.** The BMS requests current from the charger, tapering as the highest cell approaches 4.20 V.
5. **Shutdown.** Contactors open under controlled current. Isolation is checked again.

## 3. HV de-energisation procedure

Carry out every step in order and record the time and technician on the work order.

1. Park the vehicle, switch it off, remove the key fob from the cabin and vehicle surroundings by at least 5 m.
2. Disconnect the charging cable and wait until the charge port latch is released.
3. Open the service access, disconnect the 12 V battery negative terminal and wait at least 10 minutes. This allows the HV bus capacitors to discharge.
4. Remove the service disconnect (manual service plug) from the pack if fitted. Store it in your pocket or a locked box.
5. Remove the cover of the HV junction box. Measure DC voltage across the main positive and main negative terminals. Proceed only if the reading is below 5 V DC.
6. Measure voltage between each HV terminal and chassis ground. Both readings must be below 5 V DC.
7. Fit "HV work in progress" signage and lock out the vehicle.

**WARNING:** Do not assume the vehicle is dead because the dashboard is dark. Always measure.

## 4. Diagnostic trouble codes

The BMS stores trouble codes in the standard five-character format. The codes below are the ones used in this test set. Descriptions follow the SAE generic meaning where one exists. Manufacturer-specific meanings may differ on a real vehicle.

| Code | Meaning | Typical component |
|---|---|---|
| P0A7F | Battery pack deterioration (capacity or resistance outside expected range) | Modules and cells, BMS |
| P0A80 | Replace battery pack (module or pack beyond service limits) | Modules and cells |
| P0A0D | High-voltage system interlock circuit open | HV harness, junction box |
| P0AFA | Battery system voltage low | Pack, cells, contactors |
| P0AFB | Battery system voltage high | Pack, BMS sensing |
| P0AC0 | Battery current sensor circuit fault | HV junction box |
| P0A1F | Battery energy control module (BMS) fault | BMS |
| P0A81 | Battery pack cooling fan or pump circuit fault | Thermal system |
| P0A9C | Battery temperature sensor range or performance fault | Modules, thermal system |
| P0AA6 | High-voltage isolation fault | Pack enclosure, harness, drive units |
| P0AE2 | Pre-charge contactor circuit fault | HV junction box |
| P0ADD | Positive contactor stuck open | HV junction box |
| P0ADE | Positive contactor stuck closed | HV junction box |
| P0B3C | Cell voltage imbalance above limit | Modules and cells, BMS |
| P1A00 | Charge port temperature too high | Charging inlet |

**NOTE:** A single code is a starting point, not a conclusion. Always read the freeze-frame data stored with the code, check for companion codes and confirm the fault with a measurement before replacing parts.

## 5. Reference measurements and limits

The limits below belong to the synthetic test pack. They show how the diagnosis should be reasoned and how measurements are compared with documented values.

| Measurement | Healthy range | Investigate | Action limit |
|---|---|---|---|
| Cell voltage spread at rest (max cell minus min cell) | below 0.030 V | 0.030 V to 0.080 V | above 0.080 V |
| Cell voltage spread under load | below 0.120 V | 0.120 V to 0.200 V | above 0.200 V |
| Module temperature spread | below 3 °C | 3 °C to 6 °C | above 6 °C |
| Pack temperature during DC fast charge | 25 °C to 45 °C | 45 °C to 52 °C | above 52 °C |
| Cold pack, charge limited below | 0 °C | n/a | do not charge below −20 °C |
| Insulation resistance (pack to chassis) | above 500 Ω/V | 100 to 500 Ω/V | below 100 Ω/V |
| Pre-charge time to 95 % bus voltage | below 1.5 s | 1.5 s to 3 s | above 3 s |
| State of health | above 90 % | 80 % to 90 % | below 70 % |
| Idle current draw (vehicle asleep) | below 0.5 A at the pack | 0.5 A to 2 A | above 2 A |

**NOTE:** State of health is an estimate computed by the BMS. Compare it with a measured capacity test before concluding that the pack is degraded.

## 6. Diagnostic procedures

### 6.1 General approach

1. Record the complaint exactly: when it occurs, driving or charging, hot or cold, state of charge, warning messages.
2. Read all trouble codes and freeze-frame data. Save the log.
3. Check for open service campaigns and recall notices for the vehicle's VIN.
4. Inspect visually (section 6.2).
5. Compare readings against section 5.
6. Isolate the fault with the relevant procedure below.
7. Repair, clear codes, run a verification drive or charge cycle and record the outcome.

### 6.2 Visual inspection

With the pack de-energised, check the following:

- Underbody shield damage, scrapes, dents or deformation of the enclosure.
- Coolant residue, crystals or drips at the coolant connections and the cooling plate edges.
- Corrosion or discolouration at HV connectors and contactor terminals.
- Harness chafing, pinched cables and damaged orange conduit.
- Condensation inside the enclosure vent or signs of water ingress.

### 6.3 Cell voltage imbalance (P0B3C, P0A7F)

**Symptoms:** reduced range, reduced charge power near full, reduced power at low state of charge, message about reduced performance.

**Likely causes**

1. A weak cell group with higher self-discharge or higher internal resistance.
2. Balancing circuit failure on one module.
3. A poor voltage-sense connection producing a false reading.
4. A pack that has not been balanced for a long time (always charged to a partial level).

**Procedure**

1. Bring the pack to between 50 % and 80 % state of charge and let it rest for at least 2 hours.
2. Read all 96 group voltages and record the highest and lowest group and their module.
3. Compute the spread. If it is below 0.030 V, the pack is balanced and the complaint lies elsewhere.
4. If the spread is above 0.080 V, run a balancing charge: charge to 100 % on AC at a low rate and hold for 4 hours, then repeat the rest and re-read.
5. If the same group is always the lowest, measure its voltage under load. A group that drops more than 0.150 V compared with its neighbours under the same load has high internal resistance.
6. Check the sense connector of that module for corrosion or looseness. A false low reading often clears when the connector is reseated.
7. If the weak group is confirmed with a measurement, the module needs replacement. Do not replace a module based on a single trouble code.

### 6.4 Isolation fault (P0AA6)

**Symptoms:** red warning about the high-voltage system, no drive, no charging, intermittent fault in rain or after washing.

1. De-energise (section 3).
2. Disconnect the drive units, onboard charger, compressor and heater from the pack, one at a time, re-test each time to find the branch with low resistance.
3. Measure insulation between each HV conductor and chassis with a 500 V insulation tester. Record readings in Ω/V.
4. Inspect the pack vent, enclosure seals and charging inlet for water.
5. A branch below 100 Ω/V is faulty. Water in the pack enclosure requires pack removal and inspection by a trained specialist.

### 6.5 Contactor and pre-charge faults (P0AE2, P0ADD, P0ADE)

1. Check the 12 V supply. A weak 12 V battery below 11 V can produce false contactor faults.
2. Listen for the contactor click when the vehicle wakes.
3. With the pack de-energised, measure contactor coil resistance against the table in the junction box parts list.
4. Measure the pre-charge resistor. An open resistor gives a pre-charge timeout.
5. A contactor stuck closed is a safety condition. Do not re-energise the pack until the contactor is replaced.

### 6.6 High-voltage interlock (P0A0D)

1. The interlock is a low-voltage loop through the HV connectors. Any unseated connector breaks it.
2. Check that every HV connector and the junction box cover are fully latched.
3. Measure loop resistance at the BMS connector. A reading far above the nominal loop resistance points to a bad connector pin.
4. Inspect connector pins for pushed-back terminals or corrosion.

### 6.6.1 Current sensor fault (P0AC0)

1. Read pack current with the vehicle asleep. It should be near zero. A steady non-zero offset indicates sensor drift.
2. Compare the sensor reading with a clamp meter on the HV cable during a controlled load.
3. Replace the junction box assembly if the offset exceeds the sensor tolerance in the parts list.

### 6.7 Thermal faults (P0A81, P0A9C, high temperature charge limits)

1. Check coolant level and look for leaks at the pack connections.
2. Run the pump from the diagnostic tool and listen for flow. Compare pump speed command and actual speed.
3. Compare module temperatures after a night's rest. They should agree within 2 °C. A single sensor far from the rest suggests a sensor fault. All sensors reading low or high together suggest the pack is genuinely cold or hot.
4. A cooling plate with an air lock gives hot modules during fast charging. Perform the coolant bleed procedure.
5. A heater that fails to switch on gives slow charging in cold weather.

### 6.8 Charging problems

1. Check the charge port for debris, pin damage and latch operation.
2. Read charge port temperatures. A hot charge port (P1A00) points to a poor connection or a worn cable.
3. Compare AC and DC behaviour. If AC works and DC does not, check the DC contactors and the DC fuse.
4. A pack that charges slowly only when cold is behaving normally. Allow preconditioning.

### 6.9 Range loss complaints

Range loss alone is not a fault. Before opening the pack:

1. Compare state of health with the odometer and the age of the pack.
2. Check tyre pressure, alignment, cabin heating use and driving style.
3. Run a full-range test with a logged trip.
4. Look for cell imbalance (6.3). An unbalanced pack shows less usable energy.
5. Check for software campaigns that adjust range estimation.

## 7. Parts and service items (test numbering)

| Item | Part no. (synthetic) | Notes |
|---|---|---|
| Module M-01 to M-04 | SYN-MOD-0X | Replace only with a module of the same revision |
| BMS board | SYN-BMS-100 | Requires coding after replacement |
| HV junction box assembly | SYN-HVJ-200 | Includes contactors and current sensor |
| Cooling plate | SYN-CP-300 | Replace with seals |
| Coolant pump | SYN-PMP-310 | |
| Pack vent | SYN-VNT-020 | Replace when the membrane is wet or clogged |
| Charge port assembly | SYN-CIN-400 | |

## 8. Post-repair verification

1. Clear trouble codes and confirm they do not return after a full wake cycle.
2. Run a balancing charge to 100 % if any cell-level work was done.
3. Perform a drive cycle with a hill climb and a fast charge session while logging cell voltage and temperature.
4. Re-measure isolation after the cycle.
5. Record before and after readings on the repair order.

## 9. Software and calibration

- Keep the BMS firmware at the revision listed in the current service bulletin for the vehicle.
- After BMS or module replacement, run the capacity learning routine: a full discharge to the lower limit, then a full charge at a low rate.
- Never edit calibration values to hide a fault. A calibration change must be documented by a service bulletin.

## 10. Storage and transport of the pack

- Store at 30 % to 60 % state of charge, indoors, between 5 °C and 25 °C.
- Do not stack packs. Keep them on a non-conductive surface.
- A pack with a damaged enclosure is shipped as damaged-critical goods in a dedicated container.

## 11. Thermal event response

A pack in thermal runaway may vent flammable gas and reach very high temperatures.

1. Evacuate people and call the emergency services. Say that the vehicle is an electric vehicle with a lithium-ion battery.
2. Do not attempt to open or move the pack.
3. Use large quantities of water, applied from a distance, only under fire service direction.
4. After the event, quarantine the vehicle in an open area at least 15 m from buildings for at least 48 hours. Re-ignition can occur.

## 12. Appendix A: Quick reference

| Complaint | First check |
|---|---|
| Reduced range | Cell spread and state of health, then driving conditions |
| Reduced power in cold | Pack temperature, heater operation |
| Slow DC charging | Pack temperature, charge port temperature, DC contactors |
| HV warning, no drive | Trouble codes, HVIL, isolation, 12 V battery |
| Charging stops at the same level every time | A weak group, cell spread near the top of charge |

## 13. Appendix B: Document history

| Rev | Change |
|---|---|
| A | First release of the synthetic test manual |
