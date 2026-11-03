import React, { useEffect, useState, useMemo } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { CustomSelect, CustomSelectOption } from '../../components/ui/select/CustomSelect';
import { 
  getRoles as getDiscordRoles, 
  getMembers as getDiscordMembers, 
  DiscordRole, 
  DiscordMember 
} from '../../lib/discord';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const COLOR_PALETTE = [
  '#DC2626', '#EA580C', '#D97706', '#16A34A', '#0D9488', '#2563EB',
  '#4F46E5', '#7C3AED', '#C026D3', '#DB2777', '#4B5563', '#1F2937'
];

const ICON_PRESETS = ['👑', '⚡', '⭐', '🛡️', '⚓', '⚔️', '👁️', '🎯', '🎖️', '🔥', '🚀', '💎'];

export interface RbacPermission {
  permission_id: string;
  permission_name: string;
  permission_slug: string;
  category: string;
  description?: string;
}

export interface RbacRole {
  role_id: string;
  role_name: string;
  role_slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  discord_role_id: string | null;
  discord_role_name: string | null;
  color: string;
  icon: string;
  members_count: number;
  permissions_count: number;
  permissions?: RbacPermission[];
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  player_name: string;
  player_id: string | null;
  player_level: number | null;
  role_id: string;
  role: {
    role_id: string;
    role_name: string;
    role_slug: string;
    color: string;
    icon: string;
    is_system: boolean;
  } | null;
  assigned_by: string;
  assigned_at: string;
}

export interface VerifiedPlayer {
  player_id: string;
  discord_user_id: string;
  player_name: string;
  player_level?: number;
  clan_tag?: string;
}

export interface AvailableMember {
  user_id: string;
  username: string;
  displayName: string;
  avatar: string;
  player_name?: string;
  player_id?: string;
  player_level?: number;
  is_verified: boolean;
  is_bot: boolean;
  assigned_roles: {
    id: string;
    role_id: string;
    role_name: string;
    role_slug: string;
    color: string;
    icon: string;
  }[];
}

export interface GroupedUser {
  user_id: string;
  username: string;
  displayName: string;
  avatar: string;
  player_name?: string;
  player_id?: string;
  player_level?: number;
  is_verified: boolean;
  is_bot: boolean;
  assignments: UserRoleAssignment[];
  total_permissions_count: number;
}

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  
  // Data States
  const [rbacRoles, setRbacRoles] = useState<RbacRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<RbacPermission[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserRoleAssignment[]>([]);
  const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([]);
  const [discordMembers, setDiscordMembers] = useState<DiscordMember[]>([]);
  const [verifiedPlayers, setVerifiedPlayers] = useState<VerifiedPlayer[]>([]);
  
  // Loading & Filter States
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RbacRole | null>(null);
  const [roleForm, setRoleForm] = useState({
    role_name: '',
    role_slug: '',
    description: '',
    color: '#3B82F6',
    icon: '🛡️',
    discord_role_id: '',
    discord_role_name: '',
    is_active: true
  });

  // Permission Matrix Modal
  const [permModalRole, setPermModalRole] = useState<RbacRole | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [permSaving, setPermSaving] = useState(false);

  // User Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [manualIdMode, setManualIdMode] = useState(false);
  const [userPickerSearch, setUserPickerSearch] = useState('');
  const [assignForm, setAssignForm] = useState<{
    user_id: string;
    role_ids: string[];
  }>({
    user_id: '',
    role_ids: []
  });

  // Discord Sync State
  const [syncingDiscord, setSyncingDiscord] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSyncFromDiscord = async () => {
    try {
      setSyncingDiscord(true);
      const res = await fetch(`${API_BASE}/rbac/sync-discord`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Sync failed');

      showToast(data.message || 'Discord roles and members synchronized successfully!');
      await fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to sync with Discord', 'error');
    } finally {
      setSyncingDiscord(false);
    }
  };

  // Fetch all RBAC and Member data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes, userRolesRes, playersRes] = await Promise.all([
        fetch(`${API_BASE}/rbac/roles`).then(r => r.json()),
        fetch(`${API_BASE}/rbac/permissions`).then(r => r.json()),
        fetch(`${API_BASE}/rbac/user-roles`).then(r => r.json()),
        fetch(`${API_BASE}/players`).then(r => r.json()).catch(() => ({ success: true, data: [] })),
      ]);

      if (rolesRes.success) setRbacRoles(rolesRes.data || []);
      if (permsRes.success) setAllPermissions(permsRes.data || []);
      if (userRolesRes.success) setUserAssignments(userRolesRes.data || []);
      if (playersRes.success) setVerifiedPlayers(playersRes.data || []);

      // Also fetch discord guild roles and members
      try {
        const [dRoles, dMembers] = await Promise.all([
          getDiscordRoles().catch(() => ({ roles: [] })),
          getDiscordMembers().catch(() => ({ members: [] })),
        ]);
        if (dRoles && dRoles.roles) setDiscordRoles(dRoles.roles.filter((r: DiscordRole) => r.name !== '@everyone'));
        if (dMembers && dMembers.members) setDiscordMembers(dMembers.members);
      } catch (dErr) {
        console.warn('Could not fetch Discord guild data directly:', dErr);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load RBAC data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const [userViewMode, setUserViewMode] = useState<'grouped' | 'detailed'>('grouped');

  // Compute available users list merging Discord Members + Verified Players + Current Assigned Roles
  const availableUsers: AvailableMember[] = useMemo(() => {
    const map = new Map<string, AvailableMember>();
    
    // Group all active assignments by user_id
    const assignmentMap = new Map<string, Array<{ id: string; role_id: string; role_name: string; role_slug: string; color: string; icon: string }>>();
    userAssignments.forEach(u => {
      if (!assignmentMap.has(u.user_id)) assignmentMap.set(u.user_id, []);
      if (u.role) {
        assignmentMap.get(u.user_id)!.push({
          id: u.id,
          role_id: u.role_id,
          role_name: u.role.role_name,
          role_slug: u.role.role_slug,
          color: u.role.color || '#3B82F6',
          icon: u.role.icon || '🛡️'
        });
      }
    });

    // 1. Add Discord server members
    for (const m of discordMembers) {
      if (!m.id) continue;
      map.set(m.id, {
        user_id: m.id,
        username: m.username,
        displayName: m.displayName || m.username,
        avatar: m.avatar,
        is_verified: false,
        is_bot: m.isBot || false,
        assigned_roles: assignmentMap.get(m.id) || [],
      });
    }

    // 2. Merge / Add verified clan players from database
    for (const p of verifiedPlayers) {
      if (!p.discord_user_id) continue;
      const roles = assignmentMap.get(p.discord_user_id) || [];
      const existing = map.get(p.discord_user_id);
      if (existing) {
        existing.player_name = p.player_name;
        existing.player_id = p.player_id;
        existing.player_level = p.player_level;
        existing.is_verified = true;
        existing.assigned_roles = roles;
      } else {
        map.set(p.discord_user_id, {
          user_id: p.discord_user_id,
          username: p.player_name,
          displayName: p.player_name,
          avatar: '',
          player_name: p.player_name,
          player_id: p.player_id,
          player_level: p.player_level,
          is_verified: true,
          is_bot: false,
          assigned_roles: roles,
        });
      }
    }

    // 3. Include any existing assignments not in the above
    for (const a of userAssignments) {
      if (!map.has(a.user_id)) {
        map.set(a.user_id, {
          user_id: a.user_id,
          username: a.player_name || a.user_id,
          displayName: a.player_name || a.user_id,
          avatar: '',
          player_name: a.player_name,
          player_id: a.player_id || undefined,
          player_level: a.player_level || undefined,
          is_verified: !!a.player_name,
          is_bot: false,
          assigned_roles: assignmentMap.get(a.user_id) || [],
        });
      }
    }

    // Sort: Humans first, then verified players, then alphabetical
    return Array.from(map.values()).sort((a, b) => {
      if (a.is_bot !== b.is_bot) return a.is_bot ? 1 : -1;
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
      return (a.player_name || a.displayName).localeCompare(b.player_name || b.displayName);
    });
  }, [discordMembers, verifiedPlayers, userAssignments]);

  // Grouped active user assignments for multi-role rendering (1 row per user)
  const groupedUsers: GroupedUser[] = useMemo(() => {
    const map = new Map<string, GroupedUser>();

    for (const assign of userAssignments) {
      if (!map.has(assign.user_id)) {
        const dMember = discordMembers.find(m => m.id === assign.user_id);
        const vPlayer = verifiedPlayers.find(p => p.discord_user_id === assign.user_id);

        map.set(assign.user_id, {
          user_id: assign.user_id,
          username: dMember?.username || assign.player_name || assign.user_id,
          displayName: dMember?.displayName || assign.player_name || assign.user_id,
          avatar: dMember?.avatar || '',
          player_name: vPlayer?.player_name || (assign.player_name !== 'Server Member' ? assign.player_name : undefined),
          player_id: vPlayer?.player_id || assign.player_id || undefined,
          player_level: vPlayer?.player_level || assign.player_level || undefined,
          is_verified: !!vPlayer || (!!assign.player_name && assign.player_name !== 'Server Member'),
          is_bot: dMember?.isBot || false,
          assignments: [],
          total_permissions_count: 0,
        });
      }

      const userEntry = map.get(assign.user_id)!;
      userEntry.assignments.push(assign);
    }

    // Compute unique permissions per user (Additive Union of permissions)
    map.forEach(u => {
      const permIds = new Set<string>();
      let isSuper = false;

      for (const a of u.assignments) {
        const role = rbacRoles.find(r => r.role_id === a.role_id);
        if (role) {
          if (role.role_slug === 'super_admin') isSuper = true;
          role.permissions?.forEach(p => permIds.add(p.permission_id));
        }
      }

      u.total_permissions_count = isSuper ? allPermissions.length : permIds.size;
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.assignments.length !== a.assignments.length) {
        return b.assignments.length - a.assignments.length;
      }
      return (a.player_name || a.displayName).localeCompare(b.player_name || b.displayName);
    });
  }, [userAssignments, discordMembers, verifiedPlayers, rbacRoles, allPermissions]);

  // Filtered available members in the picker
  const filteredPickerMembers = useMemo(() => {
    if (!userPickerSearch.trim()) return availableUsers;
    const q = userPickerSearch.toLowerCase();
    return availableUsers.filter(u =>
      u.user_id.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      (u.player_name && u.player_name.toLowerCase().includes(q)) ||
      (u.player_id && u.player_id.toLowerCase().includes(q))
    );
  }, [availableUsers, userPickerSearch]);

  // Currently selected member object in the modal
  const selectedMemberObj = useMemo(() => {
    if (!assignForm.user_id) return null;
    return availableUsers.find(u => u.user_id === assignForm.user_id) || {
      user_id: assignForm.user_id,
      username: 'Custom Member',
      displayName: 'Custom Member',
      avatar: '',
      is_verified: false,
      is_bot: false,
      assigned_roles: [],
    };
  }, [availableUsers, assignForm.user_id]);

  // Permissions grouped by category
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, RbacPermission[]> = {};
    for (const p of allPermissions) {
      const cat = p.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }
    return grouped;
  }, [allPermissions]);

  // Options for Assign Role CustomSelect
  const roleAssignOptions: CustomSelectOption[] = useMemo(() => {
    return rbacRoles.map(r => {
      const isAlreadyAssigned = selectedMemberObj?.assigned_roles?.some(ar => ar.role_id === r.role_id);
      return {
        value: r.role_id,
        label: r.role_name,
        subtitle: `@${r.role_slug}`,
        icon: r.icon || '🛡️',
        color: r.color || '#3B82F6',
        badge: `${r.permissions_count || 0} perms`,
        badgeColor: r.color || '#3B82F6',
        disabled: isAlreadyAssigned,
        disabledReason: isAlreadyAssigned ? 'Already Assigned' : undefined,
      };
    });
  }, [rbacRoles, selectedMemberObj]);

  // Options for Linked Discord Role in Create/Edit Role modal
  const discordRoleOptions: CustomSelectOption[] = useMemo(() => {
    const opts: CustomSelectOption[] = [
      {
        value: '',
        label: '-- No Discord Role Link --',
        subtitle: 'Standalone Web RBAC Role',
      }
    ];
    discordRoles.forEach(dr => {
      const hexColor = dr.color ? (dr.color.startsWith('#') ? dr.color : `#${dr.color}`) : undefined;
      opts.push({
        value: dr.id,
        label: `@${dr.name}`,
        subtitle: `ID: ${dr.id}`,
        color: hexColor,
        badge: dr.position !== undefined ? `Pos ${dr.position}` : undefined,
      });
    });
    return opts;
  }, [discordRoles]);

  // Handle Create / Edit Role Submit
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.role_name.trim()) return;

    try {
      const isEdit = !!editingRole;
      const url = isEdit ? `${API_BASE}/rbac/roles/${editingRole.role_id}` : `${API_BASE}/rbac/roles`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save role');
      }

      showToast(isEdit ? `Role "${roleForm.role_name}" updated!` : `Role "${roleForm.role_name}" created!`);
      setShowRoleModal(false);
      setEditingRole(null);
      await fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save role', 'error');
    }
  };

  // Open Edit Role Modal
  const openEditRoleModal = (role: RbacRole) => {
    setEditingRole(role);
    setRoleForm({
      role_name: role.role_name,
      role_slug: role.role_slug,
      description: role.description || '',
      color: role.color || '#3B82F6',
      icon: role.icon || '🛡️',
      discord_role_id: role.discord_role_id || '',
      discord_role_name: role.discord_role_name || '',
      is_active: role.is_active
    });
    setShowRoleModal(true);
  };

  // Delete Custom Role
  const handleDeleteRole = async (role: RbacRole) => {
    if (role.is_system) {
      showToast('System roles cannot be deleted', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to delete custom role "${role.role_name}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/rbac/roles/${role.role_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete role');

      showToast(`Role "${role.role_name}" deleted`);
      await fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete role', 'error');
    }
  };

  // Open Permission Matrix Modal
  const openPermissionModal = async (role: RbacRole) => {
    setPermModalRole(role);
    try {
      const res = await fetch(`${API_BASE}/rbac/roles/${role.role_id}`);
      const data = await res.json();
      if (data.success && data.data?.permission_ids) {
        setSelectedPermIds(new Set(data.data.permission_ids));
      } else {
        setSelectedPermIds(new Set(role.permissions?.map(p => p.permission_id) || []));
      }
    } catch (e) {
      setSelectedPermIds(new Set(role.permissions?.map(p => p.permission_id) || []));
    }
  };

  // Toggle single permission
  const togglePermission = (permId: string) => {
    setSelectedPermIds(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  // Toggle all permissions in category
  const toggleCategoryPermissions = (perms: RbacPermission[]) => {
    const allSelected = perms.every(p => selectedPermIds.has(p.permission_id));
    setSelectedPermIds(prev => {
      const next = new Set(prev);
      perms.forEach(p => {
        if (allSelected) next.delete(p.permission_id);
        else next.add(p.permission_id);
      });
      return next;
    });
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!permModalRole) return;
    try {
      setPermSaving(true);
      const res = await fetch(`${API_BASE}/rbac/roles/${permModalRole.role_id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: Array.from(selectedPermIds) })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update permissions');

      showToast(`Permissions updated for role "${permModalRole.role_name}"!`);
      setPermModalRole(null);
      await fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save permissions', 'error');
    } finally {
      setPermSaving(false);
    }
  };

  // Handle Assign Role(s)
  const handleAssignUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.user_id.trim() || assignForm.role_ids.length === 0) {
      showToast('Please select a member and at least one RBAC role', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rbac/user-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: assignForm.user_id,
          role_ids: assignForm.role_ids
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to assign role(s)');

      showToast(`${assignForm.role_ids.length} role(s) assigned successfully!`);
      setShowAssignModal(false);
      setAssignForm({ user_id: '', role_ids: [] });
      setUserPickerSearch('');
      await fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign role(s)', 'error');
    }
  };

  // Handle Revoke User Role
  const handleRevokeUserRole = async (assignmentId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke role from ${userName}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/rbac/user-roles/${assignmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to revoke role');

      showToast(`Role revoked successfully`);
      await fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke role', 'error');
    }
  };

  // Filtered Roles / Users
  const filteredRoles = rbacRoles.filter(r =>
    r.role_name.toLowerCase().includes(search.toLowerCase()) ||
    r.role_slug.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredGroupedUsers = groupedUsers.filter(u =>
    u.user_id.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    (u.player_name && u.player_name.toLowerCase().includes(search.toLowerCase())) ||
    (u.player_id && u.player_id.toLowerCase().includes(search.toLowerCase())) ||
    u.assignments.some(a => a.role?.role_name.toLowerCase().includes(search.toLowerCase()) || a.role?.role_slug.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredAssignments = userAssignments.filter(u =>
    u.user_id.toLowerCase().includes(search.toLowerCase()) ||
    (u.player_name && u.player_name.toLowerCase().includes(search.toLowerCase())) ||
    (u.role && u.role.role_name.toLowerCase().includes(search.toLowerCase()))
  );

  const linkedDiscordCount = rbacRoles.filter(r => !!r.discord_role_id).length;

  return (
    <>
      <PageMeta
        title="Roles & Permissions (RBAC) | ARIES Verification Admin"
        description="Role-Based Access Control and Discord Server Role Management"
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[99999] px-4 py-3 rounded-xl shadow-2xl text-white font-medium flex items-center gap-2 transition-all transform animate-bounce ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Role-Based Access Control (RBAC) & Discord Roles
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage system roles, 35 granular permissions, user assignments, and Discord Server Role sync.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {activeTab === 'roles' && (
              <button
                onClick={() => {
                  setEditingRole(null);
                  setRoleForm({
                    role_name: '',
                    role_slug: '',
                    description: '',
                    color: '#3B82F6',
                    icon: '🛡️',
                    discord_role_id: '',
                    discord_role_name: '',
                    is_active: true
                  });
                  setShowRoleModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> Add Custom Role
              </button>
            )}

            {activeTab === 'users' && (
              <button
                onClick={() => {
                  setAssignForm({ user_id: '', role_ids: [] });
                  setUserPickerSearch('');
                  setManualIdMode(false);
                  setShowAssignModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> Assign Role to Member
              </button>
            )}

            {/* Sync from Discord Server Button */}
            <button
              onClick={handleSyncFromDiscord}
              disabled={syncingDiscord}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Import and sync all Discord server roles and member assignments into Web RBAC"
            >
              <span className={syncingDiscord ? 'animate-spin' : ''}>🔄</span>
              <span>{syncingDiscord ? 'Syncing...' : 'Sync from Discord'}</span>
            </button>

            <button
              onClick={fetchAllData}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Unified Discord & Web Roles Info Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                1:1 Discord & Web Roles Unified Sync
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                Role Discord server Anda (<span className="font-semibold text-blue-600 dark:text-blue-400">@Verified</span>, <span className="font-semibold text-blue-600 dark:text-blue-400">@Annnyaaa's Boyfriend</span>, dll.) otomatis sinkron 1:1 dengan sistem permission Web & Bot. Member yang memegang role di Discord otomatis memiliki hak akses yang dikonfigurasi tanpa perlu input manual berulang kali.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncFromDiscord}
            disabled={syncingDiscord}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={syncingDiscord ? 'animate-spin' : ''}>🔄</span>
            {syncingDiscord ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* 4 Metric Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
              🛡️
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Roles</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{rbacRoles.length}</h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold">
              🔑
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Permissions</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{allPermissions.length}</h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-2xl font-bold">
              👥
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Assignments</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{userAssignments.length}</h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
              🔗
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Linked Discord Roles</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{linkedDiscordCount}</h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'roles'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>🛡️</span> Roles & Permissions ({rbacRoles.length})
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>👥</span> Member Assignments ({userAssignments.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2 text-gray-400 text-sm">🔍</span>
          </div>
        </div>

        {/* TAB 1: UNIFIED ROLES & PERMISSIONS */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-16 text-center text-gray-400">
                <span className="inline-block animate-spin text-3xl mb-2">⏳</span>
                <p>Loading roles and permissions matrix...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <span className="text-4xl mb-2 block">🛡️</span>
                <p className="font-semibold text-gray-700 dark:text-gray-300">No roles found matching "{search}"</p>
              </div>
            ) : (
              filteredRoles.map(role => (
                <div
                  key={role.role_id}
                  className="relative flex flex-col justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Top Color Banner */}
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: role.color || '#3B82F6' }}
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                            style={{ backgroundColor: `${role.color}15`, color: role.color }}
                          >
                            {role.icon || '🛡️'}
                          </span>
                          <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {role.role_name}
                            </h3>
                            <span className="text-xs font-mono text-gray-400">
                              @{role.role_slug}
                            </span>
                          </div>
                        </div>

                        {/* System / Custom Badge */}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          role.is_system
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {role.is_system ? '🔒 System' : '✨ Custom'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed min-h-[36px] line-clamp-2">
                        {role.description || 'No description provided.'}
                      </p>

                      {/* Meta Tags Bar */}
                      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                          🔑 <strong>{role.permissions_count}</strong> / {allPermissions.length} Perms
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                          👥 <strong>{role.members_count}</strong> Members
                        </span>
                        {role.discord_role_id ? (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5 shadow-2xs" title={`Linked Discord Server Role ID: ${role.discord_role_id}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span>💬 @{role.discord_role_name || role.role_name}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium text-[11px]">
                            💬 Standalone Web Role
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => openPermissionModal(role)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>🔑</span> Edit Permissions
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditRoleModal(role)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 text-xs transition-colors cursor-pointer"
                          title="Edit role details"
                        >
                          ✏️
                        </button>
                        {!role.is_system && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs transition-colors cursor-pointer"
                            title="Delete role"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MULTI-ROLE USER ASSIGNMENTS */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Tab Header & View Switcher */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Multi-Role User Assignments
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {groupedUsers.length} Members ({userAssignments.length} Roles)
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  1 member can hold multiple roles simultaneously with additive (Union) permissions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Switcher */}
                <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setUserViewMode('grouped')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      userViewMode === 'grouped'
                        ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    👥 Grouped ({groupedUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserViewMode('detailed')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      userViewMode === 'detailed'
                        ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    📋 All Logs ({userAssignments.length})
                  </button>
                </div>

                <button
                  onClick={() => {
                    setAssignForm({ user_id: '', role_ids: [] });
                    setUserPickerSearch('');
                    setManualIdMode(false);
                    setShowAssignModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>+</span> Assign Role
                </button>
              </div>
            </div>

            {/* VIEW A: GROUPED MULTI-ROLE MEMBER VIEW */}
            {userViewMode === 'grouped' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-5 py-3.5">Member / Player</th>
                      <th className="px-5 py-3.5">Discord ID</th>
                      <th className="px-5 py-3.5">Assigned Roles (Multi-Role)</th>
                      <th className="px-5 py-3.5">Effective Permissions</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400">Loading members...</td>
                      </tr>
                    ) : filteredGroupedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400">No members found matching "{search}"</td>
                      </tr>
                    ) : (
                      filteredGroupedUsers.map(u => (
                        <tr key={u.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          {/* Member Avatar & Player Info */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt=""
                                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(u.player_name || u.displayName).slice(0, 2).toUpperCase()}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900 dark:text-white">
                                    {u.player_name ? <span>⚓ {u.player_name}</span> : u.displayName}
                                  </p>
                                  {u.player_level && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                      Lv. {u.player_level}
                                    </span>
                                  )}
                                  {u.is_verified && (
                                    <span className="text-xs" title="Verified Player">✅</span>
                                  )}
                                  {u.is_bot && (
                                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                      BOT
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-mono text-gray-400">
                                  @{u.username}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Snowflake ID */}
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(u.user_id);
                                showToast('Discord User ID copied to clipboard!');
                              }}
                              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Click to copy ID"
                            >
                              <span>{u.user_id}</span>
                              <span className="text-[10px] opacity-60">📋</span>
                            </button>
                          </td>

                          {/* Multi-Role Badges with Inline Revoke */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-lg">
                              {u.assignments.map(a => (
                                <span
                                  key={a.id}
                                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold text-white shadow-xs transition-transform hover:scale-105"
                                  style={{ backgroundColor: a.role?.color || '#3B82F6' }}
                                >
                                  <span>{a.role?.icon || '🛡️'}</span>
                                  <span>{a.role?.role_name || 'Role'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeUserRole(a.id, `${a.role?.role_name || 'Role'} from ${u.player_name || u.displayName}`)}
                                    className="w-4 h-4 ml-0.5 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-[10px] leading-none transition-colors cursor-pointer"
                                    title={`Revoke role "${a.role?.role_name}"`}
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}

                              {/* Quick + Add Role Button for this specific member */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignForm({ user_id: u.user_id, role_ids: [] });
                                  setManualIdMode(false);
                                  setShowAssignModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400 transition-colors cursor-pointer"
                                title={`Add another role to ${u.player_name || u.displayName}`}
                              >
                                <span className="font-bold">+</span>
                                <span>Add Role</span>
                              </button>
                            </div>
                          </td>

                          {/* Combined Effective Permissions Union */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-2xs">
                              <span>🔑</span>
                              <span>{u.total_permissions_count} / {allPermissions.length} Perms</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setAssignForm({ user_id: u.user_id, role_ids: [] });
                                setManualIdMode(false);
                                setShowAssignModal(true);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-xl transition-colors cursor-pointer"
                            >
                              + Assign Role
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW B: DETAILED ASSIGNMENT LOGS TABLE */}
            {userViewMode === 'detailed' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-5 py-3.5">Member / Player</th>
                      <th className="px-5 py-3.5">Discord User ID</th>
                      <th className="px-5 py-3.5">Assigned Role</th>
                      <th className="px-5 py-3.5">Assigned By</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400">Loading assignments...</td>
                      </tr>
                    ) : filteredAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400">No user assignments found</td>
                      </tr>
                    ) : (
                      filteredAssignments.map(ur => (
                        <tr key={ur.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                {ur.player_name ? ur.player_name.slice(0, 2).toUpperCase() : 'US'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{ur.player_name}</p>
                                {ur.player_id && <p className="text-[11px] text-gray-400">ID: {ur.player_id} • Lv. {ur.player_level || '-'}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                            {ur.user_id}
                          </td>
                          <td className="px-5 py-3.5">
                            {ur.role ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                                style={{ backgroundColor: ur.role.color || '#3B82F6' }}
                              >
                                <span>{ur.role.icon || '🛡️'}</span>
                                <span>{ur.role.role_name}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Unknown Role</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                            {ur.assigned_by || 'Admin'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(ur.assigned_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleRevokeUserRole(ur.id, ur.player_name || ur.user_id)}
                              className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: PERMISSION MATRIX CHECKLIST */}
      {permModalRole && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                  style={{ backgroundColor: `${permModalRole.color}15`, color: permModalRole.color }}
                >
                  {permModalRole.icon || '🛡️'}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Edit Permissions — {permModalRole.role_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select permissions granted to members with this role ({selectedPermIds.size} / {allPermissions.length} active)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermModalRole(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Grouped Permissions */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {Object.entries(permissionsByCategory).map(([category, perms]) => {
                const categorySelectedCount = perms.filter(p => selectedPermIds.has(p.permission_id)).length;
                const isAllSelected = categorySelectedCount === perms.length;

                return (
                  <div key={category} className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 border border-gray-200/80 dark:border-gray-800">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 dark:border-gray-700/60 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                          {category}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {categorySelectedCount} / {perms.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCategoryPermissions(perms)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {perms.map(p => {
                        const checked = selectedPermIds.has(p.permission_id);

                        return (
                          <label
                            key={p.permission_id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                              checked
                                ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                                : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(p.permission_id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${checked ? 'font-bold text-blue-950 dark:text-blue-200' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                {p.permission_name}
                              </p>
                              <p className="text-[10px] font-mono text-gray-400 truncate">
                                {p.permission_slug}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {selectedPermIds.size} permissions selected for this role
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPermModalRole(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={permSaving}
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {permSaving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT ROLE */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingRole ? `Edit Role: ${editingRole.role_name}` : 'Create New Custom Role'}
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. War Strategist, Trial Member"
                  value={roleForm.role_name}
                  onChange={e => setRoleForm({ ...roleForm, role_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingRole?.is_system && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Slug / Identifier (lowercase, underscores)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. war_strategist"
                    value={roleForm.role_slug}
                    onChange={e => setRoleForm({ ...roleForm, role_slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Role responsibilities and scope"
                  value={roleForm.description}
                  onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Icon Emoji Picker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Icon Emoji
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={roleForm.icon}
                      onChange={e => setRoleForm({ ...roleForm, icon: e.target.value })}
                      className="w-12 text-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg"
                    />
                    <div className="flex flex-wrap gap-1">
                      {ICON_PRESETS.slice(0, 6).map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setRoleForm({ ...roleForm, icon })}
                          className="w-7 h-7 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Badge Color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setRoleForm({ ...roleForm, color: col })}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          roleForm.color === col ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Discord Linked Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Linked Discord Server Role (Optional)
                </label>
                <CustomSelect
                  options={discordRoleOptions}
                  value={roleForm.discord_role_id || ''}
                  onChange={(selectedId) => {
                    const dRole = discordRoles.find(r => r.id === selectedId);
                    setRoleForm({
                      ...roleForm,
                      discord_role_id: selectedId,
                      discord_role_name: dRole ? dRole.name : ''
                    });
                  }}
                  placeholder="-- No Discord Role Link --"
                  size="md"
                  searchable={true}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow cursor-pointer"
                >
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN USER ROLE (WITH AVAILABLE SERVER MEMBER PICKER) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh] overflow-visible">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>👥</span> Assign Role(s) to Server Member
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select from active Discord members or verified clan players
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignUserRole} className="space-y-4 text-sm flex-1 flex flex-col overflow-visible">
              {/* Member Selection Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Target Member *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setManualIdMode(!manualIdMode);
                      if (manualIdMode) {
                        setAssignForm(prev => ({ ...prev, user_id: '' }));
                      }
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                  >
                    {manualIdMode ? '👥 Select from Server Members' : '✏️ Enter Discord ID manually'}
                  </button>
                </div>

                {/* Mode A: Manual Raw ID Input */}
                {manualIdMode ? (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1023370561507840052"
                      value={assignForm.user_id}
                      onChange={e => setAssignForm({ ...assignForm, user_id: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Paste the 18-19 digit Discord User Snowflake ID</p>
                  </div>
                ) : (
                  /* Mode B: Visual Searchable Member Picker */
                  <div className="space-y-2">
                    {assignForm.user_id ? (
                      /* Selected User Card */
                      <div className="p-3.5 rounded-xl border-2 border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {selectedMemberObj?.avatar ? (
                              <img
                                src={selectedMemberObj.avatar}
                                alt=""
                                className="w-10 h-10 rounded-full border border-blue-300 dark:border-blue-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow">
                                {(selectedMemberObj?.player_name || selectedMemberObj?.displayName || 'U').slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                  {selectedMemberObj?.player_name ? <span>⚓ {selectedMemberObj.player_name}</span> : selectedMemberObj?.displayName}
                                </h4>
                                {selectedMemberObj?.player_level && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                                    Lv. {selectedMemberObj.player_level}
                                  </span>
                                )}
                                {selectedMemberObj?.is_verified && (
                                  <span className="text-xs" title="Verified Clan Sailor">✅</span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                                @{selectedMemberObj?.username} • ID: {selectedMemberObj?.user_id}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setAssignForm(prev => ({ ...prev, user_id: '' }))}
                            className="px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-200/60 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            Change
                          </button>
                        </div>

                        {/* Existing Roles List for Selected User */}
                        {selectedMemberObj?.assigned_roles && selectedMemberObj.assigned_roles.length > 0 && (
                          <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Current roles:</span>
                            {selectedMemberObj.assigned_roles.map(ar => (
                              <span
                                key={ar.id || ar.role_id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                                style={{ backgroundColor: ar.color || '#3B82F6' }}
                              >
                                <span>{ar.icon || '🛡️'}</span>
                                <span>{ar.role_name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Search & Member List */
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/50">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2">
                          <span className="text-gray-400 text-xs pl-1">🔍</span>
                          <input
                            type="text"
                            placeholder="Search by Discord username, player name, or ID..."
                            value={userPickerSearch}
                            onChange={e => setUserPickerSearch(e.target.value)}
                            className="w-full bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          {userPickerSearch && (
                            <button
                              type="button"
                              onClick={() => setUserPickerSearch('')}
                              className="text-gray-400 hover:text-gray-600 text-xs px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Member List (Scrollable) */}
                        <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 custom-scrollbar">
                          {filteredPickerMembers.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-400">
                              No members found matching "{userPickerSearch}"
                            </div>
                          ) : (
                            filteredPickerMembers.map(member => (
                              <div
                                key={member.user_id}
                                onClick={() => setAssignForm(prev => ({ ...prev, user_id: member.user_id }))}
                                className="p-2.5 flex items-center justify-between gap-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {member.avatar ? (
                                    <img
                                      src={member.avatar}
                                      alt=""
                                      className="w-8 h-8 rounded-full shrink-0 border border-gray-200 dark:border-gray-700"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                                      {(member.player_name || member.displayName).slice(0, 2).toUpperCase()}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                        {member.player_name ? (
                                          <span>⚓ {member.player_name}</span>
                                        ) : (
                                          member.displayName
                                        )}
                                      </p>
                                      {member.player_level && (
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                          (Lv. {member.player_level})
                                        </span>
                                      )}
                                      {member.is_bot && (
                                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                          BOT
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                                      @{member.username} • {member.user_id}
                                    </p>
                                  </div>
                                </div>

                                {/* Multi-Role badges if member already has roles */}
                                {member.assigned_roles && member.assigned_roles.length > 0 && (
                                  <div className="flex items-center gap-1 shrink-0 flex-wrap max-w-[180px] justify-end">
                                    {member.assigned_roles.map(ar => (
                                      <span
                                        key={ar.id || ar.role_id}
                                        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white shadow-2xs"
                                        style={{ backgroundColor: ar.color || '#3B82F6' }}
                                        title={ar.role_name}
                                      >
                                        {ar.icon || '🛡️'} {ar.role_name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RBAC Role Selector (Multi-Select) */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Select RBAC Role(s) to Add *
                </label>
                <CustomSelect
                  multiple={true}
                  options={roleAssignOptions}
                  value={assignForm.role_ids}
                  onChange={(vals: string[]) => setAssignForm({ ...assignForm, role_ids: vals })}
                  placeholder="-- Choose Role(s) to Assign --"
                  size="md"
                  searchable={true}
                  placement="top"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!assignForm.user_id || assignForm.role_ids.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign {assignForm.role_ids.length > 1 ? `${assignForm.role_ids.length} Roles` : 'Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
