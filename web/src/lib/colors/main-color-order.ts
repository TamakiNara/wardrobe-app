type SortableColor = {
  role: "main" | "sub";
  hex: string;
};

type MainColorSortableRecord = {
  id: number;
  colors: SortableColor[];
};

export type MainColorSortKey =
  | {
      hasColor: false;
      achromatic: true;
      hue: number;
      lightness: number;
    }
  | {
      hasColor: true;
      achromatic: boolean;
      hue: number;
      lightness: number;
    };

export function parseHexColor(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return [red, green, blue];
}

export function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return { hue: hue * 60, saturation, lightness };
}

export function buildMainColorSortKey<T extends MainColorSortableRecord>(
  record: T,
): MainColorSortKey {
  const mainColor = record.colors.find((color) => color.role === "main");

  if (!mainColor?.hex) {
    return {
      hasColor: false,
      achromatic: true,
      hue: Number.POSITIVE_INFINITY,
      lightness: Number.POSITIVE_INFINITY,
    };
  }

  const rgb = parseHexColor(mainColor.hex);

  if (!rgb) {
    return {
      hasColor: false,
      achromatic: true,
      hue: Number.POSITIVE_INFINITY,
      lightness: Number.POSITIVE_INFINITY,
    };
  }

  const { hue, saturation, lightness } = rgbToHsl(...rgb);

  return {
    hasColor: true,
    achromatic: saturation <= 0.1,
    hue,
    lightness,
  };
}

export function compareByMainColorSort<T extends MainColorSortableRecord>(
  left: T,
  right: T,
): number {
  const leftKey = buildMainColorSortKey(left);
  const rightKey = buildMainColorSortKey(right);

  if (leftKey.hasColor !== rightKey.hasColor) {
    return leftKey.hasColor ? -1 : 1;
  }

  if (leftKey.achromatic !== rightKey.achromatic) {
    return leftKey.achromatic ? -1 : 1;
  }

  if (leftKey.achromatic && rightKey.achromatic) {
    if (leftKey.lightness !== rightKey.lightness) {
      return leftKey.lightness - rightKey.lightness;
    }
  } else {
    if (leftKey.hue !== rightKey.hue) {
      return leftKey.hue - rightKey.hue;
    }

    if (leftKey.lightness !== rightKey.lightness) {
      return leftKey.lightness - rightKey.lightness;
    }
  }

  return left.id - right.id;
}
