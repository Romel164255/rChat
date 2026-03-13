import { useEffect, useState } from "react";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import SetUsername from "./pages/SetUsername";
import Chat from "./pages/Chat";
import api from "./services/api";

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

      } catch (err) {

        localStorage.removeItem("token");
        setToken(null);

      }

      setLoading(false);

    }

    checkUser();

  }, [token]);

  if (loading) return <div>Loading...</div>;

  if (!token && !phone)
    return <Login setPhone={setPhone} />;

  if (!token && phone)
    return (
      <VerifyOTP
        phone={phone}
        onLogin={(token) => {
          localStorage.setItem("token", token);
          setToken(token);
        }}
      />
    );

  if (!hasUsername)
    return <SetUsername onDone={() => setHasUsername(true)} />;

  return <Chat onLogout={() => {
    localStorage.removeItem("token");
    setToken(null);
  }} />;
}