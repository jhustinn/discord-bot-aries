// ─── Audit Log Service ────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function log({ action, userId, username, targetId, targetType, details, status = 'success' }) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        user_id: userId || 'system',
        username: username || 'system',
        target_id: targetId || null,
        target_type: targetType || null,
        details: details || null,
        status,
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('AuditLog', 'Failed to write log', { error: error.message });
    } else {
      logger.info('AuditLog', `Logged: ${action}`, { userId, targetId, targetType });
    }
  } catch (err) {
    logger.error('AuditLog', 'Log error', { error: err.message });
  }
}

async function getLogs({ limit = 50, offset = 0, action, userId, targetType } = {}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);
    if (userId) query = query.eq('user_id', userId);
    if (targetType) query = query.eq('target_type', targetType);

    const { data, error } = await query;

    if (error) {
      logger.error('AuditLog', 'Failed to fetch logs', { error: error.message });
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('AuditLog', 'Fetch error', { error: err.message });
    return [];
  }
}

async function getLogStats() {
  try {
    const { count: total } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    const { count: today } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    return { total: total || 0, today: today || 0 };
  } catch (err) {
    logger.error('AuditLog', 'Stats error', { error: err.message });
    return { total: 0, today: 0 };
  }
}

module.exports = { log, getLogs, getLogStats };
