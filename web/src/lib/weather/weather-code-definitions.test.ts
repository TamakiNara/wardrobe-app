import { describe, expect, it } from "vitest";
import {
  getWeatherCodeDefinition,
  WEATHER_CODE_DEFINITIONS,
} from "./weather-code-definitions";

describe("weather-code-definitions", () => {
  it("MVP の複合天気コードを含み thunder / fog / windy を扱える", () => {
    const codes = WEATHER_CODE_DEFINITIONS.map((definition) => definition.code);
    const labels = WEATHER_CODE_DEFINITIONS.map(
      (definition) => definition.label,
    );

    expect(codes).toContain("cloudy_then_rain");
    expect(codes).toContain("sunny_with_occasional_rain");
    expect(labels).toContain("くもりのち雨");
    expect(labels).toContain("晴れ時々雨");
    expect(codes).toContain("thunder");
    expect(codes).toContain("fog");
    expect(codes).toContain("windy");
    expect(labels).toContain("雷");
    expect(labels).toContain("霧");
    expect(labels).toContain("強風");
    expect(codes).not.toContain("storm");
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

  it("snow は Snowflake を主アイコンにし、雨系は傘補助を維持する", () => {
    expect(getWeatherCodeDefinition("snow")).toMatchObject({
      icon: "Snowflake",
      fallbackIcon: "CloudSnow",
      hasRainPossibility: false,
      accessoryIcon: null,
    });

    expect(getWeatherCodeDefinition("rain")).toMatchObject({
      icon: "CloudRain",
      accessoryIcon: "Umbrella",
      hasRainPossibility: true,
    });
  });

  it("thunder / fog / windy に icon と rain possibility を割り当てる", () => {
    expect(getWeatherCodeDefinition("thunder")).toMatchObject({
      icon: "CloudLightning",
      fallbackIcon: "Zap",
      hasRainPossibility: true,
      accessoryIcon: "Umbrella",
    });

    expect(getWeatherCodeDefinition("fog")).toMatchObject({
      icon: "CloudFog",
      fallbackIcon: "Cloud",
      hasRainPossibility: false,
      accessoryIcon: null,
    });

    expect(getWeatherCodeDefinition("windy")).toMatchObject({
      icon: "Wind",
      fallbackIcon: "Cloud",
      hasRainPossibility: false,
      accessoryIcon: null,
    });
  });
});
