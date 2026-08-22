import Link from "next/link";
import { ChalkMark } from "@/components/chalk-mark";
import { ScoreForm, type ExistingResult } from "@/components/score-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Atmosphere, Eyebrow } from "@/components/ui/atmosphere";
import { Card, Pill } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatDayLong, todayIn } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { memberPage } from "@/lib/guard";
import { compareResults, formatScore, type ScoreType } from "@/lib/score";
import { BLOCK_FORMAT_LABELS, BLOCK_KIND_LABELS } from "@/lib/workout-schema";
import { getWorkoutByDate } from "@/lib/workouts";

/** Les blocs qui ne se marquent pas : pas de formulaire de score. */
const UNSCORED = new Set(["WARMUP", "COOLDOWN"]);

const UNIT_LABEL: Record<string, string> = { KG: "kg", SECONDS: "s", REPS: "reps" };

export default async function MemberHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { box, user } = await memberPage(slug);

  const today = todayIn(box.timezone);
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
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <Atmosphere />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-7 px-5 pt-6 pb-14">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ChalkMark className="h-6 w-6" />
            <span className="text-lg font-extrabold tracking-[-0.025em]">Chalk</span>
          </span>
          <span className="text-chalk-faint flex items-center gap-2 text-xs">
            {box.name}
            <SignOutButton />
          </span>
        </header>

        <div className="flex flex-col gap-1">
          <Eyebrow>{formatDayLong(today)}</Eyebrow>
          <h1 className="text-4xl font-extrabold tracking-[-0.035em]">Salut {firstName}</h1>
          {published === null ? null : (
            <p className="text-chalk-dim text-sm">
              {published.title} · {published.blocks.length} bloc
              {published.blocks.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {published === null ? (
          <Card className="flex flex-col gap-3 p-6">
            <p className="text-chalk-dim text-sm">
              Le coach n&apos;a pas encore publié la séance du jour.
            </p>
            <Link
              href="/demo/wall"
              className="text-data hover:text-chalk focus-visible:ring-brand w-fit rounded text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Voir le mur de la salle →
            </Link>
          </Card>
        ) : (
          published.blocks.map((block) => {
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

            const myRank = ranking.findIndex((entry) => entry.name === user.name);

            return (
              <Card key={block.id} className="flex flex-col gap-5 p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold tracking-[0.14em] uppercase",
                        block.kind === "METCON" ? "text-urgent" : "text-data",
                      )}
                    >
                      {BLOCK_KIND_LABELS[block.kind]} · {BLOCK_FORMAT_LABELS[block.format]}
                    </span>
                    {block.durationSeconds === null ? null : (
                      <Pill tone="quiet" className="ml-auto font-mono tabular-nums">
                        {block.durationSeconds / 60} min
                      </Pill>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2">
                    {block.movements.map((entry) => (
                      <li key={entry.id} className="flex items-baseline gap-3 text-[15px]">
                        {entry.reps === null ? null : (
                          <span className="text-data w-6 font-mono font-bold tabular-nums">
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
                  <div className="border-edge-soft flex flex-col gap-1.5 border-t pt-4">
                    <div className="flex items-baseline justify-between">
                      <Eyebrow>Classement du jour</Eyebrow>
                      {myRank < 0 ? null : (
                        <span className="text-data font-mono text-[11px] tracking-[0.1em] uppercase">
                          Tu es {myRank + 1}
                          {myRank === 0 ? "er" : "e"}
                        </span>
                      )}
                    </div>
                    {ranking.slice(0, 5).map((entry, index) => {
                      const isMe = entry.name === user.name;
                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-baseline gap-2.5 rounded-lg px-2 py-1.5 text-sm",
                            isMe && "bg-data/10",
                          )}
                        >
                          <span className="text-chalk-faint w-4 font-mono text-xs tabular-nums">
                            {index + 1}
                          </span>
                          <span className={cn(isMe && "text-data font-semibold")}>
                            {entry.name}
                          </span>
                          <span className="text-chalk-dim ml-auto font-mono text-xs tabular-nums">
                            {formatScore(entry)}
                          </span>
                          <span className="text-chalk-faint font-mono text-[10px]">
                            {entry.rx ? "RX" : "SC"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {UNSCORED.has(block.kind) ? null : (
                  <ScoreForm
                    boxSlug={slug}
                    blockId={block.id}
                    format={block.format}
                    existing={asExisting}
                  />
                )}
              </Card>
            );
          })
        )}

        {published === null || published.coachNotes === null ? null : (
          <Card className="flex flex-col gap-2 p-5">
            <Eyebrow>Le mot du coach</Eyebrow>
            <p className="text-chalk-dim text-sm leading-relaxed">{published.coachNotes}</p>
          </Card>
        )}

        {records.length === 0 ? null : (
          <section className="flex flex-col gap-2">
            <Eyebrow>Tes records</Eyebrow>
            {records.map((record) => (
              <div
                key={record.id}
                className="border-edge-soft flex items-baseline gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 text-sm"
              >
                <span className="font-medium">{record.movement.name}</span>
                <span className="text-data ml-auto font-mono font-bold tabular-nums">
                  {record.value} {UNIT_LABEL[record.unit] ?? ""}
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
