<?php

namespace Database\Factories;

use App\Models\PatientInformation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PatientInformation>
 */
class PatientInformationFactory extends Factory
{
    protected $model = PatientInformation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $genders = ['Male', 'Female'];
        $barangays = [
            'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
            'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
            'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15',
            'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20'
        ];

        return [
            'first_name' => $this->faker->firstName(),
            'middle_name' => $this->faker->optional(0.7)->firstName(), // 70% chance of having middle name
            'last_name' => $this->faker->lastName(),
            'birth_date' => $this->faker->dateTimeBetween('-80 years', '-1 year')->format('Y-m-d'),
            'gender' => $this->faker->randomElement($genders),
            'contact_number' => $this->faker->optional(0.8)->phoneNumber(), // 80% chance of having contact number
            'address' => $this->faker->optional(0.9)->streetAddress(), // 90% chance of having address
            'barangay' => $this->faker->randomElement($barangays),
        ];
    }
}


