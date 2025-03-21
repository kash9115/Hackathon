import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chat.css';

const FilesSidebar = ({ isOpen, onToggle }) => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, [isOpen]); // Refresh files when sidebar opens

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/user-files', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  return (
    <div className={`files-sidebar ${isOpen ? 'open' : ''}`}>
      <button className="toggle-sidebar" onClick={onToggle}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isOpen ? (
            <path d="M15 18l-6-6 6-6" />
          ) : (
            <path d="M9 18l6-6-6-6" />
          )}
        </svg>
      </button>
      
      <div className="sidebar-content">
        <div className="sidebar-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z"/>
            <path d="M3 7h18"/>
            <path d="M7 3v4"/>
          </svg>
          <h2>Sources</h2>
        </div>

        <div className="files-list">
          {files.length === 0 ? (
            <div className="no-files">
              <p>No files uploaded yet</p>
            </div>
          ) : (
            files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div className="file-details">
                  <span className="file-name" title={file.originalName}>
                    {file.originalName}
                  </span>
                  <span className="file-date">
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FileUploadModal = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setUploadProgress(new Array(selectedFiles.length).fill(0));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.length) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files[]', file);
    });

    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFiles([]);
        setUploadProgress([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onClose();
      } else {
        const error = await response.json();
        console.error('Upload failed:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => !isUploading && e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Upload Files</h2>
          {!isUploading && (
            <button className="modal-close" onClick={onClose}>×</button>
          )}
        </div>
        <form onSubmit={handleUpload}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="file-input"
            multiple
            accept="*/*"
          />
          {files.length > 0 && (
            <div className="selected-files">
              <h3>Selected Files:</h3>
              {files.map((file, index) => (
                <div key={index} className="selected-file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}
          <div className="modal-buttons">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="upload-button"
              disabled={!files.length || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatHistoryRef = useRef(null);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/check-session', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          console.log("data", data)
          setUserName(data.name || 'User');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    
    // Show loading state
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log("data", data)
        setMessages(prev => [...prev, { type: 'bot', content: data.message }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="chat-container">
      <FilesSidebar 
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
      />
      
      <div className={`chat-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="chat-header">
          <div className="app-logo1">
            <div className="logo">
              <span className="logo-icon">L</span>
              LearnSmart AI
            </div>
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <div className="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="chat-history" ref={chatHistoryRef}>
          <div className="chat-welcome">
            <h1>Welcome to AI Learning Companion</h1>
            <p>Ask me anything about your learning journey!</p>
          </div>
          {console.log(messages)}
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.type}`}>
              <div className="message-content">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="chat-message bot">
              <div className="message-content loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="chat-input-container">
          <button 
            type="button" 
            className="upload-button" 
            onClick={handleFileSelect}
            title="Upload file"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 15V3M12 3L7 8M12 3L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 12V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="chat-input"
          />
          
          <button type="submit" className="send-button" disabled={!inputMessage.trim()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>

        <FileUploadModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </div>
  );
};

export default Chat;