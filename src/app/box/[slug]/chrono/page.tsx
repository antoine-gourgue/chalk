import { BoxShell } from "@/components/box-shell";
import { TimerControl, type ControlBlock } from "@/components/timer-control";
import { formatDayLong, toDayDate } from "@/lib/dates";
import { coachPage } from "@/lib/guard";
import { getWorkoutByDate } from "@/lib/workouts";

export default async function TimerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { box, user } = await coachPage(slug);

  const today = toDayDate(new Date());
  const workout = await getWorkoutByDate(box.id, today);

  const blocks: ControlBlock[] =
    workout?.blocks.map((block) => ({
      id: block.id,
      kind: block.kind,
      format: block.format,
      title: block.title ?? workout.title,
      durationSeconds: block.durationSeconds,
    })) ?? [];

  return (
    <BoxShell slug={slug} boxName={box.name} userName={user.name} active="chrono">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-7">
        <div>
          <p className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
            {formatDayLong(today)}
          </p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em]">
            {workout?.title ?? "Chrono"}
          </h1>
        </div>

        <TimerControl boxSlug={slug} blocks={blocks} />
      </main>
    </BoxShell>
  );
}
