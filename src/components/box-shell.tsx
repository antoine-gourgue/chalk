import Link from "next/link";
import type { ReactNode } from "react";
import { ChalkMark } from "@/components/chalk-mark";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "semaine", label: "Semaine" },
  { href: "cours", label: "Cours" },
  { href: "membres", label: "Membres" },
  { href: "mouvements", label: "Mouvements" },
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
      <header className="border-edge-soft flex flex-wrap items-center gap-x-4 gap-y-3 border-b px-6 py-3">
        <Link href={`/box/${slug}/semaine`} className="flex items-center gap-2">
          <ChalkMark className="h-6 w-6" />
          <span className="text-lg font-extrabold tracking-[-0.02em]">Chalk</span>
        </Link>

        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={`/box/${slug}/${tab.href}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                "hover:bg-white/8 focus-visible:ring-brand focus-visible:ring-2 focus-visible:outline-none",
                active === tab.href ? "bg-white/10 text-chalk" : "text-chalk-dim",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="text-chalk-dim ml-auto flex items-center gap-3 text-sm">
          <span>
            {boxName} · {userName}
          </span>
          <SignOutButton />
          <span className="brand-gradient h-6.5 w-6.5 rounded-full" aria-hidden />
        </div>
      </header>

      {children}
    </div>
  );
}
