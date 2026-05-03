<?php

namespace App\Services\ImportExport;

use App\Models\Item;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateGroup;
use App\Models\User;
use App\Models\UserBrand;
use App\Models\UserPreference;
use App\Models\UserTpo;
use App\Models\UserWeatherLocation;
use App\Models\WearLog;
use App\Models\WeatherRecord;
use App\Services\Items\ItemStoreService;
use App\Services\PurchaseCandidates\PurchaseCandidateService;
use App\Services\Settings\UserTpoService;
use App\Support\BrandNormalizer;
use App\Support\ImportExportImageSupport;
use App\Support\ImportExportValidationSupport;
use App\Support\ItemSubcategorySupport;
use App\Support\SkinTonePresetSupport;
use App\Support\TpoSelectionResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ImportService
{
    public function __construct(
        private readonly ItemStoreService $itemStoreService,
        private readonly PurchaseCandidateService $purchaseCandidateService,
        private readonly UserTpoService $userTpoService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   user_tpos: array{total: int},
     *   items: array{total: int, visible: int},
     *   purchase_candidates: array{total: int},
     *   outfits: array{total: int, visible: int},
     *   wear_logs: array{total: int},
     *   weather_locations: array{total: int},
     *   weather_records: array{total: int}
     * }
     */
    public function import(User $user, array $payload): array
    {
        $validatedUserTpos = $this->validateCollectionPayloads(
            $payload['user_tpos'] ?? [],
            'user_tpos',
            'TPO',
            fn ($tpo) => ImportExportValidationSupport::validateUserTpoPayload((array) $tpo),
        );
        $hasUserBrandsPayload = array_key_exists('user_brands', $payload);
        $validatedUserBrands = $hasUserBrandsPayload
            ? $this->validateCollectionPayloads(
                $payload['user_brands'] ?? [],
                'user_brands',
                'ブランド候補',
                fn ($brand) => ImportExportValidationSupport::validateUserBrandPayload((array) $brand),
            )
            : [];
        $hasVisibleCategoryIdsPayload = array_key_exists('visible_category_ids', $payload);
        $validatedVisibleCategoryIds = ImportExportValidationSupport::validateVisibleCategoryIdsPayload(
            $hasVisibleCategoryIdsPayload ? ($payload['visible_category_ids'] ?? []) : null,
        );
        $hasUserPreferencesPayload = array_key_exists('user_preferences', $payload);
        $validatedUserPreferences = ImportExportValidationSupport::validateUserPreferencePayload(
            $hasUserPreferencesPayload && is_array($payload['user_preferences'] ?? null)
                ? $payload['user_preferences']
                : null,
        );
        $validatedItems = $this->validateCollectionPayloads(
            $payload['items'] ?? [],
            'items',
            'アイテム',
            fn ($item) => ImportExportValidationSupport::validateItemPayload((array) $item),
        );
        $validatedCandidates = $this->validateCollectionPayloads(
            $payload['purchase_candidates'] ?? [],
            'purchase_candidates',
            '購入検討',
            fn ($candidate) => ImportExportValidationSupport::validatePurchaseCandidatePayload((array) $candidate),
        );
        $validatedOutfits = $this->validateCollectionPayloads(
            $payload['outfits'] ?? [],
            'outfits',
            'コーディネート',
            fn ($outfit) => ImportExportValidationSupport::validateOutfitPayload((array) $outfit),
        );
        $validatedWearLogs = $this->validateCollectionPayloads(
            $payload['wear_logs'] ?? [],
            'wear_logs',
            '着用履歴',
            fn ($wearLog) => ImportExportValidationSupport::validateWearLogPayload((array) $wearLog),
        );
        $validatedWeatherLocations = $this->validateCollectionPayloads(
            $payload['weather_locations'] ?? [],
            'weather_locations',
            '天気地域',
            fn ($location) => ImportExportValidationSupport::validateWeatherLocationPayload((array) $location),
        );
        $validatedWeatherRecords = $this->validateCollectionPayloads(
            $payload['weather_records'] ?? [],
            'weather_records',
            '天気記録',
            fn ($record) => ImportExportValidationSupport::validateWeatherRecordPayload((array) $record),
        );

        $existingItemFiles = ImportExportImageSupport::collectStoredFiles(
            Item::query()->where('user_id', $user->id)->with('images')->get()->pluck('images')->flatten()
        );
        $existingCandidateFiles = ImportExportImageSupport::collectStoredFiles(
            PurchaseCandidate::query()->where('user_id', $user->id)->with('images')->get()->pluck('images')->flatten()
        );

        $createdFiles = [];

        try {
            $counts = DB::transaction(function () use (
                $user,
                $validatedItems,
                $validatedCandidates,
                $validatedOutfits,
                $validatedWearLogs,
                $validatedUserTpos,
                $validatedUserBrands,
                $validatedVisibleCategoryIds,
                $validatedUserPreferences,
                $hasUserBrandsPayload,
                $hasVisibleCategoryIdsPayload,
                $hasUserPreferencesPayload,
                $validatedWeatherLocations,
                $validatedWeatherRecords,
                &$createdFiles,
            ) {
                WeatherRecord::query()->where('user_id', $user->id)->delete();
                UserWeatherLocation::query()->where('user_id', $user->id)->delete();
                WearLog::query()->where('user_id', $user->id)->delete();
                Outfit::query()->where('user_id', $user->id)->delete();
                PurchaseCandidate::query()->where('user_id', $user->id)->delete();
                PurchaseCandidateGroup::query()->where('user_id', $user->id)->delete();
                Item::query()->where('user_id', $user->id)->delete();
                UserBrand::query()->where('user_id', $user->id)->delete();
                UserTpo::query()->where('user_id', $user->id)->delete();

                if ($hasUserPreferencesPayload) {
                    UserPreference::query()->where('user_id', $user->id)->delete();
                }

                $legacyTpoIdMap = $this->restoreUserTpos(
                    $user,
                    $validatedUserTpos,
                    $validatedItems,
                    $validatedCandidates,
                    $validatedOutfits,
                );
                $this->restoreUserBrands(
                    $user,
                    $validatedUserBrands,
                    $hasUserBrandsPayload,
                );
                $this->restoreVisibleCategoryIds(
                    $user,
                    $validatedVisibleCategoryIds,
                    $hasVisibleCategoryIdsPayload,
                    $validatedItems,
                    $validatedCandidates,
                );
                $this->restoreUserPreferences(
                    $user,
                    $validatedUserPreferences,
                    $hasUserPreferencesPayload,
                );

                $itemIdMap = [];
                foreach ($validatedItems as $itemPayload) {
                    $item = $this->itemStoreService->store($user, array_merge(
                        $this->resolveImportedTpoSelection($itemPayload, $legacyTpoIdMap),
                        [
                            'images' => [],
                        ]));

                    if (($itemPayload['status'] ?? 'active') !== 'active') {
                        $item->forceFill([
                            'status' => $itemPayload['status'],
                        ])->save();
                    }

                    ImportExportImageSupport::restoreItemImages(
                        $item,
                        is_array($itemPayload['images'] ?? null) ? $itemPayload['images'] : [],
                        $createdFiles,
                    );

                    $itemIdMap[(int) ($itemPayload['id'] ?? $item->id)] = $item->id;
                }

                $weatherLocationIdMap = [];
                foreach ($validatedWeatherLocations as $locationPayload) {
                    $location = UserWeatherLocation::query()->create([
                        'user_id' => $user->id,
                        'name' => $locationPayload['name'],
                        'forecast_area_code' => $locationPayload['forecast_area_code']
                            ?? $locationPayload['area_code']
                            ?? null,
                        'jma_forecast_region_code' => $locationPayload['jma_forecast_region_code'] ?? null,
                        'jma_forecast_office_code' => $locationPayload['jma_forecast_office_code'] ?? null,
                        'latitude' => $locationPayload['latitude'] ?? null,
                        'longitude' => $locationPayload['longitude'] ?? null,
                        'timezone' => $locationPayload['timezone'] ?? null,
                        'is_default' => $locationPayload['is_default'] ?? false,
                        'display_order' => $locationPayload['display_order'] ?? 1,
                    ]);

                    $weatherLocationIdMap[(int) ($locationPayload['id'] ?? $location->id)] = $location->id;
                }

                $groupIdMap = [];
                foreach ($validatedCandidates as $candidatePayload) {
                    $candidate = $this->purchaseCandidateService->store($user, array_merge($candidatePayload, [
                        'duplicate_images' => [],
                    ]));

                    $oldGroupId = $candidatePayload['group_id'] ?? null;
                    $newGroupId = null;
                    if (is_int($oldGroupId)) {
                        if (! array_key_exists($oldGroupId, $groupIdMap)) {
                            $groupIdMap[$oldGroupId] = PurchaseCandidateGroup::query()->create([
                                'user_id' => $user->id,
                            ])->id;
                        }

                        $newGroupId = $groupIdMap[$oldGroupId];
                    }

                    $newConvertedItemId = null;
                    if (is_int($candidatePayload['converted_item_id'] ?? null)) {
                        $newConvertedItemId = $itemIdMap[$candidatePayload['converted_item_id']] ?? null;
                    }

                    $candidate->forceFill([
                        'group_id' => $newGroupId,
                        'group_order' => $candidatePayload['group_order'] ?? null,
                        'converted_item_id' => $newConvertedItemId,
                        'converted_at' => $candidatePayload['converted_at'] ?? null,
                    ])->save();

                    ImportExportImageSupport::restorePurchaseCandidateImages(
                        $candidate,
                        is_array($candidatePayload['images'] ?? null) ? $candidatePayload['images'] : [],
                        $createdFiles,
                    );
                }

                $outfitIdMap = [];
                foreach ($validatedOutfits as $outfitPayload) {
                    $mappedItems = collect($outfitPayload['outfit_items'])
                        ->map(function (array $outfitItem) use ($itemIdMap) {
                            return [
                                'item_id' => $itemIdMap[$outfitItem['item_id']] ?? null,
                                'sort_order' => $outfitItem['sort_order'],
                            ];
                        })
                        ->all();

                    if (collect($mappedItems)->contains(fn (array $item) => ! is_int($item['item_id']))) {
                        throw ValidationException::withMessages([
                            'outfits' => '復元対象に存在しないアイテムを参照するコーディネートは復元できません。',
                        ]);
                    }

                    $outfit = Outfit::query()->create([
                        'user_id' => $user->id,
                        'status' => $outfitPayload['status'] ?? 'active',
                        'name' => $outfitPayload['name'] ?? null,
                        'memo' => $outfitPayload['memo'] ?? null,
                        'seasons' => $outfitPayload['seasons'] ?? [],
                        'tpo_ids' => TpoSelectionResolver::resolve(
                            $this->userTpoService,
                            $user,
                            $this->resolveImportedTpoSelection($outfitPayload, $legacyTpoIdMap),
                        ),
                    ]);

                    $outfit->outfitItems()->createMany($mappedItems);
                    $outfitIdMap[(int) ($outfitPayload['id'] ?? $outfit->id)] = $outfit->id;
                }

                foreach ($validatedWearLogs as $wearLogPayload) {
                    $mappedSourceOutfitId = null;
                    if (is_int($wearLogPayload['source_outfit_id'] ?? null)) {
                        $mappedSourceOutfitId = $outfitIdMap[$wearLogPayload['source_outfit_id']] ?? null;

                        if (! is_int($mappedSourceOutfitId)) {
                            throw ValidationException::withMessages([
                                'wear_logs' => '復元対象に存在しないコーディネートを参照する着用履歴は復元できません。',
                            ]);
                        }
                    }

                    $mappedItems = collect($wearLogPayload['items'] ?? [])
                        ->map(function (array $wearLogItem) use ($itemIdMap) {
                            $originalSourceItemId = $wearLogItem['source_item_id'] ?? null;
                            $mappedSourceItemId = null;

                            if (is_int($originalSourceItemId)) {
                                $mappedSourceItemId = $itemIdMap[$originalSourceItemId] ?? null;
                            }

                            return [
                                'original_source_item_id' => $originalSourceItemId,
                                'source_item_id' => $mappedSourceItemId,
                                'item_source_type' => $wearLogItem['item_source_type'],
                                'sort_order' => $wearLogItem['sort_order'],
                            ];
                        })
                        ->all();

                    if (collect($mappedItems)->contains(
                        fn (array $item) => is_int($item['original_source_item_id']) && ! is_int($item['source_item_id'])
                    )) {
                        throw ValidationException::withMessages([
                            'wear_logs' => '復元対象に存在しないアイテムを参照する着用履歴は復元できません。',
                        ]);
                    }

                    $wearLog = WearLog::query()->create([
                        'user_id' => $user->id,
                        'status' => $wearLogPayload['status'],
                        'event_date' => $wearLogPayload['event_date'],
                        'display_order' => $wearLogPayload['display_order'],
                        'source_outfit_id' => $mappedSourceOutfitId,
                        'memo' => $wearLogPayload['memo'] ?? null,
                        'outdoor_temperature_feel' => $wearLogPayload['outdoor_temperature_feel'] ?? null,
                        'indoor_temperature_feel' => $wearLogPayload['indoor_temperature_feel'] ?? null,
                        'overall_rating' => $wearLogPayload['overall_rating'] ?? null,
                        'feedback_tags' => $wearLogPayload['feedback_tags'] ?? null,
                        'feedback_memo' => $wearLogPayload['feedback_memo'] ?? null,
                    ]);

                    if ($mappedItems !== []) {
                        $wearLog->wearLogItems()->createMany(
                            array_map(
                                static fn (array $item): array => [
                                    'source_item_id' => $item['source_item_id'],
                                    'item_source_type' => $item['item_source_type'],
                                    'sort_order' => $item['sort_order'],
                                ],
                                $mappedItems
                            )
                        );
                    }
                }

                foreach ($validatedWeatherRecords as $weatherRecordPayload) {
                    $originalLocationId = $weatherRecordPayload['location_id'] ?? null;
                    $mappedLocationId = null;

                    if (is_int($originalLocationId)) {
                        $mappedLocationId = $weatherLocationIdMap[$originalLocationId] ?? null;
                    }

                    if (is_int($originalLocationId) && ! is_int($mappedLocationId)) {
                        throw ValidationException::withMessages([
                            'weather_records' => '復元対象に存在しない地域を参照する天気記録は復元できません。',
                        ]);
                    }

                    WeatherRecord::query()->create([
                        'user_id' => $user->id,
                        'weather_date' => $weatherRecordPayload['weather_date'],
                        'location_id' => $mappedLocationId,
                        'location_name_snapshot' => $weatherRecordPayload['location_name_snapshot'],
                        'forecast_area_code_snapshot' => $weatherRecordPayload['forecast_area_code_snapshot']
                            ?? $weatherRecordPayload['area_code_snapshot']
                            ?? null,
                        'weather_code' => $weatherRecordPayload['weather_code'],
                        'temperature_high' => $weatherRecordPayload['temperature_high'] ?? null,
                        'temperature_low' => $weatherRecordPayload['temperature_low'] ?? null,
                        'memo' => $weatherRecordPayload['memo'] ?? null,
                        'source_type' => $weatherRecordPayload['source_type'] ?? 'manual',
                        'source_name' => $weatherRecordPayload['source_name'] ?? 'manual',
                        'source_fetched_at' => $weatherRecordPayload['source_fetched_at'] ?? null,
                    ]);
                }

                return [
                    'user_tpos' => [
                        'total' => UserTpo::query()->where('user_id', $user->id)->count(),
                    ],
                    'items' => [
                        'total' => count($validatedItems),
                        'visible' => collect($validatedItems)
                            ->where('status', 'active')
                            ->count(),
                    ],
                    'purchase_candidates' => [
                        'total' => count($validatedCandidates),
                    ],
                    'outfits' => [
                        'total' => count($validatedOutfits),
                        'visible' => collect($validatedOutfits)
                            ->where('status', 'active')
                            ->count(),
                    ],
                    'wear_logs' => [
                        'total' => count($validatedWearLogs),
                    ],
                    'weather_locations' => [
                        'total' => count($validatedWeatherLocations),
                    ],
                    'weather_records' => [
                        'total' => count($validatedWeatherRecords),
                    ],
                ];
            });
        } catch (\Throwable $exception) {
            ImportExportImageSupport::deleteStoredFiles($createdFiles);
            throw $exception;
        }

        ImportExportImageSupport::deleteStoredFiles([
            ...$existingItemFiles,
            ...$existingCandidateFiles,
        ]);

        return $counts;
    }

    /**
     * @param  array<int, array<string, mixed>>  $validatedUserTpos
     * @param  array<int, array<string, mixed>>  $validatedItems
     * @param  array<int, array<string, mixed>>  $validatedCandidates
     * @param  array<int, array<string, mixed>>  $validatedOutfits
     */
    private function restoreUserTpos(
        User $user,
        array $validatedUserTpos,
        array $validatedItems,
        array $validatedCandidates,
        array $validatedOutfits,
    ): array {
        $sortOrder = 1;
        $seenNames = [];
        $legacyTpoIdMap = [];

        foreach ($validatedUserTpos as $payload) {
            $name = trim((string) ($payload['name'] ?? ''));
            if ($name === '' || isset($seenNames[mb_strtolower($name, 'UTF-8')])) {
                continue;
            }

            $userTpo = UserTpo::query()->create([
                'user_id' => $user->id,
                'name' => $name,
                'sort_order' => $sortOrder++,
                'is_active' => (bool) ($payload['is_active'] ?? true),
                'is_preset' => (bool) ($payload['is_preset'] ?? false),
            ]);

            $seenNames[mb_strtolower($name, 'UTF-8')] = true;

            if (is_int($payload['id'] ?? null)) {
                $legacyTpoIdMap[$payload['id']] = $userTpo->id;
            }
        }

        $legacyReferencedNames = collect([...$validatedItems, ...$validatedCandidates, ...$validatedOutfits])
            ->flatMap(function (array $payload) {
                $tpos = $payload['tpos'] ?? [];

                return is_array($tpos) ? $tpos : [];
            })
            ->map(fn ($name) => is_string($name) ? trim($name) : '')
            ->filter(fn ($name) => $name !== '')
            ->unique()
            ->values();

        foreach ($legacyReferencedNames as $name) {
            $normalizedKey = mb_strtolower($name, 'UTF-8');

            if (isset($seenNames[$normalizedKey])) {
                continue;
            }

            $userTpo = UserTpo::query()->create([
                'user_id' => $user->id,
                'name' => $name,
                'sort_order' => $sortOrder++,
                'is_active' => true,
                'is_preset' => false,
            ]);

            $seenNames[$normalizedKey] = true;
        }

        return $legacyTpoIdMap;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, int>  $legacyTpoIdMap
     * @return array<string, mixed>
     */
    private function resolveImportedTpoSelection(array $payload, array $legacyTpoIdMap): array
    {
        $legacyTpoIds = collect($payload['tpo_ids'] ?? [])
            ->filter(fn ($id) => is_int($id))
            ->values()
            ->all();
        $mappedTpoIds = collect($legacyTpoIds)
            ->map(fn (int $legacyId) => $legacyTpoIdMap[$legacyId] ?? null)
            ->filter(fn ($id) => is_int($id))
            ->unique()
            ->values()
            ->all();
        $tpoNames = collect($payload['tpos'] ?? [])
            ->filter(fn ($name) => is_string($name) && trim($name) !== '')
            ->map(fn (string $name) => trim($name))
            ->values()
            ->all();

        unset($payload['tpo_ids']);

        if ($tpoNames !== []) {
            $payload['tpos'] = $tpoNames;

            return $payload;
        }

        if ($mappedTpoIds !== []) {
            $payload['tpo_ids'] = $mappedTpoIds;
        } else {
            $payload['tpos'] = [];
        }

        return $payload;
    }

    /**
     * @param  array<int, array<string, mixed>>  $validatedUserBrands
     */
    private function restoreUserBrands(
        User $user,
        array $validatedUserBrands,
        bool $hasUserBrandsPayload,
    ): void {
        $seenNormalizedNames = [];
        $seenNormalizedKana = [];

        if (! $hasUserBrandsPayload) {
            return;
        }

        foreach ($validatedUserBrands as $payload) {
            $this->createUserBrandFromImportPayload(
                $user,
                $payload['name'] ?? '',
                $payload['kana'] ?? null,
                (bool) ($payload['is_active'] ?? true),
                $seenNormalizedNames,
                $seenNormalizedKana,
            );
        }
    }

    /**
     * @param  list<string>|null  $validatedVisibleCategoryIds
     * @param  array<int, array<string, mixed>>  $validatedItems
     * @param  array<int, array<string, mixed>>  $validatedCandidates
     */
    private function restoreVisibleCategoryIds(
        User $user,
        ?array $validatedVisibleCategoryIds,
        bool $hasVisibleCategoryIdsPayload,
        array $validatedItems,
        array $validatedCandidates,
    ): void {
        if ($hasVisibleCategoryIdsPayload) {
            $user->forceFill([
                'visible_category_ids' => $validatedVisibleCategoryIds ?? [],
            ])->save();

            return;
        }

        if (! is_array($user->visible_category_ids)) {
            return;
        }

        $currentVisibleCategoryIds = ItemSubcategorySupport::currentVisibleCategoryIds();

        $inferredVisibleCategoryIds = collect($validatedItems)
            ->map(function (array $payload) {
                return ItemSubcategorySupport::visibleCategoryIdFor(
                    is_string($payload['category'] ?? null) ? $payload['category'] : null,
                    is_string($payload['subcategory'] ?? null) ? $payload['subcategory'] : null,
                );
            })
            ->merge(
                collect($validatedCandidates)
                    ->map(fn (array $payload) => is_string($payload['category_id'] ?? null) ? $payload['category_id'] : null)
            )
            ->filter(fn ($categoryId) => is_string($categoryId) && in_array($categoryId, $currentVisibleCategoryIds, true))
            ->unique()
            ->values()
            ->all();

        if ($inferredVisibleCategoryIds === []) {
            return;
        }

        $mergedVisibleCategoryIds = collect($user->visible_category_ids)
            ->filter(fn ($categoryId) => is_string($categoryId) && in_array($categoryId, $currentVisibleCategoryIds, true))
            ->merge($inferredVisibleCategoryIds)
            ->unique()
            ->values()
            ->all();

        $user->forceFill([
            'visible_category_ids' => $mergedVisibleCategoryIds,
        ])->save();
    }

    /**
     * @param  array<string, mixed>|null  $validatedUserPreferences
     */
    private function restoreUserPreferences(
        User $user,
        ?array $validatedUserPreferences,
        bool $hasUserPreferencesPayload,
    ): void {
        if (! $hasUserPreferencesPayload || $validatedUserPreferences === null) {
            return;
        }

        UserPreference::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'current_season' => $validatedUserPreferences['currentSeason'] ?? null,
                'default_wear_log_status' => $validatedUserPreferences['defaultWearLogStatus'] ?? null,
                'calendar_week_start' => $validatedUserPreferences['calendarWeekStart'] ?? null,
                'skin_tone_preset' => $validatedUserPreferences['skinTonePreset'] ?? SkinTonePresetSupport::DEFAULT_PRESET,
            ],
        );
    }

    /**
     * @param  array<string, true>  $seenNormalizedNames
     * @param  array<string, true>  $seenNormalizedKana
     */
    private function createUserBrandFromImportPayload(
        User $user,
        string $name,
        ?string $kana,
        bool $isActive,
        array &$seenNormalizedNames,
        array &$seenNormalizedKana,
    ): void {
        $trimmedName = trim($name);
        $trimmedKana = $kana !== null ? trim($kana) : null;

        if ($trimmedName === '') {
            return;
        }

        $normalizedName = BrandNormalizer::normalizeName($trimmedName);
        $normalizedKana = BrandNormalizer::normalizeKana($trimmedKana);

        if (isset($seenNormalizedNames[$normalizedName])) {
            return;
        }

        if ($normalizedKana !== null && isset($seenNormalizedKana[$normalizedKana])) {
            return;
        }

        UserBrand::query()->create([
            'user_id' => $user->id,
            'name' => $trimmedName,
            'kana' => $trimmedKana === '' ? null : $trimmedKana,
            'normalized_name' => $normalizedName,
            'normalized_kana' => $normalizedKana,
            'is_active' => $isActive,
        ]);

        $seenNormalizedNames[$normalizedName] = true;

        if ($normalizedKana !== null) {
            $seenNormalizedKana[$normalizedKana] = true;
        }
    }

    /**
     * @param  callable(array<string, mixed>): array<string, mixed>  $validator
     * @return array<int, array<string, mixed>>
     */
    private function validateCollectionPayloads(
        mixed $payloads,
        string $payloadKey,
        string $entityLabel,
        callable $validator,
    ): array {
        $validated = [];

        foreach (collect($payloads)->values() as $index => $payload) {
            try {
                $validated[] = $validator((array) $payload);
            } catch (ValidationException $exception) {
                $messages = [];

                foreach ($exception->errors() as $field => $fieldMessages) {
                    $fieldLabel = $this->fieldLabel($field);

                    foreach ((array) $fieldMessages as $message) {
                        $messages[sprintf('%s.%d.%s', $payloadKey, $index, $field)][] =
                            sprintf('%sの%d件目の%sでエラーが発生しました: %s', $entityLabel, $index + 1, $fieldLabel, $message);
                    }
                }

                throw ValidationException::withMessages($messages);
            }
        }

        return $validated;
    }

    private function fieldLabel(string $field): string
    {
        return match ($field) {
            'subcategory', 'category_id' => '種類',
            'shape' => '形',
            'spec.tops.sleeve' => '仕様・属性（袖丈）',
            'spec.tops.length' => '仕様・属性（丈）',
            'spec.tops.neck' => '仕様・属性（首まわり）',
            'spec.tops.design' => '仕様・属性（デザイン）',
            'spec.tops.fit' => '仕様・属性（フィット）',
            'spec.bottoms.length_type' => '仕様・属性（ボトムス丈）',
            'spec.bottoms.rise_type' => '仕様・属性（股上）',
            'spec.skirt.length_type' => '仕様・属性（スカート丈）',
            'spec.skirt.material_type' => '仕様・属性（スカート素材）',
            'spec.skirt.design_type' => '仕様・属性（スカートデザイン）',
            'spec.legwear.coverage_type' => '仕様・属性（レッグウェア丈）',
            'source_outfit_id' => '参照コーディネート',
            'items' => '着用アイテム',
            'items.present' => '着用アイテム',
            'items.*.source_item_id' => '参照アイテム',
            'items.*.sort_order' => '表示順',
            'items.*.item_source_type' => 'アイテム取得元',
            'display_order' => '表示順',
            'event_date' => '着用日',
            'owner.user_id' => 'バックアップ所有者',
            default => $field,
        };
    }
}
