import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => {
  const icon =
    (name: string) =>
    ({ className }: { className?: string }) =>
      React.createElement("svg", {
        "data-icon": name,
        className,
      });

  return {
    Cloud: icon("Cloud"),
    CloudRain: icon("CloudRain"),
    CloudSnow: icon("CloudSnow"),
    CloudSun: icon("CloudSun"),
    CloudSunRain: icon("CloudSunRain"),
    Snowflake: icon("Snowflake"),
    Sun: icon("Sun"),
    Umbrella: icon("Umbrella"),
  };
});

describe("WeatherPreviewPage", () => {
  it("weather_code 一覧と JMA 正規化サンプルを表示できる", async () => {
    const { default: WeatherPreviewPage } = await import("./page");
    const markup = renderToStaticMarkup(
      React.createElement(WeatherPreviewPage),
    );

    expect(markup).toContain("weather_code 一覧");
    expect(markup).toContain("JMA天気文 正規化確認");
    expect(markup).toContain("sunny_then_cloudy");
    expect(markup).toContain("雷");
    expect(markup).toContain("other");
  });

  it("晴れ 夜のはじめ頃 くもり を sunny_then_cloudy として表示する", async () => {
    const { default: WeatherPreviewPage } = await import("./page");
    const markup = renderToStaticMarkup(
      React.createElement(WeatherPreviewPage),
    );

    expect(markup).toContain("晴れ　夜のはじめ頃　くもり");
    expect(markup).toContain("晴れ 夜のはじめ頃 くもり");
    expect(markup).toContain("sunny_then_cloudy");
  });

  it("雨可能性があるコードでは傘アイコンを表示する", async () => {
    const { default: WeatherPreviewPage } = await import("./page");
    const markup = renderToStaticMarkup(
      React.createElement(WeatherPreviewPage),
    );

    expect(markup).toContain('data-accessory-icon="Umbrella"');
    expect(markup).toContain('data-sample-accessory-icon="Umbrella"');
  });
});
