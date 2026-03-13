import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import { pool } from "./db.js";
import { socketAuthMiddleware } from "./middleware/authMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

dotenv.config();

/* =========================
   App Setup
========================= */

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

/* =========================
   CORS
========================= */

const corsOptions = {
  origin: CLIENT_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

/* =========================
   Routes
========================= */

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/conversations", conversationRoutes);
app.use("/messages", messageRoutes);
app.use("/groups", groupRoutes);

/* 404 catch-all */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

/* =========================
   Socket.IO
========================= */

const io = new Server(server, { cors: corsOptions });

// Authenticate every socket connection with a JWT
io.use(socketAuthMiddleware);

/* Online users: userId → Set<socketId> (supports multiple tabs) */
const onlineUsers = new Map(); // userId → Set<socketId>

function addOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnline(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
}

function broadcastOnlineUsers() {
  io.emit("online_users", Array.from(onlineUsers.keys()));
}

/* =========================
   Socket Events
========================= */

io.on("connection", (socket) => {
  const userId = socket.user.id; // guaranteed by socketAuthMiddleware

  console.log(`[socket] connected: ${socket.id} (user ${userId})`);

  addOnline(userId, socket.id);
  broadcastOnlineUsers();

  /* JOIN CONVERSATION ROOM */
  socket.on("join_conversation", (conversationId) => {
    if (typeof conversationId !== "string") return;
    socket.join(conversationId);
  });

  /* LEAVE CONVERSATION ROOM */
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId);
  });

  /* SEND MESSAGE (real-time relay only — storage happens via REST POST /messages) */
  socket.on("send_message", (data) => {
    if (!data || typeof data.conversation_id !== "string") return;

    // Attach the authenticated sender ID — never trust the client-sent sender_id
    const message = { ...data, sender_id: userId };

    // Emit to everyone in the room EXCEPT the sender (sender already has it optimistically)
    socket.to(data.conversation_id).emit("receive_message", message);
  });

  /* MESSAGE DELIVERED */
  socket.on("message_delivered", ({ message_id, conversationId }) => {
    if (!message_id || !conversationId) return;
    io.to(conversationId).emit("message_delivered", { message_id });
  });

  /* MESSAGE READ */
  socket.on("message_read", ({ message_id, conversationId }) => {
    if (!message_id || !conversationId) return;
    io.to(conversationId).emit("message_read", { message_id });
  });

  /* TYPING INDICATOR */
  socket.on("typing", ({ conversationId, isTyping }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit("user_typing", {
      conversationId,
      userId,
      isTyping: Boolean(isTyping),
    });
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id} (user ${userId})`);
    removeOnline(userId, socket.id);
    broadcastOnlineUsers();
  });
});

/* =========================
   Database Test
========================= */

async function testDB() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connected:", res.rows[0].now);
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
}

/* =========================
   Start Server
========================= */

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testDB();
});