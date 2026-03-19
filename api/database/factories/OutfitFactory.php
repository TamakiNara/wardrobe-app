<?php

namespace Database\Factories;

use App\Models\Outfit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Outfit>
 */
class OutfitFactory extends Factory
{
    protected $model = Outfit::class;

    public function definition(): array
    {
        $seasonPool = ['春', '夏', '秋', '冬'];
        $tpoPool = ['休日', '仕事', '通勤', 'お出かけ'];

        return [
            'user_id' => User::factory(),
            'name' => 'Bulk Outfit ' . $this->faker->unique()->numberBetween(1, 999),
            'memo' => $this->faker->boolean(60) ? $this->faker->sentence() : null,
            'seasons' => $this->faker->randomElements($seasonPool, $this->faker->numberBetween(1, 3)),
            'tpos' => $this->faker->randomElements($tpoPool, $this->faker->numberBetween(1, 2)),
        ];
    }
}
