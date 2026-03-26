<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $table = 'user_preferences';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'current_season',
        'default_wear_log_status',
        'calendar_week_start',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
