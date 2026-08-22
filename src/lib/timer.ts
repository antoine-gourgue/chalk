/**
 * Calcul du temps restant d'un bloc, à partir de l'instant de départ envoyé par
 * le serveur. Toutes les surfaces (mur, coach, membre) partagent cette fonction
 * pour qu'aucune ne puisse afficher une seconde différente des autres.
 */
export function remainingSeconds({
  startedAt,
  durationSeconds,
  pausedAt,
  now,
}: {
  startedAt: number;
  durationSeconds: number;
  pausedAt?: number | null;
  now: number;
}): number {
  const reference = pausedAt ?? now;
  const elapsed = Math.max(0, reference - startedAt) / 1000;
  return Math.max(0, Math.ceil(durationSeconds - elapsed));
}

/** Format d'affichage du chrono : mm:ss, toujours sur deux chiffres. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
