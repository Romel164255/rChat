import { useState, useRef, useEffect, useCallback } from "react";
import EmojiPicker from "emoji-picker-react";
import api from "../services/api";
import { getSocket } from "../services/socket";

const stickerPack = [
  "/stickers/laugh.png",
  "/stickers/wow.png",
  "/stickers/heart.png",
  "/stickers/thumbsup.png"
];

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [gifResults, setGifResults] = useState([]);
  const [gifQuery, setGifQuery] = useState("");

  // --- Audio recording state ---
  const [recording, setRecording] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const isTypingRef = useRef(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // Audio refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      emitTyping(false);
      // Clean up any active recording on unmount
      stopRecordingCleanup();
    };
  }, [conversationId]);

  useEffect(() => {
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    // Cancel recording if conversation switches
    stopRecordingCleanup();
  }, [conversationId]);

  function stopRecordingCleanup() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    clearInterval(recordingTimerRef.current);
    setRecording(false);
    setRecordingDuration(0);
  }

  function emitTyping(v) {
    const s = getSocket(); if (!s) return;
    s.emit("typing", { conversationId, isTyping: v });
  }

  function handleChange(e) {
    setText(e.target.value);
    const ta = textareaRef.current;

    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(true);
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTyping(false);
    }, 1500);
  }

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    clearTimeout(timerRef.current);
    isTypingRef.current = false;
    emitTyping(false);

    setSending(true);
    setText("");

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await api.post("/messages", {
        conversation_id: conversationId,
        content: trimmed
      });

      const socket = getSocket();
      if (socket) socket.emit("send_message", res.data);

      window.dispatchEvent(
        new CustomEvent("chatty:message_sent", { detail: res.data })
      );

    } catch (err) {
      console.error(err);
      setText(trimmed);
    } finally {
      setSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }

  }, [text, sending, conversationId]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const hasText = text.trim().length > 0;

  /* ------------------ Emoji ------------------ */

  function addEmoji(e) {
    setText(prev => prev + e.emoji);
  }

  /* ------------------ Sticker ------------------ */

  async function sendSticker(url) {
    try {
      const res = await api.post("/messages", {
        conversation_id: conversationId,
        content: url
      });

      const socket = getSocket();
      if (socket) socket.emit("send_message", res.data);

    } catch (err) { console.error(err); }

    setShowStickers(false);
  }

  /* ------------------ GIF ------------------ */

  async function searchGif(q) {
    setGifQuery(q);
    if (!q) return;

    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${q}&limit=12`
    );
    const data = await res.json();
    setGifResults(data.data);
  }

  async function sendGif(url) {
    const res = await api.post("/messages", {
      conversation_id: conversationId,
      content: url
    });

    const socket = getSocket();
    if (socket) socket.emit("send_message", res.data);

    setShowGif(false);
  }

  /* ------------------ Audio Recording ------------------ */

  async function startRecording() {
    if (recording || sendingAudio) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => handleAudioStop();

      mr.start(100); // collect data every 100ms
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingDuration(0);

      // Tick duration counter
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone permission denied");
    }
  }

  function stopRecording() {
    if (!recording) return;
    clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Release mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
    setRecordingDuration(0);
  }

  function cancelRecording() {
    clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Override onstop so it doesn't send
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setRecording(false);
    setRecordingDuration(0);
  }

  async function handleAudioStop() {
    const chunks = audioChunksRef.current;
    if (!chunks.length) return;

    const mimeType = getSupportedMimeType();
    const blob = new Blob(chunks, { type: mimeType });
    audioChunksRef.current = [];

    setSendingAudio(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "voice.webm");
      form.append("conversation_id", conversationId);

      const res = await api.post("/audio/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // res.data is the full message object — emit it directly
      const socket = getSocket();
      if (socket) socket.emit("send_message", res.data);
      window.dispatchEvent(new CustomEvent("chatty:message_sent", { detail: res.data }));

    } catch (err) {
      console.error("Audio send failed:", err);
    } finally {
      setSendingAudio(false);
    }
  }

  function getSupportedMimeType() {
    const types = ["audio/webm", "audio/ogg", "video/webm", "audio/mp4"];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || "";
  }

  function formatDuration(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  /* ------------------ Render ------------------ */

  return (
    <>
      {/* Emoji Picker */}
      {showEmoji && (
        <div style={s.popup}>
          <EmojiPicker onEmojiClick={addEmoji} />
        </div>
      )}

      {/* Sticker Panel */}
      {showStickers && (
        <div style={s.popup}>
          <div style={s.stickerGrid}>
            {stickerPack.map(sticker => (
              <img
                key={sticker}
                src={sticker}
                style={s.sticker}
                onClick={() => sendSticker(sticker)}
              />
            ))}
          </div>
        </div>
      )}

      {/* GIF Panel */}
      {showGif && (
        <div style={s.popup}>
          <input
            placeholder="Search GIF"
            value={gifQuery}
            onChange={(e) => searchGif(e.target.value)}
            style={s.gifSearch}
          />
          <div style={s.gifGrid}>
            {gifResults.map(g => (
              <img
                key={g.id}
                src={g.images.fixed_height.url}
                style={s.gif}
                onClick={() => sendGif(g.images.original.url)}
              />
            ))}
          </div>
        </div>
      )}

      <div style={s.bar}>

        {/* ── Recording mode UI ── */}
        {recording ? (
          <>
            {/* Cancel (swipe left style) */}
            <button style={s.cancelBtn} onClick={cancelRecording}>✕</button>

            {/* Recording indicator */}
            <div style={s.recordingWrap}>
              <span style={s.recordingDot} />
              <span style={s.recordingText}>Recording</span>
              <span style={s.recordingTime}>{formatDuration(recordingDuration)}</span>
            </div>

            {/* Stop & send */}
            <button
              style={{ ...s.sendBtn, background: "#25d366" }}
              onMouseUp={stopRecording}
              onTouchEnd={stopRecording}
            >
              ✓
            </button>
          </>
        ) : (
          <>
            {/* ── Normal mode UI ── */}

            {/* Attach */}
            <button style={s.iconBtn}>📎</button>

            <div style={s.inputWrap}>
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

              {/* Emoji */}
              <button
                style={s.emojiBtn}
                onClick={() => {
                  setShowEmoji(!showEmoji);
                  setShowStickers(false);
                  setShowGif(false);
                }}
              >😀</button>

              {/* Stickers */}
              <button
                style={s.emojiBtn}
                onClick={() => {
                  setShowStickers(!showStickers);
                  setShowEmoji(false);
                  setShowGif(false);
                }}
              >🧸</button>

              {/* GIF */}
              <button
                style={s.emojiBtn}
                onClick={() => {
                  setShowGif(!showGif);
                  setShowEmoji(false);
                  setShowStickers(false);
                }}
              >GIF</button>
            </div>

            {/* Send / Mic button */}
            <button
              style={{
                ...s.sendBtn,
                background: hasText ? "var(--accent)" : "var(--bg-input)",
                opacity: sendingAudio ? 0.5 : 1,
              }}
              // Text mode → click to send
              onClick={hasText ? send : undefined}
              // Mic mode → hold to record
              onMouseDown={!hasText && !sendingAudio ? startRecording : undefined}
              onTouchStart={!hasText && !sendingAudio ? (e) => { e.preventDefault(); startRecording(); } : undefined}
              disabled={sending || sendingAudio}
            >
              {sendingAudio ? "⏳" : hasText ? "➤" : "🎤"}
            </button>
          </>
        )}
      </div>
    </>
  );
}

const s = {
  bar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "8px 12px 10px",
    background: "var(--bg-header)",
    borderTop: "1px solid var(--border)"
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  inputWrap: {
    flex: 1,
    background: "var(--bg-input)",
    borderRadius: 22,
    padding: "0 8px 0 16px",
    display: "flex",
    alignItems: "center",
    border: "1px solid var(--border)"
  },

  textarea: {
    flex: 1,
    padding: "11px 0",
    background: "transparent",
    resize: "none",
    maxHeight: 120
  },

  emojiBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "none"
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    transition: "background 0.2s, transform 0.15s"
  },

  popup: {
    position: "absolute",
    bottom: 70,
    left: 60,
    width: 320,
    maxHeight: 360,
    background: "#1f1f1f",
    borderRadius: 12,
    padding: 10,
    overflowY: "auto"
  },

  stickerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 10
  },

  sticker: {
    width: 60,
    cursor: "pointer"
  },

  gifSearch: {
    width: "100%",
    padding: 6,
    marginBottom: 8
  },

  gifGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 6
  },

  gif: {
    width: "100%",
    cursor: "pointer"
  },

  // ── Recording mode styles ──
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    border: "none",
    color: "#aaa",
    fontSize: 14,
    cursor: "pointer",
    flexShrink: 0
  },

  recordingWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg-input)",
    borderRadius: 22,
    padding: "0 16px",
    height: 44,
    border: "1px solid var(--border)"
  },

  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#e53935",
    animation: "pulse 1s infinite",
    flexShrink: 0
  },

  recordingText: {
    flex: 1,
    fontSize: 14,
    color: "var(--text-secondary)"
  },

  recordingTime: {
    fontSize: 13,
    color: "#e53935",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.05em"
  }
};
