import type { SkinTonePreset } from "@/types/settings";

export const DEFAULT_SKIN_TONE_PRESET: SkinTonePreset = "neutral_medium";

export const SKIN_TONE_PRESET_OPTIONS: Array<{
  value: SkinTonePreset;
  label: string;
  hex: string;
}> = [
  { value: "pink_light", label: "ピンク系・明るめ", hex: "#F4D8D1" },
  { value: "pink_medium", label: "ピンク系・標準", hex: "#E6B8AA" },
  { value: "pink_deep", label: "ピンク系・深め", hex: "#C88F80" },
  { value: "neutral_light", label: "ニュートラル・明るめ", hex: "#F5D9BF" },
  { value: "neutral_medium", label: "ニュートラル・標準", hex: "#F1C7A6" },
  { value: "neutral_deep", label: "ニュートラル・深め", hex: "#C78F67" },
  { value: "yellow_light", label: "イエロー系・明るめ", hex: "#F2D8AA" },
  { value: "yellow_medium", label: "イエロー系・標準", hex: "#D8AE75" },
  { value: "yellow_deep", label: "イエロー系・深め", hex: "#A87348" },
];

export function findSkinTonePresetOption(value: SkinTonePreset | null | undefined) {
  return SKIN_TONE_PRESET_OPTIONS.find((option) => option.value === value)
    ?? SKIN_TONE_PRESET_OPTIONS.find((option) => option.value === DEFAULT_SKIN_TONE_PRESET)!;
}

export function resolveSkinToneColor(value: SkinTonePreset | null | undefined): string {
  return findSkinTonePresetOption(value).hex;
}
