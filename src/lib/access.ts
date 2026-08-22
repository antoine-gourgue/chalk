import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canProgram } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

export class AccessError extends Error {
  constructor(
    message: string,
    readonly reason: "unauthenticated" | "not-a-member" | "forbidden" | "unknown-box",
  ) {
    super(message);
    this.name = "AccessError";
  }
}

export type BoxAccess = {
  box: { id: string; slug: string; name: string; demo: boolean; timezone: string };
  user: { id: string; name: string };
  role: Role;
};

/**
 * Résout l'accès d'une personne connectée à une salle.
 *
 * Le rôle est porté par l'appartenance à la salle, pas par le compte : la même
 * personne peut être coach chez elle et simple membre ailleurs.
 */
export async function requireMember(slug: string): Promise<BoxAccess> {
  const session = await auth();
  const userId = session?.user?.id;
  if (typeof userId !== "string") {
    throw new AccessError("Connecte-toi pour continuer", "unauthenticated");
  }

  const box = await prisma.box.findUnique({ where: { slug } });
  if (box === null) {
    throw new AccessError("Salle introuvable", "unknown-box");
  }

  const membership = await prisma.membership.findUnique({
    where: { boxId_userId: { boxId: box.id, userId } },
    include: { user: { select: { id: true, name: true } } },
  });
  if (membership === null || !membership.active) {
    throw new AccessError("Tu ne fais pas partie de cette salle", "not-a-member");
  }

  return {
    box: { id: box.id, slug: box.slug, name: box.name, demo: box.demo, timezone: box.timezone },
    user: membership.user,
    role: membership.role,
  };
}

/** Même chose, mais réservé à ceux qui peuvent programmer. */
export async function requireCoach(slug: string): Promise<BoxAccess> {
  const access = await requireMember(slug);
  if (!canProgram(access.role)) {
    throw new AccessError("Seuls les coachs peuvent modifier la programmation", "forbidden");
  }
  return access;
}

/** La première salle d'une personne, pour l'aiguiller après connexion. */
export async function firstBoxOf(userId: string): Promise<{ slug: string; role: Role } | null> {
  const membership = await prisma.membership.findFirst({
    where: { userId, active: true },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    include: { box: { select: { slug: true } } },
  });
  return membership === null ? null : { slug: membership.box.slug, role: membership.role };
}
