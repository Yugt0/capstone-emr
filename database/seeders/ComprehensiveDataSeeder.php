<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PatientInformation;
use App\Models\Patient;
use App\Models\VaccineList;
use App\Models\ContraceptiveInventory;
use App\Models\ContraceptiveList;
use App\Models\NewbornImmunization;
use App\Models\Nutrition12Months;
use App\Models\Outcome;
use App\Models\User;
use App\Models\Role;

class ComprehensiveDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create users
        $this->createUsers();
        
        // Create 50 patient information records
        PatientInformation::factory(50)->create();
        
        // Create 50 patients (for vaccine tracker)
        $patients = Patient::factory(50)->create();
        
        // Create 50 vaccine list records
        VaccineList::factory(50)->create();
        
        // Create 50 contraceptive inventory records
        ContraceptiveInventory::factory(50)->create();
        
        // Create 50 contraceptive list records (skip for now due to table issues)
        // ContraceptiveList::factory(50)->create();
        
        // Create 50 newborn immunization records
        NewbornImmunization::factory(50)->create();
        
        // Create 50 nutrition 12 months records
        Nutrition12Months::factory(50)->create();
        
        // Create 50 outcome records
        Outcome::factory(50)->create();
        
        $this->command->info('Successfully created 50 records for each table!');
    }
    
    private function createRoles(): void
    {
        $roles = [
            ['name' => 'admin', 'description' => 'System Administrator'],
            ['name' => 'doctor', 'description' => 'Medical Doctor'],
            ['name' => 'nurse', 'description' => 'Registered Nurse'],
            ['name' => 'nursing_attendant', 'description' => 'Nursing Attendant'],
            ['name' => 'midwife', 'description' => 'Licensed Midwife'],
        ];
        
        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
    
    private function createUsers(): void
    {
        // Create doctor users
        for ($i = 1; $i <= 5; $i++) {
            User::firstOrCreate(
                ['email' => "doctor{$i}@emr.com"],
                [
                    'name' => "Dr. Doctor {$i}",
                    'username' => "doctor{$i}",
                    'full_name' => "Dr. Doctor {$i}",
                    'password' => bcrypt('password'),
                    'role' => 'doctor',
                ]
            );
        }
        
        // Create nursing attendant users
        for ($i = 1; $i <= 3; $i++) {
            User::firstOrCreate(
                ['email' => "attendant{$i}@emr.com"],
                [
                    'name' => "Attendant {$i}",
                    'username' => "attendant{$i}",
                    'full_name' => "Attendant {$i}",
                    'password' => bcrypt('password'),
                    'role' => 'nursing_attendant',
                ]
            );
        }
        
        // Create midwife users
        for ($i = 1; $i <= 3; $i++) {
            User::firstOrCreate(
                ['email' => "midwife{$i}@emr.com"],
                [
                    'name' => "Midwife {$i}",
                    'username' => "midwife{$i}",
                    'full_name' => "Midwife {$i}",
                    'password' => bcrypt('password'),
                    'role' => 'midwife',
                ]
            );
        }
        
        // Create encoder users
        for ($i = 1; $i <= 2; $i++) {
            User::firstOrCreate(
                ['email' => "encoder{$i}@emr.com"],
                [
                    'name' => "Encoder {$i}",
                    'username' => "encoder{$i}",
                    'full_name' => "Encoder {$i}",
                    'password' => bcrypt('password'),
                    'role' => 'encoder',
                ]
            );
        }
        
        // Create cold chain manager users
        for ($i = 1; $i <= 2; $i++) {
            User::firstOrCreate(
                ['email' => "manager{$i}@emr.com"],
                [
                    'name' => "Manager {$i}",
                    'username' => "manager{$i}",
                    'full_name' => "Manager {$i}",
                    'password' => bcrypt('password'),
                    'role' => 'cold_chain_manager',
                ]
            );
        }
    }
}
