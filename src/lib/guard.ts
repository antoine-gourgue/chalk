import { notFound, redirect } from "next/navigation";
import { AccessError, requireCoach, requireMember, type BoxAccess } from "@/lib/access";

/**
 * Traduit un refus d'accès en navigation, pour les pages.
 *
 * Une personne qui n'a rien à faire dans cette salle est renvoyée vers la sienne
 * plutôt que vers une page d'erreur : c'est le cas d'un coach qui suit un vieux
 * lien après avoir changé de salle.
 */
function handle(error: unknown): never {
  if (error instanceof AccessError) {
    if (error.reason === "unauthenticated") {
      redirect("/connexion");
    }
    if (error.reason === "unknown-box") {
      notFound();
    }
    redirect("/box");
  }
  throw error;
}

export async function coachPage(slug: string): Promise<BoxAccess> {
  try {
    return await requireCoach(slug);
  } catch (error) {
    handle(error);
  }
}

export async function memberPage(slug: string): Promise<BoxAccess> {
  try {
    return await requireMember(slug);
  } catch (error) {
    handle(error);
  }
}
