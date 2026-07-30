// ─── Teams API Routes ─────────────────────────────────────────────────────────
const express = require('express');
const teamsService = require('../services/teams');
const logger = require('../utils/logger');

function createTeamsRouter() {
  const router = express.Router();

  // GET /api/teams - List all teams
  router.get('/', async (req, res) => {
    try {
      const { limit, offset, tier, is_active } = req.query;
      const result = await teamsService.getTeams({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        tier,
        is_active: is_active !== undefined ? is_active === 'true' : undefined
      });
      res.json(result);
    } catch (error) {
      logger.error('API', 'Get teams failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/teams/:teamId - Get team detail
  router.get('/:teamId', async (req, res) => {
    try {
      const team = await teamsService.getTeam(req.params.teamId);
      if (!team) return res.status(404).json({ error: 'Team not found' });
      res.json(team);
    } catch (error) {
      logger.error('API', 'Get team failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/teams - Create team
  router.post('/', async (req, res) => {
    try {
      const team = await teamsService.createTeam(req.body);
      res.status(201).json(team);
    } catch (error) {
      logger.error('API', 'Create team failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/teams/:teamId - Update team
  router.put('/:teamId', async (req, res) => {
    try {
      const team = await teamsService.updateTeam(req.params.teamId, req.body);
      res.json(team);
    } catch (error) {
      logger.error('API', 'Update team failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/teams/:teamId - Delete team
  router.delete('/:teamId', async (req, res) => {
    try {
      await teamsService.deleteTeam(req.params.teamId);
      res.json({ success: true });
    } catch (error) {
      logger.error('API', 'Delete team failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/teams/:teamId/members - Add player to team
  router.post('/:teamId/members', async (req, res) => {
    try {
      const { player_id, role } = req.body;
      const member = await teamsService.addTeamMember(req.params.teamId, player_id, role);
      res.status(201).json(member);
    } catch (error) {
      logger.error('API', 'Add team member failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/teams/:teamId/members/:playerId - Remove player from team
  router.delete('/:teamId/members/:playerId', async (req, res) => {
    try {
      await teamsService.removeTeamMember(req.params.teamId, req.params.playerId);
      res.json({ success: true });
    } catch (error) {
      logger.error('API', 'Remove team member failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createTeamsRouter };
