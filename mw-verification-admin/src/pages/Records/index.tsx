import { useEffect, useState, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import {
  getBattleRecords,
  getClassLeaderboard,
  syncLeaderboardsToDiscord,
  deleteBattleRecord,
  BattleRecord,
  ClassLeaderboardEntry
} from '../../lib/discord';

const SHIP_CLASSES = [
  { id: 'frigates', name: 'Frigates', icon: '🚢' },
  { id: 'destroyers', name: 'Destroyers', icon: '⚔️' },
  { id: 'cruisers', name: 'Cruisers', icon: '🛡️' },
  { id: 'battleships', name: 'Battleships', icon: '💥' },
  { id: 'submarines', name: 'Submarines', icon: '🦈' },
  { id: 'carriers', name: 'Aircraft Carriers', icon: '✈️' },
  { id: 'assault-carriers', name: 'Assault Carriers', icon: '🦅' },
  { id: 'ekranoplan', name: 'Ekranoplans', icon: '🚀' },
  { id: 'hovercrafts', name: 'Hovercrafts', icon: '💨' },
  { id: 'assault-landing-ships', name: 'Assault Landing Ships', icon: '🏝️' },
  { id: 'all', name: 'All Classes', icon: '🌐' },
];

export default function RecordsPage() {
  const [selectedClass, setSelectedClass] = useState<string>('frigates');
  const [viewMode, setViewMode] = useState<'leaderboard' | 'history'>('leaderboard');
  
  // Data state
  const [leaderboard, setLeaderboard] = useState<ClassLeaderboardEntry[]>([]);
  const [submissions, setSubmissions] = useState<BattleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'leaderboard' && selectedClass !== 'all') {
        const res = await getClassLeaderboard(selectedClass);
        setLeaderboard(res.data || []);
      } else {
        const res = await getBattleRecords({
          ship_class: selectedClass === 'all' ? undefined : selectedClass,
        });
        setSubmissions(res.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load battle records:', err);
      showToast(err.message || 'Failed to load records', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSyncDiscord() {
    setSyncing(true);
    try {
      const res = await syncLeaderboardsToDiscord();
      const successCount = res.results.filter(r => r.synced).length;
      showToast(`Synced leaderboards to ${successCount} Discord channels!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to sync leaderboards', 'error');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this battle record?')) return;
    try {
      await deleteBattleRecord(id);
      showToast('Record deleted successfully');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    }
  }

  function getCategoryBadge(cat?: string) {
    const styles: Record<string, string> = {
      Market: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
      Gacha: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
      'Battle Pass': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
      Shop: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    };
    return styles[cat || 'Shop'] || styles.Shop;
  }

  return (
    <>
      <PageMeta title="Clan Battle Records | ARIES Admin" description="Modern Warships clan damage records and ship leaderboards" />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span>🏆</span> Clan Battle Records
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Modern Warships high-score damage records, ship classification, and Discord channel leaderboards
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSyncDiscord}
              disabled={syncing}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{syncing ? '⏳' : '🚀'}</span>
              {syncing ? 'Syncing...' : 'Sync to Discord Channels'}
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Ship Class Horizontal Selector */}
        <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
          {SHIP_CLASSES.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedClass === cls.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <span>{cls.icon}</span>
              {cls.name}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        {selectedClass !== 'all' && (
          <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-2">
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                viewMode === 'leaderboard'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>👑</span> Official Leaderboard (Current #1 Records)
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                viewMode === 'history'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>📜</span> All Submissions History
            </button>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        ) : viewMode === 'leaderboard' && selectedClass !== 'all' ? (
          /* LEADERBOARD VIEW */
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Ship Name</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Acquisition</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Record Holder</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Damage Record</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Combat Stats</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Proof Screenshot</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Achieved Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(({ ship, record }) => (
                    <tr
                      key={ship.name}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">{ship.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                            T{ship.tier}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${getCategoryBadge(ship.category)}`}>
                          {ship.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record ? (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">👑</span>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{record.player_name}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{record.player_id || 'ID: Saved'}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unclaimed</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record ? (
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono text-base">
                            {record.damage.toLocaleString('en-US')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record ? (
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            ⚔️ {record.kills || 0}K • {record.assists || 0}A
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record && record.screenshot_url ? (
                          <button
                            onClick={() => setPreviewImage(record.screenshot_url)}
                            className="group relative block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-80"
                          >
                            <img src={record.screenshot_url} alt="Proof" className="w-14 h-9 object-cover" />
                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              🔍 Zoom
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {record ? new Date(record.submitted_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {leaderboard.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <span className="text-4xl block mb-2">🚢</span>
                <p className="text-sm">No ships registered for this class.</p>
              </div>
            )}
          </div>
        ) : (
          /* ALL SUBMISSIONS HISTORY VIEW */
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Player</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Ship Name</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Class</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Damage Dealt</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Stats</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Map</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Scoreboard Proof</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Submitted At</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((rec) => (
                    <tr
                      key={rec.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {rec.is_ship_record && <span className="text-yellow-500" title="Current Record">👑</span>}
                            {rec.player_name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">
                            {rec.player_id || `<@${rec.discord_user_id}>`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {rec.ship_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {rec.ship_class}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-blue-600 dark:text-blue-400 font-mono text-base">
                        {rec.damage.toLocaleString('en-US')} pts
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                        {rec.kills || 0}K • {rec.assists || 0}A
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {rec.map_name || 'Random Map'}
                      </td>
                      <td className="px-6 py-4">
                        {rec.screenshot_url ? (
                          <button
                            onClick={() => setPreviewImage(rec.screenshot_url)}
                            className="group relative block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-80"
                          >
                            <img src={rec.screenshot_url} alt="Proof" className="w-14 h-9 object-cover" />
                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              🔍 Zoom
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(rec.submitted_at).toLocaleDateString()} {new Date(rec.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(rec.id)}
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

            {submissions.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <span className="text-4xl block mb-2">📜</span>
                <p className="text-sm">No battle submissions recorded yet.</p>
                <p className="text-xs text-gray-500 mt-1">Members can submit proof via Discord using <code className="text-blue-500 font-mono">/record-submit</code> or in <code className="text-blue-500 font-mono">#submissions</code></p>
              </div>
            )}
          </div>
        )}

        {/* IMAGE PREVIEW LIGHTBOX */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 cursor-pointer backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="Scoreboard Zoom"
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-gray-700"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-xl text-sm font-medium text-white z-50 transition-all ${
            toast.type === 'success' ? 'bg-green-600 shadow-green-600/30' : 'bg-red-600 shadow-red-600/30'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
