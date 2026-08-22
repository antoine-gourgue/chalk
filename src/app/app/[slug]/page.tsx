import { ChalkMark } from "@/components/chalk-mark";
import { ScoreForm, type ExistingResult } from "@/components/score-form";
import { SignOutButton } from "@/components/sign-out-button";
import { formatDayLong, toDayDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { memberPage } from "@/lib/guard";
import { compareResults, formatScore, type ScoreType } from "@/lib/score";
import { BLOCK_FORMAT_LABELS, BLOCK_KIND_LABELS } from "@/lib/workout-schema";
import { getWorkoutByDate } from "@/lib/workouts";

/** Les blocs qui ne se marquent pas : on n'y met pas de formulaire de score. */
const UNSCORED = new Set(["WARMUP", "COOLDOWN"]);

export default async function MemberHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { box, user } = await memberPage(slug);

  const today = toDayDate(new Date());
  const workout = await getWorkoutByDate(box.id, today);
  const published = workout !== null && workout.publishedAt !== null ? workout : null;

  const blockIds = published?.blocks.map((block) => block.id) ?? [];
  const [myResults, allResults, records] = await Promise.all([
    blockIds.length === 0
      ? []
      : prisma.result.findMany({ where: { blockId: { in: blockIds }, userId: user.id } }),
    blockIds.length === 0
      ? []
      : prisma.result.findMany({
          where: { blockId: { in: blockIds } },
          include: { user: { select: { name: true } } },
        }),
    prisma.personalRecord.findMany({
      where: { userId: user.id },
      include: { movement: { select: { name: true } } },
      orderBy: { achievedAt: "desc" },
      take: 5,
    }),
  ]);

  const mine = new Map(myResults.map((result) => [result.blockId, result]));

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
        <>
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{published.title}</h2>

          {published.blocks.map((block) => {
            const existing = mine.get(block.id);
            const asExisting: ExistingResult =
              existing === undefined
                ? null
                : {
                    rounds: existing.rounds,
                    reps: existing.reps,
                    value: existing.value,
                    rx: existing.rx,
                    note: existing.note,
                  };

            const ranking = allResults
              .filter((result) => result.blockId === block.id)
              .map((result) => ({
                id: result.id,
                name: result.user.name,
                scoreType: result.scoreType as ScoreType,
                value: result.value,
                rounds: result.rounds,
                reps: result.reps,
                rx: result.rx,
              }))
              .sort(compareResults);

            return (
              <section
                key={block.id}
                className="border-edge-soft bg-night flex flex-col gap-4 rounded-2xl border p-5"
              >
                <div>
                  <span className="text-data text-[10px] font-bold tracking-[0.12em] uppercase">
                    {BLOCK_KIND_LABELS[block.kind]} · {BLOCK_FORMAT_LABELS[block.format]}
                    {block.durationSeconds === null ? "" : ` · ${block.durationSeconds / 60} min`}
                  </span>
                  <ul className="mt-2 flex flex-col gap-1.5">
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

                {ranking.length === 0 ? null : (
                  <ol className="border-edge-soft flex flex-col gap-1 border-t pt-3">
                    {ranking.slice(0, 5).map((entry, index) => (
                      <li key={entry.id} className="flex items-baseline gap-2 text-sm">
                        <span className="text-chalk-faint w-4 font-mono text-xs tabular-nums">
                          {index + 1}
                        </span>
                        <span className={entry.name === user.name ? "text-data font-semibold" : ""}>
                          {entry.name}
                        </span>
                        <span className="text-chalk-faint ml-auto font-mono text-xs tabular-nums">
                          {formatScore(entry)} {entry.rx ? "RX" : "SC"}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                {UNSCORED.has(block.kind) ? null : (
                  <ScoreForm
                    boxSlug={slug}
                    blockId={block.id}
                    format={block.format}
                    existing={asExisting}
                  />
                )}
              </section>
            );
          })}

          {published.coachNotes === null ? null : (
            <p className="border-edge-soft text-chalk-dim rounded-2xl border bg-white/3 px-5 py-4 text-sm">
              {published.coachNotes}
            </p>
          )}
        </>
      )}

      {records.length === 0 ? null : (
        <section className="flex flex-col gap-2">
          <h2 className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
            Tes records
          </h2>
          {records.map((record) => (
            <div
              key={record.id}
              className="border-edge-soft flex items-baseline gap-3 rounded-xl border bg-white/3 px-4 py-3 text-sm"
            >
              <span className="font-medium">{record.movement.name}</span>
              <span className="text-data ml-auto font-mono font-semibold tabular-nums">
                {record.value}
                {record.unit === "KG" ? " kg" : record.unit === "SECONDS" ? " s" : " reps"}
              </span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
