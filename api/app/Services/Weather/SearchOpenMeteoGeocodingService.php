<?php

namespace App\Services\Weather;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;

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
    public function search(string $query, int $count = 10): array
    {
        $normalizedQuery = trim($query);

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
        } catch (RequestException) {
            throw new FetchWeatherForecastException(
                '地域候補の検索に失敗しました。時間をおいて再度お試しください。'
            );
        }

        $payload = $response->json();
        $rawResults = $payload['results'] ?? null;

        if (! is_array($rawResults)) {
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
}
