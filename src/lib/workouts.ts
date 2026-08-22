import { prisma } from "@/lib/db";
import { addDays, toDayDate, toDayKey } from "@/lib/dates";

export async function getBoxBySlug(slug: string) {
  return prisma.box.findUnique({ where: { slug } });
}

export async function listMovements() {
  return prisma.movement.findMany({
    where: { boxId: null },
    orderBy: [{ modality: "asc" }, { name: "asc" }],
    select: { id: true, name: true, modality: true },
  });
}

const workoutInclude = {
  blocks: {
    orderBy: { position: "asc" },
    include: {
      movements: {
        orderBy: { position: "asc" },
        include: { movement: { select: { id: true, name: true } } },
      },
    },
  },
} as const;

export type WorkoutWithBlocks = NonNullable<Awaited<ReturnType<typeof getWorkoutByDate>>>;

export async function getWorkoutByDate(boxId: string, date: Date) {
  return prisma.workout.findUnique({
    where: { boxId_date: { boxId, date: toDayDate(date) } },
    include: workoutInclude,
  });
}

/** Les séances d'une semaine, indexées par jour (`2026-08-24`). */
export async function getWeekWorkouts(boxId: string, monday: Date) {
  const workouts = await prisma.workout.findMany({
    where: { boxId, date: { gte: toDayDate(monday), lte: addDays(monday, 6) } },
    include: workoutInclude,
    orderBy: { date: "asc" },
  });
  return new Map(workouts.map((workout) => [toDayKey(workout.date), workout]));
}
