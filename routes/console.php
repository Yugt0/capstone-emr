<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule daily database backup at 7:00 AM Philippine Time
Schedule::command('backup:daily-database')
    ->dailyAt('07:00')
    ->timezone('Asia/Manila')
    ->description('Daily automatic database backup');
