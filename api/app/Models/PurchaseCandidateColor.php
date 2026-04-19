<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseCandidateColor extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_candidate_id',
        'role',
        'mode',
        'value',
        'hex',
        'label',
        'custom_label',
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
