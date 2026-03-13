import { useState } from "react";
import api from "../services/api";

export default function SearchUsers({ reload }) {

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);

  async function search() {

    if (!query) return;

    try {

      const res = await api.get(`/users/search?username=${query}`);

      setUsers(res.data);

    } catch (err) {

      console.error(err);

    }

  }

  async function startChat(id) {

    try {

      await api.post("/conversations", { user_id: id });

      reload();

      setUsers([]);

      setQuery("");

    } catch (err) {

      console.error(err);

    }

  }

  return (

    <div>

      <input
        placeholder="Search user"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button onClick={search}>Search</button>

      {users.map(u => (

        <div key={u.id}>

          {u.username}

          <button onClick={() => startChat(u.id)}>
            Chat
          </button>

        </div>

      ))}

    </div>

  );

}