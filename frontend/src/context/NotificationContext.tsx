import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  user_id: string;
  role: string;
  type: string;
  title: string;
  message: string;
  link_tab?: string;
  is_read: number;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/notifications/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count || 0);
        }
      }
    } catch (_) {}
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s poll fallback
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Server-Sent Events (SSE) listener for real-time live events
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && (parsed.type === 'new_notification' || parsed.type === 'order.placed' || parsed.type === 'inquiry.created')) {
            fetchNotifications();
            window.dispatchEvent(new CustomEvent('orders_updated'));
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(`/api/notifications/user/${user.id}/read-all`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (_) {}
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
