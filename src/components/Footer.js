import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <p>YouTube Transcript Tool &copy; {new Date().getFullYear()}</p>
      <p>Powered by OpenAI</p>
    </footer>
  );
}

export default Footer;