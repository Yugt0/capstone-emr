<?php

namespace Database\Factories;

use App\Models\PatientMedicalRecords;
use App\Models\PatientInformation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PatientMedicalRecords>
 */
class PatientMedicalRecordsFactory extends Factory
{
    protected $model = PatientMedicalRecords::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $chiefComplaints = [
            'Fever and cough for 3 days',
            'Chest pain and shortness of breath',
            'Headache and dizziness',
            'Abdominal pain and nausea',
            'Joint pain and swelling',
            'Skin rash and itching',
            'Difficulty sleeping',
            'Loss of appetite and weight loss',
            'Back pain and stiffness',
            'Eye irritation and redness',
            'Ear pain and hearing difficulty',
            'Sore throat and difficulty swallowing',
            'Fatigue and weakness',
            'Numbness in hands and feet',
            'Memory problems and confusion',
            'Mood changes and anxiety',
            'Digestive issues and bloating',
            'Urinary problems',
            'Menstrual irregularities',
            'Allergic reactions'
        ];

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
            'Conjunctivitis, bacterial',
            'Otitis media, acute',
            'Pharyngitis, viral',
            'Chronic fatigue syndrome',
            'Peripheral neuropathy',
            'Mild cognitive impairment',
            'Depression, moderate',
            'Irritable bowel syndrome',
            'Urinary tract infection',
            'Dysmenorrhea, primary',
            'Allergic rhinitis'
        ];

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
            'Antibiotic eye drops. Warm compress application.',
            'Antibiotic ear drops. Pain management with acetaminophen.',
            'Throat lozenges. Warm salt water gargles.',
            'Comprehensive blood work. Referral to specialist.',
            'Neurological evaluation. Pain management strategies.',
            'Cognitive assessment. Memory exercises and brain training.',
            'Antidepressant medication. Regular therapy sessions.',
            'Dietary modifications. Stress reduction techniques.',
            'Antibiotic treatment. Increased fluid intake.',
            'Hormonal therapy consideration. Pain management options.',
            'Antihistamine medication. Environmental control measures.'
        ];

        $medicineTakes = [
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

        $patientHistory = [
            'Previous history of hypertension, well-controlled with medication.',
            'Family history of diabetes. No known allergies.',
            'Past history of anxiety. Currently on medication.',
            'History of seasonal allergies. No chronic conditions.',
            'Previous episodes of similar symptoms. No known allergies.',
            'History of work-related stress. No significant medical history.',
            'Family history of heart disease. Non-smoker.',
            'Previous history of depression. Currently in therapy.',
            'History of iron deficiency anemia. Vegetarian diet.',
            'No significant medical history. No known allergies.',
            'Previous ear infections in childhood. No current issues.',
            'History of frequent sore throats. No known allergies.',
            'Chronic fatigue for 6 months. No other symptoms.',
            'History of diabetes. Well-controlled with medication.',
            'Age-related memory concerns. No other cognitive issues.',
            'Previous history of depression. Currently stable.',
            'History of digestive issues. No known food allergies.',
            'Previous UTI episodes. No structural abnormalities.',
            'Regular menstrual cycles. No significant changes.',
            'History of environmental allergies. No food allergies.'
        ];

        $historyOfPresentIllness = [
            'Patient reports symptoms started 3 days ago with mild fever and dry cough. No exposure to sick contacts.',
            'Chest pain began this morning, described as sharp and localized. No radiation to arms or jaw.',
            'Headache started yesterday, described as throbbing and bilateral. No visual changes or neck stiffness.',
            'Abdominal pain began 2 days ago, described as cramping and intermittent. No vomiting or diarrhea.',
            'Joint pain started 1 week ago, affecting multiple joints. No morning stiffness or swelling.',
            'Skin rash appeared 3 days ago, described as itchy and red. No known new exposures.',
            'Sleep difficulties for 2 weeks, trouble falling and staying asleep. No obvious triggers.',
            'Appetite loss and 5-pound weight loss over 2 weeks. No other symptoms.',
            'Back pain started 1 week ago after lifting heavy objects. No radiation to legs.',
            'Eye irritation began 2 days ago, described as burning and watery. No vision changes.',
            'Ear pain started yesterday, described as sharp and constant. No hearing loss.',
            'Sore throat began 2 days ago, described as painful when swallowing. No fever.',
            'Fatigue for 1 month, described as overwhelming and persistent. No improvement with rest.',
            'Numbness in hands and feet for 2 weeks, described as tingling and intermittent.',
            'Memory problems for 3 months, described as forgetfulness and confusion. No other symptoms.',
            'Mood changes for 1 month, described as sadness and hopelessness. No suicidal thoughts.',
            'Digestive issues for 2 weeks, described as bloating and cramping. No blood in stool.',
            'Urinary symptoms for 3 days, described as burning and frequency. No blood in urine.',
            'Menstrual irregularities for 2 months, described as heavy and irregular bleeding.',
            'Allergic symptoms for 1 week, described as sneezing and nasal congestion. No fever.'
        ];

        $chiefComplaint = $this->faker->randomElement($chiefComplaints);
        $assessment = $this->faker->randomElement($assessments);
        $plan = $this->faker->randomElement($plans);
        $medicineTakes = $this->faker->randomElement($medicineTakes);
        $patientHistoryText = $this->faker->randomElement($patientHistory);
        $historyOfPresentIllnessText = $this->faker->randomElement($historyOfPresentIllness);

        // Generate realistic vital signs
        $temperature = $this->faker->randomFloat(1, 36.0, 39.5) . '°C';
        $respiratoryRate = $this->faker->numberBetween(12, 25) . '/min';
        $cardiacRate = $this->faker->numberBetween(60, 120) . ' bpm';
        $weight = $this->faker->randomFloat(1, 40.0, 120.0) . ' kg';
        
        // Generate realistic blood pressure
        $systolic = $this->faker->numberBetween(90, 180);
        $diastolic = $this->faker->numberBetween(60, 110);
        $bloodPressure = $systolic . '/' . $diastolic . ' mmHg';

        // Generate age based on patient
        $age = $this->faker->numberBetween(18, 80) . ' years';

        return [
            'patient_id' => PatientInformation::factory(),
            'temperature' => $temperature,
            'patient_history' => $patientHistoryText,
            'age' => $age,
            'respiratory_rate' => $respiratoryRate,
            'chief_complaint' => $chiefComplaint,
            'cardiac_rate' => $cardiacRate,
            'weight' => $weight,
            'blood_pressure' => $bloodPressure,
            'history_of_present_illness' => $historyOfPresentIllnessText,
            'assessment' => $assessment,
            'plan' => $plan,
            'medicine_takes' => $medicineTakes,
        ];
    }
}

