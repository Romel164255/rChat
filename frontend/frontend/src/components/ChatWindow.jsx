import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatWindow({ conversationId }) {
  if (!conversationId) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyInner}>
          <div style={styles.emptyIcon}>💬</div>
          <p style={styles.emptyText}>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.window}>
      <MessageList conversationId={conversationId} />
      <MessageInput conversationId={conversationId} />
    </div>
  );
}

const styles = {
  window: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f2f5",
  },
  emptyInner: { textAlign: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#9ca3af", fontSize: 15 },
};
