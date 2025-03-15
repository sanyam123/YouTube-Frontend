// Updated Header Component for React
import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="main-title">
          <span className="title-free">YouTube Smart Insights, </span>{' '}
          <span className="title-gradient">Powered by GenAI</span>{' '}
          {/* <span className="title-generator">Generator</span> */}
        </h1>
        <h2 className="subtitle">Get the best insights from any YouTube video, instantly!</h2>
      </div>
    </header>
  );
};

export default Header;