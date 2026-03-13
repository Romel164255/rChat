import { useState } from "react";
import api from "../services/api";

export default function VerifyOTP({ phone, onLogin }) {

  const [otp, setOtp] = useState("");

  async function verify() {

  console.log("PHONE:", phone);
  console.log("OTP:", otp);

  try {

    const res = await api.post("/auth/verify-otp", {
      phone,
      code: otp
    });

    localStorage.setItem("token", res.data.token);

    onLogin();

  } catch (err) {

    console.error("VERIFY ERROR:", err.response?.data);

  }

}

  return (

    <div>

      <h2>Enter OTP</h2>

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <button onClick={verify}>
        Verify
      </button>

    </div>

  );

}