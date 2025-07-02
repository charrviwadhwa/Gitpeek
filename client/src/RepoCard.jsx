import React from "react";
import ReactMarkdown from "react-markdown";
import './RepoCard.css';

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
    <div className="repo-card">
      {/* Avatar */}
      <img
        src={owner?.avatar_url}
        alt={`${owner?.login}'s avatar`}
        className="repo-avatar"
      />

      {/* Repo Info */}
      <div className="repo-info">
        <h2 className="repo-name">
          <a href={html_url} target="_blank" rel="noreferrer">
            {name}
          </a>
        </h2>
        <p className="repo-description">
          {description || 'No description available'}
        </p>

        <div className="repo-stats">
          <div className="repo-stat">
            <span>⭐</span>
            <span>{stargazers || 0}</span>
          </div>
          <div className="repo-stat">
            <span>🍴</span>
            <span>{forks || 0}</span>
          </div>
        </div>

        {languages && Object.keys(languages).length > 0 && (
          <div className="repo-languages">
  <strong className="block mb-1">Languages:</strong>
  <div className="languages-list">
    {Object.entries(languages).map(([lang, bytes]) => {
      const iconClass = `devicon-${lang.toLowerCase()}-plain colored`;
      return (
        <span key={lang} className="language-tag">
          <i className={iconClass} style={{ marginRight: '6px' }}></i>
          {lang} ({bytes.toLocaleString()} bytes)
        </span>
      );
    })}
  </div>
</div>

        )}

        <div className="repo-summary">
  <ReactMarkdown>
    {summary}
  </ReactMarkdown>
</div>
      </div>
    </div>
  );
}

export default RepoCard;
