import Link from "next/link";
import { notFound } from "next/navigation";
import { BoxShell } from "@/components/box-shell";
import { WorkoutEditor } from "@/components/workout-editor";
import { formatDayLong, mondayOf, toDayDate, toDayKey } from "@/lib/dates";
import { getBoxBySlug, getWorkoutByDate, listMovements } from "@/lib/workouts";
import { emptyBlock, type BlockInput } from "@/lib/workout-schema";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ slug: string; date: string }>;
}) {
  const { slug, date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const box = await getBoxBySlug(slug);
  if (!box) {
    notFound();
  }

  const day = toDayDate(date);
  const [workout, movements] = await Promise.all([getWorkoutByDate(box.id, day), listMovements()]);

  const blocks: BlockInput[] = workout
    ? workout.blocks.map((block) => ({
        kind: block.kind,
        format: block.format,
        title: block.title,
        durationSeconds: block.durationSeconds,
        rounds: block.rounds,
        notes: block.notes,
        movements: block.movements.map((entry) => ({
          movementId: entry.movementId,
          reps: entry.reps,
          loadMale: entry.loadMale,
          loadFemale: entry.loadFemale,
          target: entry.target,
        })),
      }))
    : [emptyBlock()];

  return (
    <BoxShell slug={slug} boxName={box.name} active="semaine">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-6 py-7">
        <Link
          href={`/box/${slug}/semaine?du=${toDayKey(mondayOf(day))}`}
          className="text-chalk-faint hover:text-chalk-dim focus-visible:ring-brand w-fit rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          ← Retour à la semaine
        </Link>

        <WorkoutEditor
          slug={slug}
          date={date}
          dateLabel={formatDayLong(day)}
          movements={movements}
          exists={workout !== null}
          initial={{
            title: workout?.title ?? "",
            coachNotes: workout?.coachNotes ?? "",
            published: workout?.publishedAt !== null && workout !== null,
            blocks,
          }}
        />
      </main>
    </BoxShell>
  );
}
