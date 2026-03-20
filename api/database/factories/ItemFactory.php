<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Item>
 */
class ItemFactory extends Factory
{
    protected $model = Item::class;

    public function definition(): array
    {
        $definitions = [
            [
                'category' => 'tops',
                'shape' => 'tshirt',
                'name' => 'Bulk Tシャツ',
                'spec' => [
                    'tops' => [
                        'shape' => 'tshirt',
                        'sleeve' => 'short',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
            [
                'category' => 'tops',
                'shape' => 'shirt',
                'name' => 'Bulk シャツ',
                'spec' => [
                    'tops' => [
                        'shape' => 'shirt',
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'crew',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
            [
                'category' => 'tops',
                'shape' => 'cardigan',
                'name' => 'Bulk カーディガン',
                'spec' => [
                    'tops' => [
                        'shape' => 'cardigan',
                        'sleeve' => 'long',
                        'length' => 'normal',
                        'neck' => 'v',
                        'design' => null,
                        'fit' => 'normal',
                    ],
                ],
            ],
            [
                'category' => 'bottoms',
                'shape' => 'straight',
                'name' => 'Bulk デニム',
                'spec' => null,
            ],
            [
                'category' => 'bottoms',
                'shape' => 'wide',
                'name' => 'Bulk ワイドパンツ',
                'spec' => null,
            ],
            [
                'category' => 'outer',
                'shape' => 'trench',
                'name' => 'Bulk トレンチ',
                'spec' => null,
            ],
            [
                'category' => 'shoes',
                'shape' => 'sneakers',
                'name' => 'Bulk スニーカー',
                'spec' => null,
            ],
            [
                'category' => 'accessories',
                'shape' => 'tote',
                'name' => 'Bulk トート',
                'spec' => null,
            ],
        ];

        $selected = $this->faker->randomElement($definitions);
        $mainColors = [
            ['value' => 'white', 'label' => 'ホワイト', 'hex' => '#ECECEC'],
            ['value' => 'black', 'label' => 'ブラック', 'hex' => '#1F1F1F'],
            ['value' => 'navy', 'label' => 'ネイビー', 'hex' => '#2F4058'],
            ['value' => 'beige', 'label' => 'ベージュ', 'hex' => '#D3C0A4'],
            ['value' => 'gray', 'label' => 'グレー', 'hex' => '#9AA0A6'],
            ['value' => 'olive', 'label' => 'オリーブ', 'hex' => '#66714A'],
        ];
        $subColors = [
            ['value' => 'off_white', 'label' => 'オフホワイト', 'hex' => '#F5F3EE'],
            ['value' => 'brown', 'label' => 'ブラウン', 'hex' => '#704E3E'],
            ['value' => 'blue', 'label' => 'ブルー', 'hex' => '#0077D9'],
            ['value' => 'camel', 'label' => 'キャメル', 'hex' => '#B98B58'],
        ];
        $mainColor = $this->faker->randomElement($mainColors);
        $colors = [[
            'role' => 'main',
            'mode' => 'preset',
            'value' => $mainColor['value'],
            'hex' => $mainColor['hex'],
            'label' => $mainColor['label'],
        ]];

        if ($this->faker->boolean(40)) {
            $subColor = $this->faker->randomElement($subColors);
            $colors[] = [
                'role' => 'sub',
                'mode' => 'preset',
                'value' => $subColor['value'],
                'hex' => $subColor['hex'],
                'label' => $subColor['label'],
            ];
        }

        $seasonPool = ['春', '夏', '秋', '冬'];
        $tpoPool = ['仕事', '休日', 'フォーマル'];

        return [
            'user_id' => User::factory(),
            'name' => $selected['name'] . ' ' . $this->faker->unique()->numberBetween(1, 999),
            'category' => $selected['category'],
            'shape' => $selected['shape'],
            'colors' => $colors,
            'seasons' => $this->faker->randomElements($seasonPool, $this->faker->numberBetween(1, 3)),
            'tpos' => $this->faker->randomElements($tpoPool, $this->faker->numberBetween(1, 2)),
            'spec' => $selected['spec'],
        ];
    }
}
