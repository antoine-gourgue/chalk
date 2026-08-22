import { describe, expect, it } from "vitest";
import { formatClock, remainingSeconds } from "./timer";

describe("remainingSeconds", () => {
  const startedAt = 1_000_000;

  it("rend la durée complète au moment du départ", () => {
    expect(remainingSeconds({ startedAt, durationSeconds: 720, now: startedAt })).toBe(720);
  });

  it("décompte à partir de l'instant de départ, pas d'un tick reçu", () => {
    expect(remainingSeconds({ startedAt, durationSeconds: 720, now: startedAt + 258_000 })).toBe(
      462,
    );
  });

  it("gèle le décompte quand le bloc est en pause", () => {
    const pausedAt = startedAt + 60_000;
    expect(
      remainingSeconds({ startedAt, durationSeconds: 720, pausedAt, now: startedAt + 300_000 }),
    ).toBe(660);
  });

  it("ne descend jamais sous zéro", () => {
    expect(remainingSeconds({ startedAt, durationSeconds: 60, now: startedAt + 200_000 })).toBe(0);
  });
});

describe("formatClock", () => {
  it("affiche toujours deux chiffres", () => {
    expect(formatClock(462)).toBe("07:42");
    expect(formatClock(9)).toBe("00:09");
    expect(formatClock(0)).toBe("00:00");
  });
});
