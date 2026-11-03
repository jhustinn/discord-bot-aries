import { useEffect, useState } from 'react';
import {
  getMembers,
  assignRole,
  removeRole,
  kickMember,
  banMember,
  timeoutMember,
  untimeoutMember,
  setMemberNickname,
  getRoles,
  DiscordMember,
  DiscordRole
} from '../../lib/discord';
import { supabase } from '../../lib/supabase';
import PageMeta from '../../components/common/PageMeta';

export default function MembersPage() {
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<DiscordMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Moderation modal states
  const [newNickname, setNewNickname] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(10);
  const [timeoutReason, setTimeoutReason] = useState('Muted by admin');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [membersData, rolesData, verifiedData] = await Promise.all([
        getMembers(),
        getRoles(),
        supabase.from('discord_users').select('user_id')
      ]);
      setMembers(membersData.members);
      setRoles(rolesData.roles);
      
      // Create set of verified user IDs
      const verifiedIds = new Set<string>(
        (verifiedData.data || []).map((u: any) => u.user_id)
      );
      setVerifiedUsers(verifiedIds);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignRole(memberId: string, roleId: string) {
    setActionLoading(true);
    try {
      await assignRole(memberId, roleId);
      await loadData();
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to assign role:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveRole(memberId: string, roleId: string) {
    setActionLoading(true);
    try {
      await removeRole(memberId, roleId);
      await loadData();
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to remove role:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleKick(memberId: string, username: string) {
    if (confirm(`Are you sure you want to kick ${username}?`)) {
      setActionLoading(true);
      try {
        await kickMember(memberId, 'Kicked by admin');
        await loadData();
        setSelectedMember(null);
      } catch (error) {
        console.error('Failed to kick:', error);
      } finally {
        setActionLoading(false);
      }
    }
  }

  async function handleBan(memberId: string, username: string) {
    if (confirm(`Are you sure you want to BAN ${username}? This cannot be undone easily.`)) {
      setActionLoading(true);
      try {
        await banMember(memberId, 'Banned by admin');
        await loadData();
        setSelectedMember(null);
      } catch (error) {
        console.error('Failed to ban:', error);
      } finally {
        setActionLoading(false);
      }
    }
  }

  async function handleTimeout(memberId: string) {
    setActionLoading(true);
    try {
      await timeoutMember(memberId, timeoutMinutes, timeoutReason);
      showToast(`User timed out for ${timeoutMinutes} minutes`);
      await loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to timeout member', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUntimeout(memberId: string) {
    setActionLoading(true);
    try {
      await untimeoutMember(memberId);
      showToast('Timeout removed');
      await loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove timeout', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSetNickname(memberId: string) {
    if (!newNickname.trim()) return;
    setActionLoading(true);
    try {
      await setMemberNickname(memberId, newNickname);
      showToast('Nickname updated');
      await loadData();
      setNewNickname('');
    } catch (error: any) {
      showToast(error.message || 'Failed to set nickname', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  const filteredMembers = members.filter(m =>
    !m.isBot && (
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.id.includes(search)
    )
  );

  return (
    <>
      <PageMeta
        title="Members | ARIES Admin"
        description="Manage Discord server members"
      />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Server Members
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {members.length} total members • {filteredMembers.length} shown
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              onClick={loadData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Member</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">User ID</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Verified</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Roles</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
                    const isVerified = verifiedUsers.has(member.id);
                    return (
                    <tr
                      key={member.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {member.displayName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{member.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {member.id}
                      </td>
                      <td className="px-6 py-4">
                        {isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            ✗ Not Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {member.roles.slice(0, 3).map(role => (
                            <span
                              key={role.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: role.color + '20', color: role.color }}
                            >
                              {role.name}
                            </span>
                          ))}
                          {member.roles.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{member.roles.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMember(member);
                          }}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No members found</p>
              </div>
            )}
          </div>
        )}

        {/* Member Detail Modal */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Member Details
                </h3>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedMember.avatar}
                  alt={selectedMember.username}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="text-xl font-semibold text-gray-800 dark:text-white">
                    {selectedMember.displayName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{selectedMember.username}
                  </p>
                  <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">
                    ID: {selectedMember.id}
                  </p>
                </div>
              </div>

              {/* Current Roles */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Current Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.roles.map(role => (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: role.color + '20', color: role.color }}
                    >
                      {role.name}
                      <button
                        onClick={() => handleRemoveRole(selectedMember.id, role.id)}
                        className="ml-1 hover:opacity-70"
                        title="Remove role"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Assign Role */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Assign Role
                </label>
                <div className="flex flex-wrap gap-2">
                  {roles
                    .filter(role => !selectedMember.roles.some(r => r.id === role.id))
                    .slice(0, 10)
                    .map(role => (
                      <button
                        key={role.id}
                        onClick={() => handleAssignRole(selectedMember.id, role.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        + {role.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* Nickname Changer */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Change Nickname
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Current: ${selectedMember.displayName}`}
                    value={newNickname}
                    onChange={e => setNewNickname(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => handleSetNickname(selectedMember.id)}
                    disabled={actionLoading || !newNickname.trim()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Timeout / Mute Controls */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <label className="text-sm font-medium text-gray-800 dark:text-white mb-2 block">
                  🔇 Timeout / Mute Member
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { label: '5m', value: 5 },
                    { label: '10m', value: 10 },
                    { label: '1h', value: 60 },
                    { label: '1d', value: 1440 },
                    { label: '7d', value: 10080 },
                  ].map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTimeoutMinutes(item.value)}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        timeoutMinutes === item.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Timeout reason..."
                    value={timeoutReason}
                    onChange={e => setTimeoutReason(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => handleTimeout(selectedMember.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    Mute ({timeoutMinutes}m)
                  </button>
                  <button
                    onClick={() => handleUntimeout(selectedMember.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Unmute
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleKick(selectedMember.id, selectedMember.username)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  Kick
                </button>
                <button
                  onClick={() => handleBan(selectedMember.id, selectedMember.username)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Ban
                </button>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
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
