// ─── Wars API Routes ──────────────────────────────────────────────────────────
const express = require('express');
const warsService = require('../services/wars');
const logger = require('../utils/logger');

function createWarsRouter() {
  const router = express.Router();

  // GET /api/wars - List all wars
  router.get('/', async (req, res) => {
    try {
      const { limit, offset, status, war_type, team_id } = req.query;
      const result = await warsService.getWars({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        status,
        war_type,
        team_id
      });
      res.json(result);
    } catch (error) {
      logger.error('API', 'Get wars failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/wars/:warId - Get war detail
  router.get('/:warId', async (req, res) => {
    try {
      const war = await warsService.getWar(req.params.warId);
      if (!war) return res.status(404).json({ error: 'War not found' });
      res.json(war);
    } catch (error) {
      logger.error('API', 'Get war failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/wars - Create war
  router.post('/', async (req, res) => {
    try {
      const war = await warsService.createWar(req.body);
      res.status(201).json(war);
    } catch (error) {
      logger.error('API', 'Create war failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/wars/:warId - Update war
  router.put('/:warId', async (req, res) => {
    try {
      const war = await warsService.updateWar(req.params.warId, req.body);
      res.json(war);
    } catch (error) {
      logger.error('API', 'Update war failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/wars/:warId - Delete war
  router.delete('/:warId', async (req, res) => {
    try {
      await warsService.deleteWar(req.params.warId);
      res.json({ success: true });
    } catch (error) {
      logger.error('API', 'Delete war failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/wars/:warId/roster - Add player to roster
  router.post('/:warId/roster', async (req, res) => {
    try {
      const { player_id, team_side, role } = req.body;
      const entry = await warsService.addRosterPlayer(req.params.warId, player_id, team_side, role);
      res.status(201).json(entry);
    } catch (error) {
      logger.error('API', 'Add roster player failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/wars/:warId/roster/:playerId - Update roster player
  router.put('/:warId/roster/:playerId', async (req, res) => {
    try {
      const entry = await warsService.updateRosterPlayer(req.params.warId, req.params.playerId, req.body);
      res.json(entry);
    } catch (error) {
      logger.error('API', 'Update roster player failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/wars/:warId/complete - Complete war
  router.post('/:warId/complete', async (req, res) => {
    try {
      const war = await warsService.completeWar(req.params.warId, req.body);
      res.json(war);
    } catch (error) {
      logger.error('API', 'Complete war failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createWarsRouter };
