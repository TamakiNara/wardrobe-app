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

        $this->assertContains(
            ['category' => 'inner', 'shape' => 'roomwear', 'subcategory_null' => true],
            ListQuerySupport::itemVisibleCategoryQueryMap()['roomwear_inner_roomwear']
        );

        $this->assertContains(
            ['category' => 'bags', 'subcategory' => 'tote'],
            ListQuerySupport::itemVisibleCategoryQueryMap()['bags_tote']
        );

        $this->assertContains(
            ['category' => 'bags', 'shape' => 'tote', 'subcategory_null' => true],
            ListQuerySupport::itemVisibleCategoryQueryMap()['bags_tote']
        );

        $this->assertContains(
            ['category' => 'accessories', 'shape' => 'tote'],
            ListQuerySupport::itemVisibleCategoryQueryMap()['bags_tote']
        );

        $this->assertSame(
            'bags_messenger',
            ItemSubcategorySupport::visibleCategoryIdFor('bags', 'messenger')
        );

        $this->assertContains(
            ['category' => 'bags', 'subcategory' => 'messenger'],
            ListQuerySupport::itemVisibleCategoryQueryMap()['bags_messenger']
        );
    }

    public function test_item_input_requirement_support_exposes_shape_options_and_defaults(): void
    {
        $this->assertSame(
            ['jacket', 'tailored', 'no_collar'],
            ItemInputRequirementSupport::shapeOptionsFor('outerwear', 'jacket')
        );
        $this->assertSame(
            ['straight', 'tapered', 'wide', 'culottes', 'jogger', 'skinny', 'gaucho'],
            ItemInputRequirementSupport::shapeOptionsFor('pants', 'denim')
        );
        $this->assertSame(
            [],
            ItemInputRequirementSupport::shapeOptionsFor('pants', 'other')
        );
        $this->assertSame(
            [],
            ItemInputRequirementSupport::shapeOptionsFor('skirts', 'other')
        );
        $this->assertSame(
            [],
            ItemInputRequirementSupport::shapeOptionsFor('outerwear', 'other')
        );
        $this->assertSame(
            'roomwear',
            ItemInputRequirementSupport::defaultShapeFor('inner', 'roomwear')
        );
        $this->assertNull(
            ItemInputRequirementSupport::defaultShapeFor('tops', 'other')
        );
        $this->assertSame(
            'bag',
            ItemInputRequirementSupport::fallbackShapeFor('bags')
        );
        $this->assertSame(
            '',
            ItemInputRequirementSupport::resolveForSave('tops', 'other', '')
        );
    }

    public function test_purchase_candidate_category_map_uses_item_support_defaults(): void
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
                'category' => 'bags',
                'shape' => 'waist-pouch',
                'subcategory' => 'waist_pouch',
            ],
            PurchaseCandidateCategoryMap::resolveItemDraftCategory('bags_waist_pouch')
        );

        $this->assertSame(
            [
                'category' => 'inner',
                'shape' => 'roomwear',
                'subcategory' => 'other',
            ],
            PurchaseCandidateCategoryMap::resolveItemDraftCategory('roomwear_inner_other')
        );

        $this->assertSame(
            [
                'category' => 'tops',
                'shape' => '',
                'subcategory' => 'other',
            ],
            PurchaseCandidateCategoryMap::resolveItemDraftCategory('tops_other')
        );

        $this->assertSame(
            [
                'category' => 'tops',
                'shape' => 'shirt',
                'subcategory' => 'shirt_blouse',
            ],
            PurchaseCandidateCategoryMap::resolveItemDraftCategory('tops_shirt_blouse')
        );

        $this->assertSame(
            [
                'category' => 'outerwear',
                'shape' => 'coat',
                'subcategory' => 'coat',
            ],
            PurchaseCandidateCategoryMap::resolveItemDraftCategory('outerwear_coat')
        );
    }
}
