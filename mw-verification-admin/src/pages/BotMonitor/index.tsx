import { useEffect, useState, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { getBotStatus, BotStatus } from '../../lib/discord';

export default function BotMonitorPage() {
  const [botData, setBotData] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);

  const fetchBotStatus = useCallback(async () => {
    try {
      const data = await getBotStatus();
      setBotData(data);
      setError(null);
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to bot');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchBotStatus]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefresh]);

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  if (loading) {
    return (
      <>
        <PageMeta title="Bot Monitor | ARIES Admin" description="Monitor Discord bot status" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bot Monitor</h2>
            <p className="text-gray-500 dark:text-gray-400">Loading bot status...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded dark:bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error && !botData) {
    return (
      <>
        <PageMeta title="Bot Monitor | ARIES Admin" description="Monitor Discord bot status" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bot Monitor</h2>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Bot Offline</h3>
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchBotStatus}
              className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </>
    );
  }

  const isOnline = botData?.status === 'online';
  const heapPercent = botData ? Math.round((botData.system.memory.heapUsedMB / botData.system.memory.heapTotalMB) * 100) : 0;

  return (
    <>
      <PageMeta title="Bot Monitor | ARIES Admin" description="Monitor Discord bot status and health" />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bot Monitor</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Real-time bot status and system health
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Auto-refresh in {countdown}s
            </span>
            <button
              onClick={fetchBotStatus}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-2xl p-4 mb-6 flex items-center gap-4 ${
          isOnline
            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }`}>
          <div className="relative">
            {botData?.bot?.avatar ? (
              <img src={botData.bot.avatar} alt="Bot" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            )}
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {botData?.bot?.tag || 'Unknown Bot'}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isOnline
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {isOnline ? '● Online' : '● Offline'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {botData?.bot?.id || 'N/A'} • v{botData?.system.botVersion}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">Last updated</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* Uptime */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {botData?.uptime.formatted || '0s'}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl">⏱</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Since {botData ? new Date(botData.uptime.startedAt).toLocaleString() : 'N/A'}
            </p>
          </div>

          {/* Latency */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">WS Latency</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {botData?.latency.ws || 0}ms
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                (botData?.latency.ws || 0) < 100
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : (botData?.latency.ws || 0) < 200
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <span className={`text-xl ${
                  (botData?.latency.ws || 0) < 100
                    ? 'text-green-600 dark:text-green-400'
                    : (botData?.latency.ws || 0) < 200
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>📡</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {(botData?.latency.ws || 0) < 100 ? 'Excellent' : (botData?.latency.ws || 0) < 200 ? 'Good' : 'High'}
            </p>
          </div>

          {/* Members */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {botData?.guild?.memberCount || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-xl">👥</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {botData?.guild?.humanCount || 0} humans • {botData?.guild?.botCount || 0} bots
            </p>
          </div>

          {/* Channels */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Channels</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {botData?.guild?.channelCount || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-xl">#</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {botData?.guild?.textChannels || 0} text • {botData?.guild?.voiceChannels || 0} voice
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* System Health */}
          <div className="col-span-12 xl:col-span-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-full">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                🖥️ System Health
              </h3>
              <div className="space-y-4">
                {/* Memory RSS */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Memory (RSS)</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatBytes(botData?.system.memory.rss || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((botData?.system.memory.rssMB || 0) / 512 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                {/* Heap Used */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Heap Used / Total</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {botData?.system.memory.heapUsedMB || 0} / {botData?.system.memory.heapTotalMB || 0} MB ({heapPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        heapPercent > 80 ? 'bg-red-600' : heapPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${heapPercent}%` }}
                    ></div>
                  </div>
                </div>
                {/* System Info Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: 'Node.js', value: botData?.system.nodeVersion },
                    { label: 'discord.js', value: `v${botData?.system.discordjsVersion}` },
                    { label: 'Platform', value: `${botData?.system.platform} (${botData?.system.arch})` },
                    { label: 'Process ID', value: `#${botData?.system.pid}` },
                    { label: 'Active Tickets', value: botData?.activeTickets?.toString() || '0' },
                    { label: 'Cached Users', value: botData?.cachedUsers?.toString() || '0' },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Guild Info */}
          <div className="col-span-12 xl:col-span-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-full">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                🏰 Guild Information
              </h3>
              {botData?.guild ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {botData.guild.icon ? (
                      <img src={botData.guild.icon} alt="Guild" className="w-14 h-14 rounded-full" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-2xl">🏰</span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{botData.guild.name}</h4>
                      <p className="text-xs font-mono text-gray-400 dark:text-gray-500">ID: {botData.guild.id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Members', value: botData.guild.memberCount, emoji: '👥' },
                      { label: 'Online', value: botData.guild.onlineCount, emoji: '🟢' },
                      { label: 'Text Channels', value: botData.guild.textChannels, emoji: '#️⃣' },
                      { label: 'Voice Channels', value: botData.guild.voiceChannels, emoji: '🔊' },
                      { label: 'Categories', value: botData.guild.categories, emoji: '📁' },
                      { label: 'Roles', value: botData.guild.roleCount, emoji: '🎭' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-lg">{item.emoji}</span>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Server Created</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                      {new Date(botData.guild.createdAt).toLocaleDateString('id-ID', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No guild data available</p>
              )}
            </div>
          </div>

          {/* Registered Commands */}
          <div className="col-span-12 xl:col-span-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                ⌨️ Registered Commands
              </h3>
              <div className="space-y-2">
                {botData?.commands.map(cmd => (
                  <div key={cmd.name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-blue-500 font-mono text-sm">/</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{cmd.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  </div>
                ))}
              </div>
              {/* OCR Engine */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔍</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">OCR Engine</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active text extraction engine</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {botData?.ocrEngine || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="col-span-12 xl:col-span-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                🔌 API Endpoints
              </h3>
              <div className="space-y-2">
                {botData?.apiEndpoints.map(ep => (
                  <div key={ep.path} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${ep.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{ep.name}</p>
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{ep.path}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      ep.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {ep.status === 'active' ? '● Active' : '● Down'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
