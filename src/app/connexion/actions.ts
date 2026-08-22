"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { firstBoxOf } from "@/lib/access";
import { auth, signIn, signOut, signInSchema } from "@/lib/auth";
import { landingPathFor } from "@/lib/roles";

export type SignInState = { error: string | null };

export async function signInWithPassword(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Identifiants invalides" };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou mot de passe incorrect" };
    }
    throw error;
  }

  redirect("/box");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/connexion" });
}

/** Aiguille vers la salle de la personne connectée après la connexion. */
export async function redirectToOwnBox(): Promise<never> {
  const session = await auth();
  const userId = session?.user?.id;
  if (typeof userId !== "string") {
    redirect("/connexion");
  }
  const box = await firstBoxOf(userId);
  if (box === null) {
    redirect("/");
  }
  redirect(landingPathFor(box.role, box.slug));
}
