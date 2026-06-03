import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "../../src/store/authStore";
import { useChatStore } from "../../src/store/chatStore";
import { useI18n } from "../../src/i18n/useI18n";
import { connectChatSocket } from "../../src/utils/chatSocket";
import type { ChatMessage } from "../../src/types";
import { roleUi } from '@/src/theme/roleUi';

const ACTIVE_COLOR   = "#111";
const INACTIVE_COLOR = "#999";

export default function TabsLayout() {
  const { t } = useI18n();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role);
  const isDonor = role === "DONOR";
  const isVolunteer = role === "VOLUNTEER";
  const isReceiver = role === "RECEIVER";

  const unreadTotal = useChatStore((s) => s.unreadTotal);
  const refreshConversations = useChatStore((s) => s.refreshConversations);
  const applyIncomingMessage = useChatStore((s) => s.applyIncomingMessage);
  const markConversationReadLocal = useChatStore((s) => s.markConversationReadLocal);
  const clearChatState = useChatStore((s) => s.clear);

  useEffect(() => {
    if (!token || !userId) {
      clearChatState();
      return;
    }

    void refreshConversations();

    const socket = connectChatSocket(token);
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const queueRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void refreshConversations();
      }, 300);
    };

    const onNewMessage = (payload: { conversation_id: string; message: ChatMessage }) => {
      if (!payload?.conversation_id || !payload?.message) return;

      const knownConversation = useChatStore.getState().conversations.some(
        (item) => item.id === payload.conversation_id,
      );

      applyIncomingMessage(payload, userId);
      if (!knownConversation) {
        queueRefresh();
      }
    };

    const onRead = (payload: { conversation_id: string; user_id: string }) => {
      if (!payload?.conversation_id || !payload?.user_id) return;
      if (payload.user_id !== userId) return;

      markConversationReadLocal(payload.conversation_id);
    };

    socket.on("chat:new_message", onNewMessage);
    socket.on("chat:read", onRead);

    return () => {
      socket.off("chat:new_message", onNewMessage);
      socket.off("chat:read", onRead);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [
    applyIncomingMessage,
    clearChatState,
    markConversationReadLocal,
    refreshConversations,
    token,
    userId,
  ]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="DONOR/home"
        options={{
          href: isDonor ? undefined : null,
          title: t('tab.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="VOLUNTEER/home"
        options={{
          href: isVolunteer ? undefined : null,
          title: t('tab.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="RECEIVER/home"
        options={{
          href: isReceiver ? undefined : null,
          title: t('tab.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="message"
        options={{
          title: t('tab.message'),
          tabBarIcon: ({ color, size }) => (
            <View style={styles.messageIconWrap}>
              <Ionicons name="chatbox-outline" size={size + 2} color={color} />
              {unreadTotal > 0 ? (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>{unreadTotal > 99 ? "99+" : unreadTotal}</Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={size + 4} color={color} />
          ),
        }}
      />

      {/* Hidden route — accessible via router.push only */}
      <Tabs.Screen name="personalInfo" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  messageIconWrap: {
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: roleUi.colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
});
