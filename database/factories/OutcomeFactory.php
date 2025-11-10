<?php

namespace Database\Factories;

use App\Models\Outcome;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Outcome>
 */
class OutcomeFactory extends Factory
{
    protected $model = Outcome::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'mam_admitted_sfp' => $this->faker->randomElement(['Yes', 'No']),
            'mam_cured' => $this->faker->randomElement(['Yes', 'No']),
            'mam_defaulted' => $this->faker->randomElement(['Yes', 'No']),
            'mam_died' => $this->faker->randomElement(['Yes', 'No']),
            'sam_admitted_otc' => $this->faker->randomElement(['Yes', 'No']),
            'sam_cured' => $this->faker->randomElement(['Yes', 'No']),
            'sam_defaulted' => $this->faker->randomElement(['Yes', 'No']),
            'sam_died' => $this->faker->randomElement(['Yes', 'No']),
            'remarks' => $this->faker->optional(0.7)->sentence(),
        ];
    }
}




