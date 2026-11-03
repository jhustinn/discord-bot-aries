<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RestoreBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataDir = base_path('../data');
        if (!File::isDirectory($dataDir)) {
            $this->command->warn("Data directory not found at: {$dataDir}");
            return;
        }

        $tables = [
            'discord_users',
            'verification_tickets',
            'verified_players',
            'battle_records',
            'rank_history',
            'clan_season',
            'clan_ranks',
            'clan_points',
            'clan_points_history',
            'clan_teams',
            'team_members',
            'clan_wars',
            'war_roster',
            'player_availability',
            'rbac_roles',
            'rbac_permissions',
            'rbac_role_permissions',
            'rbac_user_roles',
            'audit_logs',
        ];

        foreach ($tables as $table) {
            $jsonFile = "{$dataDir}/{$table}.json";
            if (!File::exists($jsonFile)) {
                continue;
            }

            $json = File::get($jsonFile);
            $rows = json_decode($json, true);

            if (empty($rows)) {
                continue;
            }

            $count = 0;
            foreach ($rows as $row) {
                // Encode any array/object fields to JSON string for Postgres JSONB columns
                foreach ($row as $k => $v) {
                    if (is_array($v)) {
                        $row[$k] = json_encode($v);
                    }
                }

                try {
                    DB::table($table)->updateOrInsert(
                        $this->getPrimaryKeys($table, $row),
                        $row
                    );
                    $count++;
                } catch (\Exception $e) {
                    // ignore duplicates or foreign key warnings
                }
            }

            $this->command->info("Seeded {$count} rows into table '{$table}'");
        }
    }

    private function getPrimaryKeys(string $table, array $row): array
    {
        switch ($table) {
            case 'verification_tickets':
                return ['ticket_id' => $row['ticket_id'] ?? null];
            case 'verified_players':
                return ['player_id' => $row['player_id'] ?? null];
            case 'discord_users':
                return ['user_id' => $row['user_id'] ?? null];
            case 'battle_records':
            case 'rank_history':
            case 'clan_ranks':
            case 'clan_points':
            case 'clan_points_history':
            case 'team_members':
            case 'war_roster':
            case 'player_availability':
            case 'rbac_role_permissions':
            case 'rbac_user_roles':
            case 'audit_logs':
                return ['id' => $row['id'] ?? null];
            case 'clan_season':
                return ['season_id' => $row['season_id'] ?? null];
            case 'clan_teams':
                return ['team_id' => $row['team_id'] ?? null];
            case 'clan_wars':
                return ['war_id' => $row['war_id'] ?? null];
            case 'rbac_roles':
                return ['role_id' => $row['role_id'] ?? null];
            case 'rbac_permissions':
                return ['permission_id' => $row['permission_id'] ?? null];
            default:
                return isset($row['id']) ? ['id' => $row['id']] : [];
        }
    }
}
