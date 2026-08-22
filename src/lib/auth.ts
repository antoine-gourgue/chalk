import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export const signInSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (user === null || user.passwordHash === null) {
          return null;
        }
        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
});
