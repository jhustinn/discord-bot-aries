import { useEffect, useState, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import {
  getMasterShips,
  getShipClasses,
  createMasterShip,
  updateMasterShip,
  deleteMasterShip,
  MasterShip,
  ShipClassMeta,
} from '../../lib/database';

export default function ShipsPage() {
  const [ships, setShips] = useState<MasterShip[]>([]);
  const [classes, setClasses] = useState<ShipClassMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<MasterShip | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    class: 'frigates',
    tier: 3,
    category: 'Shop',
    country: '',
    aliases: '',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadClasses = async () => {
    try {
      const res = await getShipClasses();
      setClasses(res.data || []);
    } catch (e) {
      console.error('Failed to load ship classes:', e);
    }
  };

  const loadShips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMasterShips({
        class: selectedClass,
        tier: selectedTier,
        category: selectedCategory,
        search: searchQuery,
      });
      setShips(res.data || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      console.error('Failed to load ships:', err);
      showToast(err.message || 'Failed to load master ships', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedTier, selectedCategory, searchQuery]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadShips();
  }, [loadShips]);

  function openCreateModal() {
    setEditingShip(null);
    setFormData({
      name: '',
      class: selectedClass !== 'all' ? selectedClass : 'frigates',
      tier: 3,
      category: 'Shop',
      country: '',
      aliases: '',
      description: '',
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(ship: MasterShip) {
    setEditingShip(ship);
    setFormData({
      name: ship.name,
      class: ship.class,
      tier: ship.tier,
      category: ship.category,
      country: ship.country || '',
      aliases: Array.isArray(ship.aliases) ? ship.aliases.join(', ') : '',
      description: ship.description || '',
      is_active: ship.is_active,
    });
    setIsModalOpen(true);
  }

  async function handleSaveShip(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Ship name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const aliasArray = formData.aliases
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const payload = {
        name: formData.name.trim(),
        class: formData.class,
        tier: Number(formData.tier),
        category: formData.category,
        country: formData.country.trim() || null,
        aliases: aliasArray,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      };

      if (editingShip) {
        await updateMasterShip(editingShip.id, payload);
        showToast(`Ship "${formData.name}" updated successfully!`);
      } else {
        await createMasterShip(payload);
        showToast(`Ship "${formData.name}" created successfully!`);
      }

      setIsModalOpen(false);
      await loadShips();
      await loadClasses();
    } catch (err: any) {
      showToast(err.message || 'Failed to save ship', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteShip(ship: MasterShip) {
    if (!confirm(`Are you sure you want to delete "${ship.name}"?`)) return;

    try {
      await deleteMasterShip(ship.id);
      showToast(`Ship "${ship.name}" deleted successfully`);
      await loadShips();
      await loadClasses();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete ship', 'error');
    }
  }

  function getCategoryBadge(cat: string) {
    const styles: Record<string, string> = {
      Market: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
      Gacha: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
      'Battle Pass': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
      Shop: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
      Event: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300',
    };
    return styles[cat] || styles.Shop;
  }

  return (
    <>
      <PageMeta title="Master Ships Database | ARIES Admin" description="Manage Modern Warships vessels, classifications, and OCR aliases" />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span>⚓</span> Master Ships Database
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Modern Warships vessel catalog with OCR aliases, tiers, acquisition categories, and classifications
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>+</span> Add New Ship
            </button>
            <button
              onClick={loadShips}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Ship Class Tabs with Counters */}
        <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
          <button
            onClick={() => setSelectedClass('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedClass === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <span>🌐</span> All Ships ({totalCount})
          </button>

          {classes.map(cls => (
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
              {cls.name} ({cls.count})
            </button>
          ))}
        </div>

        {/* Filters & Search Row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex flex-1 min-w-[240px] items-center gap-2">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by ship name, country, or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tier Filter */}
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
            >
              <option value="all">All Tiers</option>
              <option value="3">Tier 3 (T3)</option>
              <option value="2">Tier 2 (T2)</option>
              <option value="1">Tier 1 (T1)</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
            >
              <option value="all">All Categories</option>
              <option value="Shop">Shop</option>
              <option value="Market">Market</option>
              <option value="Gacha">Gacha</option>
              <option value="Battle Pass">Battle Pass</option>
              <option value="Event">Event</option>
            </select>
          </div>
        </div>

        {/* Master Ships Table */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Vessel Name</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Class</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Tier</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Acquisition</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Country</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">OCR Aliases</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ships.map((ship) => (
                    <tr
                      key={ship.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{ship.name}</p>
                          {ship.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{ship.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {ship.class}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          T{ship.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${getCategoryBadge(ship.category)}`}>
                          {ship.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {ship.country || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.isArray(ship.aliases) && ship.aliases.length > 0 ? (
                            ship.aliases.map((al, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              >
                                {al}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(ship)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteShip(ship)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ships.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <span className="text-4xl block mb-2">⚓</span>
                <p className="text-sm">No master ships match your filter.</p>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD / EDIT SHIP */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⚓</span> {editingShip ? 'Edit Master Ship' : 'Add New Master Ship'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveShip} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ship Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT FREMM-EVO"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Ship Class *
                    </label>
                    <select
                      value={formData.class}
                      onChange={e => setFormData({ ...formData, class: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="frigates">Frigates (🚢)</option>
                      <option value="destroyers">Destroyers (⚔️)</option>
                      <option value="cruisers">Cruisers (🛡️)</option>
                      <option value="battleships">Battleships (💥)</option>
                      <option value="submarines">Submarines (🦈)</option>
                      <option value="carriers">Aircraft Carriers (✈️)</option>
                      <option value="assault-carriers">Assault Carriers (🦅)</option>
                      <option value="ekranoplan">Ekranoplans (🚀)</option>
                      <option value="hovercrafts">Hovercrafts (💨)</option>
                      <option value="assault-landing-ships">Assault Landing Ships (🏝️)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Tier
                    </label>
                    <select
                      value={formData.tier}
                      onChange={e => setFormData({ ...formData, tier: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={3}>Tier 3 (T3)</option>
                      <option value={2}>Tier 2 (T2)</option>
                      <option value={1}>Tier 1 (T1)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Acquisition Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Shop">Shop</option>
                      <option value="Market">Market</option>
                      <option value="Gacha">Gacha</option>
                      <option value="Battle Pass">Battle Pass</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Country / Origin
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Italy, USA, Russia"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    OCR Aliases (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FREMM-EVO, FREMM, IT FREMM"
                    value={formData.aliases}
                    onChange={e => setFormData({ ...formData, aliases: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Used by OCR to automatically recognize this ship on screenshots.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description or loadout highlights..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingShip ? 'Update Ship' : 'Create Ship'}
                  </button>
                </div>
              </form>
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
