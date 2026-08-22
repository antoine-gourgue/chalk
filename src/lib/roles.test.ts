import { describe, expect, it } from "vitest";
import { canAdministerBox, canPairWallDevice, canProgram, landingPathFor } from "./roles";

describe("canProgram", () => {
  it("laisse programmer le propriétaire et les coachs", () => {
    expect(canProgram("OWNER")).toBe(true);
    expect(canProgram("COACH")).toBe(true);
  });

  it("interdit la programmation aux membres", () => {
    expect(canProgram("MEMBER")).toBe(false);
  });
});

describe("canPairWallDevice", () => {
  it("réserve l'appairage d'un écran à l'encadrement", () => {
    expect(canPairWallDevice("COACH")).toBe(true);
    expect(canPairWallDevice("MEMBER")).toBe(false);
  });
});

describe("canAdministerBox", () => {
  it("n'ouvre l'administration qu'au propriétaire", () => {
    expect(canAdministerBox("OWNER")).toBe(true);
    expect(canAdministerBox("COACH")).toBe(false);
    expect(canAdministerBox("MEMBER")).toBe(false);
  });
});

describe("landingPathFor", () => {
  it("envoie un coach sur sa semaine et un membre sur son app", () => {
    expect(landingPathFor("COACH", "demo")).toBe("/box/demo/semaine");
    expect(landingPathFor("MEMBER", "demo")).toBe("/app/demo");
  });
});
