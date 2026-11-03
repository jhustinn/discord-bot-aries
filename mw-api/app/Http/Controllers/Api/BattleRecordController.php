<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BattleRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BattleRecordController extends Controller
{
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);
        $shipClass = $request->query('ship_class');
        $status = $request->query('status');
        $userId = $request->query('user_id');

        $query = BattleRecord::query()->orderBy('submitted_at', 'desc');

        if ($shipClass && $shipClass !== 'all') {
            $query->where('ship_class', strtolower(trim($shipClass)));
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($userId) {
            $query->where('discord_user_id', $userId);
        }

        $total = $query->count();
        $data = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'success' => true,
            'total' => $total,
            'data' => $data
        ]);
    }

    public function store(Request $request)
    {
        $damage = (int) $request->input('damage');
        $shipName = $request->input('ship_name');
        $shipClass = strtolower(trim($request->input('ship_class', 'frigates')));

        // Check existing top clan record for this ship
        $previousRecord = BattleRecord::where('ship_name', $shipName)
            ->where('status', 'APPROVED')
            ->orderBy('damage', 'desc')
            ->first();

        $isNewClanRecord = (!$previousRecord || $damage > $previousRecord->damage);

        $record = BattleRecord::create([
            'id' => $request->input('id', (string) Str::uuid()),
            'discord_user_id' => $request->input('discord_user_id'),
            'player_id' => $request->input('player_id'),
            'player_name' => $request->input('player_name'),
            'ship_name' => $shipName,
            'ship_class' => $shipClass,
            'damage' => $damage,
            'kills' => (int) $request->input('kills', 0),
            'assists' => (int) $request->input('assists', 0),
            'map_name' => $request->input('map_name', 'Unknown Map'),
            'game_mode' => $request->input('game_mode', 'Random Battle'),
            'screenshot_url' => $request->input('screenshot_url'),
            'rewards_screenshot_url' => $request->input('rewards_screenshot_url'),
            'extracted_ocr_text' => $request->input('extracted_ocr_text'),
            'raw_ocr_data' => $request->input('raw_ocr_data'),
            'status' => $request->input('status', 'APPROVED'),
            'is_ship_record' => $isNewClanRecord,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'isNewClanRecord' => $isNewClanRecord,
            'previousRecord' => $previousRecord,
            'record' => $record
        ], 201);
    }

    public function leaderboard(string $shipClass)
    {
        $normClass = strtolower(trim($shipClass));

        // Get top records grouped by ship
        $records = BattleRecord::where('ship_class', $normClass)
            ->where('status', 'APPROVED')
            ->orderBy('damage', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'shipClass' => $normClass,
            'data' => $records
        ]);
    }

    public function destroy(string $id)
    {
        $record = BattleRecord::find($id);
        if ($record) {
            $record->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Battle record deleted successfully'
        ]);
    }
}
