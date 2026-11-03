<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VerificationTicket;
use App\Models\VerifiedPlayer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);
        $status = $request->query('status');
        $userId = $request->query('user_id');

        $query = VerificationTicket::query()->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('ticket_status', $status);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $total = $query->count();
        $data = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'success' => true,
            'total' => $total,
            'data' => $data
        ]);
    }

    public function show(string $ticketId)
    {
        $ticket = VerificationTicket::where('ticket_id', $ticketId)->first();
        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ticket
        ]);
    }

    public function store(Request $request)
    {
        $ticketId = $request->input('ticket_id', (string) Str::uuid());

        $ticket = VerificationTicket::create([
            'ticket_id' => $ticketId,
            'user_id' => $request->input('user_id'),
            'in_game_name' => $request->input('in_game_name'),
            'player_id' => $request->input('player_id'),
            'player_name' => $request->input('player_name'),
            'player_level' => $request->input('player_level'),
            'extracted_text' => $request->input('extracted_text'),
            'permanent_image_url' => $request->input('permanent_image_url'),
            'ticket_status' => $request->input('ticket_status', 'PENDING')
        ]);

        return response()->json([
            'success' => true,
            'data' => $ticket
        ], 201);
    }

    public function updateStatus(Request $request, string $ticketId)
    {
        $ticket = VerificationTicket::where('ticket_id', $ticketId)->first();
        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found'], 404);
        }

        $status = $request->input('ticket_status') ?? $request->input('status');
        $ticket->ticket_status = $status;
        $ticket->save();

        // If approved, upsert into verified_players
        if (strtoupper($status) === 'APPROVED' && $ticket->player_id) {
            VerifiedPlayer::updateOrCreate(
                ['player_id' => $ticket->player_id],
                [
                    'discord_user_id' => $ticket->user_id,
                    'player_name' => $ticket->player_name ?? $ticket->in_game_name ?? 'Sailor',
                    'player_level' => $ticket->player_level ?? 1,
                    'clan_tag' => 'ARIES',
                    'status' => 'ACTIVE',
                    'verified_at' => now(),
                    'ticket_id' => $ticket->ticket_id
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Ticket status updated to {$status}",
            'data' => $ticket
        ]);
    }

    public function stats()
    {
        $totalUsers = \App\Models\VerificationTicket::distinct('user_id')->count('user_id');
        $totalTickets = VerificationTicket::count();
        $pending = VerificationTicket::where('ticket_status', 'PENDING')->count();
        $approved = VerificationTicket::where('ticket_status', 'APPROVED')->count();

        return response()->json([
            'success' => true,
            'totalUsers' => $totalUsers,
            'totalTickets' => $totalTickets,
            'pending' => $pending,
            'approved' => $approved
        ]);
    }
}
