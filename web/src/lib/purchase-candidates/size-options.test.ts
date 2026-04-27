import { describe, expect, it } from "vitest";
import { swapPurchaseCandidateSizeCandidates } from "./size-options";

describe("swapPurchaseCandidateSizeCandidates", () => {
  it("サイズ候補のラベル・メモ・実寸を丸ごと入れ替える", () => {
    const swapped = swapPurchaseCandidateSizeCandidates(
      {
        label: "M",
        note: "ジャスト寄り",
        details: {
          structured: {
            waist: "66",
          },
          custom: [
            {
              id: "primary-1",
              label: "裾スリット",
              value: "24",
              note: "後ろ約",
            },
          ],
        },
      },
      {
        label: "L",
        note: "ゆったり寄り",
        details: {
          structured: {
            waist: "70",
          },
          custom: [
            {
              id: "alternate-1",
              label: "裾スリット",
              value: "26",
              note: "後ろ約",
            },
          ],
        },
      },
    );

    expect(swapped.primary).toEqual({
      label: "L",
      note: "ゆったり寄り",
      details: {
        structured: {
          waist: "70",
        },
        custom: [
          {
            id: "alternate-1",
            label: "裾スリット",
            value: "26",
            note: "後ろ約",
          },
        ],
      },
    });

    expect(swapped.alternate).toEqual({
      label: "M",
      note: "ジャスト寄り",
      details: {
        structured: {
          waist: "66",
        },
        custom: [
          {
            id: "primary-1",
            label: "裾スリット",
            value: "24",
            note: "後ろ約",
          },
        ],
      },
    });
  });
});
