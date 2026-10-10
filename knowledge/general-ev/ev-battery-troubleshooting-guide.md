# EV Battery Troubleshooting Guide: Common Problems and Solutions

General guidance for battery electric vehicles (BEVs) with lithium-ion traction batteries. It covers symptoms owners and technicians report, likely causes, checks and fixes. Values are typical, not manufacturer-specific. Always follow the vehicle maker's service documentation. Work on high-voltage (HV) systems is for trained technicians only.

## 1. Safety first

- The traction battery runs at roughly 300 to 800 V DC. HV cables are orange. A vehicle that is "off" can still hold dangerous voltage inside the pack.
- Owners should not open the pack, cut orange cables or probe HV connectors. Technicians must wear Class 0 insulated gloves, de-energise the system, wait the specified discharge time and verify zero volts before work.
- Stop driving and call a professional if there is smoke, a burning or sweet chemical smell, hissing, visible swelling, fluid leaking under the pack, or a "stop safely now" warning. Park outdoors away from buildings, keep people clear and call emergency services if there is fire or venting.
- Do not charge a pack that is damaged, flooded or was hit from underneath. Have it inspected first.

## 2. Reduced driving range

Symptoms: range is lower than usual, the percentage drops faster than expected, or the range estimate swings.

Likely causes and solutions:

- **Cold weather.** Cold cells have higher internal resistance and the cabin heater draws power. Range loss of 20 to 40 percent at freezing temperatures is normal. Solutions: precondition the cabin and battery while plugged in, use seat and steering-wheel heaters instead of full cabin heat, park in a garage, and keep the battery above about 10 percent.
- **Driving style and load.** High speed, hard acceleration, roof racks, trailers, underinflated tyres and headwinds all raise consumption. Solutions: check tyre pressure monthly, remove roof boxes, use eco mode and regenerative braking.
- **Battery ageing.** Capacity falls slowly with years and cycles. A loss of 1 to 3 percent per year is typical. Check the state of health (SoH) in the vehicle menu, a diagnostic app or a dealer report. Many makers warrant 70 percent capacity for 8 years or 160,000 km.
- **Imbalanced cells or a stale estimate.** The displayed range can be wrong after long storage or always charging to a narrow band. Solution: perform one full charge to 100 percent, then drive down to about 20 percent so the battery management system (BMS) can recalibrate. Do this occasionally, not routinely.
- **Dragging brakes, wheel bearing or alignment problems.** These waste energy. Have them checked if consumption rose suddenly with no change in conditions.
- **Parasitic drain.** Sentry or cabin-overheat modes, a faulty module that stays awake, or an aftermarket device can drain 1 to 3 percent or more per day. Solution: disable the always-on features, remove aftermarket devices and have the vehicle scanned for modules that do not sleep.

## 3. Slow charging or charging stops early

Symptoms: AC charging takes far longer than rated, DC fast charging runs at a low power, or a session stops after a few minutes.

- **Charger or cable limit.** Public chargers share power between connectors, and cheap or damaged cables derate. Try a different charger or cable and check the charger's rated output.
- **Vehicle on-board charger (OBC) limit.** The OBC may be only 7 to 11 kW. A 22 kW AC point will not charge faster than that. This is normal.
- **Battery temperature.** A cold battery cannot accept fast charge, and a very hot battery is throttled. Solutions: navigate to the charger using the in-car route planner so the battery preconditions, and allow time between back-to-back fast charges.
- **High state of charge.** Charging power tapers above about 80 percent by design. Unplugging at 80 percent is usually faster overall.
- **Charge limit set low.** Check the charge limit and schedule in the app or on the touchscreen.
- **Dirty or damaged charge port.** Check the inlet for debris, water, bent pins or burn marks. Do not use a port that smells burnt or is discoloured. Have it repaired.
- **Home supply issues.** Loose breaker, undersized wiring or voltage drop makes the vehicle lower its current. Have an electrician check the circuit and the socket temperature. A warm plug or socket is a warning sign.
- **Software or communication faults.** Charger and vehicle failing the handshake leads to repeated aborts. Try another charger, lock and unlock the vehicle, reset the charge session and install pending software updates.

## 4. Vehicle will not charge at all

- Confirm the charger shows power and that the cable is fully seated and latched. Unlock the vehicle if the charge port is locked.
- Check that the charge port flap opens and the LED or status light on the port. A red or amber light usually means a fault, and the vehicle's message gives the detail.
- Test with another charger and another cable to isolate the fault.
- Check that scheduled charging or a departure timer is not delaying the start.
- A weak 12 V battery can block charging because the contactors and control modules need 12 V. Solution: test the 12 V battery and jump or replace it (see section 7).
- Ground fault or residual-current trips at home. Disconnect other loads, and if the breaker keeps tripping, have an electrician test the wiring and the vehicle's isolation resistance.
- If the vehicle shows an HV system or isolation fault, do not keep retrying. See section 9.

## 5. Battery overheating or thermal warnings

Symptoms: a high battery temperature warning, power limited, charging slowed, cooling fan or pump running loudly after parking.

- **Hot weather plus fast charging or hard driving.** Allow the pack to cool, park in shade, use the preconditioning cooling and reduce repeated fast charges.
- **Low coolant or air in the loop.** Check the coolant level only on a cool vehicle and with the correct coolant type. Air after a coolant service causes hot spots and needs a vacuum fill or the maker's bleed routine.
- **Failed coolant pump, valve or heater.** Listen for the pump at start-up. A diagnostic scan shows pump and valve faults. Replace the faulty part.
- **Blocked radiator or chiller.** Clean debris from the front radiator. A refrigerant leak weakens the chiller, so have the air-conditioning system tested.
- **Coolant leak into the pack.** Falling coolant level with no visible leak, a sweet smell or an isolation fault suggests a leak at the cooling plate. Stop driving and arrange a tow.
- **Internal cell fault.** One module much hotter than others at rest points to an internal short or high resistance. Treat as serious (section 1) and have a technician inspect.

## 6. Cold weather problems

- Reduced range and power, slow regenerative braking and a limited-regen message at low battery temperature are normal until the pack warms.
- Charge soon after driving while the pack is still warm. Fast charging a frozen pack is slow or blocked.
- Precondition while plugged in. Use the scheduled departure feature.
- Do not leave the vehicle for weeks at a very low charge in freezing temperatures.
- A heater fault (PTC heater or heat pump) can cause very poor cold range. A scan shows heater errors.

## 7. 12 V battery problems (a very common cause of "dead EV")

Symptoms: vehicle will not wake, dashboard dark or flickering, "12 V battery low" or "unable to start" messages, random warnings, charging refused, HV contactors will not close.

- The 12 V battery powers the computers, locks and contactors. If it is weak, the high-voltage pack cannot connect even when full.
- Test the 12 V battery with a multimeter. Resting voltage under about 12.0 V is low, and under about 11.5 V is likely failing. A load test is more reliable.
- Solutions: charge or jump-start the 12 V battery using the maker's jump points, and replace the battery if it fails a test. Typical life is 3 to 5 years.
- If the 12 V battery keeps dying, look for parasitic drain, a faulty DC-DC converter, or a door, trunk or sensor that keeps modules awake.
- After replacing the 12 V battery, some vehicles need a battery registration or reset and a software check.

## 8. State of charge and state of health inaccuracies

- The percentage jumps, sticks or the vehicle shuts down at 10 to 15 percent: the BMS estimate has drifted or a weak cell group is collapsing under load.
- Solutions: update the software, perform a full charge-and-discharge calibration cycle, then check cell voltages with a diagnostic tool.
- A large spread between the highest and lowest cell group (for example over about 100 mV at rest, or over about 200 mV under load) points to an imbalanced or weak cell group. Cell balancing by a long charge to 100 percent or a dealer balancing routine may fix mild cases. A weak module may need replacing.
- A sudden SoH drop after a software update is often a recalculation. Compare with a second tool before assuming damage.

## 9. Warning lights and HV system faults

- **Isolation or insulation fault.** The HV system has a leak to chassis. Causes: water ingress, pressure washing, a damaged harness, a failing heater or compressor, or a coolant leak. Solutions: keep the vehicle dry, let it dry out for a day, and have a technician measure isolation resistance on each HV component to locate the leak. A common limit is 500 ohm per volt.
- **HVIL (interlock) fault.** A connector or cover is not seated or a wire is broken. Inspect the service disconnect, charge port and component connectors.
- **Contactor or pre-charge fault.** Welded or sticking contactors, a weak 12 V battery, or a faulty pre-charge resistor. Check 12 V first, then scan the junction box.
- **Over-current or short-circuit.** Stop and tow. Do not retry.
- **Battery low-voltage or cell-imbalance codes.** See section 8.
- **Limp mode (reduced power).** Triggered by high temperature, low cell voltage, low state of charge in cold, or a sensor fault. Reduce load, allow the pack to rest and read the stored fault codes.
- Always read the diagnostic trouble codes (DTCs) with a compatible scanner and record freeze-frame data before clearing anything.

## 10. Battery degradation and how to slow it

- Keep the daily charge limit at 70 to 80 percent unless a long trip needs more. Charge to 100 percent just before departing.
- Avoid leaving the vehicle at 0 to 10 percent or at 100 percent for long periods.
- Prefer AC charging for daily use. Use DC fast charging mostly for trips.
- Avoid parking in extreme heat at a high state of charge.
- For storage longer than a month, leave the battery at about 50 to 60 percent in a cool, dry place and check it every few weeks.
- Keep software updated, since battery management improves over time.

## 11. Water, flood and physical damage

- After a flood, a deep-water crossing, an underbody impact or a pressure wash aimed at the pack, do not charge or start the vehicle until it is inspected.
- Signs of pack damage: dents or cracks in the pack housing, coolant or fluid under the car, burning smell, a warning for isolation fault.
- Salt water is especially damaging, because corrosion can appear later. Report the event to the maker or insurer and ask for an HV inspection even if the vehicle seems fine.
- Do not repair a punctured or deformed pack. It needs to be replaced or professionally refurbished and quarantined according to the maker's procedure.

## 12. Software, recalls and warranty

- Check for open recalls and service bulletins using the VIN on the maker's website or at the dealer. Many battery fire-risk issues were resolved with software limits or module replacement under recall.
- Keep the vehicle on the latest software. Many charging, range-estimate and thermal issues are fixed this way.
- Battery capacity warranties usually cover a minimum SoH (often 70 percent) for 8 years or a set distance. Get a battery health report in writing before the warranty ends.
- Keep service records, since aftermarket modifications and unsupported repairs can void coverage.

## 13. Quick diagnosis table

| Symptom | First thing to check | Likely fix |
|---|---|---|
| Range suddenly low | Weather, tyre pressure, preconditioning, cabin heater | Precondition, correct tyres, drive more gently |
| Range falls slowly over years | State of health | Normal ageing, charge habits, warranty claim if below limit |
| Slow AC charging | Charger/cable, OBC limit, charge limit setting | Different charger, check current setting |
| Slow DC charging | Battery temperature, state of charge over 80 percent | Precondition via navigation, charge from lower SoC |
| Will not charge | Cable seated, 12 V battery, schedule | Replace or charge 12 V, try another charger |
| Battery too hot warning | Coolant level, pump, radiator | Cool down, service the cooling loop |
| Dead vehicle, full battery | 12 V battery | Jump-start and replace 12 V |
| Isolation fault light | Water, wash, harness damage | Dry out, locate leak with isolation tester |
| Percentage jumps or sudden shutdown | Cell imbalance, SoC calibration | Calibration cycle, balance cells, replace weak module |
| Drain while parked | Sentry or cabin-overheat modes, devices | Switch off features, scan modules |
| Burning smell, smoke, swelling | Emergency | Stop, move away, call emergency services |

## 14. When to call a professional

Call a qualified EV technician or tow the vehicle for any isolation fault that returns, coolant loss, pack damage, repeated contactor or HVIL faults, large cell-voltage spread, overheating that returns after cooling, or any sign of swelling, smoke or smell. Give them the symptoms, when they started, recent events (flood, impact, wash, software update, coolant service) and any fault codes.
