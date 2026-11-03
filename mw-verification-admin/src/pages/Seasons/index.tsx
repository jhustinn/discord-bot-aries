import { useEffect, useState, useCallback } from 'react';
import { getSeasons, createSeason, getSeasonLeaderboard, ClanSeason } from '../../lib/database';
import { getRankSubmissions, deleteRankSubmission, RankSubmission } from '../../lib/discord';
import PageMeta from '../../components/common/PageMeta';
import Modal from '../../components/common/Modal';

export default function SeasonsPage() {
  const [activeTab, setActiveTab] = useState<'seasons' | 'ranks'>('seasons');

  // Seasons tab state
  const [seasons, setSeasons] = useState<ClanSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    season_name: '',
    description: '',
    duration_days: 30,
  });

  // Rank Submissions tab state
  const [rankSubmissions, setRankSubmissions] = useState<RankSubmission[]>([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<number | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSeasons = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSeasons(20);
      setSeasons(result || []);
    } catch (error) {
      console.error('Failed to load seasons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRanks = useCallback(async () => {
    setRankLoading(true);
    try {
      const res = await getRankSubmissions({ season: seasonFilter });
      setRankSubmissions(res.data || []);
    } catch (err: any) {
      console.error('Failed to load rank submissions:', err);
    } finally {
      setRankLoading(false);
    }
  }, [seasonFilter]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  useEffect(() => {
    if (activeTab === 'ranks') {
      loadRanks();
    }
  }, [activeTab, loadRanks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createSeason({
        ...formData,
        start_date: new Date().toISOString(),
        duration_days: parseInt(formData.duration_days.toString()),
      });
      setShowCreateModal(false);
      setFormData({ season_name: '', description: '', duration_days: 30 });
      showToast('Season created successfully!');
      await loadSeasons();
    } catch (error: any) {
      showToast(error.message || 'Failed to create season', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function loadLeaderboard(seasonId: string) {
    setSelectedSeason(seasonId);
    try {
      const data = await getSeasonLeaderboard(seasonId, 10);
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }

  async function handleDeleteRank(id: string) {
    if (!confirm('Are you sure you want to delete this rank submission record?')) return;
    try {
      await deleteRankSubmission(id);
      showToast('Rank submission deleted');
      await loadRanks();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete submission', 'error');
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      UPCOMING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return styles[status] || styles.UPCOMING;
  }

  function getRankBadge(rankName: string) {
    const r = rankName.toLowerCase();
    if (r.includes('legendary') || r.includes('hero')) {
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300';
    }
    if (r.includes('diamond')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300';
    }
    if (r.includes('platinum')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (r.includes('gold')) {
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300';
    }
    if (r.includes('silver')) {
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
    return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300';
  }

  return (
    <>
      <PageMeta title="Seasons & Rank History | ARIES Admin" description="Manage clan seasons, wars, and member rank submissions" />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Seasons & Rank History
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Manage clan war seasons and monitor member rank proof submissions
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'seasons' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Create Season
              </button>
            )}
            <button
              onClick={() => (activeTab === 'seasons' ? loadSeasons() : loadRanks())}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-2">
          {[
            { id: 'seasons', label: `🏆 Clan Seasons (${seasons.length})`, icon: '🏆' },
            { id: 'ranks', label: `📜 Rank Submissions & OCR (${rankSubmissions.length})`, icon: '📜' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SEASONS */}
        {activeTab === 'seasons' && (
          <div>
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded dark:bg-gray-700"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {seasons.map((season) => (
                  <div key={season.season_id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{season.season_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(season.start_date).toLocaleDateString()} - {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'Ongoing'}
                          {' '}({season.duration_days} days)
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(season.status)}`}>
                        {season.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{season.total_wars}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Wars</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-xl">
                        <p className="text-2xl font-bold text-green-600">{season.wins}</p>
                        <p className="text-xs text-green-600/70">Wins</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">{season.total_points_earned}</p>
                        <p className="text-xs text-blue-600/70">Points</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                        <p className="text-2xl font-bold text-purple-600">{season.total_participants}</p>
                        <p className="text-xs text-purple-600/70">Participants</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadLeaderboard(season.season_id)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        📊 View Leaderboard
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leaderboard */}
            {selectedSeason && leaderboard.length > 0 && (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Season Leaderboard</h3>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Rank</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Player</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry: any, index: number) => (
                      <tr key={entry.player_id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-3 font-bold text-gray-800 dark:text-white">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-white">{entry.player?.player_name || entry.player_id}</td>
                        <td className="px-4 py-3 font-bold text-blue-600">{entry.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RANK SUBMISSIONS & OCR */}
        {activeTab === 'ranks' && (
          <div>
            {/* Filter Bar */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Filter Season:</span>
              {[undefined, 14, 13, 12, 11, 10].map(s => (
                <button
                  key={String(s)}
                  onClick={() => setSeasonFilter(s)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    seasonFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {s === undefined ? 'All Seasons' : `Season ${s}`}
                </button>
              ))}
            </div>

            {rankLoading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded dark:bg-gray-700"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Player</th>
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Season</th>
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Current Rank</th>
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Best Rank</th>
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Points</th>
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Screenshot Proof</th>
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Submitted At</th>
                        <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankSubmissions.map((rank) => (
                        <tr key={rank.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{rank.player_name}</p>
                              <p className="text-xs text-gray-400 font-mono">
                                {rank.player_id} {rank.player_level ? `• Lv. ${rank.player_level}` : ''}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-md">
                              Season {rank.season_number}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRankBadge(rank.current_rank)}`}>
                              {rank.current_rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRankBadge(rank.best_rank)}`}>
                              {rank.best_rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                            {rank.rank_points} pts
                          </td>
                          <td className="px-6 py-4">
                            {rank.permanent_image_url ? (
                              <button
                                onClick={() => setPreviewImage(rank.permanent_image_url)}
                                className="group relative block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-80"
                              >
                                <img
                                  src={rank.permanent_image_url}
                                  alt="proof"
                                  className="w-14 h-10 object-cover"
                                />
                                <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  🔍 Zoom
                                </span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">No Image</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(rank.submitted_at).toLocaleDateString()} {new Date(rank.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteRank(rank.id)}
                              className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete record"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rankSubmissions.length === 0 && (
                  <div className="py-12 text-center text-gray-400">
                    <span className="text-4xl block mb-2">📜</span>
                    <p className="text-sm">No rank submissions found for this season.</p>
                    <p className="text-xs text-gray-500 mt-1">Members can submit proof via Discord using <code className="text-blue-500 font-mono">/rank-check</code></p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Season Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Season">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Season Name</label>
              <input type="text" required value={formData.season_name}
                onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
                placeholder="e.g., Season 14, Season 2026-Q3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Season description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (days)</label>
              <input type="number" min="7" max="90" value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Season'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL: IMAGE PREVIEW */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="Zoom Preview"
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border border-gray-700"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
