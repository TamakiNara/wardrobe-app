import { describe, expect, it } from "vitest";
import {
  resolveOnepieceAllinoneLayoutMetrics,
  resolveOnepieceAllinoneLayerStyle,
  resolveThumbnailMainSubColorHexes,
  resolveTopsOnepieceAllinoneLayerOrder,
} from "./onepiece-allinone-shared";

describe("onepiece_allinone thumbnail shared helpers", () => {
  it("main / sub color hex を解決する", () => {
    expect(
      resolveThumbnailMainSubColorHexes([
        { role: "main", hex: "#112233" },
        { role: "sub", hex: "#445566" },
      ]),
    ).toEqual({
      mainColorHex: "#112233",
      subColorHex: "#445566",
    });
  });

  it("main がない場合は fallback color を返す", () => {
    expect(
      resolveThumbnailMainSubColorHexes([{ role: "sub", hex: "#445566" }]),
    ).toEqual({
      mainColorHex: "#E5E7EB",
      subColorHex: "#445566",
    });
  });

  it("tops と onepiece_allinone の前後を sort_order から判定する", () => {
    expect(
      resolveTopsOnepieceAllinoneLayerOrder(
        [
          { category: "tops", sortOrder: 3 },
          { category: "onepiece_allinone", sortOrder: 2 },
        ],
        2,
      ),
    ).toEqual({
      topsAreAboveOnepieceAllinone: true,
      topsAreBelowOnepieceAllinone: false,
    });
  });

  it("outfit / wear log 共通の layer style を組み立てる", () => {
    expect(
      resolveOnepieceAllinoneLayerStyle({
        topsAreBelowOnepieceAllinone: true,
        shouldRenderBottomsLayer: true,
        onepieceAllinoneHasVisibleLowerBody: true,
      }),
    ).toEqual({
      top: "12%",
      bottom: "12%",
    });

    expect(
      resolveOnepieceAllinoneLayerStyle({
        topsAreBelowOnepieceAllinone: false,
        shouldRenderBottomsLayer: false,
        onepieceAllinoneHasVisibleLowerBody: true,
      }),
    ).toEqual({
      top: "0",
      bottom: "22%",
    });
  });

  it("compact でも onepiece + bottoms の構造比率は default と揃える", () => {
    expect(
      resolveOnepieceAllinoneLayoutMetrics({
        density: "compact",
        topsAreBelowOnepieceAllinone: true,
        shouldRenderBottomsLayer: true,
        onepieceAllinoneHasVisibleLowerBody: true,
      }),
    ).toEqual({
      topUnderlayHeight: "12%",
      topOverlayHeight: "40%",
      lowerBodyHeight: "20%",
      layerStyle: {
        top: "12%",
        bottom: "12%",
      },
    });
  });
});
