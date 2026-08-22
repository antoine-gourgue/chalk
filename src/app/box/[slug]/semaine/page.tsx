import Link from "next/link";
import { BoxShell } from "@/components/box-shell";
import { DuplicateWeekButton } from "@/components/duplicate-week-button";
import { cn } from "@/lib/cn";
import {
  addDays,
  dayName,
  formatDayShort,
  formatWeekRange,
  isSameDay,
  mondayOf,
  toDayKey,
  toDayDate,
  todayIn,
  weekDays,
} from "@/lib/dates";
import { coachPage } from "@/lib/guard";
import { getWeekWorkouts } from "@/lib/workouts";
import { BLOCK_KIND_LABELS, BLOCK_FORMAT_LABELS } from "@/lib/workout-schema";

export default async function WeekPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ du?: string }>;
}) {
  const { slug } = await params;
  const { du } = await searchParams;

  const { box, user } = await coachPage(slug);

  const monday = mondayOf(du ? toDayDate(du) : todayIn(box.timezone));
  const workouts = await getWeekWorkouts(box.id, monday);
  const today = todayIn(box.timezone);

  return (
    <BoxShell slug={slug} boxName={box.name} userName={user.name} active="semaine">
      <main className="flex flex-1 flex-col gap-6 px-6 py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
              Programmation
            </p>
            <h1 className="text-3xl font-extrabold tracking-[-0.03em]">
              {formatWeekRange(monday)}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <WeekLink slug={slug} monday={addDays(monday, -7)} label="Semaine précédente">
              ←
            </WeekLink>
            <Link
              href={`/box/${slug}/semaine`}
              className="border-edge hover:bg-white/8 focus-visible:ring-brand rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Cette semaine
            </Link>
            <WeekLink slug={slug} monday={addDays(monday, 7)} label="Semaine suivante">
              →
            </WeekLink>
            <DuplicateWeekButton slug={slug} monday={toDayKey(monday)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weekDays(monday).map((day) => {
            const workout = workouts.get(toDayKey(day));
            const isToday = isSameDay(day, today);

            return (
              <Link
                key={toDayKey(day)}
                href={`/box/${slug}/semaine/${toDayKey(day)}`}
                className={cn(
                  "group border-edge-soft focus-visible:ring-brand flex min-h-52 flex-col gap-2.5 rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  isToday ? "border-brand/40 bg-brand/10" : "bg-night hover:border-edge",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={cn(
                      "text-[11px] font-semibold tracking-[0.14em] uppercase",
                      isToday ? "text-brand" : "text-chalk-faint",
                    )}
                  >
                    {dayName(day)}
                  </span>
                  <span className="text-chalk-faint font-mono text-[11px]">
                    {formatDayShort(day)}
                  </span>
                </div>

                {workout ? (
                  <>
                    {workout.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="border-edge-soft rounded-xl border bg-white/4 px-3 py-2.5"
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold tracking-[0.12em] uppercase",
                            block.kind === "METCON" ? "text-urgent" : "text-data",
                          )}
                        >
                          {BLOCK_KIND_LABELS[block.kind]}
                        </span>
                        <p className="mt-0.5 text-sm font-semibold tracking-[-0.01em]">
                          {block.title ?? BLOCK_FORMAT_LABELS[block.format]}
                        </p>
                        <p className="text-chalk-faint mt-1 truncate font-mono text-[11px]">
                          {block.movements.map((entry) => entry.movement.name).join(" · ") || "—"}
                        </p>
                      </div>
                    ))}
                    {workout.publishedAt === null ? (
                      <span className="text-chalk-faint mt-auto font-mono text-[10px] tracking-[0.12em] uppercase">
                        Brouillon
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="border-edge text-chalk-faint group-hover:text-chalk-dim mt-auto rounded-xl border border-dashed p-2.5 text-center text-sm transition-colors">
                    Programmer la séance
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </BoxShell>
  );
}

function WeekLink({
  slug,
  monday,
  label,
  children,
}: {
  slug: string;
  monday: Date;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/box/${slug}/semaine?du=${toDayKey(monday)}`}
      aria-label={label}
      className="border-edge hover:bg-white/8 focus-visible:ring-brand flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}
