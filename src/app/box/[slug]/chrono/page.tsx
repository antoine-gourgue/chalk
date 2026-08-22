import { BoxShell } from "@/components/box-shell";
import { TimerControl, type ControlBlock } from "@/components/timer-control";
import { PageTitle } from "@/components/ui/primitives";
import { formatDayLong, todayIn } from "@/lib/dates";
import { coachPage } from "@/lib/guard";
import { getWorkoutByDate } from "@/lib/workouts";

export default async function TimerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { box, user } = await coachPage(slug);

  const today = todayIn(box.timezone);
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
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-7 px-6 py-8">
        <PageTitle eyebrow={formatDayLong(today)} title={workout?.title ?? "Chrono"}>
          <p className="text-chalk-dim mt-1 text-sm">
            Ce que tu lances ici part sur le mur de la salle, à la même seconde.
          </p>
        </PageTitle>

        <TimerControl boxSlug={slug} blocks={blocks} />
      </main>
    </BoxShell>
  );
}
