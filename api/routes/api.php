<?php

use App\Http\Controllers\CategoriesController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json(['message' => 'API OK']);
});

Route::get('/categories', [CategoriesController::class, 'index']);