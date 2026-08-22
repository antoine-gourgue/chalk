"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBoxTimer } from "@/components/use-box-timer";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/timer";
import { BLOCK_FORMAT_LABELS, BLOCK_KIND_LABELS } from "@/lib/workout-schema";

export type WallBlock = {
  id: string;
  kind: keyof typeof BLOCK_KIND_LABELS;
  format: keyof typeof BLOCK_FORMAT_LABELS;
  title: string | null;
  durationSeconds: number | null;
  movements: { id: string; reps: number | null; name: string; detail: string | null }[];
};

export type WallScore = { id: string; name: string; score: string; rx: boolean };

/**
 * L'écran accroché au mur de la salle : aucune interaction, tout est piloté
 * depuis le téléphone du coach. Les tailles sont en `vw` parce que la seule
 * contrainte qui compte ici est la lisibilité à cinq mètres.
 */
export function WallDisplay({
  boxSlug,
  header,
  blocks,
  scores,
  attendees,
}: {
  boxSlug: string;
  header: string;
  blocks: WallBlock[];
  scores: WallScore[];
  attendees: number;
}) {
  const router = useRouter();
  const { timer, remaining, progress, finalCountdown, connected, scoreVersion } =
    useBoxTimer(boxSlug);

  /**
   * Un score saisi depuis un téléphone déclenche un signal de la passerelle : le
   * mur relit alors son classement immédiatement. Le rafraîchissement périodique
   * ne sert plus que de filet, si le signal s'est perdu.
   */
  useEffect(() => {
    router.refresh();
  }, [router, scoreVersion]);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(interval);
  }, [router]);

  /**
   * Tant qu'aucun chrono ne tourne, le mur montre le metcon plutôt que le premier
   * bloc : c'est ce que la salle vient lire, pas l'échauffement.
   */
  const active =
    blocks.find((block) => block.id === timer?.blockId) ??
    blocks.find((block) => block.kind === "METCON") ??
    blocks[0] ??
    null;
  const idleSeconds = active?.durationSeconds ?? 0;
  const shown = timer === null || timer.status === "idle" ? idleSeconds : remaining;
  const sweep = (timer === null ? 0 : 1 - progress) * 360;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,#241243_0%,#0b0616_60%,#060310_100%)]">
      <header className="flex items-center gap-[1.4vw] px-[3vw] pt-[2vw] text-[1.15vw] font-semibold tracking-[0.16em] uppercase">
        <span className="text-[1.5vw] font-extrabold tracking-[-0.02em] normal-case">Chalk</span>
        <span className="text-chalk-faint">{header}</span>
        <span
          className={cn(
            "ml-auto flex items-center gap-[0.6vw]",
            connected ? "text-urgent" : "text-chalk-faint",
          )}
        >
          <span
            className={cn(
              "h-[0.75vw] w-[0.75vw] rounded-full",
              connected
                ? "bg-urgent shadow-[0_0_1.2vw_var(--pink)] motion-safe:animate-pulse"
                : "bg-chalk-faint",
            )}
          />
          {connected ? `${attendees} présents` : "Hors ligne"}
        </span>
      </header>

      <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-[2vw] px-[3vw] pb-[2.6vw]">
        <section>
          <h1 className="mb-[1.4vw] text-[4.6vw] leading-[0.95] font-black tracking-[-0.03em]">
            {active === null
              ? "Aucune séance"
              : (active.title ?? BLOCK_FORMAT_LABELS[active.format])}
          </h1>

          <ul className="flex flex-col gap-[0.75vw]">
            {active?.movements.map((movement) => (
              <li
                key={movement.id}
                className="border-edge flex items-center gap-[1vw] rounded-full border bg-white/6 px-[1.3vw] py-[0.75vw] text-[1.55vw] font-semibold"
              >
                {movement.reps === null ? null : (
                  <b className="text-data font-extrabold tabular-nums">{movement.reps}</b>
                )}
                {movement.name}
                {movement.detail === null ? null : (
                  <span className="text-chalk-faint ml-auto text-[1.15vw] font-medium">
                    {movement.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div
          className="grid h-[26vw] w-[26vw] place-items-center rounded-full transition-[background] duration-300"
          style={{
            background: finalCountdown
              ? `conic-gradient(from 180deg, var(--pink) 0deg ${sweep}deg, rgba(255,255,255,0.07) ${sweep}deg 360deg)`
              : `conic-gradient(from 180deg, var(--pink) 0deg, var(--violet) ${sweep * 0.55}deg, var(--cyan) ${sweep}deg, rgba(255,255,255,0.07) ${sweep}deg 360deg)`,
          }}
        >
          <div className="grid h-[calc(100%-2.2vw)] w-[calc(100%-2.2vw)] place-content-center rounded-full bg-[#0a0518] text-center">
            <span className="text-chalk-faint text-[1.05vw] font-semibold tracking-[0.2em] uppercase">
              {timer === null || timer.status === "idle"
                ? "Prêt"
                : timer.status === "paused"
                  ? "En pause"
                  : remaining === 0
                    ? "Terminé"
                    : "Restant"}
            </span>
            <span
              className={cn(
                "text-[7vw] leading-none font-extrabold tracking-[-0.04em] tabular-nums",
                finalCountdown && "text-urgent",
              )}
            >
              {formatClock(shown)}
            </span>
          </div>
        </div>

        <section className="flex flex-col gap-[0.7vw]">
          {scores.length === 0 ? (
            <p className="border-edge-soft text-chalk-faint rounded-[1vw] border bg-white/4 px-[1.2vw] py-[1vw] text-[1.3vw]">
              Les scores s&apos;affichent ici dès la première performance saisie.
            </p>
          ) : (
            scores.map((score, index) => (
              <div
                key={score.id}
                className={cn(
                  "flex items-center gap-[1vw] rounded-[1vw] border px-[1.2vw] py-[0.85vw] text-[1.4vw] font-semibold",
                  index === 0
                    ? "border-urgent/50 bg-gradient-to-r from-[rgba(255,46,136,0.28)] to-[rgba(139,92,246,0.18)]"
                    : "border-edge-soft bg-white/5",
                )}
              >
                <span className="text-chalk-faint w-[1.6vw] text-[1.1vw] tabular-nums">
                  {index + 1}
                </span>
                {score.name}
                <span
                  className={cn(
                    "rounded-full px-[0.6vw] py-[0.15vw] text-[0.9vw] font-bold tracking-[0.1em]",
                    score.rx ? "bg-data/20 text-data" : "text-chalk-dim bg-white/12",
                  )}
                >
                  {score.rx ? "RX" : "SC"}
                </span>
                <span className="ml-auto tabular-nums">{score.score}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
