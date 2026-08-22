"use client";

import { useActionState } from "react";
import { pairWall, type PairResult } from "@/app/wall/actions";
import { PAIRING_CODE_LENGTH } from "@/lib/pairing";

export function PairWallForm() {
  const [state, formAction, pending] = useActionState<PairResult, FormData>(
    pairWall,
    {} as PairResult,
  );

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col items-center gap-5">
      <input
        name="code"
        maxLength={PAIRING_CODE_LENGTH}
        autoCapitalize="characters"
        autoComplete="off"
        autoFocus
        placeholder="A2C4E6"
        aria-label="Code d'appairage"
        className="border-edge focus:border-brand focus-visible:ring-brand/40 placeholder:text-chalk-faint/40 w-full rounded-2xl border bg-white/5 py-6 text-center font-mono text-6xl font-semibold tracking-[0.25em] uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
      />

      {"error" in state && state.error ? (
        <p
          role="alert"
          className="border-urgent/40 bg-urgent/10 text-urgent rounded-xl border px-4 py-3 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient text-void focus-visible:ring-brand w-full rounded-full px-6 py-4 text-lg font-bold transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      >
        {pending ? "Appairage…" : "Appairer"}
      </button>
    </form>
  );
}
