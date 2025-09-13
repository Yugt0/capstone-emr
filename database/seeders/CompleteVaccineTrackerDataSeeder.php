<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\NewbornImmunization;
use App\Models\Nutrition12Months;
use App\Models\Outcome;
use Carbon\Carbon;

class CompleteVaccineTrackerDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder ensures ALL patients have complete vaccine tracker data.
     */
    public function run(): void
    {
        $this->command->info('Starting Complete Vaccine Tracker Data Seeding...');
        
        // Get all patients
        $patients = Patient::all();
        
        if ($patients->isEmpty()) {
            $this->command->warn('No patients found. Please run the patient seeder first.');
            return;
        }
        
        $this->command->info("Found {$patients->count()} patients. Ensuring complete data...");
        
        $newbornCount = 0;
        $nutritionCount = 0;
        $outcomesCount = 0;
        $skippedNewborn = 0;
        $skippedNutrition = 0;
        $skippedOutcomes = 0;
        
        foreach ($patients as $patient) {
            // Add Newborn Immunization data if not exists
            if (!NewbornImmunization::where('patient_id', $patient->id)->exists()) {
                $this->createNewbornData($patient);
                $newbornCount++;
            } else {
                $skippedNewborn++;
            }
            
            // Add Nutrition 12 Months data if not exists
            if (!Nutrition12Months::where('patient_id', $patient->id)->exists()) {
                $this->createNutritionData($patient);
                $nutritionCount++;
            } else {
                $skippedNutrition++;
            }
            
            // Add Outcomes data if not exists
            if (!Outcome::where('patient_id', $patient->id)->exists()) {
                $this->createOutcomesData($patient);
                $outcomesCount++;
            } else {
                $skippedOutcomes++;
            }
        }
        
        $this->command->info("Complete Vaccine Tracker Data Seeding Finished!");
        $this->command->info("- Newborn Immunization records added: {$newbornCount} (skipped: {$skippedNewborn})");
        $this->command->info("- Nutrition 12 Months records added: {$nutritionCount} (skipped: {$skippedNutrition})");
        $this->command->info("- Outcomes records added: {$outcomesCount} (skipped: {$skippedOutcomes})");
        
        // Verify all patients now have complete data
        $this->verifyCompleteData();
    }
    
    private function verifyCompleteData()
    {
        $totalPatients = Patient::count();
        $patientsWithNewborn = NewbornImmunization::distinct('patient_id')->count();
        $patientsWithNutrition = Nutrition12Months::distinct('patient_id')->count();
        $patientsWithOutcomes = Outcome::distinct('patient_id')->count();
        
        $this->command->info("\n=== Data Verification ===");
        $this->command->info("Total patients: {$totalPatients}");
        $this->command->info("Patients with newborn data: {$patientsWithNewborn}");
        $this->command->info("Patients with nutrition data: {$patientsWithNutrition}");
        $this->command->info("Patients with outcomes data: {$patientsWithOutcomes}");
        
        if ($patientsWithNewborn === $totalPatients && 
            $patientsWithNutrition === $totalPatients && 
            $patientsWithOutcomes === $totalPatients) {
            $this->command->info("✅ All patients now have complete vaccine tracker data!");
        } else {
            $this->command->warn("⚠️  Some patients may still be missing data. Check the counts above.");
        }
    }
    
    private function createNewbornData($patient)
    {
        $birthDate = Carbon::parse($patient->birth_date);
        
        // Generate realistic newborn data
        $weightAtBirth = fake()->randomFloat(2, 2.0, 4.5); // 2.0 to 4.5 kg
        $lengthAtBirth = fake()->numberBetween(45, 55); // 45-55 cm
        
        // Determine birth weight status
        $birthWeightStatus = 'Normal';
        if ($weightAtBirth < 2.5) {
            $birthWeightStatus = 'Low';
        } elseif ($weightAtBirth > 4.0) {
            $birthWeightStatus = 'High';
        }
        
        // Generate immunization dates (within first 3 months)
        $breastFeedingDate = $birthDate->copy()->addDays(fake()->numberBetween(0, 2));
        $bcgDate = $birthDate->copy()->addDays(fake()->numberBetween(1, 7));
        $hepaBDate = $birthDate->copy()->addDays(fake()->numberBetween(1, 3));
        
        // Generate 3-month assessment data
        $ageInMonths = fake()->numberBetween(1, 3);
        $assessmentDate = $birthDate->copy()->addMonths($ageInMonths);
        $lengthInThrees = $lengthAtBirth + fake()->numberBetween(5, 15);
        $weightInThrees = $weightAtBirth + fake()->randomFloat(2, 0.5, 2.0);
        
        // Determine nutritional status
        $statusOptions = ['N', 'S', 'W-MAM', 'W-SAM', 'O'];
        $status = fake()->randomElement($statusOptions);
        
        // Generate immunization dates for 1-3 months
        $iron1mo = $birthDate->copy()->addMonth()->addDays(fake()->numberBetween(-5, 5));
        $iron2mo = $birthDate->copy()->addMonths(2)->addDays(fake()->numberBetween(-5, 5));
        $iron3mo = $birthDate->copy()->addMonths(3)->addDays(fake()->numberBetween(-5, 5));
        
        $dpt1st = $birthDate->copy()->addWeeks(6)->addDays(fake()->numberBetween(-3, 3));
        $dpt2nd = $birthDate->copy()->addWeeks(10)->addDays(fake()->numberBetween(-3, 3));
        $dpt3rd = $birthDate->copy()->addWeeks(14)->addDays(fake()->numberBetween(-3, 3));
        
        $opv1st = $birthDate->copy()->addWeeks(6)->addDays(fake()->numberBetween(-3, 3));
        $opv2nd = $birthDate->copy()->addWeeks(10)->addDays(fake()->numberBetween(-3, 3));
        $opv3rd = $birthDate->copy()->addWeeks(14)->addDays(fake()->numberBetween(-3, 3));
        
        $pcv1st = $birthDate->copy()->addWeeks(6)->addDays(fake()->numberBetween(-3, 3));
        $pcv2nd = $birthDate->copy()->addWeeks(10)->addDays(fake()->numberBetween(-3, 3));
        $pcv3rd = $birthDate->copy()->addWeeks(14)->addDays(fake()->numberBetween(-3, 3));
        
        $ipv1st = $birthDate->copy()->addWeeks(14)->addDays(fake()->numberBetween(-3, 3));
        
        NewbornImmunization::create([
            'patient_id' => $patient->id,
            'length_at_birth' => $lengthAtBirth,
            'weight_at_birth' => $weightAtBirth,
            'birth_weight_status' => $birthWeightStatus,
            'breast_feeding_date' => $breastFeedingDate,
            'bcg_date' => $bcgDate,
            'hepa_b_bd_date' => $hepaBDate,
            'age_in_months' => $ageInMonths,
            'length_in_threes_months' => "{$lengthInThrees} ({$assessmentDate->format('m/d/y')})",
            'weight_in_threes_months' => "{$weightInThrees} ({$assessmentDate->format('m/d/y')})",
            'status' => $status,
            'iron_1mo_date' => $iron1mo,
            'iron_2mo_date' => $iron2mo,
            'iron_3mo_date' => $iron3mo,
            'dpt_hib_hepb_1st' => $dpt1st,
            'dpt_hib_hepb_2nd' => $dpt2nd,
            'dpt_hib_hepb_3rd' => $dpt3rd,
            'opv_1st' => $opv1st,
            'opv_2nd' => $opv2nd,
            'opv_3rd' => $opv3rd,
            'pcv_1st' => $pcv1st,
            'pcv_2nd' => $pcv2nd,
            'pcv_3rd' => $pcv3rd,
            'ipv_1st' => $ipv1st,
        ]);
    }
    
    private function createNutritionData($patient)
    {
        $birthDate = Carbon::parse($patient->birth_date);
        
        // Generate 6-month assessment data
        $age6Months = 6;
        $assessment6Date = $birthDate->copy()->addMonths(6)->addDays(fake()->numberBetween(-15, 15));
        $length6 = fake()->numberBetween(60, 75);
        $weight6 = fake()->randomFloat(2, 6.0, 10.0);
        
        // Generate 12-month assessment data
        $age12Months = 12;
        $assessment12Date = $birthDate->copy()->addMonths(12)->addDays(fake()->numberBetween(-15, 15));
        $length12 = fake()->numberBetween(70, 85);
        $weight12 = fake()->randomFloat(2, 8.0, 12.0);
        
        // Determine nutritional status
        $statusOptions = ['N', 'S', 'W-MAM', 'W-SAM', 'O'];
        $status6 = fake()->randomElement($statusOptions);
        $status12 = fake()->randomElement($statusOptions);
        
        // Generate feeding data
        $exclusivelyBreastfed = fake()->randomElement(['Y', 'N']);
        $breastfeedingType = fake()->randomElement(['1', '2']);
        $complementaryFeeding = fake()->randomElement(['Y', 'N']);
        
        // Generate immunization and supplement dates
        $vitaminADate = $birthDate->copy()->addMonths(6)->addDays(fake()->numberBetween(-30, 30));
        $mnpDate = $birthDate->copy()->addMonths(6)->addDays(fake()->numberBetween(-30, 30));
        $mmr1st9mo = $birthDate->copy()->addMonths(9)->addDays(fake()->numberBetween(-15, 15));
        $ipv2nd9mo = $birthDate->copy()->addMonths(9)->addDays(fake()->numberBetween(-15, 15));
        $mmr2nd12mo = $birthDate->copy()->addMonths(12)->addDays(fake()->numberBetween(-15, 15));
        $ficDate = $birthDate->copy()->addMonths(12)->addDays(fake()->numberBetween(-30, 30));
        $cicDate = $birthDate->copy()->addMonths(12)->addDays(fake()->numberBetween(-30, 30));
        
        Nutrition12Months::create([
            'patient_id' => $patient->id,
            'age_in_months' => $age6Months,
            'length_cm_date' => "{$length6} ({$assessment6Date->format('m/d/y')})",
            'weight_kg_date' => "{$weight6} ({$assessment6Date->format('m/d/y')})",
            'status' => $status6,
            'exclusively_breastfed' => $exclusivelyBreastfed,
            'complementary_feeding' => $breastfeedingType, // This field seems to be for breastfeeding type
            'vitamin_a_date' => $vitaminADate,
            'mnp_date' => $mnpDate,
            'mmr_1st_9mo' => $mmr1st9mo,
            'ipv_2nd_9mo' => $ipv2nd9mo,
            'age_in_months_12' => $age12Months,
            'length_cm_date_12' => "{$length12} ({$assessment12Date->format('m/d/y')})",
            'weight_kg_date_12' => "{$weight12} ({$assessment12Date->format('m/d/y')})",
            'status_12' => $status12,
            'mmr_2nd_12mo' => $mmr2nd12mo,
            'fic_date' => $ficDate,
            'cic_date' => $cicDate,
        ]);
    }
    
    private function createOutcomesData($patient)
    {
        // Generate realistic outcomes data
        $outcomes = [
            'mam_admitted_sfp' => fake()->randomElement(['Yes', 'No']),
            'mam_cured' => fake()->randomElement(['Yes', 'No']),
            'mam_defaulted' => fake()->randomElement(['Yes', 'No']),
            'mam_died' => fake()->randomElement(['Yes', 'No']),
            'sam_admitted_otc' => fake()->randomElement(['Yes', 'No']),
            'sam_cured' => fake()->randomElement(['Yes', 'No']),
            'sam_defaulted' => fake()->randomElement(['Yes', 'No']),
            'sam_died' => fake()->randomElement(['Yes', 'No']),
            'remarks' => fake()->randomElement([
                'Recovered successfully',
                'Treatment completed',
                'Follow-up required',
                'Transferred to another facility',
                'No complications',
                'Regular monitoring needed',
                'Fully immunized',
                'Nutrition status improved',
                'Defaulted but returned',
                'Treatment ongoing',
                'Patient responding well to treatment',
                'Requires additional monitoring',
                'Completed vaccination schedule',
                'Nutrition counseling provided',
                'Family education completed'
            ])
        ];
        
        // Ensure logical consistency - if someone died, they can't be cured
        if ($outcomes['mam_died'] === 'Yes') {
            $outcomes['mam_cured'] = 'No';
            $outcomes['mam_defaulted'] = 'No';
        }
        if ($outcomes['sam_died'] === 'Yes') {
            $outcomes['sam_cured'] = 'No';
            $outcomes['sam_defaulted'] = 'No';
        }
        
        // If someone is cured, they're not defaulted
        if ($outcomes['mam_cured'] === 'Yes') {
            $outcomes['mam_defaulted'] = 'No';
        }
        if ($outcomes['sam_cured'] === 'Yes') {
            $outcomes['sam_defaulted'] = 'No';
        }
        
        Outcome::create([
            'patient_id' => $patient->id,
            ...$outcomes
        ]);
    }
}
