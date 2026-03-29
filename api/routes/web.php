<?php

use App\Http\Controllers\Api\ItemImageController;
use App\Http\Controllers\Api\PurchaseCandidateController;
use App\Http\Controllers\Api\SettingsTpoController;
use App\Http\Controllers\Api\WearLogController;
use App\Http\Controllers\AuthController;
use App\Models\CategoryMaster;
use App\Models\Item;
use App\Models\Outfit;
use App\Services\Brands\UserBrandService;
use App\Services\Items\ItemStoreService;
use App\Services\Items\ItemUpdateService;
use App\Services\Settings\UserPreferenceService;
use App\Services\Settings\UserTpoService;
use App\Support\ItemLegwearSpecValidator;
use App\Support\ItemPayloadBuilder;
use App\Support\ItemsIndexQuery;
use App\Support\OutfitPayloadBuilder;
use App\Support\OutfitsIndexQuery;
use App\Support\SkinTonePresetSupport;
use App\Support\TpoSelectionResolver;
use App\Support\UserPreferencePayloadBuilder;
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

    Route::middleware('auth:web')->get('/settings/brands', function (Request $request) {
        $validated = $request->validate([
            'active_only' => ['nullable', 'boolean'],
            'keyword' => ['nullable', 'string', 'max:255'],
        ]);

        $brands = app(UserBrandService::class)->list($request->user(), $validated);

        return response()->json([
            'brands' => collect($brands)->map(fn ($brand) => [
                'id' => $brand->id,
                'name' => $brand->name,
                'kana' => $brand->kana,
                'is_active' => $brand->is_active,
                'updated_at' => optional($brand->updated_at)?->toISOString(),
            ])->all(),
        ]);
    });

    Route::middleware('auth:web')->post('/settings/brands', function (Request $request) {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'kana' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'ブランド名を入力してください。',
        ]);

        $brand = app(UserBrandService::class)->create($request->user(), $validated);

        return response()->json([
            'message' => 'created',
            'brand' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'kana' => $brand->kana,
                'is_active' => $brand->is_active,
                'updated_at' => optional($brand->updated_at)?->toISOString(),
            ],
        ], 201);
    });

    Route::middleware('auth:web')->patch('/settings/brands/{id}', function (Request $request, int $id) {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'kana' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'name.required' => 'ブランド名を入力してください。',
        ]);

        if ($validated === []) {
            return response()->json([
                'message' => '更新項目がありません。',
            ], 422);
        }

        $brand = app(UserBrandService::class)->update($request->user(), $id, $validated);

        return response()->json([
            'message' => 'updated',
            'brand' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'kana' => $brand->kana,
                'is_active' => $brand->is_active,
                'updated_at' => optional($brand->updated_at)?->toISOString(),
            ],
        ]);
    });

    Route::middleware('auth:web')->get('/settings/preferences', function (Request $request) {
        $preference = app(UserPreferenceService::class)->get($request->user());

        return response()->json([
            'preferences' => UserPreferencePayloadBuilder::build($preference),
        ]);
    });

    Route::middleware('auth:web')->put('/settings/preferences', function (Request $request) {
        $validated = $request->validate([
            'currentSeason' => ['nullable', 'string', 'in:spring,summer,autumn,winter'],
            'defaultWearLogStatus' => ['nullable', 'string', 'in:planned,worn'],
            'calendarWeekStart' => ['nullable', 'string', 'in:monday,sunday'],
            'skinTonePreset' => ['nullable', 'string', 'in:'.implode(',', SkinTonePresetSupport::values())],
        ]);

        $preference = app(UserPreferenceService::class)->update($request->user(), $validated);

        return response()->json([
            'message' => 'updated',
            'preferences' => UserPreferencePayloadBuilder::build($preference),
        ]);
    });

    Route::middleware('auth:web')->controller(SettingsTpoController::class)->group(function () {
        Route::get('/settings/tpos', 'index');
        Route::post('/settings/tpos', 'store');
        Route::patch('/settings/tpos/{id}', 'update');
    });

    // Items
    Route::middleware('auth:web')->get('/items', function (Request $request) {
        return response()->json(ItemsIndexQuery::build($request->user(), $request));
    });

    Route::middleware('auth:web')->post('/items', function (Request $request) {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'purchase_candidate_id' => ['nullable', 'integer'],
            'care_status' => ['nullable', 'string', 'in:in_cleaning'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'save_brand_as_candidate' => ['nullable', 'boolean'],
            'price' => ['nullable', 'integer', 'min:0'],
            'purchase_url' => ['nullable', 'url'],
            'memo' => ['nullable', 'string'],
            'purchased_at' => ['nullable', 'date'],
            'size_gender' => ['nullable', 'string', 'in:women,men,unisex'],
            'size_label' => ['nullable', 'string', 'max:50'],
            'size_note' => ['nullable', 'string'],
            'size_details' => ['nullable', 'array'],
            'size_details.note' => ['nullable', 'string'],
            'is_rain_ok' => ['nullable', 'boolean'],
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
            'tpo_ids' => ['nullable', 'array'],
            'tpo_ids.*' => ['integer'],
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
            'spec.bottoms' => ['nullable', 'array'],
            'spec.bottoms.length_type' => ['nullable', 'in:mini,knee,midi,ankle,full'],
            'spec.legwear' => ['nullable', 'array'],
            'spec.legwear.coverage_type' => ['nullable', 'in:ankle_socks,crew_socks,knee_socks,over_knee,stockings,tights,leggings_cropped,leggings_full'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*.disk' => ['nullable', 'string', 'max:100'],
            'images.*.path' => ['nullable', 'string'],
            'images.*.original_filename' => ['nullable', 'string', 'max:255'],
            'images.*.mime_type' => ['nullable', 'string', 'max:100'],
            'images.*.file_size' => ['nullable', 'integer', 'min:0'],
            'images.*.sort_order' => ['required', 'integer', 'min:1'],
            'images.*.is_primary' => ['nullable', 'boolean'],
        ]);

        ItemLegwearSpecValidator::validate($validated);

        $item = app(ItemStoreService::class)->store($request->user(), $validated);

        return response()->json([
            'message' => 'created',
            'item' => ItemPayloadBuilder::buildDetail($item),
        ], 201);
    });

    Route::middleware('auth:web')->get('/items/{id}', function (Request $request, int $id) {
        $item = Item::query()
            ->where('user_id', $request->user()->id)
            ->with(['images', 'user'])
            ->findOrFail($id);

        return response()->json([
            'item' => ItemPayloadBuilder::buildDetail($item),
        ]);
    });

    Route::middleware('auth:web')->put('/items/{id}', function (Request $request, int $id) {
        $item = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'care_status' => ['nullable', 'string', 'in:in_cleaning'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'save_brand_as_candidate' => ['nullable', 'boolean'],
            'price' => ['nullable', 'integer', 'min:0'],
            'purchase_url' => ['nullable', 'url'],
            'memo' => ['nullable', 'string'],
            'purchased_at' => ['nullable', 'date'],
            'size_gender' => ['nullable', 'string', 'in:women,men,unisex'],
            'size_label' => ['nullable', 'string', 'max:50'],
            'size_note' => ['nullable', 'string'],
            'size_details' => ['nullable', 'array'],
            'size_details.note' => ['nullable', 'string'],
            'is_rain_ok' => ['nullable', 'boolean'],
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
            'tpo_ids' => ['nullable', 'array'],
            'tpo_ids.*' => ['integer'],
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
            'spec.bottoms' => ['nullable', 'array'],
            'spec.bottoms.length_type' => ['nullable', 'in:mini,knee,midi,ankle,full'],
            'spec.legwear' => ['nullable', 'array'],
            'spec.legwear.coverage_type' => ['nullable', 'in:ankle_socks,crew_socks,knee_socks,over_knee,stockings,tights,leggings_cropped,leggings_full'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*.disk' => ['nullable', 'string', 'max:100'],
            'images.*.path' => ['nullable', 'string'],
            'images.*.original_filename' => ['nullable', 'string', 'max:255'],
            'images.*.mime_type' => ['nullable', 'string', 'max:100'],
            'images.*.file_size' => ['nullable', 'integer', 'min:0'],
            'images.*.sort_order' => ['required', 'integer', 'min:1'],
            'images.*.is_primary' => ['nullable', 'boolean'],
        ]);

        ItemLegwearSpecValidator::validate($validated);

        $item = app(ItemUpdateService::class)->update($request->user(), $item, $validated);

        return response()->json([
            'message' => 'updated',
            'item' => ItemPayloadBuilder::buildDetail($item),
        ]);
    });

    Route::middleware('auth:web')->post('/items/{id}/care-status', function (Request $request, int $id) {
        $item = Item::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'care_status' => ['nullable', 'string', 'in:in_cleaning'],
        ]);

        $item->update([
            'care_status' => $validated['care_status'] ?? null,
        ]);

        return response()->json([
            'message' => 'updated',
            'item' => ItemPayloadBuilder::buildDetail($item->fresh()->load(['images', 'user'])),
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

    Route::middleware('auth:web')->controller(ItemImageController::class)->group(function () {
        Route::post('/items/{id}/images', 'store');
        Route::delete('/items/{id}/images/{imageId}', 'destroy');
    });

    // Purchase Candidates
    Route::middleware('auth:web')->controller(PurchaseCandidateController::class)->group(function () {
        Route::get('/purchase-candidates', 'index');
        Route::post('/purchase-candidates', 'store');
        Route::get('/purchase-candidates/{id}', 'show');
        Route::put('/purchase-candidates/{id}', 'update');
        Route::delete('/purchase-candidates/{id}', 'destroy');
        Route::post('/purchase-candidates/{id}/duplicate', 'duplicate');
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
            'outfit' => OutfitPayloadBuilder::buildDetail(
                $outfit->fresh()->load(['outfitItems.item', 'user'])
            ),
        ]);
    });

    Route::middleware('auth:web')->post('/outfits/{id}/duplicate', function (Request $request, int $id) {
        $outfit = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->with(['outfitItems.item', 'user'])
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
            ? $outfit->name.'（コピー）'
            : '（コピー）';
        $outfitPayload = OutfitPayloadBuilder::buildDetail($outfit);

        return response()->json([
            'message' => 'duplicated_payload_ready',
            'outfit' => [
                'name' => $duplicatedName,
                'memo' => $outfit->memo,
                'seasons' => $outfit->seasons ?? [],
                'tpos' => $outfitPayload['tpos'],
                'tpo_ids' => $outfitPayload['tpo_ids'],
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
            'tpo_ids' => ['nullable', 'array'],
            'tpo_ids.*' => ['integer'],
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
                'tpo_ids' => TpoSelectionResolver::resolve(app(UserTpoService::class), $user, $validated),
            ]);

            $outfit->outfitItems()->createMany(
                collect($validated['items'])->map(function ($item) {
                    return [
                        'item_id' => $item['item_id'],
                        'sort_order' => $item['sort_order'],
                    ];
                })->all()
            );

            return $outfit->load(['outfitItems.item', 'user']);
        });

        return response()->json([
            'message' => 'created',
            'outfit' => OutfitPayloadBuilder::buildDetail($outfit),
        ], 201);
    });

    Route::middleware('auth:web')->get('/outfits/{id}', function (Request $request, int $id) {
        $outfit = Outfit::query()
            ->where('user_id', $request->user()->id)
            ->with(['outfitItems.item', 'user'])
            ->findOrFail($id);

        return response()->json([
            'outfit' => OutfitPayloadBuilder::buildDetail($outfit),
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
            'tpo_ids' => ['nullable', 'array'],
            'tpo_ids.*' => ['integer'],
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

        DB::transaction(function () use ($outfit, $validated, $user) {
            $outfit->update([
                'name' => $validated['name'] ?? null,
                'memo' => $validated['memo'] ?? null,
                'seasons' => $validated['seasons'] ?? [],
                'tpo_ids' => TpoSelectionResolver::resolve(
                    app(UserTpoService::class),
                    $user,
                    $validated,
                    $outfit->tpo_ids ?? [],
                ),
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
            'outfit' => OutfitPayloadBuilder::buildDetail($outfit->fresh()->load(['outfitItems.item', 'user'])),
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
    Route::middleware('auth:web')->get('/wear-logs/calendar', [WearLogController::class, 'calendar']);
    Route::middleware('auth:web')->get('/wear-logs/by-date', [WearLogController::class, 'byDate']);
    Route::middleware('auth:web')->get('/wear-logs/{id}', [WearLogController::class, 'show']);
    Route::middleware('auth:web')->put('/wear-logs/{id}', [WearLogController::class, 'update']);
    Route::middleware('auth:web')->delete('/wear-logs/{id}', [WearLogController::class, 'destroy']);

});

// swagger-ui 表示用
Route::get('/docs/openapi.yaml', function () {
    $path = dirname(base_path()).DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'api'.DIRECTORY_SEPARATOR.'openapi.yaml';

    if (! file_exists($path)) {
        abort(404, 'OpenAPI file not found.');
    }

    return response()->file($path, [
        'Content-Type' => 'application/yaml',
    ]);
});
