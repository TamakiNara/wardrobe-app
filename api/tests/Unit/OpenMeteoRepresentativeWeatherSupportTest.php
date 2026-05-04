<?php

namespace Tests\Unit;

use App\Support\OpenMeteoRepresentativeWeatherSupport;
use PHPUnit\Framework\TestCase;

class OpenMeteoRepresentativeWeatherSupportTest extends TestCase
{
    public function test_time_block_weather_and_representative_weather_are_calculated_from_hourly_data(): void
    {
        $summary = OpenMeteoRepresentativeWeatherSupport::summarizeHourlyWeather([
            'time' => [
                '2026-05-02T06:00',
                '2026-05-02T07:00',
                '2026-05-02T10:00',
                '2026-05-02T11:00',
                '2026-05-02T17:00',
                '2026-05-02T18:00',
            ],
            'weather_code' => [61, 61, 3, 3, 0, 0],
            'precipitation' => [1.2, 0.8, 0.0, 0.0, 0.0, 0.0],
        ], '2026-05-02', 'rain');

        $this->assertSame([
            'morning' => 'rain',
            'daytime' => 'cloudy',
            'night' => 'sunny',
        ], $summary['time_block_weather']);
        $this->assertSame('cloudy', $summary['representative_weather_code']);
        $this->assertTrue($summary['has_rain_in_time_blocks']);
    }

    public function test_deep_night_rain_does_not_directly_affect_representative_weather(): void
    {
        $summary = OpenMeteoRepresentativeWeatherSupport::summarizeHourlyWeather([
            'time' => [
                '2026-05-02T02:00',
                '2026-05-02T03:00',
                '2026-05-02T10:00',
                '2026-05-02T11:00',
            ],
            'weather_code' => [61, 61, 3, 3],
            'precipitation' => [2.0, 1.5, 0.0, 0.0],
        ], '2026-05-02', 'rain');

        $this->assertSame('cloudy', $summary['representative_weather_code']);
        $this->assertFalse($summary['has_rain_in_time_blocks']);
    }

    public function test_rain_with_zero_precipitation_is_treated_as_cloudy_for_block_representative(): void
    {
        $summary = OpenMeteoRepresentativeWeatherSupport::summarizeHourlyWeather([
            'time' => [
                '2026-05-02T06:00',
                '2026-05-02T07:00',
            ],
            'weather_code' => [51, 3],
            'precipitation' => [0.0, 0.0],
        ], '2026-05-02', 'rain');

        $this->assertSame('cloudy', $summary['time_block_weather']['morning']);
        $this->assertFalse($summary['has_rain_in_time_blocks']);
    }

    public function test_morning_is_used_when_daytime_block_is_missing(): void
    {
        $summary = OpenMeteoRepresentativeWeatherSupport::summarizeHourlyWeather([
            'time' => [
                '2026-05-02T06:00',
                '2026-05-02T07:00',
            ],
            'weather_code' => [45, 45],
            'precipitation' => [0.0, 0.0],
        ], '2026-05-02', 'sunny');

        $this->assertSame('fog', $summary['representative_weather_code']);
    }

    public function test_daily_weather_is_used_when_hourly_data_is_missing(): void
    {
        $summary = OpenMeteoRepresentativeWeatherSupport::summarizeHourlyWeather([], '2026-05-02', 'cloudy');

        $this->assertSame([
            'morning' => null,
            'daytime' => null,
            'night' => null,
        ], $summary['time_block_weather']);
        $this->assertSame('cloudy', $summary['representative_weather_code']);
        $this->assertFalse($summary['has_rain_in_time_blocks']);
    }
}
