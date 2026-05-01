<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserWeatherLocation;
use App\Models\WeatherRecord;
use App\Support\WeatherRecordPayloadBuilder;
use App\Support\WeatherRecordSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WeatherRecordController extends Controller
{
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
            'weather_condition' => $validated['weather_condition'],
            'temperature_high' => $validated['temperature_high'] ?? null,
            'temperature_low' => $validated['temperature_low'] ?? null,
            'memo' => WeatherRecordSupport::normalizeMemo($validated['memo'] ?? null),
            'source_type' => 'manual',
            'source_name' => 'manual',
            'source_fetched_at' => null,
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
            'weather_condition' => $validated['weather_condition'] ?? $record->weather_condition,
            'temperature_high' => $validated['temperature_high'] ?? $record->temperature_high,
            'temperature_low' => $validated['temperature_low'] ?? $record->temperature_low,
            'memo' => array_key_exists('memo', $validated)
                ? WeatherRecordSupport::normalizeMemo($validated['memo'])
                : $record->memo,
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
            'weather_condition' => [
                $partial ? 'sometimes' : 'required',
                'required',
                'string',
                'in:'.implode(',', WeatherRecordSupport::WEATHER_CONDITIONS),
            ],
            'temperature_high' => ['sometimes', 'nullable', 'numeric'],
            'temperature_low' => ['sometimes', 'nullable', 'numeric'],
            'memo' => ['sometimes', 'nullable', 'string'],
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
}
