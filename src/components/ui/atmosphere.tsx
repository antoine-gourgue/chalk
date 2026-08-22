import { cn } from "@/lib/cn";

/**
 * L'ambiance de la salle obscure : deux halos derrière le contenu.
 *
 * Toutes les surfaces la partagent, à des intensités différentes — c'est ce qui
 * fait que le mur, l'espace coach et l'app membre se ressemblent sans se répéter.
 */
export function Atmosphere({ intensity = "normal" }: { intensity?: "normal" | "soft" | "strong" }) {
  const opacity = intensity === "strong" ? 0.34 : intensity === "soft" ? 0.12 : 0.2;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[30vh] -left-[15vw] h-[70vh] w-[70vw] rounded-full blur-[110px]"
        style={{
          background: `radial-gradient(circle, rgba(139,92,246,${opacity}), transparent 65%)`,
        }}
      />
      <div
        className="absolute -right-[20vw] -bottom-[35vh] h-[60vh] w-[60vw] rounded-full blur-[110px]"
        style={{
          background: `radial-gradient(circle, rgba(255,46,136,${opacity * 0.7}), transparent 65%)`,
        }}
      />
    </div>
  );
}

/** Filet de sécurité typographique : le libellé en petites capitales espacées. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
