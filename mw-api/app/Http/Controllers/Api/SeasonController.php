<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClanSeason;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SeasonController extends Controller
{
    public function index()
    {
        $seasons = ClanSeason::orderBy('season_number', 'desc')->get();

        return response()->json([
            'success' => true,
            'total' => $seasons->count(),
            'data' => $seasons
        ]);
    }

    public function store(Request $request)
    {
        $season = ClanSeason::create([
            'season_id' => $request->input('season_id', (string) Str::uuid()),
            'season_name' => $request->input('season_name'),
            'season_number' => (int) $request->input('season_number'),
            'description' => $request->input('description'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'duration_days' => (int) $request->input('duration_days', 30),
            'status' => $request->input('status', 'ACTIVE')
        ]);

        return response()->json([
            'success' => true,
            'data' => $season
        ], 201);
    }
}
