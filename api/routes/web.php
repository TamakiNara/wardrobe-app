<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\PurchaseCandidateController;
use App\Http\Controllers\Api\WearLogController;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\Outfit;
use App\Support\ItemsIndexQuery;
use App\Support\OutfitsIndexQuery;
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
    // Auth
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:web')->group(function () {
        Route::get('/me', function (Request $request) {
            $user = $request->user();
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
        });

        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Settings
    Route::middleware('auth:web')->get('/settings/categories', function (Request $request) {
        $user = $request->user();

        $visibleCategoryIds = $user->visible_category_ids;

        if ($visibleCategoryIds === null) {
            $visibleCategoryIds = CategoryMaster::query()
                ->where('is_active', true)
                ->orderBy('group_id')
                ->orderBy('sort_order')
                ->pluck('id')
                ->all();
        }

        return response()->json([
            'visibleCategoryIds' => $visibleCategoryIds,
        ]);
    });

    Route::middleware('auth:web')->put('/settings/categories', function (Request $request) {
        $validated = $request->validate([
            'visibleCategoryIds' => ['present', 'array'],
            'visibleCategoryIds.*' => ['string', 'distinct', 'exists:category_master,id'],
        ]);

        $visibleCategoryIds = collect($validated['visibleCategoryIds'])
            ->values();

        $activeCount = CategoryMaster::query()
            ->where('is_active', true)
            ->whereIn('id', $visibleCategoryIds)
            ->count();

        if ($activeCount !== $visibleCategoryIds->count()) {
            return response()->json([
                'message' => '無効なカテゴリが含まれています。',
            ], 422);
        }

        $user = $request->user();
        $user->forceFill([
            'visible_category_ids' => $visibleCategoryIds->all(),
        ])->save();

        return response()->json([
            'message' => 'updated',
            'visibleCategoryIds' => $user->visible_category_ids ?? [],
        ]);
    });

    // Items
    Route::middleware('auth:web')->get('/items', function (Request $request) {
        return response()->json(ItemsIndexQuery::build($request->user(), $request));
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
            'spec' => ['nullable', 'array'],
            'spec.tops' => ['nullable', 'array'],
            'spec.tops.shape' => ['nullable', 'string', 'max:100'],
            'spec.tops.sleeve' => ['nullable', 'string', 'max:100'],
            'spec.tops.length' => ['nullable', 'string', 'max:100'],
            'spec.tops.neck' => ['nullable', 'string', 'max:100'],
            'spec.tops.design' => ['nullable', 'string', 'max:100'],
            'spec.tops.fit' => ['nullable', 'string', 'max:100'],
        ]);

        $item = Item::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'] ?? null,
            'category' => $validated['category'],
            'shape' => $validated['shape'],
            'colors' => $validated['colors'],
            'seasons' => $validated['seasons'] ?? [],
            'tpos' => $validated['tpos'] ?? [],
            'spec' => $validated['spec'] ?? null,
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

    Route::middleware('auth:web')->put('/items/{id}', function (Request $request, int $id) {
        $item = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

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
            'spec' => ['nullable', 'array'],
            'spec.tops' => ['nullable', 'array'],
            'spec.tops.shape' => ['nullable', 'string', 'max:100'],
            'spec.tops.sleeve' => ['nullable', 'string', 'max:100'],
            'spec.tops.length' => ['nullable', 'string', 'max:100'],
            'spec.tops.neck' => ['nullable', 'string', 'max:100'],
            'spec.tops.design' => ['nullable', 'string', 'max:100'],
            'spec.tops.fit' => ['nullable', 'string', 'max:100'],
        ]);

        $item->update([
            'name' => $validated['name'] ?? null,
            'category' => $validated['category'],
            'shape' => $validated['shape'],
            'colors' => $validated['colors'],
            'seasons' => $validated['seasons'] ?? [],
            'tpos' => $validated['tpos'] ?? [],
            'spec' => $validated['spec'] ?? null,
        ]);

        return response()->json([
            'message' => 'updated',
            'item' => $item->fresh(),
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

    // Purchase Candidates
    Route::middleware('auth:web')->controller(PurchaseCandidateController::class)->group(function () {
        Route::get('/purchase-candidates', 'index');
        Route::post('/purchase-candidates', 'store');
        Route::get('/purchase-candidates/{id}', 'show');
        Route::put('/purchase-candidates/{id}', 'update');
        Route::delete('/purchase-candidates/{id}', 'destroy');
        Route::post('/purchase-candidates/{id}/images', 'uploadImage');
        Route::delete('/purchase-candidates/{id}/images/{imageId}', 'deleteImage');
        Route::post('/purchase-candidates/{id}/item-draft', 'itemDraft');
    });

    // Outfits
    Route::middleware('auth:web')->get('/outfits', function (Request $request) {
        return response()->json(OutfitsIndexQuery::build($request->user(), $request));
    });

    Route::middleware('auth:web')->get('/outfits/invalid', function (Request $request) {
        return response()->json(OutfitsIndexQuery::build($request->user(), $request, 'invalid'));
    });

    Route::middleware('auth:web')->post('/outfits/{id}/restore', function (Request $request, int $id) {
        $outfit = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->with(['outfitItems.item'])
            ->findOrFail($id);

        if ($outfit->status !== 'invalid') {
            return response()->json([
                'message' => 'このコーディネートは復帰できません。',
            ], 422);
        }

        $hasInactiveItems = $outfit->outfitItems->contains(function ($outfitItem) {
            return $outfitItem->item === null || $outfitItem->item->status !== 'active';
        });

        if ($hasInactiveItems) {
            return response()->json([
                'message' => 'このコーディネートは復帰できません。',
            ], 422);
        }

        $outfit->update([
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'restored',
            'outfit' => $outfit->fresh()->load(['outfitItems.item']),
        ]);
    });

    Route::middleware('auth:web')->post('/outfits/{id}/duplicate', function (Request $request, int $id) {
        $outfit = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->with(['outfitItems.item'])
            ->findOrFail($id);

        $payloadItems = $outfit->outfitItems
            ->sortBy('sort_order')
            ->values()
            ->map(function ($outfitItem) use ($outfit) {
                $isDisposed = $outfit->status === 'invalid'
                    && ($outfitItem->item === null || $outfitItem->item->status !== 'active');

                return [
                    'item_id' => $outfitItem->item_id,
                    'sort_order' => $outfitItem->sort_order,
                    'selectable' => ! $isDisposed,
                    'note' => $isDisposed ? '手放したアイテムのため初期選択から除外' : null,
                ];
            })
            ->all();

        $duplicatedName = $outfit->name !== null
            ? $outfit->name . '（コピー）'
            : '（コピー）';

        return response()->json([
            'message' => 'duplicated_payload_ready',
            'outfit' => [
                'name' => $duplicatedName,
                'memo' => $outfit->memo,
                'seasons' => $outfit->seasons ?? [],
                'tpos' => $outfit->tpos ?? [],
                'items' => $payloadItems,
            ],
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
            'items.*.sort_order' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();

        $itemIds = collect($validated['items'])
            ->pluck('item_id')
            ->unique()
            ->values();

        $availableItemCount = Item::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->whereIn('id', $itemIds)
            ->count();

        // 他人のitem_idや disposed item は使用不可
        if ($availableItemCount !== $itemIds->count()) {
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

    Route::middleware('auth:web')->put('/outfits/{id}', function (Request $request, int $id) {
        $outfit = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'memo' => ['nullable', 'string'],
            'seasons' => ['nullable', 'array'],
            'seasons.*' => ['string', 'max:50'],
            'tpos' => ['nullable', 'array'],
            'tpos.*' => ['string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer'],
            'items.*.sort_order' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();

        $itemIds = collect($validated['items'])
            ->pluck('item_id')
            ->unique()
            ->values();

        $availableItemCount = Item::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->whereIn('id', $itemIds)
            ->count();

        if ($availableItemCount !== $itemIds->count()) {
            return response()->json([
                'message' => '選択したアイテムに不正なデータが含まれています。',
            ], 422);
        }

        DB::transaction(function () use ($outfit, $validated) {
            $outfit->update([
                'name' => $validated['name'] ?? null,
                'memo' => $validated['memo'] ?? null,
                'seasons' => $validated['seasons'] ?? [],
                'tpos' => $validated['tpos'] ?? [],
            ]);

            $outfit->outfitItems()->delete();

            $outfit->outfitItems()->createMany(
                collect($validated['items'])->map(function ($item) {
                    return [
                        'item_id' => $item['item_id'],
                        'sort_order' => $item['sort_order'],
                    ];
                })->all()
            );
        });

        return response()->json([
            'message' => 'updated',
            'outfit' => $outfit->fresh()->load(['outfitItems.item']),
        ]);
    });

    Route::middleware('auth:web')->delete('/outfits/{id}', function (Request $request, int $id) {
        $outfit = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $outfit->delete();

        return response()->json([
            'message' => 'deleted',
        ]);
    });

    // Wear Logs
    Route::middleware('auth:web')->get('/wear-logs', [WearLogController::class, 'index']);
    Route::middleware('auth:web')->post('/wear-logs', [WearLogController::class, 'store']);
    Route::middleware('auth:web')->get('/wear-logs/{id}', [WearLogController::class, 'show']);
    Route::middleware('auth:web')->put('/wear-logs/{id}', [WearLogController::class, 'update']);
    Route::middleware('auth:web')->delete('/wear-logs/{id}', [WearLogController::class, 'destroy']);

});

// swagger-ui 表示用
Route::get('/docs/openapi.yaml', function () {
    $path = dirname(base_path()) . DIRECTORY_SEPARATOR . 'docs' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'openapi.yaml';

    if (! file_exists($path)) {
        abort(404, 'OpenAPI file not found.');
    }

    return response()->file($path, [
        'Content-Type' => 'application/yaml',
    ]);
});
