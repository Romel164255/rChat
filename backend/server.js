const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const setupChat = require("./sockets/chat");
const messageRoutes = require("./routes/messageRoutes");

const PORT = 3000;

const app = express();
app.use(express.json());

app.use("/api/messages", messageRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

setupChat(io);

server.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});