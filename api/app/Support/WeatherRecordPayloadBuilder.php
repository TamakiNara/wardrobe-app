<?php

namespace App\Support;

use App\Models\WeatherRecord;

class WeatherRecordPayloadBuilder
{
    public static function build(WeatherRecord $record): array
    {
        return [
            'id' => $record->id,
            'weather_date' => $record->weather_date?->format('Y-m-d'),
            'location_id' => $record->location_id,
            'location_name' => $record->location_name_snapshot,
            'location_name_snapshot' => $record->location_name_snapshot,
            'forecast_area_code_snapshot' => $record->forecast_area_code_snapshot,
            'weather_code' => $record->weather_code,
            'temperature_high' => $record->temperature_high,
            'temperature_low' => $record->temperature_low,
            'memo' => $record->memo,
            'source_type' => $record->source_type,
            'source_name' => $record->source_name,
            'source_fetched_at' => $record->source_fetched_at?->toISOString(),
            'created_at' => $record->created_at?->toISOString(),
            'updated_at' => $record->updated_at?->toISOString(),
        ];
    }
}
