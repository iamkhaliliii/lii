"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { SlackConversation, SlackMessage, SlackUser } from "@/types";
import { useSettings } from "./useSettings";
import {
  getSlackConversations,
  getSlackMessages,
  getSlackUsers,
  getSlackThreadReplies,
  refreshPinnedTimestamps,
  sendSlackMessage as sendSlackMsg,
  resolveSlackMentions,
} from "@/lib/slack";

export function useSlack() {
  const { settings, updateSettings } = useSettings();
  const token = settings.slack?.token || "";
  const isConnected = !!(settings.slack?.connected && token);
  const pinnedIds = settings.slack?.pinnedChannels || [];

  const [conversations, setConversations] = useState<SlackConversation[]>([]);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [threadReplies, setThreadReplies] = useState<Record<string, SlackMessage[]>>({});
  const [loadingThread, setLoadingThread] = useState<string | null>(null);

  const usersRef = useRef<Map<string, SlackUser>>(new Map());
  const fetchingRef = useRef(false);

  const togglePin = useCallback((channelId: string) => {
    const current = settings.slack?.pinnedChannels || [];
    const next = current.includes(channelId)
      ? current.filter(id => id !== channelId)
      : [...current, channelId];
    updateSettings({
      slack: { ...settings.slack!, pinnedChannels: next },
    });
  }, [settings.slack, updateSettings]);

  const loadConversations = useCallback(async () => {
    if (!token || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      if (usersRef.current.size === 0) {
        const userList = await getSlackUsers(token);
        const map = new Map<string, SlackUser>();
        userList.forEach((u) => map.set(u.id, u));
        usersRef.current = map;
      }
      const userMap = usersRef.current;

      let convs = await getSlackConversations(token);

      // Fetch accurate timestamps only for pinned conversations
      const currentPinned = settings.slack?.pinnedChannels || [];
      if (currentPinned.length > 0) {
        convs = await refreshPinnedTimestamps(token, currentPinned, convs);
      }

      const pinnedSet = new Set(currentPinned);
      const resolved = convs.map((c) => {
        const conv = { ...c, pinned: pinnedSet.has(c.id) };
        if (conv.type === "dm" && conv.userId) {
          const user = userMap.get(conv.userId);
          if (user) {
            conv.userName = user.displayName || user.realName;
            conv.avatarUrl = user.avatarUrl;
          }
        }
        if (conv.type === "mpim" && conv.name) {
          const handles = conv.name
            .replace(/^mpdm-/, "")
            .replace(/-1$/, "")
            .split("--");
          const names: string[] = [];
          const avatars: string[] = [];
          for (const handle of handles) {
            const found = [...userMap.values()].find((u) => u.name === handle);
            names.push(found?.displayName || found?.realName || handle);
            if (found?.avatarUrl) avatars.push(found.avatarUrl);
          }
          conv.userName = names.join(", ");
          conv.memberAvatars = avatars;
          if (avatars.length > 0) conv.avatarUrl = avatars[0];
        }
        return conv;
      });

      // Pinned first (sorted by timestamp), then rest (sorted by timestamp)
      const pinned = resolved.filter(c => c.pinned).sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
      const rest = resolved.filter(c => !c.pinned).sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
      setConversations([...pinned, ...rest]);
    } catch (err) {
      console.error("Failed to load Slack conversations:", err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [token, settings.slack?.pinnedChannels]);

  const loadMessages = useCallback(
    async (channelId: string) => {
      if (!token) return;
      setLoadingMessages(true);
      setActiveChannelId(channelId);
      setThreadReplies({});
      try {
        const msgs = await getSlackMessages(token, channelId, 50);
        const userMap = usersRef.current;
        const resolved = msgs.map((m) => {
          const user = userMap.get(m.userId);
          return {
            ...m,
            userName: user?.displayName || user?.realName || m.userId,
            avatarUrl: user?.avatarUrl,
            text: resolveSlackMentions(m.text, userMap),
          };
        });
        setMessages(resolved);
      } catch (err) {
        console.error("Failed to load Slack messages:", err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token]
  );

  const selectChannel = useCallback(
    (id: string) => { loadMessages(id); },
    [loadMessages]
  );

  const sendMessage = useCallback(
    async (channelId: string, text: string, threadTs?: string) => {
      if (!token) return;
      setSending(true);
      try {
        await sendSlackMsg(token, channelId, text, threadTs);
        await loadMessages(channelId);
      } catch (err) {
        console.error("Failed to send Slack message:", err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [token, loadMessages]
  );

  const loadThreadReplies = useCallback(
    async (channelId: string, threadTs: string) => {
      if (!token) return;
      if (threadReplies[threadTs]) {
        setThreadReplies((prev) => {
          const next = { ...prev };
          delete next[threadTs];
          return next;
        });
        return;
      }
      setLoadingThread(threadTs);
      try {
        const replies = await getSlackThreadReplies(token, channelId, threadTs);
        const userMap = usersRef.current;
        const resolved = replies
          .filter((r) => r.ts !== threadTs)
          .map((r) => {
            const user = userMap.get(r.userId);
            return {
              ...r,
              userName: user?.displayName || user?.realName || r.userId,
              avatarUrl: user?.avatarUrl,
              text: resolveSlackMentions(r.text, userMap),
            };
          });
        setThreadReplies((prev) => ({ ...prev, [threadTs]: resolved }));
      } catch (err) {
        console.error("Failed to load thread replies:", err);
      } finally {
        setLoadingThread(null);
      }
    },
    [token, threadReplies]
  );

  const resolveUserName = useCallback(
    (userId: string): string => {
      const user = usersRef.current.get(userId);
      return user?.displayName || user?.realName || userId;
    },
    []
  );

  useEffect(() => {
    usersRef.current = new Map();
    fetchingRef.current = false;
    setConversations([]);
    setMessages([]);
    setThreadReplies({});
    setActiveChannelId(null);
  }, [token]);

  return {
    isConnected,
    conversations,
    messages,
    pinnedIds,
    loading,
    loadingMessages,
    activeChannelId,
    sending,
    threadReplies,
    loadingThread,
    loadConversations,
    loadMessages,
    selectChannel,
    sendMessage,
    resolveUserName,
    togglePin,
    loadThreadReplies,
  };
}
