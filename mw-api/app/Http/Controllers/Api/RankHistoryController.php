<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RankHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RankHistoryController extends Controller
{
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);
        $seasonNumber = $request->query('season_number');
        $userId = $request->query('user_id');

        $query = RankHistory::query()->orderBy('submitted_at', 'desc');

        if ($seasonNumber) {
            $query->where('season_number', (int) $seasonNumber);
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

    public function userHistory(string $userId)
    {
        $history = RankHistory::where('discord_user_id', $userId)
            ->orderBy('season_number', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'userId' => $userId,
            'total' => $history->count(),
            'data' => $history
        ]);
    }

    public function store(Request $request)
    {
        $userId = $request->input('discord_user_id');
        $seasonNumber = (int) $request->input('season_number');

        $existing = RankHistory::where('discord_user_id', $userId)
            ->where('season_number', $seasonNumber)
            ->first();

        $payload = [
            'discord_user_id' => $userId,
            'player_id' => $request->input('player_id'),
            'player_name' => $request->input('player_name'),
            'player_level' => $request->input('player_level'),
            'season_number' => $seasonNumber,
            'season_name' => $request->input('season_name', "Season {$seasonNumber}"),
            'current_rank' => $request->input('current_rank', 'Unranked'),
            'best_rank' => $request->input('best_rank', 'Unranked'),
            'rank_points' => (int) $request->input('rank_points', 0),
            'clan_points' => (int) $request->input('clan_points', 0),
            'permanent_image_url' => $request->input('permanent_image_url'),
            'extracted_text' => $request->input('extracted_text'),
            'raw_ocr_data' => $request->input('raw_ocr_data'),
        ];

        if ($existing) {
            $existing->update($payload);
            $record = $existing;
            $isUpdate = true;
        } else {
            $payload['id'] = (string) Str::uuid();
            $payload['submitted_at'] = now();
            $record = RankHistory::create($payload);
            $isUpdate = false;
        }

        return response()->json([
            'success' => true,
            'isUpdate' => $isUpdate,
            'data' => $record
        ]);
    }

    public function destroy(string $id)
    {
        $record = RankHistory::find($id);
        if ($record) {
            $record->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Rank submission deleted successfully'
        ]);
    }
}
