import Link from "next/link";
import { ChalkMark } from "@/components/chalk-mark";
import { Atmosphere, Eyebrow } from "@/components/ui/atmosphere";
import { ButtonLink, Card } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata = {
  title: "Chalk — la séance au mur, en direct",
  description:
    "Le logiciel d'une salle de sport : le coach programme, les membres notent leurs perfs, et l'écran du mur affiche la séance, le chrono et le classement en temps réel.",
};

const REPLACES = [
  {
    before: "Le tableau blanc",
    after: "La séance s'affiche seule, tous les jours, sans qu'on la recopie.",
  },
  {
    before: "Le chrono mural à pile",
    after: "Un départ, tous les écrans à la même seconde, pause comprise.",
  },
  {
    before: "Le groupe WhatsApp",
    after: "Chacun ouvre la séance du jour et sait quoi faire en arrivant.",
  },
  {
    before: "Le classeur de scores",
    after: "Les perfs se saisissent au téléphone, les records se détectent seuls.",
  },
];

const FEATURES = [
  {
    title: "Programmer la semaine",
    body: "Des blocs qu'on empile, réordonne et duplique d'une semaine sur l'autre. Soixante mouvements au catalogue, charges hommes et femmes séparées.",
    tone: "brand",
  },
  {
    title: "Un chrono qui ne ment pas",
    body: "Le serveur envoie l'instant de départ, chaque écran calcule le reste et corrige sa propre dérive d'horloge. Départ en 3, 2, 1.",
    tone: "urgent",
  },
  {
    title: "Le classement qui vit",
    body: "Un score saisi depuis les vestiaires remonte au mur dans la seconde, et la ligne glisse à sa nouvelle place.",
    tone: "data",
  },
  {
    title: "Rx ou scalé, sans débat",
    body: "Un scalé ne passe jamais devant un Rx. Un AMRAP se classe au total de répétitions, un « for time » au plus rapide.",
    tone: "brand",
  },
  {
    title: "Des records qui comptent",
    body: "Détectés seulement quand ils veulent dire quelque chose : un mouvement repère, un score en Rx, strictement meilleur que le précédent.",
    tone: "data",
  },
  {
    title: "Un écran, pas un compte",
    body: "L'écran de la salle s'appaire avec un code à six caractères et reste connecté. C'est l'appareil qui est reconnu, jamais une personne.",
    tone: "urgent",
  },
] as const;

const TONE_CLASS = {
  brand: "text-brand",
  urgent: "text-urgent",
  data: "text-data",
} as const;

export default function Home() {
  return (
    <>
      <Atmosphere intensity="strong" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-5 px-6 py-5">
        <span className="flex items-center gap-2.5">
          <ChalkMark className="h-8 w-8" />
          <span className="text-xl font-extrabold tracking-[-0.03em]">Chalk</span>
        </span>
        <Link
          href="/demo/wall"
          className="text-chalk-dim hover:text-chalk focus-visible:ring-brand ml-auto hidden rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:block"
        >
          Le mur en direct
        </Link>
        <ButtonLink href="/connexion" variant="ghost" size="sm" className="ml-auto sm:ml-0">
          Se connecter
        </ButtonLink>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24">
        <section className="flex flex-col gap-7 pt-8">
          <div className="flex max-w-3xl flex-col gap-5">
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
            <div className="border-edge relative overflow-hidden rounded-[26px] border bg-black/40 p-2 shadow-[0_40px_120px_-40px_rgba(139,92,246,0.7)]">
              <div className="aspect-[16/9] overflow-hidden rounded-[18px]">
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

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPLACES.map((item, index) => (
            <Reveal key={item.before} delay={index * 0.06} className="h-full">
              <Card className="flex h-full flex-col gap-2 p-5">
                <span className="text-chalk-faint text-sm line-through decoration-[1.5px]">
                  {item.before}
                </span>
                <p className="text-sm leading-relaxed font-medium">{item.after}</p>
              </Card>
            </Reveal>
          ))}
        </section>

        <section className="flex flex-col gap-7">
          <Reveal className="flex flex-col gap-3">
            <Eyebrow>Ce que fait le produit</Eyebrow>
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Trois surfaces, une seule vérité
            </h2>
            <p className="text-chalk-dim max-w-2xl">
              Le mur se lit à cinq mètres, le coach travaille au clavier, le membre décide à une
              main. Les trois regardent la même séance et la même seconde.
            </p>
          </Reveal>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.05} className="h-full">
                <Card className="flex h-full flex-col gap-2.5 p-6">
                  <span
                    className={`font-mono text-[11px] font-bold tracking-[0.16em] ${TONE_CLASS[feature.tone]}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-bold tracking-[-0.02em]">{feature.title}</h3>
                  <p className="text-chalk-dim text-sm leading-relaxed">{feature.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="grid items-center gap-8 md:grid-cols-2">
          <Reveal className="flex flex-col gap-4">
            <Eyebrow>Le détail qui change tout</Eyebrow>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Le chrono ne se diffuse pas seconde par seconde
            </h2>
            <p className="text-chalk-dim leading-relaxed">
              Le serveur n&apos;envoie qu&apos;une chose : l&apos;instant où le bloc a commencé.
              Chaque écran calcule ensuite ce qu&apos;il affiche, et corrige l&apos;écart de sa
              propre horloge dès la connexion.
            </p>
            <p className="text-chalk-dim leading-relaxed">
              C&apos;est ce qui fait que le mur et les téléphones montrent{" "}
              <span className="text-chalk font-semibold">la même seconde</span> — au lieu des trois
              secondes d&apos;écart qui décrédibilisent n&apos;importe quel chrono de salle.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <Card className="flex flex-col gap-3 p-6">
              {[
                { label: "Le mur", tone: "" },
                { label: "Le téléphone du coach", tone: "" },
                { label: "Le téléphone d'un membre", tone: "text-data" },
              ].map((row, index) => (
                <div
                  key={row.label}
                  className={
                    index === 0
                      ? "flex items-center justify-between gap-4"
                      : "border-edge-soft flex items-center justify-between gap-4 border-t pt-3"
                  }
                >
                  <span className="text-chalk-faint font-mono text-[11px] tracking-[0.16em] uppercase">
                    {row.label}
                  </span>
                  <span className={`font-mono text-3xl font-semibold tabular-nums ${row.tone}`}>
                    07:42
                  </span>
                </div>
              ))}
              <p className="text-chalk-faint border-edge-soft border-t pt-3 text-xs leading-relaxed">
                Trois appareils, trois horloges différentes, une seule seconde affichée.
              </p>
            </Card>
          </Reveal>
        </section>

        <section>
          <Reveal>
            <Card className="grid gap-8 p-8 sm:p-10 md:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col items-start gap-4">
                <Eyebrow>Salle de démonstration</Eyebrow>
                <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
                  Entre dans une salle qui tourne déjà
                </h2>
                <p className="text-chalk-dim">
                  Une box fictive, sa semaine programmée, ses membres et leurs scores. Connecte-toi
                  en coach pour lancer le chrono, ou en membre pour saisir une perf et regarder le
                  mur réagir dans la seconde.
                </p>
                <div className="flex flex-wrap gap-3">
                  <ButtonLink href="/connexion" size="lg">
                    Se connecter
                  </ButtonLink>
                  <ButtonLink href="/demo/wall" variant="ghost" size="lg">
                    Ouvrir le mur
                  </ButtonLink>
                </div>
              </div>

              <div className="border-edge-soft flex flex-col gap-3 rounded-xl border bg-black/25 p-5 font-mono text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-chalk-faint">Coach</span>
                  <span className="text-chalk text-sm">lea@chalk.demo</span>
                </div>
                <div className="border-edge-soft flex flex-col gap-1 border-t pt-3">
                  <span className="text-chalk-faint">Membre</span>
                  <span className="text-chalk text-sm">membre1@chalk.demo</span>
                </div>
                <div className="border-edge-soft flex items-baseline justify-between border-t pt-3">
                  <span className="text-chalk-faint">Mot de passe</span>
                  <span className="text-chalk-dim">chalk</span>
                </div>
              </div>
            </Card>
          </Reveal>
        </section>
      </main>

      <footer className="border-edge-soft relative z-10 border-t">
        <div className="text-chalk-faint mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-7 font-mono text-xs tracking-[0.04em]">
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
