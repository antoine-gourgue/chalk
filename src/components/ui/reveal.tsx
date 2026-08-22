"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Apparition à l'entrée dans le champ de vision.
 *
 * Un seul geste, discret, réutilisé partout : le contenu monte de quelques pixels
 * en se révélant. Rien ne bouge si le poste demande du calme.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 88%" },
        });
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
