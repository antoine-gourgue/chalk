import type { NextAuthConfig } from "next-auth";

const PUBLIC_EXACT = new Set(["/", "/connexion", "/robots.txt", "/favicon.ico"]);
const PUBLIC_PREFIXES = ["/wall", "/api/health", "/api/auth"];

/**
 * Configuration compatible Edge, partagée entre le runtime Node et le middleware :
 * aucune dépendance à Prisma ni à bcrypt ici, sinon le middleware ne démarre pas.
 *
 * Le mur reste public : un écran s'authentifie par son jeton d'appairage, pas par
 * un compte.
 */
export const authConfig = {
  pages: { signIn: "/connexion" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = auth?.user != null;
      const { pathname } = request.nextUrl;

      if (pathname === "/connexion") {
        return isLoggedIn ? Response.redirect(new URL("/box", request.nextUrl)) : true;
      }
      if (PUBLIC_EXACT.has(pathname)) {
        return true;
      }
      if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id !== undefined) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
