import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  listConversationMessages,
  markConversationRead,
  sendMessageToConversation,
  uploadChatAttachments,
  type LocalUploadFile,
} from '../../../src/api/chat.api';
import { useAuthStore } from '../../../src/store/authStore';
import { useChatStore } from '../../../src/store/chatStore';
import type { ChatMessage } from '../../../src/types';
import { connectChatSocket } from '../../../src/utils/chatSocket';

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatMessageTime(time?: string | null) {
  if (!time) return '';
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function upsertMessage(list: ChatMessage[], incoming: ChatMessage) {
  const exists = list.some((item) => item.id === incoming.id);
  if (exists) return list;

  const merged = [...list, incoming];
  merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return merged;
}

type PendingAttachment = LocalUploadFile & {
  id: string;
};

function createAttachmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isImageAttachment(mimeType?: string, fallbackNameOrUrl?: string) {
  const mime = (mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return true;

  const fallback = (fallbackNameOrUrl || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|heic)$/.test(fallback);
}

const TYPING_THROTTLE_MS = 1500;
const TYPING_STOP_DELAY_MS = 2500;
const TYPING_LISTENER_FAILSAFE_MS = 4000;

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string | string[]; title?: string | string[] }>();

  const conversationId = firstParam(params.conversationId) || '';
  const fallbackTitle = firstParam(params.title) || 'Chat';

  const token = useAuthStore((s) => s.token);
  const viewerId = useAuthStore((s) => s.user?.id);
  const markConversationReadLocal = useChatStore((s) => s.markConversationReadLocal);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [remoteTyping, setRemoteTyping] = useState(false);

  const typingLastEmitRef = useRef<number>(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef<boolean>(false);

  const emitStopTyping = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;

    if (!token || !conversationId) return;
    const socket = connectChatSocket(token);
    if (!socket.connected) return;

    socket.emit('chat:typing', {
      conversation_id: conversationId,
      is_typing: false,
    });
  }, [token, conversationId]);

  const emitStartTyping = useCallback(() => {
    if (!token || !conversationId) return;

    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      emitStopTyping();
    }, TYPING_STOP_DELAY_MS);

    const now = Date.now();
    if (typingActiveRef.current && now - typingLastEmitRef.current < TYPING_THROTTLE_MS) {
      return;
    }

    const socket = connectChatSocket(token);
    if (!socket.connected) return;

    typingLastEmitRef.current = now;
    typingActiveRef.current = true;
    socket.emit('chat:typing', {
      conversation_id: conversationId,
      is_typing: true,
    });
  }, [token, conversationId, emitStopTyping]);

  const roomTitle = useMemo(() => {
    const withName = messages.find((m) => m.sender?.id !== viewerId)?.sender?.full_name;
    return withName || fallbackTitle;
  }, [fallbackTitle, messages, viewerId]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const res = await listConversationMessages(conversationId, 1, 50);
      setMessages(res.data?.data || []);
      await markConversationRead(conversationId);
      markConversationReadLocal(conversationId);
    } catch (err: any) {
      Alert.alert('Không tải được tin nhắn', err?.response?.data?.message || 'Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, markConversationReadLocal]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!token || !conversationId) return;

    let typingTimeout: ReturnType<typeof setTimeout> | null = null;

    const socket = connectChatSocket(token);

    const onConnect = () => {
      socket.emit('chat:join', { conversation_id: conversationId });
    };

    const onNewMessage = (payload: { conversation_id: string; message: ChatMessage }) => {
      if (!payload || payload.conversation_id !== conversationId || !payload.message) return;

      setMessages((prev) => upsertMessage(prev, payload.message));

      if (payload.message.sender_id !== viewerId) {
        void markConversationRead(conversationId);
        socket.emit('chat:mark_read', { conversation_id: conversationId });
        markConversationReadLocal(conversationId);
      }
    };

    const onTyping = (payload: { conversation_id: string; user_id: string; is_typing: boolean }) => {
      if (!payload || payload.conversation_id !== conversationId || payload.user_id === viewerId) return;

      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
      setRemoteTyping(payload.is_typing);
      if (payload.is_typing) {
        typingTimeout = setTimeout(() => setRemoteTyping(false), TYPING_LISTENER_FAILSAFE_MS);
      }
    };

    socket.on('connect', onConnect);
    socket.on('chat:new_message', onNewMessage);
    socket.on('chat:typing', onTyping);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      emitStopTyping();
      socket.emit('chat:leave', { conversation_id: conversationId });
      socket.off('connect', onConnect);
      socket.off('chat:new_message', onNewMessage);
      socket.off('chat:typing', onTyping);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [conversationId, emitStopTyping, markConversationReadLocal, token, viewerId]);

  const pickImages = async () => {
    if (sending || uploadingAttachment) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Thiếu quyền', 'Bạn cần cấp quyền thư viện ảnh để gửi ảnh.');
        return;
      }

      const remain = Math.max(0, 5 - pendingAttachments.length);
      if (remain === 0) {
        Alert.alert('Đã đạt giới hạn', 'Mỗi tin nhắn chỉ gửi tối đa 5 tệp.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remain,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      const picked: PendingAttachment[] = result.assets.slice(0, remain).map((asset, index) => ({
        id: `${createAttachmentId()}-${index}`,
        uri: asset.uri,
        name: asset.fileName || `image-${Date.now()}-${index + 1}.jpg`,
        mime_type: asset.mimeType || 'image/jpeg',
      }));

      setPendingAttachments((prev) => [...prev, ...picked].slice(0, 5));
    } catch {
      Alert.alert('Không thể chọn ảnh', 'Vui lòng thử lại.');
    }
  };

  const pickFiles = async () => {
    if (sending || uploadingAttachment) return;

    try {
      const remain = Math.max(0, 5 - pendingAttachments.length);
      if (remain === 0) {
        Alert.alert('Đã đạt giới hạn', 'Mỗi tin nhắn chỉ gửi tối đa 5 tệp.');
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const picked: PendingAttachment[] = result.assets.slice(0, remain).map((asset, index) => ({
        id: `${createAttachmentId()}-${index}`,
        uri: asset.uri,
        name: asset.name || `file-${Date.now()}-${index + 1}`,
        mime_type: asset.mimeType || 'application/octet-stream',
      }));

      setPendingAttachments((prev) => [...prev, ...picked].slice(0, 5));
    } catch {
      Alert.alert('Không thể chọn file', 'Vui lòng thử lại.');
    }
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const openAttachment = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Không thể mở tệp', 'Thiết bị không hỗ trợ mở liên kết này.');
    }
  };

  const onSend = async () => {
    if (!conversationId || sending) return;

    const text = draft.trim();
    const localAttachments = [...pendingAttachments];
    if (!text && localAttachments.length === 0) return;

    setSending(true);
    setDraft('');
    setPendingAttachments([]);
    emitStopTyping();

    try {
      let uploadedAttachments: { url: string; name: string; mime_type: string; size_bytes: number }[] = [];

      if (localAttachments.length > 0) {
        setUploadingAttachment(true);
        const uploadRes = await uploadChatAttachments(
          localAttachments.map((item) => ({
            uri: item.uri,
            name: item.name,
            mime_type: item.mime_type,
          })),
        );
        uploadedAttachments = uploadRes.data?.data?.attachments || [];
      }

      const socket = token ? connectChatSocket(token) : null;

      if (socket && socket.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.emit('chat:send', {
            conversation_id: conversationId,
            text,
            attachments: uploadedAttachments,
          }, (ack: any) => {
            if (ack?.success && ack?.data?.message) {
              setMessages((prev) => upsertMessage(prev, ack.data.message as ChatMessage));
              resolve();
              return;
            }
            reject(new Error(ack?.message || 'Gửi tin nhắn thất bại.'));
          });
        });
      } else {
        const res = await sendMessageToConversation(conversationId, {
          text,
          attachments: uploadedAttachments,
        });
        const message = res.data?.data?.message;
        if (message) {
          setMessages((prev) => upsertMessage(prev, message));
        }
      }
    } catch (err: any) {
      setDraft(text);
      setPendingAttachments(localAttachments);
      Alert.alert('Không gửi được tin nhắn', err?.message || err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setUploadingAttachment(false);
      setSending(false);
    }
  };

  const onDraftChange = useCallback((value: string) => {
    setDraft(value);
    if (value.trim().length === 0) {
      emitStopTyping();
    } else {
      emitStartTyping();
    }
  }, [emitStartTyping, emitStopTyping]);

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Thiếu thông tin cuộc trò chuyện.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.headerTitle}>{roomTitle}</Text>
          {remoteTyping ? <Text style={styles.typingText}>Đang nhập...</Text> : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color="#008080" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={10}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View style={[styles.bubbleWrap, item.is_me ? styles.bubbleRight : styles.bubbleLeft]}>
                {!item.is_me && item.sender?.full_name ? (
                  <Text style={styles.senderName}>{item.sender.full_name}</Text>
                ) : null}
                {item.text ? (
                  <Text style={[styles.messageText, item.is_me && { color: '#fff' }]}>{item.text}</Text>
                ) : null}
                {item.attachments?.length ? (
                  <View style={styles.attachmentList}>
                    {item.attachments.map((attachment, index) => {
                      const imageAttachment = isImageAttachment(attachment.mime_type, attachment.name || attachment.url);
                      return (
                        <TouchableOpacity
                          key={`${item.id}:att:${index}`}
                          onPress={() => void openAttachment(attachment.url)}
                          style={[
                            styles.attachmentItem,
                            item.is_me ? styles.attachmentItemMe : styles.attachmentItemOther,
                          ]}
                        >
                          {imageAttachment ? (
                            <Image source={{ uri: attachment.url }} style={styles.attachmentImage} />
                          ) : (
                            <View style={styles.attachmentFileIconWrap}>
                              <Ionicons name="document-outline" size={18} color={item.is_me ? '#DDEAFE' : '#374151'} />
                            </View>
                          )}

                          <View style={{ flex: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={[styles.attachmentName, item.is_me && { color: '#fff' }]}
                            >
                              {attachment.name || 'Attachment'}
                            </Text>
                            <Text
                              style={[styles.attachmentHint, item.is_me && { color: '#DDEAFE' }]}
                            >
                              {imageAttachment ? 'Ảnh' : 'Tệp'} - Nhấn để mở
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
                <Text style={[styles.messageTime, item.is_me && { color: '#DDEAFE' }]}>{formatMessageTime(item.created_at)}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Chưa có tin nhắn nào.</Text>
              </View>
            }
          />

          {pendingAttachments.length > 0 ? (
            <View style={styles.pendingWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingList}>
                {pendingAttachments.map((file) => {
                  const imageAttachment = isImageAttachment(file.mime_type, file.name || file.uri);
                  return (
                    <View key={file.id} style={styles.pendingItem}>
                      {imageAttachment ? (
                        <Image source={{ uri: file.uri }} style={styles.pendingImage} />
                      ) : (
                        <View style={styles.pendingFileFallback}>
                          <Ionicons name="document-outline" size={18} color="#374151" />
                        </View>
                      )}
                      <Text style={styles.pendingName} numberOfLines={1}>{file.name}</Text>
                      <TouchableOpacity
                        style={styles.pendingRemoveBtn}
                        onPress={() => removePendingAttachment(file.id)}
                        disabled={sending || uploadingAttachment}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.inputWrap}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => void pickImages()}
              disabled={sending || uploadingAttachment}
            >
              <Ionicons name="image-outline" size={19} color="#008080" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => void pickFiles()}
              disabled={sending || uploadingAttachment}
            >
              <Ionicons name="document-outline" size={19} color="#008080" />
            </TouchableOpacity>
            <TextInput
              value={draft}
              onChangeText={onDraftChange}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!draft.trim() && pendingAttachments.length === 0) || sending || uploadingAttachment
                  ? { opacity: 0.5 }
                  : null,
              ]}
              onPress={() => void onSend()}
              disabled={(!draft.trim() && pendingAttachments.length === 0) || sending || uploadingAttachment}
            >
              {sending || uploadingAttachment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={17} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  typingText: { marginTop: 2, fontSize: 12, color: '#6B7280' },
  messagesList: { paddingHorizontal: 12, paddingVertical: 14, paddingBottom: 26 },
  bubbleWrap: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#008080',
  },
  senderName: { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 2 },
  messageText: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
  messageTime: { fontSize: 10, color: '#6B7280', marginTop: 4, textAlign: 'right' },
  attachmentList: {
    marginTop: 6,
    gap: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 6,
  },
  attachmentItemMe: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  attachmentItemOther: {
    backgroundColor: '#F3F4F6',
  },
  attachmentImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },
  attachmentFileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  attachmentHint: {
    marginTop: 2,
    fontSize: 11,
    color: '#4B5563',
  },
  pendingWrap: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 4,
  },
  pendingList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  pendingItem: {
    width: 90,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 6,
    position: 'relative',
    backgroundColor: '#F9FAFB',
  },
  pendingImage: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    marginBottom: 5,
  },
  pendingFileFallback: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  pendingName: {
    fontSize: 10,
    color: '#374151',
  },
  pendingRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#111827',
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: '#4B5563', marginBottom: 10, textAlign: 'center' },
  backBtn: { backgroundColor: '#008080', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  backBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyWrap: { marginTop: 120, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280' },
});
