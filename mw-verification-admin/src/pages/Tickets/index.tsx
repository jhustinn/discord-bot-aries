import { useEffect, useState } from 'react';
import { getTickets, updateTicketStatus, deleteTicket, VerificationTicket } from '../../lib/supabase';
import { getTicketTranscript, archiveTicket, TicketTranscriptResponse, DiscordMessage } from '../../lib/discord';
import PageMeta from '../../components/common/PageMeta';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<VerificationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<VerificationTicket | null>(null);

  // Transcript state
  const [transcriptTicket, setTranscriptTicket] = useState<VerificationTicket | null>(null);
  const [transcriptData, setTranscriptData] = useState<TicketTranscriptResponse | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    const data = await getTickets();
    setTickets(data);
    setLoading(false);
  }

  async function openTranscript(ticket: VerificationTicket) {
    setTranscriptTicket(ticket);
    setTranscriptLoading(true);
    try {
      const res = await getTicketTranscript(ticket.ticket_id);
      setTranscriptData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load transcript', 'error');
    } finally {
      setTranscriptLoading(false);
    }
  }

  async function handleArchiveAndDelete(ticketId: string, deleteChannel: boolean) {
    const confirmMsg = deleteChannel
      ? 'Archive all chat messages & permanently DELETE the Discord ticket channel?'
      : 'Archive all chat messages & LOCK the ticket channel?';
    if (!confirm(confirmMsg)) return;

    setArchiveLoading(true);
    try {
      const res = await archiveTicket(ticketId, deleteChannel);
      showToast(res.message || 'Ticket archived successfully!');
      await loadTickets();
      if (transcriptTicket) {
        await openTranscript(transcriptTicket);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to archive ticket', 'error');
    } finally {
      setArchiveLoading(false);
    }
  }

  function downloadTranscriptTxt() {
    if (!transcriptData || !transcriptTicket) return;
    let content = `====================================================\n`;
    content += `ARIES CLAN VERIFICATION TICKET TRANSCRIPT\n`;
    content += `Ticket ID: ${transcriptTicket.ticket_id}\n`;
    content += `In-Game Name: ${transcriptTicket.in_game_name}\n`;
    content += `Discord User ID: ${transcriptTicket.user_id}\n`;
    content += `Player ID: ${transcriptTicket.player_id || 'N/A'}\n`;
    content += `Player Level: ${transcriptTicket.player_level || 'N/A'}\n`;
    content += `Screenshot URL: ${transcriptTicket.permanent_image_url}\n`;
    content += `Created At: ${transcriptTicket.created_at}\n`;
    content += `Export Date: ${new Date().toISOString()}\n`;
    content += `====================================================\n\n`;

    if (transcriptData.ocrText) {
      content += `[OCR EXTRACTED TEXT]:\n${transcriptData.ocrText}\n\n`;
    }

    content += `[CHAT MESSAGES (${transcriptData.messages.length})]:\n`;
    for (const msg of transcriptData.messages) {
      const time = new Date(msg.timestamp).toLocaleString();
      content += `[${time}] ${msg.author.displayName} (@${msg.author.username}):\n`;
      if (msg.content) content += `  ${msg.content}\n`;
      for (const att of msg.attachments) {
        content += `  [Attachment: ${att.name} -> ${att.url}]\n`;
      }
      content += `\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket_${transcriptTicket.in_game_name}_${transcriptTicket.ticket_id.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportToCSV() {
    const filteredTickets = filter === 'ALL' ? tickets : tickets.filter(t => t.ticket_status === filter);
    
    const headers = ['Ticket ID', 'User ID', 'In-Game Name', 'Player ID', 'Player Name', 'Level', 'Status', 'Created At', 'Screenshot URL'];
    const rows = filteredTickets.map(t => [
      t.ticket_id,
      t.user_id,
      t.in_game_name,
      t.player_id || '-',
      t.player_name || '-',
      t.player_level || '-',
      t.ticket_status,
      new Date(t.created_at).toLocaleString(),
      t.permanent_image_url
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verifications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleStatusChange(
    ticketId: string,
    status: 'APPROVED' | 'REJECTED'
  ) {
    try {
      await updateTicketStatus(ticketId, status);
      showToast(`Ticket status updated to ${status}`);
      await loadTickets();
      setSelectedTicket(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to update ticket status', 'error');
    }
  }

  async function handleDelete(ticketId: string) {
    if (confirm('Are you sure you want to delete this ticket record? (Permanent attachments & logs will remain archived)')) {
      try {
        await deleteTicket(ticketId);
        showToast('Ticket deleted');
        await loadTickets();
        setSelectedTicket(null);
      } catch (error: any) {
        showToast(error.message || 'Failed to delete ticket', 'error');
      }
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return styles[status] || styles.PENDING;
  }

  const filteredTickets = filter === 'ALL'
    ? tickets
    : tickets.filter((t) => t.ticket_status === filter);

  return (
    <>
      <PageMeta
        title="Verification Tickets | ARIES Admin"
        description="Manage verification tickets and chat transcripts"
      />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Verification Tickets & Transcripts
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Review player verification requests, view chat logs & preserved screenshot attachments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
            <button
              onClick={loadTickets}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            >
              ↻ Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="animate-pulse space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Player Info</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Extracted OCR</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Screenshot</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Submitted</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Transcript</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.ticket_id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {ticket.in_game_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            ID: {ticket.user_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs space-y-0.5">
                        <p className="text-gray-700 dark:text-gray-300 font-mono">
                          ID: <span className="font-semibold">{ticket.player_id || '-'}</span>
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          Lv. {ticket.player_level || '-'} • {ticket.player_name || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.permanent_image_url ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(ticket.permanent_image_url);
                            }}
                            className="group relative block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={ticket.permanent_image_url}
                              alt="proof"
                              className="w-14 h-10 object-cover"
                            />
                            <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              🔍 Zoom
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            ticket.ticket_status
                          )}`}
                        >
                          {ticket.ticket_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString()} {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTranscript(ticket);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1"
                        >
                          <span>📜</span> Transcript
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {ticket.ticket_status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(ticket.ticket_id, 'APPROVED')}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(ticket.ticket_id, 'REJECTED')}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(ticket.ticket_id)}
                            className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete record"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTickets.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl mb-2 block">🎫</span>
                <p>No verification tickets found in this filter.</p>
              </div>
            )}
          </div>
        )}

        {/* MODAL: CHAT TRANSCRIPT VIEWER */}
        {transcriptTicket && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Transcript Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📜</span>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Chat Transcript — {transcriptTicket.in_game_name}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(transcriptTicket.ticket_status)}`}>
                      {transcriptTicket.ticket_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                    Ticket: {transcriptTicket.ticket_id} • User ID: {transcriptTicket.user_id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTranscriptTicket(null);
                    setTranscriptData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Transcript Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {transcriptLoading ? (
                  <div className="py-16 text-center text-gray-400 animate-pulse">
                    <span className="text-3xl block mb-2">⏳</span>
                    <p className="text-sm">Fetching chat history from Discord & Storage...</p>
                  </div>
                ) : (
                  <>
                    {/* Verification Screenshot Card */}
                    {transcriptTicket.permanent_image_url && (
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={transcriptTicket.permanent_image_url}
                            alt="Verification Proof"
                            className="w-16 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80"
                            onClick={() => setPreviewImage(transcriptTicket.permanent_image_url)}
                          />
                          <div>
                            <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              📷 Uploaded Verification Screenshot
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Permanently archived on Supabase Storage
                            </p>
                          </div>
                        </div>
                        <a
                          href={transcriptTicket.permanent_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          Open Full Image ↗
                        </a>
                      </div>
                    )}

                    {/* Extracted OCR Raw Text */}
                    {transcriptTicket.extracted_text && (
                      <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                          🔍 Extracted OCR Text:
                        </p>
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {transcriptTicket.extracted_text}
                        </p>
                      </div>
                    )}

                    {/* Chat Messages Stream */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Chat History ({transcriptData?.messages?.length || 0} messages)
                      </h4>

                      {(!transcriptData?.messages || transcriptData.messages.length === 0) ? (
                        <div className="p-8 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                          <p className="text-sm">No live chat messages recorded in channel.</p>
                          <p className="text-xs text-gray-500 mt-1">
                            (Channel may have already been closed/purged prior to archiving)
                          </p>
                        </div>
                      ) : (
                        transcriptData.messages.map((msg: DiscordMessage) => (
                          <div key={msg.id} className="flex items-start gap-3">
                            <img
                              src={msg.author.avatar}
                              alt={msg.author.username}
                              className="w-9 h-9 rounded-full bg-gray-200 mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className={`text-sm font-semibold ${msg.author.isBot ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}>
                                  {msg.author.displayName}
                                </span>
                                {msg.author.isBot && (
                                  <span className="px-1 py-0.2 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-[9px] font-bold rounded">
                                    BOT
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">
                                  {new Date(msg.timestamp).toLocaleString()}
                                </span>
                              </div>

                              {msg.content && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                              )}

                              {/* Attachments */}
                              {msg.attachments?.map(att => (
                                <div key={att.id} className="mt-2">
                                  {att.contentType?.startsWith('image/') ? (
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      onClick={() => setPreviewImage(att.url)}
                                      className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                                    />
                                  ) : (
                                    <a href={att.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                                      📎 {att.name}
                                    </a>
                                  )}
                                </div>
                              ))}

                              {/* Embeds */}
                              {msg.embeds?.map((emb, idx) => (
                                <div
                                  key={idx}
                                  className="mt-2 p-3 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800/60 max-w-lg text-xs"
                                  style={{ borderColor: emb.color || '#5865F2' }}
                                >
                                  {emb.title && <h5 className="font-bold text-gray-800 dark:text-white mb-0.5">{emb.title}</h5>}
                                  {emb.description && <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{emb.description}</p>}
                                  {emb.image && <img src={emb.image} alt="embed" className="mt-2 rounded max-h-40" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Transcript Footer Actions */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex flex-wrap gap-2 justify-between items-center">
                <button
                  onClick={downloadTranscriptTxt}
                  disabled={!transcriptData}
                  className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 flex items-center gap-1.5"
                >
                  <span>💾</span> Download .TXT Log
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleArchiveAndDelete(transcriptTicket.ticket_id, false)}
                    disabled={archiveLoading}
                    className="px-3 py-2 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 disabled:opacity-50"
                  >
                    🔒 Archive & Lock Channel
                  </button>

                  <button
                    onClick={() => handleArchiveAndDelete(transcriptTicket.ticket_id, true)}
                    disabled={archiveLoading}
                    className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 disabled:opacity-50"
                  >
                    🗑️ Archive & Delete Channel
                  </button>

                  <button
                    onClick={() => {
                      setTranscriptTicket(null);
                      setTranscriptData(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TICKET DETAILS */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Ticket #{selectedTicket.ticket_id} Details
                </h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400">Player Name</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedTicket.in_game_name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Player ID</span>
                  <p className="font-mono text-gray-700 dark:text-gray-300">{selectedTicket.player_id || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Discord User ID</span>
                  <p className="font-mono text-gray-700 dark:text-gray-300">{selectedTicket.user_id}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Status</span>
                  <div>{getStatusBadge(selectedTicket.ticket_status)}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Level</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    Lvl {selectedTicket.player_level || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Created At</span>
                  <p className="text-xs text-gray-500">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedTicket.permanent_image_url && (
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Attached Verification Screenshot</span>
                  <img
                    src={selectedTicket.permanent_image_url}
                    alt="Ticket Attachment"
                    onClick={() => setPreviewImage(selectedTicket.permanent_image_url)}
                    className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3 justify-end border-t border-gray-100 dark:border-gray-700">
                {selectedTicket.ticket_status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.ticket_id, 'APPROVED')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedTicket.ticket_id, 'REJECTED')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: IMAGE ZOOM PREVIEW */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 cursor-pointer backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="Zoom Preview"
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border border-gray-700"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
