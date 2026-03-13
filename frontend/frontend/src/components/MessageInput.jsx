import { useState, useRef, useEffect, useCallback } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";

const TYPING_DEBOUNCE_MS = 1000; // stop-typing delay

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);

  // Cleanup typing state when conversation changes
  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      emitTyping(false);
    };
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  function emitTyping(isTyping) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("typing", { conversationId, isTyping });
  }

  function handleTextChange(e) {
    setText(e.target.value);

    // Emit typing start once per burst
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(true);
    }

    // Reset the debounce timer
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTyping(false);
    }, TYPING_DEBOUNCE_MS);
  }

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Clear typing indicator
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    emitTyping(false);

    setSending(true);
    setText("");

    try {
      // POST to REST API — server returns the saved message with its real ID & timestamp
      const res = await api.post("/messages", {
        conversation_id: conversationId,
        content: trimmed,
      });

      // Relay to the room via socket so OTHER users receive it in real time.
      // We do NOT add it to our own list here — the REST response is the source of truth
      // for the sender. The MessageList will add it to the sender's view through a
      // mechanism: on successful POST, we emit to the room and the sender's MessageList
      // handles the receive_message event which comes from socket.to() (others only).
      // So we manually append it to the sender's local state via a custom event.
      const socket = getSocket();
      if (socket) {
        socket.emit("send_message", res.data);
      }

      // Dispatch a local event so MessageList can append the sent message for the sender
      window.dispatchEvent(
        new CustomEvent("chatty:message_sent", { detail: res.data })
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Restore text on failure so the user can retry
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, sending, conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={styles.container}>
      <textarea
        style={styles.input}
        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={sending}
      />
      <button
        style={{
          ...styles.button,
          opacity: !text.trim() || sending ? 0.5 : 1,
          cursor: !text.trim() || sending ? "default" : "pointer",
        }}
        onClick={send}
        disabled={!text.trim() || sending}
      >
        {sending ? "…" : "➤"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "10px 14px",
    borderTop: "1px solid #e5e7eb",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "9px 12px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 20,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    maxHeight: 120,
    overflowY: "auto",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },
};
