import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingForm.css';

const OnboardingForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profession: '',
    designation: '',
    otherDesignation: ''
  });

  const professionOptions = ['Employee', 'Student', 'Researcher', 'Entrepreneur'];
  const designationOptions = {
    Employee: [
      'Data Scientist',
      'Software Engineer',
      'Product Manager',
      'Business Analyst',
      'DevOps Engineer',
      'UI/UX Designer',
      'Project Manager'
    ],
    Student: [
      'High School Student',
      'Undergraduate Student',
      'Post Graduate Student',
      'PhD Student',
      'Research Scholar'
    ],
    Researcher: [
      'Research Associate',
      'Research Scientist',
      'Principal Investigator',
      'Post-doctoral Researcher'
    ],
    Entrepreneur: [
      'Founder',
      'Co-founder',
      'CEO',
      'CTO',
      'Product Owner'
    ]
  };

  const totalSteps = 4;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfessionSelect = (profession) => {
    if (profession === formData.profession) {
      setFormData({
        ...formData,
        profession: '',
        designation: '',
        otherDesignation: ''
      });
    } else {
      setFormData({
        ...formData,
        profession,
        designation: '',
        otherDesignation: ''
      });
    }
  };

  const handleDesignationSelect = (designation) => {
    setFormData({
      ...formData,
      designation: designation === formData.designation ? '' : designation,
      otherDesignation: ''
    });
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    
    if (step === 2) {
      // Check if email exists before proceeding
      try {
        const response = await fetch('/api/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
          credentials: 'include'
        });

        const data = await response.json();
        
        if (data.exists) {
          // If user exists, create a session and navigate to chat
          const loginResponse = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              email: formData.email,
              password: '' // Empty password for now
            }),
            credentials: 'include'
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            sessionStorage.setItem('userName', loginData.name);
            sessionStorage.setItem('userEmail', loginData.email);
            navigate('/chat');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking email:', error);
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalFormData = {
      ...formData,
      designation: formData.otherDesignation || formData.designation
    };

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Verify session was created
        const sessionCheck = await fetch('/api/check-session', {
          credentials: 'include'
        });
        
        if (sessionCheck.ok) {
          sessionStorage.setItem('userName', data.name);
          sessionStorage.setItem('userEmail', data.email);
          navigate('/chat');
        } else {
          // Try logging in explicitly if session check fails
          const loginResponse = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              email: finalFormData.email,
              password: '' // Empty password for now
            }),
            credentials: 'include'
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            sessionStorage.setItem('userName', loginData.name);
            sessionStorage.setItem('userEmail', loginData.email);
            navigate('/chat');
          } else {
            console.error('Failed to create session');
          }
        }
      } else {
        const error = await response.json();
        console.error('Error:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="form-step">
            <div className="form-header">
              <h2>What is your name?</h2>
              <p>This is how you'll show up in the app</p>
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <div className="form-header">
              <h2>What's your email?</h2>
              <p>We'll use this to save your progress</p>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
            />
          </div>
        );
      case 3:
        return (
          <div className="form-step">
            <div className="form-header">
              <h2>What's your profession?</h2>
              <p>Help us tailor content to your needs</p>
            </div>
            <div className="options-grid">
              {professionOptions.map((profession) => (
                <div
                  key={profession}
                  className={`option-box ${formData.profession === profession ? 'selected' : ''}`}
                  onClick={() => handleProfessionSelect(profession)}
                >
                  {profession}
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-step">
            <div className="form-header">
              <h2>What's your designation?</h2>
              <p>This helps us customize your learning path</p>
            </div>
            <div className="options-grid">
              {(formData.profession && designationOptions[formData.profession] || []).map((designation) => (
                <div
                  key={designation}
                  className={`option-box ${formData.designation === designation ? 'selected' : ''}`}
                  onClick={() => handleDesignationSelect(designation)}
                >
                  {designation}
                </div>
              ))}
              <input
                type="text"
                className="option-box option-input"
                name="otherDesignation"
                value={formData.otherDesignation}
                onChange={(e) => {
                  handleInputChange(e);
                  setFormData(prev => ({ ...prev, designation: '' }));
                }}
                placeholder="Other"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPreview = () => {
    return (
      <div className="preview-section">
        <div className="preview-content">
          <div className="preview-header">
            <div className="preview-icon"></div>
            <span>{formData.name || "Your Name"}'s Profile</span>
          </div>
          <div className="preview-main">
            <div className="preview-lines">
              {formData.name && (
                <div className="preview-line">
                  <span className="preview-label">Name:</span>
                  <span className="preview-value">{formData.name}</span>
                </div>
              )}
              {formData.email && (
                <div className="preview-line">
                  <span className="preview-label">Email:</span>
                  <span className="preview-value">{formData.email}</span>
                </div>
              )}
              {formData.profession && (
                <div className="preview-line">
                  <span className="preview-label">Profession:</span>
                  <span className="preview-value">{formData.profession}</span>
                </div>
              )}
              {(formData.designation || formData.otherDesignation) && (
                <div className="preview-line">
                  <span className="preview-label">Designation:</span>
                  <span className="preview-value">{formData.otherDesignation || formData.designation}</span>
                </div>
              )}
            </div>
            <div className="preview-cursor"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="onboarding-container">
      <div className="form-section">
        <div className="app-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#1A1A1A"/>
            <path d="M16 8L24 12V20L16 24L8 20V12L16 8Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        
        <form onSubmit={handleContinue} className="onboarding-form">
          {renderStepContent()}
          <div className="form-footer">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="form-buttons">
              {step > 1 && (
                <button type="button" className="back-button" onClick={handleBack}>
                  Back
                </button>
              )}
              <button type="submit" className="continue-button">
                {step === totalSteps ? 'Start Learning' : 'Continue'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {renderPreview()}
    </div>
  );
};

export default OnboardingForm; 