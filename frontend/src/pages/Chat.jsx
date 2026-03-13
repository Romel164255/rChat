import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Chat({ onLogout }) {

  const [activeConversation, setActiveConversation] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>

      <Sidebar setActiveConversation={setActiveConversation} />

      <ChatWindow conversationId={activeConversation} />

      <button
        onClick={onLogout}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "8px 12px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>

    </div>
  );

}