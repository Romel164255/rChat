import { useEffect, useState } from "react";
import api from "../services/api";
import SearchUsers from "./SearchUsers";

export default function Sidebar({ setActiveConversation }) {

  const [conversations, setConversations] = useState([]);

  async function load() {

    try {

      const res = await api.get("/conversations");

      setConversations(res.data);

    } catch (err) {

      console.error("Failed to load conversations", err);

    }

  }

  useEffect(() => {

    load();

  }, []);

  return (

    <div
      style={{
        width: "300px",
        borderRight: "1px solid #ddd",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}
    >

      {/* user search */}
      <SearchUsers reload={load} />

      {/* conversations list */}
      <div>

        {conversations.map((c) => (

          <div
            key={c.id}
            onClick={() => setActiveConversation(c.id)}
            style={{
              padding: "10px",
              cursor: "pointer",
              borderBottom: "1px solid #eee"
            }}
          >

            <div>{c.title || "Direct Chat"}</div>

            <div style={{ fontSize: "12px", color: "#777" }}>
              {c.last_message}
            </div>

          </div>

        ))}

      </div>

    </div>

  );

}