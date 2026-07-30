// ─── Database Service ─────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function upsertUser(userId, username) {
  const { error } = await supabase
    .from('discord_users')
    .upsert({
      user_id: userId,
      username: username
    }, { onConflict: 'user_id' });

  if (error) {
    logger.error('Database', 'Failed to upsert user', { userId, error: error.message });
    throw new Error(`User record failed: ${error.message}`);
  }

  logger.info('Database', 'User upserted successfully', { userId });
}

async function insertTicket(ticketData) {
  const { error } = await supabase
    .from('verification_tickets')
    .insert(ticketData);

  if (error) {
    logger.error('Database', 'Failed to insert ticket', { error: error.message });
    throw new Error(`Ticket insert failed: ${error.message}`);
  }

  logger.info('Database', 'Ticket inserted successfully', { userId: ticketData.user_id });
}

async function getPendingTicket(userId) {
  const { data, error } = await supabase
    .from('verification_tickets')
    .select('ticket_id')
    .eq('user_id', userId)
    .eq('ticket_status', 'PENDING')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    logger.error('Database', 'Failed to check pending ticket', { userId, error: error.message });
  }

  return data;
}

async function updateTicketStatus(ticketId, status) {
  // First get the ticket details
  const { data: ticket, error: fetchError } = await supabase
    .from('verification_tickets')
    .select('*')
    .eq('ticket_id', ticketId)
    .single();

  if (fetchError) {
    logger.error('Database', 'Failed to fetch ticket', { ticketId, error: fetchError.message });
    throw new Error(`Ticket fetch failed: ${fetchError.message}`);
  }

  // Update ticket status
  const { error: updateError } = await supabase
    .from('verification_tickets')
    .update({ ticket_status: status })
    .eq('ticket_id', ticketId);

  if (updateError) {
    logger.error('Database', 'Failed to update ticket status', { ticketId, error: updateError.message });
    throw new Error(`Status update failed: ${updateError.message}`);
  }

  logger.info('Database', 'Ticket status updated', { ticketId, status });

  // If approved, create/update player record
  if (status === 'APPROVED' && ticket) {
    await createPlayerFromTicket(ticket);
  }

  return ticket;
}

async function createPlayerFromTicket(ticket) {
  try {
    // Check if player already exists
    const { data: existingPlayer } = await supabase
      .from('verified_players')
      .select('player_id')
      .eq('discord_user_id', ticket.user_id)
      .single();

    const playerData = {
      player_id: ticket.player_id || `discord_${ticket.user_id}`,
      discord_user_id: ticket.user_id,
      player_name: ticket.player_name || ticket.in_game_name,
      player_level: ticket.player_level || 1,
      clan_tag: 'ARIES',
      timezone: 'UTC',
      timezone_offset: 'UTC+0',
      region: 'UNKNOWN',
      status: 'ACTIVE',
      verified_at: new Date().toISOString(),
      ticket_id: ticket.ticket_id
    };

    if (existingPlayer) {
      // Update existing player
      const { error } = await supabase
        .from('verified_players')
        .update({
          player_name: playerData.player_name,
          player_level: playerData.player_level,
          ticket_id: ticket.ticket_id,
          updated_at: new Date().toISOString()
        })
        .eq('player_id', existingPlayer.player_id);

      if (error) {
        logger.error('Database', 'Failed to update player', { error: error.message });
      } else {
        logger.info('Database', 'Player updated from ticket', { playerId: existingPlayer.player_id });
      }
    } else {
      // Create new player
      const { error } = await supabase
        .from('verified_players')
        .insert(playerData);

      if (error) {
        logger.error('Database', 'Failed to create player', { error: error.message });
      } else {
        logger.info('Database', 'Player created from ticket', { playerId: playerData.player_id });
      }
    }
  } catch (err) {
    logger.error('Database', 'Error creating player from ticket', { error: err.message });
  }
}

async function getTicketById(ticketId) {
  const { data, error } = await supabase
    .from('verification_tickets')
    .select('*')
    .eq('ticket_id', ticketId)
    .single();

  if (error) {
    logger.error('Database', 'Failed to get ticket', { ticketId, error: error.message });
    throw error;
  }

  return data;
}

async function getStats() {
  const [usersResult, ticketsResult, pendingResult] = await Promise.all([
    supabase.from('discord_users').select('*', { count: 'exact', head: true }),
    supabase.from('verification_tickets').select('*', { count: 'exact', head: true }),
    supabase.from('verification_tickets').select('*', { count: 'exact', head: true }).eq('ticket_status', 'PENDING')
  ]);

  return {
    totalUsers: usersResult.count ||0,
    totalTickets: ticketsResult.count ||0,
    pending: pendingResult.count ||0
  };
}

module.exports = {
  upsertUser,
  insertTicket,
  getPendingTicket,
  updateTicketStatus,
  getTicketById,
  createPlayerFromTicket,
  getStats
};
