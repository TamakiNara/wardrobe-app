export const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "オール"] as const;
export const TPO_OPTIONS = ["仕事", "休日", "フォーマル"] as const;

export function buildOrderedOptions(
  values: readonly string[],
  masterOptions: readonly string[],
): string[] {
  const uniqueValues = Array.from(new Set(values));
  const masterOptionSet = new Set(masterOptions);

  const knownOptions = masterOptions.filter((option) =>
    uniqueValues.includes(option),
  );

  const unknownOptions = uniqueValues
    .filter((value) => !masterOptionSet.has(value))
    .sort((a, b) => a.localeCompare(b, "ja"));

  return [...knownOptions, ...unknownOptions];
}
