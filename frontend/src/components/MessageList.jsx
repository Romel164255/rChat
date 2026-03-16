import { useEffect, useRef, useState, useCallback } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";

/* ─── Helpers ─────────────────────────────────── */
function getMyId() {
  try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id; } catch { return null; }
}

function timeFmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso) {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

/* ─── Status Ticks ────────────────────────────── */
function StatusTick({ status }) {
  if (status === "read") return (
    <span title="Read">
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M1 5l3 3L10 1" stroke="#4dd8ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 5l3 3L15 1" stroke="#4dd8ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
  if (status === "delivered") return (
    <span title="Delivered">
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M1 5l3 3L10 1" stroke="#6a849e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 5l3 3L15 1" stroke="#6a849e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
  return (
    <span title="Sent">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 5l3 3L9 1" stroke="#6a849e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

/* ─── Sender color for group ─────────────────── */
function getSenderColor(senderId) {
  const hue = [...(senderId || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 70%, 68%)`;
}

/* ─── Message Bubble ────────────────────────────── */
function MessageBubble({ msg, mine, showSender, isFirst, isLast, isGroup }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: mine ? "flex-end" : "flex-start",
        marginBottom: isLast ? 6 : 2,
        paddingLeft: mine ? 60 : 0,
        paddingRight: mine ? 0 : 60,
        animation: "msgPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}
    >
      <div style={{
        ...s.bubble,
        background: mine ? "var(--bg-bubble-me)" : "var(--bg-bubble-them)",
        backgroundImage: mine ? "var(--bg-bubble-me)" : "none",
        borderRadius: mine
          ? `${isFirst ? "var(--radius-bubble)" : "6px"} 4px var(--radius-bubble) var(--radius-bubble)`
          : `4px ${isFirst ? "var(--radius-bubble)" : "6px"} var(--radius-bubble) var(--radius-bubble)`,
        boxShadow: mine ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.2)",
      }}>
        {/* Group sender name */}
        {!mine && isGroup && isFirst && msg.sender_name && (
          <div style={{ ...s.senderName, color: getSenderColor(msg.sender_id) }}>
            {msg.sender_name}
          </div>
        )}

        {msg.content?.startsWith("audio:") ? (
          <audio
            controls
            src={msg.content.slice(6)}
            style={s.audio}
          />
        ) : (
          <p style={s.text}>{msg.content}</p>
        )}

        <div style={s.meta}>
          <span style={s.time}>{timeFmt(msg.created_at)}</span>
          {mine && <StatusTick status={msg.status} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Main MessageList ──────────────────────── */
export default function MessageList({ conversationId, isGroup }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const listRef = useRef(null);
  const myId = getMyId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/messages/${conversationId}?limit=40`);
      setMessages(r.data);
      setHasMore(r.data.length === 40);
    } catch {} finally { setLoading(false); }
  }, [conversationId]);

  useEffect(() => {
    setMessages([]); setTypingUsers([]); setHasMore(true);
    load();
  }, [load]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Load more (infinite scroll up)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0]?.created_at;
    try {
      const r = await api.get(`/messages/${conversationId}?limit=40&before=${encodeURIComponent(oldest)}`);
      if (r.data.length === 0) { setHasMore(false); return; }
      // Preserve scroll position
      const list = listRef.current;
      const prevHeight = list?.scrollHeight ?? 0;
      setMessages(prev => [...r.data, ...prev]);
      requestAnimationFrame(() => {
        if (list) list.scrollTop = list.scrollHeight - prevHeight;
      });
      setHasMore(r.data.length === 40);
    } catch {} finally { setLoadingMore(false); }
  }, [conversationId, messages, loadingMore, hasMore]);

  // Scroll listener for infinite load
  useEffect(() => {
    const el = listRef.current; if (!el) return;
    const fn = () => { if (el.scrollTop < 80) loadMore(); };
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, [loadMore]);

  // Socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit("join_conversation", conversationId);

    function onMsg(data) {
      if (data.conversation_id !== conversationId) return;
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
    }

    function onSent(e) {
      const data = e.detail;
      if (data.conversation_id !== conversationId) return;
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
    }

    function onTyping({ conversationId: cid, userId, isTyping }) {
      if (cid !== conversationId || userId === myId) return;
      setTypingUsers(prev =>
        isTyping ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId)
      );
    }

    function onRead({ message_id }) {
      setMessages(prev => prev.map(m => m.id === message_id ? { ...m, status: "read" } : m));
    }
    function onDelivered({ message_id }) {
      setMessages(prev => prev.map(m => m.id === message_id ? { ...m, status: "delivered" } : m));
    }

    socket.on("receive_message", onMsg);
    socket.on("user_typing", onTyping);
    socket.on("message_read", onRead);
    socket.on("message_delivered", onDelivered);
    window.addEventListener("chatty:message_sent", onSent);

    return () => {
      socket.off("receive_message", onMsg);
      socket.off("user_typing", onTyping);
      socket.off("message_read", onRead);
      socket.off("message_delivered", onDelivered);
      window.removeEventListener("chatty:message_sent", onSent);
      socket.emit("leave_conversation", conversationId);
    };
  }, [conversationId, myId]);

  if (loading) return (
    <div style={s.loading}>
      <div style={s.loadingDots}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ ...s.loadingDot, animationDelay: `${i * 0.15}s` }} className="typing-dot" />
        ))}
      </div>
    </div>
  );

  // Group messages by date
  const groups = [];
  let lastDate = null;
  messages.forEach(m => {
    const d = new Date(m.created_at).toDateString();
    if (d !== lastDate) {
      groups.push({ type: "date", label: formatDateLabel(m.created_at), key: `date-${d}` });
      lastDate = d;
    }
    groups.push({ type: "msg", ...m });
  });

  return (
    <div ref={listRef} style={s.list} className="chat-bg">
      {/* Load more indicator */}
      {loadingMore && (
        <div style={s.loadMore}>
          <div style={{ display: "flex", gap: 5 }}>
            {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i*0.15}s` }}/>)}
          </div>
        </div>
      )}

      {messages.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyBubble}>👋 Say hello!</div>
        </div>
      )}

      {groups.map((item, i) => {
        if (item.type === "date") return (
          <div key={item.key} style={s.dateDivider}>
            <span style={s.dateLabel}>{item.label}</span>
          </div>
        );

        const mine = item.sender_id === myId;
        const prev = groups[i - 1];
        const next = groups[i + 1];
        const isFirst = !prev || prev.type === "date" || prev.sender_id !== item.sender_id;
        const isLast = !next || next.type === "date" || next.sender_id !== item.sender_id;

        return (
          <MessageBubble
            key={item.id}
            msg={item}
            mine={mine}
            showSender={!mine && isGroup && isFirst}
            isFirst={isFirst}
            isLast={isLast}
            isGroup={isGroup}
          />
        );
      })}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ display: "flex", marginBottom: 6 }}>
          <div style={{ ...s.bubble, background: "var(--bg-bubble-them)", padding: "10px 14px", borderRadius: "4px var(--radius-bubble) var(--radius-bubble) var(--radius-bubble)" }}>
            <div style={s.typingWrap}>
              {[0, 1, 2].map(i => (
                <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

const s = {
  list: {
    flex: 1, overflowY: "auto", padding: "16px 16px 8px",
    display: "flex", flexDirection: "column", gap: 0,
  },
  loading: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  loadingDots: { display: "flex", gap: 6 },
  loadingDot: { width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)" },
  loadMore: { display: "flex", justifyContent: "center", padding: "8px 0 4px", gap: 5 },
  empty: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyBubble: {
    background: "var(--bg-bubble-them)", padding: "10px 20px",
    borderRadius: 20, fontSize: 14, color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  },
  dateDivider: { display: "flex", justifyContent: "center", margin: "14px 0" },
  dateLabel: {
    fontSize: 11.5, color: "var(--text-muted)",
    background: "rgba(10,14,22,0.85)",
    padding: "4px 14px", borderRadius: 12,
    border: "1px solid var(--border)", backdropFilter: "blur(8px)",
  },
  bubble: { padding: "7px 10px 4px", wordBreak: "break-word", maxWidth: "100%" },
  senderName: { fontSize: 11.5, fontWeight: 700, marginBottom: 3, letterSpacing: "0.01em" },
  text: { fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)", whiteSpace: "pre-wrap" },
  audio: { display: "block", width: 240, maxWidth: "100%", marginTop: 2, accentColor: "var(--accent)" },
  meta: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, marginTop: 3 },
  time: { fontSize: 10.5, color: "var(--text-muted)" },
  typingWrap: { display: "flex", gap: 4, alignItems: "center", height: 16 },
};
