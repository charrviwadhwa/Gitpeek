import React from "react";

function RepoCard({ summary, metadata }) {
  if (!metadata) return null;

  const {
  name,
  description,
  owner,
  stargazers,
  forks,
  languages,
  html_url,
} = metadata;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem",
        borderRadius: "20px",
        background: "white",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "row",
        gap: "2rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Owner Avatar */}
      <img
   src={owner?.avatar_url}
  alt={`${owner?.login}'s avatar`}
  style={{
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  }}
/>

      {/* Repo Info */}
      <div style={{ flex: 1 }}>
        <h2 style={{ marginBottom: "0.2rem" }}>
          <a
            href={html_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#333", textDecoration: "none" }}
          >
            {name}
          </a>
        </h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>{description}</p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
  <span>⭐ {stargazers}</span>
  <span>🍴 {forks}</span>
</div>

        {/* Languages */}
        {languages && Object.keys(languages).length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <strong>Languages:</strong>
            <ul style={{ paddingLeft: "1rem", marginTop: "0.3rem" }}>
              {Object.entries(languages).map(([lang, val]) => (
                <li key={lang}>
                  {lang} — {val.toLocaleString()} bytes
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        <div>
          <strong>Summary:</strong>
          <p style={{ marginTop: "0.3rem", color: "#333" }}>{summary}</p>
        </div>
      </div>
    </div>
  );
}

export default RepoCard;
