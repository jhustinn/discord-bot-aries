// ─── Players API Routes ──────────────────────────────────────────────────────
const express = require('express');
const playersService = require('../services/players');
const logger = require('../utils/logger');

function createPlayersRouter() {
  const router = express.Router();

  // GET /api/players - List all players
  router.get('/', async (req, res) => {
    try {
      const { limit, offset, status, region, timezone } = req.query;
      const result = await playersService.getPlayers({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        status,
        region,
        timezone
      });
      res.json(result);
    } catch (error) {
      logger.error('API', 'Get players failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/players/:playerId - Get player detail
  router.get('/:playerId', async (req, res) => {
    try {
      const player = await playersService.getPlayer(req.params.playerId);
      if (!player) return res.status(404).json({ error: 'Player not found' });
      res.json(player);
    } catch (error) {
      logger.error('API', 'Get player failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/players - Create player
  router.post('/', async (req, res) => {
    try {
      const player = await playersService.createPlayer(req.body);
      res.status(201).json(player);
    } catch (error) {
      logger.error('API', 'Create player failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/players/:playerId - Update player
  router.put('/:playerId', async (req, res) => {
    try {
      const player = await playersService.updatePlayer(req.params.playerId, req.body);
      res.json(player);
    } catch (error) {
      logger.error('API', 'Update player failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/players/:playerId - Delete player
  router.delete('/:playerId', async (req, res) => {
    try {
      await playersService.deletePlayer(req.params.playerId);
      res.json({ success: true });
    } catch (error) {
      logger.error('API', 'Delete player failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/players/:playerId/availability - Get player availability
  router.get('/:playerId/availability', async (req, res) => {
    try {
      const availability = await playersService.getPlayerAvailability(req.params.playerId);
      res.json(availability);
    } catch (error) {
      logger.error('API', 'Get availability failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/players/:playerId/availability - Set player availability
  router.put('/:playerId/availability', async (req, res) => {
    try {
      const availability = await playersService.setPlayerAvailability(req.params.playerId, req.body);
      res.json(availability);
    } catch (error) {
      logger.error('API', 'Set availability failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createPlayersRouter };
