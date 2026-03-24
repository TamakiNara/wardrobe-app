<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestDatasetSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategoryGroupSeeder::class,
            CategoryMasterSeeder::class,
            CategoryPresetSeeder::class,
            TestUserSeeder::class,
            SampleUserSettingSeeder::class,
            SampleItemSeeder::class,
            SampleOutfitSeeder::class,
            SampleWearLogSeeder::class,
        ]);
    }
}
