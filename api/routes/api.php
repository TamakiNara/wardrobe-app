<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NoteController;

Route::apiResource('notes', NoteController::class);

Route::get('/test', function () {
    return response()->json(['message' => 'API OK']);
});
