import type { ItemSpec } from "@/types/items";

type TopsSpecCompatShape = {
  shape?: string | null;
};

export function readLegacyTopsSpecShape(spec?: ItemSpec | null): string {
  const tops = spec?.tops as (ItemSpec["tops"] & TopsSpecCompatShape) | null;

  return tops?.shape ?? "";
}
