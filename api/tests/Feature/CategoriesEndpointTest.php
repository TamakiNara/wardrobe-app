<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use Database\Seeders\CategoryGroupSeeder;
use Database\Seeders\CategoryMasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoriesEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CategoryGroupSeeder::class);
        $this->seed(CategoryMasterSeeder::class);
    }

    public function test_categories_endpoint_returns_active_groups_and_categories(): void
    {
        CategoryGroup::query()->where('id', 'bags')->update(['is_active' => false]);
        CategoryMaster::query()->where('id', 'tops_vest_gilet')->update(['is_active' => false]);

        $response = $this->getJson('/api/categories', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk();

        $groups = $response->json('groups');

        $this->assertNotNull($groups);
        $this->assertContains('tops', array_column($groups, 'id'));
        $this->assertNotContains('bags', array_column($groups, 'id'));

        $topsGroup = collect($groups)->firstWhere('id', 'tops');

        $this->assertNotNull($topsGroup);
        $this->assertSame('トップス', $topsGroup['name']);
        $this->assertContains('tops_tshirt_cutsew', array_column($topsGroup['categories'], 'id'));
        $this->assertNotContains('tops_vest_gilet', array_column($topsGroup['categories'], 'id'));
    }

    public function test_categories_endpoint_omits_legacy_active_groups_and_categories(): void
    {
        CategoryGroup::query()->create([
            'id' => 'legacy_accessories',
            'name' => 'Legacy accessories',
            'sort_order' => 999,
            'is_active' => true,
        ]);

        CategoryMaster::query()->create([
            'id' => 'legacy_accessories_misc',
            'group_id' => 'legacy_accessories',
            'name' => 'Legacy misc',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        CategoryMaster::query()->create([
            'id' => 'shoes_loafers',
            'group_id' => 'shoes',
            'name' => 'Legacy loafers',
            'sort_order' => 999,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/categories', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk();

        $groups = $response->json('groups');

        $this->assertNotContains('legacy_accessories', array_column($groups, 'id'));

        $shoesGroup = collect($groups)->firstWhere('id', 'shoes');

        $this->assertNotNull($shoesGroup);
        $this->assertContains('shoes_leather_shoes', array_column($shoesGroup['categories'], 'id'));
        $this->assertContains('shoes_rain_shoes_boots', array_column($shoesGroup['categories'], 'id'));
        $this->assertNotContains('shoes_loafers', array_column($shoesGroup['categories'], 'id'));
    }

    public function test_categories_endpoint_returns_group_id_as_group_id_in_json(): void
    {
        $response = $this->getJson('/api/categories', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk();

        $topsGroup = collect($response->json('groups'))->firstWhere('id', 'tops');
        $firstCategory = $topsGroup['categories'][0] ?? null;

        $this->assertNotNull($firstCategory);
        $this->assertArrayHasKey('groupId', $firstCategory);
        $this->assertSame('tops', $firstCategory['groupId']);
        $this->assertArrayNotHasKey('group_id', $firstCategory);
    }

    public function test_categories_endpoint_includes_roomwear_inner_group_in_current_groups(): void
    {
        $response = $this->getJson('/api/categories', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk();

        $groups = $response->json('groups');
        $this->assertContains('roomwear_inner', array_column($groups, 'id'));

        $innerGroup = collect($groups)->firstWhere('id', 'roomwear_inner');

        $this->assertNotNull($innerGroup);
        $this->assertSame('ルームウェア・インナー', $innerGroup['name']);
        $this->assertContains(
            'roomwear_inner_roomwear',
            array_column($innerGroup['categories'], 'id'),
        );
        $this->assertNotContains(
            'roomwear_inner_underwear',
            array_column($innerGroup['categories'], 'id'),
        );

        $underwearGroup = collect($groups)->firstWhere('id', 'underwear');

        $this->assertNotNull($underwearGroup);
        $this->assertSame('アンダーウェア', $underwearGroup['name']);
        $this->assertContains(
            'underwear_bra',
            array_column($underwearGroup['categories'], 'id'),
        );
    }

    public function test_categories_endpoint_returns_groups_and_categories_in_sort_order(): void
    {
        CategoryGroup::query()->where('id', 'fashion_accessories')->update(['sort_order' => 0]);
        CategoryMaster::query()->where('id', 'tops_vest_gilet')->update(['sort_order' => 0]);

        $response = $this->getJson('/api/categories', [
            'Accept' => 'application/json',
        ]);

        $response->assertOk();

        $groups = $response->json('groups');
        $this->assertSame('fashion_accessories', $groups[0]['id']);

        $topsGroup = collect($groups)->firstWhere('id', 'tops');
        $this->assertNotNull($topsGroup);
        $this->assertSame('tops_vest_gilet', $topsGroup['categories'][0]['id']);
    }
}
