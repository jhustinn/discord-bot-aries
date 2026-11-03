<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RbacUserRole extends Model
{
    use HasUuids;

    protected $table = 'rbac_user_roles';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'role_id',
        'assigned_by',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(RbacRole::class, 'role_id', 'role_id');
    }

    public function verifiedPlayer(): BelongsTo
    {
        return $this->belongsTo(VerifiedPlayer::class, 'user_id', 'discord_user_id');
    }
}
