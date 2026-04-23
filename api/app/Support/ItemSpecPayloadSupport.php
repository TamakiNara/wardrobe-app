<?php

namespace App\Support;

class ItemSpecPayloadSupport
{
    public static function buildResponseSpec(?array $spec): ?array
    {
        if (! is_array($spec)) {
            return null;
        }

        $payload = $spec;

        if (isset($payload['tops']) && is_array($payload['tops'])) {
            unset($payload['tops']['shape']);

            if ($payload['tops'] === []) {
                unset($payload['tops']);
            }
        }

        return $payload === [] ? null : $payload;
    }
}
