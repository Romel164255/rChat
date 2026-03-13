import { useEffect, useRef, useState, useCallback } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";

// Decode user id from JWT stored in localStorage (without a library)
function getMyUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
}

export default function MessageList({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const myId = getMyUserId();

  // Scroll to bottom whenever messages change
  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Load initial messages from REST API
  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/${conversationId}`);
      // API already returns oldest-first after the fix
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setMessages([]);
    setTypingUsers([]);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket: join room and listen for real-time events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit("join_conversation", conversationId);

    // receive_message comes from OTHER users only (server uses socket.to())
    // so no duplicate risk for the sender
    function handleReceiveMessage(data) {
      if (data.conversation_id === conversationId) {
        setMessages((prev) => {
          // Guard against duplicates (e.g. re-subscription)
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    }

    function handleTyping({ userId, isTyping }) {
      if (userId === myId) return;
      setTypingUsers((prev) =>
        isTyping
          ? prev.includes(userId) ? prev : [...prev, userId]
          : prev.filter((id) => id !== userId)
      );
    }

    // Local event for messages sent by THIS user (avoids duplicate from socket relay)
    function handleSentMessage(e) {
      const data = e.detail;
      if (data.conversation_id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    }

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_typing", handleTyping);
    window.addEventListener("chatty:message_sent", handleSentMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleTyping);
      window.removeEventListener("chatty:message_sent", handleSentMessage);
      socket.emit("leave_conversation", conversationId);
    };
  }, [conversationId, myId]);

  function formatTime(isoString) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return <div style={styles.loading}>Loading messages…</div>;
  }

  return (
    <div style={styles.list}>
      {messages.length === 0 && (
        <div style={styles.empty}>No messages yet. Say hello!</div>
      )}

      {messages.map((m) => {
        const isMine = m.sender_id === myId;
        return (
          <div
            key={m.id}
            style={{
              ...styles.row,
              justifyContent: isMine ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.bubble,
                background: isMine ? "#2563eb" : "#fff",
                color: isMine ? "#fff" : "#111",
                borderBottomRightRadius: isMine ? 2 : 12,
                borderBottomLeftRadius: isMine ? 12 : 2,
              }}
            >
              <div style={styles.content}>{m.content}</div>
              <div
                style={{
                  ...styles.time,
                  color: isMine ? "rgba(255,255,255,0.7)" : "#9ca3af",
                }}
              >
                {formatTime(m.created_at)}
                {isMine && (
                  <span style={{ marginLeft: 4 }}>
                    {m.status === "read" ? "✓✓" : m.status === "delivered" ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {typingUsers.length > 0 && (
        <div style={{ ...styles.row, justifyContent: "flex-start" }}>
          <div style={{ ...styles.bubble, background: "#e5e7eb", padding: "8px 14px" }}>
            <span style={styles.typingDots}>
              <span>•</span><span>•</span><span>•</span>
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

const styles = {
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    background: "#f0f2f5",
  },
  loading: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: 14,
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 40,
  },
  row: {
    display: "flex",
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "65%",
    padding: "8px 12px 4px",
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  content: { fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" },
  time: { fontSize: 10, textAlign: "right", marginTop: 2 },
  typingDots: {
    display: "inline-flex",
    gap: 3,
    fontSize: 18,
    lineHeight: 1,
    color: "#6b7280",
  },
};
