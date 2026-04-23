import {
  TOPS_DESIGNS,
  TOPS_FITS,
  TOPS_LENGTHS,
  TOPS_NECKS,
  TOPS_SLEEVES,
} from "./index";
import type { TopsSpec } from "@/types/items";

export type TopsSpecDisplay = {
  sleeve: string;
  length: string;
  neck: string;
  design: string;
  fit: string;
};

export type TopsSpecRawDisplay = {
  sleeve?: string;
  length?: string;
  neck?: string;
  design?: string;
  fit?: string;
};

function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value?: string | null,
) {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? value;
}

export function buildTopsSpecLabels(
  tops?: Partial<TopsSpec> | null,
): TopsSpecDisplay | null {
  if (!tops) return null;

  return {
    sleeve: findLabel(TOPS_SLEEVES, tops.sleeve),
    length: findLabel(TOPS_LENGTHS, tops.length),
    neck: findLabel(TOPS_NECKS, tops.neck),
    design: findLabel(TOPS_DESIGNS, tops.design),
    fit: findLabel(TOPS_FITS, tops.fit),
  };
}

export function buildTopsSpecRaw(
  tops?: Partial<TopsSpec> | null,
): TopsSpecRawDisplay | null {
  if (!tops) return null;

  return {
    sleeve: tops.sleeve ?? undefined,
    length: tops.length ?? undefined,
    neck: tops.neck ?? undefined,
    design: tops.design ?? undefined,
    fit: tops.fit ?? undefined,
  };
}
