<?php

namespace Tests\Feature;

use App\Services\Weather\FetchWeatherForecastException;
use App\Services\Weather\SearchOpenMeteoGeocodingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SearchOpenMeteoGeocodingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_normalized_geocoding_results(): void
    {
        Http::fake([
            'https://geocoding-api.open-meteo.com/v1/search*' => Http::response([
                'results' => [
                    [
                        'name' => '川口市',
                        'admin1' => '埼玉県',
                        'admin2' => '南部',
                        'country' => '日本',
                        'latitude' => 35.8077123,
                        'longitude' => 139.7240123,
                        'timezone' => 'Asia/Tokyo',
                    ],
                ],
            ], 200),
        ]);

        $result = app(SearchOpenMeteoGeocodingService::class)->search('川口');

        $this->assertSame([
            'results' => [
                [
                    'name' => '川口市',
                    'admin1' => '埼玉県',
                    'admin2' => '南部',
                    'country' => '日本',
                    'latitude' => 35.8077,
                    'longitude' => 139.724,
                    'timezone' => 'Asia/Tokyo',
                ],
            ],
        ], $result);
    }

    public function test_it_returns_empty_results_when_upstream_has_no_candidates(): void
    {
        Http::fake([
            'https://geocoding-api.open-meteo.com/v1/search*' => Http::response([], 200),
        ]);

        $result = app(SearchOpenMeteoGeocodingService::class)->search('存在しない地名');

        $this->assertSame(['results' => []], $result);
    }

    public function test_it_throws_when_upstream_request_fails(): void
    {
        Http::fake([
            'https://geocoding-api.open-meteo.com/v1/search*' => Http::response([], 500),
        ]);

        $this->expectException(FetchWeatherForecastException::class);

        app(SearchOpenMeteoGeocodingService::class)->search('川口');
    }
}
