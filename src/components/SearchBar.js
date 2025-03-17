import React from 'react';
import ReactGA from "react-ga4";

function SearchBar({ videoUrl, setVideoUrl, onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Track URL input submission
    ReactGA.event({
      category: "Search",
      action: "Submit URL",
      label: videoUrl
    });
    
    onSearch();
  };

  return (
    <div className="search-bar">
      <h2>Enter a Video URL</h2>
      <form onSubmit={handleSubmit} className="search-input">
        <input
          type="text"
          placeholder="Paste the URL here (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button type="submit">Search Video</button>
      </form>
    </div>
  );
}

export default SearchBar;