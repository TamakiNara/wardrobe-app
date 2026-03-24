<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseCandidateImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_candidate_id',
        'disk',
        'path',
        'original_filename',
        'mime_type',
        'file_size',
        'sort_order',
        'is_primary',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'sort_order' => 'integer',
        'is_primary' => 'boolean',
    ];

    public function purchaseCandidate(): BelongsTo
    {
        return $this->belongsTo(PurchaseCandidate::class);
    }
}
