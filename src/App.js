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
import axios from 'axios'; // Make sure axios is installed: npm install axios

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
  const [worthWatching, setWorthWatching] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhancingTranscript, setEnhancingTranscript] = useState(false);
  const [generatingAnalyses, setGeneratingAnalyses] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [dataFetched, setDataFetched] = useState(false);
  const [lastAnalyzedChapter, setLastAnalyzedChapter] = useState(-1);

  const backendUrl = process.env.REACT_APP_API_URL;
  console.log('Using backend URL:', backendUrl);
  
  const BATCH_SIZE = 3;

  // Test backend connection on component mount
  useEffect(() => {
    testBackendConnection();
  }, []);

  // Function to test backend connection
  const testBackendConnection = async () => {
    try {
      setConnectionStatus('Testing connection to backend...');
      
      // Test root endpoint
      const rootResponse = await fetch(`${backendUrl}`, { 
        method: 'GET',
      });
      console.log('Root endpoint status:', rootResponse.status);
      
      if (!rootResponse.ok) {
        const errorText = await rootResponse.text();
        console.error('Root endpoint error:', errorText);
        setConnectionStatus(`Connection error: ${rootResponse.status} - ${errorText}`);
        return false;
      }
      
      // Test CORS-specific endpoint
      const corsResponse = await fetch(`${backendUrl}/api/cors-test`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('CORS test status:', corsResponse.status);
      
      if (!corsResponse.ok) {
        const errorText = await corsResponse.text();
        console.error('CORS test error:', errorText);
        setConnectionStatus(`CORS test failed: ${corsResponse.status} - ${errorText}`);
        return false;
      }
      
      const corsData = await corsResponse.json();
      console.log('CORS test response:', corsData);
      
      setConnectionStatus('Connection to backend successful');
      return true;
    } catch (error) {
      console.error('Backend connection error:', error);
      setConnectionStatus(`Failed to connect to backend: ${error.message}`);
      return false;
    }
  };

  // Function to enhance specific chapters
  const enhanceChapters = async (chaptersToEnhance) => {
    try {
      const updatedStatus = { ...chapterEnhancementStatus };
      chaptersToEnhance.forEach(chapter => {
        updatedStatus[chapter.index] = 'enhancing';
      });
      setChapterEnhancementStatus(updatedStatus);
      
      console.log('Enhancing chapters - Request payload:', { 
        chapters: chaptersToEnhance.map(ch => ({
          title: ch.chapter.title,
          content: ch.chapter.content,
        }))
      });
      
      const response = await axios.post(`${backendUrl}/api/enhance-chapters`, { 
        chapters: chaptersToEnhance.map(ch => ({
          title: ch.chapter.title,
          content: ch.chapter.content,
        }))
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Enhance chapters response:', response.data);
      
      const data = response.data;
      
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
      console.error('Error enhancing chapters - Full error:', error);
      console.error('Error response:', error.response);
      
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
      
      const response = await axios.post(`${backendUrl}/api/generate-sequential-analyses`, {
        chapters: chaptersToAnalyze,
        startIndex,
        endIndex
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Batch analysis response:', response.data);
      return response.data.chapterAnalyses;  // Return the analyses instead of updating state
      
    } catch (error) {
      console.error('Error generating analyses - Full error:', error);
      console.error('Error response:', error.response);
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

  const fetchTranscript = async () => {
    if (!videoUrl.trim()) {
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
      setWorthWatching('');
      setActiveTab(null);
      setActiveChapter(0);
      setEnhancingTranscript(false);
      setGeneratingAnalyses(false);
      setLastAnalyzedChapter(-1);
      
      console.log('Fetching transcript for URL:', videoUrl);
      console.log('Using backend URL:', `${backendUrl}/api/video-data`);
      
      try {
        // Try using Axios first
        const response = await axios.get(`${backendUrl}/api/video-data`, {
          params: { url: videoUrl },
          timeout: 60000, // 60 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('Fetch transcript response status:', response.status);
        console.log('Fetch transcript response data:', response.data);
        
        const data = response.data;
        
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
      } catch (axiosError) {
        console.error('Axios request failed - Falling back to fetch', axiosError);
        
        // Fallback to fetch if axios fails
        const fetchResponse = await fetch(`${backendUrl}/api/video-data?url=${encodeURIComponent(videoUrl)}`);
        console.log('Fetch API response status:', fetchResponse.status);
        
        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          console.error('Fetch API error text:', errorText);
          throw new Error(errorText || 'Failed to fetch video data');
        }
        
        const data = await fetchResponse.json();
        console.log('Fetch API response data:', data);
        
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
      }
    } catch (err) {
      console.error('Error fetching transcript - Full error:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        setError(err.response.data?.message || 'An error occurred while fetching the video data');
      } else if (err.request) {
        console.error('Error request (no response received):', err.request);
        setError('No response received from server. Please check your connection.');
      } else {
        console.error('Error message:', err.message);
        setError(err.message || 'An error occurred while fetching the video data');
      }
      setVideoDetails(null);
      setDataFetched(false);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWorthWatching = async () => {
    if (!transcript) {
      setError('Please fetch a transcript first');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${backendUrl}/api/analyze`, 
        { transcript },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000 // 60 second timeout
        }
      );
      
      console.log('Analyze response:', response.data);
      
      setWorthWatching(response.data.analysis);
      setActiveTab('analysis');
      
    } catch (err) {
      console.error('Error analyzing - Full error:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        setError(err.response.data?.message || 'An error occurred while analyzing the video');
      } else {
        setError(err.message || 'An error occurred while analyzing the video');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Header />
      
      <main className="container-wide">
        {connectionStatus && (
          <div className={`connection-status ${connectionStatus.includes('error') || connectionStatus.includes('failed') ? 'error' : 'success'}`}>
            {connectionStatus}
          </div>
        )}
        
        <SearchBar 
          videoUrl={videoUrl} 
          setVideoUrl={setVideoUrl} 
          onSearch={fetchTranscript} 
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