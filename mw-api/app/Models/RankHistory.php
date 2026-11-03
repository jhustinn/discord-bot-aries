<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RankHistory extends Model
{
    use HasUuids;

    protected $table = 'rank_history';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'discord_user_id',
        'player_id',
        'player_name',
        'player_level',
        'season_number',
        'season_name',
        'current_rank',
        'best_rank',
        'rank_points',
        'clan_points',
        'permanent_image_url',
        'extracted_text',
        'raw_ocr_data',
        'submitted_at'
    ];

    protected $casts = [
        'raw_ocr_data' => 'array',
        'season_number' => 'integer',
        'rank_points' => 'integer',
        'clan_points' => 'integer',
    ];
}
