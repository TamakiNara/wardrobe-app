<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'part_label',
        'material_name',
        'ratio',
    ];

    protected $casts = [
        'ratio' => 'integer',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
