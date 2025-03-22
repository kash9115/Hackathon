import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/form');
  };

  const trustedCompanies = [
    { name: 'Microsoft', color: '#ffffff40' },
    { name: 'Google', color: '#ffffff40' },
    { name: 'Amazon', color: '#ffffff40' },
    { name: 'Meta', color: '#ffffff40' },
    { name: 'IBM', color: '#ffffff40' },
  ];

  const chatMessages = [
    { text: "Hi! I'm your AI learning companion. What would you like to learn?", position: 'right-top' },
    { text: "I need to learn SQL for my Data Science role", position: 'left-middle' },
    { text: "Great! I see you're a visual learner. Let's start with SQL basics using diagrams!", position: 'right-bottom' },
  ];

  const features = [
    { text: "Personalized Learning Paths", icon: "🎯", description: "Our AI analyzes your profile, documents, and learning style to create custom learning paths" },
    { text: "Multi-Agent Intelligence", icon: "🤖", description: "7 specialized AI agents work together to deliver the perfect learning experience" },
    { text: "Real-time Progress Tracking", icon: "📈", description: "Advanced BKT modeling to track your learning progress and adapt content" }
  ];

  return (
    <div className="hero-container">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">N</span>
          NexLearnix AI
        </div>
        <div className="nav-links">
          <a href="#home" className="active">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <button className="get-started-btn" onClick={handleGetStarted}>
            Start Learning →
          </button>
        </div>
      </nav>

      <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
        <div className="hero-text">
          <div className="subtitle">AI-Powered Learning Companion</div>
          <h1 className="hero-title">
            Master Any Skill
            <div className="highlight">With Your Personal AI Tutor</div>
          </h1>
          <p className="hero-subtitle">
            Experience adaptive learning powered by 7 specialized AI agents that understand 
            your learning style, track your progress, and create personalized content. 
            From SQL to Python, master any skill with a companion that evolves with you.
          </p>
          <div className="hero-cta">
            <button className="primary-button" onClick={handleGetStarted}>
              Create Your Learning Path →
            </button>
            <span className="no-credit">No credit card required</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="chat-bubbles">
            {chatMessages.map((message, index) => (
              <div key={index} className={`chat-bubble ${message.position}`}>
                <div className="chat-content">
                  <div className="user-avatar"></div>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="floating-elements">
            <div className="brain-icon">🧠</div>
            <div className="chart-icon">📊</div>
            <div className="book-icon">📚</div>
          </div>
        </div>
      </div>

      <div className="trusted-section">
        <h3>Powered by cutting-edge AI from <span className="highlight">industry leaders</span></h3>
        <div className="company-logos">
          {trustedCompanies.map((company, index) => (
            <div key={index} className="company-logo" style={{ color: company.color }}>
              {company.name}
            </div>
          ))}
        </div>
      </div>

      <section className="about-section">
        <div className="about-content">
          <div className="about-image">
            <div className="image-container">
              <div className="ai-agents-visual">
                <div className="agent-node behavioral">Behavioral Agent</div>
                <div className="agent-node content">Content Agent</div>
                <div className="agent-node curriculum">Curriculum Agent</div>
                <div className="agent-node tutor">Tutor Agent</div>
                <div className="agent-node feedback">Feedback Agent</div>
                <div className="agent-connector"></div>
              </div>
              <div className="glassmorphic-overlay"></div>
            </div>
          </div>
          <div className="about-text">
            <div className="subtitle">How It Works</div>
            <h2>Multi-Agent AI System for Personalized Learning</h2>
            <p>Our advanced AI system combines behavioral analysis, content curation, 
               and real-time feedback to create a truly personalized learning experience. 
               Using technologies like CrewAI, Vector Databases, and Knowledge Graphs, 
               we ensure you learn effectively and efficiently.</p>
            <div className="feature-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-icon">{feature.icon}</span>
                  <div className="feature-text">
                    <h3>{feature.text}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section">
        <h2 className="section-title">Your Learning Journey</h2>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-icon">📋</div>
            <h3>Profile Creation</h3>
            <p>Share your goals and upload your resume to help us understand your needs</p>
          </div>
          <div className="workflow-step">
            <div className="step-icon">🎯</div>
            <h3>Learning Style Analysis</h3>
            <p>Our AI identifies your learning style and current skill levels</p>
          </div>
          <div className="workflow-step">
            <div className="step-icon">🗺️</div>
            <h3>Custom Curriculum</h3>
            <p>Get a personalized learning path with adaptive content</p>
          </div>
          <div className="workflow-step">
            <div className="step-icon">🚀</div>
            <h3>Interactive Learning</h3>
            <p>Learn through conversations, quizzes, and real-time feedback</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Transform Your Learning Experience?</h2>
        <p>Join thousands of learners who are mastering new skills with AI guidance</p>
        <button className="primary-button" onClick={handleGetStarted}>
          Start Your Learning Journey
        </button>
      </section>
    </div>
  );
};

export default Hero; 