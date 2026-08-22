import { ChalkMark } from "@/components/chalk-mark";
import { SignInForm } from "@/components/sign-in-form";

export const metadata = { title: "Connexion · Chalk" };

export default function SignInPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 0%, rgba(139,92,246,0.22), transparent 70%), radial-gradient(40% 40% at 80% 20%, rgba(255,46,136,0.12), transparent 70%)",
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col gap-7">
        <div className="flex flex-col gap-3">
          <ChalkMark className="h-10 w-10" />
          <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Se connecter</h1>
          <p className="text-chalk-dim text-sm">
            L&apos;espace coach et l&apos;espace membre de ta salle.
          </p>
        </div>

        <SignInForm />

        <p className="border-edge-soft text-chalk-faint rounded-xl border bg-white/3 px-4 py-3 font-mono text-xs leading-relaxed">
          Salle de démonstration
          <br />
          <span className="text-chalk-dim">lea@chalk.demo</span> · mot de passe{" "}
          <span className="text-chalk-dim">chalk</span>
        </p>
      </div>
    </main>
  );
}
