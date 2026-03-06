<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/csrf-cookie', function (Request $request) {
    // セッション開始＆CSRFトークン生成
    $request->session()->start();
    $request->session()->regenerateToken();

    $token = $request->session()->token();

    return response()->noContent()->cookie(
        'XSRF-TOKEN',
        $token,
        120,   // minutes
        '/',
        null,
        false, // secure（ローカルはfalse）
        false, // httpOnly（JS/クライアントが読む想定）
        false,
        'Lax'
    );
});

Route::prefix('api')->middleware(['web'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/logout',   [AuthController::class, 'logout']);

    Route::middleware('auth:web')->get('/me', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    });
});

// swagger-ui 表示用
Route::get('/docs/openapi.yaml', function () {
    $path = dirname(base_path()) . DIRECTORY_SEPARATOR . 'docs' . DIRECTORY_SEPARATOR . 'openapi.yaml';

    if (! file_exists($path)) {
        abort(404, 'OpenAPI file not found.');
    }

    return response()->file($path, [
        'Content-Type' => 'application/yaml',
    ]);
});
