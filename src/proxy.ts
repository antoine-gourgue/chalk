import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Next 16 a renommé le fichier `middleware` en `proxy` : même rôle, exécuté
 * avant le rendu des routes. Il ne charge que la configuration compatible Edge —
 * ni Prisma ni bcrypt — et laisse l'autorisation fine aux gardes serveur.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
