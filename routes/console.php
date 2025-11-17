<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule backup time check to run every minute
// This ensures backups trigger exactly at the specified time
Schedule::command('backup:check-time')
    ->everyMinute()
    ->timezone('Asia/Manila')
    ->description('Check if it\'s time for automatic backup');

// Schedule daily database backup at 11:50 PM Philippine Time
Schedule::command('backup:daily-database')
    ->dailyAt('23:50')
    ->timezone('Asia/Manila')
    ->description('Daily automatic database backup at 11:50 PM');
