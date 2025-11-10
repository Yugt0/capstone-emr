<?php

namespace Database\Factories;

use App\Models\ContraceptiveInventory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContraceptiveInventory>
 */
class ContraceptiveInventoryFactory extends Factory
{
    protected $model = ContraceptiveInventory::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $contraceptiveTypes = [
            'Oral Contraceptive Pills',
            'Condoms',
            'IUD (Intrauterine Device)',
            'Injectable Contraceptives',
            'Implant',
            'Emergency Contraceptive Pills',
            'Diaphragm',
            'Cervical Cap',
            'Spermicide',
            'Contraceptive Patch',
            'Vaginal Ring',
            'Fertility Awareness Methods'
        ];

        $contraceptiveNames = [
            'Combined Oral Contraceptive Pills',
            'Progestin-Only Pills',
            'Male Condoms',
            'Female Condoms',
            'Copper IUD',
            'Hormonal IUD',
            'Depo-Provera',
            'Nexplanon Implant',
            'Plan B Emergency Contraceptive',
            'Diaphragm with Spermicide',
            'Ortho Evra Patch',
            'NuvaRing',
            'Spermicidal Gel',
            'Contraceptive Sponge',
            'Cervical Cap with Spermicide'
        ];

        $batchNumber = 'BATCH-' . $this->faker->unique()->numberBetween(100000, 999999);
        $quantity = $this->faker->numberBetween(10, 500);
        $expirationDate = $this->faker->dateTimeBetween('+6 months', '+3 years');

        return [
            'contraceptive_name' => $this->faker->randomElement($contraceptiveNames),
            'contraceptive_type' => $this->faker->randomElement($contraceptiveTypes),
            'batch_number' => $batchNumber,
            'quantity' => $quantity,
            'expiration_date' => $expirationDate->format('Y-m-d'),
        ];
    }
}


