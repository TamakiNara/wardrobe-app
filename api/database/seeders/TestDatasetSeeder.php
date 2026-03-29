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
            SampleUserTpoSeeder::class,
            SampleItemSeeder::class,
            SamplePurchaseCandidateSeeder::class,
            SampleUserBrandSeeder::class,
            SampleOutfitSeeder::class,
            SampleWearLogSeeder::class,
        ]);
    }
}
