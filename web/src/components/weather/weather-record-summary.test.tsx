// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import WeatherRecordSummary from "./weather-record-summary";

describe("WeatherRecordSummary", () => {
  it("lucide icon と傘アイコンを表示できる", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WeatherRecordSummary, {
        record: {
          id: 1,
          weather_date: "2026-04-30",
          location_id: 1,
          location_name: "秋田市",
          location_name_snapshot: "秋田市",
          forecast_area_code_snapshot: "050010",
          weather_code: "cloudy_with_occasional_rain",
          temperature_high: 21,
          temperature_low: 14,
          memo: "折りたたみ傘あり",
          source_type: "manual",
          source_name: "manual",
          source_fetched_at: null,
          created_at: null,
          updated_at: null,
        },
      }),
    );

    expect(markup).toContain('data-weather-code="cloudy_with_occasional_rain"');
    expect(markup).toContain('data-weather-icon="CloudRain"');
    expect(markup).toContain('data-weather-accessory-icon="Umbrella"');
    expect(markup).toContain('data-rain-possibility="true"');
    expect(markup).toContain("くもり時々雨 / 最高 21℃ / 最低 14℃");
  });

  it("snow は Snowflake アイコンを使う", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WeatherRecordSummary, {
        record: {
          id: 2,
          weather_date: "2026-12-21",
          location_id: 1,
          location_name: "札幌市",
          location_name_snapshot: "札幌市",
          forecast_area_code_snapshot: "016010",
          weather_code: "snow",
          temperature_high: -1,
          temperature_low: -6,
          memo: null,
          source_type: "manual",
          source_name: "manual",
          source_fetched_at: null,
          created_at: null,
          updated_at: null,
        },
      }),
    );

    expect(markup).toContain('data-weather-icon="Snowflake"');
    expect(markup).toContain('data-weather-fallback-icon="CloudSnow"');
    expect(markup).toContain('data-rain-possibility="false"');
  });

  it("thunder は CloudLightning と傘補助を表示する", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WeatherRecordSummary, {
        record: {
          id: 3,
          weather_date: "2026-07-01",
          location_id: 1,
          location_name: "前橋市",
          location_name_snapshot: "前橋市",
          forecast_area_code_snapshot: "100010",
          weather_code: "thunder",
          temperature_high: 28,
          temperature_low: 20,
          memo: null,
          source_type: "manual",
          source_name: "manual",
          source_fetched_at: null,
          created_at: null,
          updated_at: null,
        },
      }),
    );

    expect(markup).toContain('data-weather-icon="CloudLightning"');
    expect(markup).toContain('data-weather-fallback-icon="Zap"');
    expect(markup).toContain('data-weather-accessory-icon="Umbrella"');
    expect(markup).toContain('data-rain-possibility="true"');
  });
});
