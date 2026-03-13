import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatWindow({ conversationId }) {

  if (!conversationId) {

    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Select a conversation
      </div>
    );

  }

  return (

    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

      <MessageList conversationId={conversationId} />

      <MessageInput conversationId={conversationId} />

    </div>

  );

}