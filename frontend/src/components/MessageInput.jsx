import { useState } from "react";
import api from "../services/api";
import socket from "../services/socket";

export default function MessageInput({ conversationId }) {

  const [text, setText] = useState("");

  async function send() {

    if (!text.trim()) return;

    const message = {
      conversation_id: conversationId,
      content: text
    };

    /* optimistic socket */

    socket.emit("send_message", message);

    try {

      await api.post("/messages", message);

    } catch (err) {

      console.error(err);

    }

    setText("");

  }

  return (

    <div
      style={{
        display: "flex",
        borderTop: "1px solid #ddd",
        padding: "10px"
      }}
    >

      <input
        style={{ flex: 1 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
      />

      <button onClick={send}>
        Send
      </button>

    </div>

  );

}