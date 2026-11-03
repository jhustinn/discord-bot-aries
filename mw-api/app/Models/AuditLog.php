<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AuditLog extends Model
{
    use HasUuids;

    protected $table = 'audit_logs';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'action',
        'action_category',
        'user_id',
        'username',
        'target_id',
        'target_type',
        'target_name',
        'details',
        'old_value',
        'new_value',
        'status'
    ];

    protected $casts = [
        'details' => 'array',
    ];
}
