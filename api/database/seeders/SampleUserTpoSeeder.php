<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserTpo;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;

class SampleUserTpoSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedEmptyUser();
        $this->seedStandardUser();
        $this->seedLargeUser();
    }

    private function seedEmptyUser(): void
    {
        $user = User::query()->where('email', TestSeedUsers::EMPTY_EMAIL)->firstOrFail();
        $this->syncTpos($user, [
            ['name' => '仕事', 'sort_order' => 1, 'is_active' => true, 'is_preset' => true],
            ['name' => '休日', 'sort_order' => 2, 'is_active' => true, 'is_preset' => true],
            ['name' => 'フォーマル', 'sort_order' => 3, 'is_active' => true, 'is_preset' => true],
        ]);
    }

    private function seedStandardUser(): void
    {
        $user = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->firstOrFail();

        $this->syncTpos($user, [
            ['name' => '仕事', 'sort_order' => 1, 'is_active' => true, 'is_preset' => true],
            ['name' => '休日', 'sort_order' => 2, 'is_active' => true, 'is_preset' => true],
            ['name' => 'フォーマル', 'sort_order' => 3, 'is_active' => true, 'is_preset' => true],
            ['name' => '出張', 'sort_order' => 4, 'is_active' => true, 'is_preset' => false],
            ['name' => '在宅', 'sort_order' => 5, 'is_active' => false, 'is_preset' => false],
        ]);
    }

    private function seedLargeUser(): void
    {
        $user = User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->firstOrFail();

        $this->syncTpos($user, [
            ['name' => '仕事', 'sort_order' => 1, 'is_active' => true, 'is_preset' => true],
            ['name' => '休日', 'sort_order' => 2, 'is_active' => true, 'is_preset' => true],
            ['name' => 'フォーマル', 'sort_order' => 3, 'is_active' => true, 'is_preset' => true],
            ['name' => '出張', 'sort_order' => 4, 'is_active' => true, 'is_preset' => false],
            ['name' => '旅行', 'sort_order' => 5, 'is_active' => true, 'is_preset' => false],
            ['name' => '学校行事', 'sort_order' => 6, 'is_active' => false, 'is_preset' => false],
        ]);
    }

    private function syncTpos(User $user, array $definitions): void
    {
        UserTpo::query()->where('user_id', $user->id)->delete();

        foreach ($definitions as $definition) {
            UserTpo::query()->create([
                'user_id' => $user->id,
                'name' => $definition['name'],
                'sort_order' => $definition['sort_order'],
                'is_active' => $definition['is_active'],
                'is_preset' => $definition['is_preset'],
            ]);
        }
    }
}
