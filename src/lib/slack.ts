import { SlackConversation, SlackMessage, SlackUser, SlackFile, SlackReaction, SlackAttachment } from "@/types";
import { isTauri } from "./auth";

const BASE = "https://slack.com/api";

let fetchPromise: Promise<typeof globalThis.fetch> | null = null;

function getHttpFetch(): Promise<typeof globalThis.fetch> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    if (isTauri()) {
      try {
        const mod = await import("@tauri-apps/plugin-http");
        return mod.fetch as unknown as typeof globalThis.fetch;
      } catch (e) {
        console.warn("Tauri HTTP plugin not available, falling back to browser fetch", e);
      }
    }
    return globalThis.fetch;
  })();

  return fetchPromise;
}

async function slackFetch(
  method: string,
  token: string,
  params?: Record<string, string>,
  retries = 3
): Promise<Record<string, unknown>> {
  const httpFetch = await getHttpFetch();
  const url = new URL(`${BASE}/${method}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await httpFetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "3", 10);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw new Error(`Slack rate limited after ${retries} retries`);
    }

    if (!res.ok) throw new Error(`Slack API HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack ${method}: ${data.error}`);
    return data;
  }

  throw new Error("Unreachable");
}

async function slackPost(method: string, token: string, body: Record<string, unknown>) {
  const httpFetch = await getHttpFetch();
  const res = await httpFetch(`${BASE}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Slack API HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (!data.ok) {
    console.error(`[Slack] ${method} failed:`, data.error, data);
    throw new Error(`Slack ${method}: ${data.error}`);
  }
  return data;
}

// ─── Test connection ─────────────────────────────────────────

export async function testSlackConnection(
  token: string
): Promise<{ ok: boolean; user?: string; team?: string; error?: string }> {
  try {
    const data = await slackFetch("auth.test", token);
    return { ok: true, user: data.user as string, team: data.team as string };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ─── Get conversations (DMs + channels) ─────────────────────

function parseConversation(ch: Record<string, unknown>): SlackConversation {
  let type: SlackConversation["type"] = "channel";
  if (ch.is_im) type = "dm";
  else if (ch.is_mpim) type = "mpim";
  else if (ch.is_group || ch.is_private) type = "group";

  const updated = ch.updated as number | undefined;
  let lastTimestamp: number | undefined;
  if (updated) {
    lastTimestamp = updated > 1e12 ? updated : updated * 1000;
  }

  return {
    id: ch.id as string,
    name: (ch.name as string) || "",
    type,
    userId: type === "dm" ? (ch.user as string) : undefined,
    isMember: ch.is_member as boolean | undefined,
    unreadCount: (ch.unread_count_display as number) || 0,
    lastTimestamp,
  };
}

async function getLatestMessageTs(
  token: string,
  channelId: string
): Promise<{ ts: number; text: string } | undefined> {
  try {
    const data = await slackFetch("conversations.history", token, {
      channel: channelId,
      limit: "1",
    });
    const msgs = (data.messages as Record<string, unknown>[]) || [];
    if (msgs.length > 0) {
      return {
        ts: parseFloat(msgs[0].ts as string) * 1000,
        text: (msgs[0].text as string) || "",
      };
    }
  } catch {
    // rate limited or inaccessible
  }
  return undefined;
}

export async function getSlackConversations(
  token: string
): Promise<SlackConversation[]> {
  const all: SlackConversation[] = [];
  let cursor: string | undefined;

  do {
    const params: Record<string, string> = {
      types: "public_channel,private_channel,mpim,im",
      exclude_archived: "true",
      limit: "200",
    };
    if (cursor) params.cursor = cursor;

    const data = await slackFetch("users.conversations", token, params);
    const channels = (data.channels as Record<string, unknown>[]) || [];
    all.push(...channels.map((ch) => parseConversation(ch)));

    cursor = (data.response_metadata as Record<string, unknown>)?.next_cursor as string | undefined;
  } while (cursor);

  return all;
}

export async function refreshPinnedTimestamps(
  token: string,
  pinnedIds: string[],
  conversations: SlackConversation[]
): Promise<SlackConversation[]> {
  const pinnedSet = new Set(pinnedIds);
  const pinned = conversations.filter(c => pinnedSet.has(c.id));

  for (const conv of pinned) {
    const result = await getLatestMessageTs(token, conv.id);
    if (result) {
      conv.lastTimestamp = result.ts;
      conv.lastMessage = result.text.length > 80
        ? result.text.slice(0, 80) + "…"
        : result.text;
    }
  }

  return conversations;
}

// ─── Rich message parsers ────────────────────────────────────

function parseFiles(raw: unknown[]): SlackFile[] {
  return raw.map((f: unknown) => {
    const file = f as Record<string, unknown>;
    return {
      id: (file.id as string) || "",
      name: (file.name as string) || "file",
      mimetype: (file.mimetype as string) || "",
      filetype: (file.filetype as string) || "",
      size: file.size as number | undefined,
    };
  });
}

function parseReactions(raw: unknown[]): SlackReaction[] {
  return raw.map((r: unknown) => {
    const reaction = r as Record<string, unknown>;
    return {
      name: (reaction.name as string) || "",
      count: (reaction.count as number) || 0,
      users: (reaction.users as string[]) || [],
    };
  });
}

function parseAttachments(raw: unknown[]): SlackAttachment[] {
  return raw.map((a: unknown) => {
    const att = a as Record<string, unknown>;
    return {
      title: att.title as string | undefined,
      titleLink: (att.title_link as string) || (att.from_url as string) || undefined,
      text: att.text as string | undefined,
      pretext: att.pretext as string | undefined,
      fromUrl: att.from_url as string | undefined,
      serviceName: att.service_name as string | undefined,
      color: att.color as string | undefined,
    };
  });
}

// ─── Get messages ────────────────────────────────────────────

export async function getSlackMessages(
  token: string,
  channelId: string,
  limit = 50
): Promise<SlackMessage[]> {
  const data = await slackFetch("conversations.history", token, {
    channel: channelId,
    limit: String(limit),
  });

  const messages = (data.messages as Record<string, unknown>[]) || [];

  return messages
    .filter((m) => m.type === "message")
    .map((m) => ({
      ts: m.ts as string,
      userId: (m.user as string) || "",
      text: (m.text as string) || "",
      timestamp: parseFloat(m.ts as string) * 1000,
      threadTs: m.thread_ts as string | undefined,
      isThread: !!(m.thread_ts && m.thread_ts !== m.ts),
      replyCount: (m.reply_count as number) || 0,
      files: m.files ? parseFiles(m.files as unknown[]) : undefined,
      reactions: m.reactions ? parseReactions(m.reactions as unknown[]) : undefined,
      attachments: m.attachments ? parseAttachments(m.attachments as unknown[]) : undefined,
    }))
    .reverse();
}

// ─── Thread replies ─────────────────────────────────────────

export async function getSlackThreadReplies(
  token: string,
  channelId: string,
  threadTs: string
): Promise<SlackMessage[]> {
  const data = await slackFetch("conversations.replies", token, {
    channel: channelId,
    ts: threadTs,
    limit: "100",
  });

  const messages = (data.messages as Record<string, unknown>[]) || [];

  return messages
    .filter((m) => m.type === "message")
    .map((m) => ({
      ts: m.ts as string,
      userId: (m.user as string) || "",
      text: (m.text as string) || "",
      timestamp: parseFloat(m.ts as string) * 1000,
      threadTs: m.thread_ts as string | undefined,
      isThread: true,
      replyCount: 0,
      files: m.files ? parseFiles(m.files as unknown[]) : undefined,
      reactions: m.reactions ? parseReactions(m.reactions as unknown[]) : undefined,
      attachments: m.attachments ? parseAttachments(m.attachments as unknown[]) : undefined,
    }));
}

// ─── Users ───────────────────────────────────────────────────

export async function getSlackUsers(token: string): Promise<SlackUser[]> {
  const data = await slackFetch("users.list", token, { limit: "500" });
  const members = (data.members as Record<string, unknown>[]) || [];

  return members
    .filter((u: Record<string, unknown>) => !u.deleted)
    .map((u: Record<string, unknown>) => {
      const profile = u.profile as Record<string, unknown> || {};
      return {
        id: u.id as string,
        name: u.name as string,
        realName: (u.real_name as string) || (u.name as string),
        displayName:
          (profile.display_name as string) ||
          (u.real_name as string) ||
          (u.name as string),
        avatarUrl: (profile.image_72 as string) || (profile.image_48 as string) || undefined,
        isBot: u.is_bot as boolean,
      };
    });
}

export async function getSlackUserInfo(
  token: string,
  userId: string
): Promise<SlackUser> {
  const data = await slackFetch("users.info", token, { user: userId });
  const u = data.user as Record<string, unknown>;
  const profile = (u.profile as Record<string, unknown>) || {};
  return {
    id: u.id as string,
    name: u.name as string,
    realName: (u.real_name as string) || (u.name as string),
    displayName: (profile.display_name as string) || (u.real_name as string) || (u.name as string),
    avatarUrl: (profile.image_48 as string) || undefined,
    isBot: u.is_bot as boolean,
  };
}

// ─── Send message ────────────────────────────────────────────

export async function sendSlackMessage(
  token: string,
  channelId: string,
  text: string,
  threadTs?: string
): Promise<void> {
  await slackPost("chat.postMessage", token, {
    channel: channelId,
    text,
    ...(threadTs ? { thread_ts: threadTs } : {}),
  });
}

// ─── Resolve user mentions in text ───────────────────────────

export function resolveSlackMentions(
  text: string,
  userMap: Map<string, SlackUser>
): string {
  return text.replace(/<@(U[A-Z0-9]+)>/g, (_, userId) => {
    const user = userMap.get(userId);
    return user ? `@${user.displayName}` : `@${userId}`;
  });
}
