import { useEffect, useState } from 'react';
import { getWars, createWar, deleteWar, ClanWar } from '../../lib/database';
import PageMeta from '../../components/common/PageMeta';
import Modal from '../../components/common/Modal';

interface War extends ClanWar {
  team?: { team_id: string; team_name: string };
}

const WAR_TYPES = ['REGULAR', 'TOURNAMENT', 'SCRIMMAGE', 'PRACTICE'];

export default function WarsPage() {
  const [wars, setWars] = useState<War[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    opponent_name: '',
    opponent_team: '',
    war_type: 'REGULAR',
    team_size: 5,
    scheduled_at: '',
    strategy_notes: '',
  });

  useEffect(() => {
    loadWars();
  }, []);

  async function loadWars() {
    setLoading(true);
    try {
      const result = await getWars(50, filterStatus !== 'ALL' ? filterStatus : undefined);
      setWars(result || []);
    } catch (error) {
      console.error('Failed to load wars:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createWar({
        ...formData,
        team_size: parseInt(formData.team_size.toString()),
        scheduled_at: formData.scheduled_at || null,
      });
      setShowCreateModal(false);
      setFormData({ opponent_name: '', opponent_team: '', war_type: 'REGULAR', team_size: 5, scheduled_at: '', strategy_notes: '' });
      await loadWars();
    } catch (error) {
      console.error('Failed to create war:', error);
      alert('Failed to create war. Check console for details.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(warId: string) {
    if (confirm('Delete this war?')) {
      try {
        await deleteWar(warId);
        await loadWars();
      } catch (error) {
        console.error('Failed to delete war:', error);
      }
    }
  }

  const filteredWars = filterStatus === 'ALL' ? wars : wars.filter(w => w.status === filterStatus);

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status] || styles.SCHEDULED;
  }

  function getResultBadge(result: string | null) {
    if (!result) return '';
    const styles: Record<string, string> = { WIN: 'text-green-600', LOSS: 'text-red-600', DRAW: 'text-yellow-600' };
    return styles[result] || '';
  }

  return (
    <>
      <PageMeta title="Clan Wars | ARIES Admin" description="Manage clan wars" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Clan Wars</h2>
            <p className="text-gray-500 dark:text-gray-400">{wars.length} wars</p>
          </div>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="ALL">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              + Create War
            </button>
            <button onClick={loadWars}
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
          <div className="space-y-4">
            {filteredWars.map((war) => (
              <div key={war.war_id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {war.result === 'WIN' ? '🏆' : war.result === 'LOSS' ? '😞' : '⚔️'}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">vs {war.opponent_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{war.war_type} • {war.team_size}v{war.team_size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(war.status)}`}>{war.status}</span>
                    {war.result && <span className={`text-lg font-bold ${getResultBadge(war.result)}`}>{war.result}</span>}
                  </div>
                </div>
                {war.status === 'COMPLETED' && war.our_score !== null && (
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{war.our_score}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{war.their_score}</span>
                  </div>
                )}
                {war.scheduled_at && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Scheduled: {new Date(war.scheduled_at).toLocaleString()}</p>}
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">View Details</button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Edit</button>
                  <button onClick={() => handleDelete(war.war_id)}
                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredWars.length === 0 && (
          <div className="text-center py-12"><p className="text-gray-500 dark:text-gray-400">No wars found</p></div>
        )}

        {/* Create Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New War">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opponent Name</label>
              <input type="text" required value={formData.opponent_name}
                onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                placeholder="e.g., DragonClan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opponent Team (optional)</label>
              <input type="text" value={formData.opponent_team}
                onChange={(e) => setFormData({ ...formData, opponent_team: e.target.value })}
                placeholder="e.g., DragonAlpha"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">War Type</label>
                <select value={formData.war_type}
                  onChange={(e) => setFormData({ ...formData, war_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {WAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Size</label>
                <input type="number" min="1" max="10" value={formData.team_size}
                  onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled At (optional)</label>
              <input type="datetime-local" value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Strategy Notes (optional)</label>
              <textarea value={formData.strategy_notes}
                onChange={(e) => setFormData({ ...formData, strategy_notes: e.target.value })}
                placeholder="War strategy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create War'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
