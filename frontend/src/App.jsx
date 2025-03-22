import React from 'react';
import './App.css';
import ProfileForm from './components/ProfileForm';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import Hero from './components/Hero';
import OnboardingForm from './components/OnboardingForm';
import CodeEditor from './components/CodeEditor';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* <Route path="/" element={<ProfileForm />} /> */}
          <Route path="/" element={<Hero />} />
          <Route path="/form" element={<OnboardingForm />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/code-editor" element={<CodeEditor />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App; 