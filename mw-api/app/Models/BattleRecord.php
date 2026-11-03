<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BattleRecord extends Model
{
    use HasUuids;

    protected $table = 'battle_records';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'discord_user_id',
        'player_id',
        'player_name',
        'ship_name',
        'ship_class',
        'damage',
        'kills',
        'assists',
        'map_name',
        'game_mode',
        'screenshot_url',
        'rewards_screenshot_url',
        'extracted_ocr_text',
        'raw_ocr_data',
        'status',
        'is_ship_record',
        'submitted_at'
    ];

    protected $casts = [
        'raw_ocr_data' => 'array',
        'is_ship_record' => 'boolean',
        'damage' => 'integer',
        'kills' => 'integer',
        'assists' => 'integer',
    ];
}
