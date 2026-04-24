<?php

namespace App\Support;

use App\Http\Requests\ItemUpsertRequest;
use Illuminate\Support\Facades\Validator;

class ImportExportValidationSupport
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function validateItemPayload(array $payload): array
    {
        $payload = self::normalizeLegacyItemPayload($payload);
        $rules = ItemUpsertRequest::commonRulesForPayload();

        unset(
            $rules['images'],
            $rules['images.*.disk'],
            $rules['images.*.path'],
            $rules['images.*.original_filename'],
            $rules['images.*.mime_type'],
            $rules['images.*.file_size'],
            $rules['images.*.sort_order'],
            $rules['images.*.is_primary'],
        );

        $rules['id'] = ['nullable', 'integer'];
        $rules['status'] = ['nullable', 'string', 'in:active,disposed'];
        $rules['images'] = ['nullable', 'array', 'max:5'];
        $rules['images.*'] = ['array:disk,original_filename,mime_type,file_size,sort_order,is_primary,content_base64'];
        $rules['images.*.disk'] = ['nullable', 'string', 'max:100'];
        $rules['images.*.original_filename'] = ['nullable', 'string', 'max:255'];
        $rules['images.*.mime_type'] = ['nullable', 'string', 'max:100'];
        $rules['images.*.file_size'] = ['nullable', 'integer', 'min:0'];
        $rules['images.*.sort_order'] = ['required', 'integer', 'min:1'];
        $rules['images.*.is_primary'] = ['nullable', 'boolean'];
        $rules['images.*.content_base64'] = ['nullable', 'string'];

        $validated = Validator::make($payload, $rules)->validate();

        ItemInputRequirementSupport::validate($validated);
        ItemLegwearSpecValidator::validateForImport($validated);
        ItemMaterialValidator::validate($validated);
        ItemSubcategorySupport::validate($validated);

        return $validated;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function validatePurchaseCandidatePayload(array $payload): array
    {
        $normalizedPayload = self::normalizeMaterials($payload);

        $validated = Validator::make($normalizedPayload, [
            'id' => ['nullable', 'integer'],
            'group_id' => ['nullable', 'integer'],
            'group_order' => ['nullable', 'integer', 'min:1'],
            'converted_item_id' => ['nullable', 'integer'],
            'converted_at' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:considering,on_hold,purchased,dropped'],
            'priority' => ['nullable', 'string', 'in:high,medium,low'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'string', 'exists:category_master,id'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'integer', 'min:0'],
            'sale_price' => ['nullable', 'integer', 'min:0'],
            'sale_ends_at' => ['nullable', 'date'],
            'purchase_url' => ['nullable', 'url'],
            'memo' => ['nullable', 'string'],
            'wanted_reason' => ['nullable', 'string'],
            'size_gender' => ['nullable', 'string', 'in:women,men,unisex'],
            'size_label' => ['nullable', 'string', 'max:50'],
            'size_note' => ['nullable', 'string'],
            'size_details' => ['nullable', 'array:structured,custom_fields'],
            'size_details.structured' => ['nullable', 'array:shoulder_width,body_width,body_length,sleeve_length,sleeve_width,cuff_width,neck_circumference,waist,hip,rise,inseam,hem_width,thigh_width,total_length'],
            'size_details.structured.shoulder_width' => ['nullable', 'numeric'],
            'size_details.structured.body_width' => ['nullable', 'numeric'],
            'size_details.structured.body_length' => ['nullable', 'numeric'],
            'size_details.structured.sleeve_length' => ['nullable', 'numeric'],
            'size_details.structured.sleeve_width' => ['nullable', 'numeric'],
            'size_details.structured.cuff_width' => ['nullable', 'numeric'],
            'size_details.structured.neck_circumference' => ['nullable', 'numeric'],
            'size_details.structured.waist' => ['nullable', 'numeric'],
            'size_details.structured.hip' => ['nullable', 'numeric'],
            'size_details.structured.rise' => ['nullable', 'numeric'],
            'size_details.structured.inseam' => ['nullable', 'numeric'],
            'size_details.structured.hem_width' => ['nullable', 'numeric'],
            'size_details.structured.thigh_width' => ['nullable', 'numeric'],
            'size_details.structured.total_length' => ['nullable', 'numeric'],
            'size_details.custom_fields' => ['nullable', 'array', 'max:10'],
            'size_details.custom_fields.*' => ['array:label,value,sort_order'],
            'size_details.custom_fields.*.label' => ['required_with:size_details.custom_fields.*.value', 'string', 'max:50'],
            'size_details.custom_fields.*.value' => ['required_with:size_details.custom_fields.*.label', 'numeric'],
            'size_details.custom_fields.*.sort_order' => ['required', 'integer', 'min:1'],
            'spec' => ['nullable', 'array:tops,bottoms,skirt,legwear'],
            'spec.tops' => ['nullable', 'array:sleeve,length,neck,design,fit'],
            'spec.tops.sleeve' => ['nullable', 'string', 'max:100'],
            'spec.tops.length' => ['nullable', 'string', 'max:100'],
            'spec.tops.neck' => ['nullable', 'string', 'max:100'],
            'spec.tops.design' => ['nullable', 'string', 'max:100'],
            'spec.tops.fit' => ['nullable', 'string', 'max:100'],
            'spec.bottoms' => ['nullable', 'array:length_type,rise_type'],
            'spec.bottoms.length_type' => ['nullable', 'string', 'in:mini,short,half,cropped,ankle,full,knee,midi'],
            'spec.bottoms.rise_type' => ['nullable', 'string', 'in:high_waist,low_rise'],
            'spec.skirt' => ['nullable', 'array:length_type,material_type,design_type'],
            'spec.skirt.length_type' => ['nullable', 'string', 'in:mini,knee,midi,mid_calf,long,maxi'],
            'spec.skirt.material_type' => ['nullable', 'string', 'in:tulle,lace,denim,leather,satin'],
            'spec.skirt.design_type' => ['nullable', 'string', 'in:tuck,gather,pleats,tiered,wrap,balloon,trench'],
            'spec.legwear' => ['nullable', 'array:coverage_type'],
            'spec.legwear.coverage_type' => ['nullable', 'string', 'in:foot_cover,ankle_sneaker,crew,three_quarter,high_socks,loose_socks,thigh_high_socks,stockings,tights,one_tenth,three_tenths,five_tenths,seven_tenths,seven_eighths,ten_tenths,twelve_tenths'],
            'is_rain_ok' => ['nullable', 'boolean'],
            'colors' => ['required', 'array', 'min:1'],
            'colors.*.role' => ['required', 'string', 'in:main,sub'],
            'colors.*.mode' => ['required', 'string', 'in:preset,custom'],
            'colors.*.value' => ['required', 'string', 'max:100'],
            'colors.*.hex' => ['required', 'string', 'max:20'],
            'colors.*.label' => ['required', 'string', 'max:100'],
            'colors.*.custom_label' => ['nullable', 'string', 'max:50'],
            'seasons' => ['nullable', 'array'],
            'seasons.*' => ['string', 'max:50'],
            'tpos' => ['nullable', 'array'],
            'tpos.*' => ['string', 'max:50'],
            'materials' => ['nullable', 'array'],
            'materials.*' => ['array:part_label,material_name,ratio'],
            'materials.*.part_label' => ['required', 'string', 'max:100'],
            'materials.*.material_name' => ['required', 'string', 'max:100'],
            'materials.*.ratio' => ['required', 'integer', 'between:1,100'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['array:disk,original_filename,mime_type,file_size,sort_order,is_primary,content_base64'],
            'images.*.disk' => ['nullable', 'string', 'max:100'],
            'images.*.original_filename' => ['nullable', 'string', 'max:255'],
            'images.*.mime_type' => ['nullable', 'string', 'max:100'],
            'images.*.file_size' => ['nullable', 'integer', 'min:0'],
            'images.*.sort_order' => ['required', 'integer', 'min:1'],
            'images.*.is_primary' => ['nullable', 'boolean'],
            'images.*.content_base64' => ['nullable', 'string'],
        ])->validate();

        ItemMaterialValidator::validate($validated);

        return $validated;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function validateOutfitPayload(array $payload): array
    {
        return Validator::make($payload, [
            'id' => ['nullable', 'integer'],
            'status' => ['nullable', 'string', 'in:active,invalid'],
            'name' => ['nullable', 'string', 'max:255'],
            'memo' => ['nullable', 'string'],
            'seasons' => ['nullable', 'array'],
            'seasons.*' => ['string', 'max:50'],
            'tpo_ids' => ['nullable', 'array'],
            'tpo_ids.*' => ['integer'],
            'tpos' => ['nullable', 'array'],
            'tpos.*' => ['string', 'max:50'],
            'outfit_items' => ['required', 'array', 'min:1'],
            'outfit_items.*.item_id' => ['required', 'integer'],
            'outfit_items.*.sort_order' => ['required', 'integer', 'min:1'],
        ])->validate();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function validateWearLogPayload(array $payload): array
    {
        if (is_array($payload['items'] ?? null)) {
            $payload['items'] = array_map(
                static function ($item) {
                    if (! is_array($item)) {
                        return $item;
                    }

                    return [
                        'source_item_id' => $item['source_item_id'] ?? null,
                        'item_source_type' => $item['item_source_type'] ?? null,
                        'sort_order' => $item['sort_order'] ?? null,
                    ];
                },
                $payload['items']
            );
        }

        return Validator::make($payload, [
            'id' => ['nullable', 'integer'],
            'status' => ['required', 'string', 'in:planned,worn'],
            'event_date' => ['required', 'date'],
            'display_order' => ['required', 'integer', 'min:1'],
            'source_outfit_id' => ['nullable', 'integer'],
            'memo' => ['nullable', 'string'],
            'items' => ['present', 'array'],
            'items.*.source_item_id' => ['present', 'nullable', 'integer'],
            'items.*.sort_order' => ['required', 'integer', 'min:1'],
            'items.*.item_source_type' => ['required', 'string', 'in:outfit,manual'],
        ], [
            'items.present' => '着用アイテムは配列で指定してください。',
            'items.*.source_item_id.present' => '参照アイテムを配列で指定してください。',
        ])->validate();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private static function normalizeMaterials(array $payload): array
    {
        $materials = $payload['materials'] ?? null;

        if (! is_array($materials)) {
            return $payload;
        }

        $payload['materials'] = array_map(function ($material) {
            if (! is_array($material)) {
                return $material;
            }

            return [
                'part_label' => ItemMaterialSupport::normalizeText($material['part_label'] ?? null),
                'material_name' => ItemMaterialSupport::normalizeText($material['material_name'] ?? null),
                'ratio' => $material['ratio'] ?? null,
            ];
        }, $materials);

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private static function normalizeLegacyItemPayload(array $payload): array
    {
        $category = is_string($payload['category'] ?? null) ? $payload['category'] : null;
        $subcategory = ItemSubcategorySupport::normalize($category, $payload['subcategory'] ?? null);

        if ($subcategory !== null) {
            $payload['subcategory'] = $subcategory;
        } else {
            $inferredSubcategory = ItemSubcategorySupport::inferFromShape($category, $payload['shape'] ?? null);

            if ($inferredSubcategory !== null) {
                $payload['subcategory'] = $inferredSubcategory;
            }
        }

        $resolvedSubcategory = ItemSubcategorySupport::normalize($category, $payload['subcategory'] ?? null);
        $payload['spec'] = ItemSpecNormalizer::normalize(
            $category,
            ItemInputRequirementSupport::normalizeShape($payload['shape'] ?? null) ?? $payload['shape'] ?? null,
            $payload['spec'] ?? null,
            $resolvedSubcategory,
        );

        return $payload;
    }
}
