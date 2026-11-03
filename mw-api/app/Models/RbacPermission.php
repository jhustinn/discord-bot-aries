<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RbacPermission extends Model
{
    use HasUuids;

    protected $table = 'rbac_permissions';
    protected $primaryKey = 'permission_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'permission_id',
        'permission_name',
        'permission_slug',
        'category',
        'description',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            RbacRole::class,
            'rbac_role_permissions',
            'permission_id',
            'role_id',
            'permission_id',
            'role_id'
        )->withTimestamps();
    }
}
