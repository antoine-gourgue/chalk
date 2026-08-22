"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPairingCodeShaped, normalizePairingCode, WALL_COOKIE } from "@/lib/pairing";

export type PairResult = { error: string } | never;

/**
 * Échange un code d'appairage contre le jeton de l'appareil.
 *
 * Le jeton est déposé dans un cookie httpOnly : c'est l'écran qui est authentifié,
 * jamais une personne. Un écran de salle n'a pas de compte, et ne doit pas pouvoir
 * en emprunter un.
 */
export async function pairWall(_previous: PairResult, formData: FormData): Promise<PairResult> {
  const raw = formData.get("code");
  const code = normalizePairingCode(typeof raw === "string" ? raw : "");

  if (!isPairingCodeShaped(code)) {
    return { error: "Le code fait six caractères, lettres et chiffres." };
  }

  const device = await prisma.wallDevice.findUnique({ where: { pairingCode: code } });
  if (device === null) {
    return { error: "Code inconnu. Demande au coach d'en générer un nouveau." };
  }
  if (device.pairingExpiresAt !== null && device.pairingExpiresAt.getTime() < Date.now()) {
    return { error: "Ce code a expiré. Demande au coach d'en générer un nouveau." };
  }

  await prisma.wallDevice.update({
    where: { id: device.id },
    data: { pairedAt: new Date(), lastSeen: new Date(), pairingCode: null, pairingExpiresAt: null },
  });

  const jar = await cookies();
  jar.set(WALL_COOKIE, device.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/wall/live");
}

export async function unpairWall(): Promise<void> {
  const jar = await cookies();
  jar.delete(WALL_COOKIE);
  redirect("/wall");
}
