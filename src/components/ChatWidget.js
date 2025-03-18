import React, { useEffect, useState, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './ChatWidget.css';

const ChatWidget = ({ videoId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);
  const chatButtonRef = useRef(null);

  // Handle click outside to close chat window
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && 
          chatWindowRef.current && 
          !chatWindowRef.current.contains(event.target) &&
          chatButtonRef.current && 
          !chatButtonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const initialMessage = videoId 
      ? "Hi! I'm your AI video assistant. Ask me anything about this video!"
      : "Please search for a YouTube video first to activate the AI assistant.";
    
    setMessages([{ text: initialMessage, sender: 'bot' }]);
  }, [videoId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim() || !videoId) return;
    
    // Add user message
    const userMessage = { text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    if (!videoId) {
      setMessages(prev => [...prev, { 
        text: "Please search for a video first to use the assistant.", 
        sender: 'bot' 
      }]);
      return;
    }
    
    // Add loading message
    const loadingId = Date.now();
    setMessages(prev => [...prev, { id: loadingId, text: "...", sender: 'bot', loading: true }]);
    
    try {
      // Send to n8n webhook
      const response = await fetch('https://anjalie-ssinghal.app.n8n.cloud/webhook/f845e801-39f8-4d4f-b550-275fdef5ce75/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: videoId,
          chatInput: inputText,
          // Add session ID for conversation tracking
          // session_id: sessionId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Response from webhook:", data); // Add this to debug
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
      // Add bot response - handle different possible response formats
      setMessages(prev => [...prev, { 
        text: data.response || data.output || data.answer || 
              (typeof data === 'string' ? data : "I couldn't process your question."), 
        sender: 'bot' 
      }]);
    } catch (error) {
      console.error('Error:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
      // Add error message
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting. Please try again later.", 
        sender: 'bot' 
      }]);
    }
  };

  return (
    <div className="chat-widget-container">
      {/* Chat button - always visible */}
      <button 
        ref={chatButtonRef}
        className={`chat-button ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <FaTimes size={24} />
        ) : (
          <FaRobot size={24} />
        )}
      </button>
      
      {/* Chat window */}
      {isOpen && (
        <div className="chat-window" ref={chatWindowRef}>
          <div className="chat-header">
            <h3>AI Video Assistant</h3>
          </div>
          
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-bubble">
                  {message.loading ? (
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={videoId ? "Type your question..." : "Search for a video first..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!videoId}
            />
            <button type="submit" disabled={!videoId || !inputText.trim()}>
              <FaPaperPlane size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;