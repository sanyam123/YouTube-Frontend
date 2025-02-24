import React from 'react';

function SearchBar({ videoUrl, setVideoUrl, onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="search-bar">
      <h2>Enter YouTube Video URL</h2>
      <form onSubmit={handleSubmit} className="search-input">
        <input
          type="text"
          placeholder="Paste YouTube video URL here (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button type="submit">Search Video</button>
      </form>
    </div>
  );
}

export default SearchBar;