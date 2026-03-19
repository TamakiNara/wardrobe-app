<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestDatasetSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TestUserSeeder::class,
            SampleUserSettingSeeder::class,
            SampleItemSeeder::class,
            SampleOutfitSeeder::class,
        ]);
    }
}
