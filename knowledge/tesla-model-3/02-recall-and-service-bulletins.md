# Recall Notices and Technical Service Bulletins: Model 3 Battery (SYNTHETIC TEST DOCUMENT)

> **SYNTHETIC TEST DATA. NOT REAL RECALLS OR BULLETINS.** Every notice below is invented to test the FixSkrew pipeline. The identifiers, dates, affected populations and remedies do not correspond to any real regulator filing or Tesla bulletin. Do not use this document to decide anything about a real vehicle. Check the vehicle manufacturer and the national road-safety authority for real recall information.

Document ID: SYN-M3-RC-001 · Applies to: Model 3 (test set, model years 2019–2023) · Language: English

## 1. How to use these notices

Each notice lists a campaign identifier (synthetic), the affected population, the defect description, the safety risk, the remedy and the way to confirm that the remedy was completed. The diagnosis assistant should cite a notice only when the vehicle's model year and variant fall inside its stated population.

---

## 2. Recall notice SYN-RC-24-001: High-voltage interlock connector latch

**Type:** Safety recall (synthetic) · **Issued:** 2024-02-12 (synthetic) · **Status:** Open

**Affected vehicles:** Model 3, model years 2019 and 2020, built in the synthetic production window of weeks 10 to 38.

**Defect.** The latch of one HV connector at the junction box may not seat fully. A connector that is partly seated can open the high-voltage interlock loop during driving or vibration.

**Symptoms reported.**
- Sudden loss of drive power with a high-voltage system warning.
- Trouble code P0A0D (interlock circuit open) stored, often with no fault found afterwards.
- The fault clears after the vehicle is restarted.

**Safety risk.** Loss of drive power while the vehicle is moving increases the risk of a crash. The pack contactors open under controlled conditions and the vehicle can usually be steered and braked, but the driver loses propulsion.

**Remedy.** Replace the HV connector retention clip, inspect the pins and apply the locking tab. Takes about 40 minutes. Free of charge.

**Check that the remedy was applied.** The campaign label is visible on the junction box cover (synthetic label "RC24-001 DONE") and the service history shows the campaign closed.

**Diagnostic note.** A vehicle with P0A0D that has not received this campaign should be inspected for it first, before the interlock loop is traced.

---

## 3. Recall notice SYN-RC-24-002: Cooling plate coolant leak

**Type:** Safety recall (synthetic) · **Issued:** 2024-06-03 (synthetic) · **Status:** Open

**Affected vehicles:** Model 3, model year 2021, long-range variant only.

**Defect.** A seal on one cooling plate coolant port may degrade early. Coolant can seep into the pack enclosure and reduce insulation resistance.

**Symptoms reported.**
- Falling coolant level with no visible leak outside the vehicle.
- Isolation fault P0AA6 after wet weather or washing.
- Reduced charging rate because the BMS restricts power as the pack temperature rises.
- A sweet smell near the front of the underbody after charging.

**Safety risk.** Coolant on the HV components can cause an isolation fault. In rare cases coolant bridging live parts can lead to a short circuit and a thermal event.

**Remedy.** Pressure-test the cooling loop. Replace the affected port seal or the whole cooling plate if the leak is confirmed. Dry and inspect the enclosure, replace the pack vent and re-test isolation.

**Owner advice (synthetic).** Check the coolant level monthly. Park outdoors and away from buildings until the campaign is done if a coolant loss is noticed.

**Diagnostic note.** A pack with P0AA6 and falling coolant level must be treated as a possible case of this recall.

---

## 4. Recall notice SYN-RC-23-007: Charge port temperature sensor wiring

**Type:** Safety recall (synthetic) · **Issued:** 2023-09-18 (synthetic) · **Status:** Closed for most vehicles, open for unrepaired ones

**Affected vehicles:** Model 3, model years 2019 to 2021.

**Defect.** A wire to the charge port temperature sensor can fatigue and break near the connector. The BMS then no longer sees the true temperature of the port.

**Symptoms.**
- Charging stops at a low rate with message about the charge port.
- P1A00 (charge port temperature too high) stored when the port is not warm.
- An overheated port that is not detected during DC fast charging in the worst case.

**Remedy.** Replace the sensor harness and re-test. A new connector is fitted at the same time.

**Diagnostic note.** If P1A00 occurs together with a cold charge port, suspect the sensor wiring before replacing the charge port.

---

## 5. Technical service bulletin SYN-TSB-24-010: Cell voltage imbalance after long-term partial charging

**Type:** Technical service bulletin, not a recall (synthetic) · **Issued:** 2024-03-20

**Affected vehicles:** Model 3, model years 2019 to 2023.

**Condition.** Packs that are always kept between about 30 % and 70 % state of charge for many months can drift out of balance, because balancing is most effective near the top of charge. Owners may see reduced range or reduced charge power near full.

**Related codes.** P0B3C (cell voltage imbalance), sometimes P0A7F (battery deterioration).

**Procedure.**
1. Confirm that the cell spread at rest is above 0.030 V.
2. Run a balancing charge: charge to 100 % at AC level and hold for 4 hours.
3. Let the pack rest for 2 hours and re-measure the spread.
4. If the spread has returned below 0.030 V, advise the owner to charge to 100 % once a month.
5. If the same cell group remains the lowest after balancing, the condition is no longer this bulletin. Treat it as a weak cell group and follow the diagnostic procedure in the service manual.

**Important.** This bulletin does not cover a spread above 0.200 V under load, or any pack with a stored P0A80. These need further diagnosis.

---

## 6. Technical service bulletin SYN-TSB-24-014: Reduced DC charging rate in cold weather

**Type:** Technical service bulletin (synthetic) · **Issued:** 2024-10-04

**Affected vehicles:** Model 3, all model years in the test set.

**Condition.** At pack temperatures below about 5 °C the BMS limits the charge power to protect the cells. Owners may report DC charging that is much slower than expected in winter.

**Information for technicians.** This is expected behaviour. Preconditioning the pack before arrival at the charger shortens the time. Check that the pack heater works before concluding that there is a fault: the pack should warm by several degrees within 10 minutes of preconditioning.

**Not a fault if:**
- the charge rate recovers as the pack warms,
- no trouble code is stored,
- the heater and pump operate normally.

**Fault if:**
- the pack does not warm during preconditioning,
- P0A81 or P0A9C is stored,
- the charge rate remains low at a pack temperature above 25 °C.

---

## 7. Technical service bulletin SYN-TSB-23-021: Contactor click noise and pre-charge delay

**Type:** Technical service bulletin (synthetic) · **Issued:** 2023-05-11

**Affected vehicles:** Model 3, model years 2019 and 2020.

**Condition.** A louder contactor noise at wake-up and a pre-charge time of 1.5 s to 2.5 s have been seen on some vehicles after more than 60,000 km. This usually indicates a worn pre-charge resistor or contactor, not an immediate fault.

**Procedure.** Measure pre-charge time. Up to 3 s is within the limit but should be monitored. Above 3 s, or any P0AE2, requires replacement of the junction box assembly.

---

## 8. Technical service bulletin SYN-TSB-24-018: Software update for state-of-health estimation

**Type:** Software campaign (synthetic) · **Issued:** 2024-08-29

**Affected vehicles:** Model 3, model years 2020 to 2023.

**Condition.** The state-of-health value displayed by the diagnostic tool may be several percentage points lower than the true usable capacity after the pack has been left at a low state of charge for a long time. The BMS firmware revision in the campaign recalculates the estimate.

**Procedure.** Update the BMS firmware, then run a full charge and a rest period of 4 hours to let the BMS relearn capacity.

**Diagnostic note.** Do not declare a pack degraded from a single state-of-health reading before the update and a relearn have been done.

---

## 9. Summary table

| Notice | Type | Affected | Main code | Main component |
|---|---|---|---|---|
| SYN-RC-24-001 | Recall | 2019–2020 | P0A0D | HV harness and junction box |
| SYN-RC-24-002 | Recall | 2021 long range | P0AA6 | Cooling plate |
| SYN-RC-23-007 | Recall | 2019–2021 | P1A00 | Charging inlet |
| SYN-TSB-24-010 | Bulletin | 2019–2023 | P0B3C | Modules and cells |
| SYN-TSB-24-014 | Bulletin | all | none | Thermal system |
| SYN-TSB-23-021 | Bulletin | 2019–2020 | P0AE2 | HV junction box |
| SYN-TSB-24-018 | Software | 2020–2023 | P0A7F | BMS |
