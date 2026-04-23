import { describe, expect, it } from "vitest";
import {
  resolveItemClassification,
  resolvePurchaseCandidateItemClassification,
} from "@/lib/items/classification";

describe("item classification", () => {
  it("shape が一意なカテゴリでは item と purchase candidate で同じ分類結果を返す", () => {
    const itemClassification = resolveItemClassification({
      category: "tops",
      subcategory: "hoodie",
    });
    const purchaseCandidateClassification =
      resolvePurchaseCandidateItemClassification("tops_hoodie");

    expect(purchaseCandidateClassification).not.toBeNull();
    expect(purchaseCandidateClassification).toMatchObject({
      category: itemClassification.category,
      subcategory: itemClassification.subcategory,
      shape: itemClassification.shape,
      shapeCandidates: itemClassification.shapeCandidates,
      hasMultipleShapeCandidates: false,
      isShapeResolved: true,
    });
  });

  it("tops / other は未解決 shape を許容する", () => {
    const itemClassification = resolveItemClassification({
      category: "tops",
      subcategory: "other",
    });
    const purchaseCandidateClassification =
      resolvePurchaseCandidateItemClassification("tops_other");

    expect(itemClassification).toMatchObject({
      category: "tops",
      subcategory: "other",
      shape: "",
      shapeCandidates: [],
      shouldShowShapeField: false,
      isShapeRequired: false,
      isShapeResolved: false,
    });
    expect(purchaseCandidateClassification).toMatchObject({
      category: "tops",
      subcategory: "other",
      shape: "",
      shapeCandidates: [],
      shouldShowShapeField: false,
      isShapeRequired: false,
      isShapeResolved: false,
    });
  });

  it("shape が複数候補のカテゴリでは候補一覧を返す", () => {
    const itemClassification = resolveItemClassification({
      category: "pants",
      subcategory: "denim",
    });
    const purchaseCandidateClassification =
      resolvePurchaseCandidateItemClassification("pants_denim");

    expect(itemClassification.shapeCandidates).toEqual([
      "straight",
      "tapered",
      "wide",
      "culottes",
      "jogger",
      "skinny",
      "gaucho",
    ]);
    expect(itemClassification).toMatchObject({
      shouldShowShapeField: true,
      isShapeRequired: true,
      shape: "",
      isShapeResolved: false,
    });
    expect(purchaseCandidateClassification).toMatchObject({
      category: "pants",
      subcategory: "denim",
      shapeCandidates: itemClassification.shapeCandidates,
      hasMultipleShapeCandidates: true,
      shape: "pants",
      isShapeResolved: true,
    });
  });

  it("shape が一意なカテゴリでは submit 用 shape を補完する", () => {
    expect(
      resolveItemClassification({
        category: "outerwear",
        subcategory: "blouson",
      }),
    ).toMatchObject({
      shape: "blouson",
      isShapeResolved: true,
      shouldShowShapeField: false,
    });
  });
});
