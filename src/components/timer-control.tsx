"use client";

import { useState, useTransition } from "react";
import { controlTimer } from "@/app/box/[slug]/actions";
import { useBoxTimer } from "@/components/use-box-timer";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/timer";
import { BLOCK_FORMAT_LABELS, BLOCK_KIND_LABELS } from "@/lib/workout-schema";

export type ControlBlock = {
  id: string;
  kind: keyof typeof BLOCK_KIND_LABELS;
  format: keyof typeof BLOCK_FORMAT_LABELS;
  title: string | null;
  durationSeconds: number | null;
};

/**
 * Le pupitre du coach, tenu à une main au bord du tapis. Il affiche exactement ce
 * que montre le mur — même état, même seconde — pour qu'il n'ait jamais à
 * regarder l'écran derrière lui pour savoir où en est le chrono.
 */
export function TimerControl({ boxSlug, blocks }: { boxSlug: string; blocks: ControlBlock[] }) {
  const { timer, remaining, finalCountdown, connected } = useBoxTimer(boxSlug);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(blocks[0]?.id ?? "");

  const running = timer !== null && timer.status === "running";
  const paused = timer !== null && timer.status === "paused";
  const activeBlock = blocks.find((block) => block.id === timer?.blockId) ?? null;
  const shownSeconds =
    timer === null || timer.status === "idle"
      ? (blocks.find((block) => block.id === selected)?.durationSeconds ?? 0)
      : remaining;

  function send(action: () => Parameters<typeof controlTimer>[0]) {
    setError(null);
    startTransition(async () => {
      const result = await controlTimer(action());
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] uppercase">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            connected ? "bg-urgent motion-safe:animate-pulse" : "bg-chalk-faint",
          )}
        />
        <span className={connected ? "text-urgent" : "text-chalk-faint"}>
          {connected ? "Relié au mur" : "Passerelle hors ligne"}
        </span>
      </div>

      <div
        className={cn(
          "border-edge-soft bg-night flex flex-col items-center gap-2 rounded-3xl border py-10",
          finalCountdown && "border-urgent/50",
        )}
      >
        <span className="text-chalk-faint font-mono text-[11px] tracking-[0.2em] uppercase">
          {activeBlock === null
            ? "Aucun bloc lancé"
            : (activeBlock.title ?? BLOCK_FORMAT_LABELS[activeBlock.format])}
        </span>
        <span
          className={cn(
            "text-7xl leading-none font-extrabold tracking-[-0.04em] tabular-nums",
            finalCountdown && "text-urgent",
          )}
        >
          {formatClock(shownSeconds)}
        </span>
        <span className="text-chalk-faint text-sm">
          {running ? "En cours" : paused ? "En pause" : "Prêt"}
        </span>
      </div>

      {blocks.length === 0 ? (
        <p className="border-edge-soft text-chalk-dim rounded-2xl border bg-white/3 px-5 py-6 text-sm">
          Aucune séance programmée aujourd&apos;hui : le mur n&apos;a rien à afficher.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {blocks.map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => setSelected(block.id)}
                className={cn(
                  "focus-visible:ring-brand flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  selected === block.id
                    ? "border-brand/50 bg-brand/12"
                    : "border-edge-soft hover:bg-white/6",
                )}
              >
                <span className="text-data text-[10px] font-bold tracking-[0.12em] uppercase">
                  {BLOCK_KIND_LABELS[block.kind]}
                </span>
                <span className="font-semibold">
                  {block.title ?? BLOCK_FORMAT_LABELS[block.format]}
                </span>
                <span className="text-chalk-faint ml-auto font-mono text-xs tabular-nums">
                  {block.durationSeconds === null
                    ? "—"
                    : `${Math.round(block.durationSeconds / 60)} min`}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {running ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => send(() => ({ command: "pause", boxSlug }))}
                className="border-edge hover:bg-white/8 focus-visible:ring-brand flex-1 rounded-full border px-6 py-4 text-base font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                disabled={pending || selected === ""}
                onClick={() =>
                  send(() =>
                    paused
                      ? { command: "resume", boxSlug }
                      : {
                          command: "start",
                          boxSlug,
                          blockId: selected,
                          durationSeconds:
                            blocks.find((block) => block.id === selected)?.durationSeconds ?? 0,
                        },
                  )
                }
                className="brand-gradient text-void focus-visible:ring-brand flex-1 rounded-full px-6 py-4 text-base font-bold transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                {paused ? "Reprendre" : "Démarrer"}
              </button>
            )}

            <button
              type="button"
              disabled={pending || timer === null}
              onClick={() => send(() => ({ command: "reset", boxSlug }))}
              className="border-edge text-chalk-dim hover:text-urgent hover:border-urgent/50 focus-visible:ring-urgent rounded-full border px-6 py-4 text-base font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              Réinitialiser
            </button>
          </div>
        </>
      )}

      {error === null ? null : (
        <p
          role="alert"
          className="border-urgent/40 bg-urgent/10 text-urgent rounded-xl border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}
    </div>
  );
}
