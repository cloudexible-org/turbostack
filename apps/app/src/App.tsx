import { api } from "@repo/api";
import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import "./App.css";

function App() {
  const messages = useQuery(api.messages.list);
  const sendMessage = useMutation(api.messages.send);
  const [body, setBody] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    await sendMessage({ author: "anon", body: text });
  };

  return (
    <main className="card">
      <h1>TurboStack</h1>
      <p className="read-the-docs">Vite + React + Convex</p>

      <form onSubmit={handleSubmit}>
        <input
          aria-label="Message"
          value={body}
          placeholder="Say something…"
          onChange={(event) => setBody(event.target.value)}
        />
        <button type="submit">Send</button>
      </form>

      <ul>
        {messages === undefined ? (
          <li>Loading…</li>
        ) : messages.length === 0 ? (
          <li>No messages yet — send one above.</li>
        ) : (
          messages.map((message) => <li key={message._id}>{message.body}</li>)
        )}
      </ul>
    </main>
  );
}

export default App;
