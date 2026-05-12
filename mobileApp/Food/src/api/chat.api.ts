import { http } from './http';
import type { ApiResponse, ChatAttachment, ChatMessage, Conversation, PaginatedResponse } from '../types';

export type DirectConversationTargetRole = 'DONOR' | 'RECEIVER' | 'VOLUNTEER';

export type LocalUploadFile = {
  uri: string;
  name: string;
  mime_type: string;
};

export async function getOrCreateDonationConversation(donationId: string, targetRole?: DirectConversationTargetRole) {
  return http.post<ApiResponse<Conversation>>(`/chat/direct/donation/${donationId}`, {
    ...(targetRole ? { target_role: targetRole } : {}),
  });
}

export async function listConversations(page = 1, limit = 20) {
  return http.get<PaginatedResponse<Conversation>>('/chat/conversations', {
    params: { page, limit },
  });
}

export async function listConversationMessages(conversationId: string, page = 1, limit = 30) {
  return http.get<PaginatedResponse<ChatMessage>>(`/chat/conversations/${conversationId}/messages`, {
    params: { page, limit },
  });
}

export async function sendMessageToConversation(
  conversationId: string,
  payload: { text?: string; attachments?: ChatAttachment[] },
) {
  return http.post<ApiResponse<{ conversation_id: string; message: ChatMessage }>>(
    `/chat/conversations/${conversationId}/messages`,
    {
      text: payload.text || '',
      attachments: payload.attachments || [],
    },
  );
}

export async function markConversationRead(conversationId: string) {
  return http.post<ApiResponse<{ read_count: number }>>(`/chat/conversations/${conversationId}/read`);
}

export async function uploadChatAttachments(files: LocalUploadFile[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.mime_type,
    } as any);
  });

  return http.post<ApiResponse<{ attachments: ChatAttachment[] }>>('/chat/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
