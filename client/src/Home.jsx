import React, { useState, useEffect } from 'react';
import RepoCard from './RepoCard';
import './Home.css';

const Home = () => {
  const [repoURL, setRepoURL] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!repoURL.trim()) return;
    
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const scrollToFeatures = () => {
    document.querySelector('.features')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    // Create animated dots
    const createDot = () => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.animationDelay = Math.random() * 20 + 's';
      dot.style.animationDuration = (15 + Math.random() * 10) + 's';
      dot.style.opacity = 0.2 + Math.random() * 0.3;
      return dot;
    };

    const container = document.getElementById('dotsContainer');
    if (container) {
      const numDots = 50;
      for (let i = 0; i < numDots; i++) {
        container.appendChild(createDot());
      }
    }

    // Parallax effect on scroll
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const dots = document.querySelectorAll('.dot');
      
      dots.forEach((dot, index) => {
        const speed = 0.5 + (index % 3) * 0.2;
        dot.style.transform = `translateY(${scrolled * speed}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="home-container">
      {/* Animated Background Dots */}
      <div className="dots-container" id="dotsContainer"></div>

      {/* Header */}
      <header className="header">
        <div className="logo">
  <img src="/logo.png" alt="GitPeek Logo" className="logo-img" />
  GitPeek
</div>
      </header>

      {/* Main Content */}
      <main className="main-content">
  {/* Floating glow effect behind content */}
  <div className="hero-glow" />

  {/* Tagline banner */}
  <div className="hero-tagline">⚡ Your instant GitHub insight tool</div>

  {/* Hero title */}
  <h1 className="hero-title">
    Understand any GitHub repo in <span>seconds</span>
  </h1>

  {/* Subtitle */}
 <div className="intro-box">
  <p>
    <strong>GitPeek</strong> is an <span className="highlight">AI-powered tool</span> that helps developers instantly understand what any public GitHub repository is about — even if it lacks a README.
  </p>
  <p>
    By analyzing code and metadata, GitPeek generates <span className="highlight">clear, readable summaries</span> that save time and effort.
  </p>
</div>


  {/* Search input + button */}
  <div className="search-section">
    <div className="search-container">
      <input
        type="text"
        value={repoURL}
        onChange={(e) => setRepoURL(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Paste GitHub repo URL (e.g., https://github.com/user/repo)"
        className="search-input"
      />
      <button onClick={handleSubmit} disabled={loading} className="analyze-button">
        {loading ? "⏳ Analyzing..." : "Generate Summary"}
      </button>
    </div>
    {error && <div className="error-message">{error}</div>}
  </div>
   {/* Results Section */}
        {(repoData || loading) && (
          <div className="results-section">
            {loading ? (
              <div className="loading-card">
                <div className="loading-spinner"></div>
                <p>Analyzing repository...</p>
              </div>
            ) : repoData && repoData.metadata ? (
              <RepoCard summary={repoData.summary} metadata={repoData.metadata} />
            ) : repoData?.summary ? (
              <div className="simple-summary">
                <div className="repo-summary">
                  <strong>Summary:</strong>
                  <p>{repoData.summary}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
</main>


       
        
    

      {/* Features Section */}
      
    </div>
  );
};

export default Home;