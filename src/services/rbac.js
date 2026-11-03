// ─── RBAC Service (Bot & Discord Integration) ──────────────────────────────────
const axios = require('axios');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

const API_BASE = process.env.VITE_API_URL || 'http://localhost:8000/api';

// In-memory cache for fast permission resolution
const cache = {
  roles: null,
  rolesExpiry: 0,
  permissions: null,
  permissionsExpiry: 0,
  userPerms: new Map(), // userId -> { perms: Set<string>, roles: Array, expiry: number }
};

const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Fetch all roles from API or Supabase fallback
 */
async function getRoles({ is_active } = {}) {
  try {
    const res = await axios.get(`${API_BASE}/rbac/roles`, { timeout: 3000 });
    if (res.data?.success) {
      cache.roles = res.data.data;
      cache.rolesExpiry = Date.now() + CACHE_TTL;
      return { data: res.data.data, total: res.data.total };
    }
  } catch (apiErr) {
    logger.warn('RBAC', 'API getRoles fallback to Supabase', { error: apiErr.message });
  }

  // Supabase fallback
  try {
    let query = supabase
      .from('rbac_roles')
      .select('*', { count: 'exact' })
      .order('is_system', { ascending: false });

    if (is_active !== undefined) query = query.eq('is_active', is_active);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('RBAC', 'Get roles failed', { error: err.message });
    return { data: [], total: 0 };
  }
}

/**
 * Fetch single role
 */
async function getRole(roleIdOrSlug) {
  try {
    const res = await axios.get(`${API_BASE}/rbac/roles/${roleIdOrSlug}`, { timeout: 3000 });
    if (res.data?.success) {
      return res.data.data;
    }
  } catch (apiErr) {
    logger.warn('RBAC', 'API getRole fallback to Supabase', { error: apiErr.message });
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleIdOrSlug);
    let query = supabase.from('rbac_roles').select('*');
    if (isUuid) {
      query = query.eq('role_id', roleIdOrSlug);
    } else {
      query = query.eq('role_slug', roleIdOrSlug);
    }

    const { data, error } = await query.single();
    if (error) throw error;

    const { data: permissions } = await supabase
      .from('rbac_role_permissions')
      .select('*, permission:permission_id(*)')
      .eq('role_id', data.role_id);

    return { ...data, permissions: permissions?.map(p => p.permission) || [] };
  } catch (err) {
    logger.error('RBAC', 'Get role failed', { roleIdOrSlug, error: err.message });
    throw err;
  }
}

/**
 * Create custom role
 */
async function createRole(roleData) {
  try {
    const res = await axios.post(`${API_BASE}/rbac/roles`, roleData, { timeout: 4000 });
    if (res.data?.success) {
      cache.roles = null; // Invalidate cache
      return res.data.data;
    }
  } catch (apiErr) {
    logger.warn('RBAC', 'API createRole fallback to Supabase', { error: apiErr.message });
  }

  const { data, error } = await supabase
    .from('rbac_roles')
    .insert(roleData)
    .select()
    .single();

  if (error) throw error;
  cache.roles = null;
  return data;
}

/**
 * Update role
 */
async function updateRole(roleId, updates) {
  try {
    const res = await axios.put(`${API_BASE}/rbac/roles/${roleId}`, updates, { timeout: 4000 });
    if (res.data?.success) {
      cache.roles = null;
      return res.data.data;
    }
  } catch (apiErr) {
    logger.warn('RBAC', 'API updateRole fallback', { error: apiErr.message });
  }

  const { data, error } = await supabase
    .from('rbac_roles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('role_id', roleId)
    .select()
    .single();

  if (error) throw error;
  cache.roles = null;
  return data;
}

/**
 * Delete role
 */
async function deleteRole(roleId) {
  try {
    await axios.delete(`${API_BASE}/rbac/roles/${roleId}`, { timeout: 4000 });
    cache.roles = null;
    return true;
  } catch (err) {
    logger.error('RBAC', 'Delete role failed', { roleId, error: err.message });
    throw err;
  }
}

/**
 * Get all available permissions
 */
async function getPermissions() {
  if (cache.permissions && Date.now() < cache.permissionsExpiry) {
    return cache.permissions;
  }

  try {
    const res = await axios.get(`${API_BASE}/rbac/permissions`, { timeout: 3000 });
    if (res.data?.success) {
      cache.permissions = res.data.data;
      cache.permissionsExpiry = Date.now() + 60 * 1000;
      return res.data.data;
    }
  } catch (apiErr) {
    logger.warn('RBAC', 'API getPermissions fallback to Supabase', { error: apiErr.message });
  }

  const { data, error } = await supabase.from('rbac_permissions').select('*').order('category');
  if (error) throw error;
  cache.permissions = data || [];
  cache.permissionsExpiry = Date.now() + 60 * 1000;
  return cache.permissions;
}

/**
 * Assign role to Discord user
 */
async function assignUserRole(userId, roleId, assignedBy = null) {
  try {
    const res = await axios.post(`${API_BASE}/rbac/user-roles`, {
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy || 'Discord Bot'
    }, { timeout: 4000 });

    cache.userPerms.delete(userId); // Invalidate user cache
    return res.data;
  } catch (err) {
    logger.error('RBAC', 'Assign user role failed', { userId, roleId, error: err.message });
    throw err;
  }
}

/**
 * Remove role from Discord user
 */
async function removeUserRole(userId, roleId) {
  try {
    const res = await axios.post(`${API_BASE}/rbac/user-roles/revoke`, {
      user_id: userId,
      role_id: roleId
    }, { timeout: 4000 });

    cache.userPerms.delete(userId);
    return res.data;
  } catch (err) {
    logger.error('RBAC', 'Remove user role failed', { userId, roleId, error: err.message });
    throw err;
  }
}

/**
 * Get all active roles and permissions for a Discord user
 */
async function getUserRolesAndPermissions(userId, member = null) {
  // Check in-memory cache
  const cached = cache.userPerms.get(userId);
  if (cached && Date.now() < cached.expiry) {
    return cached;
  }

  const effectiveRoles = [];
  const permissionsSet = new Set();

  // 1. Check if user is Discord Guild Owner or Administrator
  if (member) {
    const isOwner = member.guild?.ownerId === userId;
    const isAdmin = member.permissions?.has('Administrator');
    if (isOwner || isAdmin) {
      // Super Admin override
      const allPerms = await getPermissions();
      allPerms.forEach(p => permissionsSet.add(p.permission_slug));
      const superRole = {
        role_name: isOwner ? 'Server Owner' : 'Discord Administrator',
        role_slug: 'super_admin',
        icon: '👑',
        color: '#DC2626',
        is_system: true
      };
      effectiveRoles.push(superRole);

      const result = { roles: effectiveRoles, permissions: Array.from(permissionsSet), isSuperAdmin: true, expiry: Date.now() + CACHE_TTL };
      cache.userPerms.set(userId, result);
      return result;
    }
  }

  // 2. Fetch direct user roles from database
  try {
    const { data: userRoles } = await supabase
      .from('rbac_user_roles')
      .select('*, role:role_id(*)')
      .eq('user_id', userId);

    if (userRoles && userRoles.length > 0) {
      for (const ur of userRoles) {
        if (ur.role && ur.role.is_active) {
          effectiveRoles.push(ur.role);

          // Get role permissions
          const { data: rolePerms } = await supabase
            .from('rbac_role_permissions')
            .select('permission:permission_id(permission_slug)')
            .eq('role_id', ur.role.role_id);

          rolePerms?.forEach(rp => {
            if (rp.permission?.permission_slug) {
              permissionsSet.add(rp.permission.permission_slug);
            }
          });
        }
      }
    }
  } catch (dbErr) {
    logger.warn('RBAC', 'Failed fetching direct user roles', { userId, error: dbErr.message });
  }

  // 3. Check Discord Guild Server Roles mapping
  if (member && member.roles?.cache) {
    try {
      const { data: allRoles } = await getRoles({ is_active: true });
      const memberRoleIds = new Set(member.roles.cache.keys());

      for (const r of allRoles || []) {
        if (r.discord_role_id && memberRoleIds.has(r.discord_role_id)) {
          // If not already in effectiveRoles
          if (!effectiveRoles.some(er => er.role_id === r.role_id)) {
            effectiveRoles.push(r);
            r.permissions?.forEach(p => permissionsSet.add(p.permission_slug));
          }
        }
      }
    } catch (mapErr) {
      logger.warn('RBAC', 'Failed checking discord role mapping', { error: mapErr.message });
    }
  }

  const isSuperAdmin = effectiveRoles.some(r => r.role_slug === 'super_admin');
  if (isSuperAdmin) {
    const allPerms = await getPermissions();
    allPerms.forEach(p => permissionsSet.add(p.permission_slug));
  }

  const result = {
    roles: effectiveRoles,
    permissions: Array.from(permissionsSet),
    isSuperAdmin,
    expiry: Date.now() + CACHE_TTL
  };

  cache.userPerms.set(userId, result);
  return result;
}

/**
 * Check if a Discord user / member has a specific permission slug
 * @param {string} userId - Discord User ID
 * @param {string} permissionSlug - e.g. 'points.award', 'teams.manage', 'wars.create'
 * @param {GuildMember|null} member - Discord GuildMember instance if available
 * @returns {Promise<boolean>}
 */
async function checkPermission(userId, permissionSlug, member = null) {
  try {
    const { permissions, isSuperAdmin } = await getUserRolesAndPermissions(userId, member);
    if (isSuperAdmin) return true;
    return permissions.includes(permissionSlug);
  } catch (err) {
    logger.error('RBAC', 'Check permission failed', { userId, permissionSlug, error: err.message });
    return false;
  }
}

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  assignUserRole,
  removeUserRole,
  getUserRolesAndPermissions,
  checkPermission,
};
