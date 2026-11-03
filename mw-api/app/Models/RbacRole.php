<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RbacRole extends Model
{
    use HasUuids;

    protected $table = 'rbac_roles';
    protected $primaryKey = 'role_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'role_id',
        'role_name',
        'role_slug',
        'description',
        'is_system',
        'is_active',
        'discord_role_id',
        'discord_role_name',
        'color',
        'icon',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            RbacPermission::class,
            'rbac_role_permissions',
            'role_id',
            'permission_id',
            'role_id',
            'permission_id'
        )->withTimestamps();
    }

    public function userRoles(): HasMany
    {
        return $this->hasMany(RbacUserRole::class, 'role_id', 'role_id');
    }
}
