<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UtilityTrash>
 */
class UtilityTrashFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'date' => $this->faker->dateTimeThisYear()->format('Y-m-d H:i:s'),
            'performed_by' => rand(1, 100),
            'verified_by' => rand(1, 100),
        ];
    }
}


// <?php

// use Illuminate\Database\Eloquent\Factories\Factory;
// use App\Models\UtilityTrash;

// class UtilityTrashFactory extends Factory
// {
//   protected $model = UtilityTrash::class;

//   public function definition()
//   {
    
//   }
// }
