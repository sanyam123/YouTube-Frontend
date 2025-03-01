import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import TranscriptViewer from './components/TranscriptViewer';
import AnalysisSection from './components/AnalysisSection';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import VideoInfo from './components/VideoInfo';
import TakeawaysViewer from './components/TakeawaysViewer';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [videoDetails, setVideoDetails] = useState(null);
  const [rawChapterizedTranscript, setRawChapterizedTranscript] = useState([]);
  const [enhancedChapterizedTranscript, setEnhancedChapterizedTranscript] = useState([]);
  const [chapterEnhancementStatus, setChapterEnhancementStatus] = useState({});
  const [chapterAnalyses, setChapterAnalyses] = useState([]);
  const [chapterAnalysisStatus, setChapterAnalysisStatus] = useState({});
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhancingTranscript, setEnhancingTranscript] = useState(false);
  const [generatingAnalyses, setGeneratingAnalyses] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [dataFetched, setDataFetched] = useState(false);
  const [lastAnalyzedChapter, setLastAnalyzedChapter] = useState(-1);
  const [transcriptFromExtension, setTranscriptFromExtension] = useState(null);

  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const BATCH_SIZE = 3;

  // Check for transcript data from Chrome extension on component mount
  useEffect(() => {
    // Check if we have transcript data from the Chrome extension
    const urlParams = new URLSearchParams(window.location.search);
    const transcriptKey = urlParams.get('transcriptKey');
    
    if (transcriptKey) {
      try {
        console.log('Found transcript key:', transcriptKey);
        const storedTranscript = localStorage.getItem(transcriptKey);
        if (storedTranscript) {
          console.log('Successfully retrieved transcript from localStorage');
          const parsedTranscript = JSON.parse(storedTranscript);
          setTranscriptFromExtension(parsedTranscript);
          
          // Set the video URL if provided
          const videoUrl = urlParams.get('videoUrl');
          if (videoUrl) {
            console.log('Found video URL:', videoUrl);
            setVideoUrl(videoUrl);
            
            // Call fetchTranscript directly after a short delay to ensure states are updated
            setTimeout(() => {
              console.log('Auto-fetching transcript with extension data');
              fetchTranscript(videoUrl, parsedTranscript);
            }, 1000);
          }
          
          // Clean up localStorage after retrieving the data
          localStorage.removeItem(transcriptKey);
        } else {
          console.error('Transcript data not found in localStorage with key:', transcriptKey);
        }
      } catch (error) {
        console.error('Error retrieving transcript from localStorage:', error);
      }
    }
  }, []);

  // Function to enhance specific chapters
  const enhanceChapters = async (chaptersToEnhance) => {
    try {
      const updatedStatus = { ...chapterEnhancementStatus };
      chaptersToEnhance.forEach(chapter => {
        updatedStatus[chapter.index] = 'enhancing';
      });
      setChapterEnhancementStatus(updatedStatus);
      
      const response = await fetch(`${backendUrl}/api/enhance-chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chapters: chaptersToEnhance.map(ch => ({
            title: ch.chapter.title,
            content: ch.chapter.content,
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to enhance chapters');
      }
      
      const data = await response.json();
      
      const newEnhancedChapters = [...enhancedChapterizedTranscript];
      
      data.enhancedChapters.forEach((enhancedChapter, idx) => {
        const chapterIndex = chaptersToEnhance[idx].index;
        newEnhancedChapters[chapterIndex] = {
          ...rawChapterizedTranscript[chapterIndex],
          content: enhancedChapter.enhancedContent
        };
        updatedStatus[chapterIndex] = 'completed';
      });
      
      setEnhancedChapterizedTranscript(newEnhancedChapters);
      setChapterEnhancementStatus(updatedStatus);
      
      return true;
    } catch (error) {
      console.error('Error enhancing chapters:', error);
      
      const updatedStatus = { ...chapterEnhancementStatus };
      chaptersToEnhance.forEach(chapter => {
        updatedStatus[chapter.index] = 'failed';
      });
      setChapterEnhancementStatus(updatedStatus);
      
      return false;
    }
  };

  // Function to generate analyses for a batch of chapters
  const generateBatchAnalyses = async (startIndex, endIndex) => {
    try {
      setGeneratingAnalyses(true);
      
      const chaptersToAnalyze = rawChapterizedTranscript.slice(0, endIndex + 1);
      
      console.log(`Processing batch - Start: ${startIndex}, End: ${endIndex}`);
      
      const response = await fetch(`${backendUrl}/api/generate-sequential-analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapters: chaptersToAnalyze,
          startIndex,
          endIndex
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate analyses');
      }
      
      const data = await response.json();
      return data.chapterAnalyses;  // Return the analyses instead of updating state
      
    } catch (error) {
      console.error('Error generating analyses:', error);
      return null;
    }
  };

  // Function to process all chapters in batches
  const processAllChaptersInBatches = async (startFromIndex = 0) => {
    if (processingBatch || !rawChapterizedTranscript.length) return;

    setProcessingBatch(true);
    const allAnalyses = new Array(rawChapterizedTranscript.length).fill(null);
    const updatedStatus = { ...chapterAnalysisStatus };
    
    try {
      for (let i = startFromIndex; i < rawChapterizedTranscript.length; i += BATCH_SIZE) {
        const batchEndIndex = Math.min(i + BATCH_SIZE - 1, rawChapterizedTranscript.length - 1);
        console.log(`Starting batch from ${i} to ${batchEndIndex}`);
        
        // Mark chapters as pending before processing
        for (let j = i; j <= batchEndIndex; j++) {
          updatedStatus[j] = 'pending';
        }
        setChapterAnalysisStatus(updatedStatus);
        
        const batchAnalyses = await generateBatchAnalyses(i, batchEndIndex);
        
        if (batchAnalyses) {
          // Accumulate analyses from this batch
          batchAnalyses.forEach(analysis => {
            if (analysis && typeof analysis.chapterIndex === 'number') {
              allAnalyses[analysis.chapterIndex] = analysis;
              updatedStatus[analysis.chapterIndex] = 'completed';
            }
          });
        }
      }
      
      // After all batches are processed, update state once
      setChapterAnalyses(allAnalyses);
      setChapterAnalysisStatus(updatedStatus);
      setLastAnalyzedChapter(rawChapterizedTranscript.length - 1);
      
    } catch (error) {
      console.error('Error processing batches:', error);
    } finally {
      setProcessingBatch(false);
      setGeneratingAnalyses(false);
    }
  };

  // Effect to handle initial enhancement and start batch processing
  useEffect(() => {
    const processInitialChapters = async () => {
      if (rawChapterizedTranscript.length > 0 && !enhancingTranscript) {
        setEnhancingTranscript(true);
        
        try {
          const chaptersToEnhance = rawChapterizedTranscript
            .slice(0, Math.min(2, rawChapterizedTranscript.length))
            .map((chapter, index) => ({ chapter, index }));
          
          if (chaptersToEnhance.length > 0) {
            await Promise.all([
              enhanceChapters(chaptersToEnhance),
              processAllChaptersInBatches(0)
            ]);
          }
        } catch (error) {
          console.error('Error processing initial chapters:', error);
        } finally {
          setEnhancingTranscript(false);
        }
      }
    };
    
    processInitialChapters();
  }, [rawChapterizedTranscript]);

  // Handle chapter click with transcript enhancement
  const handleChapterClick = async (index) => {
    setActiveChapter(index);
    
    // If this chapter hasn't been enhanced yet and isn't currently being enhanced
    if (
      index >= 0 && 
      index < rawChapterizedTranscript.length && 
      chapterEnhancementStatus[index] !== 'completed' && 
      chapterEnhancementStatus[index] !== 'enhancing'
    ) {
      await enhanceChapters([{ 
        chapter: rawChapterizedTranscript[index], 
        index 
      }]);
    }
  };

  // Helper function for organizing transcript by chapters (for extension support)
  function organizeTranscriptByChapters(transcriptData, chapters) {
    const segments = [];
    
    for (let i = 0; i < chapters.length; i++) {
      const currentChapter = chapters[i];
      const nextChapter = chapters[i + 1];
      
      const startTime = currentChapter.time;
      const endTime = nextChapter ? nextChapter.time : Infinity;
      
      const chapterTranscriptData = transcriptData.filter(item => {
        return item.offset >= startTime && item.offset < endTime;
      });
      
      const chapterContent = chapterTranscriptData
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ');
      
      segments.push({
        title: currentChapter.title,
        time: currentChapter.timeFormatted,
        content: chapterContent || 'No transcript available for this chapter'
      });
    }
    
    return segments;
  }

  // Modified fetchTranscript to support direct params (for extension data)
  const fetchTranscript = async (urlOverride, transcriptOverride) => {
    const urlToUse = urlOverride || videoUrl;
    const transcriptToUse = transcriptOverride || transcriptFromExtension;
    
    if (!urlToUse.trim()) {
      setError('Please enter a YouTube video URL');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setDataFetched(false);
      setVideoDetails(null);
      setTranscript('');
      setRawChapterizedTranscript([]);
      setEnhancedChapterizedTranscript([]);
      setChapterEnhancementStatus({});
      setChapterAnalyses([]);
      setChapterAnalysisStatus({});
      setSummary('');
      setActiveTab(null);
      setActiveChapter(0);
      setEnhancingTranscript(false);
      setGeneratingAnalyses(false);
      setLastAnalyzedChapter(-1);
      
      // Only fetch from API if we don't have transcript from extension
      if (transcriptToUse) {
        console.log('Using transcript data from Chrome extension');
        
        // Still need to fetch video details and chapters from the API
        const detailsResponse = await fetch(`${backendUrl}/api/video-details?url=${encodeURIComponent(urlToUse)}`);
        
        if (!detailsResponse.ok) {
          const data = await detailsResponse.json();
          throw new Error(data.message || 'Failed to fetch video details');
        }
        
        const detailsData = await detailsResponse.json();
        setVideoDetails(detailsData.videoDetails);
        
        // Process chapters and transcript
        const chapters = detailsData.chapters;
        const plainText = transcriptToUse.map(item => item.text).join(' ');
        
        // Organize transcript by chapters
        const organizedTranscript = organizeTranscriptByChapters(transcriptToUse, chapters);
        
        setTranscript(plainText);
        setRawChapterizedTranscript(organizedTranscript);
        setEnhancedChapterizedTranscript(organizedTranscript.map(() => null));
        
        const initialStatus = {};
        organizedTranscript.forEach((_, index) => {
          initialStatus[index] = 'pending';
        });
        setChapterEnhancementStatus(initialStatus);
        
        setDataFetched(true);
        setActiveTab('transcript');
        
      } else {
        // Use the original API fetch logic
        const response = await fetch(`${backendUrl}/api/video-data?url=${encodeURIComponent(urlToUse)}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to fetch video data');
        }
        
        const data = await response.json();
        
        setVideoDetails(data.videoDetails);
        setTranscript(data.transcript);
        setRawChapterizedTranscript(data.organizedTranscript);
        setEnhancedChapterizedTranscript(data.organizedTranscript.map(() => null));
        
        const initialStatus = {};
        data.organizedTranscript.forEach((_, index) => {
          initialStatus[index] = 'pending';
        });
        setChapterEnhancementStatus(initialStatus);
        
        setDataFetched(true);
        setActiveTab('transcript');
      }
      
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the video data');
      setVideoDetails(null);
      setDataFetched(false);
    } finally {
      setLoading(false);
      setTranscriptFromExtension(null); // Clear after using
    }
  };

  return (
    <div className="App">
      <Header />
      
      <main className="container-wide">
        <SearchBar 
          videoUrl={videoUrl} 
          setVideoUrl={setVideoUrl} 
          onSearch={() => fetchTranscript()}
        />
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            {error.includes('chapters') && (
              <p className="error-suggestion">
                Try searching for a video that has chapters in its description. 
                These typically show up as timestamps in the video description.
              </p>
            )}
          </div>
        )}
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {videoDetails && <VideoInfo videoDetails={videoDetails} />}
            
            {dataFetched && (
              <>
                <div className="button-container">
                  <button 
                    onClick={() => setActiveTab('transcript')}
                    className={activeTab === 'transcript' ? 'active' : ''}
                  >
                    Enhanced Transcript
                  </button>
                  <button 
                    onClick={() => setActiveTab('takeaways')}
                    className={activeTab === 'takeaways' ? 'active' : ''}
                  >
                    Smart Insights
                  </button>
                  <button 
                    onClick={() => setActiveTab('analysis')}
                    className={activeTab === 'analysis' ? 'active' : ''}
                    disabled={loading}
                  >
                    Worth Watching?
                  </button>
                </div>
                
                {activeTab && (
                  <div className="content-container">
                    {activeTab === 'transcript' && (
                      <TranscriptViewer 
                        rawChapterizedTranscript={rawChapterizedTranscript}
                        enhancedChapterizedTranscript={enhancedChapterizedTranscript} 
                        chapterEnhancementStatus={chapterEnhancementStatus}
                        activeChapter={activeChapter}
                        onChapterClick={handleChapterClick}
                        videoDetails={videoDetails}
                      />
                    )}
                    
                    {activeTab === 'takeaways' && (
                      <TakeawaysViewer
                        chapterAnalyses={chapterAnalyses}
                        chapterAnalysisStatus={chapterAnalysisStatus}
                        rawChapterizedTranscript={rawChapterizedTranscript}
                        activeChapter={activeChapter}
                        onChapterClick={handleChapterClick}
                        generatingAnalyses={generatingAnalyses}
                      />
                    )}
                    
                    {activeTab === 'analysis' && (
                      <div className="generating-analysis" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <h3 style={{ marginBottom: '16px', color: 'var(--neutral-800)' }}>
                          Coming Soon!
                        </h3>
                        <p style={{ color: 'var(--neutral-700)', maxWidth: '500px', margin: '0 auto' }}>
                          We're working on an exciting new feature that will help you decide if a video is worth your time. 
                          Stay tuned for the update!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;