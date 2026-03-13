import { useState, useRef, useEffect } from "react";
import api from "../services/api";

export default function SearchUsers({ reload, setActiveConversation }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function search(value) {
    setQuery(value);
    if (!value.trim() || value.trim().length < 2) {
      setUsers([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/users/search?username=${encodeURIComponent(value.trim())}`);
      setUsers(res.data);
      setOpen(true);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function startChat(userId) {
    try {
      const res = await api.post("/conversations", { user_id: userId });
      await reload();
      setActiveConversation(res.data.conversation_id);
      setUsers([]);
      setQuery("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  }

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <input
        style={styles.input}
        placeholder="Search users…"
        value={query}
        onChange={(e) => search(e.target.value)}
      />

      {open && (
        <div style={styles.dropdown}>
          {loading && <div style={styles.item}>Searching…</div>}

          {!loading && users.length === 0 && (
            <div style={styles.item}>No users found</div>
          )}

          {users.map((u) => (
            <div
              key={u.id}
              style={styles.userRow}
              onClick={() => startChat(u.id)}
            >
              <div style={styles.avatar}>
                {(u.display_name || u.username)[0].toUpperCase()}
              </div>
              <div>
                <div style={styles.userName}>{u.display_name || u.username}</div>
                <div style={styles.userHandle}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: "relative", padding: "10px 12px", borderBottom: "1px solid #e5e7eb" },
  input: {
    width: "100%",
    padding: "8px 12px",
    fontSize: 13,
    border: "1px solid #ddd",
    borderRadius: 8,
    boxSizing: "border-box",
    outline: "none",
    background: "#f9fafb",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 12,
    right: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 100,
    maxHeight: 220,
    overflowY: "auto",
  },
  item: { padding: "10px 14px", fontSize: 13, color: "#888" },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: "#111" },
  userHandle: { fontSize: 12, color: "#9ca3af" },
};
