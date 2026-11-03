import { useEffect, useState } from 'react';
import { getPlayers, createPlayer, deletePlayer } from '../../lib/database';
import { getUsers } from '../../lib/supabase';
import PageMeta from '../../components/common/PageMeta';
import Modal from '../../components/common/Modal';

interface Player {
  player_id: string;
  discord_user_id: string | null;
  player_name: string;
  player_level: number;
  clan_tag: string;
  timezone: string;
  timezone_offset: string;
  region: string;
  status: string;
  notes: string | null;
  verified_at: string;
  verified_by: string | null;
  ticket_id: string | null;
  created_at: string;
  updated_at: string;
}

interface VerifiedUser {
  user_id: string;
  username: string;
  joined_at: string;
}

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'UTC+7 - Asia/Jakarta (WIB)', offset: 'UTC+7' },
  { value: 'Asia/Makassar', label: 'UTC+8 - Asia/Makassar (WITA)', offset: 'UTC+8' },
  { value: 'Asia/Jayapura', label: 'UTC+9 - Asia/Jayapura (WIT)', offset: 'UTC+9' },
  { value: 'Asia/Singapore', label: 'UTC+8 - Asia/Singapore', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'UTC+9 - Asia/Tokyo', offset: 'UTC+9' },
  { value: 'Asia/Seoul', label: 'UTC+9 - Asia/Seoul', offset: 'UTC+9' },
  { value: 'Europe/London', label: 'UTC+0 - Europe/London', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'UTC+1 - Europe/Paris', offset: 'UTC+1' },
  { value: 'America/New_York', label: 'UTC-5 - America/New_York', offset: 'UTC-5' },
  { value: 'America/Los_Angeles', label: 'UTC-8 - America/Los_Angeles', offset: 'UTC-8' },
  { value: 'UTC', label: 'UTC+0 - UTC', offset: 'UTC+0' },
];

const REGIONS = ['ASIA', 'EU', 'NA', 'SA', 'OCEANIA', 'AFRICA'];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    player_id: '',
    player_name: '',
    player_level: 1,
    clan_tag: 'ARIES',
    timezone: 'Asia/Jakarta',
    region: 'ASIA',
    discord_user_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [playersResult, usersResult] = await Promise.all([
        getPlayers(100),
        getUsers()
      ]);
      setPlayers(playersResult.data || []);
      setVerifiedUsers(usersResult || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get verified users who are NOT yet players
  const availableUsers = verifiedUsers.filter(
    user => !players.some(p => p.discord_user_id === user.user_id)
  );

  function handleSelectUser(userId: string) {
    const user = verifiedUsers.find(u => u.user_id === userId);
    if (user) {
      setFormData({
        ...formData,
        discord_user_id: user.user_id,
        player_name: user.username,
      });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const tz = TIMEZONES.find(t => t.value === formData.timezone);
      await createPlayer({
        ...formData,
        player_level: parseInt(formData.player_level.toString()),
        timezone_offset: tz?.offset || 'UTC+0',
        discord_user_id: formData.discord_user_id || null,
      });
      setShowCreateModal(false);
      setFormData({ player_id: '', player_name: '', player_level: 1, clan_tag: 'ARIES', timezone: 'Asia/Jakarta', region: 'ASIA', discord_user_id: '' });
      await loadData();
    } catch (error) {
      console.error('Failed to create player:', error);
      alert('Failed to create player. Check console for details.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(playerId: string, playerName: string) {
    if (confirm(`Are you sure you want to delete player "${playerName}"?`)) {
      try {
        await deletePlayer(playerId);
        await loadData();
      } catch (error) {
        console.error('Failed to delete player:', error);
      }
    }
  }

  const filteredPlayers = players.filter(p => {
    const matchSearch = p.player_name.toLowerCase().includes(search.toLowerCase()) ||
      p.player_id.toLowerCase().includes(search.toLowerCase());
    const matchRegion = filterRegion === 'ALL' || p.region === filterRegion;
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchRegion && matchStatus;
  });

  const regions = [...new Set(players.map(p => p.region).filter(Boolean))];

  return (
    <>
      <PageMeta title="Players | ARIES Admin" description="Manage verified players" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Players</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {players.length} players • {availableUsers.length} verified users available
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Search players..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="ALL">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              + Add Player
            </button>
            <button onClick={loadData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded dark:bg-gray-700"></div>)}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Player ID</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Discord</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Level</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Clan</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Timezone</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Region</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.player_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-mono text-xs text-gray-800 dark:text-gray-200">{player.player_id}</td>
                      <td className="px-6 py-4">
                        {player.discord_user_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            ✓ Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            ✗ No Discord
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{player.player_name}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{player.player_level}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{player.clan_tag}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{player.timezone_offset}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{player.region}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          player.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          player.status === 'BANNED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>{player.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">Edit</button>
                          <button onClick={() => handleDelete(player.player_id, player.player_name)}
                            className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPlayers.length === 0 && <div className="text-center py-12"><p className="text-gray-500 dark:text-gray-400">No players found</p></div>}
          </div>
        )}

        {/* Create Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Player">
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Select from verified Discord users */}
            {availableUsers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Verified Discord User (Optional)</label>
                <select value={formData.discord_user_id}
                  onChange={(e) => handleSelectUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">-- Select User --</option>
                  {availableUsers.map(user => (
                    <option key={user.user_id} value={user.user_id}>{user.username} ({user.user_id})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Auto-fills Player Name from Discord username</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Player ID (Hex from game)</label>
              <input type="text" required value={formData.player_id}
                onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                placeholder="e.g., 8B38C96F59232BD0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Player Name</label>
              <input type="text" required value={formData.player_name}
                onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                placeholder="e.g., LEGACΨ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                <input type="number" min="1" max="100" value={formData.player_level}
                  onChange={(e) => setFormData({ ...formData, player_level: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clan Tag</label>
                <input type="text" value={formData.clan_tag}
                  onChange={(e) => setFormData({ ...formData, clan_tag: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
              <select value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
              <select value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Player'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
