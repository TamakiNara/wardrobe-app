<?php

namespace App\Http\Requests;

class ItemStoreRequest extends ItemUpsertRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->commonRules(),
            'purchase_candidate_id' => ['nullable', 'integer'],
            'variant_source_item_id' => ['nullable', 'integer'],
        ];
    }
}
