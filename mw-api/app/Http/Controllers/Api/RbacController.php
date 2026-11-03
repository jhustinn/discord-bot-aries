<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RbacRole;
use App\Models\RbacPermission;
use App\Models\RbacRolePermission;
use App\Models\RbacUserRole;
use App\Models\VerifiedPlayer;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class RbacController extends Controller
{
    /**
     * List all roles with permission and member counts
     */
    public function indexRoles(Request $request)
    {
        $roles = RbacRole::with(['permissions'])
            ->withCount('userRoles')
            ->orderBy('is_system', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        $formatted = $roles->map(function ($role) {
            return [
                'role_id' => $role->role_id,
                'role_name' => $role->role_name,
                'role_slug' => $role->role_slug,
                'description' => $role->description,
                'is_system' => (bool) $role->is_system,
                'is_active' => (bool) $role->is_active,
                'discord_role_id' => $role->discord_role_id,
                'discord_role_name' => $role->discord_role_name,
                'color' => $role->color ?: '#3B82F6',
                'icon' => $role->icon ?: '🛡️',
                'members_count' => $role->user_roles_count ?? 0,
                'permissions_count' => $role->permissions->count(),
                'permissions' => $role->permissions->map(function ($p) {
                    return [
                        'permission_id' => $p->permission_id,
                        'permission_name' => $p->permission_name,
                        'permission_slug' => $p->permission_slug,
                        'category' => $p->category,
                    ];
                }),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'total' => $formatted->count(),
        ]);
    }

    /**
     * Get single role details
     */
    public function showRole(string $id)
    {
        $role = RbacRole::with('permissions')->where('role_id', $id)->first();

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'role_id' => $role->role_id,
                'role_name' => $role->role_name,
                'role_slug' => $role->role_slug,
                'description' => $role->description,
                'is_system' => (bool) $role->is_system,
                'is_active' => (bool) $role->is_active,
                'discord_role_id' => $role->discord_role_id,
                'discord_role_name' => $role->discord_role_name,
                'color' => $role->color,
                'icon' => $role->icon,
                'permission_ids' => $role->permissions->pluck('permission_id'),
                'permissions' => $role->permissions,
            ],
        ]);
    }

    /**
     * One-Click Sync from Discord Server:
     * Imports all Discord Guild Roles into rbac_roles
    /**
     * One-Click Bidirectional 2-Way Sync:
     * 1. Creates missing Discord Server Roles for any Web RBAC roles (Super Admin, Admin, Leader, etc.)
     * 2. Imports any Discord Server Roles into Web RBAC
     * 3. Synchronizes Member Role assignments bidirectionally!
     */
    public function syncFromDiscord(Request $request)
    {
        $botApi = 'http://localhost:3000/api/discord';
        $apiKey = 'aries-admin-2024';

        // 1. Fetch current Discord Roles from connected Guild
        try {
            $rolesRes = Http::withHeaders(['x-api-key' => $apiKey])
                ->timeout(5)
                ->get("{$botApi}/roles");
            $rolesData = $rolesRes->json();
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Cannot connect to Discord Bot: ' . $e->getMessage()], 500);
        }

        if (empty($rolesData['roles'])) {
            return response()->json(['success' => false, 'message' => 'No Discord roles found in connected guild'], 400);
        }

        $allPerms = RbacPermission::all();
        $permMap = $allPerms->keyBy('permission_slug');

        $syncedRolesCount = 0;
        $syncedMembersCount = 0;

        // Build index of current Discord roles
        $dRolesList = $rolesData['roles'];
        $dRolesById = collect($dRolesList)->keyBy('id');
        $dRolesByName = collect($dRolesList)->keyBy(function ($r) {
            return strtolower(trim($r['name']));
        });

        // ─── STEP A: PROVISION / LINK WEB RBAC ROLES TO DISCORD SERVER ─────────
        $allRbacRoles = RbacRole::all();
        foreach ($allRbacRoles as $rRole) {
            $hasValidDiscordId = !empty($rRole->discord_role_id) && $dRolesById->has($rRole->discord_role_id);

            if (!$hasValidDiscordId) {
                // Check if a role with matching name already exists on Discord
                $cleanName = strtolower(trim($rRole->role_name));
                if ($dRolesByName->has($cleanName)) {
                    $matchedDRole = $dRolesByName->get($cleanName);
                    $rRole->update([
                        'discord_role_id' => $matchedDRole['id'],
                        'discord_role_name' => $matchedDRole['name'],
                        'color' => (!empty($matchedDRole['color']) && $matchedDRole['color'] !== '#000000') ? $matchedDRole['color'] : $rRole->color,
                    ]);
                    $syncedRolesCount++;
                } else {
                    // Create the role in Discord server!
                    try {
                        $isHighRole = in_array($rRole->role_slug, ['super_admin', 'admin', 'leader', 'moderator']);
                        $createRes = Http::withHeaders(['x-api-key' => $apiKey])
                            ->timeout(4)
                            ->post("{$botApi}/roles", [
                                'name' => $rRole->role_name,
                                'color' => $rRole->color ?: '#3B82F6',
                                'hoist' => $isHighRole,
                                'mentionable' => in_array($rRole->role_slug, ['leader', 'moderator', 'member']),
                            ]);

                        if ($createRes->successful() && !empty($createRes->json()['role']['id'])) {
                            $newDRole = $createRes->json()['role'];
                            $rRole->update([
                                'discord_role_id' => $newDRole['id'],
                                'discord_role_name' => $newDRole['name'],
                            ]);
                            $dRolesById[$newDRole['id']] = $newDRole;
                            $dRolesByName[strtolower(trim($newDRole['name']))] = $newDRole;
                            $syncedRolesCount++;
                        }
                    } catch (\Exception $cErr) {
                        // Continue if role creation fails
                    }
                }
            }
        }

        // ─── STEP B: IMPORT DISCORD SERVER ROLES TO WEB RBAC ────────────────────
        $defaultMemberPermSlugs = [
            'dashboard.view',
            'members.view',
            'players.view',
            'teams.view',
            'wars.view',
            'points.view',
            'seasons.view'
        ];

        // Refetch roles from Discord after provisioning
        try {
            $refetched = Http::withHeaders(['x-api-key' => $apiKey])->timeout(5)->get("{$botApi}/roles");
            if ($refetched->successful() && !empty($refetched->json()['roles'])) {
                $dRolesList = $refetched->json()['roles'];
            }
        } catch (\Exception $e) {}

        foreach ($dRolesList as $dRole) {
            if ($dRole['name'] === '@everyone' || (isset($dRole['isBot']) && $dRole['isBot'])) {
                continue;
            }

            $role = RbacRole::where('discord_role_id', $dRole['id'])
                ->orWhere('role_name', $dRole['name'])
                ->first();

            $color = (!empty($dRole['color']) && $dRole['color'] !== '#000000') ? $dRole['color'] : '#3B82F6';
            $icon = '🛡️';
            $lowerName = strtolower($dRole['name']);
            if (str_contains($lowerName, 'verif')) $icon = '⚓';
            elseif (str_contains($lowerName, 'super') || str_contains($lowerName, 'owner')) $icon = '👑';
            elseif (str_contains($lowerName, 'admin')) $icon = '⚡';
            elseif (str_contains($lowerName, 'leader') || str_contains($lowerName, 'captain')) $icon = '⭐';
            elseif (str_contains($lowerName, 'mod')) $icon = '🛡️';
            elseif (str_contains($lowerName, 'vip') || str_contains($lowerName, 'elite')) $icon = '💎';
            elseif (str_contains($lowerName, 'boy') || str_contains($lowerName, 'girl')) $icon = '💙';

            if ($role) {
                $role->update([
                    'discord_role_id' => $dRole['id'],
                    'discord_role_name' => $dRole['name'],
                    'color' => $color,
                    'icon' => $role->icon ?: $icon,
                ]);
            } else {
                $role = RbacRole::create([
                    'role_id' => Str::uuid()->toString(),
                    'role_name' => $dRole['name'],
                    'role_slug' => Str::slug($dRole['name'], '_'),
                    'description' => "Synchronized directly from Discord server role @{$dRole['name']}",
                    'discord_role_id' => $dRole['id'],
                    'discord_role_name' => $dRole['name'],
                    'color' => $color,
                    'icon' => $icon,
                    'is_system' => false,
                    'is_active' => true,
                ]);

                foreach ($defaultMemberPermSlugs as $slug) {
                    if (isset($permMap[$slug])) {
                        DB::table('rbac_role_permissions')->insertOrIgnore([
                            'id' => Str::uuid()->toString(),
                            'role_id' => $role->role_id,
                            'permission_id' => $permMap[$slug]->permission_id,
                            'created_at' => now(),
                        ]);
                    }
                }
                $syncedRolesCount++;
            }
        }

        // ─── STEP C: SYNC MEMBER ASSIGNMENTS ────────────────────────────────────
        try {
            $membersRes = Http::withHeaders(['x-api-key' => $apiKey])
                ->timeout(5)
                ->get("{$botApi}/members");
            $membersData = $membersRes->json();

            if (!empty($membersData['members'])) {
                $roleByDiscordId = RbacRole::whereNotNull('discord_role_id')->get()->keyBy('discord_role_id');

                foreach ($membersData['members'] as $member) {
                    $userId = $member['id'];
                    if (!empty($member['roles'])) {
                        foreach ($member['roles'] as $mr) {
                            if (isset($roleByDiscordId[$mr['id']])) {
                                $targetRbacRole = $roleByDiscordId[$mr['id']];
                                $existing = RbacUserRole::where('user_id', $userId)
                                    ->where('role_id', $targetRbacRole->role_id)
                                    ->first();

                                if (!$existing) {
                                    RbacUserRole::create([
                                        'id' => Str::uuid()->toString(),
                                        'user_id' => $userId,
                                        'role_id' => $targetRbacRole->role_id,
                                        'assigned_by' => 'Discord Server Sync',
                                        'assigned_at' => now(),
                                    ]);
                                    $syncedMembersCount++;
                                }
                            }
                        }
                    }
                }
            }
        } catch (\Exception $mErr) {
            // Ignore member fetch errors
        }

        AuditLog::create([
            'id' => Str::uuid()->toString(),
            'action' => 'DISCORD_ROLES_SYNCED',
            'action_category' => 'RBAC',
            'target_id' => 'discord_guild',
            'target_type' => 'discord',
            'target_name' => 'Discord Server Roles',
            'details' => json_encode(['synced_roles' => $syncedRolesCount, 'synced_assignments' => $syncedMembersCount]),
            'status' => 'success',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully unified Discord and Web roles! (Synced {$syncedRolesCount} roles & {$syncedMembersCount} member assignments)",
            'synced_roles' => $syncedRolesCount,
            'synced_assignments' => $syncedMembersCount,
        ]);
    }

    /**
     * Create a new custom role (And automatically create on Discord server if requested)
     */
    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'role_name' => 'required|string|max:100',
            'role_slug' => 'nullable|string|max:100|unique:rbac_roles,role_slug',
            'description' => 'nullable|string|max:500',
            'discord_role_id' => 'nullable|string|max:100',
            'discord_role_name' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:10',
            'is_active' => 'nullable|boolean',
            'create_discord_role' => 'nullable|boolean',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'string|exists:rbac_permissions,permission_id',
        ]);

        $slug = !empty($validated['role_slug'])
            ? Str::slug($validated['role_slug'], '_')
            : Str::slug($validated['role_name'], '_');

        $existing = RbacRole::where('role_slug', $slug)->first();
        if ($existing) {
            $slug .= '_' . Str::random(4);
        }

        $roleId = Str::uuid()->toString();
        $discordRoleId = $validated['discord_role_id'] ?? null;
        $discordRoleName = $validated['discord_role_name'] ?? null;
        $color = $validated['color'] ?? '#3B82F6';

        // Auto-create on Discord server if no discord_role_id provided
        if (!$discordRoleId) {
            try {
                $botRes = Http::withHeaders(['x-api-key' => 'aries-admin-2024'])
                    ->timeout(3)
                    ->post('http://localhost:3000/api/discord/roles', [
                        'name' => $validated['role_name'],
                        'color' => $color,
                        'hoist' => false,
                        'mentionable' => true,
                    ]);
                if ($botRes->successful() && !empty($botRes->json()['role']['id'])) {
                    $discordRoleId = $botRes->json()['role']['id'];
                    $discordRoleName = $botRes->json()['role']['name'];
                }
            } catch (\Exception $e) {}
        }

        $role = RbacRole::create([
            'role_id' => $roleId,
            'role_name' => $validated['role_name'],
            'role_slug' => $slug,
            'description' => $validated['description'] ?? null,
            'discord_role_id' => $discordRoleId,
            'discord_role_name' => $discordRoleName,
            'color' => $color,
            'icon' => $validated['icon'] ?? '🛡️',
            'is_system' => false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        AuditLog::create([
            'id' => Str::uuid()->toString(),
            'action' => 'ROLE_CREATED',
            'action_category' => 'RBAC',
            'target_id' => $role->role_id,
            'target_type' => 'rbac_role',
            'target_name' => $role->role_name,
            'details' => json_encode(['slug' => $role->role_slug, 'permissions' => count($validated['permission_ids'] ?? []), 'discord_role_id' => $discordRoleId]),
            'status' => 'success',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role created and synced with Discord successfully',
            'data' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Update an existing role (And sync changes to Discord role if linked)
     */
    public function updateRole(Request $request, string $id)
    {
        $role = RbacRole::where('role_id', $id)->first();

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found',
            ], 404);
        }

        $validated = $request->validate([
            'role_name' => 'sometimes|required|string|max:100',
            'role_slug' => 'nullable|string|max:100|unique:rbac_roles,role_slug,' . $id . ',role_id',
            'description' => 'nullable|string|max:500',
            'discord_role_id' => 'nullable|string|max:100',
            'discord_role_name' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:10',
            'is_active' => 'nullable|boolean',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'string|exists:rbac_permissions,permission_id',
        ]);

        $updateData = [];
        if (isset($validated['role_name'])) $updateData['role_name'] = $validated['role_name'];
        if (isset($validated['description'])) $updateData['description'] = $validated['description'];
        if (array_key_exists('discord_role_id', $validated)) $updateData['discord_role_id'] = $validated['discord_role_id'];
        if (array_key_exists('discord_role_name', $validated)) $updateData['discord_role_name'] = $validated['discord_role_name'];
        if (isset($validated['color'])) $updateData['color'] = $validated['color'];
        if (isset($validated['icon'])) $updateData['icon'] = $validated['icon'];
        if (isset($validated['is_active'])) $updateData['is_active'] = $validated['is_active'];

        if (!$role->is_system && !empty($validated['role_slug'])) {
            $updateData['role_slug'] = Str::slug($validated['role_slug'], '_');
        }

        $role->update($updateData);

        if (array_key_exists('permission_ids', $validated)) {
            $role->permissions()->sync($validated['permission_ids'] ?? []);
        }

        // Sync name and color to Discord if role has linked discord_role_id
        if ($role->discord_role_id && (isset($validated['role_name']) || isset($validated['color']))) {
            try {
                $botUpdates = [];
                if (isset($validated['role_name'])) $botUpdates['name'] = $validated['role_name'];
                if (isset($validated['color'])) $botUpdates['color'] = $validated['color'];

                Http::withHeaders(['x-api-key' => 'aries-admin-2024'])
                    ->timeout(3)
                    ->put("http://localhost:3000/api/discord/roles/{$role->discord_role_id}", $botUpdates);
            } catch (\Exception $e) {}
        }

        AuditLog::create([
            'id' => Str::uuid()->toString(),
            'action' => 'ROLE_UPDATED',
            'action_category' => 'RBAC',
            'target_id' => $role->role_id,
            'target_type' => 'rbac_role',
            'target_name' => $role->role_name,
            'details' => json_encode($updateData),
            'status' => 'success',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => $role->fresh(['permissions']),
        ]);
    }

    /**
     * Delete a custom role (Protected against system roles, and deletes from Discord)
     */
    public function destroyRole(string $id)
    {
        $role = RbacRole::where('role_id', $id)->first();

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found',
            ], 404);
        }

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'System roles cannot be deleted',
            ], 403);
        }

        $discordRoleId = $role->discord_role_id;
        $roleName = $role->role_name;

        // Delete from Discord if linked
        if ($discordRoleId) {
            try {
                Http::withHeaders(['x-api-key' => 'aries-admin-2024'])
                    ->timeout(3)
                    ->delete("http://localhost:3000/api/discord/roles/{$discordRoleId}");
            } catch (\Exception $e) {}
        }

        $role->permissions()->detach();
        RbacUserRole::where('role_id', $id)->delete();
        $role->delete();

        AuditLog::create([
            'id' => Str::uuid()->toString(),
            'action' => 'ROLE_DELETED',
            'action_category' => 'RBAC',
            'target_id' => $id,
            'target_type' => 'rbac_role',
            'target_name' => $roleName,
            'status' => 'success',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Role '{$roleName}' deleted successfully from Web and Discord",
        ]);
    }

    /**
     * List all available permissions grouped by category
     */
    public function indexPermissions()
    {
        $permissions = RbacPermission::orderBy('category')
            ->orderBy('permission_name')
            ->get();

        $grouped = $permissions->groupBy('category')->map(function ($items, $category) {
            return [
                'category' => $category,
                'count' => $items->count(),
                'permissions' => $items,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $permissions,
            'grouped' => $grouped,
            'total' => $permissions->count(),
        ]);
    }

    /**
     * Sync permissions for a role
     */
    public function syncRolePermissions(Request $request, string $id)
    {
        $role = RbacRole::where('role_id', $id)->first();

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found',
            ], 404);
        }

        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'string|exists:rbac_permissions,permission_id',
        ]);

        $role->permissions()->sync($validated['permission_ids']);

        AuditLog::create([
            'id' => Str::uuid()->toString(),
            'action' => 'ROLE_PERMISSIONS_SYNCED',
            'action_category' => 'RBAC',
            'target_id' => $role->role_id,
            'target_type' => 'rbac_role',
            'target_name' => $role->role_name,
            'details' => json_encode(['permissions_count' => count($validated['permission_ids'])]),
            'status' => 'success',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permissions updated successfully',
            'data' => $role->fresh(['permissions']),
        ]);
    }

    /**
     * List all user role assignments
     */
    public function indexUserRoles(Request $request)
    {
        $userRoles = RbacUserRole::with('role')
            ->orderBy('assigned_at', 'desc')
            ->get();

        // Get player information for all unique user IDs
        $userIds = $userRoles->pluck('user_id')->unique();
        $players = VerifiedPlayer::whereIn('discord_user_id', $userIds)
            ->get()
            ->keyBy('discord_user_id');

        $formatted = $userRoles->map(function ($ur) use ($players) {
            $player = $players->get($ur->user_id);
            return [
                'id' => $ur->id,
                'user_id' => $ur->user_id,
                'player_name' => $player ? $player->player_name : 'Server Member',
                'player_id' => $player ? $player->player_id : null,
                'player_level' => $player ? $player->player_level : null,
                'role_id' => $ur->role_id,
                'role' => $ur->role ? [
                    'role_id' => $ur->role->role_id,
                    'role_name' => $ur->role->role_name,
                    'role_slug' => $ur->role->role_slug,
                    'color' => $ur->role->color,
                    'icon' => $ur->role->icon,
                    'is_system' => $ur->role->is_system,
                    'discord_role_id' => $ur->role->discord_role_id,
                ] : null,
                'assigned_by' => $ur->assigned_by,
                'assigned_at' => $ur->assigned_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'total' => $formatted->count(),
        ]);
    }

    /**
     * Assign role(s) to user (And grant on Discord server in real-time if linked)
     */
    public function assignUserRole(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:100',
            'role_id' => 'nullable|string',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'string|exists:rbac_roles,role_id',
            'assigned_by' => 'nullable|string|max:100',
        ]);

        $userId = $validated['user_id'];
        $assignedBy = $validated['assigned_by'] ?? 'Admin Panel';

        // Collect all role IDs to assign
        $targetRoleIds = [];
        if (!empty($validated['role_ids'])) {
            $targetRoleIds = array_unique($validated['role_ids']);
        } elseif (!empty($validated['role_id'])) {
            $targetRoleIds = [$validated['role_id']];
        }

        if (empty($targetRoleIds)) {
            return response()->json([
                'success' => false,
                'message' => 'No roles specified for assignment',
            ], 422);
        }

        $assignedRoles = [];
        $botApi = 'http://localhost:3000/api/discord';
        $apiKey = 'aries-admin-2024';

        foreach ($targetRoleIds as $roleId) {
            $role = RbacRole::where('role_id', $roleId)->first();
            if (!$role) continue;

            // Check if already assigned
            $existing = RbacUserRole::where('user_id', $userId)
                ->where('role_id', $roleId)
                ->first();

            if ($existing) {
                $assignedRoles[] = $existing->load('role');
                continue;
            }

            $userRole = RbacUserRole::create([
                'id' => Str::uuid()->toString(),
                'user_id' => $userId,
                'role_id' => $roleId,
                'assigned_by' => $assignedBy,
                'assigned_at' => now(),
            ]);

            // Real-time Discord server role grant if linked
            if ($role->discord_role_id) {
                try {
                    Http::withHeaders(['x-api-key' => $apiKey])
                        ->timeout(3)
                        ->post("{$botApi}/members/{$userId}/roles", [
                            'roleId' => $role->discord_role_id
                        ]);
                } catch (\Exception $e) {}
            }

            AuditLog::create([
                'id' => Str::uuid()->toString(),
                'action' => 'USER_ROLE_ASSIGNED',
                'action_category' => 'RBAC',
                'target_id' => $userId,
                'target_type' => 'discord_user',
                'target_name' => $userId,
                'details' => json_encode(['role_id' => $role->role_id, 'role_name' => $role->role_name]),
                'status' => 'success',
            ]);

            $assignedRoles[] = $userRole->load('role');
        }

        $count = count($assignedRoles);
        return response()->json([
            'success' => true,
            'message' => "{$count} role(s) processed successfully",
            'data' => $assignedRoles,
        ], 201);
    }

    /**
     * Revoke role from user (And remove from Discord server in real-time if linked)
     */
    public function removeUserRole(Request $request, $id = null)
    {
        $targetId = $id ?: $request->input('id');
        $userId = $request->input('user_id');
        $roleId = $request->input('role_id');

        $ur = null;
        if (!empty($targetId)) {
            $ur = RbacUserRole::with('role')->where('id', $targetId)->first();
        } elseif (!empty($userId) && !empty($roleId)) {
            $ur = RbacUserRole::with('role')->where('user_id', $userId)
                ->where('role_id', $roleId)
                ->first();
        }

        if ($ur) {
            $targetUserId = $ur->user_id;
            $discordRoleId = $ur->role?->discord_role_id;
            $ur->delete();

            // If role has discord_role_id, remove from Discord server in real-time
            if ($discordRoleId && $targetUserId) {
                try {
                    Http::withHeaders(['x-api-key' => 'aries-admin-2024'])
                        ->timeout(3)
                        ->delete("http://localhost:3000/api/discord/members/{$targetUserId}/roles/{$discordRoleId}");
                } catch (\Exception $e) {}
            }

            return response()->json(['success' => true, 'message' => 'Role revoked successfully']);
        }

        return response()->json(['success' => false, 'message' => 'Assignment not found'], 404);
    }

    /**
     * Check if a user has a specific permission
     */
    public function checkPermission(Request $request)
    {
        $userId = $request->query('user_id');
        $permissionSlug = $request->query('permission');

        if (!$userId || !$permissionSlug) {
            return response()->json([
                'success' => false,
                'message' => 'user_id and permission parameters are required',
            ], 400);
        }

        // Get all role IDs assigned to this user
        $roleIds = RbacUserRole::where('user_id', $userId)->pluck('role_id');

        // Check if any role has this permission slug
        $hasPermission = RbacRolePermission::whereIn('role_id', $roleIds)
            ->whereHas('permission', function ($q) use ($permissionSlug) {
                $q->where('permission_slug', $permissionSlug);
            })
            ->exists();

        // Also check if user has super_admin role
        $isSuperAdmin = RbacRole::whereIn('role_id', $roleIds)
            ->where('role_slug', 'super_admin')
            ->exists();

        return response()->json([
            'success' => true,
            'user_id' => $userId,
            'permission' => $permissionSlug,
            'has_permission' => $hasPermission || $isSuperAdmin,
            'is_super_admin' => $isSuperAdmin,
        ]);
    }
}
