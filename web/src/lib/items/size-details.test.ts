import { describe, expect, it } from "vitest";
import {
  buildItemSizeDetailsPayload,
  getStructuredSizeFieldDefinitionsFromContext,
} from "@/lib/items/size-details";

describe("size-details payload", () => {
  it("definitions に含まれない structured 値は送信対象に含めない", () => {
    const topsDefinitions = getStructuredSizeFieldDefinitionsFromContext({
      category: "tops",
      shape: "tshirt",
    });

    const payload = buildItemSizeDetailsPayload(
      topsDefinitions,
      {
        shoulder_width: "42.5",
        waist: "68",
      },
      [],
    );

    expect(payload).toEqual({
      structured: {
        shoulder_width: 42.5,
      },
    });
  });

  it("definitions が変わっても structured 値自体は再利用できる", () => {
    const emptyDefinitions = getStructuredSizeFieldDefinitionsFromContext({
      category: "shoes",
      shape: "sneakers",
    });
    const restoredDefinitions = getStructuredSizeFieldDefinitionsFromContext({
      category: "tops",
      shape: "tshirt",
    });
    const structuredValues = {
      shoulder_width: "42.5",
    };

    expect(
      buildItemSizeDetailsPayload(emptyDefinitions, structuredValues, []),
    ).toBeNull();
    expect(
      buildItemSizeDetailsPayload(restoredDefinitions, structuredValues, []),
    ).toEqual({
      structured: {
        shoulder_width: 42.5,
      },
    });
  });
});
