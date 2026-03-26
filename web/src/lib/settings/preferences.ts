import type { UserPreferences } from "@/types/settings";

export function mapPreferenceSeasonToFilterValue(
  value: UserPreferences["currentSeason"],
): string {
  switch (value) {
    case "spring":
      return "春";
    case "summer":
      return "夏";
    case "autumn":
      return "秋";
    case "winter":
      return "冬";
    default:
      return "";
  }
}
