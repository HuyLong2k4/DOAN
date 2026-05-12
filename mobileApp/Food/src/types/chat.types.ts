export interface ChatUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'UNSET' | 'ADMIN' | 'DONOR' | 'RECEIVER' | 'VOLUNTEER' | null;
}

export interface ChatAttachment {
  url: string;
  name: string;
  mime_type: string;
  size_bytes: number;
}

export interface Conversation {
  id: string;
  donation_id: string | null;
  delivery_id: string | null;
  participants: ChatUser[];
  counterpart: ChatUser | null;
  last_message_text: string;
  last_message_at: string | null;
  last_sender_id: string | null;
  updated_at: string | null;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  text: string;
  attachments: ChatAttachment[];
  sender: ChatUser | null;
  sender_id: string;
  is_me: boolean;
  seen_by: string[];
  created_at: string;
  updated_at: string;
}
