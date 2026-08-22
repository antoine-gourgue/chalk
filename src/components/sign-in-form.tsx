"use client";

import { useActionState } from "react";
import { signInWithPassword, type SignInState } from "@/app/connexion/actions";

const field =
  "border-edge-soft focus:border-brand focus-visible:ring-brand/40 w-full rounded-xl border bg-white/5 px-4 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";

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
          className={field}
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
          className={field}
        />
      </label>

      {state.error ? (
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
        className="brand-gradient text-void focus-visible:ring-brand mt-1 rounded-full px-5 py-3.5 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Entrer"}
      </button>
    </form>
  );
}
