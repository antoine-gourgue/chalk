"use server";

import { revalidatePath } from "next/cache";
import { AccessError, requireCoach } from "@/lib/access";
import { prisma } from "@/lib/db";
import { addDays, toDayDate, toDayKey } from "@/lib/dates";
import { generateDeviceToken, generatePairingCode, PAIRING_TTL_MINUTES } from "@/lib/pairing";
import { sendTimerCommand } from "@/lib/realtime";
import { timerCommandSchema, type TimerCommand } from "@/lib/timer-command";
import { workoutSchema, type WorkoutInput } from "@/lib/workout-schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Toute écriture passe par ici : la salle est résolue et le rôle vérifié en même
 * temps, pour qu'aucun chemin d'écriture ne puisse oublier l'un des deux.
 */
async function requireBox(slug: string) {
  const access = await requireCoach(slug);
  return access.box;
}

/** Transforme un refus d'accès en message affichable plutôt qu'en page d'erreur. */
function toActionResult(error: unknown): ActionResult {
  if (error instanceof AccessError) {
    return { ok: false, error: error.message };
  }
  throw error;
}

export async function saveWorkout(input: WorkoutInput): Promise<ActionResult> {
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Séance invalide" };
  }
  const data = parsed.data;
  let box;
  try {
    box = await requireBox(data.boxSlug);
  } catch (error) {
    return toActionResult(error);
  }
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
  let box;
  try {
    box = await requireBox(boxSlug);
  } catch (error) {
    return toActionResult(error);
  }
  await prisma.workout.deleteMany({ where: { boxId: box.id, date: toDayDate(date) } });
  revalidatePath(`/box/${boxSlug}/semaine`);
  return { ok: true };
}

/**
 * Recopie une semaine sur la suivante. Les jours déjà programmés sont laissés
 * intacts : dupliquer ne doit jamais écraser un travail existant.
 */
export async function duplicateWeek(boxSlug: string, sourceMonday: string): Promise<ActionResult> {
  let box;
  try {
    box = await requireBox(boxSlug);
  } catch (error) {
    return toActionResult(error);
  }
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

/**
 * Génère un code d'appairage pour un nouvel écran.
 *
 * L'appareil est créé immédiatement avec son jeton définitif ; le code n'est que
 * le laissez-passer temporaire qui permet à l'écran de venir le chercher.
 */
export async function createPairingCode(
  boxSlug: string,
  name: string,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  let box;
  try {
    box = await requireBox(boxSlug);
  } catch (error) {
    const result = toActionResult(error);
    return result.ok ? { ok: false, error: "Accès refusé" } : result;
  }

  const trimmed = name.trim() === "" ? "Écran de la salle" : name.trim().slice(0, 40);
  const code = generatePairingCode();

  await prisma.wallDevice.create({
    data: {
      boxId: box.id,
      name: trimmed,
      token: generateDeviceToken(),
      pairingCode: code,
      pairingExpiresAt: new Date(Date.now() + PAIRING_TTL_MINUTES * 60_000),
    },
  });

  revalidatePath(`/box/${boxSlug}/ecrans`);
  return { ok: true, code };
}

export async function revokeDevice(boxSlug: string, deviceId: string): Promise<ActionResult> {
  let box;
  try {
    box = await requireBox(boxSlug);
  } catch (error) {
    return toActionResult(error);
  }
  await prisma.wallDevice.deleteMany({ where: { id: deviceId, boxId: box.id } });
  revalidatePath(`/box/${boxSlug}/ecrans`);
  return { ok: true };
}

/**
 * Pilotage du chrono. L'autorisation est vérifiée ici, dans Next ; la passerelle
 * temps réel ne fait qu'exécuter une commande déjà signée par le secret partagé.
 */
export async function controlTimer(input: TimerCommand): Promise<ActionResult> {
  const parsed = timerCommandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Commande invalide" };
  }
  try {
    await requireBox(parsed.data.boxSlug);
  } catch (error) {
    return toActionResult(error);
  }

  const delivered = await sendTimerCommand(parsed.data);
  return delivered
    ? { ok: true }
    : { ok: false, error: "La passerelle temps réel ne répond pas — l'écran n'a rien reçu." };
}
