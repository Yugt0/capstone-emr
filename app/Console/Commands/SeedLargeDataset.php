<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\StandaloneLargeDatasetSeeder;

class SeedLargeDataset extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:large-dataset {--force : Force the operation without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed the database with 7000+ records for comprehensive testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Large Dataset Seeder');
        $this->info('This will create 7000+ records across multiple tables.');
        $this->newLine();
        
        $this->info('Records to be created:');
        $this->line('- 7000 Patient Information records with medical records');
        $this->line('- 7000 Contraceptive List records');
        $this->line('- 7000 Vaccine List records');
        $this->line('- 7000 Patient records with complete vaccine tracker data');
        $this->newLine();
        
        $this->warn('⚠️  This operation will create a large amount of data and may take several minutes.');
        $this->warn('⚠️  Ensure you have adequate disk space and database capacity.');
        $this->newLine();
        
        if (!$this->option('force')) {
            if (!$this->confirm('Do you want to continue?')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }
        
        $this->info('Starting large dataset seeding...');
        $this->newLine();
        
        try {
            $seeder = new StandaloneLargeDatasetSeeder();
            $seeder->setCommand($this);
            $seeder->run();
            
            $this->newLine();
            $this->info('✅ Large dataset seeding completed successfully!');
            $this->info('Total records created: 28,000+ across all tables');
            
        } catch (\Exception $e) {
            $this->error('❌ An error occurred during seeding:');
            $this->error($e->getMessage());
            return 1;
        }
        
        return 0;
    }
}



