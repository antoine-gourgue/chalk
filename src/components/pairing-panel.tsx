"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPairingCode, revokeDevice } from "@/app/box/[slug]/actions";
import { PAIRING_TTL_MINUTES } from "@/lib/pairing";

export type DeviceRow = {
  id: string;
  name: string;
  paired: boolean;
  pendingCode: string | null;
  expiresAt: string | null;
  lastSeen: string | null;
};

function relative(iso: string | null): string {
  if (iso === null) {
    return "jamais";
  }
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) {
    return "à l'instant";
  }
  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `il y a ${hours} h` : `il y a ${Math.round(hours / 24)} j`;
}

export function PairingPanel({ slug, devices }: { slug: string; devices: DeviceRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="border-edge-soft bg-night flex flex-col gap-3 rounded-2xl border p-5">
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom de l'écran — « Grand mur »"
            aria-label="Nom de l'écran"
            className="border-edge-soft focus:border-brand focus-visible:ring-brand/40 min-w-48 flex-1 rounded-xl border bg-white/5 px-4 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await createPairingCode(slug, name);
                if (result.ok) {
                  setCode(result.code);
                  setName("");
                  router.refresh();
                } else {
                  setError(result.error);
                }
              });
            }}
            className="brand-gradient text-void focus-visible:ring-brand rounded-full px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            {pending ? "…" : "Générer un code"}
          </button>
        </div>

        {code === null ? null : (
          <div className="border-brand/40 bg-brand/10 flex flex-col items-center gap-1 rounded-xl border py-5">
            <span className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
              À saisir sur l&apos;écran, sous {PAIRING_TTL_MINUTES} minutes
            </span>
            <span className="font-mono text-5xl font-semibold tracking-[0.2em] tabular-nums">
              {code}
            </span>
          </div>
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

      <div className="flex flex-col gap-2">
        {devices.length === 0 ? (
          <p className="text-chalk-faint text-sm">Aucun écran pour le moment.</p>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="border-edge-soft flex flex-wrap items-center gap-3 rounded-2xl border bg-white/3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{device.name}</p>
                <p className="text-chalk-faint font-mono text-xs">
                  {device.paired
                    ? `Appairé · vu ${relative(device.lastSeen)}`
                    : device.pendingCode === null
                      ? "Code expiré"
                      : `En attente · code ${device.pendingCode}`}
                </p>
              </div>

              <span
                className={
                  device.paired
                    ? "bg-data/16 text-data rounded-full px-3 py-1 text-xs font-semibold"
                    : "text-chalk-dim rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
                }
              >
                {device.paired ? "Actif" : "En attente"}
              </span>

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await revokeDevice(slug, device.id);
                    router.refresh();
                  })
                }
                className="text-chalk-faint hover:text-urgent focus-visible:ring-urgent rounded-full px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                Révoquer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
