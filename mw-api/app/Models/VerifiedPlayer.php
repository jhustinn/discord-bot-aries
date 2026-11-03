<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerifiedPlayer extends Model
{
    protected $table = 'verified_players';
    protected $primaryKey = 'player_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'player_id',
        'discord_user_id',
        'player_name',
        'player_level',
        'clan_tag',
        'timezone',
        'timezone_offset',
        'region',
        'status',
        'notes',
        'verified_at',
        'verified_by',
        'ticket_id'
    ];
}
