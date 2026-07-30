// ─── RBAC API Routes ──────────────────────────────────────────────────────────
const express = require('express');
const rbacService = require('../services/rbac');
const logger = require('../utils/logger');

function createRBACRouter() {
  const router = express.Router();

  // GET /api/rbac/roles - List all roles
  router.get('/roles', async (req, res) => {
    try {
      const { limit, offset, is_active } = req.query;
      const result = await rbacService.getRoles({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        is_active: is_active !== undefined ? is_active === 'true' : undefined
      });
      res.json(result);
    } catch (error) {
      logger.error('API', 'Get roles failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/rbac/roles/:roleId - Get role detail
  router.get('/roles/:roleId', async (req, res) => {
    try {
      const role = await rbacService.getRole(req.params.roleId);
      if (!role) return res.status(404).json({ error: 'Role not found' });
      res.json(role);
    } catch (error) {
      logger.error('API', 'Get role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/rbac/roles - Create role
  router.post('/roles', async (req, res) => {
    try {
      const role = await rbacService.createRole(req.body);
      res.status(201).json(role);
    } catch (error) {
      logger.error('API', 'Create role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/rbac/roles/:roleId - Update role
  router.put('/roles/:roleId', async (req, res) => {
    try {
      const role = await rbacService.updateRole(req.params.roleId, req.body);
      res.json(role);
    } catch (error) {
      logger.error('API', 'Update role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/rbac/roles/:roleId - Delete role
  router.delete('/roles/:roleId', async (req, res) => {
    try {
      await rbacService.deleteRole(req.params.roleId);
      res.json({ success: true });
    } catch (error) {
      logger.error('API', 'Delete role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/rbac/permissions - List all permissions
  router.get('/permissions', async (req, res) => {
    try {
      const permissions = await rbacService.getPermissions();
      res.json(permissions);
    } catch (error) {
      logger.error('API', 'Get permissions failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/rbac/roles/:roleId/permissions - Update role permissions
  router.put('/roles/:roleId/permissions', async (req, res) => {
    try {
      const { permission_ids } = req.body;
      await rbacService.updateRolePermissions(req.params.roleId, permission_ids || []);
      res.json({ success: true });
    } catch (error) {
      logger.error('API', 'Update role permissions failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/rbac/users/:userId/roles - Get user roles
  router.get('/users/:userId/roles', async (req, res) => {
    try {
      const roles = await rbacService.getUserRoles(req.params.userId);
      res.json(roles);
    } catch (error) {
      logger.error('API', 'Get user roles failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/rbac/users/:userId/roles - Assign role to user
  router.post('/users/:userId/roles', async (req, res) => {
    try {
      const { role_id, assigned_by } = req.body;
      const result = await rbacService.assignUserRole(req.params.userId, role_id, assigned_by);
      res.status(201).json(result);
    } catch (error) {
      logger.error('API', 'Assign role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/rbac/users/:userId/roles/:roleId - Remove role from user
  router.delete('/users/:userId/roles/:roleId', async (req, res) => {
    try {
      await rbacService.removeUserRole(req.params.userId, req.params.roleId);
      res.json({ success: true });
    } catch (error) {
      logger.error('API', 'Remove role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createRBACRouter };
