import React from 'react';

function HowItWorks() {
  return (
    <div className="how-it-works-container">
      <h2 className="how-it-works-heading">How it Works</h2>
      <div className="steps-container">
        <div className="step-item">
          <div className="step-icon">1</div>
          <h3>Copy the YouTube URL</h3>
          <p>Copy the URL from the address bar of your web browser</p>
        </div>
        
        <div className="step-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="step-item">
          <div className="step-icon">2</div>
          <h3>Paste the URL above</h3>
          <p>Paste URL in the box and hit <strong>"Search Video"</strong></p>
        </div>
        
        <div className="step-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="step-item">
          <div className="step-icon">3</div>
          <h3>Get Smart Insights</h3>
          <p>Instantly access transcript, summaries & key takeaways</p>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;