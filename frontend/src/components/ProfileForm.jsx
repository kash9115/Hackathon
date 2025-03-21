import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileForm.css';

const ProfileForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profession: '',
    designation: '',
    document: null,
  });

  const [designations, setDesignations] = useState([]);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

  const professions = ['Employee', 'Student'];

  useEffect(() => {
    if (formData.profession) {
      fetch(`/api/designations/${formData.profession}`)
        .then((res) => res.json())
        .then((data) => setDesignations(data))
        .catch((error) => console.error('Error fetching designations:', error));
    }
  }, [formData.profession]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      document: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        formDataToSend.append(key, value);
      }
    });

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          message: 'Profile created successfully!',
          type: 'success',
        });
        // Navigate to chat page after successful submission
        navigate('/chat');
      } else {
        setSubmitStatus({
          message: data.error || 'Failed to create profile',
          type: 'error',
        });
      }
    } catch (error) {
      setSubmitStatus({
        message: 'An error occurred while submitting the form',
        type: 'error',
      });
    }
  };

  return (
    <div className="profile-form-container">
      <h2>Profile Form</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="profession">Profession:</label>
          <select
            id="profession"
            name="profession"
            value={formData.profession}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Profession</option>
            {professions.map((prof) => (
              <option key={prof} value={prof}>
                {prof}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="designation">Designation:</label>
          <select
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            required
            disabled={!formData.profession}
          >
            <option value="">Select Designation</option>
            {designations.map((desig) => (
              <option key={desig} value={desig}>
                {desig}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="document">Upload Document (PDF):</label>
          <input
            type="file"
            id="document"
            name="document"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
        </div>

        <button type="submit">Submit</button>

        {submitStatus.message && (
          <div className={`status-message ${submitStatus.type}`}>
            {submitStatus.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileForm; 