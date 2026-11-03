import { useEffect, useState } from 'react';
import { getTickets, updateTicketStatus, deleteTicket, VerificationTicket } from '../../lib/supabase';

export default function RecentTickets() {
  const [tickets, setTickets] = useState<VerificationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<VerificationTicket | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    const data = await getTickets();
    setTickets(data.slice(0, 10));
    setLoading(false);
  }

  async function handleStatusChange(
    ticketId: string,
    status: 'APPROVED' | 'REJECTED'
  ) {
    try {
      await updateTicketStatus(ticketId, status);
      await loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  }

  async function handleDelete(ticketId: string) {
    if (confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteTicket(ticketId);
        await loadTickets();
        setSelectedTicket(null);
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status] || styles.PENDING;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Recent Tickets
        </h3>
        <button
          onClick={loadTickets}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">User ID</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">In-Game Name</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Player ID</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Level</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.ticket_id}
                className="border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setSelectedTicket(ticket)}
              >
                <td className="py-3 text-gray-800 dark:text-gray-200 font-mono text-xs">
                  {ticket.user_id.slice(0, 10)}...
                </td>
                <td className="py-3 text-gray-800 dark:text-gray-200">
                  {ticket.in_game_name}
                </td>
                <td className="py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                  {ticket.player_id || '-'}
                </td>
                <td className="py-3 text-gray-500 dark:text-gray-400">
                  {ticket.player_level || '-'}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                      ticket.ticket_status
                    )}`}
                  >
                    {ticket.ticket_status}
                  </span>
                </td>
                <td className="py-3 text-gray-500 dark:text-gray-400">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {ticket.ticket_status === 'PENDING' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(ticket.ticket_id, 'APPROVED');
                          }}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(ticket.ticket_id, 'REJECTED');
                          }}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <a
                      href={ticket.permanent_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      View
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tickets.length === 0 && (
        <p className="text-center py-4 text-gray-500 dark:text-gray-400">
          No tickets found
        </p>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Ticket Details
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Ticket ID</label>
                <p className="font-mono text-sm">{selectedTicket.ticket_id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">User ID</label>
                <p className="font-mono text-sm">{selectedTicket.user_id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">In-Game Name</label>
                <p>{selectedTicket.in_game_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedTicket.ticket_status)}`}>
                  {selectedTicket.ticket_status}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Player ID</label>
                <p className="font-mono text-sm">{selectedTicket.player_id || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Player Name</label>
                <p>{selectedTicket.player_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Player Level</label>
                <p>{selectedTicket.player_level || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Created At</label>
                <p>{new Date(selectedTicket.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Screenshot</label>
              <a
                href={selectedTicket.permanent_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-blue-600 hover:underline dark:text-blue-400"
              >
                View Image
              </a>
            </div>

            {selectedTicket.extracted_text && (
              <div className="mb-4">
                <label className="text-sm text-gray-500 dark:text-gray-400">Extracted Text (OCR)</label>
                <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                  {selectedTicket.extracted_text}
                </pre>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {selectedTicket.ticket_status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedTicket.ticket_id, 'APPROVED')}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedTicket.ticket_id, 'REJECTED')}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => handleDelete(selectedTicket.ticket_id)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
