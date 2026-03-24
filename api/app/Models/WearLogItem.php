<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WearLogItem extends Model
{
    protected $fillable = [
        'wear_log_id',
        'source_item_id',
        'item_source_type',
        'sort_order',
    ];

    public function wearLog(): BelongsTo
    {
        return $this->belongsTo(WearLog::class);
    }

    public function sourceItem(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'source_item_id');
    }
}
