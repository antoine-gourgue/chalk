import { z } from "zod";

/** Vocabulaire partagé entre l'app Next et la passerelle temps réel. */
export const timerCommandSchema = z.discriminatedUnion("command", [
  z.object({
    command: z.literal("start"),
    boxSlug: z.string().min(1),
    blockId: z.string().min(1),
    durationSeconds: z.number().int().min(0).max(7_200),
    /** Décompte de mise en route, en secondes : le « 3, 2, 1 » de la salle. */
    leadInSeconds: z.number().int().min(0).max(30).optional(),
  }),
  z.object({ command: z.literal("pause"), boxSlug: z.string().min(1) }),
  z.object({ command: z.literal("resume"), boxSlug: z.string().min(1) }),
  z.object({ command: z.literal("reset"), boxSlug: z.string().min(1) }),
  /** Un score vient d'être saisi : le mur doit relire le classement. */
  z.object({ command: z.literal("scoreboard"), boxSlug: z.string().min(1) }),
]);

export type TimerCommand = z.infer<typeof timerCommandSchema>;
