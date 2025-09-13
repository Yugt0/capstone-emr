<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Patient>
 */
class PatientFactory extends Factory
{
    protected $model = Patient::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $genders = ['M', 'F'];
        $sex = $this->faker->randomElement($genders);
        
        return [
            'registration_no' => 'REG-' . $this->faker->unique()->numberBetween(100000, 999999),
            'registration_date' => $this->faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
            'birth_date' => $this->faker->dateTimeBetween('-5 years', '-1 day')->format('Y-m-d'),
            'family_serial_number' => $this->faker->optional(0.8)->numerify('FAM-####'),
            'child_name' => $this->faker->firstName() . ' ' . $this->faker->lastName(),
            'sex' => $sex,
            'mother_name' => $this->faker->name('female'),
            'address' => $this->faker->streetAddress() . ', ' . $this->faker->city(),
            'cpab_8a' => $this->faker->optional(0.6)->randomElement(['Yes', 'No']),
            'cpab_8b' => $this->faker->optional(0.6)->randomElement(['Yes', 'No']),
        ];
    }
}

