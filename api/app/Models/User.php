<?php

namespace App\Models;

use App\Services\Settings\UserTpoService;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'visible_category_ids',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'visible_category_ids',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'visible_category_ids' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (self $user): void {
            app(UserTpoService::class)->ensurePresets($user);
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function outfits(): HasMany
    {
        return $this->hasMany(Outfit::class);
    }

    public function brands(): HasMany
    {
        return $this->hasMany(UserBrand::class);
    }

    public function purchaseCandidateGroups(): HasMany
    {
        return $this->hasMany(PurchaseCandidateGroup::class);
    }

    public function preference(): HasOne
    {
        return $this->hasOne(UserPreference::class);
    }
}
