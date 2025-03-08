import React, { useEffect, useState } from 'react';

function LoadingSpinner() {
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  const loadingTexts = [
    {
      main: "Analyzing Video Content",
      sub: "Extracting valuable insights from your video..."
    },
    {
      main: "Processing Transcript",
      sub: "Turning spoken words into structured content..."
    },
    {
      main: "Generating Smart Insights",
      sub: "Finding the key takeaways just for you..."
    },
    {
      main: "Enhancing Readability",
      sub: "Making the content easier to understand..."
    },
    {
      main: "Almost Ready",
      sub: "Putting everything together for you..."
    }
  ];

  // Cycle through loading messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTextIndex((prevIndex) => 
        prevIndex === loadingTexts.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <div className="spinner-text">
        {loadingTexts[loadingTextIndex].main}
      </div>
      <div className="spinner-subtext">
        {loadingTexts[loadingTextIndex].sub}
      </div>
    </div>
  );
}

export default LoadingSpinner;