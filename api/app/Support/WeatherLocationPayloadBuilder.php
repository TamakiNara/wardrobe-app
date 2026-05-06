<?php

namespace App\Support;

use App\Models\UserWeatherLocation;

class WeatherLocationPayloadBuilder
{
    public static function build(UserWeatherLocation $location): array
    {
        return [
            'id' => $location->id,
            'name' => $location->name,
            'forecast_area_code' => $location->forecast_area_code,
            'jma_forecast_region_code' => $location->jma_forecast_region_code,
            'jma_forecast_office_code' => $location->jma_forecast_office_code,
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'timezone' => $location->timezone,
            'is_default' => $location->is_default,
            'display_order' => $location->display_order,
            'created_at' => $location->created_at?->toISOString(),
            'updated_at' => $location->updated_at?->toISOString(),
        ];
    }

    public static function buildForExport(UserWeatherLocation $location): array
    {
        return [
            'id' => $location->id,
            'name' => $location->name,
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'timezone' => $location->timezone,
            'is_default' => $location->is_default,
            'display_order' => $location->display_order,
            'created_at' => $location->created_at?->toISOString(),
            'updated_at' => $location->updated_at?->toISOString(),
        ];
    }
}
