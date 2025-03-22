import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CodeEditor.css';

const CodeEditor = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'java', label: 'Java' }
  ];

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleRun = () => {
    // Dummy function for run button
    console.log('Run clicked');
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            LearnSmart AI
          </Link>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/code-editor" className="active">Code Editor</Link>
          </nav>
        </div>
      </header>

      <div className="code-editor-container">
        <div className="editor-header">
          <select 
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="language-selector"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <button onClick={handleRun} className="run-button">
            Run
          </button>
        </div>
        <div className="editor-main">
          <div className="code-section">
            <div className="section-header">Code</div>
            <textarea
              value={code}
              onChange={handleCodeChange}
              placeholder="Write your code here..."
              className="code-input"
              spellCheck="false"
            />
          </div>
          <div className="output-section">
            <div className="section-header">Output</div>
            <div className="output-display">
              <pre className="output-text">
                Output will be displayed here...
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor; 