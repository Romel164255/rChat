import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Chat({ onLogout }) {
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [isGroup, setIsGroup] = useState(false);

  function handleSelect(id, title, group = false) {
    setActiveConversation(id);
    setActiveTitle(title);
    setIsGroup(group);
  }

  return (
    <div style={s.app}>
      <Sidebar
        activeConversationId={activeConversation}
        onSelect={handleSelect}
        onLogout={onLogout}
      />
      <ChatWindow
        conversationId={activeConversation}
        title={activeTitle}
        isGroup={isGroup}
      />
    </div>
  );
}

const s = {
  app: { display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-app)" },
};
