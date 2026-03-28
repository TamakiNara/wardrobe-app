<?php

namespace App\Support;

use App\Models\UserTpo;

class UserTpoPayloadBuilder
{
    public static function build(UserTpo $tpo): array
    {
        return [
            'id' => $tpo->id,
            'name' => $tpo->name,
            'sortOrder' => $tpo->sort_order,
            'isActive' => $tpo->is_active,
            'isPreset' => $tpo->is_preset,
        ];
    }
}
