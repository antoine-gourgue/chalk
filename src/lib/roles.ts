import type { Role } from "@/generated/prisma/enums";

/**
 * Les règles d'autorisation, sans aucune dépendance : ni base, ni session, ni
 * framework. C'est ce qui permet de les tester pour ce qu'elles sont — des
 * règles — et de les relire d'un seul coup d'œil.
 */

/** Programmer les séances, piloter le chrono, gérer les membres. */
export function canProgram(role: Role): boolean {
  return role === "OWNER" || role === "COACH";
}

/** Appairer un écran mural et révoquer un appareil. */
export function canPairWallDevice(role: Role): boolean {
  return role === "OWNER" || role === "COACH";
}

/** Transférer la salle, supprimer la salle : le propriétaire seul. */
export function canAdministerBox(role: Role): boolean {
  return role === "OWNER";
}

/** La surface d'atterrissage après connexion, selon le rôle dans la salle. */
export function landingPathFor(role: Role, slug: string): string {
  return canProgram(role) ? `/box/${slug}/semaine` : `/app/${slug}`;
}
