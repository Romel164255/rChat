import { useState } from "react";
import api from "../services/api";

export default function Login({ setPhone }) {

  const [phone, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOTP() {

    if (!phone.trim()) {
      alert("Enter phone number");
      return;
    }

    try {

      setLoading(true);

      const res = await api.post("/auth/request-otp", {
        phone
      });

      console.log(res.data);

      setPhone(phone);

    } catch (err) {

      console.error("OTP request failed:", err);

      alert("Failed to send OTP");

    } finally {

      setLoading(false);

    }

  }

  return (

    <div style={{ padding: "40px" }}>

      <h2>Login</h2>

      <input
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhoneInput(e.target.value)}
        style={{ padding: "8px", marginRight: "10px" }}
      />

      <button onClick={requestOTP} disabled={loading}>
        {loading ? "Sending..." : "Send OTP"}
      </button>

    </div>

  );

}