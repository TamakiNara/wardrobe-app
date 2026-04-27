import { describe, expect, it } from "vitest";
import {
  buildItemSizeDetailsPayload,
  formatSizeDetailValue,
  getStructuredSizeFieldDefinitions,
  getStructuredSizeFieldDefinitionsFromContext,
  resolveStructuredSizeFieldLabel,
} from "@/lib/items/size-details";

describe("size-details payload の組み立て", () => {
  it("definitions に含まれない structured 値は送信対象に含めない", () => {
    const topsDefinitions = getStructuredSizeFieldDefinitionsFromContext({
      category: "tops",
      shape: "tshirt",
    });

    const payload = buildItemSizeDetailsPayload(
      topsDefinitions,
      {
        shoulder_width: {
          value: "42.5",
          min: "",
          max: "",
          note: "",
        },
        waist: {
          value: "68",
          min: "",
          max: "",
          note: "",
        },
      },
      [],
    );

    expect(payload).toEqual({
      structured: {
        shoulder_width: {
          value: 42.5,
          min: null,
          max: null,
          note: null,
        },
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
      shoulder_width: {
        value: "42.5",
        min: "",
        max: "",
        note: "",
      },
    };

    expect(
      buildItemSizeDetailsPayload(emptyDefinitions, structuredValues, []),
    ).toBeNull();
    expect(
      buildItemSizeDetailsPayload(restoredDefinitions, structuredValues, []),
    ).toEqual({
      structured: {
        shoulder_width: {
          value: 42.5,
          min: null,
          max: null,
          note: null,
        },
      },
    });
  });
});

describe("サイズ詳細の表示整形", () => {
  it("注記は値より前に表示する", () => {
    expect(
      formatSizeDetailValue({
        value: 26,
        min: null,
        max: null,
        note: "後ろ約",
      }),
    ).toBe("後ろ約 26cm");
  });

  it("範囲値は min〜max の形式で表示する", () => {
    expect(
      formatSizeDetailValue({
        value: null,
        min: 63,
        max: 67,
        note: "ヌード寸",
      }),
    ).toBe("ヌード寸 63〜67cm");
  });
});

describe("固定実寸 resolver", () => {
  it("tops の追加 shape は既存の上半身実寸グループを流用する", () => {
    expect(
      getStructuredSizeFieldDefinitions("tops", "knit").map(
        (definition) => definition.name,
      ),
    ).toEqual(["shoulder_width", "body_width", "body_length", "sleeve_length"]);
    expect(
      getStructuredSizeFieldDefinitions("tops", "cardigan").map(
        (definition) => definition.name,
      ),
    ).toEqual(["shoulder_width", "body_width", "body_length", "sleeve_length"]);
    expect(
      getStructuredSizeFieldDefinitions("tops", "sweatshirt").map(
        (definition) => definition.name,
      ),
    ).toEqual(["shoulder_width", "body_width", "body_length", "sleeve_length"]);
    expect(
      getStructuredSizeFieldDefinitions("tops", "hoodie").map(
        (definition) => definition.name,
      ),
    ).toEqual(["shoulder_width", "body_width", "body_length", "sleeve_length"]);
  });

  it("pants / outerwear / skirts / dress の追加 shape は既存グループを流用する", () => {
    expect(
      getStructuredSizeFieldDefinitions("pants", "jogger").map(
        (definition) => definition.name,
      ),
    ).toEqual(["waist", "hip", "rise", "inseam", "hem_width", "thigh_width"]);
    expect(
      getStructuredSizeFieldDefinitions("pants", "skinny").map(
        (definition) => definition.name,
      ),
    ).toEqual(["waist", "hip", "rise", "inseam", "hem_width", "thigh_width"]);
    expect(
      getStructuredSizeFieldDefinitions("pants", "gaucho").map(
        (definition) => definition.name,
      ),
    ).toEqual(["waist", "hip", "rise", "inseam", "hem_width", "thigh_width"]);

    expect(
      getStructuredSizeFieldDefinitions("outerwear", "blazer").map(
        (definition) => definition.name,
      ),
    ).toEqual([
      "shoulder_width",
      "body_width",
      "body_length",
      "sleeve_length",
      "sleeve_width",
      "cuff_width",
    ]);
    expect(
      getStructuredSizeFieldDefinitions("outerwear", "tailored").map(
        (definition) => definition.name,
      ),
    ).toEqual([
      "shoulder_width",
      "body_width",
      "body_length",
      "sleeve_length",
      "sleeve_width",
      "cuff_width",
    ]);

    expect(
      getStructuredSizeFieldDefinitions("skirts", "mermaid").map(
        (definition) => definition.name,
      ),
    ).toEqual(["waist", "hip", "total_length", "skirt_length"]);
    expect(
      getStructuredSizeFieldDefinitions("skirts", "narrow").map(
        (definition) => definition.name,
      ),
    ).toEqual(["waist", "hip", "total_length", "skirt_length"]);
    expect(
      getStructuredSizeFieldDefinitions("onepiece_dress", "dress").map(
        (definition) => definition.name,
      ),
    ).toEqual([
      "shoulder_width",
      "body_width",
      "sleeve_length",
      "total_length",
    ]);
    expect(
      getStructuredSizeFieldDefinitions("bags", "tote").map(
        (definition) => definition.name,
      ),
    ).toEqual(["height", "width", "depth"]);
    expect(
      getStructuredSizeFieldDefinitions("bags", "other").map(
        (definition) => definition.name,
      ),
    ).toEqual(["height", "width", "depth"]);
  });

  it("旧データ互換のため pleated skirt の対応を維持する", () => {
    expect(
      getStructuredSizeFieldDefinitions("skirts", "pleated").map(
        (definition) => definition.name,
      ),
    ).toEqual(["waist", "hip", "total_length", "skirt_length"]);
  });

  it("total_length と skirt_length は別ラベルで表示する", () => {
    expect(
      resolveStructuredSizeFieldLabel("total_length", "skirts", "flare"),
    ).toBe("総丈");
    expect(
      resolveStructuredSizeFieldLabel(
        "total_length",
        "onepiece_dress",
        "onepiece",
      ),
    ).toBe("総丈");
    expect(
      resolveStructuredSizeFieldLabel("skirt_length", "skirts", "flare"),
    ).toBe("スカート丈");
  });
});
