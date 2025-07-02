import { useState } from "react";
import RepoCard from "./RepoCard";

function App() {
  const [repoURL, setRepoURL] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setRepoData(null);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoURL }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setRepoData(data);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>🚀 GitPeek</h1>
      <input
        type="text"
        value={repoURL}
        onChange={(e) => setRepoURL(e.target.value)}
        placeholder="Paste GitHub repo URL"
        style={{ width: "300px", padding: "0.5rem", marginRight: "1rem" }}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "⏳ Summarizing..." : "Generate Summary"}
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {repoData && repoData.metadata ? (
        <RepoCard summary={repoData.summary} metadata={repoData.metadata} />
      ) : repoData?.summary ? (
        <div
          style={{
            marginTop: "2rem",
            background: "#f9f9f9",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <h3>Summary:</h3>
          <p>{repoData.summary}</p>
        </div>
      ) : null}
    </div>
  );
}

export default App;
