<?php

namespace App\Services\Weather;

use App\Support\WeatherRecordSupport;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use Illuminate\Validation\ValidationException;

class FetchJmaWeatherForecastService
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {}

    /**
     * @return array{
     *     weather_date: string,
     *     weather_code: string,
     *     temperature_high: int|null,
     *     temperature_low: int|null,
     *     source_type: string,
     *     source_name: string,
     *     source_fetched_at: string,
     *     raw_weather_text: string
     * }
     */
    public function fetch(string $officeCode, string $regionCode, string $weatherDate): array
    {
        $officeCode = trim($officeCode);
        $regionCode = trim($regionCode);

        if ($officeCode === '') {
            throw ValidationException::withMessages([
                'office_code' => 'JMA 予報取得用の office code を指定してください。',
            ]);
        }

        if ($regionCode === '') {
            throw ValidationException::withMessages([
                'region_code' => 'JMA 予報取得用の region code を指定してください。',
            ]);
        }

        try {
            $response = $this->http
                ->acceptJson()
                ->timeout(10)
                ->get("https://www.jma.go.jp/bosai/forecast/data/forecast/{$officeCode}.json")
                ->throw();
        } catch (RequestException) {
            throw new FetchWeatherForecastException(
                'JMA forecast JSON から天気予報を取得できませんでした。時間をおいて再度お試しください。'
            );
        }

        $payload = $response->json();

        if (! is_array($payload) || $payload === []) {
            throw new FetchWeatherForecastException(
                'JMA forecast JSON の構造を解析できませんでした。'
            );
        }

        $rawWeatherText = $this->resolveWeatherText($payload, $regionCode, $weatherDate);
        [$temperatureHigh, $temperatureLow] = $this->resolveTemperatures($payload, $regionCode, $weatherDate);

        return [
            'weather_date' => $weatherDate,
            'weather_code' => WeatherRecordSupport::normalizeWeatherTextToWeatherCode($rawWeatherText),
            'temperature_high' => $temperatureHigh,
            'temperature_low' => $temperatureLow,
            'source_type' => 'forecast_api',
            'source_name' => 'jma_forecast_json',
            'source_fetched_at' => CarbonImmutable::now()->toIso8601String(),
            'raw_weather_text' => $rawWeatherText,
        ];
    }

    /**
     * @param  array<int|string, mixed>  $payload
     */
    private function resolveWeatherText(array $payload, string $regionCode, string $weatherDate): string
    {
        $regionFound = false;
        $dateFound = false;
        $timeSeriesList = $payload[0]['timeSeries'] ?? null;

        if (! is_array($timeSeriesList)) {
            throw new FetchWeatherForecastException(
                'JMA forecast JSON の構造を解析できませんでした。'
            );
        }

        foreach ($timeSeriesList as $timeSeries) {
            if (! is_array($timeSeries)) {
                continue;
            }

            $timeDefines = is_array($timeSeries['timeDefines'] ?? null)
                ? $timeSeries['timeDefines']
                : null;
            $areas = is_array($timeSeries['areas'] ?? null)
                ? $timeSeries['areas']
                : null;

            if ($timeDefines === null || $areas === null) {
                continue;
            }

            foreach ($areas as $area) {
                if (! is_array($area)) {
                    continue;
                }

                $areaCode = $area['area']['code'] ?? null;

                if (! is_string($areaCode) || trim($areaCode) !== $regionCode) {
                    continue;
                }

                $regionFound = true;
                $index = $this->resolveDateIndex($timeDefines, $weatherDate);

                if ($index === null) {
                    continue;
                }

                $dateFound = true;

                if (! isset($area['weathers']) || ! is_array($area['weathers'])) {
                    continue;
                }

                $weatherText = $area['weathers'][$index] ?? null;

                if (is_string($weatherText) && trim($weatherText) !== '') {
                    return $weatherText;
                }
            }
        }

        if (! $regionFound) {
            throw ValidationException::withMessages([
                'region_code' => '指定した JMA region code に対応する予報区域が見つかりませんでした。',
            ]);
        }

        if (! $dateFound) {
            throw ValidationException::withMessages([
                'weather_date' => '指定した日付の JMA 予報が見つかりませんでした。',
            ]);
        }

        throw new FetchWeatherForecastException(
            'JMA forecast JSON から天気文を取得できませんでした。'
        );
    }

    /**
     * @param  array<int|string, mixed>  $payload
     * @return array{0: int|null, 1: int|null}
     */
    private function resolveTemperatures(array $payload, string $regionCode, string $weatherDate): array
    {
        $temperatures = [];

        foreach ($payload as $block) {
            if (! is_array($block)) {
                continue;
            }

            $timeSeriesList = is_array($block['timeSeries'] ?? null)
                ? $block['timeSeries']
                : [];

            foreach ($timeSeriesList as $timeSeries) {
                if (! is_array($timeSeries)) {
                    continue;
                }

                $timeDefines = is_array($timeSeries['timeDefines'] ?? null)
                    ? $timeSeries['timeDefines']
                    : null;
                $areas = is_array($timeSeries['areas'] ?? null)
                    ? $timeSeries['areas']
                    : null;

                if ($timeDefines === null || $areas === null) {
                    continue;
                }

                foreach ($areas as $area) {
                    if (! is_array($area)) {
                        continue;
                    }

                    $areaCode = $area['area']['code'] ?? null;

                    if (! is_string($areaCode) || trim($areaCode) !== $regionCode) {
                        continue;
                    }

                    $temps = is_array($area['temps'] ?? null)
                        ? $area['temps']
                        : null;

                    if ($temps === null) {
                        continue;
                    }

                    foreach ($timeDefines as $index => $timeDefine) {
                        if ($this->extractDateString($timeDefine) !== $weatherDate) {
                            continue;
                        }

                        $normalized = $this->normalizeTemperatureValue($temps[$index] ?? null);

                        if ($normalized !== null) {
                            $temperatures[] = $normalized;
                        }
                    }
                }
            }
        }

        if (count($temperatures) < 2) {
            return [null, null];
        }

        return [max($temperatures), min($temperatures)];
    }

    /**
     * @param  array<int, mixed>  $timeDefines
     */
    private function resolveDateIndex(array $timeDefines, string $weatherDate): ?int
    {
        foreach ($timeDefines as $index => $timeDefine) {
            if ($this->extractDateString($timeDefine) === $weatherDate) {
                return $index;
            }
        }

        return null;
    }

    private function extractDateString(mixed $timeDefine): ?string
    {
        if (! is_string($timeDefine) || trim($timeDefine) === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($timeDefine)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function normalizeTemperatureValue(mixed $value): ?int
    {
        if (! is_string($value) && ! is_int($value) && ! is_float($value)) {
            return null;
        }

        if (! is_numeric((string) $value)) {
            return null;
        }

        return (int) round((float) $value);
    }
}
