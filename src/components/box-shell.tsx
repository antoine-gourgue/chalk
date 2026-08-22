import Link from "next/link";
import type { ReactNode } from "react";
import { ChalkMark } from "@/components/chalk-mark";
import { SignOutButton } from "@/components/sign-out-button";
import { Atmosphere } from "@/components/ui/atmosphere";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "semaine", label: "Semaine" },
  { href: "chrono", label: "Chrono" },
  { href: "ecrans", label: "Écrans" },
];

/** Cadre commun de l'espace coach : marque, navigation, salle courante. */
export function BoxShell({
  slug,
  boxName,
  userName,
  active,
  children,
}: {
  slug: string;
  boxName: string;
  userName: string;
  active: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Atmosphere intensity="soft" />

      <header className="border-edge-soft bg-void/70 sticky top-0 z-30 flex flex-wrap items-center gap-x-5 gap-y-3 border-b px-6 py-3 backdrop-blur-xl">
        <Link
          href={`/box/${slug}/semaine`}
          className="focus-visible:ring-brand flex items-center gap-2.5 rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          <ChalkMark className="h-6 w-6" />
          <span className="text-lg font-extrabold tracking-[-0.025em]">Chalk</span>
        </Link>

        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const current = active === tab.href;
            return (
              <Link
                key={tab.href}
                href={`/box/${slug}/${tab.href}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-brand relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  current ? "text-chalk bg-white/10" : "text-chalk-dim hover:bg-white/6",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="text-chalk-dim ml-auto flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">{boxName}</span>
          <span className="text-chalk-faint hidden sm:inline">·</span>
          <span>{userName}</span>
          <SignOutButton />
          <span className="brand-gradient h-7 w-7 rounded-full" aria-hidden />
        </div>
      </header>

      {children}
    </div>
  );
}
