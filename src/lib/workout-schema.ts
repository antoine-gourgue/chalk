import { z } from "zod";

export const BLOCK_KINDS = [
  "WARMUP",
  "STRENGTH",
  "GYMNASTICS",
  "METCON",
  "ACCESSORY",
  "COOLDOWN",
] as const;

export const BLOCK_FORMATS = [
  "AMRAP",
  "FOR_TIME",
  "EMOM",
  "TABATA",
  "INTERVALS",
  "STRENGTH_SETS",
  "FREE",
] as const;

export const BLOCK_KIND_LABELS: Record<(typeof BLOCK_KINDS)[number], string> = {
  WARMUP: "Échauffement",
  STRENGTH: "Force",
  GYMNASTICS: "Gym",
  METCON: "Metcon",
  ACCESSORY: "Accessoire",
  COOLDOWN: "Retour au calme",
};

export const BLOCK_FORMAT_LABELS: Record<(typeof BLOCK_FORMATS)[number], string> = {
  AMRAP: "AMRAP",
  FOR_TIME: "For time",
  EMOM: "EMOM",
  TABATA: "Tabata",
  INTERVALS: "Intervalles",
  STRENGTH_SETS: "Séries",
  FREE: "Libre",
};

/** Les formats dont la durée pilote le chrono du mur. */
export const TIMED_FORMATS = new Set(["AMRAP", "FOR_TIME", "EMOM", "TABATA", "INTERVALS"]);

const optionalNumber = z
  .union([z.number(), z.nan()])
  .nullable()
  .transform((value) => (value === null || Number.isNaN(value) ? null : value));

export const blockMovementSchema = z.object({
  movementId: z.string().min(1, "Choisis un mouvement"),
  reps: optionalNumber,
  loadMale: optionalNumber,
  loadFemale: optionalNumber,
  target: z.string().trim().max(40).nullable(),
});

export const blockSchema = z.object({
  kind: z.enum(BLOCK_KINDS),
  format: z.enum(BLOCK_FORMATS),
  title: z.string().trim().max(80).nullable(),
  durationSeconds: optionalNumber,
  rounds: optionalNumber,
  notes: z.string().trim().max(500).nullable(),
  movements: z.array(blockMovementSchema),
});

export const workoutSchema = z.object({
  boxSlug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  title: z.string().trim().min(1, "Donne un titre à la séance").max(80),
  coachNotes: z.string().trim().max(1000).nullable(),
  published: z.boolean(),
  blocks: z.array(blockSchema).min(1, "Une séance contient au moins un bloc"),
});

export type BlockMovementInput = z.infer<typeof blockMovementSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;

export function emptyBlock(): BlockInput {
  return {
    kind: "METCON",
    format: "AMRAP",
    title: null,
    durationSeconds: 720,
    rounds: null,
    notes: null,
    movements: [],
  };
}

export function emptyMovement(): BlockMovementInput {
  return { movementId: "", reps: null, loadMale: null, loadFemale: null, target: null };
}
