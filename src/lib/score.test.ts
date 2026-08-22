import { describe, expect, it } from "vitest";
import {
  beatsRecord,
  compareResults,
  formatScore,
  lowerIsBetter,
  parseClock,
  repsPerRound,
  roundsRepsValue,
  scoreTypeForFormat,
  type ScoredResult,
} from "./score";

function result(partial: Partial<ScoredResult>): ScoredResult {
  return { scoreType: "ROUNDS_REPS", value: 0, rounds: null, reps: null, rx: true, ...partial };
}

describe("scoreTypeForFormat", () => {
  it("choisit la façon de marquer d'après le format du bloc", () => {
    expect(scoreTypeForFormat("AMRAP")).toBe("ROUNDS_REPS");
    expect(scoreTypeForFormat("FOR_TIME")).toBe("TIME");
    expect(scoreTypeForFormat("STRENGTH_SETS")).toBe("LOAD");
    expect(scoreTypeForFormat("EMOM")).toBe("REPS");
  });
});

describe("roundsRepsValue", () => {
  it("compte le total de répétitions", () => {
    expect(roundsRepsValue(5, 14, 27)).toBe(149);
  });

  it("met à égalité deux découpages qui totalisent la même chose", () => {
    expect(roundsRepsValue(5, 0, 27)).toBe(roundsRepsValue(4, 27, 27));
  });

  it("ignore les valeurs négatives d'une saisie fautive", () => {
    expect(roundsRepsValue(-3, -5, 27)).toBe(0);
  });
});

describe("repsPerRound", () => {
  it("additionne les répétitions des mouvements du tour", () => {
    expect(repsPerRound([{ reps: 12 }, { reps: 9 }, { reps: 6 }])).toBe(27);
  });

  it("ignore les mouvements sans répétitions, comme une course", () => {
    expect(repsPerRound([{ reps: 12 }, { reps: null }])).toBe(12);
  });
});

describe("parseClock", () => {
  it("lit un temps en minutes et secondes", () => {
    expect(parseClock("8:42")).toBe(522);
    expect(parseClock("8'42")).toBe(522);
    expect(parseClock("8 42")).toBe(522);
  });

  it("accepte un nombre de secondes brut", () => {
    expect(parseClock("522")).toBe(522);
  });

  it("refuse une saisie illisible", () => {
    expect(parseClock("")).toBeNull();
    expect(parseClock("abc")).toBeNull();
    expect(parseClock("8:75")).toBeNull();
    expect(parseClock("1:2:3")).toBeNull();
  });
});

describe("formatScore", () => {
  it("écrit un AMRAP en tours plus répétitions", () => {
    expect(formatScore(result({ scoreType: "ROUNDS_REPS", value: 149, rounds: 5, reps: 14 }))).toBe(
      "5 + 14",
    );
  });

  it("écrit un temps en minutes et secondes", () => {
    expect(formatScore(result({ scoreType: "TIME", value: 522 }))).toBe("08:42");
  });

  it("écrit une charge en kilos", () => {
    expect(formatScore(result({ scoreType: "LOAD", value: 96 }))).toBe("96 kg");
  });
});

describe("compareResults", () => {
  it("classe le plus gros total en tête sur un AMRAP", () => {
    const scores = [result({ value: 122 }), result({ value: 149 }), result({ value: 135 })].sort(
      compareResults,
    );
    expect(scores.map((score) => score.value)).toEqual([149, 135, 122]);
  });

  it("classe le plus rapide en tête sur un « for time »", () => {
    expect(lowerIsBetter("TIME")).toBe(true);
    const scores = [
      result({ scoreType: "TIME", value: 620 }),
      result({ scoreType: "TIME", value: 522 }),
    ].sort(compareResults);
    expect(scores.map((score) => score.value)).toEqual([522, 620]);
  });

  it("place les Rx devant les scalés, même moins performants", () => {
    const scores = [result({ value: 200, rx: false }), result({ value: 100, rx: true })].sort(
      compareResults,
    );
    expect(scores.map((score) => score.rx)).toEqual([true, false]);
  });
});

describe("beatsRecord", () => {
  it("accepte toute première performance", () => {
    expect(beatsRecord(90, null, "KG")).toBe(true);
  });

  it("exige de faire strictement mieux", () => {
    expect(beatsRecord(96, 92, "KG")).toBe(true);
    expect(beatsRecord(92, 92, "KG")).toBe(false);
    expect(beatsRecord(88, 92, "KG")).toBe(false);
  });

  it("inverse la règle quand le record se mesure en secondes", () => {
    expect(beatsRecord(180, 200, "SECONDS")).toBe(true);
    expect(beatsRecord(220, 200, "SECONDS")).toBe(false);
  });
});
