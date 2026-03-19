<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\CategoryGroupSeeder;
use Database\Seeders\CategoryMasterSeeder;
use Database\Seeders\CategoryPresetSeeder;
use Database\Seeders\TestDatasetSeeder;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TestSeedUsersSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_fixed_test_users_and_sample_data(): void
    {
        $this->seed(CategoryGroupSeeder::class);
        $this->seed(CategoryMasterSeeder::class);
        $this->seed(CategoryPresetSeeder::class);
        $this->seed(TestDatasetSeeder::class);

        $emptyUser = User::query()->where('email', TestSeedUsers::EMPTY_EMAIL)->first();
        $standardUser = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->first();
        $largeUser = User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->first();

        $this->assertNotNull($emptyUser);
        $this->assertNotNull($standardUser);
        $this->assertNotNull($largeUser);

        $this->assertTrue(Hash::check(TestSeedUsers::password(), $emptyUser->password));
        $this->assertTrue(Hash::check(TestSeedUsers::password(), $standardUser->password));
        $this->assertTrue(Hash::check(TestSeedUsers::password(), $largeUser->password));

        $this->assertNull($emptyUser->visible_category_ids);
        $this->assertCount(0, $emptyUser->items);
        $this->assertCount(0, $emptyUser->outfits);
        $this->assertDatabaseCount('items', 43);

        $this->assertNotNull($standardUser->visible_category_ids);
        $this->assertCount(36, $standardUser->visible_category_ids);
        $this->assertCount(3, $standardUser->outfits);
        $this->assertCount(7, $standardUser->items);

        $this->assertNotNull($largeUser->visible_category_ids);
        $this->assertGreaterThanOrEqual(30, $largeUser->items->count());
        $this->assertGreaterThanOrEqual(10, $largeUser->outfits->count());
    }
}
