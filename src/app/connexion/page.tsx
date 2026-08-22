import Link from "next/link";
import { ChalkMark } from "@/components/chalk-mark";
import { SignInForm } from "@/components/sign-in-form";
import { Atmosphere, Eyebrow } from "@/components/ui/atmosphere";
import { Card } from "@/components/ui/primitives";

export const metadata = { title: "Connexion · Chalk" };

export default function SignInPage() {
  return (
    <>
      <Atmosphere intensity="strong" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-14">
        <div className="flex w-full max-w-sm flex-col gap-7">
          <Link
            href="/"
            className="focus-visible:ring-brand flex w-fit items-center gap-2.5 rounded focus-visible:ring-2 focus-visible:outline-none"
          >
            <ChalkMark className="h-8 w-8" />
            <span className="text-xl font-extrabold tracking-[-0.03em]">Chalk</span>
          </Link>

          <div className="flex flex-col gap-2">
            <Eyebrow>Ta salle</Eyebrow>
            <h1 className="text-4xl font-extrabold tracking-[-0.035em]">Se connecter</h1>
            <p className="text-chalk-dim text-sm">
              Le même accès pour l&apos;espace coach et l&apos;espace membre : c&apos;est ton rôle
              dans la salle qui décide de ce que tu vois.
            </p>
          </div>

          <SignInForm />

          <Card className="flex flex-col gap-2 p-4">
            <Eyebrow>Salle de démonstration</Eyebrow>
            <div className="grid gap-1.5 font-mono text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-chalk-dim">lea@chalk.demo</span>
                <span className="text-chalk-faint">coach</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-chalk-dim">membre1@chalk.demo</span>
                <span className="text-chalk-faint">membre</span>
              </div>
              <div className="border-edge-soft mt-1 flex items-baseline justify-between gap-3 border-t pt-2">
                <span className="text-chalk-faint">mot de passe</span>
                <span className="text-chalk-dim">chalk</span>
              </div>
            </div>
          </Card>

          <Link
            href="/demo/wall"
            className="text-chalk-faint hover:text-chalk-dim focus-visible:ring-brand w-fit rounded text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            ou regarder le mur sans se connecter →
          </Link>
        </div>
      </main>
    </>
  );
}
