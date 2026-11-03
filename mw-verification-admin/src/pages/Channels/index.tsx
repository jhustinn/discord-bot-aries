import { useEffect, useState, useRef, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getChannelMessages,
  sendChannelMessage,
  deleteChannelMessage,
  purgeChannelMessages,
  DiscordChannel,
  DiscordMessage,
  DiscordEmbed
} from '../../lib/discord';

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'channels' | 'purge'>('chat');
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Chat message state
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Rich Embed State
  const [showEmbedBuilder, setShowEmbedBuilder] = useState(false);
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDesc, setEmbedDesc] = useState('');
  const [embedColor, setEmbedColor] = useState('#5865F2');
  const [embedFooter, setEmbedFooter] = useState('');
  const [embedImage, setEmbedImage] = useState('');

  // Create/Edit Channel Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<number>(0);
  const [newChannelParentId, setNewChannelParentId] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');

  const [editingChannel, setEditingChannel] = useState<DiscordChannel | null>(null);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editSlowmode, setEditSlowmode] = useState(0);

  // Purge state
  const [purgeCount, setPurgeCount] = useState(10);
  const [purgeLoading, setPurgeLoading] = useState(false);

  // Notification / toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Full-screen Image Preview / Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resolveImageUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    if (url.includes('kqpipzaqpcktuwuxfgno.supabase.co/storage/v1/object/public/')) {
      const relativePath = url.split('kqpipzaqpcktuwuxfgno.supabase.co/storage/v1/object/public/')[1];
      return `/storage/v1/object/public/${relativePath}`;
    }
    if (url.includes('http://localhost:3000/uploads/')) {
      return url.replace('http://localhost:3000', '');
    }
    return url;
  };

  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const rawUrl = match[2];
      const resolved = resolveImageUrl(rawUrl);
      const isImg = /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(rawUrl) || rawUrl.includes('verification-attachments') || rawUrl.includes('uploads');

      parts.push(
        <span key={match.index} className="inline-flex items-center gap-1 my-0.5">
          <a
            href={resolved}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-600 underline font-medium"
          >
            {label} ↗
          </a>
          {isImg && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(resolved);
              }}
              className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded hover:bg-blue-200 transition-colors cursor-pointer"
            >
              🔍 View Image
            </button>
          )}
        </span>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getChannels();
      setChannels(res.channels);

      // Default select first text channel
      if (!selectedChannelId && res.channels.length > 0) {
        const firstText = res.channels.find(c => c.type === 0);
        if (firstText) {
          setSelectedChannelId(firstText.id);
        } else {
          setSelectedChannelId(res.channels[0].id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load channels', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedChannelId]);

  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;
    try {
      setChatLoading(true);
      const res = await getChannelMessages(channelId, 50);
      setMessages(res.messages);
    } catch (err: any) {
      // Quiet fail on auto-refresh, or show notice
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (selectedChannelId && activeTab === 'chat') {
      loadMessages(selectedChannelId);
    }
  }, [selectedChannelId, activeTab, loadMessages]);

  // Auto-refresh chat every 8 seconds if active
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'chat' || !selectedChannelId) return;
    const interval = setInterval(() => {
      loadMessages(selectedChannelId);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, selectedChannelId, loadMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && !embedTitle.trim() && !embedDesc.trim()) return;
    try {
      setIsSending(true);
      let embedPayload: DiscordEmbed | undefined = undefined;

      if (showEmbedBuilder && (embedTitle || embedDesc)) {
        embedPayload = {
          title: embedTitle || undefined,
          description: embedDesc || undefined,
          color: embedColor || undefined,
          footer: embedFooter || undefined,
          image: embedImage || undefined,
        };
      }

      await sendChannelMessage(selectedChannelId, {
        content: messageText.trim() || undefined,
        embed: embedPayload,
      });

      setMessageText('');
      if (showEmbedBuilder) {
        setEmbedTitle('');
        setEmbedDesc('');
        setEmbedFooter('');
        setEmbedImage('');
        setShowEmbedBuilder(false);
      }

      showToast('Message sent to Discord!');
      await loadMessages(selectedChannelId);
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteChannelMessage(selectedChannelId, msgId);
      showToast('Message deleted');
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete message', 'error');
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      await createChannel({
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        type: newChannelType,
        parentId: newChannelParentId || undefined,
        topic: newChannelTopic || undefined,
      });
      showToast(`Channel "${newChannelName}" created!`);
      setShowCreateModal(false);
      setNewChannelName('');
      setNewChannelTopic('');
      await loadChannels();
    } catch (err: any) {
      showToast(err.message || 'Failed to create channel', 'error');
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    try {
      await updateChannel(editingChannel.id, {
        name: editName,
        topic: editTopic,
        rateLimitPerUser: editSlowmode,
      });
      showToast(`Channel "${editName}" updated!`);
      setEditingChannel(null);
      await loadChannels();
    } catch (err: any) {
      showToast(err.message || 'Failed to update channel', 'error');
    }
  };

  const handleDeleteChannel = async (channel: DiscordChannel) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE #${channel.name}?`)) return;
    try {
      await deleteChannel(channel.id);
      showToast(`Channel #${channel.name} deleted`);
      if (selectedChannelId === channel.id) {
        setSelectedChannelId('');
      }
      await loadChannels();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete channel', 'error');
    }
  };

  const handlePurge = async () => {
    if (!selectedChannelId) return;
    if (!confirm(`Are you sure you want to purge ${purgeCount} messages from selected channel?`)) return;
    try {
      setPurgeLoading(true);
      const res = await purgeChannelMessages(selectedChannelId, purgeCount);
      showToast(`Successfully purged ${res.count} messages!`);
      await loadMessages(selectedChannelId);
    } catch (err: any) {
      showToast(err.message || 'Failed to purge messages', 'error');
    } finally {
      setPurgeLoading(false);
    }
  };

  const textChannels = channels.filter(c => c.type === 0 || c.type === 5);
  const categories = channels.filter(c => c.type === 4);
  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  return (
    <>
      <PageMeta title="Channels & Chat | ARIES Admin" description="Manage Discord channels, send messages, and announcements" />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Channels & Live Chat
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Manage Discord channels, broadcast announcements, and monitor chat
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <span>+</span> Create Channel
            </button>
            <button
              onClick={loadChannels}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-2">
          {[
            { id: 'chat', label: '💬 Live Chat & Sender', icon: '💬' },
            { id: 'channels', label: `📁 Channel List (${channels.length})`, icon: '📁' },
            { id: 'purge', label: '🧹 Message Purge', icon: '🧹' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: LIVE CHAT & SENDER */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Channel Selector */}
            <div className="col-span-12 lg:col-span-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Text Channels
                </h3>
                <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                  {loading && <p className="text-xs text-gray-400 py-2">Loading channels...</p>}
                  {textChannels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannelId(ch.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                        selectedChannelId === ch.id
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-gray-400">#</span>
                        <span className="truncate">{ch.name}</span>
                      </div>
                      {ch.parent && (
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                          {ch.parent}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Chat Box & Message Sender */}
            <div className="col-span-12 lg:col-span-9 flex flex-col">
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] flex flex-col h-[700px]">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-500">#</span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                        {selectedChannel?.name || 'Select Channel'}
                      </h3>
                      {selectedChannel?.topic && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                          {selectedChannel.topic}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={e => setAutoRefresh(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Auto-refresh (8s)
                    </label>
                    <button
                      onClick={() => loadMessages(selectedChannelId)}
                      disabled={chatLoading}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {chatLoading ? 'Loading...' : '↻'}
                    </button>
                  </div>
                </div>

                {/* Chat Message Stream */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <span className="text-4xl mb-2">💬</span>
                      <p className="text-sm">No messages yet or channel is empty</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="flex items-start gap-3 group">
                        <img
                          src={msg.author.avatar}
                          alt={msg.author.username}
                          className="w-10 h-10 rounded-full bg-gray-200 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-sm font-semibold ${msg.author.isBot ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}>
                              {msg.author.displayName}
                            </span>
                            {msg.author.isBot && (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold rounded">
                                BOT
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* Delete Action */}
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs ml-auto transition-opacity"
                              title="Delete message"
                            >
                              🗑️
                            </button>
                          </div>

                          {/* Message Content */}
                          {msg.content && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}

                          {/* Attachments (Images) */}
                          {msg.attachments.map(att => {
                            const resolvedUrl = resolveImageUrl(att.url);
                            const isImage = att.contentType?.startsWith('image/') || /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(att.name || '') || /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(att.url || '');
                            return (
                              <div key={att.id} className="mt-2">
                                {isImage ? (
                                  <div className="relative group/att inline-block">
                                    <img
                                      src={resolvedUrl}
                                      alt={att.name}
                                      onClick={() => setPreviewImage(resolvedUrl)}
                                      className="max-h-72 max-w-md rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:opacity-95 transition-opacity bg-black/5"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage(resolvedUrl)}
                                      className="absolute bottom-2 right-2 bg-black/75 hover:bg-black text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center gap-1 shadow cursor-pointer"
                                    >
                                      🔍 Zoom Image
                                    </button>
                                  </div>
                                ) : (
                                  <a
                                    href={resolvedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 underline flex items-center gap-1"
                                  >
                                    📎 {att.name}
                                  </a>
                                )}
                              </div>
                            );
                          })}

                          {/* Rich Embeds */}
                          {msg.embeds.map((emb, idx) => (
                            <div
                              key={idx}
                              className="mt-2.5 p-3.5 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800/60 max-w-xl text-sm space-y-1.5 shadow-sm"
                              style={{ borderColor: emb.color || '#5865F2' }}
                            >
                              {emb.title && <h5 className="font-bold text-gray-800 dark:text-white">{emb.title}</h5>}
                              {emb.description && (
                                <div className="text-gray-700 dark:text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                                  {renderFormattedContent(emb.description)}
                                </div>
                              )}

                              {/* Embed Fields */}
                              {emb.fields && emb.fields.length > 0 && (
                                <div className="space-y-1 pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                                  {emb.fields.map((field: any, fIdx: number) => (
                                    <div key={fIdx} className="text-xs">
                                      <span className="font-semibold text-gray-800 dark:text-gray-200">{field.name}: </span>
                                      <span className="text-gray-600 dark:text-gray-300">
                                        {renderFormattedContent(field.value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Embed Image */}
                              {emb.image && (
                                <div className="relative group/embImg pt-1 inline-block">
                                  <img
                                    src={resolveImageUrl(emb.image)}
                                    alt="embed"
                                    onClick={() => setPreviewImage(resolveImageUrl(emb.image))}
                                    className="mt-1 rounded-lg max-h-60 border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-95 shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage(resolveImageUrl(emb.image))}
                                    className="absolute bottom-2 right-2 bg-black/75 hover:bg-black text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover/embImg:opacity-100 transition-opacity flex items-center gap-1 shadow cursor-pointer"
                                  >
                                    🔍 Zoom
                                  </button>
                                </div>
                              )}

                              {emb.footer && <p className="text-[10px] text-gray-400 pt-1">{emb.footer}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Rich Embed Form (Collapsible) */}
                {showEmbedBuilder && (
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        🎨 Rich Announcement Embed Builder
                      </span>
                      <button
                        onClick={() => setShowEmbedBuilder(false)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Embed Title..."
                        value={embedTitle}
                        onChange={e => setEmbedTitle(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <input
                        type="color"
                        value={embedColor}
                        onChange={e => setEmbedColor(e.target.value)}
                        className="h-8 w-full rounded cursor-pointer"
                        title="Embed Theme Color"
                      />
                      <input
                        type="text"
                        placeholder="Footer text..."
                        value={embedFooter}
                        onChange={e => setEmbedFooter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Embed Description / Announcement details..."
                      value={embedDesc}
                      onChange={e => setEmbedDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEmbedBuilder(!showEmbedBuilder)}
                      className={`p-2.5 rounded-lg border text-sm transition-colors ${
                        showEmbedBuilder
                          ? 'bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-900/30'
                          : 'border-gray-300 hover:bg-gray-100 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                      }`}
                      title="Toggle Rich Embed Announcement"
                    >
                      📢
                    </button>
                    <input
                      type="text"
                      placeholder={`Send a message as bot to #${selectedChannel?.name || 'channel'}...`}
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending || (!messageText.trim() && !embedTitle && !embedDesc)}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHANNELS LIST & CRUD */}
        {activeTab === 'channels' && (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Topic</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Slowmode</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map(channel => (
                    <tr key={channel.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white flex items-center gap-2">
                        <span>{channel.type === 4 ? '📁' : channel.type === 2 ? '🔊' : '#'}</span>
                        <span>{channel.name}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {channel.type === 0 ? 'Text' : channel.type === 2 ? 'Voice' : channel.type === 4 ? 'Category' : channel.type === 5 ? 'Announcement' : 'Other'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {channel.parent || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                        {channel.topic || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {channel.rateLimitPerUser ? `${channel.rateLimitPerUser}s` : 'Off'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingChannel(channel);
                              setEditName(channel.name);
                              setEditTopic(channel.topic || '');
                              setEditSlowmode(channel.rateLimitPerUser || 0);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(channel)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGE PURGE */}
        {activeTab === 'purge' && (
          <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              🧹 Bulk Message Purge
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Quickly delete recent spam or cleanup messages from a specific channel.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Channel
                </label>
                <select
                  value={selectedChannelId}
                  onChange={e => setSelectedChannelId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {textChannels.map(ch => (
                    <option key={ch.id} value={ch.id}>
                      #{ch.name} {ch.parent ? `(${ch.parent})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Messages to Purge (1 - 100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={purgeCount}
                  onChange={e => setPurgeCount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handlePurge}
                  disabled={purgeLoading || !selectedChannelId}
                  className="w-full py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {purgeLoading ? 'Purging Messages...' : `Purge ${purgeCount} Messages`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE CHANNEL */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Create Discord Channel
              </h3>
              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Channel Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. announcements"
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Channel Type</label>
                  <select
                    value={newChannelType}
                    onChange={e => setNewChannelType(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value={0}>💬 Text Channel</option>
                    <option value={2}>🔊 Voice Channel</option>
                    <option value={4}>📁 Category</option>
                  </select>
                </div>

                {newChannelType !== 4 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Parent Category</label>
                    <select
                      value={newChannelParentId}
                      onChange={e => setNewChannelParentId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">(None / Root)</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          📁 {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Channel Topic (Optional)</label>
                  <input
                    type="text"
                    placeholder="Topic description..."
                    value={newChannelTopic}
                    onChange={e => setNewChannelTopic(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Create Channel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT CHANNEL */}
        {editingChannel && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Edit Channel #{editingChannel.name}
              </h3>
              <form onSubmit={handleUpdateChannel} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Channel Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Topic</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={e => setEditTopic(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Slowmode (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    max={21600}
                    value={editSlowmode}
                    onChange={e => setEditSlowmode(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingChannel(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: IMAGE ZOOM PREVIEW LIGHTBOX */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 cursor-pointer backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="Screenshot Zoom Preview"
                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain border border-gray-700 bg-gray-950"
              />
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow flex items-center gap-1.5"
                >
                  <span>↗</span> Open Full Resolution
                </a>
                <a
                  href={previewImage}
                  download="screenshot.png"
                  className="px-4 py-2 text-xs font-semibold text-gray-800 bg-white rounded-lg hover:bg-gray-100 shadow flex items-center gap-1.5"
                >
                  <span>💾</span> Download
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 shadow cursor-pointer"
                >
                  Close (Esc)
                </button>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
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
