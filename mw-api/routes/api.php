<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\BattleRecordController;
use App\Http\Controllers\Api\RankHistoryController;
use App\Http\Controllers\Api\ClanWarController;
use App\Http\Controllers\Api\SeasonController;
use App\Http\Controllers\Api\ShipController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RbacController;

// ─── RBAC (Roles & Permissions) ────────────────────────────────────────────
Route::get('/rbac/roles', [RbacController::class, 'indexRoles']);
Route::post('/rbac/roles', [RbacController::class, 'storeRole']);
Route::get('/rbac/roles/{id}', [RbacController::class, 'showRole']);
Route::put('/rbac/roles/{id}', [RbacController::class, 'updateRole']);
Route::delete('/rbac/roles/{id}', [RbacController::class, 'destroyRole']);
Route::get('/rbac/permissions', [RbacController::class, 'indexPermissions']);
Route::post('/rbac/roles/{id}/permissions', [RbacController::class, 'syncRolePermissions']);
Route::get('/rbac/user-roles', [RbacController::class, 'indexUserRoles']);
Route::post('/rbac/user-roles', [RbacController::class, 'assignUserRole']);
Route::post('/rbac/user-roles/revoke', [RbacController::class, 'removeUserRole']);
Route::delete('/rbac/user-roles/{id}', [RbacController::class, 'removeUserRole']);
Route::post('/rbac/sync-discord', [RbacController::class, 'syncFromDiscord']);
Route::get('/rbac/check', [RbacController::class, 'checkPermission']);

// ─── Realtime Notifications ────────────────────────────────────────────────
Route::get('/notifications/stream', [NotificationController::class, 'stream']);
Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications', [NotificationController::class, 'store']);
Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll']);

// ─── Authentication ────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::get('/me', [AuthController::class, 'me']);

// ─── Health & Ping ─────────────────────────────────────────────────────────
Route::get('/health', function () {
    return response()->json([
        'status' => 'online',
        'server' => 'Laravel MW API',
        'database' => 'PostgreSQL 17 Local',
        'time' => now()->toIso8601String()
    ]);
});

// ─── Master Ships ──────────────────────────────────────────────────────────
Route::get('/ships/classes', [ShipController::class, 'classes']);
Route::get('/ships', [ShipController::class, 'index']);
Route::get('/ships/{id}', [ShipController::class, 'show']);
Route::post('/ships', [ShipController::class, 'store']);
Route::put('/ships/{id}', [ShipController::class, 'update']);
Route::delete('/ships/{id}', [ShipController::class, 'destroy']);

// ─── Verification Tickets ──────────────────────────────────────────────────
Route::get('/tickets', [TicketController::class, 'index']);
Route::get('/tickets/stats', [TicketController::class, 'stats']);
Route::get('/tickets/{ticketId}', [TicketController::class, 'show']);
Route::post('/tickets', [TicketController::class, 'store']);
Route::patch('/tickets/{ticketId}/status', [TicketController::class, 'updateStatus']);

// ─── Verified Players ──────────────────────────────────────────────────────
Route::get('/players', [PlayerController::class, 'index']);
Route::get('/players/{playerId}', [PlayerController::class, 'show']);
Route::post('/players', [PlayerController::class, 'store']);
Route::put('/players/{playerId}', [PlayerController::class, 'update']);
Route::delete('/players/{playerId}', [PlayerController::class, 'destroy']);

// ─── Clan Battle Records ───────────────────────────────────────────────────
Route::get('/records', [BattleRecordController::class, 'index']);
Route::post('/records', [BattleRecordController::class, 'store']);
Route::get('/records/leaderboard/{shipClass}', [BattleRecordController::class, 'leaderboard']);
Route::delete('/records/{id}', [BattleRecordController::class, 'destroy']);

// ─── Seasonal Rank History ─────────────────────────────────────────────────
Route::get('/ranks', [RankHistoryController::class, 'index']);
Route::get('/ranks/user/{userId}', [RankHistoryController::class, 'userHistory']);
Route::post('/ranks', [RankHistoryController::class, 'store']);
Route::delete('/ranks/{id}', [RankHistoryController::class, 'destroy']);

// ─── Clan Wars & Rosters ───────────────────────────────────────────────────
Route::get('/wars', [ClanWarController::class, 'index']);
Route::get('/wars/{warId}', [ClanWarController::class, 'show']);
Route::post('/wars', [ClanWarController::class, 'store']);
Route::put('/wars/{warId}', [ClanWarController::class, 'update']);
Route::post('/wars/{warId}/roster', [ClanWarController::class, 'updateRoster']);

// ─── Clan Seasons ──────────────────────────────────────────────────────────
Route::get('/seasons', [SeasonController::class, 'index']);
Route::post('/seasons', [SeasonController::class, 'store']);
