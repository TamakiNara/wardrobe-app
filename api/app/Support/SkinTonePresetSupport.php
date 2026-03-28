<?php

namespace App\Support;

class SkinTonePresetSupport
{
    public const DEFAULT_PRESET = 'neutral_medium';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return [
            'pink_light',
            'pink_medium',
            'pink_deep',
            'neutral_light',
            'neutral_medium',
            'neutral_deep',
            'yellow_light',
            'yellow_medium',
            'yellow_deep',
        ];
    }
}
