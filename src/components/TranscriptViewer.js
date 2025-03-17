// TranscriptViewer.js
import React, { useState } from 'react';
import ReactGA from "react-ga4";
function TranscriptViewer({ 
  rawChapterizedTranscript, 
  enhancedChapterizedTranscript,
  chapterEnhancementStatus,
  activeChapter,
  onChapterClick,
  videoDetails 
}) {
  const [copyStatus, setCopyStatus] = useState({});
  
  if (!rawChapterizedTranscript || rawChapterizedTranscript.length === 0) {
    return <div>No transcript available.</div>;
  }

  // Format the transcript text into paragraphs
  const formatText = (text) => {
    if (!text) return <div className="loading-transcript">Loading...</div>;
    
    return text
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index) => <p key={index}>{line}</p>);
  };

  // Get the current chapter content based on enhancement status
  const getCurrentChapterContent = () => {
    const status = chapterEnhancementStatus[activeChapter];
    const enhancedChapter = enhancedChapterizedTranscript[activeChapter];
    const rawChapter = rawChapterizedTranscript[activeChapter];
    
    if (!rawChapter) return <div>Chapter not found.</div>;
    
    // If enhanced content is available and enhancement is complete, show enhanced content
    if (enhancedChapter && status === 'completed') {
      return formatText(enhancedChapter.content);
    }
    
    // If enhancement is in progress, show loading
    if (status === 'enhancing') {
      return (
        <div className="enhancing-transcript">
          <div className="spinner"></div>
          <p>Loading transcript...</p>
        </div>
      );
    }
    
    // If enhancement failed, show raw content with a notice
    if (status === 'failed') {
      return (
        <>
          <div className="enhancement-failed">
            <p>Enhanced transcript not available. Showing raw transcript instead.</p>
          </div>
          {formatText(rawChapter.content)}
        </>
      );
    }
    
    // Default case: show loading
    return (
      <div className="enhancing-transcript">
        <div className="spinner"></div>
        <p>Loading transcript...</p>
      </div>
    );
  };
  
  // Get the copyable text content for the current chapter
  const getChapterTextContent = () => {
    const status = chapterEnhancementStatus[activeChapter];
    const enhancedChapter = enhancedChapterizedTranscript[activeChapter];
    const rawChapter = rawChapterizedTranscript[activeChapter];
    
    if (!rawChapter) return '';
    
    // Prefer enhanced content if available
    if (enhancedChapter && status === 'completed') {
      return enhancedChapter.content;
    }
    
    // Fallback to raw content
    return rawChapter.content;
  };
  

// Update the handleCopy function in TranscriptViewer component
const handleCopy = () => {
  const textToCopy = getChapterTextContent();
  
  if (!textToCopy) return;
  
  // Track the copy action
  ReactGA.event({
    category: "Engagement",
    action: "Copy Content",
    label: `Transcript: ${rawChapterizedTranscript[activeChapter]?.title || `Chapter ${activeChapter + 1}`}`
  });
  
  navigator.clipboard.writeText(textToCopy).then(
    () => {
      setCopyStatus({
        ...copyStatus,
        [activeChapter]: 'copied'
      });
      
      setTimeout(() => {
        setCopyStatus({
          ...copyStatus,
          [activeChapter]: null
        });
      }, 2000);
    },
    (err) => {
      console.error('Could not copy text: ', err);
      setCopyStatus({
        ...copyStatus,
        [activeChapter]: 'error'
      });
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
              className={`chapter-button ${activeChapter === index ? 'active' : ''}`}
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
          <button 
            className="copy-button"
            onClick={handleCopy}
            disabled={
              chapterEnhancementStatus[activeChapter] === 'enhancing' || 
              !rawChapterizedTranscript[activeChapter]
            }
          >
            {copyStatus[activeChapter] === 'copied' ? (
              <span>Copied! ✓</span>
            ) : (
              <span>Copy Chapter</span>
            )}
          </button>
        </div>
        <div className="transcript-text">
          {getCurrentChapterContent()}
        </div>
      </div>
    </div>
  );
}

export default TranscriptViewer;