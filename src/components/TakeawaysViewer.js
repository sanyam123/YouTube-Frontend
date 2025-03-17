// TakeawaysViewer.js
import React, { useState } from 'react';
// Add this import at the top of TakeawaysViewer.js
import ReactGA from "react-ga4";
function TakeawaysViewer({ 
  chapterAnalyses, 
  chapterAnalysisStatus, 
  rawChapterizedTranscript,
  activeChapter,
  onChapterClick,
  generatingAnalyses
}) {
  const [copyStatus, setCopyStatus] = useState({});
  const [activeTab, setActiveTab] = useState('recap'); // Default to Quick Recap tab

  if (!rawChapterizedTranscript || rawChapterizedTranscript.length === 0) {
    return <div>No chapters available.</div>;
  }

  // Format the analysis text into paragraphs
// Improved formatText function to clean up unnecessary symbols
const formatText = (text) => {
  if (!text) return null;
  
  // First clean up the text by removing unwanted symbols
  let cleanedText = text
    .replace(/#+\s*$/gm, '') // Remove hash symbols at the end of lines
    .replace(/^\s*\*\s*/gm, '') // Remove asterisks at the beginning of lines
    .replace(/\*{2,}/g, '') // Remove multiple asterisks
    .replace(/_{3,}/g, '') // Remove multiple underscores
    .trim();
  
  // Then format and return the cleaned text
  return cleanedText
    .split('\n')
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      if (line.trim().match(/^[-•*]|\d+\./)) {
        // Format bullet points properly
        return <li key={index}>{line.replace(/^[-•*]|\d+\./, '').trim()}</li>;
      }
      return <p key={index}>{line}</p>;
    });
};

  // Get current chapter analysis
  const getCurrentChapterAnalysis = () => {
    const chapterAnalysis = chapterAnalyses[activeChapter];
    
    if (!chapterAnalysis || chapterAnalysisStatus[activeChapter] !== 'completed') {
      return null;
    }
    
    return chapterAnalysis;
  };

  // Render the content based on active tab
  const renderTabContent = () => {
    const analysis = chapterAnalyses[activeChapter];
    const status = chapterAnalysisStatus[activeChapter];
    
    // IMPROVED: If we have analysis for this chapter, show it immediately
    // regardless of if other chapters are still being processed
    if (analysis && status === 'completed') {
      switch (activeTab) {
        case 'recap':
          return (
            <div className="tab-content recap-content">
              <div className="content-section">
                {formatText(analysis.summary)}
              </div>
            </div>
          );
        case 'ideas':
          return (
            <div className="tab-content ideas-content">
              <div className="content-section">
                {analysis.takeaways.trim().startsWith('•') || analysis.takeaways.trim().startsWith('-') ? (
                  <ul className="takeaways-list">
                    {formatText(analysis.takeaways)}
                  </ul>
                ) : (
                  <div className="takeaways-paragraphs">
                    {formatText(analysis.takeaways)}
                  </div>
                )}
              </div>
            </div>
          );
        case 'quotes':
          return (
            <div className="tab-content quotes-content">
              <div className="content-section">
                {formatText(analysis.quotes)}
              </div>
            </div>
          );
        default:
          return null;
      }
    }
  
    // Handle different states with better feedback
    if (status === 'pending' || generatingAnalyses) {
      // Count how many chapters have been analyzed
      const completedCount = Object.values(chapterAnalysisStatus)
        .filter(s => s === 'completed')
        .length;
      const totalCount = rawChapterizedTranscript.length;
      
      // Show progress information
      return (
        <div className="generating-analysis">
          <div className="spinner"></div>
          <p>Generating insights for Chapter {activeChapter + 1}...</p>
          <p className="analysis-note">
            {completedCount > 0 ? `${completedCount} of ${totalCount} chapters analyzed.` : 'Processing chapters...'}
          </p>
          {completedCount > 0 && (
            <p className="analysis-suggestion">
              While waiting, you can view insights for completed chapters.
            </p>
          )}
        </div>
      );
    }
  
    if (status === 'failed') {
      return (
        <div className="analysis-failed">
          <p>Failed to generate insights for this chapter.</p>
          <button 
            onClick={() => onChapterClick(activeChapter)} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    // Default: No analysis yet
    return (
      <div className="empty-analysis">
        <p>No analysis available for this chapter yet.</p>
      </div>
    );
  };

  // Handle copy to clipboard


// Update the handleCopy function in TakeawaysViewer component
const handleCopy = () => {
  const analysis = getCurrentChapterAnalysis();
  if (!analysis) return;

  let textToCopy = '';
  let contentType = '';
  
  switch (activeTab) {
    case 'recap':
      textToCopy = analysis.summary;
      contentType = 'Summary';
      break;
    case 'ideas':
      textToCopy = analysis.takeaways;
      contentType = 'Takeaways';
      break;
    case 'quotes':
      textToCopy = analysis.quotes;
      contentType = 'Quotes';
      break;
    default:
      return;
  }

  if (!textToCopy) return;

  // Track the copy action with more specific data
  ReactGA.event({
    category: "Engagement",
    action: "Copy Content",
    label: `${contentType}: ${rawChapterizedTranscript[activeChapter]?.title || `Chapter ${activeChapter + 1}`}`
  });

  navigator.clipboard.writeText(textToCopy).then(
    () => {
      setCopyStatus({ [activeTab]: 'copied' });
      setTimeout(() => setCopyStatus({}), 2000);
    },
    (err) => {
      console.error('Could not copy text: ', err);
      setCopyStatus({ [activeTab]: 'error' });
    }
  );
};

  return (
    <div className="transcript-container">
      {/* Chapter navigation sidebar */}
      <div className="chapters-sidebar">
        <div className="chapters-header">CHAPTERS</div>
        <div className="chapters-list">
        {rawChapterizedTranscript.map((chapter, index) => (
  <button 
    key={index}
    className={`chapter-button ${activeChapter === index ? 'active' : ''} ${
      chapterAnalysisStatus[index] ? `status-${chapterAnalysisStatus[index]}` : ''
    }`}
    onClick={() => onChapterClick(index)}
  >
    {chapter.time && <span className="chapter-time">{chapter.time}</span>}
    <span className="chapter-title">{chapter.title}</span>
  </button>
))}
        </div>
      </div>
      
      {/* Chapter content area */}
      <div className="chapter-content-area">
        <div className="chapter-header">
          <h3>{rawChapterizedTranscript[activeChapter]?.title}</h3>
          {getCurrentChapterAnalysis() && (
            <button 
              className="copy-button"
              onClick={handleCopy}
              title="Copy content"
            >
              {copyStatus[activeTab] === 'copied' ? (
                <span>Copied! ✓</span>
              ) : (
                <span>Copy Content</span>
              )}
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="tabs-navigation">
          <button 
            className={`tab-button ${activeTab === 'recap' ? 'active' : ''}`}
            onClick={() => setActiveTab('recap')}
          >
            Quick Recap
          </button>
          <button 
            className={`tab-button ${activeTab === 'ideas' ? 'active' : ''}`}
            onClick={() => setActiveTab('ideas')}
          >
            Big Ideas
          </button>
          <button 
            className={`tab-button ${activeTab === 'quotes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quotes')}
          >
            Key Quotes
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content-container">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default TakeawaysViewer;