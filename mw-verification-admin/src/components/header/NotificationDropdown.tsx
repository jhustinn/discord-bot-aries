import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router";
import { useNotificationContext, AdminNotification } from "../../context/NotificationContext";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
    deleteNotification,
    soundEnabled,
    toggleSound,
    testSound
  } = useNotificationContext();
  const navigate = useNavigate();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleItemClick = (notif: AdminNotification) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    closeDropdown();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  const getTypeIcon = (type: string, customIcon?: string) => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'ticket_new': return '🎫';
      case 'ticket_approved': return '✅';
      case 'ticket_rejected': return '❌';
      case 'record_new': return '⚔️';
      case 'rank_check': return '📊';
      default: return '🔔';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer"
        onClick={toggleDropdown}
        title={isConnected ? "Realtime Notifications (Live)" : "Notifications"}
      >
        {/* Pulsing Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
            <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
            <span className="relative z-10">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </span>
        )}

        {/* Bell SVG */}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-3 flex h-[520px] w-[380px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:w-[410px] lg:right-0 z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-bold text-gray-800 dark:text-white">
              Notifications
            </h5>
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={closeDropdown}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter & Sound Controls Bar */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Sound Mute & Test Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={testSound}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="Click to test chime sound"
            >
              🔔 Test
            </button>
            <button
              onClick={toggleSound}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={soundEnabled ? "Sound enabled (Click to mute)" : "Sound muted (Click to enable)"}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto space-y-1 py-2 pr-1 custom-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <span className="text-3xl mb-2">🔔</span>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {filter === 'unread' ? 'You have read all notifications' : 'New bot events will appear here in real-time'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`group relative flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border ${
                  notif.is_read
                    ? 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50 border-transparent hover:border-gray-100 dark:hover:border-gray-800'
                    : 'bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border-blue-100 dark:border-blue-900/30'
                }`}
              >
                {/* Icon Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
                  {getTypeIcon(notif.type, notif.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`text-xs truncate ${notif.is_read ? 'font-medium text-gray-800 dark:text-gray-200' : 'font-bold text-gray-900 dark:text-white'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Unread indicator dot */}
                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-2"></span>
                )}

                {/* Delete button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs p-1 transition-opacity"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[11px]">
            {isConnected ? '🟢 SSE Connected' : '🟡 Polling mode'}
          </span>
          <button
            onClick={() => {
              closeDropdown();
              navigate('/tickets');
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold cursor-pointer"
          >
            View Verification Tickets →
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
