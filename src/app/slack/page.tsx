"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useSlack } from "@/hooks/useSlack";
import { useSettings } from "@/hooks/useSettings";
import { translateDirect, polishReplyDirect } from "@/lib/ai/client-direct";
import { SlackConversation, SlackMessage, SlackFile, SlackAttachment } from "@/types";
import {
  Hash,
  MessageCircle,
  Search,
  Settings,
  Loader2,
  Languages,
  Send,
  User,
  Users,
  ChevronDown,
  ArrowUpRight,
  Pin,
  PinOff,
  MessageSquare,
  X,
  Copy,
  Check,
  Sparkles,
  FileText,
  Film,
  Image as ImageIcon,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

function getMsgTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function getDateSeparator(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function getTimeLabel(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getConversationIcon(type: SlackConversation["type"]) {
  switch (type) {
    case "dm":
      return User;
    case "mpim":
      return Users;
    default:
      return Hash;
  }
}

function AvatarStack({ urls, size = 28 }: { urls: string[]; size?: number }) {
  const show = urls.slice(0, 3);
  const overlap = Math.round(size * 0.55);
  const totalWidth = size + (show.length - 1) * (size - overlap);

  return (
    <div
      className="relative shrink-0"
      style={{ width: totalWidth, height: size }}
    >
      {show.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className="absolute top-0 rounded-full object-cover ring-2 ring-background"
          style={{
            width: size,
            height: size,
            left: i * (size - overlap),
            zIndex: show.length - i,
          }}
        />
      ))}
    </div>
  );
}

// ─── Rich text: parse links and format ──────────────────────

function RichText({ text }: { text: string }) {
  // Parse Slack mrkdwn: <url>, <url|label>, *bold*, _italic_, ~strike~, `code`
  const parts: React.ReactNode[] = [];
  // Combined regex for slack links and raw URLs
  const pattern = /(<(https?:\/\/[^|>]+)(?:\|([^>]+))?>)|(https?:\/\/[^\s<>)\]]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(formatInline(text.slice(lastIndex, match.index), parts.length));
    }

    const url = match[2] || match[4]; // slack link URL or raw URL
    const label = match[3] || cleanUrl(url);

    parts.push(
      <a
        key={`link-${parts.length}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-primary/80 hover:text-primary hover:underline transition-colors break-all"
      >
        <LinkIcon size={10} className="shrink-0 opacity-50" />
        <span>{label}</span>
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(formatInline(text.slice(lastIndex), parts.length));
  }

  return <>{parts}</>;
}

function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    const display = host + path;
    return display.length > 60 ? display.slice(0, 57) + "…" : display;
  } catch {
    return url.length > 60 ? url.slice(0, 57) + "…" : url;
  }
}

function formatInline(text: string, keyBase: number): React.ReactNode {
  // Simple inline formatting: *bold*, _italic_, ~strike~, `code`
  const parts: React.ReactNode[] = [];
  const inlinePattern = /(\*[^*\n]+\*)|(_[^_\n]+_)|(~[^~\n]+~)|(`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = inlinePattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    const inner = raw.slice(1, -1);
    if (raw.startsWith("*")) parts.push(<strong key={`b-${keyBase}-${m.index}`}>{inner}</strong>);
    else if (raw.startsWith("_")) parts.push(<em key={`i-${keyBase}-${m.index}`}>{inner}</em>);
    else if (raw.startsWith("~")) parts.push(<s key={`s-${keyBase}-${m.index}`} className="opacity-60">{inner}</s>);
    else if (raw.startsWith("`")) parts.push(<code key={`c-${keyBase}-${m.index}`} className="rounded bg-accent px-1 py-0.5 text-[11px] font-mono">{inner}</code>);
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// ─── File attachment rendering ──────────────────────────────

function FilePreview({ file, token }: { file: SlackFile; token: string }) {
  const isImage = file.mimetype?.startsWith("image/");
  const isVideo = file.mimetype?.startsWith("video/");
  const thumb = file.thumb480 || file.thumb360 || file.thumbVideo;

  const authHeaders = { Authorization: `Bearer ${token}` };

  if (isImage && thumb) {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="group/file block mt-1.5">
        <div className="relative overflow-hidden rounded-lg border border-border-subtle max-w-[320px]">
          <img
            src={thumb}
            alt={file.name}
            className="block w-full object-cover transition-transform group-hover/file:scale-[1.02]"
            style={{ maxHeight: 240 }}
            onError={(e) => {
              // If direct load fails (auth required), show placeholder
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden items-center justify-center bg-accent/50 py-8">
            <ImageIcon size={24} className="text-muted/40" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 pb-1.5 pt-4 opacity-0 group-hover/file:opacity-100 transition-opacity">
            <span className="text-[10px] text-white/90 font-medium">{file.name}</span>
          </div>
        </div>
      </a>
    );
  }

  if (isImage && !thumb) {
    return (
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border-subtle bg-accent/30 px-3 py-2.5 max-w-[320px]">
        <ImageIcon size={18} className="shrink-0 text-primary/50" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-foreground/80">{file.name}</p>
          {file.size && <p className="text-[10px] text-muted/50">{formatFileSize(file.size)}</p>}
        </div>
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted/40 hover:text-primary transition-colors">
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="mt-1.5 max-w-[320px]">
        {file.thumbVideo || thumb ? (
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="group/file block">
            <div className="relative overflow-hidden rounded-lg border border-border-subtle">
              <img
                src={file.thumbVideo || thumb}
                alt={file.name}
                className="block w-full object-cover"
                style={{ maxHeight: 200 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden items-center justify-center bg-accent/50 py-8">
                <Film size={24} className="text-muted/40" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform group-hover/file:scale-110">
                  <Film size={18} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 pb-1.5 pt-4">
                <span className="text-[10px] text-white/90 font-medium">{file.name}</span>
              </div>
            </div>
          </a>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-accent/30 px-3 py-2.5">
            <Film size={18} className="shrink-0 text-purple-500/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-foreground/80">{file.name}</p>
              {file.size && <p className="text-[10px] text-muted/50">{formatFileSize(file.size)}</p>}
            </div>
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted/40 hover:text-primary transition-colors">
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Generic file
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border-subtle bg-accent/30 px-3 py-2.5 max-w-[320px]">
      <FileText size={18} className="shrink-0 text-muted/50" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-foreground/80">{file.name}</p>
        <p className="text-[10px] text-muted/50">
          {file.filetype.toUpperCase()}{file.size ? ` · ${formatFileSize(file.size)}` : ""}
        </p>
      </div>
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted/40 hover:text-primary transition-colors">
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Link unfurl / attachment card ──────────────────────────

function AttachmentCard({ att }: { att: SlackAttachment }) {
  const hasImage = !!(att.imageUrl || att.thumbUrl);
  return (
    <div
      className="mt-1.5 overflow-hidden rounded-lg border border-border-subtle max-w-[400px]"
      style={att.color ? { borderLeftWidth: 3, borderLeftColor: `#${att.color}` } : undefined}
    >
      {att.imageUrl && (
        <a href={att.titleLink || att.fromUrl || att.imageUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={att.imageUrl}
            alt={att.title || ""}
            className="w-full object-cover"
            style={{ maxHeight: 200 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </a>
      )}
      <div className="px-3 py-2">
        {att.serviceName && (
          <div className="flex items-center gap-1.5 mb-1">
            {att.serviceIcon && <img src={att.serviceIcon} alt="" className="h-3.5 w-3.5 rounded" />}
            <span className="text-[10px] font-medium text-muted/50">{att.serviceName}</span>
          </div>
        )}
        {att.title && (
          <a
            href={att.titleLink || att.fromUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[12px] font-semibold text-primary/80 hover:text-primary hover:underline leading-snug"
          >
            {att.title}
          </a>
        )}
        {att.text && (
          <p className="mt-1 text-[11px] leading-relaxed text-foreground/70 line-clamp-3">{att.text}</p>
        )}
        {!att.imageUrl && att.thumbUrl && (
          <img src={att.thumbUrl} alt="" className="mt-1.5 rounded max-h-[80px] object-cover" />
        )}
      </div>
    </div>
  );
}

// ─── Reactions row ──────────────────────────────────────────

function ReactionsRow({ reactions }: { reactions: { name: string; count: number }[] }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {reactions.map((r) => (
        <span
          key={r.name}
          className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-accent/40 px-2 py-0.5 text-[10px] transition-colors hover:bg-accent"
          title={`:${r.name}:`}
        >
          <span>{emojiFromName(r.name)}</span>
          <span className="font-medium text-muted/70">{r.count}</span>
        </span>
      ))}
    </div>
  );
}

const EMOJI_MAP: Record<string, string> = {
  "+1": "\u{1F44D}", thumbsup: "\u{1F44D}", "-1": "\u{1F44E}", thumbsdown: "\u{1F44E}",
  heart: "\u{2764}\u{FE0F}", heart_eyes: "\u{1F60D}", joy: "\u{1F602}", fire: "\u{1F525}",
  rocket: "\u{1F680}", eyes: "\u{1F440}", wave: "\u{1F44B}", pray: "\u{1F64F}",
  clap: "\u{1F44F}", tada: "\u{1F389}", raised_hands: "\u{1F64C}", muscle: "\u{1F4AA}",
  100: "\u{1F4AF}", white_check_mark: "\u{2705}", heavy_check_mark: "\u{2714}\u{FE0F}",
  x: "\u{274C}", question: "\u{2753}", exclamation: "\u{2757}", warning: "\u{26A0}\u{FE0F}",
  bulb: "\u{1F4A1}", star: "\u{2B50}", sparkles: "\u{2728}", zap: "\u{26A1}",
  thinking_face: "\u{1F914}", slightly_smiling_face: "\u{1F642}", grinning: "\u{1F600}",
  sob: "\u{1F62D}", sweat_smile: "\u{1F605}", rolling_on_the_floor_laughing: "\u{1F923}",
  ok_hand: "\u{1F44C}", point_up: "\u{261D}\u{FE0F}", see_no_evil: "\u{1F648}",
  party_popper: "\u{1F389}", confetti_ball: "\u{1F38A}", gem: "\u{1F48E}",
  memo: "\u{1F4DD}", speech_balloon: "\u{1F4AC}", hourglass: "\u{231B}",
  heavy_plus_sign: "\u{2795}", heavy_minus_sign: "\u{2796}",
  large_blue_circle: "\u{1F535}", red_circle: "\u{1F534}", green_heart: "\u{1F49A}",
  blue_heart: "\u{1F499}", purple_heart: "\u{1F49C}", yellow_heart: "\u{1F49B}",
  skull: "\u{1F480}", poop: "\u{1F4A9}", ghost: "\u{1F47B}", alien: "\u{1F47D}",
};

function emojiFromName(name: string): string {
  return EMOJI_MAP[name] || `:${name}:`;
}

export default function SlackPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const {
    isConnected,
    conversations,
    messages,
    loading,
    loadingMessages,
    activeChannelId,
    sending,
    threadReplies,
    loadingThread,
    loadConversations,
    selectChannel,
    sendMessage,
    resolveUserName,
    togglePin,
    loadThreadReplies,
  } = useSlack();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyToTs, setReplyToTs] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const [translatingTs, setTranslatingTs] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, {
    text: string;
    tone?: string;
    suggestions?: { english: string; farsi: string }[];
  }>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const [customDraft, setCustomDraft] = useState<Record<string, string>>({});
  const [polishing, setPolishing] = useState<string | null>(null);
  const [polished, setPolished] = useState<Record<string, { english: string; farsi: string }>>({});

  // Load conversations on mount
  useEffect(() => {
    if (isConnected) {
      loadConversations();
    }
  }, [isConnected, loadConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(dist > 150);
  }, []);

  const filteredConversations = search
    ? conversations.filter(
        (c) =>
          (c.userName || c.name).toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const pinned = filteredConversations.filter((c) => c.pinned);
  const unpinnedDms = filteredConversations.filter((c) => !c.pinned && (c.type === "dm" || c.type === "mpim"));
  const unpinnedChannels = filteredConversations.filter((c) => !c.pinned && (c.type === "channel" || c.type === "group"));

  const activeConv = conversations.find((c) => c.id === activeChannelId);

  const handleTranslate = useCallback(
    async (msg: SlackMessage) => {
      if (translations[msg.ts]) {
        setTranslations((prev) => {
          const next = { ...prev };
          delete next[msg.ts];
          return next;
        });
        return;
      }

      const apiKey = settings.providers[settings.activeProvider]?.apiKey;
      if (!apiKey) {
        toast.error("Set an API key in Settings first");
        return;
      }

      let contextMsgs: SlackMessage[] = [];
      const mainIdx = messages.findIndex((m) => m.ts === msg.ts);
      if (mainIdx >= 0) {
        contextMsgs = messages.slice(Math.max(0, mainIdx - 5), mainIdx + 1);
      } else if (msg.threadTs && threadReplies[msg.threadTs]) {
        const thread = threadReplies[msg.threadTs];
        const parent = messages.find((m) => m.ts === msg.threadTs);
        const allThread = parent ? [parent, ...thread] : thread;
        const replyIdx = allThread.findIndex((m) => m.ts === msg.ts);
        contextMsgs = allThread.slice(Math.max(0, replyIdx - 5), replyIdx + 1);
      }

      const contextText = contextMsgs.length > 1
        ? contextMsgs.map((m) => `${m.userName || m.userId}: ${m.text}`).join("\n") + "\n\n---\nTranslate only the last message above and suggest replies."
        : msg.text;

      setTranslatingTs(msg.ts);
      try {
        const result = await translateDirect({
          provider: settings.activeProvider,
          apiKey,
          modelId: settings.activeModel,
          text: contextText,
          detectTone: settings.autoDetectTone,
        });
        setTranslations((prev) => ({
          ...prev,
          [msg.ts]: {
            text: result.translation || result.translatedText || msg.text,
            tone: result.tone?.sentiment || result.tone?.formality,
            suggestions: result.suggestedResponses || [],
          },
        }));
      } catch (err) {
        console.error("Translation failed:", err);
        toast.error("Translation failed");
      } finally {
        setTranslatingTs(null);
      }
    },
    [translations, settings, toast, messages, threadReplies]
  );

  const handleCopyTranslation = useCallback((ts: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(ts);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handlePolish = useCallback(
    async (msgTs: string, originalText: string) => {
      const draft = customDraft[msgTs]?.trim();
      if (!draft) return;

      const apiKey = settings.providers[settings.activeProvider]?.apiKey;
      if (!apiKey) { toast.error("Set an API key in Settings first"); return; }

      setPolishing(msgTs);
      try {
        const result = await polishReplyDirect({
          provider: settings.activeProvider,
          apiKey,
          modelId: settings.activeModel,
          originalMessage: originalText,
          draft,
        });
        setPolished((prev) => ({ ...prev, [msgTs]: { english: result.polished, farsi: result.farsi } }));
      } catch (err) {
        console.error("Polish failed:", err);
        toast.error("Failed to polish reply");
      } finally {
        setPolishing(null);
      }
    },
    [customDraft, settings, toast]
  );

  // Send reply directly in Slack
  const handleSendReply = useCallback(async () => {
    if (!activeChannelId || !replyText.trim()) return;
    try {
      await sendMessage(activeChannelId, replyText.trim(), replyToTs || undefined);
      setReplyText("");
      setReplyToTs(null);
      toast.success("Sent!");
    } catch {
      toast.error("Failed to send message");
    }
  }, [activeChannelId, replyText, replyToTs, sendMessage, toast]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex h-full flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
          <div className="animate-fade-in flex flex-col items-center">
            <div className="relative mb-6 inline-block">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-surface-hover">
                <Hash size={32} className="text-primary/60" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Connect Slack
            </h3>
            <p className="mb-6 max-w-[300px] text-sm text-muted">
              Add your Slack OAuth token in Settings to browse DMs and channels directly in lii.
            </p>
            <button
              onClick={() => router.push("/settings")}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
            >
              <Settings size={16} />
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Conversation list */}
        <div className="flex h-full w-72 shrink-0 flex-col border-r border-border-subtle bg-card">
          {/* Search */}
          <div className="border-b border-border-subtle px-3 py-2.5">
            <div className="relative">
              <Search
                size={13}
                className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted/50"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs placeholder-muted focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto chat-scroll">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-muted" />
              </div>
            ) : (
              <>
                {/* Pinned section */}
                {pinned.length > 0 && (
                  <div className="px-2 pt-3">
                    <p className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-muted/50 uppercase">
                      Pinned
                    </p>
                    {pinned.map((conv) => {
                      const Icon = getConversationIcon(conv.type);
                      const isActive = conv.id === activeChannelId;
                      return (
                        <div key={conv.id} className="group/item relative">
                          <button
                            onClick={() => selectChannel(conv.id)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
                              isActive
                                ? "bg-primary-muted sidebar-active-indicator"
                                : "hover:bg-surface-hover"
                            )}
                          >
                            {conv.type === "mpim" && conv.memberAvatars && conv.memberAvatars.length > 1 ? (
                              <AvatarStack urls={conv.memberAvatars} size={28} />
                            ) : conv.avatarUrl ? (
                              <img
                                src={conv.avatarUrl}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-muted">
                                <Icon size={14} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className={cn("block truncate text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>
                                {conv.type === "channel" || conv.type === "group" ? `#${conv.name}` : (conv.userName || conv.name)}
                              </span>
                              {conv.lastMessage && (
                                <span className="block truncate text-[10px] text-muted/50 mt-0.5">
                                  {conv.lastMessage}
                                </span>
                              )}
                            </div>
                            {conv.lastTimestamp && (
                              <span className="shrink-0 text-[9px] text-muted/40">
                                {getTimeLabel(conv.lastTimestamp)}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                            className="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 rounded-md p-1 text-muted/40 hover:text-danger hover:bg-accent transition-all"
                            title="Unpin"
                          >
                            <PinOff size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* DMs section */}
                {unpinnedDms.length > 0 && (
                  <div className="px-2 pt-3">
                    <p className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-muted/50 uppercase">
                      Direct Messages
                    </p>
                    {unpinnedDms.map((conv) => {
                      const Icon = getConversationIcon(conv.type);
                      const isActive = conv.id === activeChannelId;
                      return (
                        <div key={conv.id} className="group/item relative">
                          <button
                            onClick={() => selectChannel(conv.id)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
                              isActive
                                ? "bg-primary-muted sidebar-active-indicator"
                                : "hover:bg-surface-hover"
                            )}
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-muted">
                              <Icon size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={cn("block truncate text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>
                                {conv.userName || conv.name}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                            className="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 rounded-md p-1 text-muted/40 hover:text-primary hover:bg-accent transition-all"
                            title="Pin"
                          >
                            <Pin size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Channels section */}
                {unpinnedChannels.length > 0 && (
                  <div className="px-2 pt-3">
                    <p className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-muted/50 uppercase">
                      Channels
                    </p>
                    {unpinnedChannels.map((conv) => {
                      const isActive = conv.id === activeChannelId;
                      return (
                        <div key={conv.id} className="group/item relative">
                          <button
                            onClick={() => selectChannel(conv.id)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
                              isActive
                                ? "bg-primary-muted sidebar-active-indicator"
                                : "hover:bg-surface-hover"
                            )}
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-muted">
                              <Hash size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={cn("block truncate text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>
                                #{conv.name}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                            className="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 rounded-md p-1 text-muted/40 hover:text-primary hover:bg-accent transition-all"
                            title="Pin"
                          >
                            <Pin size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredConversations.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageCircle size={24} className="mb-2 text-muted/30" />
                    <p className="text-xs text-muted/50">
                      {search ? "No matches" : "No conversations"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right panel — Messages */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border-subtle bg-card/50 px-4 py-3 backdrop-blur-sm">
                {activeConv.type === "mpim" && activeConv.memberAvatars && activeConv.memberAvatars.length > 1 ? (
                  <AvatarStack urls={activeConv.memberAvatars} size={32} />
                ) : activeConv.avatarUrl ? (
                  <img src={activeConv.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : activeConv.type === "dm" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-muted"><User size={15} /></div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-muted"><Hash size={15} /></div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {activeConv.type === "channel" || activeConv.type === "group"
                      ? `#${activeConv.name}`
                      : activeConv.userName || activeConv.name}
                  </span>
                  {activeConv.type === "mpim" && (
                    <span className="block truncate text-[10px] text-muted/50">Group message</span>
                  )}
                </div>
                {messages.length > 0 && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-muted/50">
                    {messages.length} messages
                  </span>
                )}
              </div>

              {/* Messages */}
              <main
                ref={scrollRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-y-auto bg-background chat-scroll"
              >
                <div className="mx-auto max-w-3xl px-4 py-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="animate-spin text-muted" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-muted/50">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const prev = i > 0 ? messages[i - 1] : null;
                      const isSameUser = prev?.userId === msg.userId;
                      const isCloseInTime = prev && (msg.timestamp - prev.timestamp) < 5 * 60 * 1000;
                      const grouped = isSameUser && isCloseInTime;

                      const prevDate = prev ? new Date(prev.timestamp).toDateString() : null;
                      const curDate = new Date(msg.timestamp).toDateString();
                      const showDateSep = prevDate !== curDate;

                      return (
                        <div key={msg.ts}>
                          {showDateSep && (
                            <div className="my-4 flex items-center gap-3">
                              <div className="h-px flex-1 bg-border-subtle" />
                              <span className="text-[10px] font-medium text-muted/40">{getDateSeparator(msg.timestamp)}</span>
                              <div className="h-px flex-1 bg-border-subtle" />
                            </div>
                          )}

                          <div className={cn(
                            "group relative flex items-start gap-3 rounded-lg px-3 transition-colors hover:bg-surface-hover",
                            grouped ? "py-0.5" : "pt-3 pb-1",
                            !grouped && i > 0 && !showDateSep && "mt-1"
                          )}>
                            {grouped ? (
                              <div className="w-9 shrink-0 flex items-center justify-center">
                                <span className="text-[9px] text-transparent group-hover:text-muted/40 transition-colors select-none">
                                  {getMsgTime(msg.timestamp)}
                                </span>
                              </div>
                            ) : msg.avatarUrl ? (
                              <img
                                src={msg.avatarUrl}
                                alt=""
                                className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-muted">
                                {(msg.userName || msg.userId).charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              {!grouped && (
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[13px] font-semibold text-foreground">
                                    {msg.userName || msg.userId}
                                  </span>
                                  <span className="text-[10px] text-muted/40">
                                    {getMsgTime(msg.timestamp)}
                                  </span>
                                </div>
                              )}
                              <div
                                dir="auto"
                                className={cn(
                                  "text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap break-words",
                                  !grouped && "mt-0.5"
                                )}
                              >
                                <RichText text={msg.text} />
                              </div>

                              {/* Files */}
                              {msg.files && msg.files.length > 0 && (
                                <div className="space-y-1">
                                  {msg.files.map((f) => (
                                    <FilePreview key={f.id} file={f} token={settings.slack?.token || ""} />
                                  ))}
                                </div>
                              )}

                              {/* Attachments / link unfurls */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="space-y-1">
                                  {msg.attachments.map((att, ai) => (
                                    <AttachmentCard key={ai} att={att} />
                                  ))}
                                </div>
                              )}

                              {/* Reactions */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <ReactionsRow reactions={msg.reactions} />
                              )}

                              {/* Thread button */}
                              {(msg.replyCount ?? 0) > 0 && !msg.isThread && activeChannelId && (
                                <button
                                  onClick={() => loadThreadReplies(activeChannelId, msg.ts)}
                                  className="mt-1.5 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-primary/70 hover:bg-primary-muted hover:text-primary transition-colors"
                                >
                                  {loadingThread === msg.ts ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <MessageSquare size={12} />
                                  )}
                                  {threadReplies[msg.ts]
                                    ? "Hide replies"
                                    : `${msg.replyCount} ${msg.replyCount === 1 ? "reply" : "replies"}`}
                                </button>
                              )}

                              {/* Inline translation popover */}
                              {translatingTs === msg.ts && (
                                <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2">
                                  <Loader2 size={13} className="animate-spin text-primary" />
                                  <span className="text-[11px] text-muted">Translating…</span>
                                </div>
                              )}
                              {translations[msg.ts] && (
                                <div className="mt-2 space-y-2">
                                  {/* Translation card */}
                                  <div className="rounded-lg border border-primary/15 bg-primary/[0.03] px-3 py-2.5">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Languages size={11} className="text-primary/60" />
                                        <span className="text-[10px] font-medium text-primary/60">Translation</span>
                                        {translations[msg.ts].tone && (
                                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary/70">{translations[msg.ts].tone}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          onClick={() => handleCopyTranslation(msg.ts, translations[msg.ts].text)}
                                          className="rounded-md p-1 text-muted/40 hover:text-foreground hover:bg-accent transition-colors"
                                          title="Copy translation"
                                        >
                                          {copied === msg.ts ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                                        </button>
                                        <button
                                          onClick={() => setTranslations((prev) => { const n = { ...prev }; delete n[msg.ts]; return n; })}
                                          className="rounded-md p-1 text-muted/40 hover:text-foreground hover:bg-accent transition-colors"
                                          title="Close"
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                    </div>
                                    <p dir="auto" className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">{translations[msg.ts].text}</p>
                                  </div>

                                  {/* Suggested replies + custom */}
                                  <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] px-3 py-2.5">
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <Send size={11} className="text-emerald-600/60" />
                                      <span className="text-[10px] font-medium text-emerald-600/60">Suggested Replies</span>
                                    </div>
                                    <div className="space-y-2">
                                      {translations[msg.ts].suggestions?.map((s, si) => (
                                        <div
                                          key={si}
                                          className="group/sug flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-emerald-500/10 hover:bg-emerald-500/[0.04]"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[12px] leading-relaxed text-foreground/85">{s.english}</p>
                                            <p dir="rtl" className="mt-0.5 text-[11px] leading-relaxed text-muted/60">{s.farsi}</p>
                                          </div>
                                          <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-0 group-hover/sug:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => handleCopyTranslation(`sug-${msg.ts}-${si}`, s.english)}
                                              className="rounded p-1 text-muted/40 hover:text-foreground hover:bg-accent transition-colors"
                                              title="Copy English reply"
                                            >
                                              {copied === `sug-${msg.ts}-${si}` ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                                            </button>
                                            <button
                                              onClick={() => { setReplyText(s.english); }}
                                              className="rounded p-1 text-muted/40 hover:text-emerald-600 hover:bg-accent transition-colors"
                                              title="Use as reply"
                                            >
                                              <ArrowUpRight size={10} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Custom reply input */}
                                      <div className="mt-1 border-t border-emerald-500/10 pt-2">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                          <Sparkles size={10} className="text-amber-500/70" />
                                          <span className="text-[10px] font-medium text-amber-600/60">Write your own</span>
                                          <span className="text-[9px] text-muted/40">Farsi · Finglish · English</span>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                          <input
                                            dir="auto"
                                            value={customDraft[msg.ts] || ""}
                                            onChange={(e) => setCustomDraft((p) => ({ ...p, [msg.ts]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePolish(msg.ts, msg.text); } }}
                                            placeholder="benevis… / type here…"
                                            className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10"
                                          />
                                          <button
                                            onClick={() => handlePolish(msg.ts, msg.text)}
                                            disabled={!customDraft[msg.ts]?.trim() || polishing === msg.ts}
                                            className="flex h-[30px] items-center gap-1 rounded-md bg-amber-500 px-2.5 text-[10px] font-medium text-white transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                          >
                                            {polishing === msg.ts ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                                            Polish
                                          </button>
                                        </div>
                                        {polished[msg.ts] && (
                                          <div className="mt-2 rounded-md border border-amber-500/15 bg-amber-500/[0.04] px-2.5 py-2">
                                            <div className="flex items-start gap-2">
                                              <div className="min-w-0 flex-1">
                                                <p className="text-[12px] leading-relaxed text-foreground/90">{polished[msg.ts].english}</p>
                                                <p dir="rtl" className="mt-1 text-[11px] leading-relaxed text-muted/60">{polished[msg.ts].farsi}</p>
                                              </div>
                                              <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                                                <button
                                                  onClick={() => handleCopyTranslation(`pol-${msg.ts}`, polished[msg.ts].english)}
                                                  className="rounded p-1 text-muted/40 hover:text-foreground hover:bg-accent transition-colors"
                                                  title="Copy English"
                                                >
                                                  {copied === `pol-${msg.ts}` ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                                                </button>
                                                <button
                                                  onClick={() => setReplyText(polished[msg.ts].english)}
                                                  className="rounded p-1 text-muted/40 hover:text-amber-600 hover:bg-accent transition-colors"
                                                  title="Use as reply"
                                                >
                                                  <ArrowUpRight size={10} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className={cn(
                              "absolute -top-3 right-2 flex gap-0.5 rounded-lg border border-border-subtle bg-card px-1 py-0.5 shadow-sm opacity-0 transition-opacity z-10",
                              translations[msg.ts] ? "opacity-100" : "group-hover:opacity-100"
                            )}>
                              <button
                                onClick={() => handleTranslate(msg)}
                                disabled={translatingTs === msg.ts}
                                className={cn(
                                  "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                                  translations[msg.ts]
                                    ? "text-primary bg-primary/10"
                                    : "text-muted hover:bg-accent hover:text-foreground"
                                )}
                                title={translations[msg.ts] ? "Hide translation" : "Translate"}
                              >
                                {translatingTs === msg.ts ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Languages size={12} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Thread replies inline */}
                          {threadReplies[msg.ts] && threadReplies[msg.ts].length > 0 && (
                            <div className="ml-12 border-l-2 border-primary/15 pl-3 mb-1">
                              {threadReplies[msg.ts].map((reply) => (
                                <div
                                  key={reply.ts}
                                  className="group/reply relative flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
                                >
                                  {reply.avatarUrl ? (
                                    <img src={reply.avatarUrl} alt="" className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover" />
                                  ) : (
                                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-muted">
                                      {(reply.userName || reply.userId).charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-[12px] font-semibold text-foreground">
                                        {reply.userName || reply.userId}
                                      </span>
                                      <span className="text-[9px] text-muted/40">
                                        {getMsgTime(reply.timestamp)}
                                      </span>
                                    </div>
                                    <div dir="auto" className="mt-0.5 text-[12px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                                      <RichText text={reply.text} />
                                    </div>

                                    {/* Reply files */}
                                    {reply.files && reply.files.length > 0 && (
                                      <div className="space-y-1">
                                        {reply.files.map((f) => (
                                          <FilePreview key={f.id} file={f} token={settings.slack?.token || ""} />
                                        ))}
                                      </div>
                                    )}

                                    {/* Reply attachments */}
                                    {reply.attachments && reply.attachments.length > 0 && (
                                      <div className="space-y-1">
                                        {reply.attachments.map((att, ai) => (
                                          <AttachmentCard key={ai} att={att} />
                                        ))}
                                      </div>
                                    )}

                                    {/* Reply reactions */}
                                    {reply.reactions && reply.reactions.length > 0 && (
                                      <ReactionsRow reactions={reply.reactions} />
                                    )}

                                    {/* Reply translation */}
                                    {translatingTs === reply.ts && (
                                      <div className="mt-1.5 flex items-center gap-2 rounded-md bg-accent/50 px-2.5 py-1.5">
                                        <Loader2 size={11} className="animate-spin text-primary" />
                                        <span className="text-[10px] text-muted">Translating…</span>
                                      </div>
                                    )}
                                    {translations[reply.ts] && (
                                      <div className="mt-1.5 space-y-1.5">
                                        <div className="rounded-md border border-primary/15 bg-primary/[0.03] px-2.5 py-2">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                              <Languages size={10} className="text-primary/60" />
                                              <span className="text-[9px] font-medium text-primary/60">Translation</span>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                              <button
                                                onClick={() => handleCopyTranslation(reply.ts, translations[reply.ts].text)}
                                                className="rounded p-0.5 text-muted/40 hover:text-foreground transition-colors"
                                              >
                                                {copied === reply.ts ? <Check size={9} className="text-green-500" /> : <Copy size={9} />}
                                              </button>
                                              <button
                                                onClick={() => setTranslations((prev) => { const n = { ...prev }; delete n[reply.ts]; return n; })}
                                                className="rounded p-0.5 text-muted/40 hover:text-foreground transition-colors"
                                              >
                                                <X size={9} />
                                              </button>
                                            </div>
                                          </div>
                                          <p dir="auto" className="text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap">{translations[reply.ts].text}</p>
                                        </div>
                                        <div className="rounded-md border border-emerald-500/15 bg-emerald-500/[0.03] px-2.5 py-2">
                                          <div className="flex items-center gap-1 mb-1.5">
                                            <Send size={9} className="text-emerald-600/60" />
                                            <span className="text-[9px] font-medium text-emerald-600/60">Suggested Replies</span>
                                          </div>
                                          <div className="space-y-1.5">
                                            {translations[reply.ts].suggestions?.map((s, si) => (
                                              <div key={si} className="group/sug flex items-start gap-1.5 rounded px-1.5 py-1 hover:bg-emerald-500/[0.04] transition-colors">
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-[11px] leading-relaxed text-foreground/85">{s.english}</p>
                                                  <p dir="rtl" className="mt-0.5 text-[10px] leading-relaxed text-muted/60">{s.farsi}</p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-0 group-hover/sug:opacity-100 transition-opacity">
                                                  <button
                                                    onClick={() => handleCopyTranslation(`sug-${reply.ts}-${si}`, s.english)}
                                                    className="rounded p-0.5 text-muted/40 hover:text-foreground transition-colors"
                                                    title="Copy English"
                                                  >
                                                    {copied === `sug-${reply.ts}-${si}` ? <Check size={9} className="text-green-500" /> : <Copy size={9} />}
                                                  </button>
                                                  <button
                                                    onClick={() => setReplyText(s.english)}
                                                    className="rounded p-0.5 text-muted/40 hover:text-emerald-600 transition-colors"
                                                    title="Use as reply"
                                                  >
                                                    <ArrowUpRight size={9} />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}

                                            {/* Custom reply for thread replies */}
                                            <div className="mt-1 border-t border-emerald-500/10 pt-1.5">
                                              <div className="flex items-center gap-1 mb-1">
                                                <Sparkles size={9} className="text-amber-500/70" />
                                                <span className="text-[9px] font-medium text-amber-600/60">Write your own</span>
                                              </div>
                                              <div className="flex items-end gap-1">
                                                <input
                                                  dir="auto"
                                                  value={customDraft[reply.ts] || ""}
                                                  onChange={(e) => setCustomDraft((p) => ({ ...p, [reply.ts]: e.target.value }))}
                                                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePolish(reply.ts, reply.text); } }}
                                                  placeholder="benevis…"
                                                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-amber-500/40"
                                                />
                                                <button
                                                  onClick={() => handlePolish(reply.ts, reply.text)}
                                                  disabled={!customDraft[reply.ts]?.trim() || polishing === reply.ts}
                                                  className="flex h-[26px] items-center gap-1 rounded bg-amber-500 px-2 text-[9px] font-medium text-white hover:bg-amber-600 active:scale-95 disabled:opacity-40"
                                                >
                                                  {polishing === reply.ts ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                                                  Polish
                                                </button>
                                              </div>
                                              {polished[reply.ts] && (
                                                <div className="mt-1.5 rounded border border-amber-500/15 bg-amber-500/[0.04] px-2 py-1.5">
                                                  <div className="flex items-start gap-1.5">
                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-[11px] leading-relaxed text-foreground/90">{polished[reply.ts].english}</p>
                                                      <p dir="rtl" className="mt-0.5 text-[10px] leading-relaxed text-muted/60">{polished[reply.ts].farsi}</p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                                                      <button
                                                        onClick={() => handleCopyTranslation(`pol-${reply.ts}`, polished[reply.ts].english)}
                                                        className="rounded p-0.5 text-muted/40 hover:text-foreground transition-colors"
                                                      >
                                                        {copied === `pol-${reply.ts}` ? <Check size={9} className="text-green-500" /> : <Copy size={9} />}
                                                      </button>
                                                      <button
                                                        onClick={() => setReplyText(polished[reply.ts].english)}
                                                        className="rounded p-0.5 text-muted/40 hover:text-amber-600 transition-colors"
                                                      >
                                                        <ArrowUpRight size={9} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className={cn(
                                    "absolute -top-2 right-1 flex gap-0.5 rounded-md border border-border-subtle bg-card px-1 py-0.5 shadow-sm opacity-0 transition-opacity z-10",
                                    translations[reply.ts] ? "opacity-100" : "group-hover/reply:opacity-100"
                                  )}>
                                    <button
                                      onClick={() => handleTranslate(reply)}
                                      disabled={translatingTs === reply.ts}
                                      className={cn(
                                        "flex items-center rounded-md px-1.5 py-0.5 text-[9px] transition-colors",
                                        translations[reply.ts]
                                          ? "text-primary bg-primary/10"
                                          : "text-muted hover:bg-accent hover:text-foreground"
                                      )}
                                      title={translations[reply.ts] ? "Hide translation" : "Translate"}
                                    >
                                      {translatingTs === reply.ts ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        <Languages size={10} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollBtn && (
                  <button
                    onClick={() =>
                      messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                    className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 animate-fade-in rounded-full border border-border bg-card p-2 shadow-md transition-all hover:bg-surface-hover active:scale-95"
                  >
                    <ChevronDown size={16} className="text-muted" />
                  </button>
                )}
              </main>

              {/* Quick reply input */}
              <div className="border-t border-border-subtle bg-background px-4 py-2.5">
                <div className="flex items-end gap-2">
                  <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Reply in Slack…"
                      dir="auto"
                      rows={1}
                      className="w-full resize-none border-0 bg-transparent px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted/40 focus:outline-none"
                      style={{ maxHeight: 100 }}
                    />
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Send to Slack"
                  >
                    {sending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No channel selected */
            <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
              <div className="animate-fade-in flex flex-col items-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-surface-hover">
                  <Hash size={26} className="text-muted/40" />
                </div>
                <p className="text-sm font-medium text-muted/60">
                  Select a conversation
                </p>
                <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-muted/40">
                  Choose a DM or channel to browse messages and translate them
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
