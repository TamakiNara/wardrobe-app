<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItemGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'group_id')
            ->orderBy('group_order')
            ->orderBy('id');
    }

    public function nextGroupOrder(): int
    {
        $maxOrder = $this->items()->max('group_order');

        return $maxOrder === null ? 1 : ((int) $maxOrder) + 1;
    }
}
