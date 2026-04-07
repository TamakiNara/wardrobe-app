<?php

namespace Tests\Unit;

use App\Support\ItemInputRequirementSupport;
use App\Support\ItemSubcategorySupport;
use App\Support\ListQuerySupport;
use App\Support\PurchaseCandidateCategoryMap;
use Tests\TestCase;

class ItemCategoryMappingSupportTest extends TestCase
{
    public function test_item_subcategory_support_exposes_visible_category_ids(): void
    {
        $this->assertSame(
            'roomwear_inner_roomwear',
            ItemSubcategorySupport::visibleCategoryIdFor('inner', 'roomwear')
        );
        $this->assertSame(
            'fashion_accessories_watch',
            ItemSubcategorySupport::visibleCategoryIdFor('fashion_accessories', 'watch')
        );
        $this->assertSame(
            ItemSubcategorySupport::visibleCategoryIdMap(),
            ListQuerySupport::itemVisibleCategoryIdBySubcategoryMap()
        );

        $this->assertContains(
            ['category' => 'inner', 'subcategory' => 'roomwear'],
            ListQuerySupport::itemVisibleCategoryQueryMap()['roomwear_inner_roomwear']
        );
    }

    public function test_item_input_requirement_support_exposes_shape_options_and_defaults(): void
    {
        $this->assertSame(
            ['jacket', 'tailored', 'no_collar'],
            ItemInputRequirementSupport::shapeOptionsFor('outerwear', 'jacket')
        );
        $this->assertSame(
            'roomwear',
            ItemInputRequirementSupport::defaultShapeFor('inner', 'roomwear')
        );
        $this->assertSame(
            'bag',
            ItemInputRequirementSupport::fallbackShapeFor('bags')
        );
    }

    public function test_purchase_candidate_category_map_uses_item_support_normalization(): void
    {
        $this->assertSame(
            [
                'category' => 'bags',
                'shape' => 'bag',
                'subcategory' => 'other',
            ],
            PurchaseCandidateCategoryMap::resolveItemDraftCategory('bags_other')
        );

        $this->assertSame(
            [
                'category' => 'inner',
                'shape' => 'roomwear',
                'subcategory' => 'other',
            ],
            PurchaseCandidateCategoryMap::resolveItemDraftCategory('roomwear_inner_other')
        );
    }
}
