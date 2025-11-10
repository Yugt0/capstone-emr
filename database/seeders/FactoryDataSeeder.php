<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PatientInformation;
use App\Models\ContraceptiveInventory;
use App\Models\VaccineList;
use App\Models\NewbornImmunization;

class FactoryDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating factory data...');

        // Create 50 Patient Information records
        $this->command->info('Creating 50 Patient Information records...');
        PatientInformation::factory(50)->create();
        $this->command->info('✓ Patient Information records created');

        // Create 50 Contraceptive Inventory records
        $this->command->info('Creating 50 Contraceptive Inventory records...');
        ContraceptiveInventory::factory(50)->create();
        $this->command->info('✓ Contraceptive Inventory records created');

        // Create 50 Vaccine List records
        $this->command->info('Creating 50 Vaccine List records...');
        VaccineList::factory(50)->create();
        $this->command->info('✓ Vaccine List records created');

        // Create 50 Newborn Immunization records
        $this->command->info('Creating 50 Newborn Immunization records...');
        NewbornImmunization::factory(50)->create();
        $this->command->info('✓ Newborn Immunization records created');

        $this->command->info('🎉 All factory data created successfully!');
        $this->command->info('Total records created:');
        $this->command->info('- Patient Information: 50');
        $this->command->info('- Contraceptive Inventory: 50');
        $this->command->info('- Vaccine List: 50');
        $this->command->info('- Newborn Immunization: 50');
    }
}


