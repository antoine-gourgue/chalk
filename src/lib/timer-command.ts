import { z } from "zod";

/** Vocabulaire partagé entre l'app Next et la passerelle temps réel. */
export const timerCommandSchema = z.discriminatedUnion("command", [
  z.object({
    command: z.literal("start"),
    boxSlug: z.string().min(1),
    blockId: z.string().min(1),
    durationSeconds: z.number().int().min(0).max(7_200),
  }),
  z.object({ command: z.literal("pause"), boxSlug: z.string().min(1) }),
  z.object({ command: z.literal("resume"), boxSlug: z.string().min(1) }),
  z.object({ command: z.literal("reset"), boxSlug: z.string().min(1) }),
]);

export type TimerCommand = z.infer<typeof timerCommandSchema>;
