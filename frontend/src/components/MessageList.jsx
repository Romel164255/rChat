import { useEffect, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";

export default function MessageList({ conversationId }) {

  const [messages, setMessages] = useState([]);

  /* load messages */

  useEffect(() => {

    async function loadMessages() {

      try {

        const res = await api.get(`/messages/${conversationId}`);

        setMessages(res.data.reverse());

      } catch (err) {

        console.error(err);

      }

    }

    if (conversationId) {

      loadMessages();

    }

  }, [conversationId]);

  /* socket realtime */

  useEffect(() => {

    if (!conversationId) return;

    socket.emit("join_conversation", conversationId);

    const handleMessage = (data) => {

      if (data.conversation_id === conversationId) {

        setMessages(prev => [...prev, data]);

      }

    };

    socket.on("receive_message", handleMessage);

    return () => {

      socket.off("receive_message", handleMessage);

    };

  }, [conversationId]);

  return (

    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "6px"
      }}
    >

      {messages.map((m) => (

        <div
          key={m.id}
          style={{
            background: "#f1f1f1",
            padding: "8px",
            borderRadius: "8px",
            maxWidth: "60%"
          }}
        >
          {m.content}
        </div>

      ))}

    </div>

  );

}