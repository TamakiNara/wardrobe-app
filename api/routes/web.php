<?php

use App\Models\Item;
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

    Route::middleware('auth:web')->get('/items', function (Request $request) {
        $items = Item::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'items' => $items,
        ]);
    });

    Route::middleware('auth:web')->post('/items', function (Request $request) {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'shape' => ['required', 'string', 'max:100'],
            'colors' => ['required', 'array', 'min:1'],
            'colors.*.role' => ['required', 'string', 'in:main,sub'],
            'colors.*.mode' => ['required', 'string', 'in:preset,custom'],
            'colors.*.value' => ['required', 'string', 'max:100'],
            'colors.*.hex' => ['required', 'string', 'max:20'],
            'colors.*.label' => ['required', 'string', 'max:100'],
            'seasons' => ['nullable', 'array'],
            'seasons.*' => ['string', 'max:50'],
            'tpos' => ['nullable', 'array'],
            'tpos.*' => ['string', 'max:50'],
        ]);

        $item = Item::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'] ?? null,
            'category' => $validated['category'],
            'shape' => $validated['shape'],
            'colors' => $validated['colors'],
            'seasons' => $validated['seasons'] ?? [],
            'tpos' => $validated['tpos'] ?? [],
        ]);

        return response()->json([
            'message' => 'created',
            'item' => $item,
        ], 201);
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
