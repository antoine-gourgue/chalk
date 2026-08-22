"use client";

import { useState, useTransition } from "react";
import { duplicateWeek } from "@/app/box/[slug]/actions";

/** Recopie la semaine affichée sur la suivante, sans écraser ce qui existe déjà. */
export function DuplicateWeekButton({ slug, monday }: { slug: string; monday: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await duplicateWeek(slug, monday);
            setMessage(result.ok ? "Semaine recopiée sur la suivante" : result.error);
          });
        }}
        className="border-edge hover:bg-white/8 focus-visible:ring-brand rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      >
        {pending ? "Copie…" : "Dupliquer sur la semaine suivante"}
      </button>
      {message ? <span className="text-chalk-dim text-sm">{message}</span> : null}
    </div>
  );
}
