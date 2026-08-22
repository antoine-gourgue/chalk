/**
 * La marque : l'anneau du compte à rebours, ouvert sur la droite, dessine un C.
 * La tête du chrono est le point cyan. Sous 24 px, épaissir le tracé et retirer
 * le point (voir docs/identite.html).
 */
export function ChalkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} role="img" aria-label="Chalk">
      <defs>
        <linearGradient
          id="chalk-mark"
          x1="8"
          y1="56"
          x2="56"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ff2e88" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M46.14 15.15 A22 22 0 1 0 46.14 48.85"
        stroke="url(#chalk-mark)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="46.14" cy="15.15" r="4.6" fill="#22d3ee" />
    </svg>
  );
}
