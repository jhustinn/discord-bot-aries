<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Ship extends Model
{
    use HasUuids;

    protected $table = 'ships';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'class',
        'tier',
        'category',
        'country',
        'aliases',
        'image_url',
        'description',
        'is_active',
    ];

    protected $casts = [
        'aliases' => 'array',
        'tier' => 'integer',
        'is_active' => 'boolean',
    ];
}
