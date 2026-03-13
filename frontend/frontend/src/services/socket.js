import { io } from "socket.io-client";

let socket = null;

/**
 * Connect to the socket server using the stored JWT.
 * Safe to call multiple times — will reuse an existing connected socket.
 */
export function connectSocket() {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem("token");

  socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
    transports: ["websocket"],
    auth: { token }, // passed to server's socketAuthMiddleware
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connection error:", err.message);
  });

  return socket;
}

/**
 * Disconnect and destroy the current socket.
 * Call this on logout.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance.
 * Returns null if not yet connected.
 */
export function getSocket() {
  return socket;
}
