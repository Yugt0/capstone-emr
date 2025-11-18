<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Minimal named login route required by authentication middleware when redirecting
// For API clients we use JSON responses; this route exists to prevent errors
Route::get('/login', function () {
    return response()->json(['message' => 'Login route placeholder'], 200);
})->name('login');
