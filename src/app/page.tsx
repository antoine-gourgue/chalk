import { ChalkMark } from "@/components/chalk-mark";

/**
 * Page d'attente : elle n'existe que pour vérifier que les jetons de design et
 * les polices sont bien câblés. Elle sera remplacée par la page marketing.
 */
export default function Home() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 20% 0%, rgba(139,92,246,0.22), transparent 70%), radial-gradient(50% 40% at 85% 15%, rgba(255,46,136,0.14), transparent 70%)",
        }}
      />
      <div className="relative flex max-w-xl flex-col items-start gap-6">
        <ChalkMark className="h-16 w-16" />
        <h1 className="text-6xl font-black tracking-[-0.045em] sm:text-7xl">
          <span className="brand-gradient bg-clip-text text-transparent">Chalk</span>
        </h1>
        <p className="text-xl font-semibold tracking-[-0.01em]">La séance au mur, en direct.</p>
        <p className="text-chalk-dim">
          Le coach programme, les membres réservent et notent leurs perfs, et l&apos;écran de la
          salle affiche la séance, le chrono et le classement du créneau en temps réel.
        </p>
        <p className="font-mono text-xs tracking-[0.14em] text-chalk-faint uppercase">
          En construction
        </p>
      </div>
    </main>
  );
}
