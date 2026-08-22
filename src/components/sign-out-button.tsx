"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/connexion/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => signOutAction())}
      className="text-chalk-faint hover:text-chalk-dim focus-visible:ring-brand rounded-full px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}
