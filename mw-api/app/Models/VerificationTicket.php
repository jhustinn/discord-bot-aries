<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class VerificationTicket extends Model
{
    use HasUuids;

    protected $table = 'verification_tickets';
    protected $primaryKey = 'ticket_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'ticket_id',
        'user_id',
        'in_game_name',
        'player_id',
        'player_name',
        'player_level',
        'extracted_text',
        'permanent_image_url',
        'ticket_status'
    ];
}
