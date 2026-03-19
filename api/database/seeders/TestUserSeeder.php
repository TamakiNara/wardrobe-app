<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        foreach (TestSeedUsers::definitions() as $definition) {
            User::query()->updateOrCreate(
                ['email' => $definition['email']],
                [
                    'name' => $definition['name'],
                    'password' => Hash::make(TestSeedUsers::password()),
                ],
            );
        }
    }
}
