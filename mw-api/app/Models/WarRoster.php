<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WarRoster extends Model
{
    use HasUuids;

    protected $table = 'war_roster';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'war_id',
        'player_id',
        'team_side',
        'role',
        'availability',
        'availability_notes',
        'ship_loadout',
        'score',
        'kills',
        'deaths'
    ];
}
