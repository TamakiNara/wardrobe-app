<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\UserTpo;
use App\Support\UserTpoNameResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTpoNameResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_build_name_map_returns_only_requested_ids_for_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $work = UserTpo::query()->create([
            'user_id' => $user->id,
            'name' => '出張',
            'sort_order' => 10,
            'is_active' => true,
            'is_preset' => false,
        ]);
        $holiday = UserTpo::query()->create([
            'user_id' => $user->id,
            'name' => '会食',
            'sort_order' => 20,
            'is_active' => true,
            'is_preset' => false,
        ]);
        UserTpo::query()->create([
            'user_id' => $otherUser->id,
            'name' => '他人のTPO',
            'sort_order' => 10,
            'is_active' => true,
            'is_preset' => false,
        ]);

        $nameById = UserTpoNameResolver::buildNameMap($user, [$holiday->id]);

        $this->assertSame([$holiday->id => '会食'], $nameById->all());
        $this->assertArrayNotHasKey($work->id, $nameById->all());
    }

    public function test_resolve_names_from_map_preserves_id_order_and_uses_fallback_when_missing(): void
    {
        $resolved = UserTpoNameResolver::resolveNamesFromMap(
            collect([
                2 => '休日',
                1 => '仕事',
            ]),
            [1, 2],
            ['フォールバック']
        );

        $fallback = UserTpoNameResolver::resolveNamesFromMap(
            collect(),
            [99],
            ['休日', '仕事']
        );

        $noIdsFallback = UserTpoNameResolver::resolveNamesFromMap(
            collect([
                1 => '仕事',
            ]),
            [],
            ['休日', '', '仕事']
        );

        $this->assertSame(['仕事', '休日'], $resolved);
        $this->assertSame(['休日', '仕事'], $fallback);
        $this->assertSame(['休日', '仕事'], $noIdsFallback);
    }
}
