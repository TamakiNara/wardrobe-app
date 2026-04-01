<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseCandidateMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_candidate_id',
        'part_label',
        'material_name',
        'ratio',
    ];

    protected $casts = [
        'ratio' => 'integer',
    ];

    public function purchaseCandidate(): BelongsTo
    {
        return $this->belongsTo(PurchaseCandidate::class);
    }
}
