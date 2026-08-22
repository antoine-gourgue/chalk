import Link from "next/link";
import { BoxShell } from "@/components/box-shell";
import { DuplicateWeekButton } from "@/components/duplicate-week-button";
import { PageTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  addDays,
  dayName,
  formatDayShort,
  formatWeekRange,
  isSameDay,
  mondayOf,
  toDayDate,
  toDayKey,
  todayIn,
  weekDays,
} from "@/lib/dates";
import { prisma } from "@/lib/db";
import { coachPage } from "@/lib/guard";
import { BLOCK_FORMAT_LABELS, BLOCK_KIND_LABELS } from "@/lib/workout-schema";
import { getWeekWorkouts } from "@/lib/workouts";

/** Chaque type de bloc a sa couleur : on lit la semaine d'un coup d'œil. */
const KIND_TONE: Record<string, string> = {
  WARMUP: "text-chalk-faint",
  STRENGTH: "text-brand",
  GYMNASTICS: "text-data",
  METCON: "text-urgent",
  ACCESSORY: "text-chalk-dim",
  COOLDOWN: "text-chalk-faint",
};

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

  const today = todayIn(box.timezone);
  const monday = mondayOf(du ? toDayDate(du) : today);
  const [workouts, memberCount, activeScreens, scoresToday] = await Promise.all([
    getWeekWorkouts(box.id, monday),
    prisma.membership.count({ where: { boxId: box.id, active: true } }),
    prisma.wallDevice.count({ where: { boxId: box.id, pairedAt: { not: null } } }),
    prisma.result.count({ where: { block: { workout: { boxId: box.id, date: today } } } }),
  ]);

  const days = weekDays(monday);
  const programmed = days.filter((day) => workouts.has(toDayKey(day))).length;
  const drafts = days.filter((day) => workouts.get(toDayKey(day))?.publishedAt === null).length;
  const todayWorkout = workouts.get(toDayKey(today));

  const stats = [
    {
      label: "Cette semaine",
      value: `${programmed} / 7`,
      hint: drafts === 0 ? "toutes publiées" : `${drafts} en brouillon`,
    },
    {
      label: "Aujourd'hui",
      value: todayWorkout?.title ?? "À programmer",
      hint:
        todayWorkout === undefined
          ? "le mur n'affiche rien"
          : `${scoresToday} score${scoresToday > 1 ? "s" : ""} saisi${scoresToday > 1 ? "s" : ""}`,
      accent: todayWorkout === undefined,
    },
    { label: "Membres", value: `${memberCount}`, hint: "dans la salle" },
    {
      label: "Écrans",
      value: `${activeScreens}`,
      hint: activeScreens === 0 ? "aucun appairé" : "appairé" + (activeScreens > 1 ? "s" : ""),
      accent: activeScreens === 0,
    },
  ];

  return (
    <BoxShell slug={slug} boxName={box.name} userName={user.name} active="semaine">
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-7 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <PageTitle eyebrow="Programmation" title={formatWeekRange(monday)}>
            <p className="text-chalk-dim mt-1 text-sm">
              {programmed === 0
                ? "Aucune séance programmée cette semaine."
                : `${programmed} séance${programmed > 1 ? "s" : ""} sur sept jours.`}
            </p>
          </PageTitle>

          <div className="flex flex-wrap items-center gap-2">
            <div className="border-edge-soft flex items-center gap-1 rounded-full border p-1">
              <WeekLink slug={slug} monday={addDays(monday, -7)} label="Semaine précédente">
                ←
              </WeekLink>
              <Link
                href={`/box/${slug}/semaine`}
                className="text-chalk-dim hover:text-chalk focus-visible:ring-brand rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                Cette semaine
              </Link>
              <WeekLink slug={slug} monday={addDays(monday, 7)} label="Semaine suivante">
                →
              </WeekLink>
            </div>
            <DuplicateWeekButton slug={slug} monday={toDayKey(monday)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "border-edge-soft flex flex-col gap-1 rounded-2xl border px-5 py-4",
                stat.accent === true ? "border-urgent/30 bg-urgent/[0.06]" : "bg-white/[0.03]",
              )}
            >
              <span className="text-chalk-faint font-mono text-[10px] tracking-[0.16em] uppercase">
                {stat.label}
              </span>
              <span className="truncate text-xl font-extrabold tracking-[-0.02em]">
                {stat.value}
              </span>
              <span className="text-chalk-faint text-xs">{stat.hint}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const workout = workouts.get(toDayKey(day));
            const isToday = isSameDay(day, today);

            return (
              <Link
                key={toDayKey(day)}
                href={`/box/${slug}/semaine/${toDayKey(day)}`}
                className={cn(
                  "group focus-visible:ring-brand relative flex min-h-56 flex-col gap-2.5 overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none",
                  isToday
                    ? "border-brand/45 bg-brand/[0.12] shadow-[0_18px_50px_-30px_rgba(139,92,246,0.9)]"
                    : "border-edge-soft hover:border-edge bg-white/[0.03] hover:bg-white/[0.055]",
                )}
              >
                {isToday ? (
                  <span
                    aria-hidden
                    className="brand-gradient absolute inset-x-0 top-0 h-[3px] opacity-90"
                  />
                ) : null}

                <div className="flex items-baseline justify-between">
                  <span
                    className={cn(
                      "text-[11px] font-bold tracking-[0.16em] uppercase",
                      isToday ? "text-brand" : "text-chalk-faint",
                    )}
                  >
                    {dayName(day)}
                  </span>
                  <span className="text-chalk-faint font-mono text-[11px] tabular-nums">
                    {formatDayShort(day)}
                  </span>
                </div>

                {workout ? (
                  <>
                    {workout.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="border-edge-soft rounded-xl border bg-white/[0.05] px-3 py-2.5"
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold tracking-[0.14em] uppercase",
                            KIND_TONE[block.kind] ?? "text-chalk-dim",
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
                      <span className="text-chalk-faint mt-auto font-mono text-[10px] tracking-[0.14em] uppercase">
                        Brouillon
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="border-edge text-chalk-faint group-hover:border-brand/40 group-hover:text-chalk-dim mt-auto rounded-xl border border-dashed p-3 text-center text-sm transition-colors">
                    Programmer
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
      className="text-chalk-dim hover:text-chalk focus-visible:ring-brand flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/8 focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}
