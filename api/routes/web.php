<?php

use App\Models\Item;
use App\Models\Outfit;
use App\Models\OutfitItem;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

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

    Route::middleware('auth:web')->get('/items/{id}', function (Request $request, int $id) {
        $item = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'item' => $item,
        ]);
    });

    Route::middleware('auth:web')->delete('/items/{id}', function (Request $request, int $id) {
        $item = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $item->delete();

        return response()->json([
            'message' => 'deleted',
        ]);
    });

    Route::middleware('auth:web')->get('/outfits', function (Request $request) {
        $outfits = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->with(['outfitItems.item'])
            ->latest()
            ->get();

        return response()->json([
            'outfits' => $outfits,
        ]);
    });

    Route::middleware('auth:web')->post('/outfits', function (Request $request) {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'memo' => ['nullable', 'string'],
            'seasons' => ['nullable', 'array'],
            'seasons.*' => ['string', 'max:50'],
            'tpos' => ['nullable', 'array'],
            'tpos.*' => ['string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $user = $request->user();

        $itemIds = collect($validated['items'])
            ->pluck('item_id')
            ->unique()
            ->values();

        $ownedItemCount = \App\Models\Item::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $itemIds)
            ->count();

        // 他人のitem_idは使用不可
        if ($ownedItemCount !== $itemIds->count()) {
            return response()->json([
                'message' => '選択したアイテムに不正なデータが含まれています。',
            ], 422);
        }

        $outfit = DB::transaction(function () use ($validated, $user) {
            $outfit = Outfit::create([
                'user_id' => $user->id,
                'name' => $validated['name'] ?? null,
                'memo' => $validated['memo'] ?? null,
                'seasons' => $validated['seasons'] ?? [],
                'tpos' => $validated['tpos'] ?? [],
            ]);

            $outfit->outfitItems()->createMany(
                collect($validated['items'])->map(function ($item) {
                    return [
                        'item_id' => $item['item_id'],
                        'sort_order' => $item['sort_order'],
                    ];
                })->all()
            );

            return $outfit->load(['outfitItems.item']);
        });

        return response()->json([
            'message' => 'created',
            'outfit' => $outfit,
        ], 201);
    });

    Route::middleware('auth:web')->get('/outfits/{id}', function (Request $request, int $id) {
        $outfit = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->with(['outfitItems.item'])
            ->findOrFail($id);

        return response()->json([
            'outfit' => $outfit,
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
