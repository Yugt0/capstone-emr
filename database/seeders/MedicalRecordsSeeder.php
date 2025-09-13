<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PatientInformation;
use App\Models\PatientMedicalRecords;
use App\Models\NewbornImmunization;
use App\Models\Nutrition12Months;
use App\Models\Outcome;
use App\Models\Patient;

class MedicalRecordsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating medical records for different patients...');

        // Get all existing patients
        $patientInformations = PatientInformation::all();
        $patients = Patient::all();

        if ($patientInformations->isEmpty()) {
            $this->command->warn('No patient information found. Please run the main seeder first.');
            return;
        }

        // Create medical records for PatientInformation (adult patients)
        $this->createPatientMedicalRecords($patientInformations);

        // Create additional medical records for vaccine tracker patients
        if (!$patients->isEmpty()) {
            $this->createVaccineTrackerMedicalRecords($patients);
        }

        $this->command->info('Medical records created successfully!');
    }

    private function createPatientMedicalRecords($patientInformations)
    {
        $this->command->info('Creating medical records for adult patients...');

        foreach ($patientInformations as $patient) {
            // Create 1-3 medical records per patient
            $recordCount = rand(1, 3);
            
            for ($i = 0; $i < $recordCount; $i++) {
                PatientMedicalRecords::create([
                    'patient_id' => $patient->id,
                    'temperature' => $this->generateTemperature(),
                    'patient_history' => $this->generatePatientHistory(),
                    'age' => $this->calculateAge($patient->birth_date) . ' years',
                    'respiratory_rate' => $this->generateRespiratoryRate(),
                    'chief_complaint' => $this->generateChiefComplaint(),
                    'cardiac_rate' => $this->generateCardiacRate(),
                    'weight' => $this->generateWeight(),
                    'blood_pressure' => $this->generateBloodPressure(),
                    'history_of_present_illness' => $this->generateHistoryOfPresentIllness(),
                    'assessment' => $this->generateAssessment(),
                    'plan' => $this->generatePlan(),
                    'medicine_takes' => $this->generateMedicineTakes(),
                    'created_at' => $this->generateDateRecorded(),
                    'updated_at' => $this->generateDateRecorded(),
                ]);
            }
        }

        $this->command->info('Created medical records for ' . $patientInformations->count() . ' adult patients');
    }

    private function createVaccineTrackerMedicalRecords($patients)
    {
        $this->command->info('Creating additional medical records for existing patients...');

        // Get some existing patient information records to create additional medical records
        $existingPatients = PatientInformation::inRandomOrder()->take(50)->get();

        foreach ($existingPatients as $patient) {
            // Create 1-2 additional medical records per patient
            $recordCount = rand(1, 2);
            
            for ($i = 0; $i < $recordCount; $i++) {
                PatientMedicalRecords::create([
                    'patient_id' => $patient->id,
                    'temperature' => $this->generateTemperature(),
                    'patient_history' => $this->generatePediatricHistory(),
                    'age' => $this->calculateAge($patient->birth_date) . ' years',
                    'respiratory_rate' => $this->generatePediatricRespiratoryRate(),
                    'chief_complaint' => $this->generatePediatricChiefComplaint(),
                    'cardiac_rate' => $this->generatePediatricCardiacRate(),
                    'weight' => $this->generatePediatricWeight(),
                    'blood_pressure' => $this->generatePediatricBloodPressure(),
                    'history_of_present_illness' => $this->generatePediatricHistoryOfPresentIllness(),
                    'assessment' => $this->generatePediatricAssessment(),
                    'plan' => $this->generatePediatricPlan(),
                    'medicine_takes' => $this->generatePediatricMedicineTakes(),
                    'created_at' => $this->generateDateRecorded(),
                    'updated_at' => $this->generateDateRecorded(),
                ]);
            }
        }

        $this->command->info('Created additional medical records for ' . $existingPatients->count() . ' patients');
    }

    private function generateTemperature()
    {
        return number_format(rand(360, 395) / 10, 1) . '°C';
    }

    private function generatePatientHistory()
    {
        $histories = [
            'Previous history of hypertension, well-controlled with medication. No known allergies.',
            'Family history of diabetes. Previous appendectomy in 2010. No known allergies.',
            'Past history of anxiety disorder. Currently on medication. No known allergies.',
            'History of seasonal allergies. No chronic conditions. No known drug allergies.',
            'Previous episodes of similar symptoms. Family history of heart disease. Non-smoker.',
            'History of work-related stress. No significant medical history. No known allergies.',
            'Family history of cancer. Previous history of depression. Currently stable.',
            'History of iron deficiency anemia. Vegetarian diet. No known allergies.',
            'No significant medical history. No known allergies. No chronic conditions.',
            'Previous history of migraines. Family history of hypertension. No known allergies.'
        ];
        return $histories[array_rand($histories)];
    }

    private function generatePediatricHistory()
    {
        $histories = [
            'Born at 38 weeks gestation. No complications during delivery. No known allergies.',
            'Previous history of ear infections. Up to date on immunizations. No known allergies.',
            'Family history of asthma. No previous hospitalizations. No known allergies.',
            'History of food allergies (peanuts). Up to date on immunizations. No other allergies.',
            'Born premature at 34 weeks. No current complications. No known allergies.',
            'Previous history of febrile seizures. No current issues. No known allergies.',
            'No significant medical history. Up to date on immunizations. No known allergies.',
            'History of eczema. No other medical conditions. No known drug allergies.',
            'Previous history of RSV infection. No current respiratory issues. No known allergies.',
            'Family history of diabetes. No current symptoms. No known allergies.'
        ];
        return $histories[array_rand($histories)];
    }

    private function calculateAge($birthDate)
    {
        $birth = new \DateTime($birthDate);
        $today = new \DateTime();
        $age = $today->diff($birth)->y;
        return $age;
    }

    private function generateRespiratoryRate()
    {
        return rand(12, 25) . '/min';
    }

    private function generatePediatricRespiratoryRate()
    {
        return rand(20, 40) . '/min';
    }

    private function generateChiefComplaint()
    {
        $complaints = [
            'Fever and cough for 3 days',
            'Chest pain and shortness of breath',
            'Headache and dizziness',
            'Abdominal pain and nausea',
            'Joint pain and swelling',
            'Skin rash and itching',
            'Difficulty sleeping',
            'Loss of appetite and weight loss',
            'Back pain and stiffness',
            'Eye irritation and redness'
        ];
        return $complaints[array_rand($complaints)];
    }

    private function generatePediatricChiefComplaint()
    {
        $complaints = [
            'Fever and irritability for 2 days',
            'Cough and runny nose for 1 week',
            'Ear pain and pulling at ears',
            'Rash on trunk and extremities',
            'Vomiting and diarrhea for 1 day',
            'Difficulty breathing and wheezing',
            'Poor feeding and lethargy',
            'Abdominal pain and crying',
            'Sleep disturbances and night terrors',
            'Behavioral changes and aggression'
        ];
        return $complaints[array_rand($complaints)];
    }

    private function generateCardiacRate()
    {
        return rand(60, 120) . ' bpm';
    }

    private function generatePediatricCardiacRate()
    {
        return rand(80, 150) . ' bpm';
    }

    private function generateDateRecorded()
    {
        return now()->subDays(rand(0, 180))->format('Y-m-d');
    }

    private function generateWeight()
    {
        return number_format(rand(400, 1200) / 10, 1) . ' kg';
    }

    private function generatePediatricWeight()
    {
        return number_format(rand(50, 500) / 10, 1) . ' kg';
    }

    private function generateBloodPressure()
    {
        $systolic = rand(90, 180);
        $diastolic = rand(60, 110);
        return $systolic . '/' . $diastolic . ' mmHg';
    }

    private function generatePediatricBloodPressure()
    {
        $systolic = rand(70, 120);
        $diastolic = rand(40, 80);
        return $systolic . '/' . $diastolic . ' mmHg';
    }

    private function generateHistoryOfPresentIllness()
    {
        $histories = [
            'Patient reports symptoms started 3 days ago with mild fever and dry cough. No exposure to sick contacts.',
            'Chest pain began this morning, described as sharp and localized. No radiation to arms or jaw.',
            'Headache started yesterday, described as throbbing and bilateral. No visual changes or neck stiffness.',
            'Abdominal pain began 2 days ago, described as cramping and intermittent. No vomiting or diarrhea.',
            'Joint pain started 1 week ago, affecting multiple joints. No morning stiffness or swelling.',
            'Skin rash appeared 3 days ago, described as itchy and red. No known new exposures.',
            'Sleep difficulties for 2 weeks, trouble falling and staying asleep. No obvious triggers.',
            'Appetite loss and 5-pound weight loss over 2 weeks. No other symptoms.',
            'Back pain started 1 week ago after lifting heavy objects. No radiation to legs.',
            'Eye irritation began 2 days ago, described as burning and watery. No vision changes.'
        ];
        return $histories[array_rand($histories)];
    }

    private function generatePediatricHistoryOfPresentIllness()
    {
        $histories = [
            'Parent reports child has been irritable and febrile for 2 days. No other symptoms noted.',
            'Cough and runny nose started 1 week ago. Child is still active and playful.',
            'Child has been pulling at ears and crying. No fever or other symptoms.',
            'Rash appeared 2 days ago on trunk and extremities. No itching or discomfort.',
            'Vomiting and diarrhea started yesterday. Child is still drinking fluids.',
            'Child has been wheezing and having difficulty breathing. No fever.',
            'Poor feeding and lethargy for 1 day. Child is not as active as usual.',
            'Abdominal pain and crying episodes for 2 days. No vomiting or diarrhea.',
            'Sleep disturbances and night terrors for 1 week. No other symptoms.',
            'Behavioral changes and aggression for 3 days. No obvious triggers.'
        ];
        return $histories[array_rand($histories)];
    }

    private function generateAssessment()
    {
        $assessments = [
            'Acute upper respiratory infection',
            'Hypertension, controlled',
            'Type 2 diabetes mellitus',
            'Anxiety disorder, mild',
            'Gastroenteritis, viral',
            'Musculoskeletal strain',
            'Contact dermatitis',
            'Insomnia, stress-related',
            'Anemia, iron deficiency',
            'Conjunctivitis, bacterial'
        ];
        return $assessments[array_rand($assessments)];
    }

    private function generatePediatricAssessment()
    {
        $assessments = [
            'Viral upper respiratory infection',
            'Acute otitis media',
            'Atopic dermatitis flare',
            'Gastroenteritis, viral',
            'Asthma exacerbation',
            'Febrile seizure',
            'Dehydration, mild',
            'Sleep disorder, behavioral',
            'Anxiety, separation-related',
            'Allergic reaction, mild'
        ];
        return $assessments[array_rand($assessments)];
    }

    private function generatePlan()
    {
        $plans = [
            'Prescribe antibiotics and rest. Follow up in 1 week.',
            'Continue current medication. Monitor blood pressure weekly.',
            'Adjust insulin dosage. Schedule diabetes education session.',
            'Recommend counseling and stress management techniques.',
            'Prescribe anti-nausea medication. Maintain hydration.',
            'Physical therapy referral. Pain management with NSAIDs.',
            'Topical corticosteroid cream. Avoid known allergens.',
            'Sleep hygiene education. Consider melatonin supplement.',
            'Iron supplementation. Dietary counseling for iron-rich foods.',
            'Antibiotic eye drops. Warm compress application.'
        ];
        return $plans[array_rand($plans)];
    }

    private function generatePediatricPlan()
    {
        $plans = [
            'Supportive care with fluids and rest. Follow up if symptoms worsen.',
            'Antibiotic ear drops. Pain management with acetaminophen.',
            'Topical moisturizer and mild steroid cream. Avoid triggers.',
            'Oral rehydration solution. Clear liquid diet for 24 hours.',
            'Bronchodilator inhaler. Monitor breathing closely.',
            'Fever management with acetaminophen. Monitor for seizure recurrence.',
            'Increase fluid intake. Monitor urine output.',
            'Behavioral sleep training. Consistent bedtime routine.',
            'Play therapy referral. Parent education on anxiety management.',
            'Antihistamine medication. Avoid known allergens.'
        ];
        return $plans[array_rand($plans)];
    }

    private function generateMedicineTakes()
    {
        $medicines = [
            'Paracetamol 500mg 3x daily for 5 days',
            'Amoxicillin 250mg 3x daily for 7 days',
            'Ibuprofen 400mg 2x daily as needed for pain',
            'Lisinopril 10mg once daily for blood pressure',
            'Metformin 500mg 2x daily with meals',
            'Lorazepam 0.5mg at bedtime for anxiety',
            'Ondansetron 4mg 3x daily for nausea',
            'Naproxen 220mg 2x daily for inflammation',
            'Hydrocortisone cream 1% apply 2x daily',
            'Melatonin 3mg at bedtime for sleep',
            'Ferrous sulfate 325mg once daily',
            'Ciprofloxacin eye drops 1 drop 4x daily',
            'Ciprofloxacin ear drops 3 drops 2x daily',
            'Chloraseptic throat spray as needed',
            'Multivitamin once daily with breakfast',
            'Gabapentin 300mg 3x daily for neuropathy',
            'Donepezil 5mg once daily for memory',
            'Sertraline 50mg once daily for depression',
            'Probiotics 1 capsule daily with food',
            'Nitrofurantoin 100mg 2x daily for UTI',
            'Combined oral contraceptive pill daily',
            'Cetirizine 10mg once daily for allergies',
            'Omeprazole 20mg once daily for stomach',
            'Atorvastatin 20mg once daily for cholesterol',
            'Warfarin 2mg once daily - monitor INR',
            'Insulin glargine 20 units at bedtime',
            'Albuterol inhaler 2 puffs as needed',
            'Prednisone 20mg once daily for 5 days',
            'Tramadol 50mg 2x daily for pain',
            'Fluconazole 150mg single dose for yeast infection'
        ];
        return $medicines[array_rand($medicines)];
    }

    private function generatePediatricMedicineTakes()
    {
        $medicines = [
            'Acetaminophen 10-15mg/kg every 4-6 hours for fever',
            'Amoxicillin 20-40mg/kg/day divided 3x daily for 7 days',
            'Ibuprofen 5-10mg/kg every 6-8 hours for pain',
            'Pedialyte oral rehydration solution as needed',
            'Saline nasal drops 2-3 drops in each nostril as needed',
            'Hydrocortisone cream 1% apply 2x daily for rash',
            'Melatonin 0.5-1mg at bedtime for sleep',
            'Iron drops 1-2mg/kg/day for anemia',
            'Antibiotic eye drops 1 drop 4x daily for conjunctivitis',
            'Antibiotic ear drops 3 drops 2x daily for ear infection',
            'Throat lozenges (age-appropriate) as needed for sore throat',
            'Children\'s multivitamin once daily with breakfast',
            'Probiotics 1 capsule daily with food for digestive health',
            'Antihistamine syrup 2.5-5ml once daily for allergies',
            'Antacid suspension 5-10ml 4x daily for stomach upset',
            'Cough syrup (age-appropriate) 2.5-5ml every 4-6 hours',
            'Topical antibiotic ointment apply 2x daily for minor cuts',
            'Antifungal cream apply 2x daily for diaper rash',
            'Zinc supplement 5-10mg daily for immune support',
            'Vitamin D drops 400 IU daily for bone health'
        ];
        return $medicines[array_rand($medicines)];
    }
}
