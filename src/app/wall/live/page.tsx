import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WallDisplay, type WallBlock, type WallScore } from "@/components/wall-display";
import { formatDayLong, toDayDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { WALL_COOKIE } from "@/lib/pairing";
import { getWorkoutByDate } from "@/lib/workouts";

export const metadata = { title: "Le mur · Chalk" };

/** L'écran de la salle se rafraîchit souvent : jamais de cache. */
export const dynamic = "force-dynamic";

function scoreLabel(result: {
  scoreType: string;
  value: number;
  rounds: number | null;
  reps: number | null;
}): string {
  if (result.scoreType === "ROUNDS_REPS") {
    return `${result.rounds ?? 0} + ${String(result.reps ?? 0).padStart(2, "0")}`;
  }
  if (result.scoreType === "TIME") {
    const total = Math.round(result.value);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return result.scoreType === "LOAD" ? `${result.value} kg` : `${result.value}`;
}

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
          orderBy: [{ rx: "desc" }, { value: "desc" }],
          take: 8,
        });

  const scores: WallScore[] = results.map((result) => ({
    id: result.id,
    name: result.user.name,
    score: scoreLabel(result),
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
