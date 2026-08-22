"use client";

import { useActionState } from "react";
import { signInWithPassword, type SignInState } from "@/app/connexion/actions";
import { Button, FIELD } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export function SignInForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signInWithPassword, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
          E-mail
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="lea@chalk.demo"
          className={cn(FIELD, "py-3.5 text-base")}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
          Mot de passe
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cn(FIELD, "py-3.5 text-base")}
        />
      </label>

      {state.error === null ? null : (
        <p
          role="alert"
          className="border-urgent/40 bg-urgent/10 text-urgent rounded-xl border px-4 py-3 text-sm"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? "Connexion…" : "Entrer"}
      </Button>
    </form>
  );
}
