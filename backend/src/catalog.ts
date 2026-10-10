/**
 * Component identifiers shared with the frontend 3D scene and used as the
 * `components` metadata tag on ingested knowledge chunks.
 * Keep in sync with frontend/src/data/components.ts.
 */
export const COMPONENT_IDS = [
  "body-structure",
  "battery-pack",
  "battery-modules",
  "bms",
  "cooling-plate",
  "hv-harness",
  "hv-junction-box",
  "front-motor",
  "rear-motor",
  "charging-port",
  "chassis",
] as const;

export type ComponentId = (typeof COMPONENT_IDS)[number];

/** Wildcard key for documents that apply to every make / model. */
export const ANY_VEHICLE = "*";

/** Normalise a make or model for exact metadata matching ("Model  Y " -> "model y"). */
export function vehicleKey(value: string | undefined | null): string {
  const v = (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return v || ANY_VEHICLE;
}

export const DOC_TYPES = [
  "service_manual",
  "technical_service_bulletin",
  "recall_notice",
  "diagnostic_log",
  "repair_history",
  "component_spec",
  "uploaded_document",
  "other",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

/** OBD-II / manufacturer DTC format: P, B, C or U followed by four hex digits. */
export const DTC_PATTERN = /\b[PBCU][0-9A-F]{4}\b/g;

export function isComponentId(value: string): value is ComponentId {
  return (COMPONENT_IDS as readonly string[]).includes(value);
}

/**
 * Components a trouble code points at, from the Model 3 service manual's code table
 * (section 4). Used to tag knowledge chunks so a chunk about P0B3C maps to the modules and
 * the BMS instead of to every system.
 */
export const DTC_COMPONENTS: Record<string, ComponentId[]> = {
  P0A7F: ["battery-modules", "bms"],
  P0A80: ["battery-modules"],
  P0A0D: ["hv-harness", "hv-junction-box"],
  P0AFA: ["battery-pack", "battery-modules", "hv-junction-box"],
  P0AFB: ["battery-pack", "bms"],
  P0AC0: ["hv-junction-box"],
  P0A1F: ["bms"],
  P0A81: ["cooling-plate"],
  P0A9C: ["battery-modules", "cooling-plate"],
  P0AA6: ["battery-pack", "hv-harness"],
  P0AE2: ["hv-junction-box"],
  P0ADD: ["hv-junction-box"],
  P0ADE: ["hv-junction-box"],
  P0B3C: ["battery-modules", "bms"],
  P1A00: ["charging-port"],
};
