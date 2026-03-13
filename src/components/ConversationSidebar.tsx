"use client";
import { useState } from "react";
import {
  MessageSquarePlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { Conversation, Contact } from "@/types";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  contacts: Contact[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onSearch?: (query: string) => void;
}

function getInitial(title: string) {
  return title.charAt(0).toUpperCase();
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

export default function ConversationSidebar({
  conversations,
  activeId,
  contacts,
  onSelect,
  onCreate,
  onDelete,
  onSearch,
}: ConversationSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onSearch?.(val);
  };

  // Collapsed sidebar
  if (!expanded) {
    return (
      <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-border-subtle bg-card py-3 gap-2">
        <button
          onClick={() => setExpanded(true)}
          className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onCreate}
          className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground transition-colors"
          title="New chat"
        >
          <MessageSquarePlus size={16} />
        </button>
        <div className="my-1 h-px w-6 bg-border-subtle" />
        {/* Mini avatars */}
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1">
          {conversations.slice(0, 20).map((conv) => {
            const contact = conv.contactId
              ? contactMap.get(conv.contactId)
              : null;
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                  isActive
                    ? "bg-primary text-white ring-2 ring-primary/30"
                    : "bg-accent text-muted hover:bg-primary-muted hover:text-primary"
                )}
                title={conv.title}
                style={
                  contact
                    ? { backgroundColor: isActive ? undefined : contact.avatarColor, color: isActive ? undefined : "white" }
                    : {}
                }
              >
                {contact ? contact.name[0].toUpperCase() : getInitial(conv.title)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Expanded sidebar
  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-border-subtle bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-3">
        <button
          onClick={() => setExpanded(false)}
          className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-foreground transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="flex-1 text-sm font-semibold text-foreground">Chats</h2>
        <button
          onClick={onCreate}
          className="rounded-lg p-1.5 text-muted hover:bg-accent hover:text-foreground transition-colors"
          title="New chat"
        >
          <MessageSquarePlus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted/50"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search chats…"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs placeholder-muted focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle size={24} className="mb-2 text-muted/30" />
            <p className="text-xs text-muted/50">No chats yet</p>
          </div>
        ) : (
          <div className="px-1.5 py-1">
            {conversations.map((conv) => {
              const contact = conv.contactId
                ? contactMap.get(conv.contactId)
                : null;
              const isActive = conv.id === activeId;
              const isHovered = hoveredId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
                    isActive
                      ? "bg-primary-muted sidebar-active-indicator"
                      : "hover:bg-surface-hover"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{
                      backgroundColor: contact
                        ? contact.avatarColor
                        : "var(--muted)",
                    }}
                  >
                    {contact
                      ? contact.name[0].toUpperCase()
                      : getInitial(conv.title)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          "truncate text-xs font-medium",
                          isActive ? "text-primary" : "text-foreground"
                        )}
                      >
                        {contact ? contact.name : conv.title}
                      </span>
                      <div className="ml-auto flex shrink-0 items-center gap-1.5">
                        {conv.messageCount > 0 && !isActive && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-muted px-1 text-[9px] font-bold text-primary">
                            {conv.messageCount}
                          </span>
                        )}
                        <span className="text-[10px] text-muted/50">
                          {getTimeLabel(conv.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <p dir="auto" className="mt-0.5 truncate text-[11px] text-muted/60">
                      {conv.lastMessagePreview || "No messages yet"}
                    </p>
                  </div>

                  {/* Delete on hover */}
                  {isHovered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="mt-1 shrink-0 rounded p-1 text-muted/40 hover:bg-danger-light hover:text-danger transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
