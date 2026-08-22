"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { addDays, toDayDate, toDayKey } from "@/lib/dates";
import { workoutSchema, type WorkoutInput } from "@/lib/workout-schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Garde d'accès de la salle.
 *
 * L'authentification n'est pas encore branchée (lot dédié) : pour l'instant on
 * ne vérifie que l'existence de la salle. Toute écriture doit passer par ici,
 * pour qu'il n'y ait qu'un seul endroit à durcir quand Auth.js arrivera.
 */
async function requireBox(slug: string) {
  const box = await prisma.box.findUnique({ where: { slug } });
  if (!box) {
    throw new Error("Salle introuvable");
  }
  return box;
}

export async function saveWorkout(input: WorkoutInput): Promise<ActionResult> {
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Séance invalide" };
  }
  const data = parsed.data;
  const box = await requireBox(data.boxSlug);
  const date = toDayDate(data.date);

  const emptyBlock = data.blocks.findIndex((block) => block.movements.length === 0);
  if (emptyBlock >= 0) {
    return { ok: false, error: `Le bloc ${emptyBlock + 1} n'a aucun mouvement` };
  }

  /**
   * Les blocs sont remplacés en entier plutôt que rapprochés un à un : une séance
   * est petite, et cela évite toute dérive entre les positions affichées et
   * celles enregistrées.
   */
  await prisma.$transaction(async (tx) => {
    const workout = await tx.workout.upsert({
      where: { boxId_date: { boxId: box.id, date } },
      update: {
        title: data.title,
        coachNotes: data.coachNotes,
        publishedAt: data.published ? new Date() : null,
      },
      create: {
        boxId: box.id,
        date,
        title: data.title,
        coachNotes: data.coachNotes,
        publishedAt: data.published ? new Date() : null,
      },
    });

    await tx.block.deleteMany({ where: { workoutId: workout.id } });

    for (const [position, block] of data.blocks.entries()) {
      await tx.block.create({
        data: {
          workoutId: workout.id,
          position,
          kind: block.kind,
          format: block.format,
          title: block.title,
          durationSeconds: block.durationSeconds,
          rounds: block.rounds,
          notes: block.notes,
          movements: {
            create: block.movements.map((movement, index) => ({
              position: index,
              movementId: movement.movementId,
              reps: movement.reps,
              loadMale: movement.loadMale,
              loadFemale: movement.loadFemale,
              target: movement.target,
            })),
          },
        },
      });
    }
  });

  revalidatePath(`/box/${data.boxSlug}/semaine`);
  revalidatePath(`/box/${data.boxSlug}/semaine/${data.date}`);
  return { ok: true };
}

export async function deleteWorkout(boxSlug: string, date: string): Promise<ActionResult> {
  const box = await requireBox(boxSlug);
  await prisma.workout.deleteMany({ where: { boxId: box.id, date: toDayDate(date) } });
  revalidatePath(`/box/${boxSlug}/semaine`);
  return { ok: true };
}

/**
 * Recopie une semaine sur la suivante. Les jours déjà programmés sont laissés
 * intacts : dupliquer ne doit jamais écraser un travail existant.
 */
export async function duplicateWeek(boxSlug: string, sourceMonday: string): Promise<ActionResult> {
  const box = await requireBox(boxSlug);
  const source = toDayDate(sourceMonday);
  const target = addDays(source, 7);

  const workouts = await prisma.workout.findMany({
    where: { boxId: box.id, date: { gte: source, lte: addDays(source, 6) } },
    include: { blocks: { include: { movements: true }, orderBy: { position: "asc" } } },
  });

  if (workouts.length === 0) {
    return { ok: false, error: "Cette semaine ne contient aucune séance à dupliquer" };
  }

  const existing = await prisma.workout.findMany({
    where: { boxId: box.id, date: { gte: target, lte: addDays(target, 6) } },
    select: { date: true },
  });
  const taken = new Set(existing.map((workout) => toDayKey(workout.date)));

  let copied = 0;
  for (const workout of workouts) {
    const newDate = addDays(workout.date, 7);
    if (taken.has(toDayKey(newDate))) {
      continue;
    }
    await prisma.workout.create({
      data: {
        boxId: box.id,
        date: newDate,
        title: workout.title,
        coachNotes: workout.coachNotes,
        blocks: {
          create: workout.blocks.map((block) => ({
            position: block.position,
            kind: block.kind,
            format: block.format,
            title: block.title,
            durationSeconds: block.durationSeconds,
            rounds: block.rounds,
            notes: block.notes,
            movements: {
              create: block.movements.map((movement) => ({
                position: movement.position,
                movementId: movement.movementId,
                reps: movement.reps,
                loadMale: movement.loadMale,
                loadFemale: movement.loadFemale,
                target: movement.target,
              })),
            },
          })),
        },
      },
    });
    copied += 1;
  }

  revalidatePath(`/box/${boxSlug}/semaine`);
  return copied > 0
    ? { ok: true }
    : { ok: false, error: "La semaine suivante est déjà entièrement programmée" };
}
