<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserWeatherLocation;
use App\Support\WeatherLocationPayloadBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WeatherLocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locations = UserWeatherLocation::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'locations' => $locations
                ->map(fn (UserWeatherLocation $location) => WeatherLocationPayloadBuilder::build($location))
                ->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request, false);
        $user = $request->user();

        $location = DB::transaction(function () use ($user, $validated) {
            $isFirstLocation = ! UserWeatherLocation::query()
                ->where('user_id', $user->id)
                ->exists();

            $isDefault = (bool) ($validated['is_default'] ?? false);

            if ($isFirstLocation) {
                $isDefault = true;
            }

            if ($isDefault) {
                UserWeatherLocation::query()
                    ->where('user_id', $user->id)
                    ->update(['is_default' => false]);
            }

            $displayOrder = $validated['display_order'] ?? (
                (int) UserWeatherLocation::query()
                    ->where('user_id', $user->id)
                    ->max('display_order')
            ) + 1;

            return UserWeatherLocation::query()->create([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'forecast_area_code' => $validated['forecast_area_code'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'is_default' => $isDefault,
                'display_order' => $displayOrder,
            ]);
        });

        return response()->json([
            'message' => 'created',
            'location' => WeatherLocationPayloadBuilder::build($location),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $this->validatePayload($request, true);
        $location = UserWeatherLocation::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $location = DB::transaction(function () use ($location, $validated) {
            if (($validated['is_default'] ?? false) === true) {
                UserWeatherLocation::query()
                    ->where('user_id', $location->user_id)
                    ->where('id', '!=', $location->id)
                    ->update(['is_default' => false]);
            }

            $location->update($validated);

            return $location->fresh();
        });

        return response()->json([
            'message' => 'updated',
            'location' => WeatherLocationPayloadBuilder::build($location),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $location = UserWeatherLocation::query()
            ->where('user_id', $request->user()->id)
            ->withCount('weatherRecords')
            ->findOrFail($id);

        if (($location->weather_records_count ?? 0) > 0) {
            throw ValidationException::withMessages([
                'location' => 'この地域は天気記録で使用中のため削除できません。',
            ]);
        }

        DB::transaction(function () use ($location) {
            $userId = $location->user_id;
            $wasDefault = $location->is_default;

            $location->delete();

            if (! $wasDefault) {
                return;
            }

            $nextDefault = UserWeatherLocation::query()
                ->where('user_id', $userId)
                ->orderBy('display_order')
                ->orderBy('id')
                ->first();

            if ($nextDefault !== null) {
                $nextDefault->forceFill([
                    'is_default' => true,
                ])->save();
            }
        });

        return response()->json([
            'message' => 'deleted',
        ]);
    }

    private function validatePayload(Request $request, bool $partial): array
    {
        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'required', 'string', 'max:100'],
            'forecast_area_code' => ['sometimes', 'nullable', 'string', 'max:50'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:1'],
        ];

        return $request->validate($rules);
    }
}
