<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseCandidateTpo extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_candidate_id',
        'tpo',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function purchaseCandidate(): BelongsTo
    {
        return $this->belongsTo(PurchaseCandidate::class);
    }
}
