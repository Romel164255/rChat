import { useState } from "react";
import api from "../services/api";

export default function SetUsername({ onDone }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedDisplay = displayName.trim();

    if (!trimmedUser) {
      setError("Username is required");
      return;
    }

    if (trimmedUser.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUser)) {
      setError("Username may only contain letters, numbers, and underscores");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/users/username", {
        username: trimmedUser,
        display_name: trimmedDisplay || null,
      });
      onDone();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save profile. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") save();
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create your profile</h2>
        <p style={styles.subtitle}>Choose a username to get started</p>

        <label style={styles.label}>Username *</label>
        <input
          style={styles.input}
          placeholder="e.g. john_doe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <label style={styles.label}>Display name (optional)</label>
        <input
          style={styles.input}
          placeholder="e.g. John Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          onClick={save}
          disabled={loading}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#f5f5f5",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "40px 36px",
    width: 380,
    boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
  },
  title: { margin: "0 0 6px", fontSize: 22, fontWeight: 600 },
  subtitle: { margin: "0 0 20px", color: "#666", fontSize: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#333" },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 15,
    border: "1px solid #ddd",
    borderRadius: 8,
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 14,
  },
  error: { color: "#c0392b", fontSize: 13, margin: "0 0 10px" },
  button: {
    width: "100%",
    padding: "10px",
    fontSize: 15,
    fontWeight: 600,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
