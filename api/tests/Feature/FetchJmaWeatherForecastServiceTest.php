<?php

namespace Tests\Feature;

use App\Services\Weather\FetchJmaWeatherForecastService;
use App\Services\Weather\FetchWeatherForecastException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FetchJmaWeatherForecastServiceTest extends TestCase
{
    public function test_jma_forecast_json_can_be_parsed_for_matching_region_and_date(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json' => Http::response($this->buildForecastPayload([
                'area' => ['code' => '130010', 'name' => '東京地方'],
                'weathers' => ['晴れ', 'くもりのち雨', '晴れ時々くもり'],
                'weatherCodes' => ['100', '212', '101'],
                'temps' => ['13', '22', '14', '24'],
            ]), 200),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);
        $forecast = $service->fetch('130000', '130010', '2026-05-02');

        $this->assertSame('2026-05-02', $forecast['weather_date']);
        $this->assertSame('cloudy_then_rain', $forecast['weather_code']);
        $this->assertSame(22, $forecast['temperature_high']);
        $this->assertSame(13, $forecast['temperature_low']);
        $this->assertSame('forecast_api', $forecast['source_type']);
        $this->assertSame('jma_forecast_json', $forecast['source_name']);
        $this->assertSame('くもりのち雨', $forecast['raw_weather_text']);
    }

    public function test_jma_weather_text_is_normalized_for_display_and_weather_code_mapping(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json' => Http::response($this->buildForecastPayload([
                'area' => ['code' => '130010', 'name' => '東京地方'],
                'weathers' => ['晴れ　夜のはじめ頃　くもり', '曇', '晴'],
                'weatherCodes' => ['101', '200', '100'],
                'temps' => ['13', '22', '14', '24'],
            ]), 200),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);
        $forecast = $service->fetch('130000', '130010', '2026-05-01');

        $this->assertSame('sunny_then_cloudy', $forecast['weather_code']);
        $this->assertSame('晴れ 夜のはじめ頃 くもり', $forecast['raw_weather_text']);
    }

    public function test_office_code_and_region_code_pair_can_find_the_target_area(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/110000.json' => Http::response($this->buildForecastPayload([
                'area' => ['code' => '110010', 'name' => '埼玉県南部'],
                'weathers' => ['晴れ', '晴れ', '晴れ'],
                'weatherCodes' => ['100', '100', '100'],
                'temps' => ['11', '19', '12', '20'],
            ]), 200),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);
        $forecast = $service->fetch('110000', '110010', '2026-05-01');

        $this->assertSame('sunny', $forecast['weather_code']);
    }

    public function test_unrecognized_jma_weather_text_falls_back_to_other(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/110000.json' => Http::response($this->buildForecastPayload([
                'area' => ['code' => '110010', 'name' => '埼玉県南部'],
                'weathers' => ['雷', '雷', '雷'],
                'weatherCodes' => ['400', '400', '400'],
                'temps' => ['11', '19', '12', '20'],
            ]), 200),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);
        $forecast = $service->fetch('110000', '110010', '2026-05-01');

        $this->assertSame('other', $forecast['weather_code']);
        $this->assertSame('雷', $forecast['raw_weather_text']);
    }

    public function test_temperatures_can_be_null_when_temperature_block_is_missing(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json' => Http::response($this->buildForecastPayload([
                'area' => ['code' => '130010', 'name' => '東京地方'],
                'weathers' => ['晴れ', '晴れ', '晴れ'],
                'weatherCodes' => ['100', '100', '100'],
                'temps' => null,
            ]), 200),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);
        $forecast = $service->fetch('130000', '130010', '2026-05-01');

        $this->assertSame('sunny', $forecast['weather_code']);
        $this->assertNull($forecast['temperature_high']);
        $this->assertNull($forecast['temperature_low']);
    }

    public function test_fetch_throws_validation_error_when_weather_date_is_missing(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json' => Http::response($this->buildForecastPayload([
                'area' => ['code' => '130010', 'name' => '東京地方'],
                'weathers' => ['晴れ', 'くもり', '雨'],
                'weatherCodes' => ['100', '200', '300'],
                'temps' => ['13', '22', '14', '24'],
            ]), 200),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);

        try {
            $service->fetch('130000', '130010', '2026-05-10');
            $this->fail('ValidationException was not thrown.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('weather_date', $exception->errors());
        }
    }

    public function test_fetch_throws_validation_error_when_region_code_is_missing(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json' => Http::response($this->buildForecastPayload([
                'area' => ['code' => '130010', 'name' => '東京地方'],
                'weathers' => ['晴れ', 'くもり', '雨'],
                'weatherCodes' => ['100', '200', '300'],
                'temps' => ['13', '22', '14', '24'],
            ]), 200),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);

        try {
            $service->fetch('130000', '999999', '2026-05-01');
            $this->fail('ValidationException was not thrown.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('region_code', $exception->errors());
        }
    }

    public function test_fetch_throws_exception_when_upstream_api_fails(): void
    {
        Http::fake([
            'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json' => Http::response([], 500),
        ]);

        $service = $this->app->make(FetchJmaWeatherForecastService::class);

        $this->expectException(FetchWeatherForecastException::class);

        $service->fetch('130000', '130010', '2026-05-01');
    }

    /**
     * @param  array{
     *     area: array{code: string, name: string},
     *     weathers: array<int, string>,
     *     weatherCodes: array<int, string>,
     *     temps: array<int, string>|null
     * }  $definition
     * @return array<int, array<string, mixed>>
     */
    private function buildForecastPayload(array $definition): array
    {
        $payload = [
            [
                'publishingOffice' => '気象庁',
                'reportDatetime' => '2026-05-01T05:00:00+09:00',
                'timeSeries' => [
                    [
                        'timeDefines' => [
                            '2026-05-01T00:00:00+09:00',
                            '2026-05-02T00:00:00+09:00',
                            '2026-05-03T00:00:00+09:00',
                        ],
                        'areas' => [
                            [
                                'area' => $definition['area'],
                                'weathers' => $definition['weathers'],
                                'weatherCodes' => $definition['weatherCodes'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        if ($definition['temps'] !== null) {
            $payload[] = [
                'publishingOffice' => '気象庁',
                'reportDatetime' => '2026-05-01T05:00:00+09:00',
                'timeSeries' => [
                    [
                        'timeDefines' => [
                            '2026-05-02T00:00:00+09:00',
                            '2026-05-02T09:00:00+09:00',
                            '2026-05-03T00:00:00+09:00',
                            '2026-05-03T09:00:00+09:00',
                        ],
                        'areas' => [
                            [
                                'area' => $definition['area'],
                                'temps' => $definition['temps'],
                            ],
                        ],
                    ],
                ],
            ];
        }

        return $payload;
    }
}
