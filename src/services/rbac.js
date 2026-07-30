// ─── RBAC Service ─────────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function getRoles({ limit = 50, offset = 0, is_active } = {}) {
  try {
    let query = supabase
      .from('rbac_roles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (is_active !== undefined) query = query.eq('is_active', is_active);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('RBAC', 'Get roles failed', { error: err.message });
    throw err;
  }
}

async function getRole(roleId) {
  try {
    const { data, error } = await supabase
      .from('rbac_roles')
      .select('*')
      .eq('role_id', roleId)
      .single();

    if (error) throw error;

    // Get permissions for this role
    const { data: permissions } = await supabase
      .from('rbac_role_permissions')
      .select('*, permission:permission_id(*)')
      .eq('role_id', roleId);

    return { ...data, permissions: permissions?.map(p => p.permission) || [] };
  } catch (err) {
    logger.error('RBAC', 'Get role failed', { roleId, error: err.message });
    throw err;
  }
}

async function createRole(roleData) {
  try {
    const { data, error } = await supabase
      .from('rbac_roles')
      .insert(roleData)
      .select()
      .single();

    if (error) throw error;
    logger.info('RBAC', 'Role created', { roleId: data.role_id, name: data.role_name });
    return data;
  } catch (err) {
    logger.error('RBAC', 'Create role failed', { error: err.message });
    throw err;
  }
}

async function updateRole(roleId, updates) {
  try {
    const { data, error } = await supabase
      .from('rbac_roles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('role_id', roleId)
      .select()
      .single();

    if (error) throw error;
    logger.info('RBAC', 'Role updated', { roleId });
    return data;
  } catch (err) {
    logger.error('RBAC', 'Update role failed', { roleId, error: err.message });
    throw err;
  }
}

async function deleteRole(roleId) {
  try {
    const { error } = await supabase
      .from('rbac_roles')
      .delete()
      .eq('role_id', roleId);

    if (error) throw error;
    logger.info('RBAC', 'Role deleted', { roleId });
  } catch (err) {
    logger.error('RBAC', 'Delete role failed', { roleId, error: err.message });
    throw err;
  }
}

async function getPermissions() {
  try {
    const { data, error } = await supabase
      .from('rbac_permissions')
      .select('*')
      .order('category');

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error('RBAC', 'Get permissions failed', { error: err.message });
    throw err;
  }
}

async function updateRolePermissions(roleId, permissionIds) {
  try {
    // Delete existing permissions
    await supabase
      .from('rbac_role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Insert new permissions
    if (permissionIds.length > 0) {
      const entries = permissionIds.map(pid => ({
        role_id: roleId,
        permission_id: pid
      }));

      const { error } = await supabase
        .from('rbac_role_permissions')
        .insert(entries);

      if (error) throw error;
    }

    logger.info('RBAC', 'Role permissions updated', { roleId, count: permissionIds.length });
  } catch (err) {
    logger.error('RBAC', 'Update role permissions failed', { roleId, error: err.message });
    throw err;
  }
}

async function getUserRoles(userId) {
  try {
    const { data, error } = await supabase
      .from('rbac_user_roles')
      .select('*, role:role_id(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(r => r.role) || [];
  } catch (err) {
    logger.error('RBAC', 'Get user roles failed', { userId, error: err.message });
    throw err;
  }
}

async function assignUserRole(userId, roleId, assignedBy = null) {
  try {
    const { data, error } = await supabase
      .from('rbac_user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy
      })
      .select()
      .single();

    if (error) throw error;
    logger.info('RBAC', 'Role assigned to user', { userId, roleId });
    return data;
  } catch (err) {
    logger.error('RBAC', 'Assign role failed', { userId, roleId, error: err.message });
    throw err;
  }
}

async function removeUserRole(userId, roleId) {
  try {
    const { error } = await supabase
      .from('rbac_user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw error;
    logger.info('RBAC', 'Role removed from user', { userId, roleId });
  } catch (err) {
    logger.error('RBAC', 'Remove role failed', { userId, roleId, error: err.message });
    throw err;
  }
}

async function checkPermission(userId, permissionSlug) {
  try {
    const roles = await getUserRoles(userId);
    
    for (const role of roles) {
      const { data: rolePerms } = await supabase
        .from('rbac_role_permissions')
        .select('permission:permission_id(permission_slug)')
        .eq('role_id', role.role_id);

      const hasPermission = rolePerms?.some(
        rp => rp.permission?.permission_slug === permissionSlug
      );

      if (hasPermission) return true;
    }

    return false;
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
  updateRolePermissions,
  getUserRoles,
  assignUserRole,
  removeUserRole,
  checkPermission
};
