<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClanSeason extends Model
{
    use HasUuids;

    protected $table = 'clan_season';
    protected $primaryKey = 'season_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'season_id',
        'season_name',
        'season_number',
        'description',
        'start_date',
        'end_date',
        'duration_days',
        'status',
        'total_wars',
        'wins',
        'losses',
        'draws',
        'total_points_earned',
        'total_points_spent',
        'total_participants'
    ];
}
