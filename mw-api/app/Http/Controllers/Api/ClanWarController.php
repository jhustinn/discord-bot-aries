<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClanWar;
use App\Models\WarRoster;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClanWarController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $query = ClanWar::query()->orderBy('scheduled_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $wars = $query->get();

        return response()->json([
            'success' => true,
            'total' => $wars->count(),
            'data' => $wars
        ]);
    }

    public function show(string $warId)
    {
        $war = ClanWar::find($warId);
        if (!$war) {
            return response()->json(['error' => 'Clan war not found'], 404);
        }

        $roster = WarRoster::where('war_id', $warId)->get();

        return response()->json([
            'success' => true,
            'data' => $war,
            'roster' => $roster
        ]);
    }

    public function store(Request $request)
    {
        $war = ClanWar::create([
            'war_id' => $request->input('war_id', (string) Str::uuid()),
            'our_team_id' => $request->input('our_team_id'),
            'opponent_name' => $request->input('opponent_name'),
            'opponent_team' => $request->input('opponent_team'),
            'war_type' => $request->input('war_type', 'REGULAR'),
            'team_size' => (int) $request->input('team_size', 5),
            'scheduled_at' => $request->input('scheduled_at'),
            'duration_minutes' => (int) $request->input('duration_minutes', 30),
            'timezone' => $request->input('timezone', 'UTC'),
            'status' => $request->input('status', 'SCHEDULED'),
            'strategy_notes' => $request->input('strategy_notes'),
            'created_by' => $request->input('created_by'),
        ]);

        return response()->json([
            'success' => true,
            'data' => $war
        ], 201);
    }

    public function update(Request $request, string $warId)
    {
        $war = ClanWar::find($warId);
        if (!$war) {
            return response()->json(['error' => 'Clan war not found'], 404);
        }

        $war->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $war
        ]);
    }

    public function updateRoster(Request $request, string $warId)
    {
        $playerId = $request->input('player_id');

        $roster = WarRoster::updateOrCreate(
            ['war_id' => $warId, 'player_id' => $playerId],
            [
                'id' => $request->input('id', (string) Str::uuid()),
                'team_side' => $request->input('team_side', 'OUR'),
                'role' => $request->input('role', 'MEMBER'),
                'availability' => $request->input('availability', 'CONFIRMED'),
                'ship_loadout' => $request->input('ship_loadout'),
                'score' => $request->input('score'),
                'kills' => $request->input('kills'),
                'deaths' => $request->input('deaths'),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $roster
        ]);
    }
}
