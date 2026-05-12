import { create } from 'zustand';
import { listConversations } from '../api/chat.api';
import type { ChatMessage, Conversation } from '../types';

function previewFromMessage(message: ChatMessage) {
  const text = (message.text || '').trim();
  if (text) return text;

  const first = message.attachments?.[0];
  if (!first) return 'Tin nhắn mới';
  if (first.mime_type?.startsWith('image/')) return '📷 Đã gửi một ảnh';
  return '📎 Đã gửi một tệp đính kèm';
}

function sortConversations(items: Conversation[]) {
  return [...items].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

function totalUnread(items: Conversation[]) {
  return items.reduce((sum, item) => sum + (item.unread_count || 0), 0);
}

type ChatStoreState = {
  conversations: Conversation[];
  unreadTotal: number;
  loading: boolean;
  loadedOnce: boolean;

  refreshConversations: () => Promise<void>;
  applyIncomingMessage: (payload: { conversation_id: string; message: ChatMessage }, viewerId?: string | null) => void;
  markConversationReadLocal: (conversationId: string) => void;
  clear: () => void;
};

export const useChatStore = create<ChatStoreState>((set, get) => ({
  conversations: [],
  unreadTotal: 0,
  loading: false,
  loadedOnce: false,

  refreshConversations: async () => {
    if (get().loading) return;

    set({ loading: true });
    try {
      const res = await listConversations(1, 50);
      const items = sortConversations(res.data?.data || []);
      set({
        conversations: items,
        unreadTotal: totalUnread(items),
        loadedOnce: true,
      });
    } catch {
      // Keep existing UI data if network fails.
    } finally {
      set({ loading: false });
    }
  },

  applyIncomingMessage: (payload, viewerId = null) => {
    if (!payload?.conversation_id || !payload?.message) return;

    const { conversation_id, message } = payload;

    set((state) => {
      const idx = state.conversations.findIndex((item) => item.id === conversation_id);
      if (idx < 0) {
        return state;
      }

      const list = [...state.conversations];
      const existing = list[idx];
      const incrementUnread = viewerId && message.sender_id !== viewerId ? 1 : 0;

      list[idx] = {
        ...existing,
        last_message_text: previewFromMessage(message),
        last_message_at: message.created_at,
        last_sender_id: message.sender_id,
        unread_count: Math.max(0, (existing.unread_count || 0) + incrementUnread),
      };

      const sorted = sortConversations(list);
      return {
        conversations: sorted,
        unreadTotal: totalUnread(sorted),
      };
    });
  },

  markConversationReadLocal: (conversationId) => {
    set((state) => {
      const list = state.conversations.map((item) => {
        if (item.id !== conversationId) return item;
        return {
          ...item,
          unread_count: 0,
        };
      });

      return {
        conversations: list,
        unreadTotal: totalUnread(list),
      };
    });
  },

  clear: () => {
    set({
      conversations: [],
      unreadTotal: 0,
      loading: false,
      loadedOnce: false,
    });
  },
}));
