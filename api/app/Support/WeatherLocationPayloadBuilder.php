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
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'is_default' => $location->is_default,
            'display_order' => $location->display_order,
            'created_at' => $location->created_at?->toISOString(),
            'updated_at' => $location->updated_at?->toISOString(),
        ];
    }
}
