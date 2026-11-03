import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface AdminNotification {
  id: string;
  type: 'ticket_new' | 'ticket_approved' | 'ticket_rejected' | 'record_new' | 'rank_check' | 'system';
  title: string;
  message: string;
  link?: string;
  icon?: string;
  is_read: boolean;
  meta?: any;
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  isConnected: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  testSound: () => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API chime sound generator (Harmonic double chime)
export function playNotificationChime(volume = 0.1) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: High crisp bell (G5 - 783.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonic resolving tone (C6 - 1046.50 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, now + 0.12);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(volume * 1.1, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Autoplay policy fallback
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mw_notif_sound') !== 'false';
  });
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('mw_notif_sound', String(next));
      soundEnabledRef.current = next;
      if (next) {
        playNotificationChime(0.12);
      }
      return next;
    });
  };

  const testSound = () => {
    playNotificationChime(0.12);
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/notifications?limit=40`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unread_count || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Request browser desktop notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Real-time polling & sync
  useEffect(() => {
    let lastKnownIds = new Set<string>();
    let isFirstFetch = true;

    async function checkNewNotifications() {
      try {
        const res = await fetch(`${apiUrl}/notifications?limit=40`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const incomingList: AdminNotification[] = data.data;

            if (!isFirstFetch) {
              // Check if there are newly arrived notifications
              const newlyAdded = incomingList.filter(n => !lastKnownIds.has(n.id) && !n.is_read);
              if (newlyAdded.length > 0) {
                if (soundEnabledRef.current) {
                  playNotificationChime();
                }
                // Browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  try {
                    new Notification(newlyAdded[0].title, {
                      body: newlyAdded[0].message,
                      icon: '/favicon.ico'
                    });
                  } catch (e) {}
                }
              }
            }

            // Update known IDs
            lastKnownIds = new Set(incomingList.map(n => n.id));
            isFirstFetch = false;

            setNotifications(incomingList);
            setUnreadCount(data.unread_count || 0);
            setIsConnected(true);
          }
        }
      } catch (err) {
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    }

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 4000);

    return () => clearInterval(interval);
  }, [apiUrl]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch(`${apiUrl}/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch(`${apiUrl}/notifications/mark-all-read`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await fetch(`${apiUrl}/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAllRead = async () => {
    setNotifications(prev => prev.filter(n => !n.is_read));

    try {
      await fetch(`${apiUrl}/notifications/clear-all`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isConnected,
        soundEnabled,
        toggleSound,
        testSound,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
