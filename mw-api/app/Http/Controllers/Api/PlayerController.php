<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VerifiedPlayer;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);
        $status = $request->query('status');
        $region = $request->query('region');
        $search = $request->query('search');

        $query = VerifiedPlayer::query()->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        if ($region) {
            $query->where('region', $region);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('player_name', 'ilike', "%{$search}%")
                  ->orWhere('player_id', 'ilike', "%{$search}%");
            });
        }

        $total = $query->count();
        $data = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'success' => true,
            'total' => $total,
            'data' => $data
        ]);
    }

    public function show(string $playerId)
    {
        $player = VerifiedPlayer::find($playerId);
        if (!$player) {
            return response()->json(['error' => 'Player not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $player
        ]);
    }

    public function store(Request $request)
    {
        $player = VerifiedPlayer::updateOrCreate(
            ['player_id' => $request->input('player_id')],
            $request->only([
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
            ])
        );

        return response()->json([
            'success' => true,
            'data' => $player
        ], 201);
    }

    public function update(Request $request, string $playerId)
    {
        $player = VerifiedPlayer::find($playerId);
        if (!$player) {
            return response()->json(['error' => 'Player not found'], 404);
        }

        $player->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $player
        ]);
    }

    public function destroy(string $playerId)
    {
        $player = VerifiedPlayer::find($playerId);
        if ($player) {
            $player->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Player deleted successfully'
        ]);
    }
}
