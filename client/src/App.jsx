import { useState } from "react";

function App() {
  const [repoURL, setRepoURL] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setSummary("");

    const res = await fetch("http://localhost:5000/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: repoURL }),
    });

    const data = await res.json();
    setSummary(data.summary || "No summary generated.");
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>GitPeek</h1>
      <input
        type="text"
        value={repoURL}
        onChange={e => setRepoURL(e.target.value)}
        placeholder="Paste GitHub repo URL"
        style={{ width: "300px", padding: "0.5rem" }}
      />
      <button onClick={handleSubmit} style={{ marginLeft: "1rem" }}>
        Generate Summary
      </button>

      {loading && <p>⏳ Generating...</p>}
      {summary && (
        <div style={{ marginTop: "2rem", background: "#f0f0f0", padding: "1rem" }}>
          <h3>Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}

export default App;
