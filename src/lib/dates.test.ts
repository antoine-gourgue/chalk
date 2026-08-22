import { describe, expect, it } from "vitest";
import { addDays, formatWeekRange, mondayOf, toDayDate, toDayKey, weekDays } from "./dates";

describe("mondayOf", () => {
  it("rend le lundi pour un jour de milieu de semaine", () => {
    expect(toDayKey(mondayOf(toDayDate("2026-08-19")))).toBe("2026-08-17");
  });

  it("rend le lundi lui-même quand on est lundi", () => {
    expect(toDayKey(mondayOf(toDayDate("2026-08-17")))).toBe("2026-08-17");
  });

  it("rattache le dimanche à la semaine qui vient de finir, pas à la suivante", () => {
    expect(toDayKey(mondayOf(toDayDate("2026-08-23")))).toBe("2026-08-17");
  });

  it("traverse un changement de mois", () => {
    expect(toDayKey(mondayOf(toDayDate("2026-09-02")))).toBe("2026-08-31");
  });
});

describe("addDays", () => {
  it("passe d'un mois à l'autre", () => {
    expect(toDayKey(addDays(toDayDate("2026-08-31"), 1))).toBe("2026-09-01");
  });

  it("recule sans dériver d'un jour", () => {
    expect(toDayKey(addDays(toDayDate("2026-03-01"), -1))).toBe("2026-02-28");
  });

  /**
   * Le passage à l'heure d'été est le piège classique : une addition en heures
   * locales ferait perdre ou gagner une journée ce week-end-là.
   */
  it("résiste au changement d'heure", () => {
    expect(toDayKey(addDays(toDayDate("2026-03-28"), 1))).toBe("2026-03-29");
    expect(toDayKey(addDays(toDayDate("2026-10-24"), 1))).toBe("2026-10-25");
  });
});

describe("weekDays", () => {
  it("rend sept jours consécutifs du lundi au dimanche", () => {
    const days = weekDays(toDayDate("2026-08-17")).map(toDayKey);
    expect(days).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
  });
});

describe("formatWeekRange", () => {
  it("ne répète pas le mois quand la semaine n'en change pas", () => {
    expect(formatWeekRange(toDayDate("2026-08-17"))).toBe("17 — 23 août");
  });

  it("nomme les deux mois quand la semaine est à cheval", () => {
    expect(formatWeekRange(toDayDate("2026-08-31"))).toBe("31 août — 6 septembre");
  });
});
