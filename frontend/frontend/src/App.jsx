import { useEffect, useState } from "react";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import SetUsername from "./pages/SetUsername";
import Chat from "./pages/Chat";
import api from "./services/api";
import { connectSocket, disconnectSocket } from "./services/socket";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState(false);

  useEffect(() => {
    async function checkUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (res.data.username) {
          setHasUsername(true);
        }
      } catch {
        // api interceptor handles 401 — other errors just clear token
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [token]);

  // Connect socket when user is fully logged in; disconnect on logout
  useEffect(() => {
    if (token && hasUsername) {
      connectSocket();
    }
    return () => {
      // cleanup runs when token or hasUsername changes (e.g. logout)
    };
  }, [token, hasUsername]);

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    disconnectSocket();
    localStorage.removeItem("token");
    setToken(null);
    setHasUsername(false);
    setPhone(null);
  }

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  if (!token && !phone) {
    return <Login setPhone={setPhone} />;
  }

  if (!token && phone) {
    return <VerifyOTP phone={phone} onLogin={handleLogin} />;
  }

  if (!hasUsername) {
    return <SetUsername onDone={() => setHasUsername(true)} />;
  }

  return <Chat onLogout={handleLogout} />;
}
