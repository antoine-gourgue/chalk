export const SCORE_TYPES = ["ROUNDS_REPS", "TIME", "LOAD", "REPS"] as const;
export type ScoreType = (typeof SCORE_TYPES)[number];

export type ScoredResult = {
  scoreType: ScoreType;
  /** Valeur normalisée qui sert au classement. */
  value: number;
  rounds: number | null;
  reps: number | null;
  rx: boolean;
};

/**
 * Le format d'un bloc décide de la façon dont on marque : un AMRAP se compte en
 * tours, un « for time » en secondes, une série de force en kilos.
 */
export function scoreTypeForFormat(format: string): ScoreType {
  switch (format) {
    case "AMRAP":
      return "ROUNDS_REPS";
    case "FOR_TIME":
      return "TIME";
    case "STRENGTH_SETS":
      return "LOAD";
    default:
      return "REPS";
  }
}

/**
 * Sur un « for time », le plus rapide gagne ; partout ailleurs, le plus gros
 * chiffre gagne. C'est la seule subtilité du classement, et elle vit ici.
 */
export function lowerIsBetter(scoreType: ScoreType): boolean {
  return scoreType === "TIME";
}

/**
 * Valeur de classement d'un AMRAP : le total de répétitions effectuées.
 *
 * « 5 + 14 » n'est qu'une façon de l'écrire — deux athlètes qui ont fait le même
 * nombre de répétitions sont à égalité, quelle que soit la façon dont leurs tours
 * se découpent.
 */
export function roundsRepsValue(rounds: number, reps: number, repsPerRound: number): number {
  return Math.max(0, rounds) * Math.max(0, repsPerRound) + Math.max(0, reps);
}

/** Nombre de répétitions d'un tour complet, d'après les mouvements du bloc. */
export function repsPerRound(movements: { reps: number | null }[]): number {
  return movements.reduce((total, movement) => total + (movement.reps ?? 0), 0);
}

/** « 8:42 », « 8 42 » ou « 522 » secondes → 522. Rend null si c'est illisible. */
export function parseClock(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") {
    return null;
  }
  const parts = trimmed.split(/[:'\s]+/).filter((part) => part !== "");
  if (parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }
  if (parts.length === 1) {
    return Number(parts[0]);
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number);
    return seconds > 59 ? null : minutes * 60 + seconds;
  }
  return null;
}

/** Écriture d'un score telle qu'elle s'affiche au mur. */
export function formatScore(result: ScoredResult): string {
  switch (result.scoreType) {
    case "ROUNDS_REPS":
      return `${result.rounds ?? 0} + ${String(result.reps ?? 0).padStart(2, "0")}`;
    case "TIME": {
      const total = Math.round(result.value);
      return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    }
    case "LOAD":
      return `${result.value} kg`;
    default:
      return `${result.value}`;
  }
}

/**
 * Ordre du classement : les Rx d'abord, puis la performance.
 *
 * Un scalé, même excellent, ne passe pas devant un Rx : c'est la convention des
 * salles, et elle évite les débats du dimanche matin.
 */
export function compareResults(a: ScoredResult, b: ScoredResult): number {
  if (a.rx !== b.rx) {
    return a.rx ? -1 : 1;
  }
  return lowerIsBetter(a.scoreType) ? a.value - b.value : b.value - a.value;
}

/** Un record n'est battu que s'il est strictement meilleur. */
export function beatsRecord(
  candidate: number,
  current: number | null,
  unit: "KG" | "REPS" | "SECONDS",
): boolean {
  if (current === null) {
    return true;
  }
  return unit === "SECONDS" ? candidate < current : candidate > current;
}
