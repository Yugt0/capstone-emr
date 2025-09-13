<?php

namespace Database\Factories;

use App\Models\NewbornImmunization;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\NewbornImmunization>
 */
class NewbornImmunizationFactory extends Factory
{
    protected $model = NewbornImmunization::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $birthDate = $this->faker->dateTimeBetween('-2 years', '-1 month');
        $ageInMonths = $this->faker->numberBetween(0, 24);
        
        return [
            'patient_id' => Patient::factory(),
            'length_at_birth' => $this->faker->numberBetween(45, 55) . ' cm',
            'weight_at_birth' => $this->faker->randomFloat(2, 2.5, 4.5),
            'birth_weight_status' => $this->faker->randomElement(['Normal', 'Low Birth Weight', 'Very Low Birth Weight']),
            'breast_feeding_date' => $this->faker->optional(0.9)->dateTimeBetween($birthDate, '+1 week')?->format('Y-m-d'),
            'bcg_date' => $this->faker->optional(0.8)->dateTimeBetween($birthDate, '+1 month')?->format('Y-m-d'),
            'hepa_b_bd_date' => $this->faker->optional(0.8)->dateTimeBetween($birthDate, '+1 week')?->format('Y-m-d'),
            'age_in_months' => $ageInMonths,
            'length_in_threes_months' => $this->faker->optional(0.7)->numberBetween(55, 70) . ' cm',
            'weight_in_threes_months' => $this->faker->optional(0.7)->numberBetween(4, 8) . ' kg',
            'status' => $this->faker->randomElement(['Up to date', 'Behind schedule', 'Not started']),
            'iron_1mo_date' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+2 months')?->format('Y-m-d'),
            'iron_2mo_date' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+3 months')?->format('Y-m-d'),
            'iron_3mo_date' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+4 months')?->format('Y-m-d'),
            'dpt_hib_hepb_1st' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+2 months')?->format('Y-m-d'),
            'dpt_hib_hepb_2nd' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+3 months')?->format('Y-m-d'),
            'dpt_hib_hepb_3rd' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+4 months')?->format('Y-m-d'),
            'opv_1st' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+2 months')?->format('Y-m-d'),
            'opv_2nd' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+3 months')?->format('Y-m-d'),
            'opv_3rd' => $this->faker->optional(0.7)->dateTimeBetween($birthDate, '+4 months')?->format('Y-m-d'),
            'pcv_1st' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+2 months')?->format('Y-m-d'),
            'pcv_2nd' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+3 months')?->format('Y-m-d'),
            'pcv_3rd' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+4 months')?->format('Y-m-d'),
            'ipv_1st' => $this->faker->optional(0.6)->dateTimeBetween($birthDate, '+2 months')?->format('Y-m-d'),
        ];
    }
}