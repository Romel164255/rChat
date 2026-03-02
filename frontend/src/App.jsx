import { useEffect, useState } from "react";
import { socket } from "./socket";

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("room1");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const joinRoom = () => {
    if (!username) return;
    socket.connect();
    socket.emit("join_room", room);
    setJoined(true);
  };

  useEffect(() => {
    socket.on("load_messages", (data) => {
      setMessages(data);
    });

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("load_messages");
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (!message) return;

    socket.emit("send_message", {
      roomId: room,
      content: message,
      sender: username,
    });

    setMessage("");
  };

  if (!joined) {
    return (
      <div className="chat-container">
        <div className="chat-header">Join Chat</div>
        <div className="input-area">
          <input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinRoom}>Join</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        Room: {room} | User: {username}
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.sender}: </strong>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;