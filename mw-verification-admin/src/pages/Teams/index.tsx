import { useEffect, useState } from 'react';
import { getTeams, createTeam, deleteTeam, getTeam, addTeamMember, removeTeamMember, getPlayers, ClanTeam } from '../../lib/database';
import PageMeta from '../../components/common/PageMeta';
import Modal from '../../components/common/Modal';

interface Team extends ClanTeam {
  members?: any[];
}

interface Player {
  player_id: string;
  player_name: string;
  player_level: number;
}

const TIERS = ['MAIN', 'SECONDARY', 'ACADEMY', 'RESERVE'];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    team_name: '',
    team_tier: 'MAIN',
    description: '',
    max_members: 5,
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [teamsResult, playersResult] = await Promise.all([
        getTeams(50),
        getPlayers(100)
      ]);
      setTeams(teamsResult || []);
      setPlayers(playersResult.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamDetail(teamId: string) {
    try {
      const team = await getTeam(teamId);
      setSelectedTeam(team);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load team detail:', error);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createTeam(formData);
      setShowCreateModal(false);
      setFormData({ team_name: '', team_tier: 'MAIN', description: '', max_members: 5 });
      await loadData();
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(teamId: string, teamName: string) {
    if (confirm(`Delete team "${teamName}"?`)) {
      try {
        await deleteTeam(teamId);
        await loadData();
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  }

  async function handleAddMember() {
    if (!selectedTeam || !selectedPlayerId) return;
    try {
      await addTeamMember(selectedTeam.team_id, selectedPlayerId, memberRole);
      setShowAddMemberModal(false);
      setSelectedPlayerId('');
      setMemberRole('MEMBER');
      await loadTeamDetail(selectedTeam.team_id);
      await loadData();
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member.');
    }
  }

  async function handleRemoveMember(playerId: string) {
    if (!selectedTeam) return;
    if (confirm('Remove this player from the team?')) {
      try {
        await removeTeamMember(selectedTeam.team_id, playerId);
        await loadTeamDetail(selectedTeam.team_id);
        await loadData();
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  }

  // Get players not in selected team
  const availablePlayers = players.filter(
    p => !selectedTeam?.members?.some((m: any) => m.player_id === p.player_id)
  );

  function getTierBadge(tier: string) {
    const styles: Record<string, string> = {
      MAIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      SECONDARY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ACADEMY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      RESERVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return styles[tier] || styles.MAIN;
  }

  return (
    <>
      <PageMeta title="Teams | ARIES Admin" description="Manage clan teams" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Teams</h2>
            <p className="text-gray-500 dark:text-gray-400">{teams.length} teams</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              + Create Team
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
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded dark:bg-gray-700"></div>)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.team_id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{team.team_name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(team.team_tier)}`}>
                    {team.team_tier}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{team.description || 'No description'}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>Max: {team.max_members} members</span>
                  <span className={team.is_active ? 'text-green-600' : 'text-red-600'}>
                    {team.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadTeamDetail(team.team_id)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                    View Members
                  </button>
                  <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(team.team_id, team.team_name)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Detail Modal */}
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`${selectedTeam?.team_name || ''} - Members`} size="lg">
          {selectedTeam && (
            <>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {selectedTeam.members?.length || 0} / {selectedTeam.max_members} members
                </p>
                <button onClick={() => setShowAddMemberModal(true)}
                  className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700">
                  + Add Member
                </button>
              </div>

              {selectedTeam.members && selectedTeam.members.length > 0 ? (
                <div className="space-y-2">
                  {selectedTeam.members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {member.player?.player_name || member.player_id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Level {member.player?.player_level || '?'} • {member.player?.timezone || 'UTC'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          member.role === 'CAPTAIN' ? 'bg-yellow-100 text-yellow-800' :
                          member.role === 'VICE_CAPTAIN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                        <button onClick={() => handleRemoveMember(member.player_id)}
                          className="px-2 py-1 text-xs text-red-600 bg-red-100 rounded hover:bg-red-200">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No members in this team yet</p>
              )}
            </>
          )}
        </Modal>

        {/* Add Member Modal */}
        <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title={`Add Member to ${selectedTeam?.team_name || ''}`}>
          {selectedTeam && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Player</label>
                <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">-- Select Player --</option>
                  {availablePlayers.map(p => (
                    <option key={p.player_id} value={p.player_id}>{p.player_name} (Level {p.player_level})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="MEMBER">Member</option>
                  <option value="VICE_CAPTAIN">Vice Captain</option>
                  <option value="CAPTAIN">Captain</option>
                  <option value="RESERVE">Reserve</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button onClick={handleAddMember} disabled={!selectedPlayerId}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  Add to Team
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Create Team Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Team">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
              <input type="text" required value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                placeholder="e.g., Alpha, Bravo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier</label>
              <select value={formData.team_tier}
                onChange={(e) => setFormData({ ...formData, team_tier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Members</label>
              <input type="number" min="1" max="20" value={formData.max_members}
                onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
