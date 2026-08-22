import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WallDisplay, type WallBlock, type WallScore } from "@/components/wall-display";
import { formatDayLong, toDayDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { WALL_COOKIE } from "@/lib/pairing";
import { compareResults, formatScore, type ScoreType } from "@/lib/score";
import { getWorkoutByDate } from "@/lib/workouts";

export const metadata = { title: "Le mur · Chalk" };

/** L'écran de la salle se rafraîchit souvent : jamais de cache. */
export const dynamic = "force-dynamic";

export default async function WallLivePage() {
  const token = (await cookies()).get(WALL_COOKIE)?.value;
  if (token === undefined) {
    redirect("/wall");
  }

  const device = await prisma.wallDevice.findUnique({
    where: { token },
    include: { box: true },
  });
  if (device === null) {
    redirect("/wall");
  }

  await prisma.wallDevice.update({
    where: { id: device.id },
    data: { lastSeen: new Date() },
  });

  const today = toDayDate(new Date());
  const workout = await getWorkoutByDate(device.box.id, today);

  const blocks: WallBlock[] =
    workout?.blocks.map((block) => ({
      id: block.id,
      kind: block.kind,
      format: block.format,
      title: block.title ?? workout.title,
      durationSeconds: block.durationSeconds,
      movements: block.movements.map((entry) => ({
        id: entry.id,
        reps: entry.reps,
        name: entry.movement.name,
        detail:
          entry.target ??
          (entry.loadMale === null
            ? null
            : `${entry.loadMale} / ${entry.loadFemale ?? entry.loadMale} kg`),
      })),
    })) ?? [];

  const blockIds = blocks.map((block) => block.id);
  const results =
    blockIds.length === 0
      ? []
      : await prisma.result.findMany({
          where: { blockId: { in: blockIds } },
          include: { user: { select: { name: true } } },
        });

  /**
   * Le classement se fait en mémoire, pas en SQL : sur un « for time » c'est le
   * plus petit score qui gagne, et la règle vit dans `src/lib/score.ts` plutôt
   * que dupliquée dans une clause `orderBy`.
   */
  const scores: WallScore[] = results
    .map((result) => ({
      id: result.id,
      name: result.user.name,
      scoreType: result.scoreType as ScoreType,
      value: result.value,
      rounds: result.rounds,
      reps: result.reps,
      rx: result.rx,
    }))
    .sort(compareResults)
    .slice(0, 8)
    .map((result) => ({
      id: result.id,
      name: result.name,
      score: formatScore(result),
      rx: result.rx,
    }));

  const attendees = await prisma.reservation.count({
    where: {
      status: "CHECKED_IN",
      session: { startsAt: { gte: today, lt: new Date(today.getTime() + 86_400_000) } },
    },
  });

  return (
    <WallDisplay
      boxSlug={device.box.slug}
      header={`${formatDayLong(today)} · ${device.box.name}`}
      blocks={blocks}
      scores={scores}
      attendees={attendees === 0 ? results.length : attendees}
    />
  );
}
