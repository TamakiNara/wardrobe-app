<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserBrand;
use App\Support\BrandNormalizer;
use Database\Seeders\Support\TestSeedUsers;
use Illuminate\Database\Seeder;

class SampleUserBrandSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedEmptyUserBrands();
        $this->seedStandardUserBrands();
        $this->seedLargeUserBrands();
    }

    private function seedEmptyUserBrands(): void
    {
        $user = User::query()->where('email', TestSeedUsers::EMPTY_EMAIL)->firstOrFail();

        UserBrand::query()->where('user_id', $user->id)->delete();
    }

    private function seedStandardUserBrands(): void
    {
        $user = User::query()->where('email', TestSeedUsers::STANDARD_EMAIL)->firstOrFail();

        UserBrand::query()->where('user_id', $user->id)->delete();

        $brands = [
            ['name' => 'UNIQLO', 'kana' => 'ゆにくろ', 'is_active' => true],
            ['name' => 'GU', 'kana' => 'じーゆー', 'is_active' => true],
            ['name' => 'GLOBAL WORK', 'kana' => 'ぐろーばるわーく', 'is_active' => true],
            ['name' => 'NATURAL BEAUTY BASIC', 'kana' => null, 'is_active' => true],
            ['name' => '無印良品', 'kana' => 'むじるしりょうひん', 'is_active' => true],
            ['name' => 'ABC-MART', 'kana' => 'えーびーしーまーと', 'is_active' => true],
            ['name' => 'ZARA', 'kana' => 'ざら', 'is_active' => true],
            ['name' => 'BEAMS', 'kana' => null, 'is_active' => true],
            ['name' => 'UNITED ARROWS', 'kana' => null, 'is_active' => false],
            ['name' => '確認用', 'kana' => 'かくにんよう', 'is_active' => true],
        ];

        $this->createBrands($user->id, $brands);
    }

    private function seedLargeUserBrands(): void
    {
        $user = User::query()->where('email', TestSeedUsers::LARGE_EMAIL)->firstOrFail();

        UserBrand::query()->where('user_id', $user->id)->delete();

        $brands = [
            ['name' => 'UNIQLO', 'kana' => 'ゆにくろ', 'is_active' => true],
            ['name' => 'GU', 'kana' => 'じーゆー', 'is_active' => true],
            ['name' => 'GLOBAL WORK', 'kana' => 'ぐろーばるわーく', 'is_active' => true],
            ['name' => '無印良品', 'kana' => 'むじるしりょうひん', 'is_active' => true],
            ['name' => 'ABC-MART', 'kana' => 'えーびーしーまーと', 'is_active' => true],
            ['name' => 'ZARA', 'kana' => 'ざら', 'is_active' => true],
            ['name' => 'H&M', 'kana' => 'えいちあんどえむ', 'is_active' => true],
            ['name' => 'しまむら', 'kana' => 'しまむら', 'is_active' => true],
            ['name' => 'nano・universe', 'kana' => 'なのゆにばーす', 'is_active' => true],
            ['name' => 'BEAMS', 'kana' => null, 'is_active' => true],
            ['name' => 'URBAN RESEARCH', 'kana' => 'あーばんりさーち', 'is_active' => true],
            ['name' => 'FREAKS STORE', 'kana' => 'ふりーくすすとあ', 'is_active' => true],
            ['name' => 'SHIPS', 'kana' => 'しっぷす', 'is_active' => true],
            ['name' => 'UNITED ARROWS', 'kana' => null, 'is_active' => true],
            ['name' => 'JOURNAL STANDARD', 'kana' => null, 'is_active' => true],
            ['name' => 'niko and ...', 'kana' => 'にこあんど', 'is_active' => true],
            ['name' => 'LOWRYS FARM', 'kana' => 'ろーりーずふぁーむ', 'is_active' => true],
            ['name' => 'earth music&ecology', 'kana' => null, 'is_active' => true],
            ['name' => 'VIS', 'kana' => 'びす', 'is_active' => true],
            ['name' => 'PLST', 'kana' => 'ぷらすて', 'is_active' => true],
            ['name' => 'Bshop', 'kana' => null, 'is_active' => true],
            ['name' => 'MHL.', 'kana' => null, 'is_active' => true],
            ['name' => 'KBF', 'kana' => null, 'is_active' => false],
            ['name' => 'OPAQUE.CLIP', 'kana' => null, 'is_active' => false],
        ];

        $this->createBrands($user->id, $brands);
    }

    /**
     * @param  array<int, array{name:string, kana:?string, is_active:bool}>  $brands
     */
    private function createBrands(int $userId, array $brands): void
    {
        foreach ($brands as $brand) {
            UserBrand::query()->create([
                'user_id' => $userId,
                'name' => $brand['name'],
                'kana' => $brand['kana'],
                'normalized_name' => BrandNormalizer::normalizeName($brand['name']),
                'normalized_kana' => BrandNormalizer::normalizeKana($brand['kana']),
                'is_active' => $brand['is_active'],
            ]);
        }
    }
}
