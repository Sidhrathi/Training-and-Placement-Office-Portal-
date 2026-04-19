import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeaderWithNav from './HeaderWithNav';
import Footer from './footer';
import OTPVerification from './OTPVerification';
import '../styles/StudentRegistration.css';
import api from '../services/api';

const StudentRegistration = () => {  const navigate = useNavigate();  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    usn: '',
    branch: '',
    department: '',
    percentage10: '',
    percentage12: '',
    percentageDegree: '',
    percentageMasters: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    currentSemester: '',
    currentSemesterCGPA: '',
    resume: null
  });

  const validateForm = () => {
    const requiredFields = [
      'name', 'email', 'phone', 'usn', 'branch', 'department',
      'percentage10', 'percentage12', 'percentageDegree', 'currentSemester',
      'currentSemesterCGPA', 'password', 'confirmPassword'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    const percentageFields = ['percentage10', 'percentage12', 'percentageDegree'];
    for (const field of percentageFields) {
      const value = parseFloat(formData[field]);
      if (isNaN(value) || value < 0 || value > 100) {
        setError(`${field} must be between 0 and 100`);
        return false;
      }
    }

    const cgpa = parseFloat(formData.currentSemesterCGPA);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      setError("CGPA must be between 0 and 10");
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    setError(''); // Clear any existing errors when user makes changes
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error
    setError('');

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      e.target.value = '';
      return;
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload only PDF or Word documents');
      e.target.value = '';
      return;
    }

    setFormData(prev => ({
      ...prev,
      resume: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');    try {
      const formDataToSend = new FormData();
      
      // Append all fields except resume and confirmPassword
      Object.keys(formData).forEach(key => {
        if (key === 'resume') {
          if (formData[key]) {
            formDataToSend.append('resume', formData[key]);
          }
        } else if (key !== 'confirmPassword') {
          formDataToSend.append(key, formData[key]);
        }
      });      const response = await api.post('/students/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Store student ID and email for OTP verification
        setStudentId(response.data.data.id);
        setStudentEmail(formData.email);
        setShowOTPVerification(true);
      } else {
        throw new Error('Registration failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPChange = (e) => {
    setOtp(e.target.value);
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/students/verify-email', {
        studentId,
        otp
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/student-dashboard');
      } else {
        throw new Error('Verification failed: No token received');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!studentId) {
      setError('Unable to resend OTP. Please try registering again.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/students/resend-otp', { studentId });
      
      if (response.data.success) {
        setRegistrationSuccess('OTP has been resent to your email');
      } else {
        throw new Error('Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToRegistration = () => {
    setShowOTPVerification(false);
  };
  // If OTP verification is active, show the OTP component
  if (showOTPVerification) {
    return (
      <OTPVerification 
        studentId={studentId}
        studentEmail={studentEmail}
        onBackToRegistration={handleBackToRegistration}
      />
    );
  }

  return (
    <div className="container">
      <HeaderWithNav />
      <main className="registration-main">
        <h2>Student Registration</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="usn">USN</label>
              <input
                type="text"
                id="usn"
                value={formData.usn}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <input
                type="text"
                id="branch"
                value={formData.branch}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="percentage10">10th Percentage</label>
              <input
                type="number"
                id="percentage10"
                value={formData.percentage10}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="percentage12">12th Percentage</label>
              <input
                type="number"
                id="percentage12"
                value={formData.percentage12}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="percentageDegree">Degree Percentage</label>
              <input
                type="number"
                id="percentageDegree"
                value={formData.percentageDegree}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="percentageMasters">Masters Percentage (if applicable)</label>
              <input
                type="number"
                id="percentageMasters"
                value={formData.percentageMasters}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentSemester">Current Semester</label>
              <input
                type="number"
                id="currentSemester"
                value={formData.currentSemester}
                onChange={handleChange}
                min="1"
                max="8"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentSemesterCGPA">Current Semester CGPA</label>
              <input
                type="number"
                id="currentSemesterCGPA"
                value={formData.currentSemesterCGPA}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="resume">Resume</label>
              <input
                type="file"
                id="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required
              />
              <small>Accepted formats: PDF, DOC, DOCX (Max 5MB)</small>
            </div>
          </div>          <div className="form-footer">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
            <Link to="/student-login" className="login-link">
              Already registered? Login
            </Link>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default StudentRegistration;