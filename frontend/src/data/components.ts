/**
 * Component catalog for the interactive vehicle. IDs match backend/src/catalog.ts and the
 * `components` metadata tag on knowledge-base chunks.
 *
 * Descriptions are general engineering explanations of what each system does. They contain
 * no vehicle-specific specifications on purpose: capacities, voltages, part numbers and
 * procedures must come from the connected knowledge base, which the UI queries per component.
 */
export type ComponentId =
  | "body-structure"
  | "battery-pack"
  | "battery-modules"
  | "bms"
  | "cooling-plate"
  | "hv-harness"
  | "hv-junction-box"
  | "front-motor"
  | "rear-motor"
  | "charging-port"
  | "chassis";

export interface VehicleComponent {
  id: ComponentId;
  name: string;
  short: string;
  subtitle?: string;
  function: string;
  diagnosticRelevance: string[];
  highVoltage: boolean;
  /** Scroll phase in which the component's label appears. */
  revealPhase: "body" | "battery";
}

export const COMPONENTS: VehicleComponent[] = [
  {
    id: "battery-pack",
    name: "High-Voltage Battery Pack",
    short: "Battery Pack",
    subtitle: "Floor-mounted enclosure",
    function:
      "Stores the energy used for propulsion. In most modern EVs the sealed enclosure sits flat under the cabin floor between the axles and houses the cell modules, monitoring electronics and liquid cooling.",
    diagnosticRelevance: [
      "Enclosure damage, seal failure or moisture ingress can trigger isolation faults.",
      "Capacity, voltage and pack configuration vary by vehicle, market and model year; confirm them from the vehicle label or service documentation.",
    ],
    highVoltage: true,
    revealPhase: "battery",
  },
  {
    id: "battery-modules",
    name: "Battery Modules & Cells",
    short: "Modules & Cells",
    subtitle: "Series-connected cell groups",
    function:
      "Lithium-ion cells are grouped into modules and connected in series to build pack voltage. Each module carries voltage-sense and temperature-sense connections back to the monitoring electronics.",
    diagnosticRelevance: [
      "Cell voltage imbalance or a single outlier cell can limit power and charge acceptance.",
      "Abnormal temperature spread between modules points toward cooling or contact-resistance issues.",
    ],
    highVoltage: true,
    revealPhase: "battery",
  },
  {
    id: "bms",
    name: "Battery Management System",
    short: "BMS",
    subtitle: "Battery Management System",
    function:
      "Measures cell voltages, temperatures and pack current, estimates state of charge and state of health, manages cell balancing, monitors insulation resistance and commands the main relays. It reports to other controllers over the vehicle network.",
    diagnosticRelevance: [
      "Most battery-related DTCs originate from BMS monitoring; freeze-frame data shows the conditions at the time of the fault.",
      "Sensor or communication faults can look like cell faults; verify readings before condemning hardware.",
    ],
    highVoltage: true,
    revealPhase: "battery",
  },
  {
    id: "cooling-plate",
    name: "Thermal Management",
    short: "Thermal Management",
    subtitle: "Liquid cooling plate",
    function:
      "Coolant circulates through a plate beneath the modules to remove heat during fast charging and high load and to condition the pack in cold weather. It is part of the vehicle-level thermal management loop.",
    diagnosticRelevance: [
      "Low coolant, pump faults or blocked passages lead to high pack temperatures and derated charging.",
      "Coolant leaks inside or near the enclosure can cause isolation-resistance faults.",
    ],
    highVoltage: false,
    revealPhase: "battery",
  },
  {
    id: "hv-junction-box",
    name: "Power Relay & HV Junction",
    short: "Power Relay Assembly",
    subtitle: "Relays, pre-charge, fuses",
    function:
      "Connects and disconnects the pack from the vehicle's high-voltage bus. It typically contains the main relays, a pre-charge circuit that limits inrush current, current sensing and high-voltage fuses.",
    diagnosticRelevance: [
      "Pre-charge failures or welded relays prevent the vehicle from entering ready mode.",
      "Relay diagnostics are reported through the BMS; check the related DTCs and freeze-frame data.",
    ],
    highVoltage: true,
    revealPhase: "battery",
  },
  {
    id: "hv-harness",
    name: "High-Voltage Harness",
    short: "HV Harness",
    subtitle: "Orange-sheathed cabling",
    function:
      "Carries high-voltage DC between the pack, inverters, on-board charger and auxiliary high-voltage loads. Orange sheathing identifies high-voltage conductors.",
    diagnosticRelevance: [
      "Chafed insulation or connector damage can cause isolation faults or intermittent power loss.",
      "Always follow the documented isolation and verification procedure before touching high-voltage connectors.",
    ],
    highVoltage: true,
    revealPhase: "battery",
  },
  {
    id: "front-motor",
    name: "Front Drive Motor & Inverter",
    short: "Front Motor",
    subtitle: "Dual-motor layouts",
    function:
      "Converts high-voltage DC to AC through an inverter and drives the front axle. Many dual-motor all-wheel-drive EVs use one; some vehicles drive the front axle only.",
    diagnosticRelevance: [
      "Inverter faults can surface as reduced power or high-voltage system warnings rather than motor faults.",
    ],
    highVoltage: true,
    revealPhase: "body",
  },
  {
    id: "rear-motor",
    name: "Rear Drive Motor & Inverter",
    short: "Rear Motor",
    subtitle: "Rear axle drive",
    function:
      "Converts high-voltage DC to AC and drives the rear axle. On many rear-wheel-drive EVs it is the only drive unit.",
    diagnosticRelevance: ["Motor temperature and inverter faults can lead to power limiting."],
    highVoltage: true,
    revealPhase: "body",
  },
  {
    id: "charging-port",
    name: "Charging Inlet",
    short: "Charging Inlet",
    subtitle: "AC / DC inlet",
    function:
      "Accepts AC and DC charging connectors and carries the communication and proximity signals used to negotiate charging. The connector standard and inlet location depend on the vehicle and market.",
    diagnosticRelevance: [
      "Charging session failures can come from the inlet, its temperature sensing, the lock actuator or communication with the charger.",
    ],
    highVoltage: true,
    revealPhase: "body",
  },
  {
    id: "body-structure",
    name: "Body Structure & Closures",
    short: "Body Structure",
    subtitle: "Panels, glass, closures",
    function:
      "Exterior panels, glass and closures over a structure that carries crash loads around the floor-mounted battery. Panels are shown separated here so you can see the systems beneath.",
    diagnosticRelevance: [
      "Collision repairs near the floor or sills can affect the battery enclosure and its mounting.",
      "Water leaks into the cabin or underbody are worth ruling out when isolation faults appear after rain or washing.",
    ],
    highVoltage: false,
    revealPhase: "body",
  },
  {
    id: "chassis",
    name: "Chassis & Subframes",
    short: "Chassis",
    subtitle: "Rails, subframes, suspension",
    function:
      "Longitudinal rails, subframes and suspension carry the drive units and the battery enclosure and transfer loads to the wheels.",
    diagnosticRelevance: ["Underbody impact damage can deform the enclosure mounting points; inspect them after any strike."],
    highVoltage: false,
    revealPhase: "body",
  },
];

export const COMPONENT_BY_ID = Object.fromEntries(COMPONENTS.map((c) => [c.id, c])) as Record<
  ComponentId,
  VehicleComponent
>;

export const PHASES = [
  { id: "overview", label: "Vehicle Overview", start: 0, anchor: 0 },
  { id: "body", label: "Body Disassembly", start: 0.12, anchor: 0.36 },
  { id: "battery", label: "Battery Reveal", start: 0.42, anchor: 0.62 },
  { id: "explore", label: "Explore Components", start: 0.66, anchor: 0.76 },
  { id: "diagnose", label: "Start Diagnosing", start: 0.88, anchor: 1 },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export function phaseAt(progress: number): PhaseId {
  let current: PhaseId = "overview";
  for (const p of PHASES) if (progress >= p.start) current = p.id;
  return current;
}
