import { z } from "zod/v4";
import { COMPONENT_IDS } from "./catalog.js";

const dtc = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[PBCU][0-9A-F]{4}$/, "Use the standard format, e.g. P0AA6 (letter P/B/C/U + 4 hex digits).");

export const VehicleSchema = z.object({
  make: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  year: z.number().int().min(1990).max(2100).optional(),
  trim: z.string().trim().max(80).optional(),
  batteryVariant: z.string().trim().max(80).optional(),
  odometerKm: z.number().min(0).max(2_000_000).optional(),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN must be 17 characters (no I, O or Q).")
    .optional(),
});

export const DiagnoseRequest = z.object({
  vehicle: VehicleSchema.default({}),
  symptoms: z
    .string()
    .trim()
    .min(12, "Describe the fault in a little more detail (at least a sentence).")
    .max(4000),
  dtcs: z.array(dtc).max(20).default([]),
  measurements: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(40),
        unit: z.string().trim().max(16).optional(),
      }),
    )
    .max(30)
    .default([]),
  focusComponent: z.enum(COMPONENT_IDS).optional(),
  /** BCP-47 code chosen by the user, or "auto" to answer in the language of the symptoms. */
  language: z.string().trim().max(16).default("auto"),
});

export type DiagnoseRequest = z.infer<typeof DiagnoseRequest>;

export const ChatRequest = z.object({
  message: z.string().trim().min(1, "Write a message first.").max(4000),
  language: z.string().trim().max(16).default("auto"),
  /** Answer from general knowledge, uncited, after the user accepted that no source covers the question. */
  general: z.boolean().default(false),
});

export const CaseReportRequest = z.object({ language: z.string().trim().max(16).default("auto") });
