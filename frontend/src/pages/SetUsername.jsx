import { useState } from "react";
import api from "../services/api";

export default function SetUsername({ onDone }) {

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function save() {

    try {

      await api.post("/users/username", {
        username,
        display_name: displayName
      });

      onDone();

    } catch (err) {

      console.error(err);

    }

  }

  return (
    <div style={{ padding: "40px" }}>
      <h2>Create Profile</h2>

      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <br /><br />

      <button onClick={save}>Continue</button>
    </div>
  );

}