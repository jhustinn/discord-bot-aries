import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getTicketTranscript, TicketTranscriptResponse, DiscordMessage } from '../../lib/discord';
import PageMeta from '../../components/common/PageMeta';

export default function StandaloneTranscriptPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [data, setData] = useState<TicketTranscriptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    loadTranscript(ticketId);
  }, [ticketId]);

  async function loadTranscript(id: string) {
    setLoading(true);
    try {
      const res = await getTicketTranscript(id);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket transcript');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status?: string) {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
      APPROVED: 'bg-green-500/20 text-green-400 border border-green-500/40',
      REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/40',
      CLOSED: 'bg-gray-500/20 text-gray-400 border border-gray-500/40',
    };
    return styles[status || 'PENDING'] || styles.PENDING;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#313338] text-white flex items-center justify-center p-4">
        <div className="text-center animate-pulse">
          <span className="text-5xl block mb-4">📜</span>
          <h2 className="text-xl font-bold text-[#DBDEE1]">Loading Transcript...</h2>
          <p className="text-xs text-[#949BA4] mt-1">Ticket ID: {ticketId}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#313338] text-white flex items-center justify-center p-4">
        <div className="bg-[#2B2D31] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <span className="text-5xl block mb-3">⚠️</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">Transcript Not Found</h2>
          <p className="text-sm text-[#949BA4] mb-6">{error || 'Could not find any ticket with this ID.'}</p>
          <Link
            to="/tickets"
            className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold rounded-lg transition-colors inline-block"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const ticket = data.ticket || {};
  const statusColor = ticket.ticket_status === 'APPROVED' ? '#23A55A' : ticket.ticket_status === 'REJECTED' ? '#F23F43' : '#FEE75C';

  return (
    <>
      <PageMeta
        title={`Transcript - ${ticket.in_game_name || ticketId} | ARIES`}
        description="Discord Verification Ticket Transcript Log"
      />
      <div className="min-h-screen bg-[#313338] text-[#DBDEE1] py-8 px-4 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Nav Bar */}
          <div className="flex items-center justify-between">
            <Link
              to="/tickets"
              className="text-xs font-semibold text-[#949BA4] hover:text-white flex items-center gap-1 transition-colors"
            >
              ← Back to Admin Panel
            </Link>
            <div className="flex gap-2">
              <a
                href={`http://localhost:3000/api/transcript/${ticketId}?format=raw`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#2B2D31] hover:bg-[#383A40] text-xs font-medium rounded-lg text-white border border-[#383A40] transition-colors"
              >
                📥 Download .TXT
              </a>
              <a
                href={`http://localhost:3000/api/transcript/${ticketId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#2B2D31] hover:bg-[#383A40] text-xs font-medium rounded-lg text-white border border-[#383A40] transition-colors"
              >
                🔗 JSON API
              </a>
            </div>
          </div>

          {/* Ticket Header Banner */}
          <div
            className="bg-[#2B2D31] border border-[#383A40] rounded-2xl p-6 shadow-xl relative overflow-hidden"
            style={{ borderTop: `4px solid ${statusColor}` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#383A40]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1E1F22] flex items-center justify-center text-2xl shadow-inner">
                  🎫
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-white">
                      {ticket.in_game_name || 'Verification Ticket'}
                    </h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(ticket.ticket_status)}`}>
                      {ticket.ticket_status || 'CLOSED'}
                    </span>
                  </div>
                  <p className="text-xs text-[#949BA4] font-mono mt-0.5">
                    Ticket ID: {ticket.ticket_id || ticketId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#949BA4] uppercase font-semibold">Submitted Date</p>
                <p className="text-xs font-medium text-white mt-0.5">
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-[#1E1F22] p-3 rounded-xl border border-[#383A40]/50">
                <span className="text-[10px] uppercase font-bold text-[#949BA4] block">Discord User ID</span>
                <span className="text-xs font-mono font-semibold text-white mt-0.5 block truncate">
                  {ticket.user_id || 'N/A'}
                </span>
              </div>
              <div className="bg-[#1E1F22] p-3 rounded-xl border border-[#383A40]/50">
                <span className="text-[10px] uppercase font-bold text-[#949BA4] block">In-Game Player ID</span>
                <span className="text-xs font-mono font-semibold text-[#5865F2] mt-0.5 block truncate">
                  {ticket.player_id || 'Not Detected'}
                </span>
              </div>
              <div className="bg-[#1E1F22] p-3 rounded-xl border border-[#383A40]/50">
                <span className="text-[10px] uppercase font-bold text-[#949BA4] block">Player Level</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">
                  Level {ticket.player_level || '1'}
                </span>
              </div>
              <div className="bg-[#1E1F22] p-3 rounded-xl border border-[#383A40]/50">
                <span className="text-[10px] uppercase font-bold text-[#949BA4] block">Clan Tag</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">
                  [ARIES]
                </span>
              </div>
            </div>

            {/* Preserved Screenshot Section */}
            {(ticket.permanent_image_url || data.screenshotUrl) && (
              <div className="mt-4 pt-4 border-t border-[#383A40] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1E1F22]/40 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={ticket.permanent_image_url || data.screenshotUrl || ''}
                    alt="Proof"
                    className="w-16 h-12 object-cover rounded-lg border border-[#3F4147] cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPreviewImage(ticket.permanent_image_url || data.screenshotUrl || '')}
                  />
                  <div>
                    <h5 className="text-xs font-semibold text-white">
                      📷 Uploaded Verification Screenshot
                    </h5>
                    <p className="text-[11px] text-[#949BA4]">
                      Permanently archived on Supabase Storage
                    </p>
                  </div>
                </div>
                <a
                  href={ticket.permanent_image_url || data.screenshotUrl || ''}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 text-xs font-medium text-[#5865F2] bg-[#5865F2]/10 hover:bg-[#5865F2]/20 rounded-lg transition-colors"
                >
                  Open Full Image ↗
                </a>
              </div>
            )}

            {/* OCR Extracted Text Box */}
            {(ticket.extracted_text || data.ocrText) && (
              <div className="mt-3 p-3 bg-[#1E1F22] rounded-xl border border-[#383A40]">
                <p className="text-[11px] font-bold text-[#949BA4] uppercase mb-1">
                  🔍 Extracted OCR Text:
                </p>
                <pre className="text-xs font-mono text-[#DBDEE1] whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {ticket.extracted_text || data.ocrText}
                </pre>
              </div>
            )}
          </div>

          {/* Chat Messages Section */}
          <div className="bg-[#2B2D31] border border-[#383A40] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#383A40]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#949BA4] flex items-center gap-2">
                <span>💬</span> Chat History ({data.messages?.length || 0} messages)
              </h2>
              <span className="text-xs text-[#949BA4]">Archived on ARIES Platform</span>
            </div>

            {(!data.messages || data.messages.length === 0) ? (
              <div className="py-12 text-center text-[#949BA4] bg-[#1E1F22]/50 rounded-xl">
                <span className="text-3xl block mb-2">💬</span>
                <p className="text-sm">No live chat messages recorded in channel.</p>
                <p className="text-xs text-[#80848E] mt-1">Verification screenshot & OCR data are preserved above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.messages.map((msg: DiscordMessage) => (
                  <div key={msg.id} className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-[#2E3035] transition-colors">
                    <img
                      src={msg.author.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={msg.author.username}
                      className="w-10 h-10 rounded-full bg-[#1E1F22] mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-semibold ${msg.author.isBot ? 'text-[#5865F2]' : 'text-white'}`}>
                          {msg.author.displayName || msg.author.username}
                        </span>
                        {msg.author.isBot && (
                          <span className="px-1.5 py-0.2 bg-[#5865F2] text-white text-[9px] font-bold rounded">
                            BOT
                          </span>
                        )}
                        <span className="text-[11px] text-[#949BA4]">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {msg.content && (
                        <p className="text-sm text-[#DBDEE1] mt-1 whitespace-pre-wrap leading-relaxed">
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
                              className="max-h-72 rounded-lg border border-[#3F4147] cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <a href={att.url} target="_blank" rel="noreferrer" className="text-xs text-[#00A8FC] underline">
                              📎 {att.name}
                            </a>
                          )}
                        </div>
                      ))}

                      {/* Embeds */}
                      {msg.embeds?.map((emb, idx) => (
                        <div
                          key={idx}
                          className="mt-2.5 p-3.5 rounded-lg border-l-4 bg-[#1E1F22] max-w-xl text-xs space-y-1"
                          style={{ borderColor: emb.color || '#5865F2' }}
                        >
                          {emb.title && <h5 className="font-bold text-white text-sm mb-1">{emb.title}</h5>}
                          {emb.description && <p className="text-[#DBDEE1] whitespace-pre-wrap leading-relaxed">{emb.description}</p>}
                          {emb.image && <img src={emb.image} alt="embed" className="mt-2 rounded max-h-48" />}
                          {emb.footer && <p className="text-[10px] text-[#949BA4] mt-2">{emb.footer}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-xs text-[#80848E] pt-4">
            ARIES Verification & Clan Management Platform • {new Date().getFullYear()}
          </div>
        </div>

        {/* MODAL: IMAGE PREVIEW */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="Zoom Preview"
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border border-[#3F4147]"
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
      </div>
    </>
  );
}
