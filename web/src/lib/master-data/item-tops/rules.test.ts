import { describe, expect, it } from "vitest";
import { TOPS_RULES } from "./rules";

describe("TOPS_RULES", () => {
  it("tops subcategory specific rules stay natural", () => {
    expect(TOPS_RULES.tshirt.necks).not.toContain("collar");
    expect(TOPS_RULES.tshirt.designs).toEqual([]);

    expect(TOPS_RULES.shirt.necks[0]).toBe("collar");
    expect(TOPS_RULES.blouse.necks[0]).toBe("collar");
    expect(TOPS_RULES.polo.necks[0]).toBe("collar");
    expect(TOPS_RULES.polo.defaults?.neck).toBe("collar");

    expect(TOPS_RULES.vest.sleeves).toEqual([]);
    expect(TOPS_RULES.camisole.defaults?.neck).toBeNull();
    expect(TOPS_RULES.tanktop.necks).toContain("square");
    expect(TOPS_RULES.tanktop.necks).not.toContain("v");
  });
});
