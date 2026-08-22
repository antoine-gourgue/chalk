/**
 * Le chrono de Chalk.
 *
 * Règle fondatrice du produit : le chrono ne se diffuse jamais tick par tick. Le
 * serveur ne détient qu'un état — l'instant de départ et, le cas échéant,
 * l'instant de pause — et chaque écran calcule lui-même ce qu'il affiche. C'est
 * ce qui garantit que le mur et les téléphones montrent la même seconde.
 *
 * Toutes les fonctions de ce module sont pures : `now` est un paramètre, jamais
 * une lecture d'horloge. C'est ce qui les rend testables et déterministes.
 */

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export type TimerState = {
  blockId: string;
  status: TimerStatus;
  /** Horodatage serveur du départ, en millisecondes. */
  startedAt: number;
  durationSeconds: number;
  /** Instant du gel, quand le chrono est en pause. */
  pausedAt: number | null;
  /** Temps déjà écoulé lors des passages en pause précédents, en millisecondes. */
  accumulatedPauseMs: number;
};

/**
 * Lance un bloc, éventuellement après un décompte de mise en route.
 *
 * Le décompte n'est pas un effet visuel : l'instant de départ est simplement
 * placé dans le futur. Le chrono ne ment donc jamais — pendant le « 3, 2, 1 », il
 * n'a pas encore commencé, pour tout le monde en même temps.
 */
export function startTimer(
  blockId: string,
  durationSeconds: number,
  now: number,
  leadInSeconds = 0,
): TimerState {
  return {
    blockId,
    status: "running",
    startedAt: now + Math.max(0, leadInSeconds) * 1000,
    durationSeconds,
    pausedAt: null,
    accumulatedPauseMs: 0,
  };
}

/**
 * Secondes restantes avant le départ, quand le bloc est en décompte de mise en
 * route. Rend 0 dès que le chrono a commencé.
 */
export function leadInRemaining(state: TimerState, now: number): number {
  if (state.status !== "running" || now >= state.startedAt) {
    return 0;
  }
  return Math.ceil((state.startedAt - now) / 1000);
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== "running") {
    return state;
  }
  return { ...state, status: "paused", pausedAt: now };
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status !== "paused" || state.pausedAt === null) {
    return state;
  }
  return {
    ...state,
    status: "running",
    accumulatedPauseMs: state.accumulatedPauseMs + (now - state.pausedAt),
    pausedAt: null,
  };
}

export function resetTimer(state: TimerState): TimerState {
  return { ...state, status: "idle", startedAt: 0, pausedAt: null, accumulatedPauseMs: 0 };
}

/** Millisecondes écoulées depuis le départ, pauses déduites. */
export function elapsedMs(state: TimerState, now: number): number {
  if (state.status === "idle") {
    return 0;
  }
  const reference = state.status === "paused" && state.pausedAt !== null ? state.pausedAt : now;
  return Math.max(0, reference - state.startedAt - state.accumulatedPauseMs);
}

export function remainingSeconds(state: TimerState, now: number): number {
  if (state.status === "idle") {
    return state.durationSeconds;
  }
  const remaining = state.durationSeconds - elapsedMs(state, now) / 1000;
  return Math.max(0, Math.ceil(remaining));
}

/** Part du bloc déjà consommée, entre 0 et 1 — c'est ce qui vide l'anneau. */
export function progressRatio(state: TimerState, now: number): number {
  if (state.durationSeconds <= 0) {
    return 0;
  }
  const ratio = elapsedMs(state, now) / 1000 / state.durationSeconds;
  return Math.min(1, Math.max(0, ratio));
}

export function isFinished(state: TimerState, now: number): boolean {
  return state.status !== "idle" && remainingSeconds(state, now) === 0;
}

/** Les dix dernières secondes, où l'écran bascule au rose. */
export function isFinalCountdown(state: TimerState, now: number): boolean {
  if (leadInRemaining(state, now) > 0) {
    return false;
  }
  const remaining = remainingSeconds(state, now);
  return state.status === "running" && remaining > 0 && remaining <= 10;
}

/** Format d'affichage du chrono : mm:ss, toujours sur deux chiffres. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Décalage entre l'horloge du client et celle du serveur, mesuré à la poignée de
 * main. Sans cette correction, un écran dont l'horloge dérive de trois secondes
 * afficherait trois secondes de retard sur les autres.
 */
export function clockOffset(serverNow: number, clientNow: number): number {
  return serverNow - clientNow;
}
