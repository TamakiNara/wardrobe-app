<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\PurchaseCandidate;
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

    private const LEGACY_ITEM_CATEGORIES = ['bottoms', 'outer', 'onepiece_allinone', 'accessories'];

    private const CURRENT_SUBCATEGORY_CATEGORIES = [
        'tops',
        'pants',
        'outerwear',
        'onepiece_dress',
        'allinone',
        'inner',
        'bags',
        'fashion_accessories',
        'shoes',
        'legwear',
        'swimwear',
        'kimono',
    ];

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
        $this->assertCount(0, PurchaseCandidate::query()->where('user_id', $emptyUser->id)->get());
        $this->assertCount(3, UserTpo::query()->where('user_id', $emptyUser->id)->get());
        $this->assertCount(0, UserBrand::query()->where('user_id', $emptyUser->id)->get());

        $this->assertDatabaseCount('items', 69);
        $this->assertDatabaseCount('purchase_candidates', 22);

        $this->assertNotNull($standardUser->visible_category_ids);
        $this->assertCount(85, $standardUser->visible_category_ids);
        $this->assertCount(12, $standardUser->outfits);
        $this->assertTrue(
            $standardUser->outfits()
                ->withCount('outfitItems')
                ->get()
                ->every(fn ($outfit) => $outfit->outfit_items_count > 0),
        );
        $this->assertCount(33, $standardUser->items);
        $this->assertCount(20, PurchaseCandidate::query()->where('user_id', $standardUser->id)->get());

        $standardTpos = UserTpo::query()
            ->where('user_id', $standardUser->id)
            ->orderBy('sort_order')
            ->get();
        $this->assertCount(5, $standardTpos);
        $this->assertTrue($standardTpos->contains(fn (UserTpo $tpo) => $tpo->is_active === false));
        $this->assertTrue($standardUser->items->contains(fn (Item $item) => $item->care_status === 'in_cleaning'));
        $this->assertTrue($standardUser->items->contains(
            fn (Item $item) => $item->category === 'onepiece_dress'
                && $item->subcategory === 'onepiece'
                && $item->shape === 'onepiece'
        ));
        $this->assertTrue($standardUser->items->contains(
            fn (Item $item) => $item->category === 'allinone'
                && $item->subcategory === 'allinone'
                && $item->shape === 'allinone'
        ));
        $this->assertTrue($standardUser->items->every(
            fn (Item $item) => is_array($item->tpo_ids)
        ));
        $this->assertSeededItemsUseCurrentSchema($standardUser->items);

        $pantsLengthTypes = $standardUser->items
            ->where('category', 'pants')
            ->pluck('spec')
            ->map(fn ($spec) => data_get($spec, 'bottoms.length_type'))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
        $this->assertSame(['ankle', 'full'], $pantsLengthTypes);

        $skirtLengthTypes = $standardUser->items
            ->where('category', 'skirts')
            ->pluck('spec')
            ->map(fn ($spec) => data_get($spec, 'skirt.length_type'))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
        $this->assertSame(['knee', 'midi', 'mini'], $skirtLengthTypes);

        $legwearCoverageTypes = $standardUser->items
            ->pluck('spec')
            ->map(fn ($spec) => data_get($spec, 'legwear.coverage_type'))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
        $this->assertSame(
            ['ankle_sneaker', 'crew', 'high_socks', 'seven_tenths', 'stockings', 'ten_tenths', 'tights'],
            $legwearCoverageTypes,
        );

        $standardBrands = UserBrand::query()
            ->where('user_id', $standardUser->id)
            ->orderBy('name')
            ->get();
        $this->assertCount(10, $standardBrands);
        $this->assertTrue($standardBrands->contains(fn (UserBrand $brand) => $brand->is_active === false));
        $this->assertTrue($standardBrands->contains(fn (UserBrand $brand) => $brand->kana !== null));

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

        $this->assertDatabaseMissing('outfit_items', [
            'sort_order' => 0,
        ]);

        $this->assertNotNull($largeUser->visible_category_ids);
        $this->assertCount(2, PurchaseCandidate::query()->where('user_id', $largeUser->id)->get());
        $this->assertCount(6, UserTpo::query()->where('user_id', $largeUser->id)->get());
        $this->assertGreaterThanOrEqual(30, $largeUser->items->count());
        $this->assertSeededItemsUseCurrentSchema($largeUser->items);
        $this->assertGreaterThanOrEqual(10, $largeUser->outfits->count());
        $this->assertTrue(
            $largeUser->outfits()
                ->withCount('outfitItems')
                ->get()
                ->every(fn ($outfit) => $outfit->outfit_items_count > 0),
        );
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

    public function test_item_factory_generates_current_schema_items(): void
    {
        $items = Item::factory()
            ->count(40)
            ->make()
            ->values();

        $this->assertNotEmpty($items);
        $this->assertTrue($items->where('category', 'tops')->every(
            fn (Item $item) => data_get($item->spec, 'tops.shape') === null
        ));
        $this->assertTrue($items->every(
            fn (Item $item) => filled($item->shape) && filled($item->subcategory)
        ));
        $this->assertTrue($items->every(
            fn (Item $item) => ! in_array($item->category, self::LEGACY_ITEM_CATEGORIES, true)
        ));
    }

    private function assertSeededItemsUseCurrentSchema(iterable $items): void
    {
        $collection = collect($items);

        $this->assertTrue($collection->every(
            fn (Item $item) => ! in_array($item->category, self::LEGACY_ITEM_CATEGORIES, true)
        ));
        $this->assertTrue($collection->every(
            fn (Item $item) => ! in_array($item->category, self::CURRENT_SUBCATEGORY_CATEGORIES, true)
                || filled($item->subcategory)
        ));
        $this->assertTrue($collection
            ->where('category', 'tops')
            ->every(fn (Item $item) => data_get($item->spec, 'tops.shape') === null));
    }
}
