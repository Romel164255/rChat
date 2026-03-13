import { useState } from "react";
import api from "../services/api";

export default function VerifyOTP({ phone, onLogin }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verify() {
    const trimmed = otp.trim();

    if (!trimmed || trimmed.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", {
        phone,
        code: trimmed,
      });

      // FIX: pass the token up to App.jsx — do NOT store it here
      // (App.jsx is the single source of truth for auth state)
      onLogin(res.data.token);
    } catch (err) {
      const msg = err.response?.data?.error || "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") verify();
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Enter OTP</h2>
        <p style={styles.subtitle}>
          We sent a 6-digit code to <strong>{phone}</strong>
        </p>

        <input
          style={styles.input}
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={handleKeyDown}
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoFocus
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          onClick={verify}
          disabled={loading}
        >
          {loading ? "Verifying…" : "Verify"}
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
    width: 360,
    boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
  },
  title: { margin: "0 0 6px", fontSize: 22, fontWeight: 600 },
  subtitle: { margin: "0 0 24px", color: "#666", fontSize: 14 },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: 8,
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 8,
  },
  error: { color: "#c0392b", fontSize: 13, margin: "4px 0 8px" },
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
    marginTop: 8,
  },
};
