import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import { pool } from "./db.js";

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

/* =========================
   CORS
========================= */

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

/* =========================
   Socket.IO
========================= */

const io = new Server(server, {
  cors: corsOptions
});

/* =========================
   Routes
========================= */

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/conversations", conversationRoutes);
app.use("/messages", messageRoutes);
app.use("/groups", groupRoutes);

/* =========================
   Online Users
========================= */

const onlineUsers = new Map();

/* =========================
   Socket Events
========================= */

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  /* USER ONLINE */

  socket.on("user_online", (userId) => {

    onlineUsers.set(userId, socket.id);

    io.emit("online_users", Array.from(onlineUsers.keys()));

  });

  /* JOIN CHAT ROOM */

  socket.on("join_conversation", (conversationId) => {

    socket.join(conversationId);

    console.log("Joined conversation:", conversationId);

  });

  /* SEND MESSAGE */

  socket.on("send_message", (data) => {

    const { conversation_id } = data;

    io.to(conversation_id).emit("receive_message", data);

  });

  /* MESSAGE DELIVERED */

  socket.on("message_delivered", ({ message_id, conversationId }) => {

    io.to(conversationId).emit("message_delivered", {
      message_id
    });

  });

  /* MESSAGE READ */

  socket.on("message_read", ({ message_id, conversationId }) => {

    io.to(conversationId).emit("message_read", {
      message_id
    });

  });

  /* TYPING */

  socket.on("typing", ({ conversationId, userId }) => {

    socket.to(conversationId).emit("user_typing", {
      conversationId,
      userId
    });

  });

  /* DISCONNECT */

  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

    for (const [userId, socketId] of onlineUsers.entries()) {

      if (socketId === socket.id) {
        onlineUsers.delete(userId);
      }

    }

    io.emit("online_users", Array.from(onlineUsers.keys()));

  });

});

/* =========================
   Database Test
========================= */

async function testDB() {

  try {

    const res = await pool.query("SELECT NOW()");

    console.log("Database connected:", res.rows[0]);

  } catch (err) {

    console.error("Database connection error:", err);

  }

}

/* =========================
   Start Server
========================= */

server.listen(PORT, async () => {

  console.log(`Server running on port ${PORT}`);

  await testDB();

});