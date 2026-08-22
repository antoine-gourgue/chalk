/**
 * La marque : une pastille pleine, le C creusé dedans en réserve.
 *
 * La première version dessinait un arc fin sur fond sombre — à toutes les
 * tailles, elle se lisait comme un indicateur de chargement. Une forme pleine
 * lève l'ambiguïté : c'est un objet, pas un état.
 *
 * Le C est ouvert à droite et ses extrémités sont coupées net, comme un trait
 * de craie qu'on arrête.
 */
export function ChalkMark({ className, title = "Chalk" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient
          id="chalk-badge"
          gradientUnits="userSpaceOnUse"
          x1="4"
          y1="60"
          x2="60"
          y2="4"
        >
          <stop offset="0%" stopColor="#ff2e88" />
          <stop offset="52%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>

        <mask id="chalk-counter">
          <rect width="64" height="64" fill="white" />
          <path
            d="M45 20.5 A17 17 0 1 0 45 43.5"
            fill="none"
            stroke="black"
            strokeWidth="10.5"
            strokeLinecap="butt"
          />
        </mask>
      </defs>

      <rect width="64" height="64" rx="17" fill="url(#chalk-badge)" mask="url(#chalk-counter)" />
    </svg>
  );
}

/**
 * La marque sur une seule couleur, pour les fonds clairs et l'impression.
 * Même dessin, sans dégradé.
 */
export function ChalkMarkFlat({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Chalk">
      <defs>
        <mask id="chalk-counter-flat">
          <rect width="64" height="64" fill="white" />
          <path
            d="M45 20.5 A17 17 0 1 0 45 43.5"
            fill="none"
            stroke="black"
            strokeWidth="10.5"
            strokeLinecap="butt"
          />
        </mask>
      </defs>
      <rect width="64" height="64" rx="17" fill={color} mask="url(#chalk-counter-flat)" />
    </svg>
  );
}
