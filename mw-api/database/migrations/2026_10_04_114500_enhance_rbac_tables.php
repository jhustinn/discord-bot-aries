<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rbac_roles', function (Blueprint $table) {
            if (!Schema::hasColumn('rbac_roles', 'discord_role_id')) {
                $table->string('discord_role_id')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('rbac_roles', 'discord_role_name')) {
                $table->string('discord_role_name')->nullable()->after('discord_role_id');
            }
            if (!Schema::hasColumn('rbac_roles', 'color')) {
                $table->string('color')->default('#3B82F6')->after('discord_role_name');
            }
            if (!Schema::hasColumn('rbac_roles', 'icon')) {
                $table->string('icon')->default('🛡️')->after('color');
            }
        });

        // Seed default roles if empty
        $roleCount = DB::table('rbac_roles')->count();
        if ($roleCount === 0) {
            $roles = [
                [
                    'role_id' => Str::uuid()->toString(),
                    'role_name' => 'Super Admin',
                    'role_slug' => 'super_admin',
                    'description' => 'Full unrestricted system access across all Discord bot and web features',
                    'is_system' => true,
                    'is_active' => true,
                    'color' => '#DC2626',
                    'icon' => '👑',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'role_id' => Str::uuid()->toString(),
                    'role_name' => 'Admin',
                    'role_slug' => 'admin',
                    'description' => 'Clan administrator with access to verification, player management, and clan wars',
                    'is_system' => true,
                    'is_active' => true,
                    'color' => '#8B5CF6',
                    'icon' => '⚡',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'role_id' => Str::uuid()->toString(),
                    'role_name' => 'Leader',
                    'role_slug' => 'leader',
                    'description' => 'Clan leader / captain with war strategy, team management, and point awards',
                    'is_system' => true,
                    'is_active' => true,
                    'color' => '#F59E0B',
                    'icon' => '⭐',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'role_id' => Str::uuid()->toString(),
                    'role_name' => 'Moderator',
                    'role_slug' => 'moderator',
                    'description' => 'Verification reviewer, ticket handler, and member moderator',
                    'is_system' => true,
                    'is_active' => true,
                    'color' => '#10B981',
                    'icon' => '🛡️',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'role_id' => Str::uuid()->toString(),
                    'role_name' => 'Member',
                    'role_slug' => 'member',
                    'description' => 'Standard verified clan member with view access to records and schedules',
                    'is_system' => true,
                    'is_active' => true,
                    'color' => '#3B82F6',
                    'icon' => '⚓',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'role_id' => Str::uuid()->toString(),
                    'role_name' => 'Viewer',
                    'role_slug' => 'viewer',
                    'description' => 'Read-only observer access to public clan statistics and leaderboards',
                    'is_system' => true,
                    'is_active' => true,
                    'color' => '#6B7280',
                    'icon' => '👁️',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];

            foreach ($roles as $r) {
                DB::table('rbac_roles')->insert($r);
            }

            // Assign permissions
            $allPerms = DB::table('rbac_permissions')->get();
            $permMap = [];
            foreach ($allPerms as $p) {
                $permMap[$p->permission_slug] = $p->permission_id;
            }

            $dbRoles = DB::table('rbac_roles')->get()->keyBy('role_slug');

            // 1. Super Admin: All permissions
            if (isset($dbRoles['super_admin'])) {
                $superAdminId = $dbRoles['super_admin']->role_id;
                foreach ($allPerms as $p) {
                    DB::table('rbac_role_permissions')->insertOrIgnore([
                        'id' => Str::uuid()->toString(),
                        'role_id' => $superAdminId,
                        'permission_id' => $p->permission_id,
                        'created_at' => now(),
                    ]);
                }
            }

            // 2. Admin: Almost all permissions except system role deletion
            if (isset($dbRoles['admin'])) {
                $adminId = $dbRoles['admin']->role_id;
                foreach ($allPerms as $p) {
                    if ($p->permission_slug !== 'roles.delete') {
                        DB::table('rbac_role_permissions')->insertOrIgnore([
                            'id' => Str::uuid()->toString(),
                            'role_id' => $adminId,
                            'permission_id' => $p->permission_id,
                            'created_at' => now(),
                        ]);
                    }
                }
            }

            // 3. Leader: Teams, Wars, Points, Players, Seasons, Channels, Dashboard
            if (isset($dbRoles['leader'])) {
                $leaderId = $dbRoles['leader']->role_id;
                $leaderPermSlugs = [
                    'dashboard.view', 'dashboard.stats',
                    'members.view', 'members.manage', 'members.assign_role',
                    'players.view', 'players.manage', 'players.edit',
                    'teams.view', 'teams.manage', 'teams.create',
                    'wars.view', 'wars.create', 'wars.manage',
                    'points.view', 'points.award', 'points.deduct', 'points.manage',
                    'seasons.view', 'seasons.manage',
                    'channels.view', 'channels.manage',
                    'audit.view'
                ];
                foreach ($leaderPermSlugs as $slug) {
                    if (isset($permMap[$slug])) {
                        DB::table('rbac_role_permissions')->insertOrIgnore([
                            'id' => Str::uuid()->toString(),
                            'role_id' => $leaderId,
                            'permission_id' => $permMap[$slug],
                            'created_at' => now(),
                        ]);
                    }
                }
            }

            // 4. Moderator: Dashboard, Members, Players, Channels, Audit view, Points view
            if (isset($dbRoles['moderator'])) {
                $modId = $dbRoles['moderator']->role_id;
                $modPermSlugs = [
                    'dashboard.view', 'dashboard.stats',
                    'members.view', 'members.manage',
                    'players.view',
                    'teams.view',
                    'wars.view',
                    'points.view',
                    'seasons.view',
                    'channels.view',
                    'audit.view'
                ];
                foreach ($modPermSlugs as $slug) {
                    if (isset($permMap[$slug])) {
                        DB::table('rbac_role_permissions')->insertOrIgnore([
                            'id' => Str::uuid()->toString(),
                            'role_id' => $modId,
                            'permission_id' => $permMap[$slug],
                            'created_at' => now(),
                        ]);
                    }
                }
            }

            // 5. Member & Viewer: Read-only permissions
            foreach (['member', 'viewer'] as $slug) {
                if (isset($dbRoles[$slug])) {
                    $rid = $dbRoles[$slug]->role_id;
                    $viewPermSlugs = [
                        'dashboard.view',
                        'members.view',
                        'players.view',
                        'teams.view',
                        'wars.view',
                        'points.view',
                        'seasons.view'
                    ];
                    foreach ($viewPermSlugs as $pSlug) {
                        if (isset($permMap[$pSlug])) {
                            DB::table('rbac_role_permissions')->insertOrIgnore([
                                'id' => Str::uuid()->toString(),
                                'role_id' => $rid,
                                'permission_id' => $permMap[$pSlug],
                                'created_at' => now(),
                            ]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rbac_roles', function (Blueprint $table) {
            $table->dropColumn(['discord_role_id', 'discord_role_name', 'color', 'icon']);
        });
    }
};
