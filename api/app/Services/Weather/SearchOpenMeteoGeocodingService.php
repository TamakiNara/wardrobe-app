<?php

namespace App\Services\Weather;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;

class SearchOpenMeteoGeocodingService
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {}

    /**
     * @return array{
     *     results: list<array{
     *         name: string,
     *         admin1: string|null,
     *         admin2: string|null,
     *         country: string|null,
     *         latitude: float,
     *         longitude: float,
     *         timezone: string|null
     *     }>
     * }
     */
    public function search(string $query, int $count = 10, array $logContext = []): array
    {
        $normalizedQuery = trim($query);
        $startedAt = microtime(true);
        $baseContext = array_merge([
            'provider' => 'open_meteo',
            'source_type' => 'geocoding',
            'query' => mb_substr($normalizedQuery, 0, 100),
        ], $logContext);

        try {
            $response = $this->http
                ->acceptJson()
                ->timeout(10)
                ->get('https://geocoding-api.open-meteo.com/v1/search', [
                    'name' => $normalizedQuery,
                    'count' => $count,
                    'language' => 'ja',
                    'format' => 'json',
                ])
                ->throw();
        } catch (RequestException $exception) {
            Log::warning('weather.geocoding.fetch.failed', [
                'operation' => 'weather.geocoding.fetch.failed',
                ...$baseContext,
                'result' => 'failed',
                'http_status' => $exception->response?->status(),
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            throw new FetchWeatherForecastException(
                '地域候補の検索に失敗しました。時間をおいて再度お試しください。'
            );
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            Log::warning('weather.geocoding.fetch.failed', [
                'operation' => 'weather.geocoding.fetch.failed',
                ...$baseContext,
                'result' => 'invalid_response',
                'reason' => 'payload_not_array',
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            return ['results' => []];
        }

        $rawResults = $payload['results'] ?? null;

        if (! is_array($rawResults)) {
            Log::info('weather.geocoding.fetch.completed', [
                'operation' => 'weather.geocoding.fetch.completed',
                ...$baseContext,
                'result' => 'not_found',
                'result_count' => 0,
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);

            return ['results' => []];
        }

        $results = [];

        foreach ($rawResults as $rawResult) {
            if (! is_array($rawResult)) {
                continue;
            }

            $name = $rawResult['name'] ?? null;
            $latitude = $rawResult['latitude'] ?? null;
            $longitude = $rawResult['longitude'] ?? null;

            if (! is_string($name) || trim($name) === '') {
                continue;
            }

            if (! is_numeric((string) $latitude) || ! is_numeric((string) $longitude)) {
                continue;
            }

            $results[] = [
                'name' => trim($name),
                'admin1' => $this->normalizeNullableString($rawResult['admin1'] ?? null),
                'admin2' => $this->normalizeNullableString($rawResult['admin2'] ?? null),
                'country' => $this->normalizeNullableString($rawResult['country'] ?? null),
                'latitude' => round((float) $latitude, 4),
                'longitude' => round((float) $longitude, 4),
                'timezone' => $this->normalizeNullableString($rawResult['timezone'] ?? null),
            ];
        }

        if ($results === []) {
            Log::info('weather.geocoding.fetch.completed', [
                'operation' => 'weather.geocoding.fetch.completed',
                ...$baseContext,
                'result' => 'not_found',
                'result_count' => 0,
                'elapsed_ms' => $this->elapsedMilliseconds($startedAt),
            ]);
        }

        return ['results' => $results];
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $normalized = trim($value);

        return $normalized === '' ? null : $normalized;
    }

    private function elapsedMilliseconds(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}
