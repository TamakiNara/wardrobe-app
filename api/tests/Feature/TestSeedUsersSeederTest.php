<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\User;
use App\Models\UserBrand;
use App\Models\UserTpo;
use App\Models\WearLog;
use Database\Seeders\CategoryGroupSeeder;
use Database\Seeders\CategoryMasterSeeder;
use Database\Seeders\CategoryPresetSeeder;
use Database\Seeders\Support\TestSeedUsers;
use Database\Seeders\TestDatasetSeeder;
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
        $this->assertCount(3, UserTpo::query()->where('user_id', $emptyUser->id)->get());
        $this->assertCount(0, UserBrand::query()->where('user_id', $emptyUser->id)->get());
        $this->assertDatabaseCount('items', 61);

        $this->assertNotNull($standardUser->visible_category_ids);
        $this->assertCount(40, $standardUser->visible_category_ids);
        $this->assertCount(6, $standardUser->outfits);
        $this->assertCount(25, $standardUser->items);
        $standardTpos = UserTpo::query()
            ->where('user_id', $standardUser->id)
            ->orderBy('sort_order')
            ->get();
        $this->assertCount(5, $standardTpos);
        $this->assertTrue($standardTpos->contains(fn (UserTpo $tpo) => $tpo->name === '在宅' && $tpo->is_active === false));
        $this->assertTrue($standardUser->items->contains(
            fn (Item $item) => $item->care_status === 'in_cleaning'
        ));
        $this->assertTrue($standardUser->items->every(
            fn (Item $item) => is_array($item->tpo_ids)
        ));
        $bottomsLengthTypes = $standardUser->items
            ->pluck('spec')
            ->map(fn ($spec) => data_get($spec, 'bottoms.length_type'))
            ->filter()
            ->values();
        $legwearCoverageTypes = $standardUser->items
            ->pluck('spec')
            ->map(fn ($spec) => data_get($spec, 'legwear.coverage_type'))
            ->filter()
            ->values();
        $this->assertSame(
            ['ankle', 'full', 'knee', 'midi', 'mini'],
            $bottomsLengthTypes->unique()->sort()->values()->all(),
        );
        $this->assertSame(
            ['ankle_socks', 'crew_socks', 'knee_socks', 'leggings_cropped', 'leggings_full', 'over_knee', 'stockings', 'tights'],
            $legwearCoverageTypes->unique()->sort()->values()->all(),
        );
        $standardBrands = UserBrand::query()
            ->where('user_id', $standardUser->id)
            ->orderBy('name')
            ->get();
        $this->assertCount(8, $standardBrands);
        $this->assertTrue($standardBrands->contains(fn (UserBrand $brand) => $brand->is_active === false));
        $this->assertTrue($standardBrands->contains(fn (UserBrand $brand) => $brand->kana !== null));

        $standardItemBrandNames = $standardUser->items
            ->pluck('brand_name')
            ->filter()
            ->unique()
            ->values();
        $standardBrandNames = $standardBrands->pluck('name');
        $this->assertTrue($standardItemBrandNames->every(
            fn (string $brandName) => $standardBrandNames->contains($brandName)
        ));

        $standardWearLogs = WearLog::query()
            ->where('user_id', $standardUser->id)
            ->orderByDesc('event_date')
            ->orderBy('display_order')
            ->get();

        $this->assertCount(8, $standardWearLogs);
        $this->assertSame('2026-03-24', $standardWearLogs->first()?->event_date?->format('Y-m-d'));
        $this->assertTrue($standardWearLogs->contains(fn (WearLog $wearLog) => $wearLog->sourceOutfit?->status === 'invalid'));
        $this->assertTrue($standardWearLogs->contains(
            fn (WearLog $wearLog) => $wearLog->source_outfit_id !== null && $wearLog->wearLogItems->isNotEmpty()
        ));
        $this->assertTrue($standardWearLogs->contains(
            fn (WearLog $wearLog) => $wearLog->event_date?->format('Y-m-d') === '2026-03-21' && $wearLog->display_order === 2
        ));
        $this->assertTrue($standardWearLogs->contains(
            fn (WearLog $wearLog) => $wearLog->wearLogItems->contains(fn ($item) => $item->sourceItem?->status === 'disposed')
        ));

        $this->assertNotNull($largeUser->visible_category_ids);
        $this->assertCount(6, UserTpo::query()->where('user_id', $largeUser->id)->get());
        $this->assertGreaterThanOrEqual(30, $largeUser->items->count());
        $this->assertGreaterThanOrEqual(10, $largeUser->outfits->count());
        $this->assertGreaterThanOrEqual(14, WearLog::query()->where('user_id', $largeUser->id)->count());
        $this->assertTrue(WearLog::query()
            ->where('user_id', $largeUser->id)
            ->whereNotNull('source_outfit_id')
            ->get()
            ->every(fn (WearLog $wearLog) => $wearLog->wearLogItems->isNotEmpty()));
        $largeBrands = UserBrand::query()
            ->where('user_id', $largeUser->id)
            ->orderBy('name')
            ->get();
        $this->assertGreaterThanOrEqual(20, $largeBrands->count());
        $this->assertTrue($largeBrands->contains(fn (UserBrand $brand) => $brand->is_active === false));
        $this->assertTrue($largeBrands->contains(fn (UserBrand $brand) => $brand->kana !== null));
    }
}
