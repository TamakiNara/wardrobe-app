<?php

namespace Database\Seeders\Support;

final class TestSeedUsers
{
    public const PASSWORD_ENV_KEY = 'TEST_SEED_USER_PASSWORD';

    public const EMPTY_EMAIL = 'empty-user@example.com';
    public const STANDARD_EMAIL = 'standard-user@example.com';
    public const LARGE_EMAIL = 'large-user@example.com';

    /**
     * @return array<int, array{name:string, email:string}>
     */
    public static function definitions(): array
    {
        return [
            ['name' => 'Empty User', 'email' => self::EMPTY_EMAIL],
            ['name' => 'Standard User', 'email' => self::STANDARD_EMAIL],
            ['name' => 'Large User', 'email' => self::LARGE_EMAIL],
        ];
    }

    public static function password(): string
    {
        return (string) env(self::PASSWORD_ENV_KEY, 'password123');
    }
}
