import { describe, expect, it } from "vitest";
import {
  getWeatherCodeDefinition,
  WEATHER_CODE_DEFINITIONS,
} from "./weather-code-definitions";

describe("weather-code-definitions", () => {
  it("MVP の複合天気コードを含み将来候補を含まない", () => {
    const codes = WEATHER_CODE_DEFINITIONS.map((definition) => definition.code);
    const labels = WEATHER_CODE_DEFINITIONS.map(
      (definition) => definition.label,
    );

    expect(codes).toContain("cloudy_then_rain");
    expect(codes).toContain("sunny_with_occasional_rain");
    expect(labels).toContain("くもりのち雨");
    expect(labels).toContain("晴れ時々雨");
    expect(codes).not.toContain("storm");
    expect(codes).not.toContain("thunder");
    expect(codes).not.toContain("fog");
    expect(codes).not.toContain("windy");
  });

  it("雨可能性と主天気を code 定義から導出できる", () => {
    expect(
      getWeatherCodeDefinition("cloudy_with_occasional_rain"),
    ).toMatchObject({
      primaryWeather: "cloudy",
      hasRainPossibility: true,
      accessoryIcon: "Umbrella",
    });

    expect(getWeatherCodeDefinition("sunny_then_cloudy")).toMatchObject({
      primaryWeather: "sunny",
      hasRainPossibility: false,
      accessoryIcon: null,
    });
  });
});
