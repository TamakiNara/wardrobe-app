<?php

use App\Http\Controllers\Api\ItemStatusController;
use App\Http\Controllers\CategoriesController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoriesController::class, 'index']);

Route::middleware(['web', 'auth:web'])->group(function () {
    Route::post('/items/{id}/dispose', [ItemStatusController::class, 'dispose']);
    Route::post('/items/{id}/reactivate', [ItemStatusController::class, 'reactivate']);
});
