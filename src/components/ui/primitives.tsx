import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Les quelques briques partagées par toutes les surfaces.
 *
 * Elles existent pour que « une carte », « un bouton » ou « un champ » veuillent
 * dire la même chose partout, et pour qu'un changement d'intention se fasse à un
 * seul endroit plutôt que dans quinze fichiers.
 */

export const FIELD =
  "border-edge-soft focus:border-brand focus-visible:ring-brand/40 rounded-xl border bg-white/5 px-4 py-3 text-sm transition-colors placeholder:text-chalk-faint/70 focus-visible:ring-2 focus-visible:outline-none";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";

const BUTTON_VARIANTS = {
  primary:
    "brand-gradient text-void focus-visible:ring-brand shadow-[0_10px_40px_-16px_rgba(255,46,136,0.9)] hover:shadow-[0_14px_50px_-14px_rgba(255,46,136,0.9)] hover:-translate-y-px",
  ghost: "border-edge text-chalk border hover:bg-white/8 focus-visible:ring-brand",
  quiet: "text-chalk-dim hover:text-chalk focus-visible:ring-brand",
  danger:
    "border-edge text-chalk-dim border hover:text-urgent hover:border-urgent/50 focus-visible:ring-urgent",
} as const;

const BUTTON_SIZES = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-base",
} as const;

type ButtonLook = {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
};

export function buttonClass({ variant = "primary", size = "md" }: ButtonLook = {}): string {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size]);
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonLook) {
  return <button className={cn(buttonClass({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonLook) {
  return <Link className={cn(buttonClass({ variant, size }), className)} {...props} />;
}

export function Card({ className, glow, ...props }: ComponentProps<"div"> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "border-edge-soft rounded-2xl border bg-white/[0.035] backdrop-blur-sm",
        glow && "border-brand/40 bg-brand/[0.08]",
        className,
      )}
      {...props}
    />
  );
}

export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {eyebrow === undefined ? null : (
        <p className="text-chalk-faint font-mono text-[11px] tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
        {title}
      </h1>
      {children}
    </div>
  );
}

const PILL_TONES = {
  data: "bg-data/16 text-data",
  urgent: "bg-urgent/16 text-urgent",
  brand: "bg-brand/16 text-brand",
  quiet: "bg-white/10 text-chalk-dim",
} as const;

export function Pill({
  tone = "quiet",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof PILL_TONES }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em]",
        PILL_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
