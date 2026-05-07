<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShoppingMemoItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'shopping_memo_id',
        'purchase_candidate_id',
        'quantity',
        'priority',
        'memo',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'priority' => 'integer',
        'sort_order' => 'integer',
    ];

    public function shoppingMemo(): BelongsTo
    {
        return $this->belongsTo(ShoppingMemo::class);
    }

    public function purchaseCandidate(): BelongsTo
    {
        return $this->belongsTo(PurchaseCandidate::class);
    }
}
