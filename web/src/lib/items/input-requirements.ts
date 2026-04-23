import { resolveItemClassification } from "@/lib/items/classification";
import type {
  BottomsSpec,
  ItemSpec,
  LegwearSpec,
  SkirtSpec,
  TopsSpec,
} from "@/types/items";

export function isItemShapeRequired(
  category?: string | null,
  subcategory?: string | null,
) {
  return resolveItemClassification({
    category,
    subcategory,
  }).isShapeRequired;
}

export function shouldShowItemShapeField(
  category?: string | null,
  subcategory?: string | null,
) {
  return resolveItemClassification({
    category,
    subcategory,
  }).shouldShowShapeField;
}

export function resolveItemShapeForSubmit(
  category?: string | null,
  subcategory?: string | null,
  shape?: string | null,
) {
  return resolveItemClassification({
    category,
    subcategory,
    shape,
  }).shape;
}

export function buildItemShapeForSubmit(
  category?: string | null,
  subcategory?: string | null,
  shape?: string | null,
) {
  return resolveItemShapeForSubmit(category, subcategory, shape);
}

export function buildItemSpecForSubmit(params: {
  category?: string | null;
  resolvedShape?: string | null;
  tops?: {
    sleeve?: string | null;
    length?: string | null;
    neck?: string | null;
    design?: string | null;
    fit?: string | null;
  } | null;
  bottoms?: BottomsSpec | null;
  skirt?: SkirtSpec | null;
  legwear?: LegwearSpec | null;
}): ItemSpec | null {
  const spec: ItemSpec = {};

  if (params.category === "tops" && params.resolvedShape) {
    const topsSpec: TopsSpec = {
      shape: params.resolvedShape,
      sleeve: params.tops?.sleeve || null,
      length: params.tops?.length || null,
      neck: params.tops?.neck || null,
      design: params.tops?.design || null,
      fit: params.tops?.fit || null,
    };
    spec.tops = topsSpec;
  }

  if (
    params.bottoms &&
    (params.bottoms.length_type || params.bottoms.rise_type)
  ) {
    spec.bottoms = params.bottoms;
  }

  if (
    params.skirt &&
    (params.skirt.length_type ||
      params.skirt.material_type ||
      params.skirt.design_type)
  ) {
    spec.skirt = params.skirt;
  }

  if (params.legwear?.coverage_type) {
    spec.legwear = params.legwear;
  }

  return Object.keys(spec).length > 0 ? spec : null;
}
