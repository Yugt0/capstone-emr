# Large Dataset Seeder

This directory contains seeders for creating large datasets (7000+ records) for comprehensive testing of the EMR system.

## Available Seeders

### 1. LargeDatasetSeeder
- **Purpose**: Creates 7000+ records for all major entities
- **Usage**: Automatically runs with `php artisan db:seed`
- **Records Created**:
  - 7000 Patient Information records with medical records
  - 7000 Contraceptive List records
  - 7000 Vaccine List records
  - 7000 Patient records with complete vaccine tracker data

### 2. StandaloneLargeDatasetSeeder
- **Purpose**: Standalone seeder that can be run independently
- **Usage**: `php artisan db:seed --class=StandaloneLargeDatasetSeeder`
- **Records Created**: Same as LargeDatasetSeeder but can be run independently

## How to Use

### Run All Seeders (Including Large Dataset)
```bash
php artisan db:seed
```

### Run Only the Large Dataset Seeder
```bash
php artisan db:seed --class=StandaloneLargeDatasetSeeder
```

### Run Specific Seeders
```bash
# Run only the comprehensive data seeder (50 records each)
php artisan db:seed --class=ComprehensiveDataSeeder

# Run only the medical records seeder
php artisan db:seed --class=MedicalRecordsSeeder

# Run only the vaccine tracker seeder
php artisan db:seed --class=VaccineTrackerDataSeeder
```

## Data Structure

### Patient Information with Medical Records
- **Patient Information**: 7000 records
- **Medical Records**: 1-3 records per patient (7,000-21,000 total)
- **Fields**: Personal info, contact details, medical history

### Contraceptive List
- **Records**: 7000
- **Fields**: Contraceptive name, type, batch number, quantity, expiration date

### Vaccine List
- **Records**: 7000
- **Fields**: Product name, delivery info, consumption, stock transfers, expiration

### Patient Vaccine Tracker
- **Patient Records**: 7000
- **Newborn Immunization**: 7000 (1 per patient)
- **Nutrition 12 Months**: 7000 (1 per patient)
- **Outcomes**: 7000 (1 per patient)

## Performance Notes

- **Batch Processing**: Records are created in batches of 500 to avoid memory issues
- **Memory Usage**: Optimized for large datasets
- **Execution Time**: May take several minutes to complete
- **Database Size**: Will significantly increase database size

## Data Relationships

All records maintain proper relationships:
- Patient Information ↔ Medical Records (1:many)
- Patient ↔ Newborn Immunization (1:1)
- Patient ↔ Nutrition 12 Months (1:1)
- Patient ↔ Outcomes (1:1)

## Troubleshooting

### Memory Issues
If you encounter memory issues, you can:
1. Increase PHP memory limit in `php.ini`
2. Reduce batch size in the seeder
3. Run seeders individually

### Database Timeout
If database operations timeout:
1. Increase database timeout settings
2. Run seeders in smaller batches
3. Check database connection settings

### Storage Space
Large datasets require significant storage:
- Ensure adequate disk space
- Consider running on a development environment first
- Monitor database size growth



