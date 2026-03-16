<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CategoryMaster extends Model
{
    use HasFactory;

    protected $table = 'category_master';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'group_id',
        'name',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(CategoryGroup::class, 'group_id');
    }

    public function presets(): BelongsToMany
    {
        return $this->belongsToMany(CategoryPreset::class, 'category_preset_categories', 'category_id', 'category_preset_id');
    }
}