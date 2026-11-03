<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClanWar extends Model
{
    use HasUuids;

    protected $table = 'clan_wars';
    protected $primaryKey = 'war_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'war_id',
        'our_team_id',
        'opponent_name',
        'opponent_team',
        'war_type',
        'team_size',
        'scheduled_at',
        'duration_minutes',
        'timezone',
        'status',
        'our_score',
        'their_score',
        'result',
        'strategy_notes',
        'war_notes',
        'created_by'
    ];
}
