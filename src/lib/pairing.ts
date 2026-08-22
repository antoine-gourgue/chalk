import { randomBytes } from "node:crypto";

/** Alphabet sans caractères ambigus : ni O/0, ni I/1, pour être lu de loin et tapé sans erreur. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const PAIRING_CODE_LENGTH = 6;
export const PAIRING_TTL_MINUTES = 15;
export const WALL_COOKIE = "chalk_wall";

export function generatePairingCode(): string {
  const bytes = randomBytes(PAIRING_CODE_LENGTH);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function generateDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Normalise une saisie humaine : espaces retirés, minuscules acceptées. */
export function normalizePairingCode(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

export function isPairingCodeShaped(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${PAIRING_CODE_LENGTH}}$`).test(code);
}
