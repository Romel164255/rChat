import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Chat({ onLogout }) {
  const [activeConversation, setActiveConversation] = useState(null);

  return (
    <div style={styles.container}>
      <Sidebar
        activeConversationId={activeConversation}
        setActiveConversation={setActiveConversation}
        onLogout={onLogout}
      />
      <ChatWindow conversationId={activeConversation} />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f0f2f5",
  },
};
