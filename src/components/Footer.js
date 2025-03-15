// Updated Footer.js
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {currentYear} YouTube Smart Insights. Built for Learners, Powered by GenAI.</p>
      </div>
    </footer>
  );
};

export default Footer;