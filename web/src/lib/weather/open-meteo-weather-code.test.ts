import { describe, expect, it } from "vitest";
import {
  normalizeOpenMeteoWeatherCodeToWeatherCode,
  OPEN_METEO_WMO_MEANINGS,
} from "./open-meteo-weather-code";

describe("open-meteo-weather-code", () => {
  it("WMO weather code を app weather_code に正規化できる", () => {
    expect(normalizeOpenMeteoWeatherCodeToWeatherCode(0)).toBe("sunny");
    expect(normalizeOpenMeteoWeatherCodeToWeatherCode(2)).toBe("cloudy");
    expect(normalizeOpenMeteoWeatherCodeToWeatherCode(45)).toBe("fog");
    expect(normalizeOpenMeteoWeatherCodeToWeatherCode(61)).toBe("rain");
    expect(normalizeOpenMeteoWeatherCodeToWeatherCode(71)).toBe("snow");
    expect(normalizeOpenMeteoWeatherCodeToWeatherCode(95)).toBe("thunder");
    expect(normalizeOpenMeteoWeatherCodeToWeatherCode(999)).toBe("other");
  });

  it("preview 用の WMO sample meanings を持つ", () => {
    expect(OPEN_METEO_WMO_MEANINGS).toContainEqual({
      code: 0,
      meaning: "Clear sky",
    });
    expect(OPEN_METEO_WMO_MEANINGS).toContainEqual({
      code: 95,
      meaning: "Thunderstorm",
    });
  });
});
