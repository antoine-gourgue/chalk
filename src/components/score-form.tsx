"use client";

import { useActionState } from "react";
import { saveResult, type SaveResultState } from "@/app/app/[slug]/actions";
import { cn } from "@/lib/cn";
import { scoreTypeForFormat } from "@/lib/score";

export type ExistingResult = {
  rounds: number | null;
  reps: number | null;
  value: number;
  rx: boolean;
  note: string | null;
} | null;

const field =
  "border-edge-soft focus:border-brand focus-visible:ring-brand/40 rounded-xl border bg-white/5 px-4 py-3 text-base transition-colors focus-visible:ring-2 focus-visible:outline-none";

function clockValue(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

/** Saisie de la performance d'un membre, adaptée à la façon dont le bloc se marque. */
export function ScoreForm({
  boxSlug,
  blockId,
  format,
  existing,
}: {
  boxSlug: string;
  blockId: string;
  format: string;
  existing: ExistingResult;
}) {
  const [state, formAction, pending] = useActionState<SaveResultState, FormData>(saveResult, {
    error: null,
    saved: false,
    record: null,
  });

  const scoreType = scoreTypeForFormat(format);

  return (
    <form action={formAction} className="border-edge-soft flex flex-col gap-3 border-t pt-4">
      <input type="hidden" name="boxSlug" value={boxSlug} />
      <input type="hidden" name="blockId" value={blockId} />

      <div className="flex flex-wrap items-end gap-2">
        {scoreType === "ROUNDS_REPS" ? (
          <>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
                Tours
              </span>
              <input
                name="rounds"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={existing?.rounds ?? ""}
                className={cn(field, "text-data w-full font-mono font-semibold tabular-nums")}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
                Reps en plus
              </span>
              <input
                name="reps"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={existing?.reps ?? ""}
                className={cn(field, "text-data w-full font-mono font-semibold tabular-nums")}
              />
            </label>
          </>
        ) : null}

        {scoreType === "TIME" ? (
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
              Temps
            </span>
            <input
              name="clock"
              inputMode="numeric"
              placeholder="8:42"
              defaultValue={existing === null ? "" : clockValue(existing.value)}
              className={cn(field, "text-data w-full font-mono font-semibold tabular-nums")}
            />
          </label>
        ) : null}

        {scoreType === "LOAD" ? (
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
              Charge (kg)
            </span>
            <input
              name="load"
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              defaultValue={existing?.value ?? ""}
              className={cn(field, "text-data w-full font-mono font-semibold tabular-nums")}
            />
          </label>
        ) : null}

        {scoreType === "REPS" ? (
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
              Répétitions
            </span>
            <input
              name="reps"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={existing?.reps ?? ""}
              className={cn(field, "text-data w-full font-mono font-semibold tabular-nums")}
            />
          </label>
        ) : null}

        <label className="border-edge text-chalk-dim flex cursor-pointer items-center gap-2 rounded-full border px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="rx"
            defaultChecked={existing?.rx ?? true}
            className="accent-brand"
          />
          Rx
        </label>
      </div>

      <input
        name="note"
        placeholder="Une note pour toi (facultatif)"
        defaultValue={existing?.note ?? ""}
        className={cn(field, "text-sm")}
      />

      {state.error === null ? null : (
        <p
          role="alert"
          className="border-urgent/40 bg-urgent/10 text-urgent rounded-xl border px-4 py-3 text-sm"
        >
          {state.error}
        </p>
      )}

      {state.record === null ? null : (
        <p className="border-data/40 bg-data/10 text-data rounded-xl border px-4 py-3 text-sm font-semibold">
          Nouveau record sur {state.record.movement} : {state.record.value}{" "}
          {state.record.unit === "KG" ? "kg" : state.record.unit === "SECONDS" ? "s" : "reps"}
          {state.record.previous === null
            ? " — le premier."
            : ` — ${state.record.value - state.record.previous > 0 ? "+" : ""}${(
                state.record.value - state.record.previous
              ).toFixed(1)} sur ton précédent.`}
        </p>
      )}

      {state.saved && state.record === null ? (
        <p className="text-chalk-faint text-sm">Score enregistré.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient text-void focus-visible:ring-brand rounded-full px-5 py-3.5 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : existing === null ? "Enregistrer mon score" : "Corriger"}
      </button>
    </form>
  );
}
