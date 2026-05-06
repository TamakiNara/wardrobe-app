<?php

namespace App\Services\ImportExport;

use App\Models\Item;
use App\Models\ItemMaterial;
use App\Models\Outfit;
use App\Models\PurchaseCandidate;
use App\Models\PurchaseCandidateMaterial;
use App\Models\User;
use App\Models\UserBrand;
use App\Models\UserPreference;
use App\Models\UserTpo;
use App\Models\UserWeatherLocation;
use App\Models\WearLog;
use App\Models\WeatherRecord;
use App\Support\ImportExportImageSupport;
use App\Support\ItemMaterialSupport;
use App\Support\ItemSpecNormalizer;
use App\Support\ItemSpecPayloadSupport;
use App\Support\ItemSubcategorySupport;
use App\Support\WeatherLocationPayloadBuilder;
use App\Support\WeatherRecordPayloadBuilder;
use Carbon\CarbonInterface;

class ExportService
{
    private function formatTokyoLocalDateTime(?CarbonInterface $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value
            ->avoidMutation()
            ->format('Y-m-d\TH:i');
    }

    public function export(User $user): array
    {
        return [
            'version' => 1,
            'exported_at' => now()->toISOString(),
            'owner' => [
                'user_id' => $user->id,
            ],
            'user_tpos' => UserTpo::query()
                ->where('user_id', $user->id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (UserTpo $tpo) => [
                    'id' => $tpo->id,
                    'name' => $tpo->name,
                    'sort_order' => $tpo->sort_order,
                    'is_active' => $tpo->is_active,
                    'is_preset' => $tpo->is_preset,
                ])
                ->all(),
            'user_brands' => UserBrand::query()
                ->where('user_id', $user->id)
                ->orderByDesc('is_active')
                ->orderBy('name')
                ->orderBy('id')
                ->get()
                ->map(fn (UserBrand $brand) => [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'kana' => $brand->kana,
                    'is_active' => $brand->is_active,
                ])
                ->all(),
            'visible_category_ids' => is_array($user->visible_category_ids)
                ? array_values($user->visible_category_ids)
                : [],
            'user_preferences' => \App\Support\UserPreferencePayloadBuilder::build(
                UserPreference::query()->where('user_id', $user->id)->first()
            ),
            'items' => Item::query()
                ->where('user_id', $user->id)
                ->with(['images', 'materials'])
                ->orderBy('id')
                ->get()
                ->map(fn (Item $item) => $this->buildItemPayload($item))
                ->all(),
            'purchase_candidates' => PurchaseCandidate::query()
                ->where('user_id', $user->id)
                ->with(['colors', 'seasons', 'tpos', 'images', 'materials'])
                ->orderBy('id')
                ->get()
                ->map(fn (PurchaseCandidate $candidate) => $this->buildPurchaseCandidatePayload($candidate))
                ->all(),
            'outfits' => Outfit::query()
                ->where('user_id', $user->id)
                ->with('outfitItems')
                ->orderBy('id')
                ->get()
                ->map(fn (Outfit $outfit) => $this->buildOutfitPayload($outfit))
                ->all(),
            'wear_logs' => WearLog::query()
                ->where('user_id', $user->id)
                ->with('wearLogItems')
                ->orderBy('event_date')
                ->orderBy('display_order')
                ->orderBy('id')
                ->get()
                ->map(fn (WearLog $wearLog) => $this->buildWearLogPayload($wearLog))
                ->all(),
            'weather_locations' => UserWeatherLocation::query()
                ->where('user_id', $user->id)
                ->orderByDesc('is_default')
                ->orderBy('display_order')
                ->orderBy('id')
                ->get()
                ->map(fn (UserWeatherLocation $location) => WeatherLocationPayloadBuilder::buildForExport($location))
                ->all(),
            'weather_records' => WeatherRecord::query()
                ->where('user_id', $user->id)
                ->with('location')
                ->orderBy('weather_date')
                ->orderBy('id')
                ->get()
                ->map(fn (WeatherRecord $record) => WeatherRecordPayloadBuilder::build($record))
                ->all(),
        ];
    }

    private function buildItemPayload(Item $item): array
    {
        $resolvedSubcategory = ItemSubcategorySupport::normalize($item->category, $item->subcategory)
            ?? ItemSubcategorySupport::inferFromShape($item->category, $item->shape);

        return [
            'id' => $item->id,
            'status' => $item->status,
            'care_status' => $item->care_status,
            'sheerness' => $item->sheerness,
            'name' => $item->name,
            'brand_name' => $item->brand_name,
            'price' => $item->price,
            'purchase_url' => $item->purchase_url,
            'memo' => $item->memo,
            'purchased_at' => $item->purchased_at?->toDateString(),
            'size_gender' => $item->size_gender,
            'size_label' => $item->size_label,
            'size_note' => $item->size_note,
            'size_details' => $item->size_details,
            'is_rain_ok' => $item->is_rain_ok,
            'category' => $item->category,
            'subcategory' => $resolvedSubcategory,
            'shape' => $item->shape,
            'colors' => $item->colors ?? [],
            'seasons' => $item->seasons ?? [],
            'tpo_ids' => $item->tpo_ids ?? [],
            'tpos' => $item->tpos ?? [],
            'spec' => ItemSpecPayloadSupport::buildResponseSpec(
                ItemSpecNormalizer::normalize(
                    $item->category,
                    $item->shape,
                    $item->spec,
                    $resolvedSubcategory,
                ),
            ),
            'materials' => ItemMaterialSupport::buildPayload(
                $item->materials
                    ->map(fn (ItemMaterial $material) => [
                        'part_label' => $material->part_label,
                        'material_name' => $material->material_name,
                        'ratio' => $material->ratio,
                    ])
                    ->all(),
            ),
            'images' => ImportExportImageSupport::buildExportPayload($item->images),
        ];
    }

    private function buildPurchaseCandidatePayload(PurchaseCandidate $candidate): array
    {
        return [
            'id' => $candidate->id,
            'group_id' => $candidate->group_id,
            'group_order' => $candidate->group_order,
            'status' => $candidate->status,
            'priority' => $candidate->priority,
            'name' => $candidate->name,
            'category_id' => $candidate->category_id,
            'shape' => $candidate->shape,
            'brand_name' => $candidate->brand_name,
            'price' => $candidate->price,
            'release_date' => $candidate->release_date?->toDateString(),
            'sale_price' => $candidate->sale_price,
            'sale_ends_at' => $this->formatTokyoLocalDateTime($candidate->sale_ends_at),
            'discount_ends_at' => $this->formatTokyoLocalDateTime($candidate->discount_ends_at),
            'purchase_url' => $candidate->purchase_url,
            'memo' => $candidate->memo,
            'wanted_reason' => $candidate->wanted_reason,
            'size_gender' => $candidate->size_gender,
            'size_label' => $candidate->size_label,
            'size_note' => $candidate->size_note,
            'size_details' => $candidate->size_details,
            'alternate_size_label' => $candidate->alternate_size_label,
            'alternate_size_note' => $candidate->alternate_size_note,
            'alternate_size_details' => $candidate->alternate_size_details,
            'spec' => ItemSpecPayloadSupport::buildResponseSpec(
                is_array($candidate->spec) ? $candidate->spec : null,
            ),
            'is_rain_ok' => $candidate->is_rain_ok,
            'sheerness' => $candidate->sheerness,
            'converted_item_id' => $candidate->converted_item_id,
            'converted_at' => $candidate->converted_at?->toISOString(),
            'colors' => $candidate->colors
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($color) => [
                    'role' => $color->role,
                    'mode' => $color->mode,
                    'value' => $color->value,
                    'hex' => $color->hex,
                    'label' => $color->label,
                    'custom_label' => $color->custom_label,
                ])
                ->all(),
            'seasons' => $candidate->seasons
                ->sortBy('sort_order')
                ->pluck('season')
                ->values()
                ->all(),
            'tpos' => $candidate->tpos
                ->sortBy('sort_order')
                ->pluck('tpo')
                ->values()
                ->all(),
            'materials' => ItemMaterialSupport::buildPayload(
                $candidate->materials
                    ->map(fn (PurchaseCandidateMaterial $material) => [
                        'part_label' => $material->part_label,
                        'material_name' => $material->material_name,
                        'ratio' => $material->ratio,
                    ])
                    ->all(),
            ),
            'images' => ImportExportImageSupport::buildExportPayload($candidate->images),
        ];
    }

    private function buildOutfitPayload(Outfit $outfit): array
    {
        return [
            'id' => $outfit->id,
            'status' => $outfit->status,
            'name' => $outfit->name,
            'memo' => $outfit->memo,
            'seasons' => $outfit->seasons ?? [],
            'tpo_ids' => $outfit->tpo_ids ?? [],
            'tpos' => $outfit->tpos ?? [],
            'outfit_items' => $outfit->outfitItems
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($outfitItem) => [
                    'item_id' => $outfitItem->item_id,
                    'sort_order' => $outfitItem->sort_order,
                ])
                ->all(),
        ];
    }

    private function buildWearLogPayload(WearLog $wearLog): array
    {
        return [
            'id' => $wearLog->id,
            'status' => $wearLog->status,
            'event_date' => $wearLog->event_date?->format('Y-m-d'),
            'display_order' => $wearLog->display_order,
            'source_outfit_id' => $wearLog->source_outfit_id,
            'memo' => $wearLog->memo,
            'outdoor_temperature_feel' => $wearLog->outdoor_temperature_feel,
            'indoor_temperature_feel' => $wearLog->indoor_temperature_feel,
            'overall_rating' => $wearLog->overall_rating,
            'feedback_tags' => $wearLog->feedback_tags,
            'feedback_memo' => $wearLog->feedback_memo,
            'items' => $wearLog->wearLogItems
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($wearLogItem) => [
                    'source_item_id' => $wearLogItem->source_item_id,
                    'item_source_type' => $wearLogItem->item_source_type,
                    'sort_order' => $wearLogItem->sort_order,
                ])
                ->all(),
        ];
    }
}
