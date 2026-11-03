<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Discord Users
        Schema::create('discord_users', function (Blueprint $table) {
            $table->string('user_id')->primary();
            $table->string('username');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
        });

        // 2. Verification Tickets
        Schema::create('verification_tickets', function (Blueprint $table) {
            $table->uuid('ticket_id')->primary();
            $table->string('user_id');
            $table->string('in_game_name')->nullable();
            $table->string('player_id')->nullable();
            $table->string('player_name')->nullable();
            $table->integer('player_level')->nullable();
            $table->text('extracted_text')->nullable();
            $table->text('permanent_image_url')->nullable();
            $table->string('ticket_status')->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->timestamps();
        });

        // 3. Verified Players
        Schema::create('verified_players', function (Blueprint $table) {
            $table->string('player_id')->primary();
            $table->string('discord_user_id')->nullable();
            $table->string('player_name');
            $table->integer('player_level')->default(1);
            $table->string('clan_tag')->default('ARIES');
            $table->string('timezone')->default('UTC');
            $table->string('timezone_offset')->default('+00:00');
            $table->string('region')->default('GLOBAL');
            $table->string('status')->default('ACTIVE');
            $table->text('notes')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->string('verified_by')->nullable();
            $table->uuid('ticket_id')->nullable();
            $table->timestamps();
        });

        // 4. Battle Records (Scoreboard Damage Submissions & Ship Records)
        Schema::create('battle_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('discord_user_id');
            $table->string('player_id')->nullable();
            $table->string('player_name');
            $table->string('ship_name');
            $table->string('ship_class'); // frigates, destroyers, cruisers, etc.
            $table->bigInteger('damage');
            $table->integer('kills')->default(0);
            $table->integer('assists')->default(0);
            $table->string('map_name')->nullable();
            $table->string('game_mode')->default('Random Battle');
            $table->text('screenshot_url');
            $table->text('rewards_screenshot_url')->nullable();
            $table->text('extracted_ocr_text')->nullable();
            $table->jsonb('raw_ocr_data')->nullable();
            $table->string('status')->default('APPROVED');
            $table->boolean('is_ship_record')->default(false);
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index(['ship_name', 'damage']);
            $table->index('ship_class');
        });

        // 5. Rank History (Season Submissions)
        Schema::create('rank_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('discord_user_id');
            $table->string('player_id')->nullable();
            $table->string('player_name');
            $table->integer('player_level')->nullable();
            $table->integer('season_number');
            $table->string('season_name')->nullable();
            $table->string('current_rank')->default('Unranked');
            $table->string('best_rank')->default('Unranked');
            $table->integer('rank_points')->default(0);
            $table->integer('clan_points')->default(0);
            $table->text('permanent_image_url')->nullable();
            $table->text('extracted_text')->nullable();
            $table->jsonb('raw_ocr_data')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->unique(['discord_user_id', 'season_number']);
        });

        // 6. Clan Seasons
        Schema::create('clan_season', function (Blueprint $table) {
            $table->uuid('season_id')->primary();
            $table->string('season_name');
            $table->integer('season_number');
            $table->text('description')->nullable();
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->integer('duration_days')->default(30);
            $table->string('status')->default('ACTIVE');
            $table->integer('total_wars')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('losses')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('total_points_earned')->default(0);
            $table->integer('total_points_spent')->default(0);
            $table->integer('total_participants')->default(0);
            $table->timestamps();
        });

        // 7. Clan Ranks
        Schema::create('clan_ranks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('rank_name');
            $table->integer('min_points')->default(0);
            $table->string('emoji')->nullable();
            $table->string('color')->nullable();
            $table->string('role_id')->nullable();
            $table->jsonb('permissions')->nullable();
            $table->timestamps();
        });

        // 8. Clan Points
        Schema::create('clan_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('player_id')->unique();
            $table->uuid('season_id')->nullable();
            $table->integer('total_points')->default(0);
            $table->integer('lifetime_points')->default(0);
            $table->integer('lifetime_spent')->default(0);
            $table->string('rank')->nullable();
            $table->timestamp('rank_updated_at')->nullable();
            $table->timestamps();
        });

        // 9. Clan Points History
        Schema::create('clan_points_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('player_id');
            $table->uuid('season_id')->nullable();
            $table->integer('points_change');
            $table->string('reason')->nullable();
            $table->string('category')->default('MANUAL');
            $table->string('admin_id')->nullable();
            $table->string('admin_username')->nullable();
            $table->string('bot_source')->nullable();
            $table->string('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->timestamps();
        });

        // 10. Clan Teams
        Schema::create('clan_teams', function (Blueprint $table) {
            $table->uuid('team_id')->primary();
            $table->string('team_name');
            $table->string('team_tier')->default('A');
            $table->text('description')->nullable();
            $table->integer('max_members')->default(10);
            $table->string('captain_player_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 11. Team Members
        Schema::create('team_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('team_id');
            $table->string('player_id');
            $table->string('role')->default('MEMBER');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['team_id', 'player_id']);
        });

        // 12. Clan Wars
        Schema::create('clan_wars', function (Blueprint $table) {
            $table->uuid('war_id')->primary();
            $table->uuid('our_team_id')->nullable();
            $table->string('opponent_name');
            $table->string('opponent_team')->nullable();
            $table->string('war_type')->default('REGULAR');
            $table->integer('team_size')->default(5);
            $table->timestamp('scheduled_at')->nullable();
            $table->integer('duration_minutes')->default(30);
            $table->string('timezone')->default('UTC');
            $table->string('status')->default('SCHEDULED');
            $table->integer('our_score')->nullable();
            $table->integer('their_score')->nullable();
            $table->string('result')->nullable();
            $table->text('strategy_notes')->nullable();
            $table->text('war_notes')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
        });

        // 13. War Roster
        Schema::create('war_roster', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('war_id');
            $table->string('player_id');
            $table->string('team_side')->default('OUR');
            $table->string('role')->default('MEMBER');
            $table->string('availability')->default('PENDING');
            $table->text('availability_notes')->nullable();
            $table->text('ship_loadout')->nullable();
            $table->integer('score')->nullable();
            $table->integer('kills')->nullable();
            $table->integer('deaths')->nullable();
            $table->timestamps();

            $table->unique(['war_id', 'player_id']);
        });

        // 14. Player Availability
        Schema::create('player_availability', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('player_id');
            $table->integer('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['player_id', 'day_of_week']);
        });

        // 15. RBAC
        Schema::create('rbac_roles', function (Blueprint $table) {
            $table->uuid('role_id')->primary();
            $table->string('role_name');
            $table->string('role_slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('rbac_permissions', function (Blueprint $table) {
            $table->uuid('permission_id')->primary();
            $table->string('permission_name');
            $table->string('permission_slug')->unique();
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('rbac_role_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('role_id');
            $table->uuid('permission_id');
            $table->timestamps();

            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('rbac_user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('user_id');
            $table->uuid('role_id');
            $table->string('assigned_by')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();

            $table->unique(['user_id', 'role_id']);
        });

        // 16. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('action');
            $table->string('action_category')->nullable();
            $table->string('user_id')->nullable();
            $table->string('username')->nullable();
            $table->string('target_id')->nullable();
            $table->string('target_type')->nullable();
            $table->string('target_name')->nullable();
            $table->jsonb('details')->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->string('status')->default('success');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('rbac_user_roles');
        Schema::dropIfExists('rbac_role_permissions');
        Schema::dropIfExists('rbac_permissions');
        Schema::dropIfExists('rbac_roles');
        Schema::dropIfExists('player_availability');
        Schema::dropIfExists('war_roster');
        Schema::dropIfExists('clan_wars');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('clan_teams');
        Schema::dropIfExists('clan_points_history');
        Schema::dropIfExists('clan_points');
        Schema::dropIfExists('clan_ranks');
        Schema::dropIfExists('clan_season');
        Schema::dropIfExists('rank_history');
        Schema::dropIfExists('battle_records');
        Schema::dropIfExists('verified_players');
        Schema::dropIfExists('verification_tickets');
        Schema::dropIfExists('discord_users');
    }
};
