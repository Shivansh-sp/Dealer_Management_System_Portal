import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

interface NotificationState {
  socket: Socket | null;
  notifications: NotificationItem[];
  initSocket: (userId: string) => void;
  disconnectSocket: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  socket: null,
  notifications: [],

  initSocket: (userId: string) => {
    if (get().socket) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('join', userId);
    });

    newSocket.on('notification', (data: any) => {
      get().addNotification({
        type: data.type || 'System',
        message: data.message,
      });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  addNotification: (notification) => {
    const newItem: NotificationItem = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      isRead: false,
    };
    set((state) => ({
      notifications: [newItem, ...state.notifications],
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },
}));
