import { describe, expect, it } from "vitest";
import { TOPS_NECKS } from "./necks";
import { TOPS_RULES } from "./rules";

describe("TOPS_RULES", () => {
  it("tops neck の正式値に legacy 値を含めない", () => {
    expect(TOPS_NECKS.map((item) => item.value)).not.toContain("turtleneck");
    expect(TOPS_NECKS.map((item) => item.value)).not.toContain("mockneck");
    expect(TOPS_NECKS.map((item) => item.value)).toContain("turtle");
    expect(TOPS_NECKS.map((item) => item.value)).toContain("mock");
  });

  it("tops の種類ごとに首回り・袖・丈の候補を自然に絞り込む", () => {
    expect(TOPS_RULES.tshirt.necks).toEqual([
      "crew",
      "v",
      "u",
      "square",
      "boat",
      "henley",
      "turtle",
      "mock",
    ]);
    expect(TOPS_RULES.tshirt.necks).not.toContain("collar");

    expect(TOPS_RULES.shirt.lengths).toContain("short");
    expect(TOPS_RULES.cardigan.sleeves).toContain("short");

    expect(TOPS_RULES.polo.sleeves).toContain("seven");
    expect(TOPS_RULES.polo.lengths).toContain("short");
    expect(TOPS_RULES.polo.necks).toEqual(["collar"]);

    expect(TOPS_RULES.sweatshirt.sleeves).toContain("short");
    expect(TOPS_RULES.sweatshirt.lengths).toContain("short");
    expect(TOPS_RULES.sweatshirt.necks).toEqual(["crew"]);

    expect(TOPS_RULES.hoodie.sleeves).toContain("short");
    expect(TOPS_RULES.hoodie.sleeves).toContain("sleeveless");
    expect(TOPS_RULES.hoodie.lengths).toContain("short");

    expect(TOPS_RULES.vest.sleeves).toEqual([]);
    expect(TOPS_RULES.vest.necks).toEqual(["crew", "v", "boat", "turtle"]);
    expect(TOPS_RULES.vest.defaults?.neck).toBe("crew");

    expect(TOPS_RULES.camisole.necks).toEqual([
      "camisole_neck",
      "square",
      "v",
      "halter",
    ]);
    expect(TOPS_RULES.camisole.lengths).toContain("long");
    expect(TOPS_RULES.camisole.defaults?.neck).toBe("camisole_neck");

    expect(TOPS_RULES.tanktop.necks).toEqual([
      "crew",
      "square",
      "highneck",
      "mock",
      "boat",
      "u",
      "v",
      "halter",
    ]);
    expect(TOPS_RULES.tanktop.fits).toEqual(["normal", "oversized"]);
    expect(TOPS_RULES.tshirt.designs).toEqual([]);
  });
});
