"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, requireMember } from "@/lib/access";
import { prisma } from "@/lib/db";
import { sendTimerCommand } from "@/lib/realtime";
import {
  beatsRecord,
  parseClock,
  repsPerRound,
  roundsRepsValue,
  scoreTypeForFormat,
  type ScoreType,
} from "@/lib/score";

export type SaveResultState = {
  error: string | null;
  saved: boolean;
  /** Renseigné quand la performance bat le record personnel. */
  record: { movement: string; value: number; unit: string; previous: number | null } | null;
};

const resultSchema = z.object({
  boxSlug: z.string().min(1),
  blockId: z.string().min(1),
  rx: z.boolean(),
  rounds: z.number().int().min(0).max(999).nullable(),
  reps: z.number().int().min(0).max(9_999).nullable(),
  clock: z.string().max(12).nullable(),
  load: z.number().min(0).max(999).nullable(),
  note: z.string().trim().max(280).nullable(),
});

function number(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Enregistre la performance d'un membre sur un bloc.
 *
 * La valeur stockée est normalisée pour le classement — total de répétitions,
 * secondes ou kilos — pendant que `rounds`/`reps` gardent l'écriture d'origine.
 * Le mur classe donc sans avoir à réinterpréter quoi que ce soit.
 */
export async function saveResult(
  _previous: SaveResultState,
  formData: FormData,
): Promise<SaveResultState> {
  const parsed = resultSchema.safeParse({
    boxSlug: formData.get("boxSlug"),
    blockId: formData.get("blockId"),
    rx: formData.get("rx") === "on",
    rounds: number(formData.get("rounds")),
    reps: number(formData.get("reps")),
    clock: typeof formData.get("clock") === "string" ? String(formData.get("clock")) : null,
    load: number(formData.get("load")),
    note: typeof formData.get("note") === "string" ? String(formData.get("note")) : null,
  });

  if (!parsed.success) {
    return { error: "Score invalide", saved: false, record: null };
  }
  const data = parsed.data;

  let access;
  try {
    access = await requireMember(data.boxSlug);
  } catch (error) {
    if (error instanceof AccessError) {
      return { error: error.message, saved: false, record: null };
    }
    throw error;
  }

  const block = await prisma.block.findFirst({
    where: { id: data.blockId, workout: { boxId: access.box.id } },
    include: { movements: { include: { movement: true } } },
  });
  if (block === null) {
    return { error: "Bloc introuvable", saved: false, record: null };
  }

  const scoreType: ScoreType = scoreTypeForFormat(block.format);
  let value: number | null = null;

  if (scoreType === "ROUNDS_REPS") {
    value = roundsRepsValue(data.rounds ?? 0, data.reps ?? 0, repsPerRound(block.movements));
  } else if (scoreType === "TIME") {
    value = data.clock === null ? null : parseClock(data.clock);
    if (value === null) {
      return { error: "Écris ton temps comme 8:42", saved: false, record: null };
    }
  } else if (scoreType === "LOAD") {
    value = data.load;
    if (value === null) {
      return { error: "Indique la charge en kilos", saved: false, record: null };
    }
  } else {
    value = data.reps;
    if (value === null) {
      return { error: "Indique ton nombre de répétitions", saved: false, record: null };
    }
  }

  await prisma.result.upsert({
    where: { blockId_userId: { blockId: block.id, userId: access.user.id } },
    update: {
      scoreType,
      value,
      rounds: data.rounds,
      reps: data.reps,
      rx: data.rx,
      note: data.note,
    },
    create: {
      blockId: block.id,
      userId: access.user.id,
      scoreType,
      value,
      rounds: data.rounds,
      reps: data.reps,
      rx: data.rx,
      note: data.note,
    },
  });

  const record = await updatePersonalRecord({
    userId: access.user.id,
    movements: block.movements.map((entry) => entry.movement),
    scoreType,
    value,
    rx: data.rx,
  });

  /** Le mur relit son classement au lieu d'attendre son rafraîchissement périodique. */
  await sendTimerCommand({ command: "scoreboard", boxSlug: data.boxSlug });

  revalidatePath(`/app/${data.boxSlug}`);
  return { error: null, saved: true, record };
}

/**
 * Met à jour le record personnel quand le bloc porte sur un seul mouvement repère.
 *
 * Un record n'a de sens que sur un mouvement isolé : la charge d'un back squat se
 * compare d'une semaine sur l'autre, le total de répétitions d'un metcon à trois
 * mouvements ne se compare à rien. Et un score scalé ne fait jamais record.
 */
async function updatePersonalRecord({
  userId,
  movements,
  scoreType,
  value,
  rx,
}: {
  userId: string;
  movements: { id: string; name: string; benchmark: boolean; prUnit: string | null }[];
  scoreType: ScoreType;
  value: number;
  rx: boolean;
}): Promise<SaveResultState["record"]> {
  if (!rx || movements.length !== 1) {
    return null;
  }
  const movement = movements[0];
  if (!movement.benchmark || movement.prUnit === null) {
    return null;
  }

  const expected = scoreType === "LOAD" ? "KG" : scoreType === "TIME" ? "SECONDS" : "REPS";
  if (movement.prUnit !== expected) {
    return null;
  }

  const current = await prisma.personalRecord.findFirst({
    where: { userId, movementId: movement.id },
    orderBy: { achievedAt: "desc" },
  });

  const unit = movement.prUnit as "KG" | "REPS" | "SECONDS";
  if (!beatsRecord(value, current?.value ?? null, unit)) {
    return null;
  }

  await prisma.personalRecord.create({
    data: { userId, movementId: movement.id, unit, value, achievedAt: new Date() },
  });

  return { movement: movement.name, value, unit, previous: current?.value ?? null };
}
