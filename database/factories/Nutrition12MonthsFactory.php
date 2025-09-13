<?php

namespace Database\Factories;

use App\Models\Nutrition12Months;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Nutrition12Months>
 */
class Nutrition12MonthsFactory extends Factory
{
    protected $model = Nutrition12Months::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $birthDate = $this->faker->dateTimeBetween('-2 years', '-6 months');
        $ageInMonths = $this->faker->numberBetween(6, 12);
        $ageInMonths12 = $this->faker->numberBetween(12, 18);
        
        return [
            'patient_id' => Patient::factory(),
            'age_in_months' => $ageInMonths,
            'length_cm_date' => $this->faker->optional(0.8)->numberBetween(60, 80) . ' cm',
            'weight_kg_date' => $this->faker->optional(0.8)->numberBetween(6, 12) . ' kg',
            'status' => $this->faker->randomElement(['S', 'W-MAM', 'W-SAM', 'O', 'N']),
            'exclusively_breastfed' => $this->faker->randomElement(['Y', 'N']),
            'complementary_feeding' => $this->faker->randomElement(['Y', 'N']),
            'vitamin_a_date' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+1 year')?->format('Y-m-d'),
            'mnp_date' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+1 year')?->format('Y-m-d'),
            'mmr_1st_9mo' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+9 months')?->format('Y-m-d'),
            'ipv_2nd_9mo' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+9 months')?->format('Y-m-d'),
            'age_in_months_12' => $ageInMonths12,
            'length_cm_date_12' => $this->faker->optional(0.8)->numberBetween(70, 90) . ' cm',
            'weight_kg_date_12' => $this->faker->optional(0.8)->numberBetween(8, 15) . ' kg',
            'status_12' => $this->faker->randomElement(['S', 'W-MAM', 'W-SAM', 'O', 'N']),
            'mmr_2nd_12mo' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+12 months')?->format('Y-m-d'),
            'fic_date' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+1 year')?->format('Y-m-d'),
            'cic_date' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+1 year')?->format('Y-m-d'),
        ];
    }
}
