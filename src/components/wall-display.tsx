"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useBoxTimer } from "@/components/use-box-timer";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/timer";
import { BLOCK_FORMAT_LABELS, BLOCK_KIND_LABELS } from "@/lib/workout-schema";

gsap.registerPlugin(useGSAP);

export type WallBlock = {
  id: string;
  kind: keyof typeof BLOCK_KIND_LABELS;
  format: keyof typeof BLOCK_FORMAT_LABELS;
  title: string | null;
  durationSeconds: number | null;
  movements: { id: string; reps: number | null; name: string; detail: string | null }[];
};

export type WallScore = { id: string; name: string; score: string; rx: boolean };

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * L'écran accroché au mur de la salle.
 *
 * Aucune interaction : tout est piloté depuis le téléphone du coach. Les tailles
 * sont en `vw` parce que la seule contrainte qui compte ici est la lisibilité à
 * cinq mètres. Le mouvement ne sert qu'à trois choses — annoncer le départ,
 * avertir de la fin, montrer qu'un score vient de tomber — et s'efface
 * entièrement sur un poste qui demande du calme.
 */
export function WallDisplay({
  boxSlug,
  header,
  blocks,
  scores,
}: {
  boxSlug: string;
  header: string;
  blocks: WallBlock[];
  scores: WallScore[];
}) {
  const router = useRouter();
  const { timer, remaining, progress, finalCountdown, leadIn, finished, connected, scoreVersion } =
    useBoxTimer(boxSlug);

  const root = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, { top: number; score: string }>());

  /** Un score saisi depuis un téléphone : le mur relit son classement aussitôt. */
  useEffect(() => {
    router.refresh();
  }, [router, scoreVersion]);

  /** Filet, si le signal temps réel s'est perdu. */
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(interval);
  }, [router]);

  const active =
    blocks.find((block) => block.id === timer?.blockId) ??
    blocks.find((block) => block.kind === "METCON") ??
    blocks[0] ??
    null;

  const idleSeconds = active?.durationSeconds ?? 0;
  const running = timer !== null && timer.status !== "idle";
  const shown = running && leadIn === 0 ? remaining : idleSeconds;
  const remainingRatio = 1 - progress;
  const headAngle = (-90 + 360 * remainingRatio) * (Math.PI / 180);

  /** Ambiance : deux halos qui dérivent lentement. */
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".wall-halo-a", {
          xPercent: 12,
          yPercent: 8,
          duration: 26,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(".wall-halo-b", {
          xPercent: -14,
          yPercent: -6,
          duration: 34,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
      return () => media.revert();
    },
    { scope: root },
  );

  /** Changement de bloc : la séance se réécrit au tableau. */
  useGSAP(
    () => {
      gsap.from(".wall-title", { opacity: 0, y: 18, duration: 0.5, ease: "power3.out" });
      gsap.from(".wall-movement", {
        opacity: 0,
        y: 26,
        duration: 0.5,
        stagger: 0.07,
        ease: "power3.out",
      });
    },
    { scope: root, dependencies: [active?.id] },
  );

  /** Le « 3, 2, 1 » : un chiffre par seconde, plein cadre. */
  useGSAP(
    () => {
      if (leadIn === 0 || leadRef.current === null) {
        return;
      }
      gsap.fromTo(
        leadRef.current,
        { scale: 1.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.22, ease: "power3.out" },
      );
    },
    { scope: root, dependencies: [leadIn] },
  );

  /** Dernières secondes : le cadre bat, le chrono se gonfle à chaque seconde. */
  useGSAP(
    () => {
      if (!finalCountdown) {
        return;
      }
      gsap.fromTo(
        clockRef.current,
        { scale: 1.08 },
        { scale: 1, duration: 0.42, ease: "power2.out" },
      );
      gsap.fromTo(
        vignetteRef.current,
        { opacity: 0.55 },
        { opacity: 0, duration: 0.7, ease: "power2.out" },
      );
    },
    { scope: root, dependencies: [remaining, finalCountdown] },
  );

  /** Fin du bloc : un mot, puis on rend l'écran au classement. */
  useGSAP(
    () => {
      if (!finished || finishRef.current === null) {
        return;
      }
      const timeline = gsap.timeline();
      timeline
        .fromTo(
          finishRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
        )
        .to(finishRef.current, { opacity: 0, duration: 0.6, delay: 2.2, ease: "power2.in" });
      return () => {
        timeline.kill();
      };
    },
    { scope: root, dependencies: [finished] },
  );

  /**
   * Classement : chaque ligne glisse de son ancienne place vers la nouvelle, et
   * le score qui vient de tomber s'écrit en cyan. Les positions sont relevées
   * après chaque rendu et la différence jouée à l'envers — le principe FLIP, sans
   * plugin.
   */
  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>(".wall-row");
      const previous = positions.current;
      const next = new Map<string, { top: number; score: string }>();

      rows.forEach((row) => {
        const id = row.dataset.id ?? "";
        const score = row.dataset.score ?? "";
        const top = row.offsetTop;
        next.set(id, { top, score });

        const before = previous.get(id);
        if (before === undefined) {
          gsap.from(row, { opacity: 0, x: 40, duration: 0.45, ease: "power3.out" });
          return;
        }
        if (before.top !== top) {
          gsap.from(row, { y: before.top - top, duration: 0.55, ease: "power3.inOut" });
        }
        if (before.score !== score) {
          gsap.fromTo(
            row.querySelector(".wall-row-score"),
            { color: "var(--cyan)", scale: 1.3 },
            { color: "", scale: 1, duration: 0.9, ease: "power2.out" },
          );
        }
      });

      positions.current = next;
    },
    { scope: root, dependencies: [scores] },
  );

  return (
    <div ref={root} className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#07040f]">
      <div
        aria-hidden
        className="wall-halo-a pointer-events-none absolute -top-[20vw] -left-[10vw] h-[60vw] w-[60vw] rounded-full opacity-70 blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.42), transparent 65%)" }}
      />
      <div
        aria-hidden
        className="wall-halo-b pointer-events-none absolute -right-[14vw] -bottom-[24vw] h-[52vw] w-[52vw] rounded-full opacity-60 blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(255,46,136,0.32), transparent 65%)" }}
      />
      <div
        ref={vignetteRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-0"
        style={{ boxShadow: "inset 0 0 18vw 4vw rgba(255,46,136,0.55)" }}
      />

      <header className="relative z-10 flex items-center gap-[1.4vw] px-[3vw] pt-[2vw] text-[1.15vw] font-semibold tracking-[0.16em] uppercase">
        <span className="text-[1.6vw] font-extrabold tracking-[-0.02em] normal-case">Chalk</span>
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
          {connected
            ? scores.length === 0
              ? "En direct"
              : `${scores.length} scores`
            : "Hors ligne"}
        </span>
      </header>

      <div className="relative z-10 grid flex-1 grid-cols-[1.05fr_auto_0.95fr] items-center gap-[2vw] px-[3vw] pb-[2.6vw]">
        <section>
          {active === null ? null : (
            <p className="text-data wall-title mb-[0.6vw] text-[1.1vw] font-bold tracking-[0.18em] uppercase">
              {BLOCK_KIND_LABELS[active.kind]} · {BLOCK_FORMAT_LABELS[active.format]}
            </p>
          )}
          <h1 className="wall-title mb-[1.6vw] text-[4.8vw] leading-[0.92] font-black tracking-[-0.035em]">
            {active === null
              ? "Aucune séance aujourd’hui"
              : (active.title ?? BLOCK_FORMAT_LABELS[active.format])}
          </h1>

          <ul className="flex flex-col gap-[0.75vw]">
            {active?.movements.map((movement) => (
              <li
                key={movement.id}
                className="wall-movement border-edge flex items-center gap-[1vw] rounded-full border bg-white/6 px-[1.4vw] py-[0.8vw] text-[1.6vw] font-semibold backdrop-blur-sm"
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

        <div className="relative grid h-[30vw] w-[30vw] place-items-center">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
            <defs>
              <linearGradient
                id="wall-ring"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="200"
                x2="200"
                y2="0"
              >
                <stop offset="0%" stopColor="#ff2e88" />
                <stop offset="55%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <filter id="wall-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="9"
            />
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={finalCountdown ? "#ff2e88" : "url(#wall-ring)"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - remainingRatio)}
              filter="url(#wall-glow)"
              style={{ transition: "stroke-dashoffset 120ms linear" }}
            />
            {running && leadIn === 0 && remainingRatio > 0 ? (
              <circle
                cx={100 + RADIUS * Math.cos(headAngle + Math.PI / 2)}
                cy={100 + RADIUS * Math.sin(headAngle + Math.PI / 2)}
                r="7"
                fill={finalCountdown ? "#ff2e88" : "#22d3ee"}
                filter="url(#wall-glow)"
              />
            ) : null}
          </svg>

          <div className="relative text-center">
            <span className="text-chalk-faint block text-[1.05vw] font-semibold tracking-[0.2em] uppercase">
              {leadIn > 0
                ? "Départ"
                : timer === null || timer.status === "idle"
                  ? "Prêt"
                  : timer.status === "paused"
                    ? "En pause"
                    : remaining === 0
                      ? "Terminé"
                      : "Restant"}
            </span>
            <span
              ref={clockRef}
              className={cn(
                "block text-[7.4vw] leading-none font-extrabold tracking-[-0.04em] tabular-nums",
                finalCountdown && "text-urgent",
              )}
            >
              {formatClock(shown)}
            </span>
            {blocks.length < 2 || active === null ? null : (
              <span className="text-chalk-faint block text-[0.95vw] font-medium tracking-[0.14em] uppercase">
                Bloc {blocks.findIndex((block) => block.id === active.id) + 1} sur {blocks.length}
              </span>
            )}
          </div>
        </div>

        <section className="relative flex flex-col gap-[0.7vw]">
          {scores.length === 0 ? (
            <p className="border-edge-soft text-chalk-faint rounded-[1vw] border bg-white/4 px-[1.2vw] py-[1vw] text-[1.25vw]">
              Les scores s&apos;affichent ici dès la première performance saisie.
            </p>
          ) : (
            scores.map((score, index) => (
              <div
                key={score.id}
                data-id={score.id}
                data-score={score.score}
                className={cn(
                  "wall-row flex items-center gap-[1vw] rounded-[1vw] border px-[1.2vw] py-[0.9vw] text-[1.45vw] font-semibold",
                  index === 0
                    ? "border-urgent/50 bg-gradient-to-r from-[rgba(255,46,136,0.3)] to-[rgba(139,92,246,0.16)]"
                    : "border-edge-soft bg-white/5",
                )}
              >
                <span className="text-chalk-faint w-[1.6vw] text-[1.1vw] tabular-nums">
                  {index + 1}
                </span>
                <span className="truncate">{score.name}</span>
                <span
                  className={cn(
                    "rounded-full px-[0.6vw] py-[0.15vw] text-[0.9vw] font-bold tracking-[0.1em]",
                    score.rx ? "bg-data/20 text-data" : "text-chalk-dim bg-white/12",
                  )}
                >
                  {score.rx ? "RX" : "SC"}
                </span>
                <span className="wall-row-score ml-auto tabular-nums">{score.score}</span>
              </div>
            ))
          )}
        </section>
      </div>

      {leadIn > 0 ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#07040f]/94">
          <div ref={leadRef} className="text-center">
            <span
              className="block text-[22vw] leading-[0.85] font-black tracking-[-0.06em] tabular-nums"
              style={{
                backgroundImage: "linear-gradient(150deg, #22d3ee, #8b5cf6 55%, #ff2e88)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {leadIn}
            </span>
            <span className="text-data mt-[1vw] block text-[1.6vw] font-bold tracking-[0.42em] uppercase">
              En place
            </span>
          </div>
        </div>
      ) : null}

      {finished ? (
        <div
          ref={finishRef}
          className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
        >
          <span className="text-urgent text-[12vw] leading-none font-black tracking-[-0.04em] drop-shadow-[0_0_6vw_rgba(255,46,136,0.8)]">
            TEMPS
          </span>
        </div>
      ) : null}
    </div>
  );
}
