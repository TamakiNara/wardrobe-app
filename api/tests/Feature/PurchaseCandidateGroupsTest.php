<?php

namespace Tests\Feature;

use App\Models\CategoryGroup;
use App\Models\CategoryMaster;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\User;
use App\Support\PurchaseCandidateGroupSupport;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PurchaseCandidateGroupsTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchase_candidate_group_keeps_candidates_in_group_order(): void
    {
        $user = User::factory()->create();
        $this->createCategory();

        $group = PurchaseCandidateGroup::query()->create([
            'user_id' => $user->id,
        ]);

        $third = $this->createCandidate($user, $group, 3, 'third');
        $first = $this->createCandidate($user, $group, 1, 'first');
        $second = $this->createCandidate($user, $group, 2, 'second');

        $this->assertSame(
            [$first->id, $second->id, $third->id],
            $group->candidates()->pluck('id')->all()
        );
        $this->assertSame(4, $group->nextGroupOrder());
    }

    public function test_purchase_candidate_group_rejects_duplicate_group_order(): void
    {
        $user = User::factory()->create();
        $this->createCategory();

        $group = PurchaseCandidateGroup::query()->create([
            'user_id' => $user->id,
        ]);

        $this->createCandidate($user, $group, 1, 'first');

        $this->expectException(UniqueConstraintViolationException::class);

        $this->createCandidate($user, $group, 1, 'duplicate');
    }

    public function test_purchase_candidate_group_support_rejects_other_user_group(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->createCategory();

        $candidate = $this->createCandidate($user, null, null, 'candidate');
        $otherGroup = PurchaseCandidateGroup::query()->create([
            'user_id' => $otherUser->id,
        ]);

        $this->expectException(ValidationException::class);

        PurchaseCandidateGroupSupport::ensureGroupBelongsToCandidateUser($otherGroup, $candidate);
    }

    public function test_purchase_candidate_can_stay_without_group(): void
    {
        $user = User::factory()->create();
        $this->createCategory();

        $candidate = $this->createCandidate($user, null, null, 'single');

        $this->assertNull($candidate->group_id);
        $this->assertNull($candidate->group_order);
    }

    private function createCategory(): void
    {
        CategoryGroup::query()->create([
            'id' => 'tops',
            'name' => 'tops',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        CategoryMaster::query()->create([
            'id' => 'tops_tshirt_cutsew',
            'group_id' => 'tops',
            'name' => 'T-shirt',
            'sort_order' => 1,
            'is_active' => true,
        ]);
    }

    private function createCandidate(
        User $user,
        ?PurchaseCandidateGroup $group,
        ?int $groupOrder,
        string $name,
    ): PurchaseCandidate {
        return PurchaseCandidate::query()->create([
            'user_id' => $user->id,
            'group_id' => $group?->id,
            'group_order' => $groupOrder,
            'status' => 'considering',
            'priority' => 'medium',
            'name' => $name,
            'category_id' => 'tops_tshirt_cutsew',
            'is_rain_ok' => false,
        ]);
    }
}
