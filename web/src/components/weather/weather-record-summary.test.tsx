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
});
