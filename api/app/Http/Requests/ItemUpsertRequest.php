<?php

namespace App\Http\Requests;

use App\Support\ItemInputRequirementSupport;
use App\Support\ItemLegwearSpecValidator;
use App\Support\ItemMaterialSupport;
use App\Support\ItemMaterialValidator;
use App\Support\ItemSubcategorySupport;
use Illuminate\Foundation\Http\FormRequest;

abstract class ItemUpsertRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public static function commonRulesForPayload(): array
    {
        return [
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
            'is_rain_ok' => ['nullable', 'boolean'],
            'category' => ['required', 'string', 'max:100'],
            'subcategory' => ['nullable', 'string', 'max:100'],
            'shape' => ['nullable', 'string', 'max:100'],
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
            'spec.tops.sleeve' => ['nullable', 'string', 'max:100'],
            'spec.tops.length' => ['nullable', 'string', 'max:100'],
            'spec.tops.neck' => ['nullable', 'string', 'max:100'],
            'spec.tops.design' => ['nullable', 'string', 'max:100'],
            'spec.tops.fit' => ['nullable', 'string', 'max:100'],
            'spec.bottoms' => ['nullable', 'array'],
            'spec.bottoms.length_type' => ['nullable', 'in:mini,short,half,cropped,ankle,full,knee,midi'],
            'spec.bottoms.rise_type' => ['nullable', 'in:high_waist,low_rise'],
            'spec.skirt' => ['nullable', 'array'],
            'spec.skirt.length_type' => ['nullable', 'in:mini,knee,midi,mid_calf,long,maxi'],
            'spec.skirt.material_type' => ['nullable', 'in:tulle,lace,denim,leather,satin'],
            'spec.skirt.design_type' => ['nullable', 'in:tuck,gather,pleats,tiered,wrap,balloon,trench'],
            'spec.legwear' => ['nullable', 'array'],
            'spec.legwear.coverage_type' => ['nullable', 'in:foot_cover,ankle_sneaker,crew,three_quarter,high_socks,loose_socks,thigh_high_socks,stockings,tights,one_tenth,three_tenths,five_tenths,seven_tenths,seven_eighths,ten_tenths,twelve_tenths'],
            'materials' => ['nullable', 'array'],
            'materials.*' => ['array:part_label,material_name,ratio'],
            'materials.*.part_label' => ['required', 'string', 'max:100'],
            'materials.*.material_name' => ['required', 'string', 'max:100'],
            'materials.*.ratio' => ['required', 'integer', 'between:1,100'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*.disk' => ['nullable', 'string', 'max:100'],
            'images.*.path' => ['nullable', 'string'],
            'images.*.original_filename' => ['nullable', 'string', 'max:255'],
            'images.*.mime_type' => ['nullable', 'string', 'max:100'],
            'images.*.file_size' => ['nullable', 'integer', 'min:0'],
            'images.*.sort_order' => ['required', 'integer', 'min:1'],
            'images.*.is_primary' => ['nullable', 'boolean'],
        ];
    }

    protected function commonRules(): array
    {
        return self::commonRulesForPayload();
    }

    protected function prepareForValidation(): void
    {
        $materials = $this->input('materials');

        if (! is_array($materials)) {
            return;
        }

        $normalized = array_map(function ($material) {
            if (! is_array($material)) {
                return $material;
            }

            return [
                'part_label' => ItemMaterialSupport::normalizeText($material['part_label'] ?? null),
                'material_name' => ItemMaterialSupport::normalizeText($material['material_name'] ?? null),
                'ratio' => $material['ratio'] ?? null,
            ];
        }, $materials);

        $this->merge([
            'materials' => $normalized,
        ]);
    }

    protected function passedValidation(): void
    {
        $validated = $this->validated();

        ItemInputRequirementSupport::validate($validated);
        ItemLegwearSpecValidator::validate($validated);
        ItemMaterialValidator::validate($validated);
        ItemSubcategorySupport::validate($validated);
    }
}
