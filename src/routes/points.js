// ─── Points API Routes ────────────────────────────────────────────────────────
const express = require('express');
const pointsService = require('../services/points');
const logger = require('../utils/logger');

function createPointsRouter() {
  const router = express.Router();

  // GET /api/points - List all player points
  router.get('/', async (req, res) => {
    try {
      const { limit, offset, season_id } = req.query;
      const result = await pointsService.getPoints({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        season_id
      });
      res.json(result);
    } catch (error) {
      logger.error('API', 'Get points failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/points/leaderboard - Get leaderboard
  router.get('/leaderboard', async (req, res) => {
    try {
      const { season_id, limit } = req.query;
      const leaderboard = await pointsService.getLeaderboard(season_id, parseInt(limit) || 10);
      res.json(leaderboard);
    } catch (error) {
      logger.error('API', 'Get leaderboard failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/points/history - Get points history
  router.get('/history', async (req, res) => {
    try {
      const { limit, offset, player_id, category, season_id } = req.query;
      const result = await pointsService.getPointsHistory({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        player_id,
        category,
        season_id
      });
      res.json(result);
    } catch (error) {
      logger.error('API', 'Get history failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/points/:playerId - Get player points
  router.get('/:playerId', async (req, res) => {
    try {
      const { season_id } = req.query;
      const points = await pointsService.getPlayerPoints(req.params.playerId, season_id);
      res.json(points);
    } catch (error) {
      logger.error('API', 'Get player points failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/points/:playerId/award - Award points
  router.post('/:playerId/award', async (req, res) => {
    try {
      const { points, reason, category, admin_id, admin_username, season_id, reference_id, reference_type } = req.body;
      const result = await pointsService.awardPoints(
        req.params.playerId, points, reason, category,
        admin_id, admin_username, season_id, reference_id, reference_type
      );
      res.json(result);
    } catch (error) {
      logger.error('API', 'Award points failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/points/:playerId/deduct - Deduct points
  router.post('/:playerId/deduct', async (req, res) => {
    try {
      const { points, reason, category, admin_id, admin_username, season_id } = req.body;
      const result = await pointsService.deductPoints(
        req.params.playerId, points, reason, category,
        admin_id, admin_username, season_id
      );
      res.json(result);
    } catch (error) {
      logger.error('API', 'Deduct points failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createPointsRouter };
