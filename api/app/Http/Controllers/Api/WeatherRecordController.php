<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserWeatherLocation;
use App\Models\WeatherRecord;
use App\Services\Weather\FetchOpenMeteoHistoricalWeatherService;
use App\Services\Weather\FetchOpenMeteoWeatherForecastService;
use App\Services\Weather\FetchWeatherForecastException;
use App\Support\WeatherRecordPayloadBuilder;
use App\Support\WeatherRecordSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

class WeatherRecordController extends Controller
{
    public function __construct(
        private readonly FetchOpenMeteoWeatherForecastService $openMeteoForecastService,
        private readonly FetchOpenMeteoHistoricalWeatherService $openMeteoHistoricalService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
        ]);

        $records = WeatherRecord::query()
            ->where('user_id', $request->user()->id)
            ->whereDate('weather_date', $validated['date'])
            ->with('location')
            ->orderBy('weather_date')
            ->get()
            ->sortBy(
                fn (WeatherRecord $record) => sprintf(
                    '%010d-%010d',
                    $record->location?->display_order ?? PHP_INT_MAX,
                    $record->id,
                )
            )
            ->values();

        return response()->json([
            'weatherRecords' => $records
                ->map(fn (WeatherRecord $record) => WeatherRecordPayloadBuilder::build($record))
                ->all(),
        ]);
    }

    public function forecast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'weather_date' => ['required', 'date'],
            'location_id' => ['required', 'integer'],
        ]);

        try {
            $forecast = $this->fetchForecastForLocation(
                $request->user()->id,
                (int) $validated['location_id'],
                $validated['weather_date'],
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (FetchWeatherForecastException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        return response()->json([
            'message' => 'fetched',
            'forecast' => $forecast,
        ]);
    }

    public function observed(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'weather_date' => ['required', 'date'],
            'location_id' => ['required', 'integer'],
        ]);

        try {
            $observed = $this->fetchObservedForLocation(
                $request->user()->id,
                (int) $validated['location_id'],
                $validated['weather_date'],
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (FetchWeatherForecastException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }

        return response()->json([
            'message' => 'fetched',
            'observed' => $observed,
        ]);
    }

    /**
     * @return array{
     *     weather_date: string,
     *     location_id: int,
     *     location_name: string,
     *     forecast_area_code: string|null,
     *     weather_code: string,
     *     raw_weather_code: int|null,
     *     temperature_high: int|float|null,
     *     temperature_low: int|float|null,
     *     precipitation: float|null,
     *     rain_sum: float|null,
     *     snowfall_sum: float|null,
     *     time_block_weather: array{
     *         morning: string|null,
     *         daytime: string|null,
     *         night: string|null
     *     }|null,
     *     has_rain_in_time_blocks: bool,
     *     source_type: string,
     *     source_name: string,
     *     source_fetched_at: string,
     *     raw_telop: string|null
     * }
     */
    private function fetchForecastForLocation(int $userId, int $locationId, string $weatherDate): array
    {
        $location = $this->resolveOwnedLocation($userId, $locationId);
        $legacyForecastAreaCode = $this->normalizeLocationCode($location->forecast_area_code);
        $latitude = $location->latitude;
        $longitude = $location->longitude;
        $hasOpenMeteoCoordinates = $latitude !== null && $longitude !== null;
        $hasIncompleteOpenMeteoCoordinates = ($latitude !== null) xor ($longitude !== null);

        if ($hasOpenMeteoCoordinates) {
            $forecast = $this->openMeteoForecastService->fetch(
                (float) $latitude,
                (float) $longitude,
                $location->timezone,
                $weatherDate,
            );

            return [
                'weather_date' => $forecast['weather_date'],
                'location_id' => $location->id,
                'location_name' => $location->name,
                'forecast_area_code' => $legacyForecastAreaCode,
                'weather_code' => $forecast['weather_code'],
                'raw_weather_code' => $forecast['raw_weather_code'],
                'temperature_high' => $forecast['temperature_high'],
                'temperature_low' => $forecast['temperature_low'],
                'precipitation' => $forecast['precipitation'],
                'rain_sum' => $forecast['rain_sum'],
                'snowfall_sum' => $forecast['snowfall_sum'],
                'time_block_weather' => $forecast['time_block_weather'],
                'has_rain_in_time_blocks' => $forecast['has_rain_in_time_blocks'],
                'source_type' => $forecast['source_type'],
                'source_name' => $forecast['source_name'],
                'source_fetched_at' => $forecast['source_fetched_at'],
                'raw_telop' => $forecast['raw_weather_text'],
            ];
        }

        if ($hasIncompleteOpenMeteoCoordinates) {
            throw ValidationException::withMessages([
                'location_id' => '位置情報の設定が不完全です。地域設定を確認してください。',
            ]);
        }

        throw ValidationException::withMessages([
            'location_id' => '位置情報を設定すると、天気を取得できます。',
        ]);
    }

    /**
     * @return array{
     *     weather_date: string,
     *     location_id: int,
     *     location_name: string,
     *     forecast_area_code: string|null,
     *     weather_code: string,
     *     raw_weather_code: int|null,
     *     temperature_high: int|float|null,
     *     temperature_low: int|float|null,
     *     precipitation: float|null,
     *     rain_sum: float|null,
     *     snowfall_sum: float|null,
     *     precipitation_hours: float|null,
     *     time_block_weather: array{
     *         morning: string|null,
     *         daytime: string|null,
     *         night: string|null
     *     }|null,
     *     has_rain_in_time_blocks: bool,
     *     source_type: string,
     *     source_name: string,
     *     source_fetched_at: string,
     *     raw_telop: string|null
     * }
     */
    private function fetchObservedForLocation(int $userId, int $locationId, string $weatherDate): array
    {
        $location = $this->resolveOwnedLocation($userId, $locationId);
        $legacyForecastAreaCode = $this->normalizeLocationCode($location->forecast_area_code);
        $latitude = $location->latitude;
        $longitude = $location->longitude;
        $hasOpenMeteoCoordinates = $latitude !== null && $longitude !== null;
        $hasIncompleteOpenMeteoCoordinates = ($latitude !== null) xor ($longitude !== null);

        if ($hasOpenMeteoCoordinates) {
            $observed = $this->openMeteoHistoricalService->fetch(
                (float) $latitude,
                (float) $longitude,
                $location->timezone,
                $weatherDate,
            );

            return [
                'weather_date' => $observed['weather_date'],
                'location_id' => $location->id,
                'location_name' => $location->name,
                'forecast_area_code' => $legacyForecastAreaCode,
                'weather_code' => $observed['weather_code'],
                'raw_weather_code' => $observed['raw_weather_code'],
                'temperature_high' => $observed['temperature_high'],
                'temperature_low' => $observed['temperature_low'],
                'precipitation' => $observed['precipitation'],
                'rain_sum' => $observed['rain_sum'],
                'snowfall_sum' => $observed['snowfall_sum'],
                'precipitation_hours' => $observed['precipitation_hours'],
                'time_block_weather' => $observed['time_block_weather'],
                'has_rain_in_time_blocks' => $observed['has_rain_in_time_blocks'],
                'source_type' => $observed['source_type'],
                'source_name' => $observed['source_name'],
                'source_fetched_at' => $observed['source_fetched_at'],
                'raw_telop' => $observed['raw_weather_text'],
            ];
        }

        if ($hasIncompleteOpenMeteoCoordinates) {
            throw ValidationException::withMessages([
                'location_id' => '位置情報の設定が不完全です。地域設定を確認してください。',
            ]);
        }

        throw ValidationException::withMessages([
            'location_id' => '位置情報を設定すると、実績を取得できます。',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request, false);
        $user = $request->user();
        $this->validateTemperatures($validated);
        [$locationId, $locationNameSnapshot, $forecastAreaCodeSnapshot] = $this->resolveLocationSelection(
            $user->id,
            $validated
        );
        $this->validateDuplicate($user->id, $validated['weather_date'], $locationId, $locationNameSnapshot, null);

        $record = WeatherRecord::query()->create([
            'user_id' => $user->id,
            'weather_date' => $validated['weather_date'],
            'location_id' => $locationId,
            'location_name_snapshot' => $locationNameSnapshot,
            'forecast_area_code_snapshot' => $forecastAreaCodeSnapshot,
            'weather_code' => $validated['weather_code'],
            'temperature_high' => $validated['temperature_high'] ?? null,
            'temperature_low' => $validated['temperature_low'] ?? null,
            'memo' => WeatherRecordSupport::normalizeMemo($validated['memo'] ?? null),
            ...$this->resolveSourceMetadata($validated),
        ]);

        return response()->json([
            'message' => 'created',
            'weatherRecord' => WeatherRecordPayloadBuilder::build($record),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $this->validatePayload($request, true);
        $record = WeatherRecord::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $nextWeatherDate = $validated['weather_date'] ?? $record->weather_date?->format('Y-m-d');
        $nextValidated = array_merge([
            'temperature_high' => $record->temperature_high,
            'temperature_low' => $record->temperature_low,
        ], $validated);

        $this->validateTemperatures($nextValidated);
        [$locationId, $locationNameSnapshot, $forecastAreaCodeSnapshot] = $this->resolveLocationSelection(
            $request->user()->id,
            $validated,
            $record
        );
        $this->validateDuplicate(
            $request->user()->id,
            $nextWeatherDate,
            $locationId,
            $locationNameSnapshot,
            $record->id
        );

        $record->update([
            'weather_date' => $nextWeatherDate,
            'location_id' => $locationId,
            'location_name_snapshot' => $locationNameSnapshot,
            'forecast_area_code_snapshot' => $forecastAreaCodeSnapshot,
            'weather_code' => $validated['weather_code'] ?? $record->weather_code,
            'temperature_high' => $validated['temperature_high'] ?? $record->temperature_high,
            'temperature_low' => $validated['temperature_low'] ?? $record->temperature_low,
            'memo' => array_key_exists('memo', $validated)
                ? WeatherRecordSupport::normalizeMemo($validated['memo'])
                : $record->memo,
            ...$this->resolveSourceMetadata($validated, $record),
        ]);

        return response()->json([
            'message' => 'updated',
            'weatherRecord' => WeatherRecordPayloadBuilder::build($record->fresh()),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $record = WeatherRecord::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $record->delete();

        return response()->json([
            'message' => 'deleted',
        ]);
    }

    private function validatePayload(Request $request, bool $partial): array
    {
        $rules = [
            'weather_date' => [$partial ? 'sometimes' : 'required', 'required', 'date'],
            'location_id' => ['sometimes', 'nullable', 'integer'],
            'location_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'save_location' => ['sometimes', 'boolean'],
            'weather_code' => [
                $partial ? 'sometimes' : 'required',
                'required',
                'string',
                'in:'.implode(',', WeatherRecordSupport::weatherCodes()),
            ],
            'temperature_high' => ['sometimes', 'nullable', 'numeric'],
            'temperature_low' => ['sometimes', 'nullable', 'numeric'],
            'memo' => ['sometimes', 'nullable', 'string'],
            'source_type' => ['sometimes', 'string', 'in:'.implode(',', WeatherRecordSupport::SOURCE_TYPES)],
            'source_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'source_fetched_at' => ['sometimes', 'nullable', 'date'],
        ];

        return $request->validate($rules);
    }

    /**
     * @return array{0: int|null, 1: string, 2: string|null}
     */
    private function resolveLocationSelection(int $userId, array $validated, ?WeatherRecord $existing = null): array
    {
        $hasLocationId = array_key_exists('location_id', $validated);
        $hasLocationName = array_key_exists('location_name', $validated);

        if (! $hasLocationId && ! $hasLocationName) {
            if ($existing !== null) {
                return [
                    $existing->location_id,
                    $existing->location_name_snapshot,
                    $existing->forecast_area_code_snapshot,
                ];
            }

            throw ValidationException::withMessages([
                'location_name' => '地域を選択または入力してください。',
            ]);
        }

        $locationId = $validated['location_id'] ?? null;

        if (is_int($locationId) || is_numeric($locationId)) {
            $location = $this->resolveOwnedLocation($userId, (int) $locationId);

            return [
                $location->id,
                $location->name,
                $location->forecast_area_code,
            ];
        }

        $locationName = WeatherRecordSupport::normalizeLocationName($validated['location_name'] ?? null);

        if ($locationName === null) {
            throw ValidationException::withMessages([
                'location_name' => '一時的な地域名を入力してください。',
            ]);
        }

        if (($validated['save_location'] ?? false) === true) {
            $existingLocation = UserWeatherLocation::query()
                ->where('user_id', $userId)
                ->where('name', $locationName)
                ->first();

            $location = $existingLocation
                ?? UserWeatherLocation::query()->create([
                    'user_id' => $userId,
                    'name' => $locationName,
                    'forecast_area_code' => null,
                    'latitude' => null,
                    'longitude' => null,
                    'is_default' => ! UserWeatherLocation::query()
                        ->where('user_id', $userId)
                        ->where('is_default', true)
                        ->exists(),
                    'display_order' => (int) UserWeatherLocation::query()
                        ->where('user_id', $userId)
                        ->max('display_order') + 1,
                ]);

            return [
                $location->id,
                $location->name,
                $location->forecast_area_code,
            ];
        }

        return [null, $locationName, null];
    }

    private function resolveOwnedLocation(int $userId, int $locationId): UserWeatherLocation
    {
        $location = UserWeatherLocation::query()
            ->where('user_id', $userId)
            ->find($locationId);

        if ($location === null) {
            throw ValidationException::withMessages([
                'location_id' => '選択した地域が見つかりません。',
            ]);
        }

        return $location;
    }

    private function normalizeLocationCode(?string $value): ?string
    {
        $normalized = trim((string) ($value ?? ''));

        return $normalized === '' ? null : $normalized;
    }

    private function validateTemperatures(array $validated): void
    {
        $high = $validated['temperature_high'] ?? null;
        $low = $validated['temperature_low'] ?? null;

        if ($high !== null && $low !== null && (float) $high < (float) $low) {
            throw ValidationException::withMessages([
                'temperature_high' => '最高気温は最低気温以上で入力してください。',
            ]);
        }
    }

    private function validateDuplicate(
        int $userId,
        string $weatherDate,
        ?int $locationId,
        string $locationNameSnapshot,
        ?int $ignoreId
    ): void {
        $query = WeatherRecord::query()
            ->where('user_id', $userId)
            ->whereDate('weather_date', $weatherDate);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($locationId !== null) {
            $query->where('location_id', $locationId);
        } else {
            $query->whereNull('location_id')
                ->where('location_name_snapshot', $locationNameSnapshot);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'location_name' => '同じ日付・同じ地域の天気はすでに登録されています。',
            ]);
        }
    }

    /**
     * @return array{
     *     source_type: string,
     *     source_name: string,
     *     source_fetched_at: string|null
     * }|array{}
     */
    private function resolveSourceMetadata(array $validated, ?WeatherRecord $existing = null): array
    {
        if (
            ! Arr::exists($validated, 'source_type')
            && ! Arr::exists($validated, 'source_name')
            && ! Arr::exists($validated, 'source_fetched_at')
        ) {
            if ($existing !== null) {
                return [];
            }

            return [
                'source_type' => 'manual',
                'source_name' => 'manual',
                'source_fetched_at' => null,
            ];
        }

        $sourceType = Arr::exists($validated, 'source_type')
            ? $validated['source_type']
            : ($existing?->source_type ?? 'manual');

        $sourceName = Arr::exists($validated, 'source_name')
            ? WeatherRecordSupport::normalizeLocationName($validated['source_name'])
            : ($existing?->source_name ?? null);

        if ($sourceName === null) {
            $sourceName = match ($sourceType) {
                'forecast_api' => 'open_meteo_jma_forecast',
                'historical_api' => 'historical_api',
                default => 'manual',
            };
        }

        $sourceFetchedAt = Arr::exists($validated, 'source_fetched_at')
            ? $validated['source_fetched_at']
            : ($existing?->source_fetched_at?->toIso8601String());

        if ($sourceType === 'manual') {
            $sourceFetchedAt = null;
        }

        return [
            'source_type' => $sourceType,
            'source_name' => $sourceName,
            'source_fetched_at' => $sourceFetchedAt,
        ];
    }
}
