// ─── Seasons API Routes ───────────────────────────────────────────────────────
const express = require('express');
const seasonsService = require('../services/seasons');
const logger = require('../utils/logger');

function createSeasonsRouter() {
  const router = express.Router();

  // GET /api/seasons - List all seasons
  router.get('/', async (req, res) => {
    try {
      const { limit, offset, status } = req.query;
      const result = await seasonsService.getSeasons({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        status
      });
      res.json(result);
    } catch (error) {
      logger.error('API', 'Get seasons failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/seasons/active - Get active season
  router.get('/active', async (req, res) => {
    try {
      const season = await seasonsService.getActiveSeason();
      if (!season) return res.status(404).json({ error: 'No active season' });
      res.json(season);
    } catch (error) {
      logger.error('API', 'Get active season failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/seasons/:seasonId - Get season detail
  router.get('/:seasonId', async (req, res) => {
    try {
      const season = await seasonsService.getSeason(req.params.seasonId);
      if (!season) return res.status(404).json({ error: 'Season not found' });
      res.json(season);
    } catch (error) {
      logger.error('API', 'Get season failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/seasons - Create season
  router.post('/', async (req, res) => {
    try {
      const season = await seasonsService.createSeason(req.body);
      res.status(201).json(season);
    } catch (error) {
      logger.error('API', 'Create season failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/seasons/:seasonId - Update season
  router.put('/:seasonId', async (req, res) => {
    try {
      const season = await seasonsService.updateSeason(req.params.seasonId, req.body);
      res.json(season);
    } catch (error) {
      logger.error('API', 'Update season failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/seasons/:seasonId/end - End season
  router.post('/:seasonId/end', async (req, res) => {
    try {
      const season = await seasonsService.endSeason(req.params.seasonId);
      res.json(season);
    } catch (error) {
      logger.error('API', 'End season failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/seasons/:seasonId/leaderboard - Get season leaderboard
  router.get('/:seasonId/leaderboard', async (req, res) => {
    try {
      const { limit } = req.query;
      const leaderboard = await seasonsService.getSeasonLeaderboard(req.params.seasonId, parseInt(limit) || 10);
      res.json(leaderboard);
    } catch (error) {
      logger.error('API', 'Get leaderboard failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/seasons/:seasonId/ranks - Get season ranks
  router.get('/:seasonId/ranks', async (req, res) => {
    try {
      const { limit } = req.query;
      const ranks = await seasonsService.getSeasonRanks(req.params.seasonId, parseInt(limit) || 50);
      res.json(ranks);
    } catch (error) {
      logger.error('API', 'Get ranks failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createSeasonsRouter };
