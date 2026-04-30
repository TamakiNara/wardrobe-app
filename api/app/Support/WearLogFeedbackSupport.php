<?php

namespace App\Support;

class WearLogFeedbackSupport
{
    public const TEMPERATURE_FEELS = [
        'cold',
        'slightly_cold',
        'comfortable',
        'slightly_hot',
        'hot',
    ];

    public const OVERALL_RATINGS = [
        'good',
        'neutral',
        'bad',
    ];

    public const FEEDBACK_TAGS = [
        'comfortable_all_day',
        'temperature_gap_ready',
        'rain_ready',
        'morning_cold',
        'day_cold',
        'night_cold',
        'morning_hot',
        'day_hot',
        'night_hot',
        'rain_problem',
        'wind_problem',
        'aircon_cold',
        'heating_hot',
        'worked_for_tpo',
        'too_casual',
        'too_formal',
        'color_worked_well',
        'color_mismatch',
        'mood_matched',
        'mood_mismatch',
    ];

    public static function normalizeFeedbackTags(mixed $value): ?array
    {
        if (! is_array($value)) {
            return null;
        }

        $normalized = collect($value)
            ->filter(fn ($tag) => is_string($tag) && in_array($tag, self::FEEDBACK_TAGS, true))
            ->values()
            ->unique()
            ->values()
            ->all();

        return $normalized === [] ? null : $normalized;
    }
}
