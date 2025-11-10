<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ContraceptiveInventory;
use App\Models\VaccineList;

class TestExpiringDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating test expiring data...');

        // Create contraceptives that expire soon
        $contraceptives = [
            [
                'contraceptive_name' => 'Test Contraceptive 1',
                'contraceptive_type' => 'Oral Pills',
                'batch_number' => 'TEST-001',
                'quantity' => 50,
                'expiration_date' => now()->addDays(15)->format('Y-m-d'), // 15 days from now
            ],
            [
                'contraceptive_name' => 'Test Contraceptive 2',
                'contraceptive_type' => 'Condoms',
                'batch_number' => 'TEST-002',
                'quantity' => 100,
                'expiration_date' => now()->addDays(20)->format('Y-m-d'), // 20 days from now
            ],
            [
                'contraceptive_name' => 'Test Contraceptive 3',
                'contraceptive_type' => 'IUD',
                'batch_number' => 'TEST-003',
                'quantity' => 25,
                'expiration_date' => now()->addDays(5)->format('Y-m-d'), // 5 days from now
            ],
        ];

        foreach ($contraceptives as $contraceptive) {
            ContraceptiveInventory::create($contraceptive);
        }

        // Create vaccines that expire soon
        $vaccines = [
            [
                'date_received' => now()->subDays(30)->format('Y-m-d'),
                'product' => 'Test Vaccine 1',
                'beginning_balance' => 100,
                'delivery' => now()->subDays(30)->format('Y-m-d'),
                'consumption' => '20 doses',
                'stock_trasfer_in' => 0,
                'stock_trasfer_out' => 0,
                'expiration_date' => now()->addDays(10)->format('Y-m-d'), // 10 days from now
                'remaining_balance' => 80,
            ],
            [
                'date_received' => now()->subDays(20)->format('Y-m-d'),
                'product' => 'Test Vaccine 2',
                'beginning_balance' => 150,
                'delivery' => now()->subDays(20)->format('Y-m-d'),
                'consumption' => '30 doses',
                'stock_trasfer_in' => 0,
                'stock_trasfer_out' => 0,
                'expiration_date' => now()->addDays(25)->format('Y-m-d'), // 25 days from now
                'remaining_balance' => 120,
            ],
        ];

        foreach ($vaccines as $vaccine) {
            VaccineList::create($vaccine);
        }

        $this->command->info('Test expiring data created successfully!');
    }
}




