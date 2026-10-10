# EV Drive System Troubleshooting Guide: Motors, Inverters, Noises and Low-Voltage Faults

General guidance for battery electric vehicles. It covers the drive unit (motor, inverter and reduction gear), noises and vibrations, power loss, regenerative braking, the DC-DC converter and 12 V system, the air-conditioning compressor and the on-board charger. Values are typical, not manufacturer-specific. Follow the maker's service documentation. High-voltage work is for trained technicians only.

## 1. Drive unit overview

- Each drive unit combines an electric motor, a power inverter and a single-speed reduction gear in one housing. A front motor drives the front axle and a rear motor drives the rear axle. Single-motor cars have only a rear drive unit or only a front drive unit.
- The inverter converts DC from the battery into three-phase AC for the motor. Orange HV cables connect the battery to the inverter, and three thick phase cables connect the inverter to the motor.
- The drive unit has its own coolant loop, a position sensor (resolver or encoder), temperature sensors and a gearbox oil or fluid fill.
- A drive unit fault can show as reduced power, a warning light, a noise or a vehicle that will not move.

## 2. Whining or humming noise from the motor

Symptoms: a high-pitched whine that rises with speed, a hum under acceleration or regeneration, or a noise that changes when lifting off the pedal.

- **Normal motor and inverter sound.** Many EVs make a mild whine from the inverter and gears. It is steady and has not changed over time. No repair is needed.
- **Reduction gear wear or low gear fluid.** A growing whine that changes with load and speed suggests worn gears or bearings, or low or degraded fluid. Check the fluid level and condition, replace the fluid at the maker's interval and have the gear set inspected.
- **Bearing wear in the motor, rear motor or front motor.** A rumble or growl that rises with speed and is present when coasting points to bearings. Lift the car and spin each wheel to feel for roughness. Replace the faulty bearing or the drive unit as the maker requires.
- **Motor mount loose or worn.** Vibration or a clunk when the torque direction changes. Inspect and tighten or replace mounts.
- **Wheel bearing or tyre noise.** These are often mistaken for a motor noise. Compare on different road surfaces, check tyre wear and spin each wheel by hand.
- **Resolver or position-sensor fault.** A rough whine with jerky torque and a warning light. A scan shows resolver or position-sensor codes.
- Always note when it occurs: under acceleration, on regenerative braking, at constant speed, when coasting or only at certain speeds. This points to the gear set, bearings or inverter.

## 3. Grinding, clunking or vibration

- **Clunk when pulling away or lifting off.** Backlash in the gears, a worn driveshaft joint, or loose motor mounts. Inspect the driveshafts and the mounts.
- **Vibration at speed.** Check tyre balance, wheel damage and driveshaft joints first, then the motor mounts.
- **Metal grinding sound.** Stop driving. It can mean a failed bearing or gear damage, which can destroy the drive unit if you continue.
- **Fluid leak under the front or rear drive unit.** Oil or coolant on the underside means a seal or hose leak. Top up only with the specified fluid and have the leak repaired.

## 4. Reduced power, limp mode and loss of drive

- **Hot motor or inverter.** Heavy loads, towing, repeated hard acceleration or a failing drive-unit coolant pump cause power limiting. Let it cool and check the coolant level and pump operation.
- **Low or cold battery.** A cold or low-charge battery limits available power. Warm the battery and charge above about 20 percent.
- **Inverter fault.** Over-current, over-temperature or gate-driver faults trigger a reduction in power or a shutdown. A scan with freeze-frame data shows the fault, and the inverter or drive unit is usually replaced.
- **Phase cable or HV connector problem.** A loose or corroded connection causes intermittent power loss. Inspect the connectors and torque them to specification.
- **12 V supply problem.** A weak 12 V battery or failing DC-DC converter can trigger drive faults (see section 7).
- **Torque sensor, pedal sensor or resolver fault.** Check the accelerator pedal sensor values with a scan tool.

## 5. Regenerative braking problems

- **Weak or no regeneration.** Normal when the battery is full or cold. Otherwise check for a battery temperature or state-of-charge limit, a brake-pedal sensor fault and an inverter fault.
- **Grabbing or inconsistent braking feel.** The hydraulic and regenerative blending can be affected by a brake-booster problem or software issue. Have the brake system scanned and the software updated.
- **Rusty or noisy brake discs.** EVs use friction brakes less, so discs can corrode. Brake firmly now and then, and clean or service the brakes as needed.

## 6. Inverter and motor warning lights

- A powertrain, drive-unit or "reduced power" warning usually stores a code. Read the codes with a scanner and record the freeze-frame data before clearing anything.
- Typical causes: over-temperature, a phase over-current, a resolver fault, a communication fault, a DC-bus voltage fault or an isolation fault in the motor or phase cables.
- An isolation fault can come from the drive unit. A technician can isolate the front motor or rear motor from the HV bus and measure the insulation resistance of each to find which branch leaks.
- Do not repeatedly restart the vehicle after an over-current or short-circuit fault.

## 7. DC-DC converter and 12 V system faults

- The DC-DC converter lowers HV battery voltage to charge the 12 V battery and run accessories while the vehicle is on.
- Symptoms of a failing DC-DC converter: the 12 V battery keeps going flat, dim lights, "12 V system" or "charging system" warnings, and random module faults while driving.
- Checks: with the vehicle ready, a healthy system reads about 13.5 to 14.5 V at the 12 V battery. A reading near or below the resting voltage means the converter is not charging.
- Also check the 12 V battery condition, the fuse and ground connections and the cable terminals. A weak 12 V battery should be replaced.
- A dead 12 V battery can leave the car unable to start even with a full HV battery.

## 8. Air-conditioning compressor and cabin heater

- The compressor is driven by HV and has its own inverter. A fault gives no cooling, a compressor warning or an isolation fault.
- No heat can be a failed HV heater, a heat-pump valve fault or low coolant. Check coolant level and any heater codes.
- Reduced range with the heater on is normal, but a sudden big drop suggests a stuck-on heater or a refrigerant leak.
- Refrigerant and HV compressor work needs a trained technician with the proper tools and oil.

## 9. On-board charger faults

- Symptoms: AC charging stops, charges very slowly or not at all, the car shows a charging system fault, or the charger overheats.
- Check with another charger and cable. If the problem follows the car, scan for on-board charger and charge-port codes.
- A failed on-board charger or charge-port communication fault usually needs replacement of the faulty unit.

## 10. Quick diagnosis table

| Symptom | First thing to check | Likely fix |
|---|---|---|
| Whine rising with speed | Gear fluid, bearings, normal inverter sound | Fluid service, bearing or gear repair |
| Rumble that rises with speed, also when coasting | Wheel bearings, motor bearings | Replace bearing |
| Clunk when pulling away | Motor mounts, driveshaft joints | Tighten or replace |
| Reduced power and a warning | Temperature, battery temperature, scan codes | Cool down, repair cooling, replace inverter if faulty |
| Intermittent loss of power | HV and phase connectors, 12 V supply | Reseat and torque connectors, fix 12 V |
| Fluid under the drive unit | Seals and hoses | Repair leak, correct fluid level |
| 12 V battery keeps going flat | DC-DC converter, parasitic drain | Test converter, replace 12 V battery |
| No cooling or heating | Compressor, HV heater, coolant | Scan and repair faulty component |
| Isolation fault light | Motor, compressor, heater, harness | Isolate branch and measure insulation |

## 11. When to call a professional

Stop driving for any grinding noise, burning smell, fluid pool, repeated over-current or isolation fault, or complete loss of drive. Tow the vehicle rather than restarting it. Give the technician the noise description, when it occurs, the speed and load, recent repairs and any fault codes.
