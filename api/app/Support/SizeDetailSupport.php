<?php

namespace App\Support;

class SizeDetailSupport
{
    /**
     * @return list<string>
     */
    public static function structuredFieldNames(): array
    {
        return [
            'shoulder_width',
            'body_width',
            'body_length',
            'sleeve_length',
            'sleeve_width',
            'cuff_width',
            'neck_circumference',
            'waist',
            'hip',
            'rise',
            'inseam',
            'hem_width',
            'thigh_width',
            'total_length',
            'skirt_length',
            'height',
            'width',
            'depth',
        ];
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function validationRules(string $attribute = 'size_details'): array
    {
        $structuredFieldKeys = implode(',', self::structuredFieldNames());
        $rules = [
            $attribute => ['nullable', 'array:structured,custom_fields'],
            "{$attribute}.structured" => ['nullable', "array:{$structuredFieldKeys}"],
            "{$attribute}.custom_fields" => ['nullable', 'array', 'max:10'],
            "{$attribute}.custom_fields.*" => ['array:label,value,min,max,note,sort_order'],
            "{$attribute}.custom_fields.*.label" => [
                'required_with:'.$attribute.'.custom_fields.*.value,'.
                $attribute.'.custom_fields.*.min,'.
                $attribute.'.custom_fields.*.max,'.
                $attribute.'.custom_fields.*.note',
                'string',
                'max:50',
            ],
            "{$attribute}.custom_fields.*.value" => ['nullable', 'numeric', 'min:0'],
            "{$attribute}.custom_fields.*.min" => ['nullable', 'numeric', 'min:0'],
            "{$attribute}.custom_fields.*.max" => ['nullable', 'numeric', 'min:0'],
            "{$attribute}.custom_fields.*.note" => ['nullable', 'string', 'max:50'],
            "{$attribute}.custom_fields.*.sort_order" => ['required', 'integer', 'min:1'],
        ];

        foreach (self::structuredFieldNames() as $fieldName) {
            $rules["{$attribute}.structured.{$fieldName}"] = ['nullable', 'array:value,min,max,note'];
            $rules["{$attribute}.structured.{$fieldName}.value"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$attribute}.structured.{$fieldName}.min"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$attribute}.structured.{$fieldName}.max"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$attribute}.structured.{$fieldName}.note"] = ['nullable', 'string', 'max:50'];
        }

        return $rules;
    }

    public static function normalizeForValidation(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        if (! is_array($value)) {
            return $value;
        }

        $topLevelKeys = array_keys($value);
        $unknownTopLevelKeys = array_diff($topLevelKeys, ['structured', 'custom_fields']);

        if ($unknownTopLevelKeys !== []) {
            return $value;
        }

        $structured = [];
        $structuredSource = is_array($value['structured'] ?? null) ? $value['structured'] : [];

        foreach (self::structuredFieldNames() as $fieldName) {
            if (! array_key_exists($fieldName, $structuredSource)) {
                continue;
            }

            $normalizedField = self::normalizeEntry($structuredSource[$fieldName]);
            if ($normalizedField === null) {
                continue;
            }

            $structured[$fieldName] = $normalizedField;
        }

        $customFields = [];
        $customSource = is_array($value['custom_fields'] ?? null) ? $value['custom_fields'] : [];

        foreach ($customSource as $index => $field) {
            if (! is_array($field)) {
                continue;
            }

            $label = isset($field['label']) && is_string($field['label'])
                ? trim($field['label'])
                : '';
            $normalizedField = self::normalizeEntry($field);

            if ($label === '' || $normalizedField === null) {
                continue;
            }

            $sortOrder = isset($field['sort_order']) && is_numeric($field['sort_order'])
                ? (int) $field['sort_order']
                : $index + 1;

            $customFields[] = array_merge([
                'label' => $label,
            ], $normalizedField, [
                'sort_order' => $sortOrder,
            ]);
        }

        if ($structured === [] && $customFields === []) {
            return null;
        }

        return array_filter([
            'structured' => $structured === [] ? null : $structured,
            'custom_fields' => $customFields === [] ? null : $customFields,
        ], static fn ($entry) => $entry !== null);
    }

    /**
     * @return array{value: float|int|null, min: float|int|null, max: float|int|null, note: string|null}|null
     */
    private static function normalizeEntry(mixed $value): ?array
    {
        if (is_numeric($value)) {
            return [
                'value' => self::normalizeNumber($value),
                'min' => null,
                'max' => null,
                'note' => null,
            ];
        }

        if (! is_array($value)) {
            return null;
        }

        $min = self::normalizeNumber($value['min'] ?? null);
        $max = self::normalizeNumber($value['max'] ?? null);
        $rangeIsSet = $min !== null || $max !== null;
        $normalizedValue = $rangeIsSet
            ? null
            : self::normalizeNumber($value['value'] ?? null);
        $note = isset($value['note']) && is_string($value['note']) && trim($value['note']) !== ''
            ? trim($value['note'])
            : null;

        if ($normalizedValue === null && ! $rangeIsSet) {
            return null;
        }

        return [
            'value' => $normalizedValue,
            'min' => $min,
            'max' => $max,
            'note' => $note,
        ];
    }

    /**
     * @return float|int|null
     */
    private static function normalizeNumber(mixed $value)
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return null;
        }

        $normalizedValue = $value + 0;

        return is_float($normalizedValue) || is_int($normalizedValue)
            ? $normalizedValue
            : null;
    }
}
