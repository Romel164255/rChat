import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import SearchUsers from "./SearchUsers";

export default function Sidebar({ activeConversationId, setActiveConversation, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh conversation list when a new message arrives on any conversation
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNewMessage() {
      loadConversations();
    }

    socket.on("receive_message", handleNewMessage);
    return () => socket.off("receive_message", handleNewMessage);
  }, [loadConversations]);

  function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.appName}>Chatty</span>
        <button style={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* Search */}
      <SearchUsers reload={loadConversations} setActiveConversation={setActiveConversation} />

      {/* Conversation list */}
      <div style={styles.list}>
        {loading && <p style={styles.hint}>Loading…</p>}

        {!loading && conversations.length === 0 && (
          <p style={styles.hint}>No conversations yet. Search for a user to start chatting.</p>
        )}

        {conversations.map((c) => {
          const isActive = c.id === activeConversationId;
          return (
            <div
              key={c.id}
              onClick={() => setActiveConversation(c.id)}
              style={{
                ...styles.convoItem,
                background: isActive ? "#e8f0fe" : "transparent",
              }}
            >
              <div style={styles.convoTop}>
                <span style={styles.convoTitle}>{c.title || "Direct Chat"}</span>
                <span style={styles.convoTime}>{formatTime(c.last_message_time)}</span>
              </div>
              <div style={styles.convoBottom}>
                <span style={styles.convoPreview}>
                  {c.last_message || "No messages yet"}
                </span>
                {c.unread_count > 0 && (
                  <span style={styles.badge}>{c.unread_count}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 300,
    minWidth: 300,
    background: "#fff",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
  },
  appName: { fontSize: 18, fontWeight: 700, color: "#1d4ed8" },
  logoutBtn: {
    fontSize: 12,
    padding: "4px 10px",
    border: "1px solid #ddd",
    borderRadius: 6,
    cursor: "pointer",
    background: "none",
    color: "#555",
  },
  list: { flex: 1, overflowY: "auto" },
  hint: { padding: "16px", fontSize: 13, color: "#888", lineHeight: 1.5 },
  convoItem: {
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.1s",
  },
  convoTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  convoTitle: { fontWeight: 600, fontSize: 14, color: "#111" },
  convoTime: { fontSize: 11, color: "#9ca3af" },
  convoBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 3,
  },
  convoPreview: {
    fontSize: 13,
    color: "#6b7280",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 190,
  },
  badge: {
    background: "#2563eb",
    color: "#fff",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    padding: "1px 6px",
    minWidth: 18,
    textAlign: "center",
  },
};
