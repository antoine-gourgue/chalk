import { describe, expect, it } from "vitest";
import {
  clockOffset,
  leadInRemaining,
  elapsedMs,
  formatClock,
  isFinalCountdown,
  isFinished,
  justFinished,
  pauseTimer,
  progressRatio,
  remainingSeconds,
  resetTimer,
  resumeTimer,
  startTimer,
} from "./timer";

const T0 = 1_700_000_000_000;
const AMRAP_12 = 720;

describe("startTimer", () => {
  it("part sur la durée complète du bloc", () => {
    const state = startTimer("block-1", AMRAP_12, T0);
    expect(state.status).toBe("running");
    expect(remainingSeconds(state, T0)).toBe(720);
  });
});

describe("décompte", () => {
  it("décompte à partir de l'instant de départ, pas d'un tick reçu", () => {
    const state = startTimer("block-1", AMRAP_12, T0);
    expect(remainingSeconds(state, T0 + 258_000)).toBe(462);
    expect(formatClock(remainingSeconds(state, T0 + 258_000))).toBe("07:42");
  });

  it("ne descend jamais sous zéro", () => {
    const state = startTimer("block-1", 60, T0);
    expect(remainingSeconds(state, T0 + 200_000)).toBe(0);
    expect(isFinished(state, T0 + 200_000)).toBe(true);
  });

  /**
   * Le cas qui compte vraiment : deux écrans dont les horloges diffèrent doivent
   * afficher la même seconde une fois le décalage corrigé.
   */
  it("affiche la même seconde sur deux écrans désynchronisés", () => {
    const state = startTimer("block-1", AMRAP_12, T0);

    /** Le mur avance de 3 s, le téléphone retarde de 1,5 s. */
    const murDerive = 3_000;
    const telephoneDerive = -1_500;

    /** Décalage mesuré à la poignée de main, quand le serveur annonce T0. */
    const murOffset = clockOffset(T0, T0 + murDerive);
    const telephoneOffset = clockOffset(T0, T0 + telephoneDerive);

    /** Cent secondes plus tard, chacun lit sa propre horloge, faussée. */
    const surLeMur = remainingSeconds(state, T0 + 100_000 + murDerive + murOffset);
    const surLeTelephone = remainingSeconds(
      state,
      T0 + 100_000 + telephoneDerive + telephoneOffset,
    );

    expect(surLeMur).toBe(620);
    expect(surLeTelephone).toBe(620);
  });

  it("sans correction, les deux écrans divergent — c'est bien ce qu'on évite", () => {
    const state = startTimer("block-1", AMRAP_12, T0);
    const surLeMur = remainingSeconds(state, T0 + 100_000 + 3_000);
    const surLeTelephone = remainingSeconds(state, T0 + 100_000 - 1_500);
    expect(surLeMur).not.toBe(surLeTelephone);
  });
});

describe("décompte de mise en route", () => {
  it("compte 3, 2, 1 avant de démarrer", () => {
    const state = startTimer("block-1", AMRAP_12, T0, 3);
    expect(leadInRemaining(state, T0)).toBe(3);
    expect(leadInRemaining(state, T0 + 1_200)).toBe(2);
    expect(leadInRemaining(state, T0 + 2_500)).toBe(1);
    expect(leadInRemaining(state, T0 + 3_000)).toBe(0);
  });

  it("ne fait pas tourner le chrono pendant le décompte", () => {
    const state = startTimer("block-1", AMRAP_12, T0, 3);
    expect(remainingSeconds(state, T0 + 1_000)).toBe(720);
    expect(elapsedMs(state, T0 + 2_000)).toBe(0);
    expect(progressRatio(state, T0 + 2_000)).toBe(0);
  });

  it("démarre pour de bon une fois le décompte écoulé", () => {
    const state = startTimer("block-1", AMRAP_12, T0, 3);
    expect(remainingSeconds(state, T0 + 3_000 + 60_000)).toBe(660);
  });

  it("n'allume pas la dernière ligne droite pendant le décompte", () => {
    const state = startTimer("block-1", 5, T0, 3);
    expect(isFinalCountdown(state, T0 + 1_000)).toBe(false);
    expect(isFinalCountdown(state, T0 + 3_500)).toBe(true);
  });

  it("reste à zéro quand aucun décompte n'a été demandé", () => {
    expect(leadInRemaining(startTimer("block-1", AMRAP_12, T0), T0)).toBe(0);
  });
});

describe("pause et reprise", () => {
  it("gèle le décompte pendant la pause", () => {
    const started = startTimer("block-1", AMRAP_12, T0);
    const paused = pauseTimer(started, T0 + 60_000);
    expect(remainingSeconds(paused, T0 + 300_000)).toBe(660);
  });

  it("ne perd pas le temps passé en pause à la reprise", () => {
    const started = startTimer("block-1", AMRAP_12, T0);
    const paused = pauseTimer(started, T0 + 60_000);
    const resumed = resumeTimer(paused, T0 + 240_000);
    /** Une minute écoulée avant la pause, trois minutes de pause : il reste 11 min. */
    expect(remainingSeconds(resumed, T0 + 240_000)).toBe(660);
    expect(remainingSeconds(resumed, T0 + 300_000)).toBe(600);
  });

  it("encaisse deux pauses successives", () => {
    let state = startTimer("block-1", AMRAP_12, T0);
    state = pauseTimer(state, T0 + 10_000);
    state = resumeTimer(state, T0 + 40_000);
    state = pauseTimer(state, T0 + 50_000);
    state = resumeTimer(state, T0 + 90_000);
    expect(elapsedMs(state, T0 + 90_000)).toBe(20_000);
    expect(remainingSeconds(state, T0 + 90_000)).toBe(700);
  });

  it("ignore une pause sur un chrono à l'arrêt", () => {
    const idle = resetTimer(startTimer("block-1", AMRAP_12, T0));
    expect(pauseTimer(idle, T0 + 1_000)).toEqual(idle);
  });

  it("ignore une reprise sur un chrono qui tourne", () => {
    const running = startTimer("block-1", AMRAP_12, T0);
    expect(resumeTimer(running, T0 + 1_000)).toEqual(running);
  });
});

describe("resetTimer", () => {
  it("rend le bloc à son état initial", () => {
    const state = resetTimer(pauseTimer(startTimer("block-1", AMRAP_12, T0), T0 + 5_000));
    expect(state.status).toBe("idle");
    expect(remainingSeconds(state, T0 + 999_999)).toBe(720);
    expect(progressRatio(state, T0 + 999_999)).toBe(0);
  });
});

describe("progressRatio", () => {
  it("vide l'anneau proportionnellement au temps écoulé", () => {
    const state = startTimer("block-1", 100, T0);
    expect(progressRatio(state, T0)).toBe(0);
    expect(progressRatio(state, T0 + 25_000)).toBeCloseTo(0.25);
    expect(progressRatio(state, T0 + 100_000)).toBe(1);
    expect(progressRatio(state, T0 + 500_000)).toBe(1);
  });

  it("ne divise pas par zéro sur un bloc sans durée", () => {
    const state = startTimer("block-1", 0, T0);
    expect(progressRatio(state, T0 + 1_000)).toBe(0);
  });
});

describe("isFinalCountdown", () => {
  it("s'allume sur les dix dernières secondes seulement", () => {
    const state = startTimer("block-1", 60, T0);
    expect(isFinalCountdown(state, T0 + 49_000)).toBe(false);
    expect(isFinalCountdown(state, T0 + 50_000)).toBe(true);
    expect(isFinalCountdown(state, T0 + 59_500)).toBe(true);
    expect(isFinalCountdown(state, T0 + 60_000)).toBe(false);
  });

  it("reste éteint quand le chrono est en pause", () => {
    const state = pauseTimer(startTimer("block-1", 60, T0), T0 + 55_000);
    expect(isFinalCountdown(state, T0 + 55_000)).toBe(false);
  });
});

describe("formatClock", () => {
  it("affiche toujours deux chiffres", () => {
    expect(formatClock(462)).toBe("07:42");
    expect(formatClock(9)).toBe("00:09");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(3_600)).toBe("60:00");
  });
});

describe("justFinished", () => {
  it("annonce la fin dans les secondes qui suivent", () => {
    const state = startTimer("block-1", 60, T0);
    expect(justFinished(state, T0 + 60_500)).toBe(true);
    expect(justFinished(state, T0 + 70_000)).toBe(true);
  });

  it("ne rejoue pas l'annonce longtemps après", () => {
    const state = startTimer("block-1", 60, T0);
    expect(justFinished(state, T0 + 3_600_000)).toBe(false);
  });

  it("tient compte du temps passé en pause", () => {
    let state = startTimer("block-1", 60, T0);
    state = pauseTimer(state, T0 + 30_000);
    state = resumeTimer(state, T0 + 130_000);
    /** Cent secondes de pause : le bloc se termine à T0 + 160 s. */
    expect(justFinished(state, T0 + 161_000)).toBe(true);
    expect(justFinished(state, T0 + 200_000)).toBe(false);
  });

  it("reste muet tant que le bloc tourne", () => {
    const state = startTimer("block-1", 60, T0);
    expect(justFinished(state, T0 + 30_000)).toBe(false);
  });
});
