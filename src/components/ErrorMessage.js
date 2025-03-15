import React from 'react';

function ErrorMessage({ error, onRetry }) {
  return (
    <div className="error-message-container">
      <div className="error-message-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div className="error-message-content">
        <h3>Unable to process video</h3>
        <p>{error || "Failed to fetch"}</p>
        <p className="error-suggestion">
          Try a different video or check back later.
        </p>
      </div>
      {onRetry && (
        <button className="error-retry-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;