import { ChalkMark } from "@/components/chalk-mark";
import { SignOutButton } from "@/components/sign-out-button";
import { formatDayLong, toDayDate } from "@/lib/dates";
import { memberPage } from "@/lib/guard";
import { BLOCK_FORMAT_LABELS, BLOCK_KIND_LABELS } from "@/lib/workout-schema";
import { getWorkoutByDate } from "@/lib/workouts";

/**
 * Atterrissage de l'espace membre : la séance du jour, si le coach l'a publiée.
 * La réservation et la saisie de perf arrivent dans leurs lots respectifs.
 */
export default async function MemberHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { box, user } = await memberPage(slug);

  const today = toDayDate(new Date());
  const workout = await getWorkoutByDate(box.id, today);
  const published = workout?.publishedAt !== null && workout !== null ? workout : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChalkMark className="h-6 w-6" />
          <span className="text-lg font-extrabold tracking-[-0.02em]">Chalk</span>
        </div>
        <div className="text-chalk-faint flex items-center gap-2 text-xs">
          {box.name}
          <SignOutButton />
        </div>
      </header>

      <div>
        <p className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
          {formatDayLong(today)}
        </p>
        <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Salut {user.name}</h1>
      </div>

      {published === null ? (
        <p className="border-edge-soft text-chalk-dim rounded-2xl border bg-white/3 px-5 py-6 text-sm">
          Le coach n&apos;a pas encore publié la séance du jour.
        </p>
      ) : (
        <section className="border-edge-soft bg-night flex flex-col gap-4 rounded-2xl border p-5">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{published.title}</h2>

          {published.blocks.map((block) => (
            <div key={block.id} className="flex flex-col gap-2">
              <span className="text-data text-[10px] font-bold tracking-[0.12em] uppercase">
                {BLOCK_KIND_LABELS[block.kind]} · {BLOCK_FORMAT_LABELS[block.format]}
                {block.durationSeconds === null ? "" : ` · ${block.durationSeconds / 60} min`}
              </span>
              <ul className="flex flex-col gap-1.5">
                {block.movements.map((entry) => (
                  <li key={entry.id} className="flex items-baseline gap-2.5 text-[15px]">
                    {entry.reps === null ? null : (
                      <span className="text-data font-mono font-semibold tabular-nums">
                        {entry.reps}
                      </span>
                    )}
                    <span className="font-medium">{entry.movement.name}</span>
                    {entry.loadMale === null && entry.target === null ? null : (
                      <span className="text-chalk-faint ml-auto font-mono text-xs">
                        {entry.target ??
                          `${entry.loadMale} / ${entry.loadFemale ?? entry.loadMale} kg`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {published.coachNotes === null ? null : (
            <p className="border-edge-soft text-chalk-dim border-t pt-3 text-sm">
              {published.coachNotes}
            </p>
          )}
        </section>
      )}

      <p className="text-chalk-faint font-mono text-[11px] tracking-[0.14em] uppercase">
        Réservation et scores : bientôt
      </p>
    </main>
  );
}
