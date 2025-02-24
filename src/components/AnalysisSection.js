import React from 'react';
import LoadingSpinner from './LoadingSpinner';

function AnalysisSection({ title, content, loading }) {
  // Format the content to split by newlines
  const formattedContent = content
    .split('\n')
    .filter(line => line.trim() !== '')
    .map((line, index) => <p key={index}>{line}</p>);

  return (
    <div className="analysis-section">
      <h3>{title}</h3>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="analysis-content">
          {formattedContent}
        </div>
      )}
    </div>
  );
}

export default AnalysisSection;