import { create } from 'zustand';
import { http } from '../api/http';

type NotificationState = {
  unreadCount: number;
  // Bump mỗi khi có notification tới (foreground). Các màn home subscribe để
  // refetch dữ liệu real-time — vd. volunteer trả đơn → donor thấy đơn đổi trạng thái.
  dataVersion: number;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  increment: () => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  dataVersion: 0,

  refresh: async () => {
    try {
      const res = await http.get('/notifications');
      const list = (res.data?.data ?? []) as { is_read?: boolean }[];
      const unread = list.filter((n) => !n.is_read).length;
      set({ unreadCount: unread });
    } catch {
      // im lặng — giữ số cũ
    }
  },

  markAllRead: async () => {
    try {
      await http.patch('/notifications/read-all');
    } catch {
      // im lặng
    } finally {
      set({ unreadCount: 0 });
    }
  },

  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1, dataVersion: s.dataVersion + 1 })),

  reset: () => set({ unreadCount: 0 }),
}));
