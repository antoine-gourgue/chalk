import { ChalkMark } from "@/components/chalk-mark";
import { Atmosphere, Eyebrow } from "@/components/ui/atmosphere";
import { ButtonLink, Card } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata = {
  title: "Chalk — la séance au mur, en direct",
  description:
    "Le logiciel d'une salle de sport : le coach programme, les membres réservent et notent leurs perfs, et l'écran du mur affiche la séance, le chrono et le classement en temps réel.",
};

const SURFACES = [
  {
    name: "Le mur",
    line: "Écran fixe, lu à cinq mètres",
    body: "La séance du jour, l'anneau du chrono qui se vide, le classement qui bouge. Aucune interaction : tout vient du téléphone du coach.",
    tone: "urgent" as const,
  },
  {
    name: "Le coach",
    line: "Au clavier, sur grand écran",
    body: "La semaine se programme en blocs, se réordonne, se duplique. Le pupitre lance le chrono et affiche la même seconde que le mur.",
    tone: "brand" as const,
  },
  {
    name: "Le membre",
    line: "À une main, dans les vestiaires",
    body: "La séance, le score à saisir, les records qui tombent. Une décision par écran, un bouton assez gros pour être touché sans regarder.",
    tone: "data" as const,
  },
];

export default function Home() {
  return (
    <>
      <Atmosphere intensity="strong" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-6">
        <span className="flex items-center gap-2.5">
          <ChalkMark className="h-7 w-7" />
          <span className="text-xl font-extrabold tracking-[-0.03em]">Chalk</span>
        </span>
        <ButtonLink href="/connexion" variant="ghost" size="sm" className="ml-auto">
          Se connecter
        </ButtonLink>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-28 px-6 pb-28">
        <section className="flex flex-col gap-8 pt-10 sm:pt-16">
          <div className="flex max-w-3xl flex-col gap-6">
            <Eyebrow>Le logiciel d&apos;une salle de sport</Eyebrow>
            <h1 className="text-5xl leading-[0.95] font-black tracking-[-0.04em] text-balance sm:text-7xl">
              La séance au mur, <span className="brand-text">en direct</span>.
            </h1>
            <p className="text-chalk-dim max-w-xl text-lg">
              Le coach programme la semaine, les membres notent leurs perfs, et l&apos;écran
              accroché dans la salle affiche la séance, le chrono et le classement du créneau — à la
              seconde près, sur tous les écrans à la fois.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/demo/wall" size="lg">
                Voir le mur en direct
              </ButtonLink>
              <ButtonLink href="/connexion" variant="ghost" size="lg">
                Entrer dans la démo
              </ButtonLink>
            </div>
          </div>

          <Reveal className="relative">
            <div className="border-edge relative overflow-hidden rounded-[28px] border bg-black/40 p-2 shadow-[0_40px_120px_-40px_rgba(139,92,246,0.7)]">
              <div className="aspect-[16/9] overflow-hidden rounded-[20px]">
                <iframe
                  src="/demo/wall"
                  title="Le mur de la salle de démonstration, en direct"
                  className="pointer-events-none h-full w-full"
                  loading="lazy"
                />
              </div>
            </div>
            <p className="text-chalk-faint mt-3 text-center font-mono text-[11px] tracking-[0.14em] uppercase">
              Ceci n&apos;est pas une image : c&apos;est le mur de la salle de démonstration, en ce
              moment
            </p>
          </Reveal>
        </section>

        <section className="flex flex-col gap-8">
          <Reveal>
            <Eyebrow>Trois surfaces, un seul produit</Eyebrow>
            <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Chacun voit ce dont il a besoin, là où il se trouve
            </h2>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            {SURFACES.map((surface, index) => (
              <Reveal key={surface.name} delay={index * 0.08}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <span
                    className={
                      surface.tone === "urgent"
                        ? "text-urgent text-[11px] font-bold tracking-[0.16em] uppercase"
                        : surface.tone === "brand"
                          ? "text-brand text-[11px] font-bold tracking-[0.16em] uppercase"
                          : "text-data text-[11px] font-bold tracking-[0.16em] uppercase"
                    }
                  >
                    {surface.line}
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-[-0.025em]">{surface.name}</h3>
                  <p className="text-chalk-dim text-sm leading-relaxed">{surface.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="grid items-center gap-10 md:grid-cols-2">
          <Reveal className="flex flex-col gap-5">
            <Eyebrow>Le détail qui change tout</Eyebrow>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Le chrono ne se diffuse pas seconde par seconde
            </h2>
            <p className="text-chalk-dim leading-relaxed">
              Le serveur n&apos;envoie qu&apos;une chose : l&apos;instant où le bloc a commencé.
              Chaque écran calcule ensuite lui-même ce qu&apos;il affiche, et corrige l&apos;écart
              de sa propre horloge dès la connexion.
            </p>
            <p className="text-chalk-dim leading-relaxed">
              C&apos;est ce qui fait que le mur et les téléphones montrent{" "}
              <span className="text-chalk font-semibold">la même seconde</span> — au lieu des trois
              secondes d&apos;écart qui décrédibilisent n&apos;importe quel chrono de salle.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="flex flex-col gap-4 p-7">
              <div className="flex items-center justify-between">
                <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
                  Le mur
                </span>
                <span className="font-mono text-3xl font-semibold tabular-nums">07:42</span>
              </div>
              <div className="border-edge-soft border-t" />
              <div className="flex items-center justify-between">
                <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
                  Le téléphone du coach
                </span>
                <span className="font-mono text-3xl font-semibold tabular-nums">07:42</span>
              </div>
              <div className="border-edge-soft border-t" />
              <div className="flex items-center justify-between">
                <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
                  Le téléphone d&apos;un membre
                </span>
                <span className="text-data font-mono text-3xl font-semibold tabular-nums">
                  07:42
                </span>
              </div>
            </Card>
          </Reveal>
        </section>

        <section>
          <Reveal>
            <Card className="flex flex-col items-start gap-5 p-8 sm:p-10">
              <Eyebrow>Salle de démonstration</Eyebrow>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
                Entre dans une salle qui tourne déjà
              </h2>
              <p className="text-chalk-dim max-w-xl">
                Une box fictive, sa semaine programmée, ses membres et leurs scores. Connecte-toi en
                coach pour lancer le chrono, ou en membre pour saisir une perf et voir le mur
                réagir.
              </p>
              <div className="border-edge-soft grid gap-3 rounded-xl border bg-black/20 p-4 font-mono text-xs sm:grid-cols-2">
                <div>
                  <span className="text-chalk-faint">Coach</span>
                  <p className="text-chalk mt-1">lea@chalk.demo</p>
                </div>
                <div>
                  <span className="text-chalk-faint">Membre</span>
                  <p className="text-chalk mt-1">membre1@chalk.demo</p>
                </div>
                <p className="text-chalk-faint sm:col-span-2">
                  Mot de passe : <span className="text-chalk-dim">chalk</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/connexion" size="lg">
                  Se connecter
                </ButtonLink>
                <ButtonLink href="/demo/wall" variant="ghost" size="lg">
                  Ouvrir le mur
                </ButtonLink>
              </div>
            </Card>
          </Reveal>
        </section>
      </main>

      <footer className="border-edge-soft relative z-10 border-t">
        <div className="text-chalk-faint mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-8 font-mono text-xs tracking-[0.04em]">
          <ChalkMark className="h-5 w-5" />
          <span>Chalk — la séance au mur, en direct</span>
          <a
            href="https://github.com/antoine-gourgue/chalk"
            className="hover:text-chalk-dim focus-visible:ring-brand ml-auto rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            Le code
          </a>
        </div>
      </footer>
    </>
  );
}
