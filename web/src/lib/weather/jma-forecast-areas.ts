import {
  FORECAST_AREA_OPTIONS,
  type ForecastAreaOption,
} from "@/lib/weather/forecast-areas";

export type JmaForecastAreaOption = {
  region_code: string;
  office_code: string;
  office_name: string;
  region_name: string;
  display_name: string;
};

function deriveOfficeCode(regionCode: string) {
  return `${regionCode.slice(0, 3)}000`;
}

function buildDisplayName(area: ForecastAreaOption) {
  if (area.code.endsWith("000")) {
    return area.prefecture;
  }

  return `${area.prefecture} / ${area.label}`;
}

export const JMA_FORECAST_AREA_OPTIONS: readonly JmaForecastAreaOption[] =
  FORECAST_AREA_OPTIONS.map((area) => ({
    region_code: area.code,
    office_code: deriveOfficeCode(area.code),
    office_name: area.prefecture,
    region_name: area.label,
    display_name: buildDisplayName(area),
  }));

export function findJmaForecastAreaByRegionCode(
  regionCode: string | null | undefined,
) {
  if (!regionCode) {
    return null;
  }

  return (
    JMA_FORECAST_AREA_OPTIONS.find((area) => area.region_code === regionCode) ??
    null
  );
}

export function buildJmaForecastAreaOptionsWithFallback(
  values: Array<
    | {
        region_code?: string | null;
        office_code?: string | null;
      }
    | null
    | undefined
  >,
): JmaForecastAreaOption[] {
  const options = [...JMA_FORECAST_AREA_OPTIONS];
  const seen = new Set(options.map((area) => area.region_code));

  for (const value of values) {
    const regionCode = value?.region_code?.trim();

    if (!regionCode || seen.has(regionCode)) {
      continue;
    }

    const officeCode =
      value?.office_code?.trim() || deriveOfficeCode(regionCode);

    options.push({
      region_code: regionCode,
      office_code: officeCode,
      office_name: "その他",
      region_name: "設定済みのコード",
      display_name: `設定済みのコード / ${regionCode}`,
    });
    seen.add(regionCode);
  }

  return options;
}

export function groupJmaForecastAreasByOffice(
  options: readonly JmaForecastAreaOption[],
) {
  const groups = new Map<string, JmaForecastAreaOption[]>();

  for (const option of options) {
    const current = groups.get(option.office_name) ?? [];
    current.push(option);
    groups.set(option.office_name, current);
  }

  return Array.from(groups.entries()).map(([office_name, areas]) => ({
    office_name,
    areas,
  }));
}
