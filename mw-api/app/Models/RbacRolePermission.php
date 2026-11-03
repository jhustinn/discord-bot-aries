<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RbacRolePermission extends Model
{
    use HasUuids;

    protected $table = 'rbac_role_permissions';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'role_id',
        'permission_id',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(RbacRole::class, 'role_id', 'role_id');
    }

    public function permission(): BelongsTo
    {
        return $this->belongsTo(RbacPermission::class, 'permission_id', 'permission_id');
    }
}
