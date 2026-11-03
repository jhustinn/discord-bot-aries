// ─── Laravel REST API Client ──────────────────────────────────────────────────
const axios = require('axios');
const logger = require('../utils/logger');

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: LARAVEL_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Tickets
async function getTickets(params = {}) {
  const res = await apiClient.get('/tickets', { params });
  return res.data;
}

async function getTicket(ticketId) {
  const res = await apiClient.get(`/tickets/${ticketId}`);
  return res.data.data;
}

async function createTicket(ticketData) {
  const res = await apiClient.post('/tickets', ticketData);
  return res.data.data;
}

async function updateTicketStatus(ticketId, status) {
  const res = await apiClient.patch(`/tickets/${ticketId}/status`, { ticket_status: status });
  return res.data;
}

async function getTicketStats() {
  const res = await apiClient.get('/tickets/stats');
  return res.data;
}

// Battle Records
async function saveBattleRecord(recordData) {
  const res = await apiClient.post('/records', recordData);
  return res.data;
}

async function getBattleRecords(params = {}) {
  const res = await apiClient.get('/records', { params });
  return res.data;
}

async function getClassLeaderboard(shipClass) {
  const res = await apiClient.get(`/records/leaderboard/${shipClass}`);
  return res.data.data;
}

// Rank History
async function saveRankSubmission(rankData) {
  const res = await apiClient.post('/ranks', rankData);
  return res.data;
}

async function getUserRankHistory(userId) {
  const res = await apiClient.get(`/ranks/user/${userId}`);
  return res.data.data;
}

// Ships (Master Data)
async function getShips(params = {}) {
  const res = await apiClient.get('/ships', { params });
  return res.data.data;
}

async function createShip(shipData) {
  const res = await apiClient.post('/ships', shipData);
  return res.data.data;
}

async function updateShip(id, shipData) {
  const res = await apiClient.put(`/ships/${id}`, shipData);
  return res.data.data;
}

async function deleteShip(id) {
  const res = await apiClient.delete(`/ships/${id}`);
  return res.data;
}

// Realtime Notifications
async function sendNotification(notificationData) {
  try {
    const res = await apiClient.post('/notifications', notificationData);
    return res.data;
  } catch (err) {
    // Fail silently in background
    return null;
  }
}

async function getNotifications(params = {}) {
  const res = await apiClient.get('/notifications', { params });
  return res.data;
}

module.exports = {
  apiClient,
  getTickets,
  getTicket,
  createTicket,
  updateTicketStatus,
  getTicketStats,
  saveBattleRecord,
  getBattleRecords,
  getClassLeaderboard,
  saveRankSubmission,
  getUserRankHistory,
  getShips,
  createShip,
  updateShip,
  deleteShip,
  sendNotification,
  getNotifications
};
