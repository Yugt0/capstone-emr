<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VaccineList>
 */
class VaccineListFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $products = [
            'BCG (Bacillus Calmette-Guérin)',
            'Hepatitis B Vaccine',
            'DPT (Diphtheria, Pertussis, Tetanus)',
            'OPV (Oral Polio Vaccine)',
            'IPV (Inactivated Polio Vaccine)',
            'Hib (Haemophilus influenzae type b)',
            'PCV (Pneumococcal Conjugate Vaccine)',
            'MMR (Measles, Mumps, Rubella)',
            'Varicella (Chickenpox) Vaccine',
            'Hepatitis A Vaccine',
            'Meningococcal Vaccine',
            'HPV (Human Papillomavirus) Vaccine',
            'Influenza Vaccine',
            'Tdap (Tetanus, Diphtheria, Pertussis)',
            'Rotavirus Vaccine'
        ];

        $beginningBalance = $this->faker->numberBetween(50, 200);
        $deliveryQuantity = $this->faker->numberBetween(100, 500);
        $consumption = $this->faker->numberBetween(20, 150) . ' doses';
        $stockTransferIn = $this->faker->numberBetween(0, 50);
        $stockTransferOut = $this->faker->numberBetween(0, 30);
        $remainingBalance = $beginningBalance + $deliveryQuantity - intval($consumption) + $stockTransferIn - $stockTransferOut;

        return [
            'date_received' => $this->faker->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'product' => $this->faker->randomElement($products),
            'beginning_balance' => $beginningBalance,
            'delivery' => $this->faker->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'consumption' => $consumption,
            'stock_trasfer_in' => $stockTransferIn,
            'stock_trasfer_out' => $stockTransferOut,
            'expiration_date' => $this->faker->dateTimeBetween('+6 months', '+2 years')->format('Y-m-d'),
            'remaining_balance' => max(0, $remainingBalance), // Ensure non-negative balance
        ];
    }
}
