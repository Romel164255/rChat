import { useState, useRef, useEffect, useCallback } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const isTypingRef = useRef(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    return () => { clearTimeout(timerRef.current); emitTyping(false); };
  // eslint-disable-next-line
  }, [conversationId]);

  // Reset on conversation change
  useEffect(() => {
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [conversationId]);

  function emitTyping(v) {
    const s = getSocket(); if (!s) return;
    s.emit("typing", { conversationId, isTyping: v });
  }

  function handleChange(e) {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
    if (!isTypingRef.current) { isTypingRef.current = true; emitTyping(true); }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { isTypingRef.current = false; emitTyping(false); }, 1500);
  }

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    clearTimeout(timerRef.current); isTypingRef.current = false; emitTyping(false);
    setSending(true); setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const res = await api.post("/messages", { conversation_id: conversationId, content: trimmed });
      const socket = getSocket();
      if (socket) socket.emit("send_message", res.data);
      window.dispatchEvent(new CustomEvent("chatty:message_sent", { detail: res.data }));
    } catch (err) {
      console.error(err); setText(trimmed);
    } finally {
      setSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [text, sending, conversationId]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const hasText = text.trim().length > 0;

  return (
    <div style={s.bar}>
      {/* Attach button */}
      <button style={s.iconBtn} title="Attach file">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>

      {/* Input row */}
      <div style={{ ...s.inputWrap, boxShadow: hasText ? "0 0 0 1px rgba(77,216,255,0.2)" : "none" }}>
        <textarea
          ref={textareaRef}
          style={s.textarea}
          placeholder="Message"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          rows={1}
          disabled={sending}
        />
        {/* Emoji button inside input */}
        <button style={s.emojiBtn} title="Emoji">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
      </div>

      {/* Send / Mic button */}
      <button
        style={{
          ...s.sendBtn,
          background: hasText ? "var(--accent)" : "var(--bg-input)",
          boxShadow: hasText ? "0 0 16px var(--accent-glow)" : "none",
          transform: hasText ? "scale(1.05)" : "scale(1)",
        }}
        onClick={send}
        disabled={!hasText || sending}
      >
        {hasText ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--bg-app)">
            <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>
    </div>
  );
}

const s = {
  bar: {
    display: "flex", alignItems: "flex-end", gap: 8,
    padding: "8px 12px 10px",
    background: "var(--bg-header)",
    borderTop: "1px solid var(--border)", flexShrink: 0,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: "50%", background: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-secondary)", flexShrink: 0, transition: "color .15s",
  },
  inputWrap: {
    flex: 1, background: "var(--bg-input)", borderRadius: 22,
    padding: "0 8px 0 16px",
    display: "flex", alignItems: "center",
    border: "1px solid var(--border)",
    transition: "box-shadow .2s, border-color .2s",
  },
  textarea: {
    flex: 1, padding: "11px 0", fontSize: 14.5,
    color: "var(--text-primary)", background: "transparent",
    resize: "none", lineHeight: 1.55, maxHeight: 120, overflowY: "auto",
  },
  emojiBtn: {
    width: 34, height: 34, borderRadius: "50%", background: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)", flexShrink: 0, transition: "color .15s",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all .2s cubic-bezier(0.34, 1.56, 0.64, 1)", border: "none",
  },
};
