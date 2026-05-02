<?php

namespace Tests\Unit;

use App\Support\WeatherRecordSupport;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class WeatherRecordSupportTest extends TestCase
{
    #[DataProvider('weatherTextProvider')]
    public function test_weather_text_is_normalized_to_weather_code(string $weatherText, string $expected): void
    {
        $this->assertSame($expected, WeatherRecordSupport::normalizeWeatherTextToWeatherCode($weatherText));
    }

    public function test_telop_normalization_uses_the_same_weather_text_rules(): void
    {
        $this->assertSame('sunny_with_occasional_clouds', WeatherRecordSupport::normalizeTelopToWeatherCode('晴れ時々くもり'));
        $this->assertSame('cloudy_then_rain', WeatherRecordSupport::normalizeTelopToWeatherCode('くもりのち雨'));
    }

    public function test_weather_text_for_display_normalizes_full_width_spaces(): void
    {
        $this->assertSame(
            '晴れ 夜のはじめ頃 くもり',
            WeatherRecordSupport::normalizeWeatherTextForDisplay('晴れ　夜のはじめ頃　くもり')
        );
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function weatherTextProvider(): array
    {
        return [
            'sunny' => ['晴れ', 'sunny'],
            'cloudy' => ['くもり', 'cloudy'],
            'rain' => ['雨', 'rain'],
            'snow' => ['雪', 'snow'],
            'sunny_then_cloudy' => ['晴れのちくもり', 'sunny_then_cloudy'],
            'cloudy_then_sunny' => ['くもりのち晴れ', 'cloudy_then_sunny'],
            'cloudy_then_rain' => ['くもりのち雨', 'cloudy_then_rain'],
            'rain_then_cloudy' => ['雨のちくもり', 'rain_then_cloudy'],
            'sunny_with_occasional_clouds' => ['晴れ時々くもり', 'sunny_with_occasional_clouds'],
            'cloudy_with_occasional_rain' => ['くもり時々雨', 'cloudy_with_occasional_rain'],
            'sunny_with_occasional_rain' => ['晴れ時々雨', 'sunny_with_occasional_rain'],
            'sunny_then_cloudy_with_full_width_spaces' => ['晴れ　夜のはじめ頃　くもり', 'sunny_then_cloudy'],
            'sunny_then_cloudy_with_half_width_spaces' => ['晴れ 夜のはじめ頃 くもり', 'sunny_then_cloudy'],
            'cloudy_then_sunny_with_time_band' => ['くもり 昼過ぎ 晴れ', 'cloudy_then_sunny'],
            'cloudy_then_rain_with_time_band' => ['くもり 夕方 雨', 'cloudy_then_rain'],
            'rain_then_cloudy_with_time_band' => ['雨 昼過ぎ くもり', 'rain_then_cloudy'],
            'sunny_with_occasional_rain_with_ichiji' => ['晴れ 一時 雨', 'sunny_with_occasional_rain'],
            'cloudy_with_occasional_rain_with_ichiji' => ['くもり 一時 雨', 'cloudy_with_occasional_rain'],
            'other' => ['雷', 'other'],
        ];
    }
}
